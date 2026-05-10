"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useGroupStore } from "@/lib/store/group-store";
import { usdcToBase } from "@/lib/utils";

export default function AddExpensePage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const { publicKey } = useWallet();
  const { groups, addExpense } = useGroupStore();

  const group = groups.find((g) => g.id === params.groupId);
  const myWallet = publicKey?.toBase58() ?? null;
  const me = group?.members.find((m) => m.wallet === myWallet);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [splitBetween, setSplitBetween] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Default payer = me, split = everyone
  useEffect(() => {
    if (!group) return;
    setPaidBy((prev) => prev || me?.id || group.members[0]?.id || "");
    setSplitBetween(new Set(group.members.map((m) => m.id)));
  }, [group, me]);

  const splitArray = useMemo(() => Array.from(splitBetween), [splitBetween]);

  if (!group) {
    return (
      <>
        <AppHeader />
        <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
          <div className="font-display text-3xl">Group not found</div>
          <Link href="/groups">
            <Button variant="paper">Back to groups</Button>
          </Link>
        </div>
      </>
    );
  }

  function toggleSplit(id: string) {
    setSplitBetween((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!description.trim()) {
      setError("What was this expense for?");
      return;
    }
    if (!paidBy) {
      setError("Pick who paid.");
      return;
    }
    if (splitArray.length === 0) {
      setError("Pick at least one person to split with.");
      return;
    }
    if (!group) return;

    addExpense({
      groupId: group.id,
      description: description.trim(),
      amountBase: usdcToBase(num),
      paidBy,
      splitBetween: splitArray,
    });
    router.push(`/groups/${group.id}`);
  }

  return (
    <>
      <AppHeader />
      <div className="max-w-xl mx-auto px-6 py-12 space-y-10">
        <Link href={`/groups/${group.id}`} className="eyebrow text-ink-mute hover:text-ink">
          ← {group.name}
        </Link>

        <div className="space-y-2">
          <div className="eyebrow text-ink-mute">New expense</div>
          <h1 className="font-display text-4xl tracking-tight font-semibold">Add an expense</h1>
        </div>

        {/* Amount — hero */}
        <div className="space-y-2">
          <label className="eyebrow text-ink-mute">Amount (USDC)</label>
          <div className="flex items-baseline gap-1 border-b-2 border-ink pb-2">
            <span className="font-mono text-2xl text-ink-mute">$</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
              }}
              placeholder="0.00"
              className="font-mono tabular-nums text-4xl bg-transparent outline-none w-full placeholder:text-ink-ghost"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="eyebrow text-ink-mute">What was it for?</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner at Mod Café"
            className="w-full bg-transparent border-0 border-b border-paper-rim focus:border-ink focus:border-b-2 outline-none py-2 text-base placeholder:text-ink-ghost"
          />
        </div>

        {/* Paid by */}
        <div className="space-y-2">
          <label className="eyebrow text-ink-mute">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-paper-rim focus:border-ink focus:border-b-2 outline-none py-2 text-base appearance-none cursor-pointer"
          >
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {me && m.id === me.id ? `${m.handle} (you)` : m.handle}
              </option>
            ))}
          </select>
        </div>

        {/* Split */}
        <div className="space-y-3">
          <label className="eyebrow text-ink-mute">Split equally between</label>
          <div className="border-y border-dashed border-paper-rim divide-y divide-dashed divide-paper-rim">
            {group.members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-paper-deep/50 px-1"
              >
                <input
                  type="checkbox"
                  checked={splitBetween.has(m.id)}
                  onChange={() => toggleSplit(m.id)}
                  className="w-4 h-4 accent-ink"
                />
                <span className="text-sm">
                  {me && m.id === me.id ? `${m.handle} (you)` : m.handle}
                </span>
                <span className="ml-auto font-mono text-xs text-ink-mute">
                  {splitBetween.has(m.id) && amount
                    ? `$${(parseFloat(amount) / splitBetween.size).toFixed(2)}`
                    : "—"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-l-2 border-accent pl-3 text-sm text-accent-deep">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-dashed border-paper-rim">
          <Link href={`/groups/${group.id}`}>
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" onClick={submit} type="button">
            Add expense
          </Button>
        </div>
      </div>
    </>
  );
}
