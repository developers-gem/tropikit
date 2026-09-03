// frontend/src/layouts/SiteLayout.tsx
import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  HeartPulse,
  LogOut,
  Menu,
  ShieldPlus,
  Siren,
  UserRound,
  X,
  Compass,
  ArrowRight,
} from "lucide-react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  {
    to: "/destinations",
    label: "Destinations",
    icon: Compass,
    badge: "Profiles",
  },
  {
    to: "/checklist",
    label: "Checklist",
    icon: ClipboardCheck,
  },
  {
    to: "/stories",
    label: "Stories",
    icon: BookOpen,
  },
  {
    to: "/emergency",
    label: "Emergency",
    icon: Siren,
  },
];

export function SiteLayout() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resourcesRef.current &&
        !resourcesRef.current.contains(event.target as Node)
      ) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
  }

  function closeMenu() {
    setMenuOpen(false);
    setResourcesOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#0f242a] flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* =========================================================
          NAVBAR
      ========================================================== */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl backdrop-saturate-150 transition-all">
        {/* Full width container with tight edges to push logo left & controls right */}
        <nav
          aria-label="Main navigation"
          className="w-full px-3 sm:px-5 lg:px-7"
        >
          <div className="flex h-16 sm:h-[70px] items-center justify-between gap-4">
            
            {/* 1. Left: Brand Logo (Shifted to the far left) */}
            <Link
              to="/"
              onClick={closeMenu}
              className="group flex items-center gap-2.5 shrink-0 focus-visible:outline-hidden"
            >
              {/* Clean shield badge (green circle removed) */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                <ShieldPlus className="h-5 w-5" />
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                  Tropikit
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 -mt-0.5 flex items-center gap-1">
                  <span>Travel Health</span>
                  <span className="text-primary/60">•</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready</span>
                </span>
              </div>
            </Link>

            {/* 2. Middle: Expanded Navigation Pill Bar */}
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-auto">
              <div className="flex items-center justify-between w-full p-1.5 rounded-2xl bg-muted/50 border border-border/50 shadow-xs backdrop-blur-md">
                {NAV_LINKS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`relative flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                        active
                          ? "bg-card text-foreground shadow-xs shadow-black/5 font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          active ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}

                {/* Resources Dropdown */}
                <div className="relative flex-1" ref={resourcesRef}>
                  <button
                    type="button"
                    onClick={() => setResourcesOpen((v) => !v)}
                    className={`w-full inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      resourcesOpen
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                    aria-expanded={resourcesOpen}
                  >
                    <span>Resources</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        resourcesOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>

                  {resourcesOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/8 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150">
                      <Link
                        to="/stories"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-2.5 text-xs transition-colors hover:bg-muted/60 group"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">Field Stories & Audio</span>
                          <span className="text-[11px] text-muted-foreground block leading-tight">
                            Firsthand medical logs and doctor advice.
                          </span>
                        </div>
                      </Link>

                      <Link
                        to="/checklist"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-2.5 text-xs transition-colors hover:bg-muted/60 group"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">Personalized Checklist</span>
                          <span className="text-[11px] text-muted-foreground block leading-tight">
                            Pre-travel vaccines and packing tasks.
                          </span>
                        </div>
                      </Link>

                      <Link
                        to="/emergency"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-2.5 text-xs transition-colors hover:bg-muted/60 group"
                      >
                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors shrink-0">
                          <Siren className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">Emergency Hotlines</span>
                          <span className="text-[11px] text-muted-foreground block leading-tight">
                            Police, hospital, and embassy directories.
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Right: Auth Controls (Shifted to the far right) */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0">
              {status === "authenticated" ? (
                <>
                  <Link
                    to="/account/trips"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive("/account/trips")
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>My Trips</span>
                  </Link>

                  <Link
                    to="/account"
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-semibold transition-all hover:border-primary/40 shadow-xs ${
                      isActive("/account") ? "ring-2 ring-primary/20 text-primary font-bold" : "text-foreground"
                    }`}
                  >
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {user?.name ? user.name[0].toUpperCase() : <UserRound className="h-3 w-3" />}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.name || "Account"}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Log out"
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : status === "unauthenticated" ? (
                <>
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log In
                  </Link>

                  <Button
                    size="sm"
                    onClick={() => navigate("/register")}
                    className="rounded-xl px-4 py-2 text-xs font-bold shadow-sm shadow-primary/20 cursor-pointer"
                  >
                    Get Started <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </>
              ) : null}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground transition-colors hover:bg-muted lg:hidden cursor-pointer shadow-xs"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile Menu Accordion */}
          {menuOpen && (
            <div className="border-t border-border/80 py-4 lg:hidden animate-in slide-in-from-top-2 duration-150 space-y-3">
              <div className="grid gap-1">
                {NAV_LINKS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="my-1.5 h-px bg-border/60" />

                <Link
                  to="/account/trips"
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                    isActive("/account/trips")
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>My Trips</span>
                </Link>

                <Link
                  to="/account"
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                    isActive("/account")
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <UserRound className="h-4 w-4" />
                  <span>Account Settings</span>
                </Link>

                {status === "authenticated" ? (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="mt-2 h-10 w-full rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Log out
                  </Button>
                ) : status === "unauthenticated" ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="flex h-10 items-center justify-center rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted"
                    >
                      Log in
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => {
                        closeMenu();
                        navigate("/register");
                      }}
                      className="h-10 rounded-xl text-xs font-bold"
                    >
                      Sign up
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* =========================================================
          MAIN CONTENT OUTLET
      ========================================================== */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="mt-auto border-t border-border/80 bg-[#06242b] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-3">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 text-[#06242b] shadow-xs">
                  <ShieldPlus className="h-5 w-5" />
                </span>
                <span className="text-lg font-black tracking-tight text-white">
                  Tropikit
                </span>
              </Link>

              <p className="text-xs leading-relaxed text-white/60">
                A travel-health intelligence companion helping adventurers, medical travelers, and families understand, prepare, and stay informed across global journeys.
              </p>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
                <HeartPulse className="h-3.5 w-3.5" />
                Travel health, made simple and dependable.
              </div>
            </div>

            {/* Explore */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                Explore
              </h3>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <Link to="/destinations" className="hover:text-emerald-400 transition-colors">
                    Destinations Directory
                  </Link>
                </li>
                <li>
                  <Link to="/checklist" className="hover:text-emerald-400 transition-colors">
                    Interactive Checklist
                  </Link>
                </li>
                <li>
                  <Link to="/stories" className="hover:text-emerald-400 transition-colors">
                    Firsthand Field Stories
                  </Link>
                </li>
                <li>
                  <Link to="/emergency" className="hover:text-emerald-400 transition-colors">
                    Emergency Hotline Directory
                  </Link>
                </li>
              </ul>
            </div>

            {/* Trip Tools */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                Trip Tools
              </h3>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <Link to="/trip/create" className="hover:text-emerald-400 transition-colors">
                    Plan New Journey
                  </Link>
                </li>
                <li>
                  <Link to="/account/trips" className="hover:text-emerald-400 transition-colors">
                    My Planned Trips
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="hover:text-emerald-400 transition-colors">
                    Security & Preferences
                  </Link>
                </li>
              </ul>
            </div>

            {/* Clinical Disclaimer */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                Medical Disclaimer
              </h3>
              <p className="text-[11px] leading-relaxed text-white/50">
                Tropikit provides general travel-health preparation guides sourced from CDC, WHO, and NaTHNaC. It does not constitute formal medical diagnosis or prescription. Consult a licensed travel clinician before initiating medication regimens.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40">
            <p>© {new Date().getFullYear()} Tropikit. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/destinations" className="hover:text-white/70 transition-colors">
                Destinations
              </Link>
              <span>•</span>
              <Link to="/checklist" className="hover:text-white/70 transition-colors">
                Checklist
              </Link>
              <span>•</span>
              <Link to="/emergency" className="hover:text-white/70 transition-colors">
                Emergency
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}