import { Hammer } from "lucide-react";

// Themed placeholder for shell routes whose real screens are built in a later
// deliverable. Keeps the nav fully navigable without 404s.
export function ComingSoon({ title, deliverable, track }: { title: string; deliverable: string; track: "A" | "B" }) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="rlp-card p-8">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
            <Hammer size={18} className="text-[var(--accent)]" />
          </span>
          <div>
            <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-[var(--text)] leading-tight">{title}</h1>
            <p className="text-[12px] text-[var(--faint)]">
              {deliverable} · Track {track}
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--muted)] mt-4">
          This screen is scaffolded in the retail shell and will be built in {deliverable}.
          The theme, navigation, layout, and role scoping are already live.
        </p>
      </div>
    </div>
  );
}
