import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/StateViews";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAFF_ROLES = ["admin", "content-editor", "reviewer"];

export function AdminRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (status === "loading") {
    return <LoadingState label="Verifying admin permissions..." />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user?.role ?? "user";
  const isStaff = STAFF_ROLES.includes(role);

  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 text-center mx-auto max-w-md">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Access Forbidden</h1>
        <p className="text-sm text-muted-foreground">
          Your account (<span className="font-semibold">{user?.email}</span>) does not have staff permissions to access the Admin Console.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
          <Button onClick={() => navigate("/login")}>
            Log In as Admin
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
