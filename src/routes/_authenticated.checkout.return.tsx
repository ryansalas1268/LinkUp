import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/checkout/return")({
  component: CheckoutReturnPage,
  validateSearch: searchSchema,
});

function CheckoutReturnPage() {
  const { session_id } = useSearch({ from: "/_authenticated/checkout/return" });

  useEffect(() => {
    if (session_id) toast.success("🎉 Welcome to LinkUp Premium!");
  }, [session_id]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-gradient mb-6">
        <CheckCircle2 className="w-10 h-10 text-black" strokeWidth={3} />
      </div>
      <h1 className="text-4xl font-bold mb-3">
        <span className="bg-brand-gradient bg-clip-text text-transparent">You're Premium! 🎉</span>
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Thanks for upgrading. All Premium features are now unlocked across LinkUp.
      </p>

      <div className="bg-card border border-border rounded-xl p-6 text-left mb-8">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-yellow" /> What's unlocked
        </h2>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Unlimited events &amp; up to 250 guests each</li>
          <li>• Custom themes, advanced polls, and live task updates</li>
          <li>• Shared budget tracker and calendar exports</li>
          <li>• Priority RSVP notifications, ad-free</li>
        </ul>
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          to="/events"
          className="bg-brand-gradient text-black font-bold px-6 py-3 rounded-full shadow-brand hover:scale-105 transition-transform"
        >
          Go to my events
        </Link>
        <Link
          to="/upgrade"
          className="bg-input border border-border hover:bg-card text-foreground font-bold px-6 py-3 rounded-full transition-colors"
        >
          Manage plan
        </Link>
      </div>

      {session_id && (
        <p className="text-xs text-muted-foreground mt-8">
          Reference: <code>{session_id}</code>
        </p>
      )}
    </main>
  );
}
