import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShieldPlus, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_LINKS: { to: string; label: string }[] = [
  { to: "/destinations", label: "Destinations" },
  { to: "/checklist", label: "Checklist" },
  { to: "/stories", label: "Stories" },
  { to: "/emergency", label: "Emergency" },
];

export function SiteLayout() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu automatically on every navigation, so it never stays open
  // after the user taps a link.
  useClosePanelOnRouteChange(location.pathname, () => setMenuOpen(false));

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldPlus className="h-5 w-5 text-primary" />
            Tropikit
          </Link>

          {/* Desktop nav: full link row, hidden below sm since it doesn't fit at
              360-430px viewports alongside the logo and auth actions. */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground">
                {l.label}
              </Link>
            ))}
            {status === "authenticated" ? (
              <>
                <Link to="/account/trips" className="text-muted-foreground hover:text-foreground">
                  My trips
                </Link>
                <Link to="/account" className="text-muted-foreground hover:text-foreground">
                  Account
                </Link>
                <span className="text-muted-foreground hidden lg:inline">{user?.email}</span>
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : status === "unauthenticated" ? (
              <>
                <Link to="/login" className="text-muted-foreground hover:text-foreground">
                  Log in
                </Link>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Sign up
                </Button>
              </>
            ) : null}
          </div>

          {/* Mobile menu toggle: shown only below sm, replaces the link row entirely
              rather than trying to shrink it, which is what was overflowing before. */}
          <button
            type="button"
            className="sm:hidden p-2 -mr-2 text-foreground"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1 text-sm">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="py-2 text-foreground hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {status === "authenticated" ? (
              <>
                <Link
                  to="/account/trips"
                  className="py-2 text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  My trips
                </Link>
                <Link
                  to="/account"
                  className="py-2 text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                <span className="py-2 text-muted-foreground text-xs">{user?.email}</span>
                <Button size="sm" variant="outline" className="mt-1 w-full" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : status === "unauthenticated" ? (
              <>
                <Link
                  to="/login"
                  className="py-2 text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Button
                  size="sm"
                  className="mt-1 w-full"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/register");
                  }}
                >
                  Sign up
                </Button>
              </>
            ) : null}
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground px-4">
        <p className="max-w-2xl mx-auto text-xs leading-relaxed">
          Tropikit provides general travel-health information and does not replace
          professional medical advice. Malaria medication selection should always be
          discussed with a qualified travel-health clinician.
        </p>
        <p className="mt-3">Tropikit · Travel health for the tropics</p>
      </footer>
    </div>
  );
}

// Small local hook, not worth its own file: closes the mobile panel whenever the route
// changes, without needing a useEffect that references the whole location object.
function useClosePanelOnRouteChange(pathname: string, onChange: () => void) {
  const [prev, setPrev] = useState(pathname);
  if (prev !== pathname) {
    setPrev(pathname);
    onChange();
  }
}
