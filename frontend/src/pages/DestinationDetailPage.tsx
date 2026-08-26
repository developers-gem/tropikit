import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Syringe, Bug, Phone, AlertTriangle, Headphones, FileText, Sparkles, MapPin } from "lucide-react";
import { fetchDestinationBySlug, fetchMalariaInfo } from "@/api/destinationApi";
import { fetchDestinationStories } from "@/api/storyApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Citations } from "@/components/Citations";
import { MalariaScheduler } from "@/components/MalariaScheduler";

const riskStyles: Record<string, { label: string; className: string }> = {
  high: { label: "High malaria risk", className: "bg-destructive text-destructive-foreground" },
  moderate: { label: "Moderate malaria risk", className: "bg-warning text-warning-foreground" },
  low: { label: "Low malaria risk", className: "bg-secondary text-secondary-foreground" },
  none: { label: "No malaria risk", className: "bg-success text-success-foreground" },
};

const VACCINE_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  required: { label: "Required", className: "bg-destructive text-destructive-foreground" },
  recommended: { label: "Recommended", className: "bg-primary text-primary-foreground" },
  conditional: { label: "Conditional", className: "bg-warning text-warning-foreground" },
  consider: { label: "Consider", className: "bg-secondary text-secondary-foreground" },
  "not-routinely-recommended": {
    label: "Not routinely recommended",
    className: "bg-muted text-muted-foreground",
  },
  "not-classified": { label: "Check with a clinician", className: "bg-muted text-muted-foreground" },
};

