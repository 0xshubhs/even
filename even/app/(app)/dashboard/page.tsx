"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Lock, Plus, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Receipt } from "@/components/receipt/Receipt";
import { Button } from "@/components/ui/Button";
import { SettleButton } from "@/components/ui/SettleButton";
import { PrivacySeal } from "@/components/ui/PrivacySeal";
import { Monogram } from "@/components/group/Monogram";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useGroupStore, type Group, type Member } from "@/lib/store/group-store";
import { computeGroupDebts } from "@/lib/debt-graph/compute";
import { baseToUsdc } from "@/lib/utils";

interface PendingDebt {
  group: Group;
  fromMember: Member;
  toMember: Member;
  amountBase: bigint;
}

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const { groups, expenses, settlements } = useGroupStore();

  const myWallet = publicKey?.toBase58() ?? null;

  const { youOwe, owedToYou, totalOwed, totalOwedToYou } = useMemo(() => {
    const youOweList: PendingDebt[] = [];
    const owedToYouList: PendingDebt[] = [];

    for (const g of groups) {
      const me = g.members.find((m) => m.wallet === myWallet);
      if (!me) continue;
      const debts = computeGroupDebts(g, expenses, settlements);
      for (const d of debts) {
        const fromM = g.members.find((m) => m.id === d.from);
        const toM = g.members.find((m) => m.id === d.to);
        if (!fromM || !toM) continue;
        if (d.from === me.id) {
          youOweList.push({ group: g, fromMember: fromM, toMember: toM, amountBase: d.amount });
        } else if (d.to === me.id) {
          owedToYouList.push({ group: g, fromMember: fromM, toMember: toM, amountBase: d.amount });
        }
      }
    }

    youOweList.sort((a, b) => (b.amountBase > a.amountBase ? 1 : -1));
    owedToYouList.sort((a, b) => (b.amountBase > a.amountBase ? 1 : -1));

    const totalOwed = youOweList.reduce((acc, d) => acc + d.amountBase, 0n);
    const totalOwedToYou = owedToYouList.reduce((acc, d) => acc + d.amountBase, 0n);

    return {
      youOwe: youOweList,
      owedToYou: owedToYouList,
      totalOwed,
      totalOwedToYou,
    };
  }, [groups, expenses, settlements, myWallet]);

  const recentActivity = useMemo(() => {
    if (!myWallet) return [];
    const myGroupIds = new Set(
      groups.filter((g) => g.members.some((m) => m.wallet === myWallet)).map((g) => g.id)
    );
    const items = [
      ...expenses
        .filter((e) => myGroupIds.has(e.groupId))
        .map((e) => ({ kind: "expense" as const, item: e })),
      ...settlements
        .filter((s) => myGroupIds.has(s.groupId))
        .map((s) => ({ kind: "settlement" as const, item: s })),
    ];
    items.sort((a, b) => b.item.createdAt - a.item.createdAt);
    return items.slice(0, 8);
  }, [expenses, settlements, groups, myWallet]);

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
        <Wallet className="w-10 h-10 text-ink-mute mx-auto" strokeWidth={1.5} />
        <div className="space-y-2">
          <div className="eyebrow text-privacy">Dashboard</div>
          <h1 className="font-display text-4xl tracking-tight font-semibold">
            Connect your wallet
          </h1>
          <p className="text-ink-mute max-w-md mx-auto">
            Even uses your Solana wallet to identify you and to settle debts privately. Connect to
            see your dashboard.
          </p>
        </div>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  const net = totalOwedToYou - totalOwed;
  const headline =
    net === 0n ? "All settled." : net > 0n ? "You're in the black." : "Time to settle up.";

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header className="space-y-3">
        <div className="eyebrow text-privacy">Dashboard</div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight font-semibold">
          {renderHeadline(headline)}
        </h1>
        <div className="flex items-center gap-3">
          <PrivacySeal size="sm" label="Settlements shielded by Umbra" />
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <SummaryCard
          label="You owe"
          amount={baseToUsdc(totalOwed)}
          count={youOwe.length}
          tone="owed"
        />
        <SummaryCard
          label="Owed to you"
          amount={baseToUsdc(totalOwedToYou)}
          count={owedToYou.length}
          tone="owed-to"
        />
        <SummaryCard
          label="Net position"
          amount={baseToUsdc(net < 0n ? -net : net)}
          sign={net > 0n ? "+" : net < 0n ? "-" : ""}
          count={groups.filter((g) => g.members.some((m) => m.wallet === myWallet)).length}
          countLabel={(n) => `${n} ${n === 1 ? "group" : "groups"}`}
          tone="neutral"
        />
      </section>

      <div className="grid lg:grid-cols-2 gap-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow text-ink-mute">Whom to pay</h2>
            <span className="font-mono text-xs text-ink-mute">{youOwe.length} pending</span>
          </div>

          {youOwe.length === 0 ? (
            <Receipt>
              <div className="py-6 text-center text-sm text-ink-mute">Nothing owed. Nice.</div>
            </Receipt>
          ) : (
            <Receipt>
              {youOwe.map((d, i) => (
                <PendingRow
                  key={`${d.group.id}-${i}`}
                  counterparty={d.toMember.handle}
                  groupName={d.group.name}
                  groupId={d.group.id}
                  amount={d.amountBase}
                  direction="you-owe"
                  settleHref={`/groups/${d.group.id}/settle?from=${d.fromMember.id}&to=${d.toMember.id}&amount=${d.amountBase.toString()}`}
                />
              ))}
            </Receipt>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow text-ink-mute">Hasn&rsquo;t paid you</h2>
            <span className="font-mono text-xs text-ink-mute">
              {owedToYou.length} outstanding
            </span>
          </div>

          {owedToYou.length === 0 ? (
            <Receipt>
              <div className="py-6 text-center text-sm text-ink-mute">
                No one owes you anything right now.
              </div>
            </Receipt>
          ) : (
            <Receipt>
              {owedToYou.map((d, i) => (
                <PendingRow
                  key={`${d.group.id}-${i}`}
                  counterparty={d.fromMember.handle}
                  groupName={d.group.name}
                  groupId={d.group.id}
                  amount={d.amountBase}
                  direction="owed-to"
                />
              ))}
            </Receipt>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow text-ink-mute">Recent activity</h2>
          <Link href="/groups">
            <Button variant="ghost" size="sm">
              All groups <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-12 text-center text-ink-mute text-sm">
            Add an expense to start tracking.
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-paper-rim border-y border-dashed border-paper-rim">
            {recentActivity.map((entry) => {
              const group = groups.find((g) => g.id === entry.item.groupId);
              if (!group) return null;
              if (entry.kind === "expense") {
                const e = entry.item;
                const payer = group.members.find((m) => m.id === e.paidBy);
                return (
                  <div key={`e-${e.id}`} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Monogram name={group.name} size="sm" />
                      <div className="min-w-0">
                        <div className="eyebrow text-ink-mute">Expense · {group.name}</div>
                        <div className="font-display text-lg leading-tight mt-0.5">
                          {e.description || "Untitled"}
                        </div>
                        <div className="text-xs text-ink-mute mt-0.5">
                          Paid by <span className="text-ink-soft">{payer?.handle ?? "?"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums font-semibold">
                        ${baseToUsdc(e.amountBase).toFixed(2)}
                      </div>
                      <div className="text-xs text-ink-mute">
                        {new Date(e.createdAt).toLocaleString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              const s = entry.item;
              const fromM = group.members.find((m) => m.id === s.fromMemberId);
              const toM = group.members.find((m) => m.id === s.toMemberId);
              const meId = group.members.find((m) => m.wallet === myWallet)?.id;
              const youInvolved = s.fromMemberId === meId || s.toMemberId === meId;
              return (
                <div key={`s-${s.id}`} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Monogram name={group.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="eyebrow text-ink-mute">Settlement · {group.name}</div>
                        <PrivacySeal size="sm" />
                      </div>
                      <div className="font-display text-lg leading-tight mt-0.5">
                        {fromM?.handle ?? "?"} → {toM?.handle ?? "?"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums font-semibold">
                      {youInvolved ? `$${baseToUsdc(s.amountBase).toFixed(2)}` : "$••.••"}
                    </div>
                    <div className="text-xs text-ink-mute">
                      {new Date(s.createdAt).toLocaleString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Link href="/groups/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" /> New group
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Render the dashboard headline with one indigo-italic accent word. */
function renderHeadline(headline: string) {
  const accents: Record<string, string> = {
    "All settled.": "settled",
    "You're in the black.": "black",
    "Time to settle up.": "settle",
  };
  const word = accents[headline];
  if (!word) return headline;
  const idx = headline.indexOf(word);
  return (
    <>
      {headline.slice(0, idx)}
      <span className="accent-word">{word}</span>
      {headline.slice(idx + word.length)}
    </>
  );
}

function SummaryCard({
  label,
  amount,
  sign = "",
  count,
  countLabel,
  tone,
}: {
  label: string;
  amount: number;
  sign?: string;
  count: number;
  countLabel?: (n: number) => string;
  tone: "owed" | "owed-to" | "neutral";
}) {
  const toneClass =
    tone === "owed" ? "text-owed" : tone === "owed-to" ? "text-owed-to" : "text-ink";

  return (
    <Receipt>
      <div className="space-y-2">
        <div className="eyebrow text-ink-mute">{label}</div>
        <div className={`font-mono tabular-nums text-3xl font-semibold ${toneClass}`}>
          {sign}${amount.toFixed(2)}
        </div>
        <div className="text-xs text-ink-mute">
          {countLabel ? countLabel(count) : `${count} ${count === 1 ? "debt" : "debts"}`}
        </div>
      </div>
    </Receipt>
  );
}

function PendingRow({
  counterparty,
  groupName,
  groupId,
  amount,
  direction,
  settleHref,
}: {
  counterparty: string;
  groupName: string;
  groupId: string;
  amount: bigint;
  direction: "you-owe" | "owed-to";
  settleHref?: string;
}) {
  const usd = baseToUsdc(amount).toFixed(2);
  const arrow = direction === "you-owe" ? "→" : "←";
  const amountClass = direction === "you-owe" ? "text-owed" : "text-owed-to";

  return (
    <div className="group flex items-center justify-between py-3.5 border-b border-dashed border-paper-rim last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{direction === "you-owe" ? "You" : counterparty}</span>
          <span className="text-ink-ghost">{arrow}</span>
          <span className="text-base text-ink-soft truncate">
            {direction === "you-owe" ? counterparty : "You"}
          </span>
        </div>
        <Link
          href={`/groups/${groupId}`}
          className="font-mono text-xs text-ink-mute hover:text-ink shrink-0"
        >
          {groupName}
        </Link>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`font-mono tabular-nums text-lg font-semibold ${amountClass}`}>
          ${usd}
        </span>
        {settleHref && (
          <Link
            href={settleHref}
            className="md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <SettleButton size="sm" className="text-xs">
              Settle <Lock className="w-3 h-3 ml-1.5" strokeWidth={2} />
            </SettleButton>
          </Link>
        )}
      </div>
    </div>
  );
}
