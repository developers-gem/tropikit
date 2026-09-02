// frontend/src/pages/EmergencyPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Siren,
  Phone,
  Copy,
  AlertTriangle,
  Building2,
  Stethoscope,
  ShieldAlert,
  Flame,
  ShieldCheck,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  fetchGlobalEmergencyContacts,
  fetchDestinations,
  fetchDestinationBySlug,
} from "@/api/destinationApi";
import { fetchTrips } from "@/api/tripApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { EmergencyContact, Destination } from "@/types/api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const [copied, setCopied] = useState(false);
  const isPhoneNumber = /^[+\d][\d\s\-().]*$/.test(contact.number.trim());

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contact.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-accent" /> {contact.label}
          </CardTitle>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
            {contact.category.replace("-", " ")}
          </span>
        </div>
        {contact.note && <CardDescription>{contact.note}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          {isPhoneNumber ? (
            <a
              href={`tel:${contact.number.replace(/\s+/g, "")}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors break-all"
            >
              {contact.number}
            </a>
          ) : (
            <p className="text-lg font-semibold text-foreground break-all">{contact.number}</p>
          )}
          <button
            onClick={handleCopy}
            aria-label={`Copy ${contact.label} number`}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground flex items-center gap-1 text-xs transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-success font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground border-t border-border pt-2 flex items-center justify-between flex-wrap gap-1">
          {contact.lastVerifiedAt ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified {fmtDate(contact.lastVerifiedAt)}
            </span>
          ) : (
            <span className="text-warning-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Not yet independently verified
            </span>
          )}
          {contact.source && (
            <a
              href={contact.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline hover:no-underline text-primary"
            >
              Source <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategorySection({
  icon,
  title,
  description,
  contacts,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  contacts: EmergencyContact[];
}) {
  if (contacts.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {contacts.map((c, idx) => (
          <ContactCard key={`${c.label}-${idx}`} contact={c} />
        ))}
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get("destination") || "";

  // 1. Fetch user's trips to auto-detect current destination
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  const now = new Date().setHours(0, 0, 0, 0);
  const activeTrip = trips.find((t) => new Date(t.returnDate).getTime() >= now);
  const activeTripSlug =
    activeTrip && typeof activeTrip.destinationId === "object"
      ? (activeTrip.destinationId as unknown as Destination)?.slug
      : null;

  // 2. Fetch destination list for the switcher dropdown
  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations"],
    queryFn: () => fetchDestinations(),
  });

  // Effective destination slug selection (supports "global" view)
  const currentSlug = selectedSlug || activeTripSlug || "global";

  // 3. Fetch global emergency contacts
  const {
    data: globalData = [],
    isLoading: loadingGlobal,
    isError: errorGlobal,
    refetch: refetchGlobal,
  } = useQuery({
    queryKey: ["global-emergency"],
    queryFn: fetchGlobalEmergencyContacts,
  });

  // 4. Fetch destination-specific contacts using fetchDestinationBySlug
  const {
    data: destinationData,
    isLoading: loadingDest,
    isError: errorDest,
    refetch: refetchDest,
  } = useQuery({
    queryKey: ["destination", currentSlug],
    queryFn: () => fetchDestinationBySlug(currentSlug),
    enabled: currentSlug !== "global",
  });

  if (loadingGlobal || (currentSlug !== "global" && loadingDest)) {
    return <LoadingState label="Loading emergency contacts..." />;
  }

  if (errorGlobal || (currentSlug !== "global" && errorDest)) {
    return (
      <ErrorState
        message="Couldn't load emergency contacts."
        onRetry={() => {
          refetchGlobal();
          if (currentSlug !== "global") refetchDest();
        }}
      />
    );
  }

  // Choose contacts based on destination or fallback to global contacts
  const activeContacts: EmergencyContact[] =
    currentSlug !== "global" && destinationData?.emergencyContacts?.length
      ? destinationData.emergencyContacts
      : globalData;

  const localServices = activeContacts.filter((c) =>
    ["police", "ambulance", "fire"].includes(c.category)
  );

  const travelSupport = activeContacts.filter((c) =>
    ["embassy", "insurance", "assistance-provider"].includes(c.category)
  );

  const healthResources = activeContacts.filter((c) =>
    ["health-authority", "travel-health-source"].includes(c.category)
  );

  const other = activeContacts.filter(
    (c) =>
      ![
        "police",
        "ambulance",
        "fire",
        "embassy",
        "insurance",
        "assistance-provider",
        "health-authority",
        "travel-health-source",
      ].includes(c.category)
  );

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
        <div>
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Step 03</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground flex items-center gap-2">
            <Siren className="h-7 w-7 text-destructive" /> Emergency & Travel Support
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Verified responders, embassy networks, and international assistance helplines. Save
            these before departure.
          </p>
        </div>

        <div className="w-full md:w-64">
          <label htmlFor="emergency-dest-select" className="text-xs font-semibold text-muted-foreground block mb-1">
            Destination View
          </label>
          <select
            id="emergency-dest-select"
            value={currentSlug}
            onChange={(e) => setSearchParams({ destination: e.target.value })}
            className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="global">Global Travel Helplines</option>
            {destinations.map((d: Destination) => (
              <option key={d.slug} value={d.slug}>
                {d.name} ({d.region})
              </option>
            ))}
          </select>
        </div>
      </div>

      {localServices.length > 0 && (
        <CategorySection
          icon={<Flame className="h-5 w-5 text-destructive" />}
          title="Local Emergency Services"
          description={`Direct emergency lines in ${destinationData?.name || "your selected country"}.`}
          contacts={localServices}
        />
      )}

      <CategorySection
        icon={<Building2 className="h-5 w-5 text-primary" />}
        title="Travel Support"
        description="Embassy, consular assistance, insurance, and medical evacuation providers."
        contacts={travelSupport}
      />

      <CategorySection
        icon={<Stethoscope className="h-5 w-5 text-accent" />}
        title="Health Resources"
        description="Public health authorities, advisory desks, and travel-health clinics."
        contacts={healthResources}
      />

      {other.length > 0 && (
        <CategorySection
          icon={<ShieldAlert className="h-5 w-5 text-muted-foreground" />}
          title="Other Contacts"
          description="Additional localized support numbers and helplines."
          contacts={other}
        />
      )}

      <div className="mt-8 rounded-xl border border-warning/40 bg-warning/10 p-5 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-warning-foreground leading-relaxed">
          This directory provides emergency contact information sourced from official public
          registries. Emergency numbers may require local network access or roaming. Always consult
          a travel health clinician before departure and confirm embassy details for your passport
          jurisdiction.
        </p>
      </div>
    </section>
  );
}