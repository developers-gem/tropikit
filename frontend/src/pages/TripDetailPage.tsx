// frontend/src/pages/TripsPage.tsx
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { fetchTrips, deleteTrip } from "@/api/tripApi";
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

export default function TripsPage() {
  const queryClient = useQueryClient();

  const {
    data: trips = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  const handleDelete = (tripId: string, destName: string) => {
    if (!confirm(`Delete trip to ${destName}? This action cannot be undone.`)) return;
    deleteMutation.mutate(tripId);
  };

  if (isLoading) {
    return <LoadingState label="Loading your trips..." />;
  }

  if (isError) {
    return <ErrorState message="Could not load trips." onRetry={() => refetch()} />;
  }

  const now = new Date().setHours(0, 0, 0, 0);

  // Group trips into Upcoming and Past
  const upcomingTrips = trips.filter((t) => new Date(t.returnDate).getTime() >= now);
  const pastTrips = trips.filter((t) => new Date(t.returnDate).getTime() < now);

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Trips</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your destinations, travel-health readiness, and scheduled preparation.
          </p>
        </div>
        <Link
          to="/trip/create"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Plan New Trip
        </Link>
      </div>

      {/* Empty State */}
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">No trips planned yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Select a tropical or health-risk destination to generate your health checklist, malaria plan, and vaccine schedule.
            </p>
          </div>
          <Link
            to="/trip/create"
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Trips Section */}
          <section className="space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active & Upcoming Trips ({upcomingTrips.length})
            </h2>

            {upcomingTrips.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No upcoming trips scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcomingTrips.map((trip) => {
                  const daysUntil = getDaysUntil(trip.departureDate);
                  const dest =
                    typeof trip.destinationId === "object"
                      ? (trip.destinationId as unknown as Destination)
                      : null;
                  const destName = dest?.name || "Destination";
                  const region = dest?.region || "";

                  return (
                    <div
                      key={trip._id}
                      className="rounded-xl border border-border bg-card p-5 shadow-soft hover:border-primary/40 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              <span>{region}</span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mt-0.5">{destName}</h3>
                          </div>
                          <button
                            onClick={() => handleDelete(trip._id, destName)}
                            title="Delete trip"
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Dates & Countdown */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                          </span>
                        </div>

                        {daysUntil > 0 ? (
                          <div className="inline-block text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {daysUntil} days until departure
                          </div>
                        ) : daysUntil === 0 ? (
                          <div className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded">
                            Departing today
                          </div>
                        ) : (
                          <div className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded">
                            Currently traveling
                          </div>
                        )}

                        {/* Readiness Indicators */}
                        <div className="pt-3 border-t border-border flex flex-wrap gap-2 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                              trip.vaccineStatus === "reviewed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Vaccines: {trip.vaccineStatus.replace("-", " ")}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                              trip.malariaPlanStatus === "confirmed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Malaria: {trip.malariaPlanStatus.replace("-", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Action Link to Full Trip Hub */}
                      <div className="mt-5 pt-3 border-t border-border flex justify-end">
                        <Link
                          to={`/trip/${trip._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Open Preparation Hub
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Past Trips Section */}
          {pastTrips.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground">
                Past Trips ({pastTrips.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastTrips.map((trip) => {
                  const dest =
                    typeof trip.destinationId === "object"
                      ? (trip.destinationId as unknown as Destination)
                      : null;
                  const destName = dest?.name || "Destination";

                  return (
                    <div
                      key={trip._id}
                      className="rounded-lg border border-border bg-muted/20 p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{destName}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/trip/${trip._id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Review Trip
                        </Link>
                        <button
                          onClick={() => handleDelete(trip._id, destName)}
                          className="text-muted-foreground hover:text-destructive text-xs p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}