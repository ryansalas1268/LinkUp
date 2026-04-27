import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Check, X, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSubscription, type MockPlanId } from "@/hooks/useSubscription";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upgrade")({
  component: UpgradePage,
});

interface Plan {
  id: MockPlanId;
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "premium_monthly",
    name: "Monthly",
    price: "$4.99",
    period: "per month",
    description: "Flexible. Cancel anytime.",
  },
  {
    id: "premium_yearly",
    name: "Yearly",
    price: "$49.99",
    period: "per year",
    badge: "Save 17%",
    description: "Best value for regular planners.",
    highlight: true,
  },
  {
    id: "premium_lifetime",
    name: "Lifetime",
    price: "$99",
    period: "one-time",
    badge: "Pay once",
    description: "Premium forever, no renewals.",
  },
];

const COMPARE = [
  { name: "Events per month", free: "1", premium: "Unlimited" },
  { name: "Guests per event", free: "25", premium: "250" },
  { name: "Groups", free: "5", premium: "Unlimited" },
  { name: "People per group", free: "6", premium: "Unlimited" },
  { name: "Custom event themes", free: false, premium: true },
  { name: "Advanced polls (deadlines, multi-choice)", free: false, premium: true },
  { name: "Live task updates", free: false, premium: true },
  { name: "Shared budget tracker", free: false, premium: true },
  { name: "Calendar exports (Google / Apple / Outlook)", free: false, premium: true },
  { name: "Priority RSVP notifications", free: false, premium: true },
  { name: "Ad-free experience", free: false, premium: true },
];

const FAQS = [
  {
    q: "Is this a real payment?",
    a: "No. This is a capstone project demo — upgrades are simulated locally so reviewers can experience the Premium UX without entering payment details.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Use the Manage plan button to cancel; you'll keep Premium access until the end of your simulated billing period.",
  },
  {
    q: "Can I switch between monthly and yearly?",
    a: "Yes. Choose another plan and the change applies immediately in this demo.",
  },
  {
    q: "Is the Lifetime plan really forever?",
    a: "In this demo, Lifetime stays active until you reset it from the Manage plan menu.",
  },
];

function UpgradePage() {
  const { user, profile } = useAuth();
  const { isActive, subscription, loading, subscribe, cancel, reset } = useSubscription();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<MockPlanId | null>(null);

  const handleSubscribe = async (planId: MockPlanId) => {
    if (!user) return;
    setProcessing(planId);
    // Simulate a brief network delay so it feels like a real checkout
    await new Promise((r) => setTimeout(r, 700));
    subscribe(planId);
    setProcessing(null);
    toast.success("🎉 Welcome to LinkUp Premium!");
    navigate({ to: "/checkout/return", search: { session_id: `demo_${Date.now()}` } });
  };

  const handleCancel = () => {
    cancel();
    toast.success("Plan canceled. You'll keep Premium until your period ends.");
  };

  const handleReset = () => {
    reset();
    toast.success("Premium removed.");
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gradient mb-4">
          <Star className="w-8 h-8 fill-black text-black" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="bg-brand-gradient bg-clip-text text-transparent">LinkUp Premium</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock everything LinkUp has to offer for you and your crew. Plan more, invite bigger, never see an ad.
        </p>
        {!loading && isActive && (
          <div className="mt-6 inline-flex items-center gap-2 bg-going/20 border border-going text-going px-4 py-2 rounded-full text-sm font-bold">
            <Sparkles className="w-4 h-4" /> You're on Premium
            {subscription?.price_id && (
              <span className="text-muted-foreground font-normal">
                ({subscription.price_id.replace("premium_", "")})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Plan cards */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        {PLANS.map((p) => {
          const isCurrent = isActive && subscription?.price_id === p.id;
          return (
            <div
              key={p.id}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
                p.highlight ? "border-brand-yellow shadow-brand" : "border-border"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gradient text-black font-bold text-xs px-3 py-1 rounded-full">
                  {p.badge}
                </span>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <div className="mt-3 mb-2">
                <span className="text-4xl font-bold">{p.price}</span>{" "}
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{p.description}</p>

              <ul className="space-y-2 text-sm flex-1 mb-6">
                {COMPARE.filter((c) => c.premium === true).slice(0, 6).map((c) => (
                  <li key={c.name} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-going mt-0.5 shrink-0" strokeWidth={3} />
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(p.id)}
                disabled={processing !== null || isCurrent}
                className={`font-bold py-3 rounded-full transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 ${
                  p.highlight
                    ? "bg-brand-gradient text-black shadow-brand"
                    : "bg-input border border-border hover:bg-card text-foreground"
                }`}
              >
                {processing === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : isCurrent ? (
                  "Current plan"
                ) : isActive ? (
                  `Switch to ${p.name}`
                ) : (
                  `Choose ${p.name}`
                )}
              </button>
            </div>
          );
        })}
      </section>

      {/* Manage plan */}
      {isActive && subscription && (
        <section className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-yellow" /> Manage your plan
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Current plan: <span className="text-brand-yellow font-bold">{subscription.price_id.replace("premium_", "")}</span>
            {subscription.current_period_end && (
              <>
                {" "}· Renews{" "}
                <span className="text-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </>
            )}
            {subscription.cancel_at_period_end && (
              <span className="ml-2 text-brand-pink font-bold">(canceling at period end)</span>
            )}
          </p>
          <div className="flex gap-3 flex-wrap">
            {subscription.price_id !== "premium_lifetime" && !subscription.cancel_at_period_end && (
              <button
                onClick={handleCancel}
                className="bg-input border border-border hover:bg-card text-foreground font-bold py-2 px-4 rounded-full transition-colors text-sm"
              >
                Cancel plan
              </button>
            )}
            <button
              onClick={handleReset}
              className="bg-input border border-border hover:bg-card text-muted-foreground font-bold py-2 px-4 rounded-full transition-colors text-sm"
            >
              Reset (demo)
            </button>
          </div>
        </section>
      )}

      {/* Comparison table */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Free vs Premium</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 font-bold">Feature</th>
                <th className="text-center py-3 font-bold text-muted-foreground w-28">Free</th>
                <th className="text-center py-3 font-bold text-brand-yellow w-32">Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((c) => (
                <tr key={c.name} className="border-b border-border last:border-0">
                  <td className="py-3 text-sm">{c.name}</td>
                  <td className="text-center py-3 text-sm">
                    {typeof c.free === "boolean" ? (
                      c.free ? (
                        <Check className="w-4 h-4 text-going mx-auto" strokeWidth={3} />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{c.free}</span>
                    )}
                  </td>
                  <td className="text-center py-3 text-sm font-bold">
                    {typeof c.premium === "boolean" ? (
                      c.premium ? (
                        <Check className="w-4 h-4 text-going mx-auto" strokeWidth={3} />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-brand-yellow">{c.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently asked</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="bg-card border border-border rounded-xl p-4 group"
            >
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-brand-yellow group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3">{f.a}</p>
            </details>
          ))}
        </div>
        {profile && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            Signed in as <span className="text-brand-yellow">@{profile.username}</span> ·{" "}
            <button onClick={() => navigate({ to: "/events" })} className="underline hover:text-brand-yellow">
              Back to my events
            </button>
          </p>
        )}
      </section>
    </main>
  );
}
