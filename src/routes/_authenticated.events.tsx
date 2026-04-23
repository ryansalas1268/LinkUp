import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, DollarSign, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduled_at: string | null;
  host_id: string;
}

interface RsvpRow {
  event_id: string;
  user_id: string;
  status: "going" | "maybe" | "no";
}

interface ProposalRow {
  id: string;
  event_id: string;
  proposed_time: string;
  label: string | null;
  proposed_by: string;
}

interface VoteRow {
  proposal_id: string;
  user_id: string;
}

interface TaskRow {
  id: string;
  event_id: string;
  task_name: string;
  priority: "high" | "med" | "low";
  completed: boolean;
  created_by: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
}

interface ExpenseRow {
  id: string;
  event_id: string;
  paid_by: string;
  title: string;
  amount: number;
  notes: string | null;
}

interface ExpenseShareRow {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
}

function EventsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [shares, setShares] = useState<ExpenseShareRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [showNew, setShowNew] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", location: "", scheduled_at: "" });
  const [newTask, setNewTask] = useState({ name: "", priority: "med" as const });
  const [newProposal, setNewProposal] = useState("");
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", notes: "" });

  const activeEvent = events.find((e) => e.id === activeId);

  const loadAll = async () => {
    const { data: evs } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    setEvents(evs ?? []);
    if (evs && evs.length && !activeId) setActiveId(evs[0].id);

    const { data: profs } = await supabase.from("profiles").select("id, username, display_name");
    if (profs) setProfiles(Object.fromEntries(profs.map((p) => [p.id, p])));
  };

  const loadEventDetails = async (eventId: string) => {
    const [{ data: r }, { data: p }, { data: t }, { data: ex }] = await Promise.all([
      supabase.from("rsvps").select("*").eq("event_id", eventId),
      supabase.from("time_proposals").select("*").eq("event_id", eventId).order("proposed_time"),
      supabase.from("tasks").select("*").eq("event_id", eventId).order("created_at"),
      supabase.from("expenses").select("*").eq("event_id", eventId).order("created_at"),
    ]);
    setRsvps(r ?? []);
    setProposals(p ?? []);
    setTasks(t ?? []);
    setExpenses(ex ?? []);

    if (p && p.length) {
      const { data: v } = await supabase.from("time_votes").select("*").in("proposal_id", p.map((x) => x.id));
      setVotes(v ?? []);
    } else {
      setVotes([]);
    }

    if (ex && ex.length) {
      const { data: sh } = await supabase.from("expense_shares").select("*").in("expense_id", ex.map((x) => x.id));
      setShares(sh ?? []);
    } else {
      setShares([]);
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (activeId) loadEventDetails(activeId); }, [activeId]);

  const createEvent = async () => {
    if (!newEvent.title || !user) { toast.error("Event needs a title"); return; }
    const { data, error } = await supabase
      .from("events")
      .insert({
        host_id: user.id,
        title: newEvent.title,
        description: newEvent.description || null,
        location: newEvent.location || null,
        scheduled_at: newEvent.scheduled_at || null,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success("Event created!");
    setNewEvent({ title: "", description: "", location: "", scheduled_at: "" });
    setShowNew(false);
    setEvents([data, ...events]);
    setActiveId(data.id);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Event deleted");
    const remaining = events.filter((e) => e.id !== id);
    setEvents(remaining);
    setActiveId(remaining[0]?.id ?? null);
  };

  const setRSVP = async (status: "going" | "maybe" | "no") => {
    if (!activeId || !user) return;
    const { error } = await supabase
      .from("rsvps")
      .upsert({ event_id: activeId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success(`RSVP set to ${status}`);
    loadEventDetails(activeId);
  };

  const addProposal = async () => {
    if (!newProposal || !activeId || !user) return;
    const { error } = await supabase.from("time_proposals").insert({
      event_id: activeId,
      proposed_by: user.id,
      proposed_time: newProposal,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Time proposed!");
    setNewProposal("");
    loadEventDetails(activeId);
  };

  const vote = async (proposalId: string) => {
    if (!user) return;
    const existing = votes.find((v) => v.proposal_id === proposalId && v.user_id === user.id);
    if (existing) {
      await supabase.from("time_votes").delete().eq("proposal_id", proposalId).eq("user_id", user.id);
    } else {
      await supabase.from("time_votes").insert({ proposal_id: proposalId, user_id: user.id });
    }
    loadEventDetails(activeId!);
  };

  const addTask = async () => {
    if (!newTask.name || !activeId || !user) return;
    const { error } = await supabase.from("tasks").insert({
      event_id: activeId,
      created_by: user.id,
      task_name: newTask.name,
      priority: newTask.priority,
    });
    if (error) { toast.error(error.message); return; }
    setNewTask({ name: "", priority: "med" });
    loadEventDetails(activeId);
  };

  const toggleTask = async (t: TaskRow) => {
    await supabase.from("tasks").update({ completed: !t.completed }).eq("id", t.id);
    loadEventDetails(activeId!);
  };

  const addExpense = async () => {
    if (!newExpense.title || !newExpense.amount || !activeId || !user) {
      toast.error("Expense needs a title and amount");
      return;
    }
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount < 0) { toast.error("Enter a valid amount"); return; }

    const { data: exp, error } = await supabase
      .from("expenses")
      .insert({
        event_id: activeId,
        paid_by: user.id,
        title: newExpense.title,
        amount,
        notes: newExpense.notes || null,
      })
      .select()
      .single();
    if (error || !exp) { toast.error(error?.message ?? "Failed"); return; }

    // Default: split equally among everyone who RSVP'd "going" (or just the payer if no one yet)
    const goingUsers = rsvps.filter((r) => r.status === "going").map((r) => r.user_id);
    const splitAmong = goingUsers.length > 0 ? goingUsers : [user.id];
    const perPerson = Math.round((amount / splitAmong.length) * 100) / 100;

    const sharesToInsert = splitAmong.map((uid) => ({
      expense_id: exp.id,
      user_id: uid,
      share_amount: perPerson,
    }));
    await supabase.from("expense_shares").insert(sharesToInsert);

    toast.success("Expense added!");
    setNewExpense({ title: "", amount: "", notes: "" });
    loadEventDetails(activeId);
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Expense removed");
    loadEventDetails(activeId!);
  };

  const updateShare = async (shareId: string, amount: number) => {
    if (isNaN(amount) || amount < 0) return;
    await supabase.from("expense_shares").update({ share_amount: amount }).eq("id", shareId);
    loadEventDetails(activeId!);
  };

  const myRsvp = rsvps.find((r) => r.user_id === user?.id)?.status;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const totalBudget = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const myShare = shares
    .filter((s) => s.user_id === user?.id)
    .reduce((sum, s) => sum + Number(s.share_amount), 0);

  const priorityIcon = { high: "🔴", med: "🟡", low: "🟢" };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Events</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-brand-gradient text-black font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {showNew && (
        <div className="bg-card border border-brand-yellow rounded-xl p-6 mb-6 space-y-3">
          <input
            placeholder="Event title (e.g. Beach trip 🔥)"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="w-full bg-input px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
          />
          <input
            placeholder="Location"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            className="w-full bg-input px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
          />
          <input
            type="datetime-local"
            value={newEvent.scheduled_at}
            onChange={(e) => setNewEvent({ ...newEvent, scheduled_at: e.target.value })}
            className="w-full bg-input px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
          />
          <textarea
            placeholder="Description (optional)"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            className="w-full bg-input px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={createEvent} className="bg-brand-gradient text-black font-bold px-5 py-2 rounded-lg">Create</button>
            <button onClick={() => setShowNew(false)} className="bg-input px-5 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No events yet — create your first one above!</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="space-y-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase mb-2">Your events</h2>
            {events.map((e) => (
              <button
                key={e.id}
                onClick={() => setActiveId(e.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeId === e.id
                    ? "bg-card border-brand-pink"
                    : "bg-card border-border hover:border-brand-yellow"
                }`}
              >
                <div className="font-bold truncate">{e.title}</div>
                {e.scheduled_at && (
                  <div className="text-xs text-brand-yellow mt-1">
                    {new Date(e.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                )}
              </button>
            ))}
          </aside>

          {activeEvent && (
            <div className="grid xl:grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-6">
                <section className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{activeEvent.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        Hosted by {profiles[activeEvent.host_id]?.display_name ?? "Unknown"}
                        {activeEvent.location && <> • <MapPin className="w-3 h-3 inline" /> {activeEvent.location}</>}
                      </p>
                      {activeEvent.scheduled_at && (
                        <p className="text-sm text-brand-yellow mt-1">
                          {new Date(activeEvent.scheduled_at).toLocaleString()}
                        </p>
                      )}
                      {activeEvent.description && <p className="mt-3 text-sm">{activeEvent.description}</p>}
                    </div>
                    {activeEvent.host_id === user?.id && (
                      <button onClick={() => deleteEvent(activeEvent.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-5">
                    <h3 className="font-bold mb-2">Your RSVP:</h3>
                    <div className="flex gap-2">
                      {(["going", "maybe", "no"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setRSVP(s)}
                          className={`flex-1 py-2.5 rounded-lg font-bold border transition-all ${
                            myRsvp === s ? "scale-105" : ""
                          } ${
                            s === "going" ? "bg-going/20 text-going border-going" :
                            s === "maybe" ? "bg-maybe/20 text-maybe border-maybe" :
                            "bg-no/20 text-no border-no"
                          }`}
                        >
                          {s === "going" ? "Going ✅" : s === "maybe" ? "Maybe 🤔" : "Can't go ❌"}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-1">Vote on a Time 🕒</h2>
                  <p className="text-sm text-muted-foreground mb-4">Select the time that works best for you!</p>

                  <div className="space-y-2 mb-4">
                    {proposals.length === 0 && <p className="text-sm text-muted-foreground italic">No times proposed yet.</p>}
                    {proposals.map((p) => {
                      const count = votes.filter((v) => v.proposal_id === p.id).length;
                      const voted = votes.some((v) => v.proposal_id === p.id && v.user_id === user?.id);
                      return (
                        <div key={p.id} className="flex items-center gap-3 bg-input p-3 rounded-lg">
                          <button
                            onClick={() => vote(p.id)}
                            className={`px-3 py-1 rounded font-bold text-sm ${voted ? "bg-brand-yellow text-black" : "bg-brand-pink text-black"}`}
                          >
                            {voted ? "✓" : "+1"}
                          </button>
                          <span className="flex-1">{new Date(p.proposed_time).toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">{count} vote{count === 1 ? "" : "s"}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <input
                      type="datetime-local"
                      value={newProposal}
                      onChange={(e) => setNewProposal(e.target.value)}
                      className="flex-1 bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
                    />
                    <button onClick={addProposal} className="bg-brand-gradient text-black font-bold px-5 py-2 rounded-lg">Propose</button>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-3">Group To-Do 📋</h2>
                  <div className="h-2 bg-input rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{progress}% Completed ({completedCount}/{tasks.length})</p>

                  <div className="flex gap-2 mb-3">
                    <input
                      placeholder="What needs to be done?"
                      value={newTask.name}
                      onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                      className="flex-1 bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm"
                    />
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as typeof newTask.priority })}
                      className="bg-input px-2 py-2 rounded-lg border border-border text-sm"
                    >
                      <option value="high">🔴</option>
                      <option value="med">🟡</option>
                      <option value="low">🟢</option>
                    </select>
                    <button onClick={addTask} className="bg-brand-gradient text-black font-bold px-4 py-2 rounded-lg text-sm">Add</button>
                  </div>

                  <ul className="space-y-2">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                        <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t)} className="accent-brand-yellow w-4 h-4" />
                        <span className={t.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                          {priorityIcon[t.priority]} {t.task_name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-3">Guestlist 👥</h2>
                  <ul className="space-y-2">
                    {rsvps.length === 0 && <li className="text-sm text-muted-foreground italic">No RSVPs yet.</li>}
                    {rsvps.map((r) => {
                      const p = profiles[r.user_id];
                      return (
                        <li key={r.user_id} className="flex items-center gap-2 text-sm">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            r.status === "going" ? "bg-going" : r.status === "maybe" ? "bg-maybe" : "bg-no"
                          }`} />
                          <span className="text-brand-yellow font-bold">@{p?.username ?? "user"}</span>
                          <span className="text-muted-foreground">"{p?.display_name ?? "?"}"</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            ({r.status === "no" ? "Can't go" : r.status})
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
