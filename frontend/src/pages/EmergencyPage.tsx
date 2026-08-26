import { useQuery } from "@tanstack/react-query";
import { Siren, Phone, Copy, AlertTriangle, Building2, Stethoscope, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { fetchGlobalEmergencyContacts } from "@/api/destinationApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { EmergencyContact } from "@/types/api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const [copied, setCopied] = useState(false);
  const isPhoneNumber = /^[+\d][\d\s]*$/.test(contact.number.trim());

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contact.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — the number stays visible on-screen for manual copy.
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="h-4 w-4 text-accent" /> {contact.label}
        </CardTitle>
        {contact.note && <CardDescription>{contact.note}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {isPhoneNumber ? (
            <a
              href={`tel:${contact.number.replace(/\s+/g, "")}`}
              className="text-lg font-semibold text-foreground hover:text-primary break-all"
            >
              {contact.number}
            </a>
          ) : (
            <p className="text-lg font-semibold text-foreground break-all">{contact.number}</p>
          )}
          <button
            onClick={handleCopy}
            aria-label={`Copy ${contact.label} number`}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground flex-shrink-0"
          >
            <Copy className="h-4 w-4" />
          </button>
          {copied && <span className="text-xs text-success">Copied</span>}
        </div>
        {/* Per project policy: only display verified information, and say plainly when
            something hasn't been through a verification pass rather than implying it has. */}
        <div className="text-[11px] text-muted-foreground mt-2">
          {contact.lastVerifiedAt ? (
            <>Last verified {fmtDate(contact.lastVerifiedAt)}</>
          ) : (
            <span className="text-warning-foreground">Not yet independently verified</span>
          )}
          {contact.source && (
            <>
              {" · "}
              <a href={contact.source} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                Source
              </a>
            </>
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
        {contacts.map((c) => (
          <ContactCard key={c.label} contact={c} />
        ))}
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["global-emergency"],
    queryFn: fetchGlobalEmergencyContacts,
  });

  if (isLoading) return <LoadingState label="Loading emergency contacts..." />;
  if (isError || !data)
    return <ErrorState message="Couldn't load emergency contacts." onRetry={() => refetch()} />;

  const travelSupport = data.filter((c) => ["embassy", "insurance", "assistance-provider"].includes(c.category));
  const healthResources = data.filter((c) => ["health-authority", "travel-health-source"].includes(c.category));
  const other = data.filter((c) => !["embassy", "insurance", "assistance-provider", "health-authority", "travel-health-source"].includes(c.category));

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">Step 03</p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground flex items-center gap-2">
          <Siren className="h-7 w-7 text-destructive" /> Global emergency contacts
        </h1>
        <p className="mt-2 text-muted-foreground">
          Save these before you fly. Local police, ambulance, and fire numbers appear on each
          destination's own Emergency tab.
        </p>
      </div>

      <CategorySection
        icon={<Building2 className="h-5 w-5 text-primary" />}
        title="Travel Support"
        description="Embassy, insurance, and assistance-provider contacts."
        contacts={travelSupport}
      />
      <CategorySection
        icon={<Stethoscope className="h-5 w-5 text-accent" />}
        title="Health Resources"
        description="Health authorities and general travel-health sources."
        contacts={healthResources}
      />
      {other.length > 0 && (
        <CategorySection
          icon={<ShieldAlert className="h-5 w-5 text-muted-foreground" />}
          title="Other"
          description="Additional contacts."
          contacts={other}
        />
      )}

      <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-5 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-warning-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-warning-foreground">
          This tool provides general guidance only and is not a substitute for professional
          medical advice. Always consult a travel health clinician before departure.
        </p>
      </div>
    </section>
  );
}
