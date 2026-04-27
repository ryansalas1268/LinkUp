import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getLifecycleMeta, type LifecycleState } from "@/lib/lifecycle";

export const Route = createFileRoute("/_authenticated/lifecycle")({
  component: LifecyclePage,
});

interface Step {
  state: LifecycleState | "browsing" | "selected" | "submitted" | "confirmed";
  label: string;
  desc: string;
}

const happyPath: Step[] = [
  { state: "browsing", label: "Browsing Events", desc: "User opens the app and starts browsing" },
  { state: "selected", label: "Event Selected", desc: "User chooses an event to view" },
  { state: "submitted", label: "RSVP Submitted", desc: "RSVP request is sent through the system" },
  { state: "confirmed", label: "Confirmed", desc: "RSVP is accepted and confirmed" },
  { state: "upcoming", label: "Upcoming", desc: "Event appears in My Events list" },
  { state: "active", label: "Event Active", desc: "Event start time arrives and opens" },
  { state: "attended", label: "Attended", desc: "User checks in and attends the event" },
  { state: "past", label: "Past Event Available", desc: "Event ends, details remain available" },
];

const branches: Step[] = [
  { state: "cancelled", label: "Cancelled", desc: "User cancels RSVP before the event begins" },
  { state: "missed", label: "Missed", desc: "User does not attend or misses the event" },
];

function StepCard({ step }: { step: Step }) {
  // Generic styling for non-lifecycle bookkeeping states
  const generic = ["browsing", "selected", "submitted", "confirmed"].includes(step.state);
  const meta = generic
    ? { label: step.label, emoji: "•", className: "bg-input text-foreground border-border" }
    : getLifecycleMeta(step.state as LifecycleState);

  return (
    <div className={`rounded-xl border p-4 min-w-[180px] ${meta.className}`}>
      <div className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">
        {meta.emoji} {generic ? "Step" : meta.label}
      </div>
      <div className="font-bold text-sm mb-1 text-foreground">{step.label}</div>
      <div className="text-xs text-muted-foreground">{step.desc}</div>
    </div>
  );
}

function LifecyclePage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">RSVP & Event Lifecycle</h1>
        <Link
          to="/events"
          className="text-sm text-brand-yellow hover:underline font-bold"
        >
          ← Back to events
        </Link>
      </div>
      <p className="text-muted-foreground mb-8 max-w-3xl">
        Every event in LinkUp moves through this lifecycle. Status badges on your event cards
        reflect exactly which state each event is in for you right now.
      </p>

      {/* Happy path */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Happy path</h2>
        <div className="flex flex-wrap items-center gap-3">
          {happyPath.map((s, i) => (
            <div key={s.state} className="flex items-center gap-3">
              <StepCard step={s} />
              {i < happyPath.length - 1 && (
                <ArrowRight className="w-5 h-5 text-brand-pink shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Branches */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Alternate branches</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {branches.map((s) => (
            <StepCard key={s.state} step={s} />
          ))}
        </div>
      </section>

      {/* Legend */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Badge legend</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(["upcoming", "active", "attended", "missed", "cancelled", "invited", "past", "unscheduled"] as LifecycleState[]).map((s) => {
            const meta = getLifecycleMeta(s);
            return (
              <div key={s} className={`rounded-lg border px-3 py-2 text-sm font-bold ${meta.className}`}>
                {meta.emoji} {meta.label}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
