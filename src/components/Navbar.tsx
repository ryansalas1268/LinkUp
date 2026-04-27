import { Link, useNavigate } from "@tanstack/react-router";
import { Star, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/linkup-logo-transparent.png";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

const linkClass =
  "text-foreground font-semibold hover:text-brand-yellow transition-colors text-base";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { isActive } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/login" });
  };

  const closeMenu = () => setOpen(false);

  return (
    <nav className="bg-card border-b-2 border-brand-pink px-4 sm:px-6 md:px-10 py-3 md:py-4 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <img src={logo} alt="LinkUp" className="h-12 sm:h-16 md:h-24 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-7">
          {user ? (
            <>
              <Link to="/events" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>My Events</Link>
              <Link to="/calendar" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>My Calendar</Link>
              <Link to="/friends" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>Friends</Link>
              <Link to="/messages" search={{ conversation: undefined }} className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>Messages</Link>
              <Link to="/wrapped" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>Wrapped</Link>
              <span className="text-sm text-brand-yellow font-bold">@{profile?.username ?? "..."}</span>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-foreground hover:text-brand-pink">
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/signup" className={linkClass}>Sign up</Link>
            </>
          )}
          <Link
            to="/upgrade"
            className="bg-brand-gradient text-black font-bold px-4 py-2 rounded-full text-sm shadow-brand hover:scale-105 transition-transform flex items-center gap-1"
          >
            <Star className="w-4 h-4 fill-black" /> {isActive ? "Premium ✓" : "Upgrade"}
          </Link>
        </div>

        {/* Mobile/tablet trigger */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            to="/upgrade"
            onClick={closeMenu}
            className="bg-brand-gradient text-black font-bold px-3 py-1.5 rounded-full text-xs shadow-brand flex items-center gap-1"
          >
            <Star className="w-3.5 h-3.5 fill-black" /> {isActive ? "✓" : "Upgrade"}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg hover:bg-input text-foreground"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden mt-3 pt-3 border-t border-border flex flex-col gap-1">
          {user ? (
            <>
              <Link to="/events" onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold" activeProps={{ className: "px-3 py-3 rounded-lg bg-input text-brand-yellow font-semibold" }}>My Events</Link>
              <Link to="/calendar" onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold" activeProps={{ className: "px-3 py-3 rounded-lg bg-input text-brand-yellow font-semibold" }}>My Calendar</Link>
              <Link to="/friends" onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold" activeProps={{ className: "px-3 py-3 rounded-lg bg-input text-brand-yellow font-semibold" }}>Friends</Link>
              <Link to="/messages" search={{ conversation: undefined }} onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold" activeProps={{ className: "px-3 py-3 rounded-lg bg-input text-brand-yellow font-semibold" }}>Messages</Link>
              <Link to="/wrapped" onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold" activeProps={{ className: "px-3 py-3 rounded-lg bg-input text-brand-yellow font-semibold" }}>Wrapped</Link>
              <div className="flex items-center justify-between px-3 py-2 mt-1 border-t border-border">
                <span className="text-sm text-brand-yellow font-bold">@{profile?.username ?? "..."}</span>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-foreground hover:text-brand-pink">
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold">Login</Link>
              <Link to="/signup" onClick={closeMenu} className="px-3 py-3 rounded-lg hover:bg-input font-semibold">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
