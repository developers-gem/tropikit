// frontend/src/layouts/UserDashboardLayout.tsx
import { ReactNode } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Compass,
  Plane,
  UserCircle,
  LogOut,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { logoutRequest } from "@/api/authApi";

interface Props {
  children: ReactNode;
}

export function UserDashboardLayout({ children }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Clean up session and navigate even if the network call fails
    } finally {
      navigate("/login");
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard Overview", icon: Compass },
    { to: "/account/trips", label: "My Trips", icon: Plane },
    { to: "/account", label: "Account Settings", icon: UserCircle },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      {/* Sticky Left Sidebar with Viewport Bounds */}
      <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border bg-card/50 backdrop-blur-sm p-4 hidden md:flex flex-col justify-between">
        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          <div className="px-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Travel Health Hub
            </h2>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-border space-y-2">
            <Link
              to="/trip/create"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Plan New Trip
            </Link>

            <Link
              to="/destinations"
              className="flex items-center justify-between w-full py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <span>Explore Destinations</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Anchored Visible Footer */}
        <div className="pt-3 mt-2 border-t border-border shrink-0 bg-transparent">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}