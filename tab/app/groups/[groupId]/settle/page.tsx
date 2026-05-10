"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Lock } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Receipt } from "@/components/receipt/Receipt";
import { ReceiptHeader } from "@/components/receipt/ReceiptHeader";
import { ReceiptLine } from "@/components/receipt/ReceiptLine";
import { Button } from "@/components/ui/Button";
import { SettleButton } from "@/components/ui/SettleButton";
import { ProofGenerationOverlay } from "@/components/umbra/ProofGenerationOverlay";
import { SettlementReceipt } from "@/components/settlement/SettlementReceipt";
import { useGroupStore } from "@/lib/store/group-store";
import { settleDebt } from "@/lib/umbra/settle";
import { baseToUsdc } from "@/lib/utils";

export default function SettlePage() {
  return (
    <Suspense fallback={null}>
      <SettleInner />
    </Suspense>
  );
}

function SettleInner() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const search = useSearchParams();
  const { publicKey } = useWallet();
  const { groups, addSettlement } = useGroupStore();

  const group = groups.find((g) => g.id === params.groupId);
  const fromId = search.get("from") ?? "";
  const toId = search.get("to") ?? "";
  const amountStr = search.get("amount") ?? "0";
  const amountBase = (() => {
    try {
      return BigInt(amountStr);
    } catch {
      return 0n;
    }
  })();

  const fromMember = group?.members.find((m) => m.id === fromId);
  const toMember = group?.members.find((m) => m.id === toId);

  const [phase, setPhase] = useState<"confirm" | "proving" | "done">("confirm");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect back after success
  useEffect(() => {
    if (phase !== "done" || !group) return;
    const t = setTimeout(() => router.push(`/groups/${group.id}`), 4500);
    return () => clearTimeout(t);
  }, [phase, group, router]);

  if (!group || !fromMember || !toMember || amountBase <= 0n) {
    return (
      <>
        <AppHeader />
        <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
          <div className="font-display text-3xl">Settlement not found</div>
          <Link href={group ? `/groups/${group.id}` : "/groups"}>
            <Button variant="paper">Back</Button>
          </Link>
        </div>
      </>
    );
  }

  const myWallet = publicKey?.toBase58() ?? null;
  const isDebtor = fromMember.wallet === myWallet;

  async function onSettle() {
    setError(null);
    if (!isDebtor) {
      setError("Only the debtor can settle this debt.");
      return;
    }
    if (!toMember || !group) return;

    setPhase("proving");
    try {
      const result = await settleDebt({
        recipientWallet: toMember.wallet,
        amountBase,
      });
      addSettlement({
        groupId: group.id,
        fromMemberId: fromMember!.id,
        toMemberId: toMember.id,
        amountBase,
        signature: result.signature,
        shielded: result.shielded,
      });
      setSignature(result.signature);
      setPhase("done");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Settlement failed.");
      setPhase("confirm");
    }
  }

  return (
    <>
      <AppHeader />
      <div className="max-w-md mx-auto px-6 py-12 space-y-8">
        <Link href={`/groups/${group.id}`} className="eyebrow text-ink-mute hover:text-ink">
          ← {group.name}
        </Link>

        {phase === "confirm" && (
          <>
            <div className="space-y-2">
              <div className="eyebrow text-ink-mute">Settle up</div>
              <h1 className="font-display text-4xl tracking-tight font-semibold">
                Confirm settlement
              </h1>
            </div>

            <Receipt>
              <ReceiptHeader merchant="TAB" meta="Settling debt" />
              <div className="space-y-1">
                <ReceiptLine label="From" value={fromMember.handle} />
                <ReceiptLine label="To" value={toMember.handle} />
                <ReceiptLine label="Group" value={group.name} />
                <ReceiptLine label="Amount" value={`$${baseToUsdc(amountBase).toFixed(2)}`} emphasis />
              </div>

              <div className="tear my-4" />

              <div className="text-sm text-ink-soft leading-relaxed flex gap-2">
                <Lock className="w-4 h-4 mt-0.5 text-privacy shrink-0" strokeWidth={2} />
                <span>
                  This payment will be shielded. Only you and {toMember.handle} will see the amount —
                  other group members see only that the debt was cleared.
                </span>
              </div>
            </Receipt>

            {!isDebtor && (
              <div className="border-l-2 border-accent pl-3 text-sm text-accent-deep">
                Connect the debtor&rsquo;s wallet ({fromMember.handle}) to send this settlement.
              </div>
            )}

            {error && (
              <div className="border-l-2 border-accent pl-3 text-sm text-accent-deep">{error}</div>
            )}

            <div className="flex justify-between items-center gap-3 pt-4 border-t border-dashed border-paper-rim">
              <Link href={`/groups/${group.id}`}>
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <SettleButton onClick={onSettle} disabled={!isDebtor} className="text-sm">
                Settle ▸
              </SettleButton>
            </div>
          </>
        )}

        {phase === "proving" && <ProofGenerationOverlay />}

        {phase === "done" && signature && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="eyebrow text-owed-to">Settled</div>
              <div className="font-display text-3xl tracking-tight">Payment shielded ✓</div>
            </div>
            <SettlementReceipt
              to={toMember.handle}
              amountBase={amountBase}
              signature={signature}
              groupName={group.name}
              timestamp={new Date()}
            />
            <div className="text-center text-xs text-ink-mute">
              Returning to group…
            </div>
          </div>
        )}
      </div>
    </>
  );
}
