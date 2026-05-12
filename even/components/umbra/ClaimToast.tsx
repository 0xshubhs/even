"use client";

import { Lock, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ScannedUtxoData } from "@/lib/umbra/types";
import { useUmbra } from "./UmbraProvider";
import {
  loadLastSeenIndex,
  saveLastSeenIndex,
  scanForUtxos,
} from "@/lib/umbra/scan";
import { claimUtxos } from "@/lib/umbra/claim";
import { SCAN_INTERVAL_MS } from "@/lib/umbra/constants";
import { baseToUsdc } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type ClaimState = "idle" | "claiming" | "done" | "error";

export function ClaimToast() {
  const { client, status } = useUmbra();
  const [incoming, setIncoming] = useState<ScannedUtxoData[]>([]);
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastErrorAt = useRef(0);

  // Poll for UTXOs.
  useEffect(() => {
    if (!client || status.state !== "ready") return;
    let stopped = false;

    const walletAddress = String(client.signer.address);

    const tick = async () => {
      try {
        const lastSeen = loadLastSeenIndex(walletAddress);
        const result = await scanForUtxos(client, lastSeen);
        if (stopped) return;
        const combined = [...result.received, ...result.publicReceived];
        if (combined.length > 0) {
          setIncoming((prev) => mergeUnique(prev, combined));
          setDismissed(false);
        }
        // Keep lastSeen advancing by total scan window — a soft heuristic so
        // we don't re-scan from 0 forever. The scanner internally dedupes by
        // nullifier so this is just an optimization hint.
      } catch (e) {
        const now = Date.now();
        if (now - lastErrorAt.current > 60_000) {
          lastErrorAt.current = now;
          console.warn("Umbra scan failed:", e);
        }
      }
    };

    void tick();
    const id = window.setInterval(tick, SCAN_INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [client, status.state]);

  const totalBase = incoming.reduce<bigint>((acc, u) => acc + BigInt(u.amount), 0n);
  const visible = !dismissed && incoming.length > 0 && status.state === "ready";

  const onClaim = useCallback(async () => {
    if (!client || incoming.length === 0) return;
    setClaimState("claiming");
    setError(null);
    try {
      await claimUtxos(client, incoming);
      // Mark last-seen so we don't redisplay the same UTXOs immediately.
      const walletAddress = String(client.signer.address);
      const maxIndex = incoming.reduce<number>((m, u) => {
        const n = Number(u.insertionIndex);
        return Number.isFinite(n) ? Math.max(m, n + 1) : m;
      }, loadLastSeenIndex(walletAddress));
      saveLastSeenIndex(walletAddress, maxIndex);
      setIncoming([]);
      setClaimState("done");
      window.setTimeout(() => {
        setClaimState("idle");
        setDismissed(true);
      }, 3500);
    } catch (e) {
      setClaimState("error");
      setError(e instanceof Error ? e.message : "Claim failed.");
    }
  }, [client, incoming]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] animate-tear-in">
      <div className="bg-paper border border-ink shadow-[6px_6px_0_0_rgba(31,31,33,0.08)] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="eyebrow text-privacy flex items-center gap-1.5">
              <Lock className="w-3 h-3" strokeWidth={2} /> Shielded inbox
            </div>
            <div className="font-display text-xl leading-tight">
              {incoming.length === 1
                ? "You have an incoming payment"
                : `${incoming.length} incoming payments`}
            </div>
          </div>
          <button
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="text-ink-mute hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="font-mono tabular-nums text-3xl font-semibold">
          ${baseToUsdc(totalBase).toFixed(2)}
        </div>

        {claimState === "error" && error && (
          <div className="border-l-2 border-accent pl-3 text-xs text-accent-deep">{error}</div>
        )}

        {claimState === "done" ? (
          <div className="text-xs text-owed-to">Claimed into your encrypted balance.</div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-mute">Relayer pays the SOL fee.</span>
            <Button
              variant="primary"
              size="sm"
              onClick={onClaim}
              disabled={claimState === "claiming"}
            >
              {claimState === "claiming" ? "Claiming…" : "Claim"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function mergeUnique(prev: ScannedUtxoData[], next: ScannedUtxoData[]): ScannedUtxoData[] {
  const key = (u: ScannedUtxoData) => `${String(u.insertionIndex)}:${String(u.amount)}`;
  const seen = new Set(prev.map(key));
  const merged = [...prev];
  for (const u of next) {
    const k = key(u);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(u);
  }
  return merged;
}