export default function DestinationDetailPage() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "advice";

  const {
    data: destination,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["destination", slug],
    queryFn: () => fetchDestinationBySlug(slug),
  });

  const { data: malariaInfo } = useQuery({
    queryKey: ["destination-malaria", slug],
    queryFn: () => fetchMalariaInfo(slug),
    enabled: !!destination && destination.malariaRisk.level !== "none",
  });

  const { data: stories } = useQuery({
    queryKey: ["destination-stories", slug],
    queryFn: () => fetchDestinationStories(slug),
    enabled: !!destination,
  });

  if (isLoading) return <LoadingState label="Loading destination..." />;
  if (isError || !destination)
    return <ErrorState message="Couldn't load this destination." onRetry={() => refetch()} />;

  const risk = riskStyles[destination.malariaRisk.level];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-xl overflow-hidden border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
        <div className="px-6 py-8 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{destination.name}</h1>
              <p className="text-white/80 text-sm mt-1">{destination.region}</p>
            </div>
            <Badge className={risk.className}>{risk.label}</Badge>
          </div>
        </div>

        <Tabs defaultValue={initialTab} className="p-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="advice">Advice</TabsTrigger>
            <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
            <TabsTrigger value="malaria">Malaria</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="advice" className="mt-6">
            <ul className="space-y-3">
              {destination.advice.map((tip) => (
                <li key={tip} className="flex gap-3 items-start">
                  <div className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                  <p className="text-foreground">{tip}</p>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="vaccines" className="mt-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {destination.vaccines.map((v) => {
                const badge = VACCINE_STATUS_BADGES[v.status];
                return (
                  <div key={v.name} className="flex items-start gap-3 rounded-lg border border-border p-4 bg-muted/40">
                    <Syringe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{v.name}</span>
                        <Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                        {v.regionSpecific && v.region && (
                          <Badge className="text-[10px] bg-secondary text-secondary-foreground">
                            {v.region}
                          </Badge>
                        )}
                      </div>
                      {v.note && <p className="text-sm text-muted-foreground mt-1">{v.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Confirm with a travel clinic 6-8 weeks before departure. Some vaccines need multiple
              doses.
            </p>
            <Citations items={destination.sources.filter((s) => s.contentType !== "malaria")} />
          </TabsContent>

          <TabsContent value="malaria" className="mt-6">
            {destination.malariaRisk.level === "none" ? (
              <p className="text-muted-foreground">
                No malaria risk is recorded for {destination.name}. Standard mosquito-bite
                precautions are still worthwhile for other mosquito-borne illnesses — see the
                Advice tab.
              </p>
            ) : destination.malaria ? (
              <>
                {destination.malariaRisk.hasSubnationalVariation === true && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 mb-4 text-sm flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-warning-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        Risk varies within {destination.name}
                        {destination.malariaRisk.namedRegions.length > 0 && (
                          <>
                            {" "}
                            — concentrated in{" "}
                            {destination.malariaRisk.namedRegions.join(", ")}
                          </>
                        )}
                      </p>
                      {destination.malariaRisk.regionalSourceText && (
                        <p className="text-muted-foreground">{destination.malariaRisk.regionalSourceText}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        The {risk.label.toLowerCase()} badge above reflects the country's overall
                        classification; your actual risk depends on exactly where within the
                        country you're going, which is a conversation worth having with a
                        travel-health clinician.
                      </p>
                    </div>
                  </div>
                )}
                {destination.malariaRisk.hasSubnationalVariation === null && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4 text-sm text-muted-foreground">
                    Whether risk varies by region within {destination.name} isn't specified in
                    the current source data — ask a travel-health clinician about your specific
                    itinerary.
                  </div>
                )}
                <div className="rounded-lg border border-border p-6 bg-muted/40">
                  <div className="flex items-center gap-3 mb-4">
                    <Bug className="h-6 w-6 text-accent" />
                    <h4 className="font-semibold text-foreground">Malaria prevention — the ABCDs</h4>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <strong className="text-primary">A</strong> — Awareness:{" "}
                      {destination.malaria.abcd.awareness}
                    </li>
                    <li>
                      <strong className="text-primary">B</strong> — Bite prevention:{" "}
                      {destination.malaria.abcd.bitePrevention}
                    </li>
                    <li>
                      <strong className="text-primary">C</strong> — Chemoprophylaxis:{" "}
                      {destination.malaria.abcd.chemoprophylaxis}
                    </li>
                    <li>
                      <strong className="text-primary">D</strong> — Diagnosis:{" "}
                      {destination.malaria.abcd.diagnosis}
                    </li>
                  </ul>
                </div>
                {malariaInfo?.drugRegimens && (
                  <MalariaScheduler destination={destination} drugRegimens={malariaInfo.drugRegimens} />
                )}
                <Citations items={destination.sources} />
              </>
            ) : (
              <LoadingState label="Loading malaria guidance..." />
            )}
          </TabsContent>

          <TabsContent value="emergency" className="mt-6">
            {destination.emergencyContacts.length === 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 text-warning-foreground flex-shrink-0 mt-0.5" />
                <p>
                  No verified emergency numbers are on file for {destination.name} yet. Use the
                  global emergency contacts below, or your travel insurer's assistance line.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {destination.emergencyContacts.map((e) => (
                  <a
                    key={e.label}
                    href={`tel:${e.number.replace(/\s+/g, "")}`}
                    className="flex items-center gap-4 rounded-lg border border-border p-4 hover:border-accent transition-colors"
                  >
                    <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{e.label}</div>
                      <div className="font-semibold text-foreground">{e.number}</div>
                      {/* Matches the same honesty already shown on the Trip Dashboard's
                          emergency section for this exact data — previously this tab silently
                          omitted it, which meant a visitor who never created a trip never saw
                          the disclosure at all. */}
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {e.lastVerifiedAt ? (
                          <>Last verified {new Date(e.lastVerifiedAt).toLocaleDateString()}</>
                        ) : (
                          <span className="text-warning-foreground">Not yet independently verified</span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Looking for embassy, insurance, or health-authority contacts?{" "}
              <Link to="/emergency" className="text-primary hover:underline">
                See Travel Support &amp; Health Resources
              </Link>
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Your Tropikit Story — never fabricated: shows the destination's actual published
          story if one exists, or an honest "coming soon" placeholder if it doesn't. */}
      <div className="mt-6 rounded-xl border border-border p-6 bg-card" style={{ boxShadow: "var(--shadow-soft)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Your Tropikit Story</h2>
        </div>

        {!stories ? (
          <LoadingState label="Loading story..." />
        ) : stories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Story coming soon for {destination.name}. We're covering destinations one at a
              time so every story is grounded in reviewed content — nothing here is generated
              on the fly.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/40 p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-medium text-foreground flex items-center gap-2">
                <Headphones className="h-4 w-4 text-accent" />
                {stories[0].title}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stories[0].description}</p>
              {stories[0].audio.durationSeconds && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(stories[0].audio.durationSeconds / 60)} min
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                to={`/stories/${stories[0]._id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90"
              >
                <Headphones className="h-3.5 w-3.5" /> Listen
              </Link>
              <Link
                to={`/stories/${stories[0]._id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                <FileText className="h-3.5 w-3.5" /> Read transcript
              </Link>
            </div>
          </div>
        )}

        {stories && stories.length > 1 && (
          <p className="mt-3 text-xs text-muted-foreground">
            <Link to={`/stories?destination=${slug}`} className="text-primary hover:underline">
              See all {stories.length} stories for {destination.name}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
