"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { GroupCard } from "@/components/group/GroupCard";
import { useGroupStore } from "@/lib/store/group-store";
import { netBalanceForMember } from "@/lib/debt-graph/compute";

export default function GroupsPage() {
  const { connected, publicKey } = useWallet();
  const { groups, expenses, settlements } = useGroupStore();

  const myWallet = publicKey?.toBase58() ?? null;

  const decoratedGroups = useMemo(() => {
    return groups.map((g) => {
      const me = g.members.find((m) => m.wallet === myWallet);
      const balance = me ? netBalanceForMember(g, expenses, settlements, me.id) : 0n;
      return {
        id: g.id,
        name: g.name,
        memberCount: g.members.length,
        yourBalanceBase: balance,
      };
    });
  }, [groups, expenses, settlements, myWallet]);

  return (
    <>
      <AppHeader />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="eyebrow text-ink-mute">Your shared expenses</div>
            <h1 className="font-display text-4xl tracking-tight font-semibold mt-1">Groups</h1>
          </div>
          <Link href="/groups/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-1.5" /> New group
            </Button>
          </Link>
        </div>

        <div className="tear" />

        {!connected ? (
          <EmptyState
            title="Connect a wallet to start"
            body="Tab uses your Solana wallet to identify you and to settle debts privately. Connect Phantom or Solflare to begin."
          />
        ) : decoratedGroups.length === 0 ? (
          <EmptyState
            title="No groups yet"
            body="Start a group to split anything with anyone — a trip, an apartment, a coworker gift."
            cta={
              <Link href="/groups/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-1.5" /> New group
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {decoratedGroups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="py-20 text-center space-y-6 max-w-md mx-auto">
      <svg width="72" height="96" viewBox="0 0 72 96" className="text-ink-ghost mx-auto" aria-hidden>
        <rect
          x="8"
          y="8"
          width="56"
          height="80"
          fill="hsl(var(--paper-deep))"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <line x1="18" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="1" />
        <line x1="18" y1="38" x2="46" y2="38" stroke="currentColor" strokeWidth="1" />
        <line x1="18" y1="58" x2="54" y2="58" stroke="currentColor" strokeWidth="1" />
        <line x1="18" y1="68" x2="40" y2="68" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="space-y-2">
        <div className="font-display text-2xl tracking-tight">{title}</div>
        <div className="text-ink-mute text-sm leading-relaxed">{body}</div>
      </div>
      {cta}
    </div>
  );
}
