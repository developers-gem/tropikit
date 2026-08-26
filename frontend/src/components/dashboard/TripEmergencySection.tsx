import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Phone, Copy, Check, Siren, Building2, Stethoscope, ShieldAlert } from "lucide-react";
import { fetchGlobalEmergencyContacts } from "@/api/destinationApi";
import type { EmergencyContact } from "@/types/api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ContactRow({ contact }: { contact: EmergencyContact }) {
  const [copied, setCopied] = useState(false);
  const isPhoneNumber = /^[+\d][\d\s]*$/.test(contact.number.trim());

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(contact.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the number is still visible
      // on-screen for manual copy, so this fails silently rather than showing an error.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted-foreground truncate">{contact.label}</div>
        <div className="font-semibold text-foreground truncate">{contact.number}</div>
        {/* Per project policy, only display verified information — and be honest when it
            hasn't been verified, rather than implying confidence that doesn't exist. */}
        <div className="text-[11px] text-muted-foreground mt-0.5">
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
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isPhoneNumber && (
          <a
            href={`tel:${contact.number.replace(/\s+/g, "")}`}
            aria-label={`Call ${contact.label}`}
            className="p-2 rounded-md hover:bg-muted text-accent"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={handleCopy}
          aria-label={`Copy ${contact.label} number`}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function CategoryGroup({
  icon,
  title,
  contacts,
  emptyMessage,
}: {
  icon: React.ReactNode;
  title: string;
  contacts: EmergencyContact[];
  emptyMessage: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {contacts.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-3">{emptyMessage}</p>
      ) : (
        <div className="space-y-2 mb-3">
          {contacts.map((c) => (
            <ContactRow key={c.label} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TripEmergencySection({
  localContacts,
  destinationSlug,
  acknowledged,
  onAcknowledge,
}: {
  localContacts: EmergencyContact[];
  destinationSlug: string;
  acknowledged: boolean;
  onAcknowledge: () => void;
}) {
  const { data: globalContacts } = useQuery({
    queryKey: ["global-emergency"],
    queryFn: fetchGlobalEmergencyContacts,
  });

  const local = localContacts.filter((c) => ["police", "ambulance", "fire"].includes(c.category));
  const otherLocal = localContacts.filter((c) => !["police", "ambulance", "fire"].includes(c.category));
  const global = globalContacts ?? [];
  const travelSupport = global.filter((c) => ["embassy", "insurance", "assistance-provider"].includes(c.category));
  const healthResources = global.filter((c) => ["health-authority", "travel-health-source"].includes(c.category));

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-foreground">Emergency preparation</h3>
        </div>
        <Link to={`/destinations/${destinationSlug}?tab=emergency`} className="text-xs font-medium text-primary hover:underline">
          View full details
        </Link>
      </div>

      <div className="space-y-5">
        <CategoryGroup
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
          title="Local Emergency"
          contacts={[...local, ...otherLocal]}
          emptyMessage="No verified local emergency numbers on file for this destination yet."
        />
        <CategoryGroup
          icon={<Building2 className="h-4 w-4 text-primary" />}
          title="Travel Support"
          contacts={travelSupport}
          emptyMessage="No travel-support contacts available."
        />
        <CategoryGroup
          icon={<Stethoscope className="h-4 w-4 text-accent" />}
          title="Health Resources"
          contacts={healthResources}
          emptyMessage="No health-resource contacts available."
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-2">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={onAcknowledge}
          className="w-auto"
        />
        I've reviewed emergency contacts and know who to call
      </label>
    </div>
  );
}
