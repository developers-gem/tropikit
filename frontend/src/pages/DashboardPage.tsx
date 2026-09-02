// frontend/src/pages/DashboardPage.tsx
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
} from "lucide-react";
import { fetchTrips } from "@/api/tripApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import type { Destination } from "@/types/api";

function formatDate(iso: string) {
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
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  if (isLoading) {
    return <LoadingState label="Loading your travel dashboard..." />;
  }

  if (isError) {
    return <ErrorState message="Could not load your dashboard." onRetry={() => refetch()} />;
  }

  const now = new Date().setHours(0, 0, 0, 0);
  const upcomingTrips = trips.filter((t) => new Date(t.returnDate).getTime() >= now);
  const nextTrip = upcomingTrips[0] ?? null;

  const nextTripDest =
    nextTrip && typeof nextTrip.destinationId === "object"
      ? (nextTrip.destinationId as unknown as Destination)
      : null;

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Traveler Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your active travel preparation, health milestones, and planned trips.
          </p>
        </div>
        <Link
          to="/trip/create"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Plan New Trip
        </Link>
      </div>

      {/* Hero: Active/Next Trip Card */}
      {nextTrip ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Next Upcoming Journey
            </span>
            <span className="text-xs text-muted-foreground">
              {getDaysUntil(nextTrip.departureDate) > 0
                ? `${getDaysUntil(nextTrip.departureDate)} days until departure`
                : "Departing soon"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{nextTripDest?.region || "Destination"}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mt-1">
                {nextTripDest?.name || "Upcoming Trip"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatDate(nextTrip.departureDate)} — {formatDate(nextTrip.returnDate)}
                </span>
              </div>
            </div>

            <Link
              to={`/trip/${nextTrip._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors self-start md:self-auto"
            >
              Open Trip Hub
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Readiness Breakdown */}
          <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Vaccines:</span>
              <span className="font-semibold capitalize text-foreground flex items-center gap-1">
                {nextTrip.vaccineStatus === "reviewed" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
                {nextTrip.vaccineStatus.replace("-", " ")}
              </span>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Malaria Plan:</span>
              <span className="font-semibold capitalize text-foreground flex items-center gap-1">
                {nextTrip.malariaPlanStatus === "confirmed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
                {nextTrip.malariaPlanStatus.replace("-", " ")}
              </span>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Emergency Info:</span>
              <span className="font-semibold text-foreground">
                {nextTrip.emergencyAcknowledged ? "Acknowledged" : "Review Needed"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Trips Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">All Trips ({trips.length})</h2>
          <Link to="/account/trips" className="text-xs font-semibold text-primary hover:underline">
            View All Trips
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-3">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">No trips found in your account.</p>
            <Link
              to="/trip/create"
              className="inline-block text-xs font-medium text-primary hover:underline"
            >
              Create a trip to get started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trips.map((trip) => {
              const dest =
                typeof trip.destinationId === "object"
                  ? (trip.destinationId as unknown as Destination)
                  : null;
              const destName = dest?.name || "Destination";

              return (
                <div
                  key={trip._id}
                  className="rounded-lg border border-border bg-card p-4 shadow-soft hover:border-primary/40 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{destName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                    </p>
                  </div>
                  <Link
                    to={`/trip/${trip._id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}