import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchAdminDashboard } from "@/api/adminApi";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Link2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  if (isLoading) return <LoadingState label="Loading admin metrics..." />;
  if (isError || !stats)
    return <ErrorState message="Could not load admin dashboard statistics." onRetry={() => refetch()} />;

  const {
    destinationCount,
    storyCount,
    unpublishedStoryCount,
    destinationsNeedingReview,
    destinationsWithSourceWarnings,
    recentUpdates,
  } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of destination medical content, stories, review queues, and source attribution.
        </p>
      </div>

      {/* Top Summary Metrics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Destinations</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{destinationCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active destinations in directory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stories</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{storyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unpublishedStoryCount} unpublished draft{unpublishedStoryCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needing Review</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{destinationsNeedingReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Destinations pending content sign-off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Source Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{destinationsWithSourceWarnings}</div>
            <p className="text-xs text-muted-foreground mt-1">Unverified source attribution links</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue Summary & Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Updates
            </CardTitle>
            <CardDescription>Latest changes across destinations and stories</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUpdates.length === 0 ? (
              <EmptyState message="No recent content updates recorded." />
            ) : (
              <div className="divide-y divide-border">
                {recentUpdates.map((item) => {
                  const dateStr = new Date(item.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div key={`${item.type}-${item.id}`} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.type === "destination" ? (
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.type} · Updated {dateStr}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs shrink-0">
                        {item.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Management Navigation */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Content Management</CardTitle>
              <CardDescription className="text-xs">Quick access to CMS sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between text-sm"
                onClick={() => navigate("/admin/destinations")}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Destinations Directory
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between text-sm"
                onClick={() => navigate("/admin/stories")}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Stories & Audio
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between text-sm"
                onClick={() => navigate("/admin/sources")}
              >
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Sources & Verification
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/40 border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Review Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Destinations Pending Review:</span>
                <span className="font-semibold text-foreground">{destinationsNeedingReview}</span>
              </div>
              <div className="flex justify-between">
                <span>Source Link Warnings:</span>
                <span className="font-semibold text-foreground">{destinationsWithSourceWarnings}</span>
              </div>
              <div className="flex justify-between">
                <span>Unpublished Draft Stories:</span>
                <span className="font-semibold text-foreground">{unpublishedStoryCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
