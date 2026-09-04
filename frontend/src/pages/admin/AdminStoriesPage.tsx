// frontend/src/pages/admin/AdminStoriesPage.tsx
import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/StateViews";

const RAW_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const API_BASE = RAW_URL.endsWith("/api/v1")
  ? RAW_URL
  : RAW_URL.replace(/\/+$/, "") + "/api/v1";

async function adminRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token") || localStorage.getItem("tropikit_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export default function AdminStoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [destinationSlug, setDestinationSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: rawStories, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-stories"],
    queryFn: async () => {
      try {
        return await adminRequest("/stories");
      } catch (err: any) {
        if (err.message?.includes("404")) {
          return await adminRequest("/admin/stories");
        }
        throw err;
      }
    },
  });

  const allStories: any[] = Array.isArray(rawStories)
    ? rawStories
    : rawStories?.stories || rawStories?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      adminRequest("/admin/stories", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err.message || "Failed to post story"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminRequest(`/admin/stories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: any) => alert(err.message || "Failed to delete story"),
  });

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setSummary("");
    setContent("");
    setDestinationSlug("");
    setFormError(null);
  };

  // Search filter
  const filtered = useMemo(() => {
    return allStories.filter((s: any) => {
      const q = search.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q) ||
        s.destinationSlug?.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q)
      );
    });
  }, [allStories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Current page records
  const paginatedStories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      author,
      summary,
      body: content,
      destinationSlug,
    });
  };

  if (isLoading) return <LoadingState label="Loading traveler stories..." />;
  if (isError) return <ErrorState message="Could not load stories" onRetry={() => refetch()} />;

  const startRecord = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filtered.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Traveler Stories Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage field logs, clinical write-ups, and educational stories ({allStories.length} total).
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Story
        </Button>
      </div>

      {/* Filter and Rows per page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search stories by title, author, destination..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-hidden"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Story Cards List */}
      <div className="grid gap-3">
        {paginatedStories.map((story: any) => (
          <div
            key={story._id || story.id}
            className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4 shadow-xs hover:border-primary/40 transition-colors"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground truncate">{story.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                  {story.destinationSlug || "Global"}
                </span>
                {story.published !== false && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold">
                    Published
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {story.summary || story.body}
              </p>
              <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-2">
                <span>
                  By <strong className="font-semibold text-foreground">{story.author || "Travel Clinician"}</strong>
                </span>
                {story.createdAt && (
                  <>
                    <span>•</span>
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm(`Delete story: "${story.title}"?`)) {
                  deleteMutation.mutate(story._id || story.id);
                }
              }}
              className="text-muted-foreground hover:text-destructive p-2 rounded transition-colors cursor-pointer shrink-0"
              title="Delete story"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-10 text-center border border-dashed rounded-xl text-xs text-muted-foreground flex flex-col items-center gap-2">
            <BookOpen className="h-6 w-6 text-muted-foreground/60" />
            <span>No traveler stories match your search.</span>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card text-xs text-muted-foreground shadow-xs">
        <div>
          Showing <span className="font-semibold text-foreground">{startRecord}</span> to{" "}
          <span className="font-semibold text-foreground">{endRecord}</span> of{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span> stories
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-2 text-xs font-medium text-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h2 className="text-sm font-bold text-foreground">Publish Field Story</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <Label className="text-[11px] font-semibold">Title</Label>
                <Input
                  required
                  placeholder="e.g. Navigating Dengue Season in Bali"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] font-semibold">Author</Label>
                  <Input
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold">Destination Slug</Label>
                  <Input
                    placeholder="e.g. indonesia"
                    value={destinationSlug}
                    onChange={(e) => setDestinationSlug(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Summary</Label>
                <Input
                  required
                  placeholder="Brief synopsis for card previews"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Content / Transcript</Label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed clinical advisory or field transcript..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-xs"
                />
              </div>
              {formError && <p className="text-destructive text-[11px]">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}