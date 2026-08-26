import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  LayoutDashboard,
  MapPin,
  BookOpen,
  Link2,
  Menu,
  X,
  ExternalLink,
  LogOut,
} from "lucide-react";

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/destinations", label: "Destinations", icon: MapPin },
  { to: "/admin/stories", label: "Stories", icon: BookOpen },
  { to: "/admin/sources", label: "Sources", icon: Link2 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const roleLabel = user?.role ?? "staff";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/admin" className="flex items-center gap-2 font-bold text-foreground">
          <Shield className="h-5 w-5 text-primary" />
          Tropikit Admin
        </Link>
        <button
          type="button"
          className="p-2 text-foreground"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{user?.email}</span>
            <Badge variant="outline" className="capitalize text-xs">
              {roleLabel}
            </Badge>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/")}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Main Site
            </Button>
            <Button size="sm" variant="ghost" className="w-full" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1" /> Log out
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card min-h-screen p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-3 mb-4 border-b border-border">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-foreground leading-none">Tropikit</h1>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin Console
            </span>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card at bottom of Sidebar */}
        <div className="mt-auto pt-4 border-t border-border space-y-3">
          <div className="px-2 space-y-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "Staff Member"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <div className="pt-1">
              <Badge variant="outline" className="capitalize text-xs">
                Role: {roleLabel}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => navigate("/")}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Main Site
            </Button>
            <Button size="icon" variant="ghost" onClick={handleLogout} title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
