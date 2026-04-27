import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Sparkles, Calendar, DollarSign, MapPin, Trophy, X, Users, Clock, Globe2, Landmark } from "lucide-react";
import { DC_PICKS, GLOBAL_PICKS, type Pick as TopPick } from "@/lib/topPicks";
import { SuggestionsBox } from "@/components/SuggestionsBox";
import coverRooftop from "@/assets/event-rooftop.jpg";
import coverVolleyball from "@/assets/event-volleyball.jpg";
import coverPotluck from "@/assets/event-potluck.jpg";
import coverPicnic from "@/assets/event-picnic.jpg";
import coverBrunch from "@/assets/event-brunch.jpg";
import coverJapan from "@/assets/event-japan.jpg";

const COVER_BY_TITLE: Record<string, string> = {
  "Sunset Rooftop Dinner": coverRooftop,
  "Beach Volleyball Saturday": coverVolleyball,
  "Friendsgiving Potluck": coverPotluck,
  "Cherry Blossom Picnic": coverPicnic,
  "Spring Brunch": coverBrunch,
  "Tokyo Trip 🇯🇵": coverJapan,
};
const KEYWORD_COVERS: { match: RegExp; img: string }[] = [
  { match: /tokyo|japan|kyoto|osaka/i, img: coverJapan },
  { match: /rooftop|dinner|sunset/i, img: coverRooftop },
  { match: /volleyball|beach|sport/i, img: coverVolleyball },
  { match: /potluck|thanksgiving|friendsgiving|turkey/i, img: coverPotluck },
  { match: /picnic|blossom|park/i, img: coverPicnic },
  { match: /brunch|breakfast|mimosa|pancake/i, img: coverBrunch },
];
const FALLBACK_COVERS = [coverRooftop, coverPicnic, coverBrunch, coverPotluck, coverVolleyball, coverJapan];
function coverFor(title: string, idx: number): string {
  if (COVER_BY_TITLE[title]) return COVER_BY_TITLE[title];
  for (const k of KEYWORD_COVERS) if (k.match.test(title)) return k.img;
  return FALLBACK_COVERS[idx % FALLBACK_COVERS.length];
}

export const Route = createFileRoute("/_authenticated/wrapped")({
  component: WrappedPage,
});

interface EventRow {
  id: string;
  title: string;
  scheduled_at: string | null;
  ended_at: string | null;
  location: string | null;
  host_id: string;
  created_at: string;
}
interface RsvpRow {
  event_id: string;
  user_id: string;
  status: "going" | "maybe" | "no" | "invited";
  checked_in_at: string | null;
  cancelled_at: string | null;
}
interface ExpenseRow {
  id: string;
  event_id: string;
  paid_by: string;
  amount: number;
  title: string;
}
interface ShareRow {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
}
interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}


function WrappedPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const yearStart = `${year}-01-01T00:00:00Z`;
      const yearEnd = `${year + 1}-01-01T00:00:00Z`;

      // Events the user is connected to (host or RSVP'd)
      const [{ data: myRsvps }, { data: hosted }] = await Promise.all([
        supabase.from("rsvps").select("*").eq("user_id", user.id),
        supabase
          .from("events")
          .select("*")
          .eq("host_id", user.id)
          .gte("created_at", yearStart)
          .lt("created_at", yearEnd),
      ]);

      const eventIds = new Set<string>(
        [...(hosted ?? []).map((e) => e.id), ...(myRsvps ?? []).map((r) => r.event_id)]
      );

      const { data: allEvents } = await supabase
        .from("events")
        .select("*")
        .in("id", Array.from(eventIds).length ? Array.from(eventIds) : ["00000000-0000-0000-0000-000000000000"]);

      const yearEvents = (allEvents ?? []).filter((e) => {
        const ref = e.scheduled_at ?? e.created_at;
        return ref && new Date(ref) >= new Date(yearStart) && new Date(ref) < new Date(yearEnd);
      });
      setEvents(yearEvents);

      const evIds = yearEvents.map((e) => e.id);
      if (evIds.length === 0) {
        setRsvps([]); setExpenses([]); setShares([]); setProfiles({}); setLoading(false); return;
      }

      const [{ data: rsvpRows }, { data: expRows }] = await Promise.all([
        supabase.from("rsvps").select("*").in("event_id", evIds),
        supabase.from("expenses").select("*").in("event_id", evIds),
      ]);
      setRsvps(rsvpRows ?? []);
      setExpenses(expRows ?? []);

      if (expRows && expRows.length) {
        const { data: shareRows } = await supabase
          .from("expense_shares")
          .select("*")
          .in("expense_id", expRows.map((e) => e.id));
        setShares(shareRows ?? []);
      } else {
        setShares([]);
      }

      const userIds = new Set<string>([user.id]);
      (rsvpRows ?? []).forEach((r) => userIds.add(r.user_id));
      yearEvents.forEach((e) => userIds.add(e.host_id));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", Array.from(userIds));
      setProfiles(Object.fromEntries((profs ?? []).map((p) => [p.id, p])));
      setLoading(false);
    };
    load();
  }, [user?.id, year]);

  const stats = useMemo(() => {
    if (!user) return null;
    const hosted = events.filter((e) => e.host_id === user.id);
    const myRsvps = rsvps.filter((r) => r.user_id === user.id);
    const attended = myRsvps.filter((r) => r.checked_in_at).length;
    const cancelled = myRsvps.filter((r) => r.cancelled_at).length;

    const myPaid = expenses
      .filter((e) => e.paid_by === user.id)
      .reduce((s, e) => s + Number(e.amount), 0);
    const groupTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const myShare = shares
      .filter((s) => s.user_id === user.id)
      .reduce((s, x) => s + Number(x.share_amount), 0);

    // Longest event by duration (scheduled_at -> ended_at)
    const durations = events
      .filter((e): e is EventRow & { scheduled_at: string; ended_at: string } => !!e.scheduled_at && !!e.ended_at)
      .map((e) => ({
        event: e,
        hours: (new Date(e.ended_at).getTime() - new Date(e.scheduled_at).getTime()) / 36e5,
      }))
      .sort((a, b) => b.hours - a.hours);
    const longest: { event: EventRow; hours: number } | null = durations[0] ?? null;

    // Most popular event (most "going")
    const goingByEvent: Record<string, number> = {};
    rsvps.forEach((r) => {
      if (r.status === "going") goingByEvent[r.event_id] = (goingByEvent[r.event_id] ?? 0) + 1;
    });
    const popularId = Object.entries(goingByEvent).sort((a, b) => b[1] - a[1])[0]?.[0];
    const popular = popularId ? events.find((e) => e.id === popularId) : null;

    // Distinct cities visited
    const cities = new Set(events.map((e) => e.location?.split(",")[0]?.trim()).filter(Boolean) as string[]);

    return {
      hostedCount: hosted.length,
      attendedCount: attended,
      cancelledCount: cancelled,
      totalEvents: events.length,
      myPaid,
      groupTotal,
      myShare,
      longest,
      popular,
      cities,
    };
  }, [events, rsvps, expenses, shares, user]);

  // Attendance % per friend (across events you both attended)
  const attendance = useMemo(() => {
    const byUser: Record<string, { invited: number; went: number }> = {};
    rsvps.forEach((r) => {
      if (r.user_id === user?.id) return;
      if (!byUser[r.user_id]) byUser[r.user_id] = { invited: 0, went: 0 };
      byUser[r.user_id].invited += 1;
      if (r.status === "going" || r.checked_in_at) byUser[r.user_id].went += 1;
    });
    return Object.entries(byUser)
      .map(([uid, { invited, went }]) => ({
        user: profiles[uid],
        rate: invited > 0 ? Math.round((went / invited) * 100) : 0,
        went,
        invited,
      }))
      .filter((x) => x.user)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8);
  }, [rsvps, profiles, user]);

  // Demo guest events to mix in alongside hosted ones (presentation only)
  const guestDemoHistory = useMemo(() => [
    {
      id: "demo-karaoke",
      title: "Karaoke Night 🎤",
      location: "Muzette — H Street",
      scheduled_at: `${year}-02-14T21:00:00Z`,
      hostUsername: "lydialiu",
      perspective: "Attended" as const,
    },
    {
      id: "demo-soccer",
      title: "Pickup Soccer ⚽",
      location: "Meridian Hill Park",
      scheduled_at: `${year}-03-08T15:00:00Z`,
      hostUsername: "alexkim",
      perspective: "Going" as const,
    },
    {
      id: "demo-birthday",
      title: "Maya's Birthday 🎂",
      location: "Le Diplomate — 14th St",
      scheduled_at: `${year}-04-04T23:00:00Z`,
      hostUsername: "mayapatel",
      perspective: "Maybe" as const,
    },
  ], [year]);

  type HistoryItem = {
    id: string;
    title: string;
    location: string | null;
    scheduled_at: string | null;
    hostUsername: string;
    perspective: "Hosted" | "Going" | "Maybe" | "Attended" | "Invited" | "Cancelled";
    isDemo?: boolean;
  };

  const sortedHistory = useMemo<HistoryItem[]>(() => {
    const real: HistoryItem[] = events.map((e) => {
      const myRsvp = rsvps.find((r) => r.event_id === e.id && r.user_id === user?.id);
      const perspective: HistoryItem["perspective"] = myRsvp?.checked_in_at
        ? "Attended"
        : myRsvp?.cancelled_at
        ? "Cancelled"
        : myRsvp?.status === "going"
        ? "Going"
        : myRsvp?.status === "maybe"
        ? "Maybe"
        : e.host_id === user?.id
        ? "Hosted"
        : "Invited";
      return {
        id: e.id,
        title: e.title,
        location: e.location,
        scheduled_at: e.scheduled_at ?? e.created_at,
        hostUsername: profiles[e.host_id]?.username ?? "user",
        perspective,
      };
    });
    const demo: HistoryItem[] = guestDemoHistory.map((d) => ({ ...d, location: d.location, isDemo: true }));
    return [...real, ...demo].sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return tb - ta;
    });
  }, [events, rsvps, profiles, user, guestDemoHistory]);

  const highlightEvents = sortedHistory.slice(0, 5);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-muted-foreground">Crunching your year…</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient text-black p-8 md:p-12 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-xs">Your Year, Linked</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-none mb-2">{year}</h1>
        <p className="text-sm md:text-base font-semibold opacity-80 max-w-xl">
          Every plan, every cancel, every split bill. Here's how you showed up.
        </p>

        <div className="absolute top-4 right-4 flex gap-2">
          {[year - 1, year, year + 1].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                y === year ? "bg-black text-brand-yellow" : "bg-black/10 hover:bg-black/20"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </section>

      {/* Top stats grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Events organized"
          value={stats?.hostedCount ?? 0}
          accent="yellow"
          sub={`${stats?.totalEvents ?? 0} events total`}
        />
        <StatCard
          icon={<X className="w-5 h-5" />}
          label="Plans cancelled"
          value={stats?.cancelledCount ?? 0}
          accent="pink"
          sub={(stats?.cancelledCount ?? 0) === 0 ? "Reliable as ever 👑" : "It happens"}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Money spent"
          value={`$${(stats?.myPaid ?? 0).toFixed(0)}`}
          accent="yellow"
          sub={`Your share: $${(stats?.myShare ?? 0).toFixed(0)}`}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Group spend"
          value={`$${(stats?.groupTotal ?? 0).toFixed(0)}`}
          accent="pink"
          sub="Across all your crews"
        />
      </section>

      {/* Highlights row */}
      <section className="bg-card border border-border rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Highlights</h2>
        {highlightEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No events this year yet — start one and they'll show up here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {highlightEvents.map((e, i) => (
              <Link
                key={e.id}
                to="/events"
                className={`group relative rounded-2xl overflow-hidden bg-input ${
                  i === 0 ? "row-span-2 col-span-2 md:col-span-2 md:row-span-2 aspect-square" : "aspect-[4/3]"
                }`}
              >
                <img
                  src={coverFor(e.title, i)}
                  alt={e.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className={`font-bold text-white ${i === 0 ? "text-lg md:text-2xl" : "text-sm"}`}>
                    {e.title}
                  </p>
                  {e.scheduled_at && (
                    <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">
                      {new Date(e.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Standout moments */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-yellow" /> Standouts
          </h2>
          <div className="space-y-4">
            <Standout
              icon={<Clock className="w-4 h-4" />}
              label="Longest event"
              value={
                stats?.longest
                  ? `${stats.longest.event.title}`
                  : "—"
              }
              sub={stats?.longest ? `${stats.longest.hours.toFixed(1)} hours` : "No multi-hour events logged"}
            />
            <Standout
              icon={<Users className="w-4 h-4" />}
              label="Most popular"
              value={stats?.popular?.title ?? "—"}
              sub={stats?.popular ? "Biggest 'going' list of the year" : "No RSVPs yet"}
            />
            <Standout
              icon={<MapPin className="w-4 h-4" />}
              label="Places visited"
              value={`${stats?.cities.size ?? 0}`}
              sub={
                (stats?.cities.size ?? 0) > 0
                  ? Array.from(stats!.cities).slice(0, 3).join(" • ")
                  : "Add a location next time!"
              }
            />
          </div>
        </section>

        {/* Attendance stats */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-1">Attendance Stats</h2>
          <p className="text-xs text-muted-foreground mb-4">Who actually shows up.</p>
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No friend RSVP data yet.</p>
          ) : (
            <ul className="space-y-3">
              {attendance.map((a) => (
                <li key={a.user.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold">
                      <span className="text-brand-yellow">@{a.user.username}</span>{" "}
                      <span className="text-muted-foreground font-normal">{a.user.display_name}</span>
                    </span>
                    <span className="text-xs font-bold text-brand-pink">
                      {a.rate}% <span className="text-muted-foreground font-normal">({a.went}/{a.invited})</span>
                    </span>
                  </div>
                  <div className="h-2 bg-input rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-gradient transition-all"
                      style={{ width: `${a.rate}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Local & Global breakdown + curated recommendations */}
      {(() => {
        const isLocal = (loc: string | null) =>
          !!loc && /\b(d\.?c\.?|washington|dmv|arlington|alexandria|bethesda|silver spring|georgetown|foggy bottom|capitol hill|navy yard|nova|virginia|maryland)\b/i.test(loc);
        const localCount = events.filter((e) => isLocal(e.location)).length;
        const awayCount = events.filter((e) => e.location && !isLocal(e.location)).length;
        const total = Math.max(1, localCount + awayCount);
        const localPct = Math.round((localCount / total) * 100);
        const awayPct = 100 - localPct;
        // Recommend the side they've explored less.
        const leanLocal = awayCount >= localCount;
        const localRecs = DC_PICKS.slice(0, 3);
        const globalRecs = GLOBAL_PICKS.slice(0, 3);
        return (
          <section className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-pink" /> Local vs Global
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Your year on the map</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {localCount + awayCount === 0
                ? "No locations logged yet — add some on your next event!"
                : leanLocal
                  ? "You stayed local most of the year. Maybe a trip is in order?"
                  : "You traveled a lot this year! Don't forget the gems back home."}
            </p>

            {(localCount + awayCount) > 0 && (
              <div className="mb-5">
                <div className="flex h-3 rounded-full overflow-hidden bg-input">
                  <div className="bg-brand-yellow" style={{ width: `${localPct}%` }} />
                  <div className="bg-brand-pink" style={{ width: `${awayPct}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="font-bold text-brand-yellow">🏛️ DC / Local · {localCount} ({localPct}%)</span>
                  <span className="font-bold text-brand-pink">🌍 Global · {awayCount} ({awayPct}%)</span>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <RecCard
                icon={<Landmark className="w-4 h-4" />}
                heading="Top spots in D.C."
                badge={leanLocal ? undefined : "Recommended for you"}
                picks={localRecs}
              />
              <RecCard
                icon={<Globe2 className="w-4 h-4" />}
                heading="Bucket list, worldwide"
                badge={leanLocal ? "Recommended for you" : undefined}
                picks={globalRecs}
              />
            </div>
          </section>
        );
      })()}

      {/* Subtle additional inspiration */}
      <SuggestionsBox />


      {/* Event history */}

      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">Event History</h2>
        <p className="text-xs text-muted-foreground mb-4">{sortedHistory.length} event{sortedHistory.length === 1 ? "" : "s"} in {year} — tap to revisit.</p>
        {sortedHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Your year is wide open.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sortedHistory.map((e) => {
              const myRsvp = rsvps.find((r) => r.event_id === e.id && r.user_id === user?.id);
              const wentBadge = myRsvp?.checked_in_at
                ? { label: "Attended", cls: "bg-going/20 text-going border-going/40" }
                : myRsvp?.cancelled_at
                ? { label: "Cancelled", cls: "bg-no/20 text-no border-no/40" }
                : myRsvp?.status === "going"
                ? { label: "Going", cls: "bg-going/20 text-going border-going/40" }
                : myRsvp?.status === "maybe"
                ? { label: "Maybe", cls: "bg-maybe/20 text-maybe border-maybe/40" }
                : e.host_id === user?.id
                ? { label: "Hosted", cls: "bg-brand-yellow/20 text-brand-yellow border-brand-yellow/40" }
                : { label: "Invited", cls: "bg-muted/30 text-muted-foreground border-border" };
              return (
                <li key={e.id}>
                  <Link
                    to="/events"
                    className="flex items-center gap-3 py-3 hover:bg-input/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="w-12 text-center shrink-0">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">
                        {e.scheduled_at ? new Date(e.scheduled_at).toLocaleDateString(undefined, { month: "short" }) : "—"}
                      </div>
                      <div className="text-xl font-bold text-brand-yellow leading-none">
                        {e.scheduled_at ? new Date(e.scheduled_at).getDate() : "?"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {e.location ? `📍 ${e.location}` : "No location"}
                        {" • "}
                        Hosted by @{profiles[e.host_id]?.username ?? "user"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${wentBadge.cls}`}>
                      {wentBadge.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: "yellow" | "pink";
}) {
  const accentText = accent === "yellow" ? "text-brand-yellow" : "text-brand-pink";
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-brand-yellow transition-colors">
      <div className={`flex items-center gap-2 ${accentText} mb-2`}>{icon}<span className="text-[11px] uppercase tracking-wider font-bold">{label}</span></div>
      <div className={`text-4xl font-black ${accentText}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Standout({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-input rounded-xl p-3">
      <div className="text-brand-pink mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
        <div className="font-bold truncate">{value}</div>
        {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
      </div>
    </div>
  );
}

function RecCard({
  icon,
  heading,
  badge,
  picks,
}: {
  icon: React.ReactNode;
  heading: string;
  badge?: string;
  picks: TopPick[];
}) {
  return (
    <div className="bg-input rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-brand-yellow">
          {icon}
          <h3 className="font-bold text-sm">{heading}</h3>
        </div>
        {badge && (
          <span className="text-[9px] uppercase tracking-wider font-black bg-brand-gradient text-black px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {picks.map((p) => (
          <li key={p.name} className="flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5">{p.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-bold text-sm">{p.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{p.category}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{p.area}</div>
              <div className="text-xs text-muted-foreground/80">{p.blurb}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
