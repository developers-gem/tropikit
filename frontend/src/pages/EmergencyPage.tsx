// frontend/src/pages/EmergencyPage.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
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
  Sparkles,
  Globe2,
  Ambulance,
  Shield,
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

  const isLocalService = ["police", "ambulance", "fire"].includes(contact.category.toLowerCase());

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-soft hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>{contact.label}</span>
            </CardTitle>
            {contact.note && (
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {contact.note}
              </CardDescription>
            )}
          </div>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
              isLocalService
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {contact.category.replace(/-/g, " ")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
          {isPhoneNumber ? (
            <a
              href={`tel:${contact.number.replace(/\s+/g, "")}`}
              className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors break-all"
            >
              {contact.number}
            </a>
          ) : (
            <p className="text-lg font-bold tracking-tight text-foreground break-all">
              {contact.number}
            </p>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${contact.label} number`}
            className="p-2 rounded-lg bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2 pt-1">
          {contact.lastVerifiedAt ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified {fmtDate(contact.lastVerifiedAt)}
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Pending verification
            </span>
          )}

          {contact.source && (
            <a
              href={contact.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Registry Source <ExternalLink className="h-3 w-3" />
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
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">{icon}</div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
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
        message="Couldn't load emergency contacts. Please check your connection."
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
    ["police", "ambulance", "fire"].includes(c.category.toLowerCase())
  );

  const travelSupport = activeContacts.filter((c) =>
    ["embassy", "insurance", "assistance-provider"].includes(c.category.toLowerCase())
  );

  const healthResources = activeContacts.filter((c) =>
    ["health-authority", "travel-health-source"].includes(c.category.toLowerCase())
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
      ].includes(c.category.toLowerCase())
  );

  const selectedDestinationName =
    currentSlug !== "global" && destinationData?.name
      ? destinationData.name
      : "Global Traveler Hub";

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. Hero Intelligence Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-destructive/10 via-card to-background border border-border p-8 md:p-12 shadow-soft">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
            <Sparkles className="h-3.5 w-3.5" />
            Step 04 • Emergency Readiness & Contacts
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Emergency & <span className="text-destructive">Travel Support</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Verified local responders, consular embassy networks, medical evacuation, and
            international travel helplines. Save or dial directly from your mobile device.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Siren className="h-4 w-4 text-destructive" />
              <span>
                Active View: <strong className="text-foreground">{selectedDestinationName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                <strong className="text-foreground">{activeContacts.length}</strong> Hotlines Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Destination Selector Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center gap-3">
          <Globe2 className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Select Destination Context</h3>
            <p className="text-xs text-muted-foreground">
              Switch jurisdiction to load country-specific police, ambulance, and embassy lines.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <select
            id="emergency-dest-select"
            value={currentSlug}
            onChange={(e) => setSearchParams({ destination: e.target.value })}
            className="w-full text-xs sm:text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground focus:outline-hidden focus:border-primary shadow-xs cursor-pointer"
          >
            <option value="global">Global Travel Helplines</option>
            {destinations.map((d: Destination) => (
              <option key={d.slug} value={d.slug}>
                {d.name} {d.region ? `(${d.region})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Emergency Fast-Dial Overview (When local services exist) */}
      {localServices.length > 0 && (
        <div className="p-6 rounded-3xl border border-destructive/20 bg-destructive/5 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-destructive" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Immediate Responders in {selectedDestinationName}
              </h2>
              <p className="text-xs text-muted-foreground">
                Direct dispatch numbers for urgent life-safety situations.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localServices.map((c, idx) => (
              <ContactCard key={`local-${c.label}-${idx}`} contact={c} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Travel Support & Consular Assistance */}
      <CategorySection
        icon={<Building2 className="h-5 w-5 text-primary" />}
        title="Consular & Travel Support"
        description="Embassy helplines, consular assistance, insurance desks, and medical repatriation."
        contacts={travelSupport}
      />

      {/* 5. Health Desks & Clinical Resources */}
      <CategorySection
        icon={<Stethoscope className="h-5 w-5 text-emerald-600" />}
        title="Clinical & Health Resources"
        description="National public health desks, accredited travel clinics, and regional disease control centers."
        contacts={healthResources}
      />

      {/* 6. Other Support Lines */}
      {other.length > 0 && (
        <CategorySection
          icon={<Shield className="h-5 w-5 text-muted-foreground" />}
          title="Additional Helplines"
          description="Local tourist police desks, maritime rescue, and auxiliary emergency lines."
          contacts={other}
        />
      )}

      {/* 7. Clinical & Legal Advisory Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex gap-3 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          <strong>Important Traveler Notice:</strong> Emergency numbers are catalogued from official
          government registries and international health agencies. Short-code dispatch numbers (like
          911, 112, or 999) typically require local SIM connectivity or active cellular roaming. Always
          confirm local consulate phone numbers matching your citizenship before embarking on international
          travel.
        </p>
      </div>
    </section>
  );
}