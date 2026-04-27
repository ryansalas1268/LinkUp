import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rules")({
  component: RulesPage,
});

interface Rule {
  id: string;
  text: string;
  enforced: boolean;
}

interface Section {
  title: string;
  rules: Rule[];
}

const SECTIONS: Section[] = [
  {
    title: "Login & Account Creation",
    rules: [
      { id: "BR001", text: "Username must be unique and 3–30 characters.", enforced: true },
      { id: "BR002", text: "Password must be at least 8 characters with a letter, number, and special character.", enforced: true },
      { id: "BR003", text: "Email must be valid format and unique to one account.", enforced: true },
      { id: "BR004", text: "Invalid login shows an error message and denies access.", enforced: true },
      { id: "BR005", text: "All required signup fields must be completed.", enforced: true },
    ],
  },
  {
    title: "Dashboard",
    rules: [
      { id: "BR006", text: "Only logged-in users can access the dashboard.", enforced: true },
      { id: "BR007", text: "Dashboard shows events and invites.", enforced: true },
      { id: "BR008", text: "Notifications show updates (RSVPs, messages, tasks).", enforced: true },
      { id: "BR009", text: "Users only see event activity for groups they belong to.", enforced: true },
    ],
  },
  {
    title: "Event Creation",
    rules: [
      { id: "BR010", text: "Event name required, max 50 characters.", enforced: true },
      { id: "BR011", text: "At least one date/time must be proposed before an event is finalized.", enforced: true },
      { id: "BR012", text: "Only invited users can join an event.", enforced: true },
      { id: "BR013", text: "Free users have a limited number of events per month.", enforced: true },
      { id: "BR014", text: "Updates sync to all members in real time.", enforced: true },
    ],
  },
  {
    title: "Availability, Tasks & Messaging",
    rules: [
      { id: "BR015", text: "Users submit only their own availability.", enforced: true },
      { id: "BR016", text: "Task status options: Not Started, In Progress, Completed.", enforced: true },
      { id: "BR017", text: "Calendar sync is optional.", enforced: true },
      { id: "BR018", text: "Final time triggers a notification to all users.", enforced: true },
    ],
  },
];

function RulesPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-brand-gradient">
          <ShieldCheck className="w-6 h-6 text-black" />
        </div>
        <h1 className="text-3xl font-bold">Business Rules</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        These are the rules LinkUp follows behind the scenes — the same constraints from our project
        spec, now wired into the app.
      </p>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-input px-5 py-3 border-b border-border">
              <h2 className="font-bold">{section.title}</h2>
            </div>
            <ul>
              {section.rules.map((r, i) => (
                <li
                  key={r.id}
                  className={`grid grid-cols-[80px_1fr_auto] gap-4 items-center px-5 py-3 ${
                    i % 2 === 0 ? "bg-background/40" : ""
                  } border-b border-border last:border-0`}
                >
                  <span className="font-mono font-bold text-brand-yellow text-sm">{r.id}</span>
                  <span className="text-sm">{r.text}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      r.enforced
                        ? "bg-going/20 text-going border-going/40"
                        : "bg-muted/20 text-muted-foreground border-border"
                    }`}
                  >
                    {r.enforced ? "ENFORCED" : "INFO"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
