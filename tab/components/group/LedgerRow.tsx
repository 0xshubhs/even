"use client";

import { ArrowRight, Lock } from "lucide-react";
import { SettleButton } from "@/components/ui/SettleButton";
import { baseToUsdc } from "@/lib/utils";

interface LedgerRowProps {
  from: { handle: string; isYou: boolean };
  to: { handle: string; isYou: boolean };
  amount: bigint;
  onSettle?: () => void;
}

export function LedgerRow({ from, to, amount, onSettle }: LedgerRowProps) {
  const usd = baseToUsdc(amount);
  const youCanSettle = from.isYou && !!onSettle;

  return (
    <div className="group flex items-center justify-between py-4 border-b border-dashed border-paper-rim last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-base">
          <span className={from.isYou ? "font-semibold" : "text-ink-soft"}>
            {from.isYou ? "You" : from.handle}
          </span>
          <ArrowRight className="w-4 h-4 text-ink-ghost" strokeWidth={1.5} />
          <span className={to.isYou ? "font-semibold" : "text-ink-soft"}>
            {to.isYou ? "You" : to.handle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono tabular-nums text-lg font-semibold">
          ${usd.toFixed(2)}
        </span>
        {youCanSettle && (
          <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
            <SettleButton onClick={onSettle} size="sm" className="text-xs">
              Settle <Lock className="w-3 h-3 ml-1.5" strokeWidth={2} />
            </SettleButton>
          </div>
        )}
      </div>
    </div>
  );
}
