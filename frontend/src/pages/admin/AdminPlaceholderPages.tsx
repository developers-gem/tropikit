import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function AdminDestinationsPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Destinations Management</CardTitle>
          <CardDescription>Destination medical content editing and review workflow (Phase 2B).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This module will allow staff to manage destination advice, vaccine classifications, regional malaria guidance, and emergency contacts.
          </p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminStoriesPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Stories & Audio Management</CardTitle>
          <CardDescription>Story transcript, audio asset, and publication management (Phase 2C).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This module will allow content editors to create stories, attach audio assets, assign categories, and publish content.
          </p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminSourcesPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sources & Verification Directory</CardTitle>
          <CardDescription>Medical source attributions and link verification monitoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This section lists all publisher source citations (CDC, WHO, TravelHealthPro) across destinations and stories.
          </p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
