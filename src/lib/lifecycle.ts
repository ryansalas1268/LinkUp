// Event lifecycle state machine
// Browsing -> Selected -> RSVP Submitted -> Confirmed -> Upcoming -> Active -> Attended/Missed -> Past/Viewed
// Cancelled is a terminal branch from Confirmed/Upcoming.

export type LifecycleState =
  | "invited"     // RSVP Submitted (pending response)
  | "cancelled"   // User cancelled before event began
  | "upcoming"    // Confirmed + scheduled in the future
  | "active"      // Event currently happening
  | "attended"    // User checked in during the event
  | "missed"      // Event ended and user (going) never checked in
  | "past"        // Event ended (user wasn't going / no rsvp)
  | "unscheduled"; // No scheduled_at yet

export interface LifecycleInput {
  scheduledAt: string | null;
  endedAt?: string | null;
  rsvpStatus?: "going" | "maybe" | "no" | "invited" | null;
  checkedInAt?: string | null;
  cancelledAt?: string | null;
  now?: Date;
}

// Default event window if no explicit end time: 4 hours after start
const DEFAULT_DURATION_MS = 4 * 60 * 60 * 1000;

export function getLifecycleState(input: LifecycleInput): LifecycleState {
  const now = input.now ?? new Date();

  if (input.cancelledAt) return "cancelled";
  if (!input.scheduledAt) return "unscheduled";

  const start = new Date(input.scheduledAt);
  const end = input.endedAt ? new Date(input.endedAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);

  if (now < start) {
    if (input.rsvpStatus === "invited" || !input.rsvpStatus) return "upcoming";
    return "upcoming";
  }

  if (now >= start && now <= end) {
    if (input.checkedInAt) return "attended";
    return "active";
  }

  // Past end
  if (input.checkedInAt) return "attended";
  if (input.rsvpStatus === "going") return "missed";
  return "past";
}

export interface LifecycleMeta {
  label: string;
  emoji: string;
  className: string; // Tailwind classes for badge background/text/border
}

export function getLifecycleMeta(state: LifecycleState): LifecycleMeta {
  switch (state) {
    case "invited":
      return { label: "Invited", emoji: "✉️", className: "bg-maybe/20 text-maybe border-maybe" };
    case "cancelled":
      return { label: "Cancelled", emoji: "🚫", className: "bg-no/20 text-no border-no" };
    case "upcoming":
      return { label: "Upcoming", emoji: "📅", className: "bg-brand-yellow/20 text-brand-yellow border-brand-yellow" };
    case "active":
      return { label: "Live now", emoji: "🔴", className: "bg-brand-pink/20 text-brand-pink border-brand-pink animate-pulse" };
    case "attended":
      return { label: "Attended", emoji: "✅", className: "bg-going/20 text-going border-going" };
    case "missed":
      return { label: "Missed", emoji: "⏰", className: "bg-no/20 text-no border-no" };
    case "past":
      return { label: "Past", emoji: "📦", className: "bg-muted/40 text-muted-foreground border-border" };
    case "unscheduled":
      return { label: "Planning", emoji: "🗒️", className: "bg-muted/40 text-muted-foreground border-border" };
  }
}
