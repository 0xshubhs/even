"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

const PHASES = [
  "Generating commitment",
  "Building Merkle proof",
  "Running Groth16",
  "Submitting to Solana",
];

export function ProofGenerationOverlay({ onCancel }: { onCancel?: () => void }) {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      setElapsed(e);
      setPhase(Math.min(PHASES.length - 1, Math.floor(e / 1.5)));
    }, 100);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-paper/85 backdrop-blur-[2px] flex items-center justify-center animate-fade-in">
      <div className="bg-paper-deep border border-paper-rim shadow-2xl max-w-md w-full mx-4">
        <div className="px-8 py-10 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-privacy flex items-center justify-center bg-paper">
                <Lock className="w-8 h-8 text-privacy" strokeWidth={1.5} />
              </div>
              <div
                className="absolute inset-0 border-2 border-dashed border-privacy/40 animate-spin"
                style={{ animationDuration: "8s" }}
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="font-display text-2xl tracking-tight">Sealing your payment</div>
            <div className="text-sm text-ink-mute">
              Computing zero-knowledge proof so no one but you and the recipient can see the amount.
            </div>
          </div>

          <div className="font-mono text-sm space-y-1.5">
            {PHASES.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <div
                  className={
                    i < phase
                      ? "w-1.5 h-1.5 bg-privacy"
                      : i === phase
                      ? "w-1.5 h-1.5 bg-privacy animate-cursor-blink"
                      : "w-1.5 h-1.5 bg-paper-rim"
                  }
                />
                <span className={i <= phase ? "text-ink" : "text-ink-ghost"}>
                  {p}
                  {i === phase && (
                    <span className="inline-block w-2 h-3 ml-1 bg-ink animate-cursor-blink align-middle" />
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="h-1 bg-paper-rim relative overflow-hidden">
              <div
                className="h-full bg-privacy transition-[width] duration-100 ease-out"
                style={{ width: `${Math.min(95, (elapsed / 6) * 95)}%` }}
              />
            </div>
            <div className="flex justify-between text-eyebrow text-ink-mute">
              <span>Elapsed</span>
              <span className="font-mono tabular-nums">{elapsed.toFixed(1)}s</span>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full text-xs text-ink-mute hover:text-ink underline underline-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
