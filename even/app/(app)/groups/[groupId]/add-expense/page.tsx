"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import { useGroupStore, type SplitMode } from "@/lib/store/group-store";
import { baseToUsdc, usdcToBase } from "@/lib/utils";

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
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  // For shares & custom: per-member-id string input. Cleared/refilled on mode change.
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!group) return;
    setPaidBy((prev) => prev || me?.id || group.members[0]?.id || "");
    setSplitBetween(new Set(group.members.map((m) => m.id)));
  }, [group, me]);

  const splitArray = useMemo(() => Array.from(splitBetween), [splitBetween]);
  const totalBase = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? usdcToBase(n) : 0n;
  }, [amount]);

  // Reset weights on mode change so users see sensible defaults.
  useEffect(() => {
    if (!group) return;
    if (splitMode === "shares") {
      setWeights(Object.fromEntries(splitArray.map((id) => [id, "1"])));
    } else if (splitMode === "custom") {
      // Pre-fill with equal split as a starting point.
      const n = splitArray.length;
      if (n === 0 || totalBase === 0n) {
        setWeights(Object.fromEntries(splitArray.map((id) => [id, "0.00"])));
      } else {
        const per = baseToUsdc(totalBase / BigInt(n));
        setWeights(Object.fromEntries(splitArray.map((id) => [id, per.toFixed(2)])));
      }
    } else {
      setWeights({});
    }
    // we want this only when the mode flips, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitMode]);

  if (!group) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="font-display text-3xl">Group not found</div>
        <Link href="/groups">
          <Button variant="paper">Back to groups</Button>
        </Link>
      </div>
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

    let splitWeights: string[] | undefined;

    if (splitMode === "shares") {
      const ws = splitArray.map((id) => parseInt(weights[id] ?? "0", 10));
      if (ws.some((w) => !Number.isFinite(w) || w < 0)) {
        setError("Share counts must be non-negative integers.");
        return;
      }
      if (ws.reduce((a, b) => a + b, 0) <= 0) {
        setError("Total shares must be greater than zero.");
        return;
      }
      splitWeights = ws.map(String);
    } else if (splitMode === "custom") {
      const amounts = splitArray.map((id) => parseFloat(weights[id] ?? "0"));
      if (amounts.some((x) => !Number.isFinite(x) || x < 0)) {
        setError("Amounts must be non-negative numbers.");
        return;
      }
      const totalCents = amounts.reduce(
        (acc, x) => acc + Math.round(x * 100),
        0
      );
      const expectedCents = Math.round(num * 100);
      if (totalCents !== expectedCents) {
        setError(
          `Per-person amounts sum to $${(totalCents / 100).toFixed(
            2
          )}, but the total is $${num.toFixed(2)}.`
        );
        return;
      }
      splitWeights = amounts.map((x) => usdcToBase(x).toString());
    }

    addExpense({
      groupId: group.id,
      description: description.trim(),
      amountBase: usdcToBase(num),
      paidBy,
      splitBetween: splitArray,
      splitMode,
      splitWeights,
    });
    router.push(`/groups/${group.id}`);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-10">
      <Link href={`/groups/${group.id}`} className="eyebrow text-ink-mute hover:text-ink">
        ← {group.name}
      </Link>

      <div className="space-y-2">
        <div className="eyebrow text-privacy">New expense</div>
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

      {/* Split mode tabs */}
      <div className="space-y-3">
        <label className="eyebrow text-ink-mute">Split</label>
        <div className="flex border border-paper-rim">
          {(
            [
              { id: "equal", label: "Equal" },
              { id: "shares", label: "By share" },
              { id: "custom", label: "Custom amounts" },
            ] as const
          ).map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSplitMode(tab.id)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                i > 0 ? "border-l border-paper-rim" : ""
              } ${
                splitMode === tab.id
                  ? "bg-paper-deep text-ink"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border-y border-dashed border-paper-rim divide-y divide-dashed divide-paper-rim">
          {group.members.map((m) => {
            const included = splitBetween.has(m.id);
            const numAmount = parseFloat(amount);
            const equalPer =
              included && splitBetween.size > 0 && Number.isFinite(numAmount)
                ? numAmount / splitBetween.size
                : 0;

            return (
              <div key={m.id} className="py-3 px-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={() => toggleSplit(m.id)}
                    className="w-4 h-4 accent-ink"
                  />
                  <span className="text-sm flex-1">
                    {me && m.id === me.id ? `${m.handle} (you)` : m.handle}
                  </span>

                  {splitMode === "equal" && (
                    <span className="ml-auto font-mono text-xs text-ink-mute">
                      {included && numAmount ? `$${equalPer.toFixed(2)}` : "—"}
                    </span>
                  )}

                  {splitMode === "shares" && included && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={weights[m.id] ?? ""}
                        onChange={(e) =>
                          setWeights((w) => ({ ...w, [m.id]: e.target.value }))
                        }
                        className="w-14 bg-paper-deep border border-paper-rim font-mono text-xs px-2 py-1 outline-none focus:border-ink"
                      />
                      <span className="text-[10px] text-ink-mute">shares</span>
                    </div>
                  )}

                  {splitMode === "custom" && included && (
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-mono text-xs text-ink-mute">$</span>
                      <input
                        inputMode="decimal"
                        value={weights[m.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) {
                            setWeights((w) => ({ ...w, [m.id]: v }));
                          }
                        }}
                        className="w-20 bg-paper-deep border border-paper-rim font-mono tabular-nums text-xs px-2 py-1 outline-none focus:border-ink"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </label>
              </div>
            );
          })}
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
  );
}
