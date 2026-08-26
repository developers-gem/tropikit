import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock } from "lucide-react";
import { fetchStories } from "@/api/storyApi";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StoriesPage() {
  const [searchParams] = useSearchParams();
  const destinationSlug = searchParams.get("destination") ?? undefined;
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["stories", destinationSlug],
    queryFn: () => fetchStories(destinationSlug),
  });

  if (isLoading) return <LoadingState label="Loading stories..." />;
  if (isError || !data)
    return <ErrorState message="Couldn't load stories." onRetry={() => refetch()} />;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">
          <BookOpen className="inline h-4 w-4 mr-1 -mt-1" /> Your Tropikit Story
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground">Stories</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Friendly, source-backed explainers about staying healthy on your trip — listen or read,
          whichever suits you.
        </p>
      </div>

      {data.length === 0 ? (
        <EmptyState message="No stories published yet for this destination." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((story) => {
            const destName =
              typeof story.destinationId === "object" ? story.destinationId.name : "";
            return (
              <Card
                key={story._id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/stories/${story._id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-secondary text-secondary-foreground text-[10px]">
                      {story.category.replace(/-/g, " ")}
                    </Badge>
                    {destName && (
                      <span className="text-xs text-muted-foreground">{destName}</span>
                    )}
                  </div>
                  <CardTitle className="text-base mt-1">{story.title}</CardTitle>
                  <CardDescription>{story.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {story.audio.durationSeconds && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {Math.round(story.audio.durationSeconds / 60)} min
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
