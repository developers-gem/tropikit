// frontend/src/pages/admin/AdminDestinationsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Compass,
  Plus,
  Trash2,
  Search,
  ShieldAlert,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { fetchDestinations } from "@/api/destinationApi";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState } from "@/components/StateViews";
import type { Destination } from "@/types/api";

export default function AdminDestinationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [slug, setSlug] = useState("");
  const [malariaRisk, setMalariaRisk] = useState("low");
  const [vaccinesInput, setVaccinesInput] = useState("");
  const [police, setPolice] = useState("112");
  const [ambulance, setAmbulance] = useState("112");

  const { data: destinations = [], isLoading, isError, refetch } = useQuery<Destination[]>({
    queryKey: ["admin-destinations"],
    queryFn: () => fetchDestinations(),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest("/admin/destinations", {
        method: "POST",
        body: payload,
        auth: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-destinations"] });
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create destination");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/admin/destinations/${id}`, {
        method: "DELETE",
        auth: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-destinations"] });
      queryClient.invalidateQueries({ queryKey: ["destinations"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete destination");
    },
  });

  const resetForm = () => {
    setName("");
    setRegion("");
    setSlug("");
    setMalariaRisk("low");
    setVaccinesInput("");
    setPolice("112");
    setAmbulance("112");
    setFormError(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const vaccines = vaccinesInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => ({ name: v, disease: v, recommendationLevel: "recommended" }));

    const emergencyContacts = [
      { category: "police", number: police },
      { category: "ambulance", number: ambulance },
    ];

    createMutation.mutate({
      name,
      region,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      malariaRisk: { level: malariaRisk },
      vaccines,
      emergencyContacts,
    });
  };

  const filtered = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.region?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingState label="Loading destination directory..." />;
  if (isError) return <ErrorState message="Could not fetch destinations" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Destination Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage global health profiles, malaria risk categorizations, and emergency lines.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Destination
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Malaria Risk</th>
                <th className="py-3 px-4">Vaccines</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((d: any) => {
                const riskLevel = typeof d.malariaRisk === "string" ? d.malariaRisk : d.malariaRisk?.level || "low";
                return (
                  <tr key={d._id || d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{d.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{d.region || "Global"}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-muted text-foreground font-medium text-[11px]">
                        {riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {(d.vaccines?.length || d.vaccineRequirements?.length || 0)} listed
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${d.name}?`)) {
                            deleteMutation.mutate(d._id || d.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                        title="Delete destination"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No destinations match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">Add New Destination</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Name</Label>
                  <Input
                    required
                    placeholder="e.g. Thailand"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Region</Label>
                  <Input
                    required
                    placeholder="e.g. Southeast Asia"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">URL Slug</Label>
                  <Input
                    required
                    placeholder="e.g. thailand"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Malaria Risk</Label>
                  <select
                    value={malariaRisk}
                    onChange={(e) => setMalariaRisk(e.target.value)}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="none">None / Minimal</option>
                    <option value="low">Low Risk</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Vaccines (comma-separated)</Label>
                <Input
                  placeholder="e.g. Yellow Fever, Hepatitis A, Typhoid"
                  value={vaccinesInput}
                  onChange={(e) => setVaccinesInput(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Police Number</Label>
                  <Input value={police} onChange={(e) => setPolice(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Ambulance Number</Label>
                  <Input value={ambulance} onChange={(e) => setAmbulance(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              {formError && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Save Destination"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}