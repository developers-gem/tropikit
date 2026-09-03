// frontend/src/pages/StoriesPage.tsx
import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Headphones,
  Search,
  Sparkles,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  X,
  Volume2,
} from "lucide-react";
import { fetchStories } from "@/api/storyApi";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function StoriesPage() {
  const [searchParams] = useSearchParams();
  const destinationSlug = searchParams.get("destination") ?? undefined;
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["stories", destinationSlug],
    queryFn: () => fetchStories(destinationSlug),
  });

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((story: any) => {
      if (story.category) set.add(story.category);
    });
    return Array.from(set).sort();
  }, [data]);

  // Client-side search and category filtering
  const filteredStories = useMemo(() => {
    return (data ?? []).filter((story: any) => {
      const title = story.title || story.headline || "";
      const description = story.description || story.summary || "";
      const destName =
        typeof story.destinationId === "object" && story.destinationId
          ? story.destinationId.name || ""
          : "";
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        destName.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" || story.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, selectedCategory]);

  if (isLoading) return <LoadingState label="Loading traveler stories..." />;
  if (isError || !data)
    return <ErrorState message="Couldn't load stories. Please verify your connection." onRetry={() => refetch()} />;

  const totalAudioMinutes = Math.round(
    (data ?? []).reduce(
      (acc: number, s: any) => acc + (s.audio?.durationSeconds || 0),
      0
    ) / 60
  );

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Hero Intelligence Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-8 md:p-12 shadow-soft">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Step 03 • Firsthand Field Experience
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Traveler <span className="text-primary">Stories & Field Guides</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Friendly, source-backed clinical explainers and firsthand traveler medical notes.
            Listen on the go or read full transcripts at your own pace.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>
                <strong className="text-foreground">{data.length}</strong> Stories Published
              </span>
            </div>
            {totalAudioMinutes > 0 && (
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-emerald-600" />
                <span>
                  <strong className="text-foreground">{totalAudioMinutes} min</strong> Total Audio
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-amber-500" />
              <span>Audio Narrated & Transcribed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Controls */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories by topic, disease, destination (e.g. malaria, altitude, Kenya)..."
              className="pl-10 pr-4 py-2.5 rounded-xl border-border bg-card text-sm text-foreground focus-visible:ring-primary/20 shadow-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {(searchQuery || selectedCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="h-10 px-3.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal className="h-3 w-3" /> Topic:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? "all" : cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Empty & Result States */}
      {filteredStories.length === 0 ? (
        <EmptyState message="No traveler stories match your selected criteria or search term." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map((story: any) => {
            const destName =
              typeof story.destinationId === "object" && story.destinationId
                ? story.destinationId.name
                : "";

            const durationMin = story.audio?.durationSeconds
              ? Math.round(story.audio.durationSeconds / 60)
              : null;

            return (
              <Card
                key={story._id || story.id}
                className="group relative rounded-2xl border border-border bg-card shadow-soft hover:shadow-md hover:border-primary/50 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                onClick={() => navigate(`/stories/${story._id || story.id}`)}
              >
                <CardHeader className="space-y-3 pb-3">
                  {/* Category & Destination Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {story.category && (
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold uppercase tracking-wider">
                          {story.category.replace(/-/g, " ")}
                        </Badge>
                      )}
                      {destName && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          {destName}
                        </span>
                      )}
                    </div>

                    {durationMin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                        <Headphones className="h-3 w-3 text-primary" />
                        {durationMin} min
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {story.title}
                    </CardTitle>
                    {story.description && (
                      <CardDescription className="line-clamp-2 mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        {story.description}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary pt-1">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> Read & Listen
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}