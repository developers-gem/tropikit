import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Plane } from "lucide-react";
import { fetchTrips } from "@/api/tripApi";
import { fetchDestinations } from "@/api/destinationApi";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TripsPage() {
  const { data: trips, isLoading, isError, refetch } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });
  const { data: destinations } = useQuery({
    queryKey: ["destinations-all"],
    queryFn: () => fetchDestinations(),
  });

  function destName(destinationId: string) {
    return destinations?.find((d) => d._id === destinationId)?.name ?? "Unknown destination";
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
          <Plane className="h-7 w-7 text-primary" /> My trips
        </h1>
        <Link to="/trip/create">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> New trip
          </Button>
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading your trips..." />}
      {isError && <ErrorState message="Couldn't load your trips." onRetry={() => refetch()} />}
      {!isLoading && !isError && trips?.length === 0 && (
        <EmptyState message="No saved trips yet. Create one to track your checklist and malaria plan." />
      )}

      {!isLoading && trips && trips.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {trips.map((trip) => (
            <Link key={trip._id} to={`/trip/${trip._id}`}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{destName(trip.destinationId)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {new Date(trip.departureDate).toLocaleDateString()} –{" "}
                  {new Date(trip.returnDate).toLocaleDateString()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
