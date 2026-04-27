import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ChevronLeft, ChevronRight, ChevronDown, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

interface EventRow {
  id: string;
  title: string;
  location: string | null;
  scheduled_at: string | null;
}

interface TaskRow {
  id: string;
  task_name: string;
  completed: boolean;
  event_id: string;
  priority: "high" | "med" | "low";
}

const PRIORITY_RANK: Record<"high" | "med" | "low", number> = { high: 0, med: 1, low: 2 };
const PRIORITY_META: Record<"high" | "med" | "low", { label: string; className: string }> = {
  high: { label: "High", className: "bg-no/20 text-no border-no" },
  med: { label: "Med", className: "bg-maybe/20 text-maybe border-maybe" },
  low: { label: "Low", className: "bg-going/20 text-going border-going" },
};

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarPage() {
  const { user } = useAuth();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tasks, setTasks] = useState<(TaskRow & { event_title?: string })[]>([]);
  const [openEvents, setOpenEvents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("id, title, location, scheduled_at")
        .not("scheduled_at", "is", null)
        .order("scheduled_at");
      setEvents(ev ?? []);

      if (user) {
        const { data: ts } = await supabase
          .from("tasks")
          .select("id, task_name, completed, event_id, priority, events(title)")
          .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
        setTasks(
          (ts ?? []).map((t: any) => ({
            id: t.id,
            task_name: t.task_name,
            completed: t.completed,
            event_id: t.event_id,
            priority: t.priority,
            event_title: t.events?.title,
          }))
        );
      }
    })();
  }, [user]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDays = new Set(
    events
      .filter((e) => {
        if (!e.scheduled_at) return false;
        const d = new Date(e.scheduled_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map((e) => new Date(e.scheduled_at!).getDate())
  );

  const upcoming = events
    .filter((e) => e.scheduled_at && new Date(e.scheduled_at) >= new Date(new Date().toDateString()))
    .slice(0, 5);

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
  };

  const toggleTask = async (t: TaskRow) => {
    await supabase.from("tasks").update({ completed: !t.completed }).eq("id", t.id);
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, completed: !t.completed } : x)));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start">
        <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <button onClick={() => changeMonth(-1)} className="bg-input border border-border text-brand-yellow px-3 sm:px-4 py-1.5 rounded-lg hover:bg-card font-bold">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold">{monthNames[month]} {year}</h2>
            <button onClick={() => changeMonth(1)} className="bg-input border border-border text-brand-yellow px-3 sm:px-4 py-1.5 rounded-lg hover:bg-card font-bold">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="font-bold text-brand-pink text-xs sm:text-sm">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const hasEvent = eventDays.has(d);
              return (
                <div
                  key={d}
                  className={`min-h-[44px] sm:min-h-[80px] flex items-center justify-center font-bold text-sm sm:text-xl rounded-lg cursor-pointer transition-colors relative ${
                    isToday ? "bg-brand-gradient text-black" :
                    hasEvent ? "bg-input border-2 border-brand-yellow hover:bg-card" :
                    "bg-input hover:bg-card"
                  }`}
                >
                  {d}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-yellow" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-8 sm:space-y-6">
          <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
            <h2 className="text-xl font-bold mb-4">Upcoming Events 📅</h2>
            <ul className="space-y-4 border-l-2 border-border pl-4 ml-2">
              {upcoming.length === 0 && <li className="text-sm text-muted-foreground italic">Nothing scheduled.</li>}
              {upcoming.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-brand-pink" />
                  <div className="text-brand-yellow font-bold text-sm">
                    {new Date(e.scheduled_at!).toLocaleDateString(undefined, { month: "short", day: "numeric" })} • {new Date(e.scheduled_at!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div className="font-bold">{e.title}</div>
                  {e.location && <div className="text-sm text-muted-foreground"><MapPin className="w-3 h-3 inline" /> {e.location}</div>}
                </li>
              ))}
            </ul>
          </section>

          <section className="sm:bg-card sm:border sm:border-border rounded-xl p-0 sm:p-6">
            <h2 className="text-xl font-bold mb-1">My Tasks 📋</h2>
            <p className="text-sm text-muted-foreground mb-4">Grouped by event, sorted by urgency</p>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No tasks yet.</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(
                  tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
                    const key = t.event_id;
                    (acc[key] ||= []).push(t);
                    return acc;
                  }, {})
                )
                  .map(([eventId, group]) => {
                    const sorted = [...group].sort((a, b) => {
                      if (a.completed !== b.completed) return a.completed ? 1 : -1;
                      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
                    });
                    const topRank = Math.min(
                      ...group.filter((t) => !t.completed).map((t) => PRIORITY_RANK[t.priority]),
                      99
                    );
                    return { eventId, sorted, title: group[0].event_title ?? "Event", topRank };
                  })
                  .sort((a, b) => a.topRank - b.topRank)
                  .map(({ eventId, sorted, title }) => {
                    const remaining = sorted.filter((t) => !t.completed).length;
                    const isOpen = openEvents[eventId] ?? remaining > 0;
                    return (
                      <div key={eventId} className="bg-input border border-border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenEvents((prev) => ({ ...prev, [eventId]: !isOpen }))}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-card transition-colors"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-bold text-brand-pink uppercase tracking-wide flex-1 text-left truncate">
                            {title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              remaining > 0
                                ? "bg-brand-gradient text-black"
                                : "bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {remaining > 0 ? `${remaining} left` : "All done"}
                          </span>
                        </button>
                        {isOpen && (
                          <ul className="px-3 pb-2">
                            {sorted.map((t) => {
                              const meta = PRIORITY_META[t.priority];
                              return (
                                <li key={t.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                                  <input
                                    type="checkbox"
                                    checked={t.completed}
                                    onChange={() => toggleTask(t)}
                                    className="accent-brand-yellow w-4 h-4"
                                  />
                                  <span className={`flex-1 text-sm ${t.completed ? "line-through text-muted-foreground" : ""}`}>
                                    {t.task_name}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.className}`}>
                                    {meta.label}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
