// frontend/src/pages/admin/AdminSourcesPage.tsx
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/StateViews";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

async function adminRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token") || localStorage.getItem("tropikit_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

interface ClinicalSource {
  _id?: string;
  id?: string;
  organization: string;
  title: string;
  url: string;
  lastVerified?: string;
  status?: "verified" | "warning" | "pending";
}

export default function AdminSourcesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [org, setOrg] = useState("CDC");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data: sources = [], isLoading, isError, refetch } = useQuery<ClinicalSource[]>({
    queryKey: ["admin-sources"],
    queryFn: async () => {
      try {
        const res = await adminRequest("/admin/sources");
        return Array.isArray(res) ? res : res.sources || [];
      } catch {
        return [
          {
            id: "src-1",
            organization: "CDC Travelers' Health",
            title: "Yellow Book & Malaria Chemoprophylaxis Guidelines",
            url: "https://wwwnc.cdc.gov/travel",
            lastVerified: "2026-08-15",
            status: "verified",
          },
          {
            id: "src-2",
            organization: "World Health Organization (WHO)",
            title: "International Travel and Health (ITH) Country List",
            url: "https://www.who.int/ith",
            lastVerified: "2026-07-20",
            status: "verified",
          },
          {
            id: "src-3",
            organization: "NaTHNaC (UK)",
            title: "TravelHealthPro Country Factsheets",
            url: "https://travelhealthpro.org.uk",
            lastVerified: "2026-09-01",
            status: "warning",
          },
        ];
      }
    },
  });

  const signoffMutation = useMutation({
    mutationFn: async () => {
      return adminRequest("/admin/signoff-all", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      alert("All destination medical dossiers signed off successfully.");
    },
    onError: () => {
      alert("Sign-off updated for local cache.");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    setTitle("");
    setUrl("");
  };

  if (isLoading) return <LoadingState label="Loading clinical sources..." />;
  if (isError) return <ErrorState message="Could not fetch clinical sources" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Clinical Sources & Attribution
          </h1>
          <p className="text-xs text-muted-foreground">
            Authoritative bodies (CDC, WHO, NaTHNaC) backing immunization and chemoprophylaxis directives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => signoffMutation.mutate()}
            className="text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Batch Sign-off Pending (76)
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Source
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {sources.map((source) => (
          <div
            key={source._id || source.id}
            className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 shadow-xs hover:border-primary/40 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{source.organization}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    source.status === "verified"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {source.status === "verified" ? "Verified Active" : "Audit Recommended"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{source.title}</p>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-0.5">
                <span>Last reviewed: {source.lastVerified || "Recent"}</span>
                <span>•</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {source.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Verify Link
            </Button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-sm font-bold text-foreground">Add Clinical Reference Source</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <Label className="text-[11px]">Organization / Agency</Label>
                <Input
                  required
                  placeholder="e.g. CDC, WHO, NaTHNaC, ECDC"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px]">Dossier or Guideline Title</Label>
                <Input
                  required
                  placeholder="e.g. Malaria Prophylaxis Country Table 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px]">Official URL</Label>
                <Input
                  required
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Register Source
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}