import type { ReactNode } from "react";

export function ReceiptHeader({ merchant, meta }: { merchant: string; meta?: ReactNode }) {
  return (
    <div className="space-y-1 mb-4 text-center">
      <div className="font-display text-2xl tracking-tight">{merchant}</div>
      {meta && (
        <div className="font-mono text-xs text-ink-mute uppercase tracking-wider">{meta}</div>
      )}
      <div className="tear pt-2 mt-2" />
    </div>
  );
}
