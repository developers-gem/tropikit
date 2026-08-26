import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search } from "lucide-react";
import { fetchDestinations } from "@/api/destinationApi";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Input } from "@/components/ui/input";

const RISK_OPTIONS = [
  { value: "", label: "Any risk" },
  { value: "high", label: "High" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

export default function DestinationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [malariaRisk, setMalariaRisk] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["destinations", search, region, malariaRisk],
    queryFn: () => fetchDestinations({ search, region, malariaRisk }),
  });

  const regions = Array.from(new Set((data ?? []).map((d) => d.region))).sort();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">Step 01</p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-7 w-7 text-primary" /> Choose your destination
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Search or filter, then pick a destination for vaccines, malaria risk, local advice and
          emergency numbers.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={malariaRisk}
          onChange={(e) => setMalariaRisk(e.target.value)}
        >
          {RISK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingState label="Loading destinations..." />}
      {isError && <ErrorState message="Couldn't load destinations." onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState message="No destinations match your filters." />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.map((d) => (
            <button
              key={d._id}
              onClick={() => navigate(`/destinations/${d.slug}`)}
              className="group text-left rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="text-sm font-semibold text-foreground">{d.name}</div>
              <div className="text-xs mt-1 text-muted-foreground">{d.region}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
