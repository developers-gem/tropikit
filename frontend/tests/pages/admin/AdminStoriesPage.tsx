
// frontend/src/pages/admin/AdminStoriesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/StateViews";

export default function AdminStoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [destinationSlug, setDestinationSlug] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: stories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-stories"],
    queryFn: () => apiRequest<any[]>("/stories"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiRequest("/admin/stories", { method: "POST", body, auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
      setIsModalOpen(false);
      setTitle("");
      setAuthor("");
      setSummary("");
      setContent("");
      setDestinationSlug("");
    },
    onError: (err: any) => setFormError(err.message || "Failed to post story"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/stories/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-stories"] }),
    onError: (err: any) => alert(err.message || "Failed to delete story"),
  });

  if (isLoading) return <LoadingState label="Loading traveler stories..." />;
  if (isError) return <ErrorState message="Could not load stories" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Traveler Stories</h1>
          <p className="text-xs text-muted-foreground">Manage field logs and clinical audio story files.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="text-xs font-semibold">
          <Plus className="h-4 w-4 mr-1" />
          Create Story
        </Button>
      </div>

      <div className="grid gap-3">
        {stories.map((story: any) => (
          <div
            key={story._id || story.id}
            className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4 shadow-xs"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">{story.title}</h3>
              <p className="text-xs text-muted-foreground">{story.summary || story.body}</p>
              <div className="text-[10px] text-muted-foreground pt-1">
                By <span className="font-semibold text-foreground">{story.author || "Travel Clinician"}</span> •{" "}
                <span>{story.destinationSlug || "Global"}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete story: ${story.title}?`)) {
                  deleteMutation.mutate(story._id || story.id);
                }
              }}
              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {stories.length === 0 && (
          <div className="p-8 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
            No traveler stories in database. Click "Create Story" to post the first one.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-sm font-bold">Publish Field Story</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({ title, author, summary, body: content, destinationSlug });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <Label className="text-[11px]">Title</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Author</Label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[11px]">Destination Slug</Label>
                  <Input placeholder="e.g. kenya" value={destinationSlug} onChange={(e) => setDestinationSlug(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Summary</Label>
                <Input required value={summary} onChange={(e) => setSummary(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[11px]">Content / Transcript</Label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-xs"
                />
              </div>
              {formError && <p className="text-destructive text-[11px]">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>Publish</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}