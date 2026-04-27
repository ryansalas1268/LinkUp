// Demo "guest perspective" events shown on the Events page so the user can
// experience hosting vs. attending. These are display-only — never written
// to the database. Detected by the `demo-` id prefix.

export const DEMO_HOST_IDS = {
  lydia: "ebd9b16d-74cd-4dc5-8bce-0fa080d1fcd9",
  alex: "5570221b-4628-41e5-b0a4-78002f9a707c",
  maya: "2507dac2-c088-436b-a0c7-865736390ec7",
} as const;

export interface DemoEvent {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduled_at: string | null;
  ended_at: string | null;
  cover_image_url: string | null;
  created_at: string;
}

const year = new Date().getFullYear();

export const DEMO_EVENTS: DemoEvent[] = [
  {
    id: "demo-karaoke",
    host_id: DEMO_HOST_IDS.lydia,
    title: "Karaoke Night 🎤",
    description: "Belt it out with the crew. Drinks after at the spot next door.",
    location: "Muzette — H Street",
    scheduled_at: `${year}-02-14T21:00:00Z`,
    ended_at: null,
    cover_image_url: null,
    created_at: `${year}-01-20T12:00:00Z`,
  },
  {
    id: "demo-soccer",
    host_id: DEMO_HOST_IDS.alex,
    title: "Pickup Soccer ⚽",
    description: "Sunday morning kickabout — all skill levels welcome.",
    location: "Meridian Hill Park",
    scheduled_at: `${year}-03-08T15:00:00Z`,
    ended_at: null,
    cover_image_url: null,
    created_at: `${year}-02-28T12:00:00Z`,
  },
  {
    id: "demo-birthday",
    host_id: DEMO_HOST_IDS.maya,
    title: "Maya's Birthday 🎂",
    description: "Surprise dinner — keep it quiet! Arrive by 6:45.",
    location: "Le Diplomate — 14th St",
    scheduled_at: `${year}-04-04T23:00:00Z`,
    ended_at: null,
    cover_image_url: null,
    created_at: `${year}-03-15T12:00:00Z`,
  },
];

export const DEMO_PROFILES = [
  { id: DEMO_HOST_IDS.lydia, username: "lydialiu", display_name: "Lydia Liu" },
  { id: DEMO_HOST_IDS.alex, username: "alexkim", display_name: "Alex Kim" },
  { id: DEMO_HOST_IDS.maya, username: "mayapatel", display_name: "Maya Patel" },
  { id: "demo-friend-jordan", username: "jordanlee", display_name: "Jordan Lee" },
  { id: "demo-friend-sofia", username: "sofiagarcia", display_name: "Sofia Garcia" },
  { id: "demo-friend-sarah", username: "sarahu", display_name: "Sarah U." },
  { id: "demo-friend-nabil", username: "nabilali", display_name: "Nabil Ali" },
];

// Per-event details: tasks, expenses, RSVPs, and the current user's RSVP status.
export interface DemoEventDetails {
  myStatus: "going" | "maybe" | "no" | "invited";
  rsvps: Array<{ user_id: string; status: "going" | "maybe" | "no" | "invited"; checked_in_at: string | null; cancelled_at: string | null }>;
  tasks: Array<{ id: string; task_name: string; priority: "high" | "med" | "low"; completed: boolean; assigned_to: string | null }>;
  expenses: Array<{ id: string; title: string; amount: number; paid_by: string; notes: string | null; participants: string[] }>;
}

