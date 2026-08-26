import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Headphones, FileText } from "lucide-react";
import { fetchStoryById, fetchStories } from "@/api/storyApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Citations } from "@/components/Citations";
import { Badge } from "@/components/ui/badge";

export default function StoryDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"listen" | "read">("listen");

  const { data: story, isLoading, isError, refetch } = useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStoryById(id),
  });

  const destinationId = story && typeof story.destinationId === "object" ? story.destinationId._id : null;

  // Sibling stories for the same destination power the audio player's Previous/Next controls
  // — a simple, real "playlist" rather than an arbitrary global story order.
  const { data: siblings } = useQuery({
    queryKey: ["story-siblings", destinationId],
    queryFn: () => fetchStories(typeof story!.destinationId === "object" ? story!.destinationId.slug : undefined),
    enabled: !!destinationId,
  });

  if (isLoading) return <LoadingState label="Loading story..." />;
  if (isError || !story)
    return <ErrorState message="Couldn't load this story." onRetry={() => refetch()} />;

  const destName = typeof story.destinationId === "object" ? story.destinationId.name : "";

  const orderedSiblings = siblings ?? [];
  const currentIndex = orderedSiblings.findIndex((s) => s._id === story._id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < orderedSiblings.length - 1;

  function goToPrevious() {
    if (hasPrevious) navigate(`/stories/${orderedSiblings[currentIndex - 1]._id}`);
  }
  function goToNext() {
    if (hasNext) navigate(`/stories/${orderedSiblings[currentIndex + 1]._id}`);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Badge className="bg-secondary text-secondary-foreground text-[10px]">
          {story.category.replace(/-/g, " ")}
        </Badge>
        {destName && <span className="text-xs text-muted-foreground">{destName}</span>}
        {story.audio.durationSeconds && (
          <span className="text-xs text-muted-foreground">
            {Math.round(story.audio.durationSeconds / 60)} min
          </span>
        )}
      </div>
      <h1 className="text-3xl font-semibold text-foreground">{story.title}</h1>
      <p className="mt-2 text-muted-foreground">{story.description}</p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setMode("listen")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mode === "listen"
              ? "bg-primary text-primary-foreground"
              : "border border-input text-foreground hover:bg-muted"
          }`}
        >
          <Headphones className="h-4 w-4" /> Listen
        </button>
        <button
          onClick={() => setMode("read")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mode === "read"
              ? "bg-primary text-primary-foreground"
              : "border border-input text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-4 w-4" /> Read transcript
        </button>
      </div>

      <div className="mt-6">
        {mode === "listen" ? (
          <AudioPlayer
            key={story._id}
            src={story.audio.url}
            title={story.title}
            onPrevious={orderedSiblings.length > 1 ? goToPrevious : undefined}
            onNext={orderedSiblings.length > 1 ? goToNext : undefined}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />
        ) : (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line rounded-lg border border-border bg-card p-5">
            {story.transcript}
          </div>
        )}
      </div>

      <Citations items={story.sources} />
    </section>
  );
}
