// frontend/src/pages/DestinationsPage.tsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Search,
  ShieldAlert,
  ArrowRight,
  Syringe,
  Sparkles,
  SlidersHorizontal,
  X,
  Compass,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchDestinations } from "@/api/destinationApi";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Input } from "@/components/ui/input";

const RISK_OPTIONS = [
  { value: "", label: "All Risk Levels" },
  { value: "high", label: "High Risk" },
  { value: "moderate", label: "Moderate Risk" },
  { value: "low", label: "Low Risk" },
  { value: "none", label: "Minimal / No Risk" },
];

const ITEMS_PER_PAGE = 12;

// Helper to extract clean string risk level from either object or string
function getMalariaRiskLevel(malariaRisk: any): string {
  if (!malariaRisk) return "low";
  if (typeof malariaRisk === "string") return malariaRisk;
  if (typeof malariaRisk === "object" && malariaRisk.level) {
    return String(malariaRisk.level);
  }
  return "low";
}

export default function DestinationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [malariaRisk, setMalariaRisk] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["destinations", search, region, malariaRisk],
    queryFn: () => fetchDestinations({ search, region, malariaRisk }),
  });

  // Extract distinct regions safely
  const regions = useMemo(() => {
    const list = Array.from(
      new Set((data ?? []).map((d: any) => d.region).filter(Boolean))
    ).sort();
    return list;
  }, [data]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, region, malariaRisk]);

  // Calculate pagination slices
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const paginatedDestinations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  const hasActiveFilters = Boolean(search || region || malariaRisk);

  const handleClearFilters = () => {
    setSearch("");
    setRegion("");
    setMalariaRisk("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers with ellipsis
  const getVisiblePageNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Hero Intelligence Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-8 md:p-12 shadow-soft">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Step 01 • Destination Directory
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Choose Your <span className="text-primary">Destination</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Search or filter across global destinations to inspect required vaccines, malaria
            chemoprophylaxis recommendations, emergency readiness lines, and firsthand traveler stories.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <span>
                <strong className="text-foreground">{totalItems}</strong> Destinations Profiled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Source-Verified Health Directives</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations..."
              className="pl-10 pr-4 py-2.5 rounded-xl border-border bg-card text-sm text-foreground focus-visible:ring-primary/20 shadow-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Region Select */}
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-xl border border-border bg-card px-3.5 text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-primary cursor-pointer shadow-xs"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Risk Selector */}
            <select
              className="h-10 rounded-xl border border-border bg-card px-3.5 text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-primary cursor-pointer shadow-xs"
              value={malariaRisk}
              onChange={(e) => setMalariaRisk(e.target.value)}
            >
              {RISK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-10 px-3 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Region Quick-Filter Pills */}
        {regions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal className="h-3 w-3" /> Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => setRegion("")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                region === ""
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              All
            </button>
            {regions.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRegion(region === r ? "" : r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  region === r
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Content States */}
      {isLoading && <LoadingState label="Loading global destinations..." />}

      {isError && (
        <ErrorState
          message="Couldn't load destinations. Please verify your connection."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && totalItems === 0 && (
        <EmptyState message="No destinations match your search or filter criteria." />
      )}

      {/* 4. Destination Card Grid & Pagination */}
      {!isLoading && !isError && totalItems > 0 && (
        <div className="space-y-6">
          {/* Active Range Counter */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing{" "}
              <strong className="text-foreground font-semibold">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
              </strong>{" "}
              of <strong className="text-foreground font-semibold">{totalItems}</strong> destinations
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedDestinations.map((d: any) => {
              const vaccineCount = Array.isArray(d.vaccineRequirements)
                ? d.vaccineRequirements.length
                : 0;
              const rawRisk = getMalariaRiskLevel(d.malariaRisk);
              const isHighRisk = rawRisk.toLowerCase().includes("high");

              return (
                <button
                  type="button"
                  key={d._id}
                  onClick={() => navigate(`/destinations/${d.slug}`)}
                  className="group relative rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer"
                  style={{ boxShadow: "var(--shadow-soft)" }}
                >
                  {/* Header: Travel Icon Badge & Code */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        <Compass className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {d.code || "GUIDE"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {d.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                      <span className="truncate">{d.region || "Global Travel"}</span>
                    </div>
                  </div>

                  {/* Footer: Clinical Indicators & Explore CTA */}
                  <div className="pt-4 mt-4 border-t border-border/60 space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {/* Vaccines Pill */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground font-medium">
                        <Syringe className="h-3 w-3 text-emerald-600 shrink-0" />
                        {vaccineCount > 0 ? `${vaccineCount} Vaccines` : "Routine"}
                      </span>

                      {/* Malaria Risk Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                          isHighRisk
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        <span className="capitalize">{rawRisk} Risk</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-primary pt-0.5">
                      <span>View Protocol</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 5. Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {getVisiblePageNumbers().map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-xs text-muted-foreground select-none"
                      >
                        …
                      </span>
                    );
                  }

                  const pageNum = Number(p);
                  const isCurrent = pageNum === currentPage;

                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 w-8 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-xs font-bold"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}