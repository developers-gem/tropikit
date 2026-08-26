import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDestinations } from "@/api/destinationApi";
import { createTrip, saveTripChecklist } from "@/api/tripApi";
import { TRIP_TYPES, ACCOMMODATION_TYPES, ACTIVITY_TYPES } from "@/types/api";
import { useLocalChecklist } from "@/hooks/useLocalChecklist";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/StateViews";

export default function TripCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const local = useLocalChecklist();
  const { data: destinations, isLoading } = useQuery({
    queryKey: ["destinations-all"],
    queryFn: () => fetchDestinations(),
  });

  const [destinationId, setDestinationId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Someone arriving here from a destination page's malaria planner (or any other
  // "create a trip for this destination" link) shouldn't have to re-select it — that kind
  // of dead-end was the single biggest disconnect found in the product-owner walkthrough.
  // Derived at render time rather than synced via an effect+setState (which would trigger
  // an avoidable cascading render): the select's effective value falls back to whatever the
  // URL resolves to until the user actively picks something themselves.
  const prefilledDestinationId =
    searchParams.get("destination") && destinations
      ? (destinations.find((d) => d.slug === searchParams.get("destination"))?._id ?? "")
      : "";
  const effectiveDestinationId = destinationId || prefilledDestinationId;

  if (isLoading) return <LoadingState label="Loading destinations..." />;

  function toggleActivity(activity: string) {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const trip = await createTrip({
        destinationId: effectiveDestinationId,
        departureDate,
        returnDate,
        ...(tripType ? { tripType } : {}),
        ...(accommodationType ? { accommodationType } : {}),
        ...(activities.length ? { activities } : {}),
      });

      // Carry over any checklist progress from browsing anonymously before creating this
      // trip — otherwise items checked while researching are silently lost the moment a
      // trip exists, which was the second-biggest disconnect found in the walkthrough.
      // The base 23 items share identical "category::item" keys between the anonymous
      // template and every trip's template, so a direct key match is safe; any keys that
      // don't apply to this trip (e.g. from a different destination's personalization)
      // are already filtered out server-side.
      const localKeys = local.getCheckedKeys();
      if (localKeys.length > 0) {
        await saveTripChecklist(trip._id, localKeys).catch(() => {
          // Non-fatal — the trip itself was created successfully either way, and the
          // user can always redo the checklist from the trip dashboard.
        });
      }

      navigate(`/trip/${trip._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create trip");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg px-4 sm:px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground mb-2">New trip</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Destination and dates are required. Everything else helps tailor your checklist and
        preparation timeline, and can be added or changed later.
      </p>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="destination">Destination *</Label>
          <select
            id="destination"
            required
            value={effectiveDestinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a destination</option>
            {destinations?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="departure">Departure date *</Label>
            <input
              id="departure"
              type="date"
              required
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="return">Return date *</Label>
            <input
              id="return"
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tripType">Trip type</Label>
          <select
            id="tripType"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Not specified</option>
            {TRIP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="accommodationType">Accommodation</Label>
          <select
            id="accommodationType"
            value={accommodationType}
            onChange={(e) => setAccommodationType(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Not specified</option>
            {ACCOMMODATION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Activities you're planning</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ACTIVITY_TYPES.map((activity) => (
              <label
                key={activity}
                className="flex items-center gap-2 text-sm rounded-md border border-input px-3 py-2 cursor-pointer hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={activities.includes(activity)}
                  onChange={() => toggleActivity(activity)}
                  className="w-auto"
                />
                {activity}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating..." : "Create trip"}
        </Button>
      </form>
    </section>
  );
}
