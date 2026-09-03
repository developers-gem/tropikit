// frontend/src/pages/TripCreatePage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Plus,
  Compass,
  Sparkles,
  AlertCircle,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { fetchDestinations } from "@/api/destinationApi";
import { createTrip } from "@/api/tripApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/StateViews";
import type { Destination } from "@/types/api";

export default function TripCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDestinationId, setSelectedDestinationId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: destinations = [],
    isLoading: destsLoading,
    isError: destsError,
    refetch: refetchDestinations,
  } = useQuery({
    queryKey: ["destinations"],
    queryFn: () => fetchDestinations(),
  });

  const createTripMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: (newTrip: any) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      const tripId = newTrip?._id || newTrip?.id;
      if (tripId) {
        navigate(`/trip/${tripId}`);
      } else {
        navigate("/account/trips");
      }
    },
    onError: (err: any) => {
      setFormError(err?.message || "Failed to create trip. Please verify details.");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedDestinationId) {
      setFormError("Please select a destination.");
      return;
    }

    if (!departureDate || !returnDate) {
      setFormError("Please provide both departure and return dates.");
      return;
    }

    if (new Date(returnDate) < new Date(departureDate)) {
      setFormError("Return date cannot be earlier than your departure date.");
      return;
    }

    createTripMutation.mutate({
      destinationId: selectedDestinationId,
      departureDate,
      returnDate,
    });
  };

  if (destsLoading) {
    return <LoadingState label="Loading global destination profiles..." />;
  }

  if (destsError) {
    return (
      <ErrorState
        message="Could not load destinations. Please try again."
        onRetry={() => refetchDestinations()}
      />
    );
  }

  const selectedDestination = destinations.find(
    (d: Destination) =>
      String(d._id) === selectedDestinationId ||
      String((d as any).id) === selectedDestinationId ||
      d.slug === selectedDestinationId
  );

  return (
    <div className="w-full space-y-4 p-0 m-0">
      {/* 1. Header Hub */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-4 sm:p-5 shadow-xs">
        <Link
          to="/account/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all trips
        </Link>
        <div className="max-w-2xl space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            Trip Setup
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Plan a New <span className="text-primary">Journey</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select your travel destination and departure window to automatically generate personalized vaccine schedules, malaria chemoprophylaxis directives, and emergency reference files.
          </p>
        </div>
      </div>

      {/* 2. Form Card */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Itinerary Details
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter your target location and flight/travel dates.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            {/* Destination Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="destination-select" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Target Destination
              </Label>
              <select
                id="destination-select"
                required
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-hidden shadow-xs cursor-pointer"
              >
                <option value="">Select a country / destination</option>
                {destinations.map((d: any) => {
                  const val = d._id || d.id || d.slug;
                  return (
                    <option key={val} value={val}>
                      {d.name} {d.region ? `(${d.region})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="departure-date" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Departure Date
                </Label>
                <Input
                  id="departure-date"
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="rounded-xl border-border bg-background text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="return-date" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  Return Date
                </Label>
                <Input
                  id="return-date"
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="rounded-xl border-border bg-background text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Selected Destination Preview Notice */}
            {selectedDestination && (
              <div className="p-3 rounded-xl border border-border bg-muted/40 text-xs space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {selectedDestination.name} Readiness Checklist Included
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Upon creation, Tropikit will automatically compile recommended immunizations, assess regional malaria transmission risk, and prepare your offline packing list.
                </p>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-2 text-xs text-destructive font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <Button
                type="submit"
                disabled={createTripMutation.isPending}
                className="rounded-xl px-4 py-2 text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {createTripMutation.isPending ? "Generating Preparation Hub..." : "Create Trip"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/account/trips")}
                className="rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}