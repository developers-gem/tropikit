// frontend/src/pages/StoryDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Headphones, FileText, ArrowLeft } from "lucide-react";
import { fetchStoryById, fetchStories } from "@/api/storyApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Citations } from "@/components/Citations";
import { Badge } from "@/components/ui/badge";

export default function StoryDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"listen" | "read">("listen");

  // Validate the route param before allowing any network queries
  const isValidId = Boolean(id && id !== "undefined");

  const {
    data: story,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStoryById(id),
    enabled: isValidId,
  });

  const destinationId =
    story && typeof story.destinationId === "object"
      ? (story.destinationId as any)?._id
      : null;

  const destinationSlug =
    story && typeof story.destinationId === "object"
      ? (story.destinationId as any)?.slug
      : undefined;

  // Sibling stories for the same destination power the audio player playlist
  const { data: siblings } = useQuery({
    queryKey: ["story-siblings", destinationId || destinationSlug],
    queryFn: () => fetchStories(destinationSlug),
    enabled: Boolean(destinationSlug || destinationId),
  });

  // Guard against invalid or missing id parameter
  if (!isValidId) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <ErrorState
          message="Invalid Story ID. Please choose a story from the stories directory or your trip hub."
          onRetry={() => navigate("/stories")}
        />
      </section>
    );
  }

  if (isLoading) return <LoadingState label="Loading story..." />;

  if (isError || !story) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <ErrorState message="Couldn't load this story." onRetry={() => refetch()} />
      </section>
    );
  }

  const destName =
    typeof story.destinationId === "object" && story.destinationId
      ? (story.destinationId as any)?.name
      : "";

  const orderedSiblings = siblings ?? [];
  const currentStoryId = story._id || (story as any)?.id;
  const currentIndex = orderedSiblings.findIndex(
    (s: any) => (s._id || s.id) === currentStoryId
  );
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < orderedSiblings.length - 1;

  function goToPrevious() {
    if (hasPrevious) {
      const prevId = orderedSiblings[currentIndex - 1]._id || (orderedSiblings[currentIndex - 1] as any).id;
      if (prevId) navigate(`/stories/${prevId}`);
    }
  }

  function goToNext() {
    if (hasNext) {
      const nextId = orderedSiblings[currentIndex + 1]._id || (orderedSiblings[currentIndex + 1] as any).id;
      if (nextId) navigate(`/stories/${nextId}`);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Metadata headers */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {story.category && (
          <Badge className="bg-secondary text-secondary-foreground text-[10px]">
            {story.category.replace(/-/g, " ")}
          </Badge>
        )}
        {destName && <span className="text-xs text-muted-foreground">{destName}</span>}
        {story.audio?.durationSeconds && (
          <span className="text-xs text-muted-foreground">
            {Math.round(story.audio.durationSeconds / 60)} min
          </span>
        )}
      </div>

      <h1 className="text-3xl font-semibold text-foreground">{story.title}</h1>
      {(story.description || (story as any)?.summary) && (
        <p className="mt-2 text-muted-foreground">
          {story.description || (story as any)?.summary}
        </p>
      )}

      {/* Mode Switchers: Listen vs Read */}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("listen")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
            mode === "listen"
              ? "bg-primary text-primary-foreground"
              : "border border-input text-foreground hover:bg-muted"
          }`}
        >
          <Headphones className="h-4 w-4" /> Listen
        </button>
        <button
          type="button"
          onClick={() => setMode("read")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
            mode === "read"
              ? "bg-primary text-primary-foreground"
              : "border border-input text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-4 w-4" /> Read transcript
        </button>
      </div>

      {/* Player or Transcript Content */}
      <div className="mt-6">
        {mode === "listen" ? (
          <AudioPlayer
            key={currentStoryId}
            src={story.audio?.url || ""}
            title={story.title}
            onPrevious={orderedSiblings.length > 1 ? goToPrevious : undefined}
            onNext={orderedSiblings.length > 1 ? goToNext : undefined}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />
        ) : (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line rounded-lg border border-border bg-card p-5">
            {story.transcript || (story as any)?.body || (story as any)?.content || "Transcript not available."}
          </div>
        )}
      </div>

      {/* Citations / Sources */}
      {Array.isArray(story.sources) && story.sources.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <Citations items={story.sources} />
        </div>
      )}
    </section>
  );
}