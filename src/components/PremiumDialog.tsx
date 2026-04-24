import { useState } from "react";
import { Star, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const PREMIUM_FEATURES = [
  { title: "Unlimited events", desc: "Host as many hangouts as you want — no monthly cap." },
  { title: "Larger guest lists", desc: "Invite up to 250 friends per event." },
  { title: "Custom event themes", desc: "Personalize colors, banners, and cover images." },
  { title: "Advanced polls", desc: "Multiple-choice time & place voting with deadlines." },
  { title: "Priority notifications", desc: "Push reminders and RSVP nudges sent first." },
  { title: "Shared budget tracker", desc: "Split costs and track who paid what." },
  { title: "Exportable calendars", desc: "Sync events to Google, Apple, and Outlook calendars." },
  { title: "Ad-free experience", desc: "Enjoy LinkUp without any promotional content." },
];

export function PremiumDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center mb-2">
            <Star className="w-7 h-7 fill-black text-black" />
          </div>
          <DialogTitle className="text-center text-2xl">
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              LinkUp Premium
            </span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock everything LinkUp has to offer for you and your crew.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {PREMIUM_FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center mt-0.5">
                <Check className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-bold text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-3xl font-bold">$4.99</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Cancel anytime.</p>
        </div>

        <DialogFooter className="sm:justify-center mt-2">
          <button
            onClick={() => setOpen(false)}
            className="bg-brand-gradient text-black font-bold px-8 py-3 rounded-full shadow-brand hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Star className="w-4 h-4 fill-black" /> Upgrade now
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
