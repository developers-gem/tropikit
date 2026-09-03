// frontend/src/pages/DashboardPage.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Compass,
  Sparkles,
  CalendarDays,
  ListChecks,
  Siren,
  Plane,
} from "lucide-react";
import { fetchTrips } from "@/api/tripApi";
import { fetchDestinations } from "@/api/destinationApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import type { Destination, Trip } from "@/types/api";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const {
    data: trips = [],
    isLoading: tripsLoading,
    isError: tripsError,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  // Wrapped in arrow function to avoid TanStack Query passing context into DestinationFilters
  const {
    data: destinations = [],
    isLoading: destsLoading,
  } = useQuery<Destination[]>({
    queryKey: ["destinations"],
    queryFn: () => fetchDestinations(),
  });

  // Map destinations by ID/slug for instant lookup
  const destMap = useMemo(() => {
    const map = new Map<string, Destination>();
    for (const d of destinations) {
      if (d._id) map.set(String(d._id), d);
      if ((d as any).id) map.set(String((d as any).id), d);
      if (d.slug) map.set(d.slug, d);
      if ((d as any).code) map.set((d as any).code, d);
    }
    return map;
  }, [destinations]);

  // Destination resolver
  const resolveDestination = (trip: Trip | any): { name: string; region: string } => {
    if (trip?.destination && typeof trip.destination === "object") {
      return {
        name: trip.destination.name || trip.destination.country || "Destination",
        region: trip.destination.region || "Global Travel",
      };
    }
    if (trip?.destinationId && typeof trip.destinationId === "object") {
      return {
        name: trip.destinationId.name || trip.destinationId.country || "Destination",
        region: trip.destinationId.region || "Global Travel",
      };
    }
    if (trip?.destinationName) {
      return {
        name: trip.destinationName,
        region: trip.destinationRegion || "Global Travel",
      };
    }
    const destIdStr = String(trip?.destinationId || trip?.destination || "");
    if (destIdStr && destMap.has(destIdStr)) {
      const matched = destMap.get(destIdStr)!;
      return {
        name: matched.name || (matched as any).country || "Destination",
        region: matched.region || "Global Travel",
      };
    }
    return { name: "Destination", region: "Global Travel" };
  };

  if (tripsLoading || destsLoading) {
    return <LoadingState label="Loading your traveler dashboard..." />;
  }

  if (tripsError) {
    return <ErrorState message="Could not load your dashboard." onRetry={() => refetchTrips()} />;
  }

  const now = new Date().setHours(0, 0, 0, 0);
  const upcomingTrips = trips.filter((t) => new Date(t.returnDate).getTime() >= now);
  const nextTrip = upcomingTrips[0] ?? null;
  const nextTripDest = nextTrip ? resolveDestination(nextTrip) : null;
  const daysUntilNext = nextTrip ? getDaysUntil(nextTrip.departureDate) : null;

  return (
    <div className="w-full space-y-4 p-0 m-0">
      {/* 1. Hero Intelligence Banner */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Traveler Intelligence Command
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Traveler <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Overview of your active travel preparation, immunization readiness, antimalarial schedules, and upcoming departures.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <span className="font-semibold text-foreground">
                {upcomingTrips.length} Active {upcomingTrips.length === 1 ? "Journey" : "Journeys"}
              </span>
              <span className="text-border">•</span>
              <span>{trips.length} Total Saved</span>
            </div>
          </div>

          <Link
            to="/trip/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs self-start sm:self-center cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Plan New Trip
          </Link>
        </div>
      </div>

      {/* 2. Featured Next Trip Card */}
      {nextTrip && nextTripDest ? (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                Next Upcoming Journey
              </span>
            </div>
            <span className="text-xs font-semibold text-primary flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {daysUntilNext !== null && daysUntilNext > 0
                ? `${daysUntilNext} days until departure`
                : daysUntilNext === 0
                ? "Departing today!"
                : "Trip in progress"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>{nextTripDest.region}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight mt-0.5">
                  {nextTripDest.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(nextTrip.departureDate)} — {formatDate(nextTrip.returnDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                to={`/checklist?trip=${nextTrip._id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all shadow-xs cursor-pointer"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Checklist
              </Link>
              <Link
                to={`/trip/${nextTrip._id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
              >
                Open Hub
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Readiness Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Vaccines:</span>
              <span className="font-semibold capitalize text-foreground flex items-center gap-1 text-[11px]">
                {nextTrip.vaccineStatus === "reviewed" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
                {nextTrip.vaccineStatus ? String(nextTrip.vaccineStatus).replace(/-/g, " ") : "Not Reviewed"}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Malaria Plan:</span>
              <span className="font-semibold capitalize text-foreground flex items-center gap-1 text-[11px]">
                {nextTrip.malariaPlanStatus === "confirmed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
                {nextTrip.malariaPlanStatus ? String(nextTrip.malariaPlanStatus).replace(/-/g, " ") : "Not Planned"}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Emergency Numbers:</span>
              <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                <Siren
                  className={`h-3.5 w-3.5 ${
                    nextTrip.emergencyAcknowledged ? "text-emerald-600" : "text-amber-500"
                  }`}
                />
                {nextTrip.emergencyAcknowledged ? "Acknowledged" : "Action Needed"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. All Trips Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> All Planned Journeys ({trips.length})
          </h2>
          <Link to="/account/trips" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View Itinerary History <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-2">
            <div className="p-2.5 rounded-full bg-muted/60 text-muted-foreground inline-block">
              <Plane className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No trips found in your account</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Plan your first trip to generate custom health checklists, malaria schedules, and destination emergency files.
            </p>
            <Link
              to="/trip/create"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:underline pt-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Plan a trip now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trips.map((trip) => {
              const { name: destName, region: destRegion } = resolveDestination(trip);
              const daysUntil = getDaysUntil(trip.departureDate);

              return (
                <div
                  key={trip._id}
                  className="rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{destName}</h3>
                        <p className="text-[11px] text-muted-foreground">{destRegion}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      {daysUntil > 0
                        ? `${daysUntil}d left`
                        : daysUntil === 0
                        ? "Today"
                        : "Past"}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">
                      {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                    </span>
                    <Link
                      to={`/trip/${trip._id}`}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Open Hub <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}