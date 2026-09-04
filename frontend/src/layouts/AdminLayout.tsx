// frontend/src/layouts/AdminLayout.tsx
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  BookOpen,
  FileCheck,
  ShieldAlert,
  LogOut,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, end: true },
  { label: "Destinations", href: "/admin/destinations", icon: MapPin },
  { label: "Stories", href: "/admin/stories", icon: BookOpen },
  { label: "Sources", href: "/admin/sources", icon: FileCheck },
];

export function AdminLayout() {
  const navigate = useNavigate();

  // Retrieve user info directly from storage safely
  const storedUserRaw = localStorage.getItem("user") || localStorage.getItem("tropikit_user");
  let user: { name?: string; email?: string; role?: string } | null = null;
  try {
    if (storedUserRaw) {
      user = JSON.parse(storedUserRaw);
    }
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tropikit_token");
    localStorage.removeItem("user");
    localStorage.removeItem("tropikit_user");
    navigate("/login");
  };

  return (
    // Outer viewport container locked to 100vh with no global overflow
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* 1. FIXED LEFT SIDEBAR (Stays pinned, does not scroll with page) */}
      <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-border bg-card/60 backdrop-blur-md h-full z-20">
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Logo / Header Branding */}
          <div className="p-6 border-b border-border/70 flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-foreground block">
                Tropikit
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Return Actions */}
        <div className="p-4 border-t border-border/70 bg-card/40 shrink-0 space-y-3">
          {/* Admin User Info Tag */}
          <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">
                {user?.name || "topikit-admin"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email || "topikitadmin@gmail.com"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-border bg-background hover:bg-muted/80 text-[11px] font-semibold text-foreground transition-colors"
              title="Return to user-facing site"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Main Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-[11px] font-semibold text-muted-foreground transition-colors cursor-pointer"
              title="Sign out of console"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. SCROLLABLE RIGHT CONTENT CANVAS */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto w-full pb-16">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}