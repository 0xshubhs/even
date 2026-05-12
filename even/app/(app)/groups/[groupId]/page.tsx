"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Receipt } from "@/components/receipt/Receipt";
import { Button } from "@/components/ui/Button";
import { PrivacySeal } from "@/components/ui/PrivacySeal";
import { LedgerRow } from "@/components/group/LedgerRow";
import { ShareGroupButton } from "@/components/group/ShareGroupButton";
import { useGroupStore } from "@/lib/store/group-store";
import { computeGroupDebts } from "@/lib/debt-graph/compute";
import { baseToUsdc, shortAddress } from "@/lib/utils";
import { Monogram } from "@/components/group/Monogram";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const { publicKey } = useWallet();
  const { groups, expenses, settlements } = useGroupStore();

  const myWallet = publicKey?.toBase58() ?? null;
  const group = groups.find((g) => g.id === params.groupId);

  const me = useMemo(
    () => (group && myWallet ? group.members.find((m) => m.wallet === myWallet) : undefined),
    [group, myWallet]
  );

  const groupExpenses = useMemo(
    () => (group ? expenses.filter((e) => e.groupId === group.id) : []),
    [expenses, group]
  );
  const groupSettlements = useMemo(
    () => (group ? settlements.filter((s) => s.groupId === group.id) : []),
    [settlements, group]
  );

  const debts = useMemo(
    () => (group ? computeGroupDebts(group, expenses, settlements) : []),
    [group, expenses, settlements]
  );

  const totalSpent = useMemo(
    () => groupExpenses.reduce((acc, e) => acc + e.amountBase, 0n),
    [groupExpenses]
  );

  if (!group) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="font-display text-3xl">Group not found</div>
        <p className="text-ink-mute">It may have been removed, or this device doesn&rsquo;t have it stored.</p>
        <Link href="/groups">
          <Button variant="paper">Back to groups</Button>
        </Link>
      </div>
    );
  }

  const memberById = (id: string) => group.members.find((m) => m.id === id);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      <header className="space-y-3">
        <Link href="/groups" className="eyebrow text-ink-mute hover:text-ink">
          ← All groups
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          <Monogram name={group.name} size="lg" />
          <h1 className="font-display text-4xl tracking-tight font-semibold">{group.name}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-mute flex-wrap">
          <span>
            {group.members.length} {group.members.length === 1 ? "member" : "members"}
          </span>
          <span>·</span>
          <span className="font-mono">${baseToUsdc(totalSpent).toFixed(2)} total</span>
          <PrivacySeal size="sm" label="Settlements shielded" />
        </div>
        <div>
          <ShareGroupButton groupId={group.id} />
        </div>
      </header>

      {/* Ledger */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="eyebrow text-ink-mute">Who owes who</h2>
          <Link href={`/groups/${group.id}/add-expense`}>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-1.5" /> Add expense
            </Button>
          </Link>
        </div>

        {debts.length === 0 ? (
          <Receipt>
            <div className="py-6 text-center space-y-1">
              <div className="font-display text-xl">All settled</div>
              <div className="text-sm text-ink-mute">No outstanding debts in this group.</div>
            </div>
          </Receipt>
        ) : (
          <Receipt>
            {debts.map((d, i) => {
              const fromM = memberById(d.from);
              const toM = memberById(d.to);
              if (!fromM || !toM) return null;
              const fromIsYou = !!me && fromM.id === me.id;
              const toIsYou = !!me && toM.id === me.id;
              return (
                <LedgerRow
                  key={i}
                  from={{ handle: fromM.handle, isYou: fromIsYou }}
                  to={{ handle: toM.handle, isYou: toIsYou }}
                  amount={d.amount}
                  onSettle={
                    fromIsYou
                      ? () =>
                          router.push(
                            `/groups/${group.id}/settle?from=${fromM.id}&to=${toM.id}&amount=${d.amount.toString()}`
                          )
                      : undefined
                  }
                />
              );
            })}
          </Receipt>
        )}
      </section>

      {/* Activity */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink-mute">Activity</h2>

        {groupExpenses.length === 0 && groupSettlements.length === 0 ? (
          <div className="py-12 text-center text-ink-mute text-sm">
            Add an expense to start tracking.
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-paper-rim">
            {[
              ...groupExpenses.map((e) => ({ kind: "expense" as const, item: e })),
              ...groupSettlements.map((s) => ({ kind: "settlement" as const, item: s })),
            ]
              .sort((a, b) => b.item.createdAt - a.item.createdAt)
              .map((entry) => {
                if (entry.kind === "expense") {
                  const e = entry.item;
                  const payer = memberById(e.paidBy);
                  return (
                    <div key={`e-${e.id}`} className="py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="eyebrow text-ink-mute">Expense</div>
                        <div className="font-display text-xl mt-1">{e.description || "Untitled"}</div>
                        <div className="text-sm text-ink-mute mt-1">
                          Paid by{" "}
                          <span className="text-ink-soft">{payer?.handle ?? "?"}</span> · split with{" "}
                          {e.splitBetween.length}{" "}
                          {e.splitBetween.length === 1 ? "person" : "people"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono tabular-nums text-lg font-semibold">
                          ${baseToUsdc(e.amountBase).toFixed(2)}
                        </div>
                        <div className="text-xs text-ink-mute">
                          {new Date(e.createdAt).toLocaleString("en", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }
                const s = entry.item;
                const fromM = memberById(s.fromMemberId);
                const toM = memberById(s.toMemberId);
                const youInvolved =
                  !!me && (s.fromMemberId === me.id || s.toMemberId === me.id);
                return (
                  <Link
                    key={`s-${s.id}`}
                    href={`/settlements/${s.id}`}
                    className="py-4 flex items-start justify-between gap-4 hover:bg-paper-deep/40 -mx-2 px-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="eyebrow text-ink-mute">Settlement</div>
                        <PrivacySeal size="sm" />
                      </div>
                      <div className="font-display text-xl mt-1">
                        {fromM?.handle ?? "?"} → {toM?.handle ?? "?"}
                      </div>
                      {!youInvolved && (
                        <div className="text-xs text-ink-mute mt-1 italic">
                          Amount hidden — only the parties involved can see it.
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums text-lg font-semibold">
                        {youInvolved ? `$${baseToUsdc(s.amountBase).toFixed(2)}` : "$••.••"}
                      </div>
                      <div className="text-xs text-ink-mute">
                        {new Date(s.createdAt).toLocaleString("en", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </section>

      {/* Members */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink-mute">Members</h2>
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <div
              key={m.id}
              className="border border-paper-rim bg-paper-deep px-3 py-1.5 flex items-center gap-2"
            >
              <span className="text-sm font-semibold">
                {me && m.id === me.id ? "You" : m.handle}
              </span>
              <span className="font-mono text-xs text-ink-mute">{shortAddress(m.wallet, 4)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
