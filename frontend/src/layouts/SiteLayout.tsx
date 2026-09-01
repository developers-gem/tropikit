import { useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  HeartPulse,
  LogIn,
  User,
  Map,
  Menu,
  ShieldPlus,
  Siren,
  UserRound,
  X,
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
    icon: Map,
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

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

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
    <div className="min-h-screen bg-[#f6faf9] text-[#102a33]">
      {/* =========================================================
          NAVBAR
      ========================================================== */}
      <header className="sticky top-0 z-50 border-b border-[#dcebe8]/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10"
        >
          <div className="flex h-[72px] items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              onClick={closeMenu}
              className="group flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#062c34] text-white shadow-sm transition group-hover:bg-[#087f73]">
                <ShieldPlus className="h-5 w-5" />
              </span>

              <span className="flex flex-col">
                <span className="text-lg font-bold leading-none tracking-[-0.02em] text-[#062c34]">
                  Tropikit
                </span>
                <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.14em] text-[#789097] sm:block">
                  Travel health
                </span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-[#e5f7f4] text-[#087f73]"
                        : "text-[#526a71] hover:bg-[#f3f8f7] hover:text-[#12343c]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Resources dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setResourcesOpen((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-[#526a71] transition hover:bg-[#f3f8f7] hover:text-[#12343c]"
                  aria-expanded={resourcesOpen}
                >
                  Resources
                  <ChevronDown
                    className={`h-4 w-4 transition ${
                      resourcesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {resourcesOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-56 rounded-2xl border border-[#dcebe8] bg-white p-2 shadow-xl shadow-[#062c34]/10">
                    <Link
                      to="/stories"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#526a71] hover:bg-[#f3f8f7] hover:text-[#12343c]"
                    >
                      <BookOpen className="h-4 w-4 text-[#087f73]" />
                      Travel stories
                    </Link>

                    <Link
                      to="/checklist"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#526a71] hover:bg-[#f3f8f7] hover:text-[#12343c]"
                    >
                      <CheckSquare className="h-4 w-4 text-[#087f73]" />
                      Travel checklist
                    </Link>

                    <Link
                      to="/emergency"
                      onClick={() => setResourcesOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#526a71] hover:bg-[#f3f8f7] hover:text-[#12343c]"
                    >
                      <Siren className="h-4 w-4 text-[#087f73]" />
                      Emergency information
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop auth */}
            <div className="hidden items-center gap-2 lg:flex">
              {status === "authenticated" ? (
                <>
                  <Link
                    to="/account/trips"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#526a71] hover:bg-[#f3f8f7] hover:text-[#12343c]"
                  >
                    <CalendarDays className="h-4 w-4" />
                    My trips
                  </Link>

                  <Link
                    to="/account"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#dcebe8] px-3 py-2 text-sm font-medium text-[#526a71] hover:bg-[#f3f8f7]"
                  >
                    <UserRound className="h-4 w-4" />
                    Account
                  </Link>

                  <Button
                    size="sm"
                    onClick={handleLogout}
                    className="ml-1 rounded-lg bg-[#062c34] hover:bg-[#087f73]"
                  >
                    Log out
                  </Button>
                </>
              ) : status === "unauthenticated" ? (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#526a71] hover:bg-[#f3f8f7] hover:text-[#12343c]"
                  >
                    <User className="h-4 w-4" />
                    Log in
                  </Link>

                  <Button
                    size="sm"
                    onClick={() => navigate("/register")}
                    className="rounded-lg bg-[#062c34] px-5 hover:bg-[#087f73]"
                  >
                    Create account
                  </Button>
                </>
              ) : null}
            </div>

            {/* Mobile button */}
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dcebe8] text-[#12343c] transition hover:bg-[#f3f8f7] lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* =====================================================
              MOBILE MENU
          ====================================================== */}
          {menuOpen && (
            <div className="border-t border-[#e3eeec] py-4 lg:hidden">
              <div className="grid gap-1">
                {NAV_LINKS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                        active
                          ? "bg-[#e5f7f4] text-[#087f73]"
                          : "text-[#526a71] hover:bg-[#f3f8f7]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-2 h-px bg-[#e3eeec]" />

                <Link
                  to="/account/trips"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#526a71] hover:bg-[#f3f8f7]"
                >
                  <CalendarDays className="h-5 w-5" />
                  My trips
                </Link>

                <Link
                  to="/account"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#526a71] hover:bg-[#f3f8f7]"
                >
                  <UserRound className="h-5 w-5" />
                  Account
                </Link>

                {status === "authenticated" ? (
                  <Button
                    onClick={handleLogout}
                    className="mt-2 h-11 w-full rounded-xl bg-[#062c34] hover:bg-[#087f73]"
                  >
                    Log out
                  </Button>
                ) : status === "unauthenticated" ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="flex h-11 items-center justify-center rounded-xl border border-[#dcebe8] text-sm font-semibold text-[#526a71]"
                    >
                      Log in
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        navigate("/register");
                      }}
                      className="h-11 rounded-xl bg-[#062c34] text-sm font-semibold text-white"
                    >
                      Sign up
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* =========================================================
          MAIN
      ========================================================== */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="bg-[#062c34] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div className="max-w-sm">
              <Link
                to="/"
                className="inline-flex items-center gap-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#55d7c4] text-[#062c34]">
                  <ShieldPlus className="h-5 w-5" />
                </span>

                <span className="text-xl font-bold">
                  Tropikit
                </span>
              </Link>

              <p className="mt-5 text-sm leading-7 text-white/55">
                A travel-health companion helping travelers understand,
                prepare and stay informed before, during and after their
                journey.
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs text-white/45">
                <HeartPulse className="h-4 w-4 text-[#55d7c4]" />
                Travel health, made simple.
              </div>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-sm font-semibold text-white">
                Explore
              </h3>

              <div className="mt-5 grid gap-3">
                <Link
                  to="/destinations"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Destinations
                </Link>

                <Link
                  to="/checklist"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Checklist
                </Link>

                <Link
                  to="/stories"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Stories & audio
                </Link>

                <Link
                  to="/emergency"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Emergency
                </Link>
              </div>
            </div>

            {/* Plan */}
            <div>
              <h3 className="text-sm font-semibold text-white">
                Plan your trip
              </h3>

              <div className="mt-5 grid gap-3">
                <Link
                  to="/register"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Create an account
                </Link>

                <Link
                  to="/account/trips"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  My trips
                </Link>

                <Link
                  to="/checklist"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Travel checklist
                </Link>

                <Link
                  to="/destinations"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Destination health
                </Link>
              </div>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold text-white">
                Account
              </h3>

              <div className="mt-5 grid gap-3">
                <Link
                  to="/login"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Sign up
                </Link>

                <Link
                  to="/forgot-password"
                  className="text-sm text-white/55 transition hover:text-[#66e0cf]"
                >
                  Forgot password
                </Link>
              </div>
            </div>
          </div>

          <div className="my-10 h-px bg-white/10" />

          <div className="flex flex-col gap-5 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Tropikit. All rights reserved.
            </p>

            <p className="max-w-2xl leading-5 md:text-right">
              Tropikit provides general travel-health information and does not
              replace professional medical advice. Malaria medication selection
              should always be discussed with a qualified travel-health
              clinician.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}