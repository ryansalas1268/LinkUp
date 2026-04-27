import { Link, useNavigate } from "@tanstack/react-router";
import { Star, LogOut } from "lucide-react";
import logo from "@/assets/linkup-logo-transparent.png";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

const linkClass =
  "text-foreground font-semibold hover:text-brand-yellow transition-colors text-sm md:text-base";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { isActive } = useSubscription();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <nav className="bg-card border-b-2 border-brand-pink px-6 md:px-10 py-4 flex justify-between items-center sticky top-0 z-40">
      <Link to="/" className="flex items-center">
        <img src={logo} alt="LinkUp" className="h-20 md:h-24 w-auto" />
      </Link>
      <div className="flex items-center gap-4 md:gap-7 flex-wrap justify-end">
        {user ? (
          <>
            <Link to="/events" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>My Events</Link>
            <Link to="/calendar" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>My Calendar</Link>
            <Link to="/friends" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>Friends</Link>
            <Link to="/messages" search={{ conversation: undefined }} className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>Messages</Link>
            <Link to="/wrapped" className={linkClass} activeProps={{ className: `${linkClass} text-brand-yellow` }}>Wrapped</Link>
            <span className="hidden md:inline text-sm text-brand-yellow font-bold">@{profile?.username ?? "..."}</span>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-foreground hover:text-brand-pink"
            >
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
          <Star className="w-4 h-4 fill-black" /> {isActive ? "Premium ✓" : "Upgrade Premium"}
        </Link>
      </div>
    </nav>
  );
}
