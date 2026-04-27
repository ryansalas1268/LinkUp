import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Check, X, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upgrade")({
  component: UpgradePage,
});

type PlanId = "premium_monthly" | "premium_yearly" | "premium_lifetime";

interface Plan {
  id: PlanId;
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
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing portal and you'll keep Premium access until the end of your current billing period.",
  },
  {
    q: "What payment methods are accepted?",
    a: "All major credit and debit cards via Stripe. In test mode, use card 4242 4242 4242 4242.",
  },
  {
    q: "Can I switch between monthly and yearly?",
    a: "Yes. Plan changes take effect immediately and are prorated automatically.",
  },
  {
    q: "Is the Lifetime plan really forever?",
    a: "Yes — one payment, Premium for the lifetime of your LinkUp account, including all future Premium features.",
  },
];

function UpgradePage() {
  const { user, profile } = useAuth();
  const { isActive, subscription, loading } = useSubscription();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/upgrade`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open billing portal");
      window.open(data.url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpeningPortal(false);
    }
  };

  if (selected) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-muted-foreground hover:text-brand-yellow mb-4"
        >
          ← Back to plans
        </button>
        <h1 className="text-3xl font-bold mb-2">
          Complete your{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            {PLANS.find((p) => p.id === selected)?.name}
          </span>{" "}
          purchase
        </h1>
        <p className="text-muted-foreground mb-6">
          Secure checkout powered by Stripe. Use test card{" "}
          <code className="text-brand-yellow">4242 4242 4242 4242</code>.
        </p>
        <StripeEmbeddedCheckout
          priceId={selected}
          userId={user?.id}
          customerEmail={user?.email ?? undefined}
          returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
        />
      </main>
    );
  }

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
        {PLANS.map((p) => (
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

            {isActive ? (
              <button
                onClick={openPortal}
                disabled={openingPortal}
                className="bg-input border border-border hover:bg-card text-foreground font-bold py-3 rounded-full transition-colors disabled:opacity-60"
              >
                {openingPortal ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Manage plan"}
              </button>
            ) : (
              <button
                onClick={() => setSelected(p.id)}
                className={`font-bold py-3 rounded-full transition-transform hover:scale-[1.02] ${
                  p.highlight
                    ? "bg-brand-gradient text-black shadow-brand"
                    : "bg-input border border-border hover:bg-card text-foreground"
                }`}
              >
                Choose {p.name}
              </button>
            )}
          </div>
        ))}
      </section>

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
