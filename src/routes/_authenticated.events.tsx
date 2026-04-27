import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, DollarSign, X, MessageCircle, CheckCircle2, Ban, AlertTriangle } from "lucide-react";
import { getLifecycleState, getLifecycleMeta, type LifecycleState } from "@/lib/lifecycle";
import { validateEventTitle, BR } from "@/lib/businessRules";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduled_at: string | null;
  ended_at: string | null;
  host_id: string;
}

interface RsvpRow {
  event_id: string;
  user_id: string;
  status: "going" | "maybe" | "no" | "invited";
  checked_in_at: string | null;
  cancelled_at: string | null;
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
  assigned_to: string | null;
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
  const navigate = useNavigate();
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
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    notes: "",
    splitMode: "equal" as "equal" | "payer" | "custom",
    paidBy: "" as string,
    participants: [] as string[],
  });
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<ProfileRow[]>([]);
  const [myRsvpsByEvent, setMyRsvpsByEvent] = useState<Record<string, RsvpRow>>({});

  const activeEvent = events.find((e) => e.id === activeId);

  const loadAll = async () => {
    const { data: evs } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    setEvents(evs ?? []);
    if (evs && evs.length && !activeId) setActiveId(evs[0].id);

    const { data: profs } = await supabase.from("profiles").select("id, username, display_name");
    if (profs) setProfiles(Object.fromEntries(profs.map((p) => [p.id, p])));

    if (user) {
      const { data: mine } = await supabase.from("rsvps").select("*").eq("user_id", user.id);
      if (mine) setMyRsvpsByEvent(Object.fromEntries(mine.map((r) => [r.event_id, r as RsvpRow])));
    }
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

    // keep my-rsvps map in sync for sidebar badges
    if (user) {
      const mine = (r ?? []).find((x: RsvpRow) => x.user_id === user.id);
      setMyRsvpsByEvent((prev) => {
        const next = { ...prev };
        if (mine) next[eventId] = mine as RsvpRow;
        else delete next[eventId];
        return next;
      });
    }

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

  useEffect(() => { loadAll(); }, [user?.id]);
  useEffect(() => { if (activeId) loadEventDetails(activeId); }, [activeId]);

  const createEvent = async () => {
    if (!user) return;
    // BR010: title required, max 50 chars
    const titleCheck = validateEventTitle(newEvent.title);
    if (!titleCheck.ok) { toast.error(titleCheck.message); return; }
    // BR013: free-tier cap — 1 hosted event per calendar month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("host_id", user.id)
      .gte("created_at", monthStart.toISOString());
    if ((count ?? 0) >= BR.FREE_EVENTS_PER_MONTH) {
      toast.error(`Free plan: ${BR.FREE_EVENTS_PER_MONTH} event/month. Upgrade to Premium for unlimited events.`);
      return;
    }
    const { data, error } = await supabase
      .from("events")
      .insert({
        host_id: user.id,
        title: newEvent.title.trim(),
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
      .upsert(
        { event_id: activeId, user_id: user.id, status, cancelled_at: null },
        { onConflict: "event_id,user_id" }
      );
    if (error) { toast.error(error.message); return; }
    toast.success(`RSVP set to ${status}`);
    loadEventDetails(activeId);
  };

  const checkIn = async () => {
    if (!activeId || !user) return;
    const { error } = await supabase
      .from("rsvps")
      .upsert(
        { event_id: activeId, user_id: user.id, status: "going", checked_in_at: new Date().toISOString(), cancelled_at: null },
        { onConflict: "event_id,user_id" }
      );
    if (error) { toast.error(error.message); return; }
    toast.success("Checked in! 🎉");
    loadEventDetails(activeId);
  };

  const cancelRSVP = async () => {
    if (!activeId || !user) return;
    if (!confirm("Cancel your RSVP for this event?")) return;
    const { error } = await supabase
      .from("rsvps")
      .upsert(
        { event_id: activeId, user_id: user.id, status: "no", cancelled_at: new Date().toISOString() },
        { onConflict: "event_id,user_id" }
      );
    if (error) { toast.error(error.message); return; }
    toast.success("RSVP cancelled");
    loadEventDetails(activeId);
  };


  // Search any user by username or display name (host can invite anyone)
  const searchUsers = async (q: string) => {
    setInviteQuery(q);
    if (!q.trim()) { setInviteResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8);
    const existingIds = new Set(rsvps.map((r) => r.user_id).concat(user?.id ?? ""));
    setInviteResults((data ?? []).filter((p) => !existingIds.has(p.id)));
  };

  // Invite someone — adds them with status 'invited'
  const invite = async (userId: string) => {
    if (!activeId) return;
    const { error } = await supabase
      .from("rsvps")
      .insert({ event_id: activeId, user_id: userId, status: "invited" });
    if (error) { toast.error(error.message); return; }
    toast.success("Invited!");
    setInviteQuery("");
    setInviteResults([]);
    loadEventDetails(activeId);
  };

  // Host override: change anyone's RSVP on this event (demo helper)
  const overrideRSVP = async (userId: string, status: "going" | "maybe" | "no" | "invited") => {
    if (!activeId) return;
    const { error } = await supabase
      .from("rsvps")
      .upsert({ event_id: activeId, user_id: userId, status }, { onConflict: "event_id,user_id" });
    if (error) { toast.error(error.message); return; }
    loadEventDetails(activeId);
  };

  // Host can remove a guest entirely
  const removeGuest = async (userId: string) => {
    if (!activeId) return;
    const { error } = await supabase.from("rsvps").delete().eq("event_id", activeId).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
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

    const payer = newExpense.paidBy || user.id;
    const goingUsers = rsvps.filter((r) => r.status === "going").map((r) => r.user_id);
    // Participants: explicit selection, else everyone going, else just payer
    const participants = newExpense.participants.length > 0
      ? newExpense.participants
      : (goingUsers.length > 0 ? goingUsers : [payer]);

    if (newExpense.splitMode !== "payer" && participants.length === 0) {
      toast.error("Pick at least one person to split with");
      return;
    }

    const { data: exp, error } = await supabase
      .from("expenses")
      .insert({
        event_id: activeId,
        paid_by: payer,
        title: newExpense.title,
        amount,
        notes: newExpense.notes || null,
      })
      .select()
      .single();
    if (error || !exp) { toast.error(error?.message ?? "Failed"); return; }

    let sharesToInsert: { expense_id: string; user_id: string; share_amount: number }[] = [];
    if (newExpense.splitMode === "payer") {
      sharesToInsert = [{ expense_id: exp.id, user_id: payer, share_amount: amount }];
    } else if (newExpense.splitMode === "custom") {
      sharesToInsert = participants.map((uid) => ({ expense_id: exp.id, user_id: uid, share_amount: 0 }));
    } else {
      const perPerson = Math.round((amount / participants.length) * 100) / 100;
      sharesToInsert = participants.map((uid) => ({ expense_id: exp.id, user_id: uid, share_amount: perPerson }));
    }

    await supabase.from("expense_shares").insert(sharesToInsert);

    toast.success("Expense added!");
    setNewExpense({ title: "", amount: "", notes: "", splitMode: "equal", paidBy: "", participants: [] });
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

  const myRsvpRow = rsvps.find((r) => r.user_id === user?.id);
  const myRsvp = myRsvpRow?.status;

  // Compute lifecycle state for any event for the current user
  const lifecycleFor = (ev: EventRow, rsvp?: { status: string; checked_in_at: string | null; cancelled_at: string | null } | null): LifecycleState => {
    return getLifecycleState({
      scheduledAt: ev.scheduled_at,
      endedAt: ev.ended_at,
      rsvpStatus: (rsvp?.status as "going" | "maybe" | "no" | "invited" | undefined) ?? null,
      checkedInAt: rsvp?.checked_in_at ?? null,
      cancelledAt: rsvp?.cancelled_at ?? null,
    });
  };
  const activeLifecycle: LifecycleState | null = activeEvent ? lifecycleFor(activeEvent, myRsvpRow) : null;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const totalBudget = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const myShare = shares
    .filter((s) => s.user_id === user?.id)
    .reduce((sum, s) => sum + Number(s.share_amount), 0);

  // Settle-up: net balance per user = (paid) - (owed)
  const balances: Record<string, number> = {};
  expenses.forEach((e) => {
    balances[e.paid_by] = (balances[e.paid_by] ?? 0) + Number(e.amount);
  });
  shares.forEach((s) => {
    balances[s.user_id] = (balances[s.user_id] ?? 0) - Number(s.share_amount);
  });
  const balanceList = Object.entries(balances)
    .filter(([, v]) => Math.abs(v) >= 0.01)
    .sort((a, b) => b[1] - a[1]);

  // Greedy settle-up: largest creditor paid by largest debtor until cleared
  const settlements: { from: string; to: string; amount: number }[] = [];
  const creditors = balanceList.filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }));
  const debtors = balanceList.filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }));
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].v, debtors[di].v);
    if (pay >= 0.01) settlements.push({ from: debtors[di].id, to: creditors[ci].id, amount: Math.round(pay * 100) / 100 });
    creditors[ci].v -= pay;
    debtors[di].v -= pay;
    if (creditors[ci].v < 0.01) ci++;
    if (debtors[di].v < 0.01) di++;
  }

  const priorityIcon = { high: "🔴", med: "🟡", low: "🟢" };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">My Events</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-brand-gradient text-black font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform text-sm sm:text-base whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> <span className="hidden xs:inline">New Event</span><span className="xs:hidden">New</span>
        </button>
      </div>

      {showNew && (
        <div className="bg-card border border-brand-yellow rounded-xl p-6 mb-6 space-y-3">
          <div>
            <input
              placeholder="Event title (e.g. Beach trip 🔥)"
              value={newEvent.title}
              maxLength={BR.EVENT_TITLE_MAX}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full bg-input px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-brand-yellow"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {newEvent.title.length}/{BR.EVENT_TITLE_MAX} • BR010
            </p>
          </div>
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
          <aside className={`space-y-4 ${activeEvent ? "hidden lg:block" : ""}`}>
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-muted-foreground uppercase mb-2">Your events</h2>
              {events.map((e) => {
                const lc = lifecycleFor(e, myRsvpsByEvent[e.id]);
                const meta = getLifecycleMeta(lc);
                return (
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {e.scheduled_at && (
                        <span className="text-xs text-brand-yellow">
                          {new Date(e.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.className}`}>
                        {meta.emoji} {meta.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeEvent && (
              <section className="bg-card border border-border rounded-xl p-4">
                <h2 className="text-base font-bold mb-2">Invite People ➕</h2>
                <p className="text-xs text-muted-foreground mb-2">Search any user by username or name.</p>
                <input
                  placeholder="Search users…"
                  value={inviteQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm mb-2"
                />
                {inviteResults.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {inviteResults.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 bg-input p-2 rounded text-sm">
                        <span className="text-brand-yellow font-bold flex-1 truncate">@{p.username}</span>
                        <button onClick={() => invite(p.id)} className="bg-brand-gradient text-black font-bold text-xs px-3 py-1 rounded">
                          Invite
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {inviteQuery && inviteResults.length === 0 && (
                  <p className="text-xs italic text-muted-foreground">No matches.</p>
                )}
              </section>
            )}
          </aside>

          {activeEvent && (
            <div className="grid xl:grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-6">
                <button
                  onClick={() => setActiveId(null)}
                  className="lg:hidden flex items-center gap-1 text-sm font-bold text-brand-yellow hover:underline -mb-2"
                >
                  ← Back to events
                </button>
                <section className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-2xl font-bold">{activeEvent.title}</h2>
                        {activeLifecycle && (() => {
                          const meta = getLifecycleMeta(activeLifecycle);
                          return (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${meta.className}`}>
                              {meta.emoji} {meta.label}
                            </span>
                          );
                        })()}
                      </div>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const { data, error } = await supabase.rpc("get_or_create_event_chat", { _event_id: activeEvent.id });
                          if (error || !data) { toast.error(error?.message ?? "Couldn't open chat"); return; }
                          navigate({ to: "/messages", search: { conversation: data as string } });
                        }}
                        className="bg-brand-gradient text-black font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                        title="Open group chat"
                      >
                        <MessageCircle className="w-4 h-4" /> Group Chat
                      </button>
                      {activeEvent.host_id === user?.id && (
                        <button onClick={() => deleteEvent(activeEvent.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="font-bold mb-2">Your RSVP:</h3>
                    <div className="flex gap-2">
                      {(["going", "maybe", "no"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setRSVP(s)}
                          className={`flex-1 py-2.5 rounded-lg font-bold border transition-all ${
                            myRsvp === s && !myRsvpRow?.cancelled_at ? "scale-105" : ""
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

                    {/* Lifecycle actions */}
                    {activeLifecycle === "active" && !myRsvpRow?.checked_in_at && (
                      <button
                        onClick={checkIn}
                        className="mt-3 w-full bg-brand-gradient text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Check in to event
                      </button>
                    )}
                    {activeLifecycle === "attended" && (
                      <p className="mt-3 text-sm text-going font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> You checked in
                        {myRsvpRow?.checked_in_at && <span className="text-muted-foreground font-normal"> at {new Date(myRsvpRow.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
                      </p>
                    )}
                    {activeLifecycle === "upcoming" && myRsvp === "going" && !myRsvpRow?.cancelled_at && (
                      <button
                        onClick={cancelRSVP}
                        className="mt-3 w-full bg-no/20 text-no border border-no font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-no/30"
                      >
                        <Ban className="w-4 h-4" /> Cancel RSVP
                      </button>
                    )}
                    {activeLifecycle === "missed" && (
                      <p className="mt-3 text-sm text-no font-bold">⏰ You missed this event.</p>
                    )}
                    {activeLifecycle === "cancelled" && (
                      <p className="mt-3 text-sm text-no font-bold">🚫 You cancelled your RSVP.</p>
                    )}
                  </div>
                </section>

                <section className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-brand-yellow" />
                      Budget & Cost Splitting
                    </h2>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Total: <span className="text-brand-yellow font-bold">${totalBudget.toFixed(2)}</span></div>
                      <div className="text-muted-foreground">You owe: <span className="text-brand-pink font-bold">${myShare.toFixed(2)}</span></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Split equally by default — tap a share to adjust.</p>

                  <div className="space-y-3 mb-4">
                    {expenses.length === 0 && <p className="text-sm text-muted-foreground italic">No expenses yet.</p>}
                    {expenses.map((exp) => {
                      const expShares = shares.filter((s) => s.expense_id === exp.id);
                      const payer = profiles[exp.paid_by];
                      return (
                        <div key={exp.id} className="bg-input p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1">
                              <div className="font-bold">{exp.title} <span className="text-brand-yellow">${Number(exp.amount).toFixed(2)}</span></div>
                              <div className="text-xs text-muted-foreground">
                                Paid by <span className="text-brand-pink">@{payer?.username ?? "user"}</span>
                                {exp.notes && <> • {exp.notes}</>}
                              </div>
                            </div>
                            {exp.paid_by === user?.id && (
                              <button onClick={() => deleteExpense(exp.id)} className="text-muted-foreground hover:text-destructive">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {expShares.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                              {expShares.map((s) => {
                                const u = profiles[s.user_id];
                                return (
                                  <div key={s.id} className="flex items-center gap-1 text-xs">
                                    <span className="text-muted-foreground truncate">@{u?.username ?? "user"}</span>
                                    <span className="text-muted-foreground">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      defaultValue={Number(s.share_amount).toFixed(2)}
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val !== Number(s.share_amount)) updateShare(s.id, val);
                                      }}
                                      className="w-16 bg-card px-1 py-0.5 rounded border border-border text-brand-yellow font-bold focus:outline-none focus:border-brand-yellow"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {settlements.length > 0 && (
                    <div className="bg-input rounded-lg p-3 mb-4 border border-border">
                      <div className="text-sm font-bold mb-2 flex items-center gap-2">
                        💸 Settle up
                      </div>
                      <div className="space-y-1">
                        {settlements.map((s, i) => {
                          const from = profiles[s.from];
                          const to = profiles[s.to];
                          return (
                            <div key={i} className="text-xs flex items-center gap-1">
                              <span className="text-brand-pink">@{from?.username ?? "user"}</span>
                              <span className="text-muted-foreground">pays</span>
                              <span className="text-brand-yellow font-bold">${s.amount.toFixed(2)}</span>
                              <span className="text-muted-foreground">to</span>
                              <span className="text-brand-pink">@{to?.username ?? "user"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="grid grid-cols-[1fr_120px] gap-2">
                      <input
                        placeholder="What was it for? (e.g. Pizza)"
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                        className="bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm"
                      />
                    </div>
                    <input
                      placeholder="Notes (optional)"
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                      className="w-full bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">Paid by:</span>
                      <select
                        value={newExpense.paidBy || user?.id || ""}
                        onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                        className="flex-1 bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm"
                      >
                        {user && (
                          <option value={user.id}>You (@{profiles[user.id]?.username ?? "me"})</option>
                        )}
                        {rsvps
                          .filter((r) => r.user_id !== user?.id)
                          .map((r) => {
                            const p = profiles[r.user_id];
                            return (
                              <option key={r.user_id} value={r.user_id}>
                                @{p?.username ?? "user"} — {p?.display_name ?? "?"}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {newExpense.splitMode !== "payer" && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">
                            Split between ({(newExpense.participants.length || rsvps.filter((r) => r.status === "going").length)} people)
                          </span>
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setNewExpense({ ...newExpense, participants: rsvps.filter((r) => r.status === "going").map((r) => r.user_id) })}
                              className="text-brand-yellow hover:underline"
                            >
                              All going
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewExpense({ ...newExpense, participants: [] })}
                              className="text-muted-foreground hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rsvps.map((r) => {
                            const p = profiles[r.user_id];
                            const selected = newExpense.participants.includes(r.user_id);
                            const fallbackSelected = newExpense.participants.length === 0 && r.status === "going";
                            const active = selected || fallbackSelected;
                            return (
                              <button
                                key={r.user_id}
                                type="button"
                                onClick={() => {
                                  const base = newExpense.participants.length === 0
                                    ? rsvps.filter((x) => x.status === "going").map((x) => x.user_id)
                                    : newExpense.participants;
                                  const next = base.includes(r.user_id)
                                    ? base.filter((id) => id !== r.user_id)
                                    : [...base, r.user_id];
                                  setNewExpense({ ...newExpense, participants: next });
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                                  active
                                    ? "bg-brand-gradient text-black border-transparent"
                                    : "bg-input text-muted-foreground border-border hover:border-brand-yellow"
                                }`}
                              >
                                @{p?.username ?? "user"}
                              </button>
                            );
                          })}
                        </div>
                        {newExpense.splitMode === "equal" && newExpense.amount && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ≈ <span className="text-brand-yellow font-bold">
                              ${(parseFloat(newExpense.amount) / Math.max(1, newExpense.participants.length || rsvps.filter((r) => r.status === "going").length)).toFixed(2)}
                            </span> per person
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Split:</span>
                      {([
                        { id: "equal", label: "Equally" },
                        { id: "payer", label: "Payer covers" },
                        { id: "custom", label: "Custom amounts" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNewExpense({ ...newExpense, splitMode: opt.id })}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            newExpense.splitMode === opt.id
                              ? "bg-brand-gradient text-black border-transparent"
                              : "bg-input text-muted-foreground border-border hover:border-brand-yellow"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <button onClick={addExpense} className="ml-auto bg-brand-gradient text-black font-bold px-5 py-2 rounded-lg text-sm">
                        Add expense
                      </button>
                    </div>
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
                  <h2 className="text-xl font-bold mb-1">Vote on a Time 🕒</h2>
                  <p className="text-sm text-muted-foreground mb-4">Select the time that works best for you!</p>

                  {/* BR011: ≥1 proposed time required to finalize */}
                  {proposals.length === 0 && !activeEvent.scheduled_at && (
                    <div className="flex items-start gap-2 bg-maybe/10 border border-maybe/40 text-maybe rounded-lg p-3 mb-4 text-xs">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span><strong>BR011:</strong> Propose at least one date/time below before this event can be finalized.</span>
                    </div>
                  )}

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
                          <span className="flex-1 text-sm">{new Date(p.proposed_time).toLocaleString()}</span>
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
                      className="flex-1 bg-input px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-brand-yellow text-sm"
                    />
                    <button onClick={addProposal} className="bg-brand-gradient text-black font-bold px-4 py-2 rounded-lg text-sm">Propose</button>
                  </div>
                </section>

                <details className="bg-card border border-border rounded-xl p-6 group">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <h2 className="text-xl font-bold">Guestlist 👥 <span className="text-sm font-normal text-muted-foreground">({rsvps.length})</span></h2>
                    <span className="text-brand-yellow group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                  </summary>
                  <div className="mt-4">
                  {activeEvent.host_id === user?.id && (
                    <p className="text-xs text-muted-foreground italic mb-3">As the host you can change anyone's RSVP.</p>
                  )}
                  <ul className="space-y-2">
                    {rsvps.length === 0 && <li className="text-sm text-muted-foreground italic">No RSVPs yet — invite someone above!</li>}
                    {rsvps.map((r) => {
                      const p = profiles[r.user_id];
                      const isHost = activeEvent.host_id === user?.id;
                      const dotColor =
                        r.status === "going" ? "bg-going" :
                        r.status === "maybe" ? "bg-maybe" :
                        r.status === "no" ? "bg-no" : "bg-muted-foreground";
                      const label =
                        r.status === "no" ? "Can't go" :
                        r.status === "invited" ? "Invited" :
                        r.status.charAt(0).toUpperCase() + r.status.slice(1);
                      const paid = expenses
                        .filter((e) => e.paid_by === r.user_id)
                        .reduce((sum, e) => sum + Number(e.amount), 0);
                      const owes = shares
                        .filter((s) => s.user_id === r.user_id)
                        .reduce((sum, s) => sum + Number(s.share_amount), 0);
                      const net = paid - owes;
                      const userTasks = tasks.filter((t) => t.assigned_to === r.user_id);
                      const hasMoney = paid > 0 || owes > 0;
                      return (
                        <li key={r.user_id} className="bg-input rounded-lg p-2.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`inline-block w-3 h-3 rounded-full ${dotColor}`} />
                            <span className="text-brand-yellow font-bold">@{p?.username ?? "user"}</span>
                            <span className="text-muted-foreground truncate">"{p?.display_name ?? "?"}"</span>
                            <span className="text-xs text-muted-foreground ml-auto">({label})</span>
                          </div>

                          {(hasMoney || userTasks.length > 0) && (
                            <div className="mt-2 pt-2 border-t border-border space-y-1 text-xs">
                              {hasMoney && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-muted-foreground">💰</span>
                                  {paid > 0 && (
                                    <span className="text-muted-foreground">
                                      Paid <span className="text-brand-yellow font-bold">${paid.toFixed(2)}</span>
                                    </span>
                                  )}
                                  {owes > 0 && (
                                    <span className="text-muted-foreground">
                                      • Owes <span className="text-brand-pink font-bold">${owes.toFixed(2)}</span>
                                    </span>
                                  )}
                                  <span
                                    className={`ml-auto px-2 py-0.5 rounded-full font-bold ${
                                      Math.abs(net) < 0.01
                                        ? "bg-card text-muted-foreground"
                                        : net > 0
                                        ? "bg-going/20 text-going"
                                        : "bg-no/20 text-no"
                                    }`}
                                  >
                                    {Math.abs(net) < 0.01
                                      ? "Settled"
                                      : net > 0
                                      ? `+$${net.toFixed(2)}`
                                      : `-$${Math.abs(net).toFixed(2)}`}
                                  </span>
                                </div>
                              )}
                              {userTasks.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <span className="text-muted-foreground">📋</span>
                                  <span className="text-muted-foreground flex-1">
                                    {userTasks.map((t) => (
                                      <span key={t.id} className={`inline-block mr-2 ${t.completed ? "line-through opacity-60" : ""}`}>
                                        {priorityIcon[t.priority]} {t.task_name}
                                      </span>
                                    ))}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {isHost && (
                            <div className="flex gap-1 mt-2">
                              <button onClick={() => overrideRSVP(r.user_id, "going")} className={`flex-1 text-xs py-1 rounded font-bold ${r.status === "going" ? "bg-going text-black" : "bg-card border border-border text-muted-foreground hover:text-going"}`}>Going</button>
                              <button onClick={() => overrideRSVP(r.user_id, "maybe")} className={`flex-1 text-xs py-1 rounded font-bold ${r.status === "maybe" ? "bg-maybe text-black" : "bg-card border border-border text-muted-foreground hover:text-maybe"}`}>Maybe</button>
                              <button onClick={() => overrideRSVP(r.user_id, "no")} className={`flex-1 text-xs py-1 rounded font-bold ${r.status === "no" ? "bg-no text-black" : "bg-card border border-border text-muted-foreground hover:text-no"}`}>Can't</button>
                              <button onClick={() => removeGuest(r.user_id)} title="Remove from event" className="text-muted-foreground hover:text-destructive px-1">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
