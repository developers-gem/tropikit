// frontend/src/pages/TripsPage.tsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Trash2,
  CalendarDays,
  Plane,
  Sparkles,
  ListChecks,
  Siren,
  Compass,
} from "lucide-react";

import { fetchTrips, deleteTrip } from "@/api/tripApi";
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

export default function TripsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  const {
    data: trips = [],
    isLoading: isTripsLoading,
    isError: isTripsError,
    refetch,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations"],
    queryFn: () => fetchDestinations(),
  });

  // Map destinations by _id, id, and slug safely without using `code`
  const destinationMap = useMemo(() => {
    const map = new Map<string, Destination>();
    destinations.forEach((d) => {
      const item = d as unknown as Record<string, unknown>;
      if (item._id && typeof item._id === "string") map.set(item._id, d);
      if (item.id && typeof item.id === "string") map.set(item.id, d);
      if (d.slug) map.set(d.slug, d);
    });
    return map;
  }, [destinations]);

  const resolveDestination = (trip: Trip): { name: string; region: string } => {
    if (trip.destinationId && typeof trip.destinationId === "object") {
      const dest = trip.destinationId as unknown as Destination;
      return {
        name: dest.name || (dest as any).country || "Destination",
        region: dest.region || "Global Travel",
      };
    }

    const tripRecord = trip as unknown as Record<string, unknown>;
    if (tripRecord.destination && typeof tripRecord.destination === "object") {
      const dest = tripRecord.destination as Destination;
      return {
        name: dest.name || (dest as any).country || "Destination",
        region: dest.region || "Global Travel",
      };
    }

    const refKey =
      typeof trip.destinationId === "string"
        ? trip.destinationId
        : ((tripRecord.destination || tripRecord.destinationSlug) as string | undefined);

    if (refKey && destinationMap.has(refKey)) {
      const dest = destinationMap.get(refKey)!;
      return {
        name: dest.name || (dest as any).country || "Destination",
        region: dest.region || "Global Travel",
      };
    }

    if (tripRecord.destinationName && typeof tripRecord.destinationName === "string") {
      return {
        name: tripRecord.destinationName,
        region: (tripRecord.destinationRegion || tripRecord.region || "Global Travel") as string,
      };
    }

    return { name: "Destination", region: "Global Travel" };
  };

  const getTripId = (trip: Trip): string => {
    const item = trip as unknown as Record<string, unknown>;
    return (trip._id || item.id || "") as string;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setDeletingTripId(null);
    },
    onError: (err: any) => {
      alert(err?.message || "Failed to delete trip.");
      setDeletingTripId(null);
    },
  });

  const handleDelete = (tripId: string, destName: string) => {
    if (!confirm(`Delete trip to ${destName}? This action cannot be undone.`)) return;
    setDeletingTripId(tripId);
    deleteMutation.mutate(tripId);
  };

  if (isTripsLoading) {
    return <LoadingState label="Loading your travel itineraries..." />;
  }

  if (isTripsError) {
    return <ErrorState message="Could not load your trips." onRetry={() => refetch()} />;
  }

  const now = new Date().setHours(0, 0, 0, 0);
  const upcomingTrips = trips
    .filter((t) => new Date(t.returnDate).getTime() >= now)
    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());

  const pastTrips = trips
    .filter((t) => new Date(t.returnDate).getTime() < now)
    .sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime());

  const displayedTrips = activeTab === "upcoming" ? upcomingTrips : pastTrips;

  return (
    <div className="w-full space-y-3 p-0 m-0">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-2.5 w-2.5" />
              Traveler Itinerary Hub
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Planned <span className="text-primary">Trips</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Manage your destinations, travel-health readiness, immunization checkpoints, and scheduled preparation.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <span className="font-semibold text-foreground">
                {upcomingTrips.length} Active & Upcoming
              </span>
              <span className="text-border">•</span>
              <span>{pastTrips.length} Completed</span>
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

      {/* 2. Tabs Selector Toolbar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Active & Upcoming ({upcomingTrips.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "past"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Past Expeditions ({pastTrips.length})
          </button>
        </div>

        <Link
          to="/destinations"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 hidden sm:flex"
        >
          Explore Destinations <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 3. Trips Grid View */}
      {displayedTrips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-2">
          <div className="p-2.5 rounded-full bg-muted/60 text-muted-foreground inline-block">
            <Plane className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {activeTab === "upcoming" ? "No upcoming trips planned" : "No past trips logged"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "upcoming"
              ? "Select a destination to generate your personalized health checklist, malaria plan, and vaccine schedule."
              : "Completed journeys will automatically appear here once their return date has passed."}
          </p>
          {activeTab === "upcoming" && (
            <Link
              to="/trip/create"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:underline pt-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Create your first trip
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedTrips.map((trip) => {
            const tripId = getTripId(trip);
            const daysUntil = getDaysUntil(trip.departureDate);
            const { name: destName, region: destRegion } = resolveDestination(trip);
            const isDeleting = deletingTripId === tripId;

            return (
              <div
                key={tripId || trip.departureDate}
                className="group relative rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Header: Destination and Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                        <Compass className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        {destRegion && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span>{destRegion}</span>
                          </div>
                        )}
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight mt-0.5">
                          {destName}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(tripId, destName)}
                      disabled={isDeleting}
                      title="Delete trip"
                      className="text-muted-foreground/50 hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Dates & Countdown Banner */}
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      <span>
                        {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span>
                        {daysUntil > 0
                          ? `${daysUntil} days until departure`
                          : daysUntil === 0
                          ? "Departing today!"
                          : activeTab === "upcoming"
                          ? "Trip currently in progress"
                          : "Trip completed"}
                      </span>
                    </div>
                  </div>

                  {/* Readiness Indicators */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="p-1.5 rounded-md border border-border/60 bg-background text-center">
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                        Vaccines
                      </span>
                      <span className="font-semibold text-foreground flex items-center justify-center gap-0.5 mt-0.5">
                        <ShieldCheck
                          className={`h-2.5 w-2.5 ${
                            trip.vaccineStatus === "reviewed"
                              ? "text-emerald-600"
                              : "text-amber-500"
                          }`}
                        />
                        <span className="truncate capitalize">
                          {trip.vaccineStatus ? String(trip.vaccineStatus).replace(/-/g, " ") : "Pending"}
                        </span>
                      </span>
                    </div>

                    <div className="p-1.5 rounded-md border border-border/60 bg-background text-center">
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                        Malaria
                      </span>
                      <span className="font-semibold text-foreground flex items-center justify-center gap-0.5 mt-0.5">
                        <Clock
                          className={`h-2.5 w-2.5 ${
                            trip.malariaPlanStatus === "confirmed"
                              ? "text-emerald-600"
                              : "text-amber-500"
                          }`}
                        />
                        <span className="truncate capitalize">
                          {trip.malariaPlanStatus
                            ? String(trip.malariaPlanStatus).replace(/-/g, " ")
                            : "None"}
                        </span>
                      </span>
                    </div>

                    <div className="p-1.5 rounded-md border border-border/60 bg-background text-center">
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                        Emergency
                      </span>
                      <span className="font-semibold text-foreground flex items-center justify-center gap-0.5 mt-0.5">
                        <Siren
                          className={`h-2.5 w-2.5 ${
                            trip.emergencyAcknowledged
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="truncate">
                          {trip.emergencyAcknowledged ? "Ready" : "Pending"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border/60 text-xs">
                  <Link
                    to={`/checklist?trip=${tripId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ListChecks className="h-3 w-3" />
                    Checklist
                  </Link>

                  <button
                    type="button"
                    onClick={() => navigate(`/trip/${tripId}`)}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Open Preparation Hub <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}