export const DEMO_DETAILS: Record<string, DemoEventDetails> = {
  "demo-karaoke": {
    myStatus: "going",
    rsvps: [
      { user_id: DEMO_HOST_IDS.lydia, status: "going", checked_in_at: `${year}-02-14T21:05:00Z`, cancelled_at: null },
      { user_id: "demo-friend-jordan", status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-sofia", status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-sarah", status: "maybe", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-nabil", status: "no", checked_in_at: null, cancelled_at: null },
    ],
    tasks: [
      { id: "demo-k-t1", task_name: "Reserve karaoke room", priority: "high", completed: true, assigned_to: DEMO_HOST_IDS.lydia },
      { id: "demo-k-t2", task_name: "Build the playlist", priority: "med", completed: true, assigned_to: "demo-friend-jordan" },
      { id: "demo-k-t3", task_name: "Bring the aux cable", priority: "low", completed: false, assigned_to: null },
    ],
    expenses: [
      { id: "demo-k-e1", title: "Room rental", amount: 120, paid_by: DEMO_HOST_IDS.lydia, notes: "2 hours", participants: [DEMO_HOST_IDS.lydia, "demo-friend-jordan", "demo-friend-sofia"] },
      { id: "demo-k-e2", title: "First round of drinks", amount: 64, paid_by: "demo-friend-sofia", notes: null, participants: [DEMO_HOST_IDS.lydia, "demo-friend-jordan", "demo-friend-sofia"] },
    ],
  },
  "demo-soccer": {
    myStatus: "going",
    rsvps: [
      { user_id: DEMO_HOST_IDS.alex, status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-jordan", status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-nabil", status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-sofia", status: "maybe", checked_in_at: null, cancelled_at: null },
    ],
    tasks: [
      { id: "demo-s-t1", task_name: "Bring the ball", priority: "high", completed: false, assigned_to: DEMO_HOST_IDS.alex },
      { id: "demo-s-t2", task_name: "Cones + pinnies", priority: "med", completed: false, assigned_to: "demo-friend-nabil" },
      { id: "demo-s-t3", task_name: "Post-game brunch reservation", priority: "low", completed: false, assigned_to: null },
    ],
    expenses: [
      { id: "demo-s-e1", title: "Field permit", amount: 30, paid_by: DEMO_HOST_IDS.alex, notes: "1 hour slot", participants: [DEMO_HOST_IDS.alex, "demo-friend-jordan", "demo-friend-nabil"] },
    ],
  },
  "demo-birthday": {
    myStatus: "maybe",
    rsvps: [
      { user_id: DEMO_HOST_IDS.maya, status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-sofia", status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-sarah", status: "going", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-jordan", status: "maybe", checked_in_at: null, cancelled_at: null },
      { user_id: "demo-friend-nabil", status: "going", checked_in_at: null, cancelled_at: null },
    ],
    tasks: [
      { id: "demo-b-t1", task_name: "Confirm reservation for 8", priority: "high", completed: true, assigned_to: "demo-friend-sofia" },
      { id: "demo-b-t2", task_name: "Pick up the cake", priority: "high", completed: false, assigned_to: "demo-friend-sarah" },
      { id: "demo-b-t3", task_name: "Group gift contribution", priority: "med", completed: false, assigned_to: null },
      { id: "demo-b-t4", task_name: "Coordinate the surprise entrance", priority: "low", completed: false, assigned_to: null },
    ],
    expenses: [
      { id: "demo-b-e1", title: "Dinner deposit", amount: 200, paid_by: "demo-friend-sofia", notes: "Refunded against final bill", participants: [DEMO_HOST_IDS.maya, "demo-friend-sofia", "demo-friend-sarah", "demo-friend-jordan", "demo-friend-nabil"] },
      { id: "demo-b-e2", title: "Birthday cake", amount: 75, paid_by: "demo-friend-sarah", notes: "Chocolate ganache", participants: ["demo-friend-sofia", "demo-friend-sarah", "demo-friend-jordan", "demo-friend-nabil"] },
      { id: "demo-b-e3", title: "Group gift", amount: 180, paid_by: "demo-friend-jordan", notes: "Split 4 ways", participants: ["demo-friend-sofia", "demo-friend-sarah", "demo-friend-jordan", "demo-friend-nabil"] },
    ],
  },
};

export const isDemoEventId = (id: string | null | undefined): id is string =>
  !!id && id.startsWith("demo-");
