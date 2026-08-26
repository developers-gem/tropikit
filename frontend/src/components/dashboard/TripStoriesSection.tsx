import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { DashboardStoryGroup } from "@/types/api";

export function TripStoriesSection({ groups }: { groups: DashboardStoryGroup[] }) {
  const navigate = useNavigate();
  const hasAny = groups.some((g) => g.stories.length > 0);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Stories for this destination</h3>
      </div>

      {!hasAny ? (
        <p className="text-sm text-muted-foreground">
          No stories published for this destination yet.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {groups
            .filter((g) => g.stories.length > 0)
            .map((group) => (
              <div key={group.key}>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  {group.label}
                </div>
                <ul className="space-y-1">
                  {group.stories.map((story) => (
                    <li key={story._id}>
                      <button
                        onClick={() => navigate(`/stories/${story._id}`)}
                        className="text-sm text-primary hover:underline text-left"
                      >
                        {story.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
