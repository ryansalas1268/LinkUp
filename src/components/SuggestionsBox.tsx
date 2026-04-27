import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DC_PICKS, GLOBAL_PICKS, type Pick as TopPick } from "@/lib/topPicks";

function PicksGroup({ title, flag, picks }: { title: string; flag: string; picks: TopPick[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? picks : picks.slice(0, 6);
  const copyPick = async (p: TopPick) => {
    const label = `${p.name} — ${p.area}`;
    try {
      await navigator.clipboard.writeText(label);
      toast.success(`Copied "${p.name}"`);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
          <span className="mr-1">{flag}</span>{title}
        </p>
        {picks.length > 6 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-brand-yellow font-bold hover:underline"
          >
            {expanded ? "Show less" : `Show all ${picks.length}`}
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {visible.map((p) => (
          <li key={p.name}>
            <button
              type="button"
              onClick={() => copyPick(p)}
              className="w-full text-left bg-input hover:border-brand-yellow border border-border rounded-lg px-3 py-2.5 transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-sm group-hover:text-brand-yellow">{p.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold shrink-0">{p.category}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{p.area}</div>
                  <div className="text-xs text-muted-foreground/80 mt-0.5">{p.blurb}</div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SuggestionsBox({ className = "mb-8" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={className}>
      <div className="rounded-2xl border border-dashed border-border bg-input/30 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-brand-yellow shrink-0" />
            <span className="text-sm">
              <span className="font-bold">Need ideas for next time?</span>{" "}
              <span className="text-muted-foreground">A few hand-picked spots in DC and abroad.</span>
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-brand-yellow font-bold shrink-0">
            {open ? "Hide" : "Show"}
          </span>
        </button>
        {open && (
          <div className="grid md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-dashed border-border">
            <PicksGroup title="Local — Washington, D.C." flag="🏛️" picks={DC_PICKS} />
            <PicksGroup title="Global Bucket List" flag="🌍" picks={GLOBAL_PICKS} />
          </div>
        )}
      </div>
    </section>
  );
}
