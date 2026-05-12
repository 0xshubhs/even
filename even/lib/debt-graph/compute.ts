import type { Expense, Group, Settlement } from "@/lib/store/group-store";
import { simplifyDebts, type PairwiseDebt } from "./simplify";

/**
 * Build the raw pairwise debt list for a group from expenses + settlements,
 * then simplify it. Operates on member IDs, not wallets.
 */
export function computeGroupDebts(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[]
): PairwiseDebt[] {
  const raw: PairwiseDebt[] = [];

  for (const e of expenses) {
    if (e.groupId !== group.id) continue;
    if (e.splitBetween.length === 0) continue;

    const shares = shareForExpense(e);
    e.splitBetween.forEach((memberId, idx) => {
      const share = shares[idx];
      if (share <= 0n) return;
      if (memberId === e.paidBy) return; // payer doesn't owe themselves
      raw.push({ from: memberId, to: e.paidBy, amount: share });
    });
  }

  for (const s of settlements) {
    if (s.groupId !== group.id) continue;
    // Settling reduces what `from` owes `to` — equivalent to a reverse debt.
    raw.push({ from: s.toMemberId, to: s.fromMemberId, amount: s.amountBase });
  }

  return simplifyDebts(raw);
}

/** Per-member base-unit share, aligned with `expense.splitBetween` order. */
export function shareForExpense(e: Expense): bigint[] {
  const n = e.splitBetween.length;
  if (n === 0) return [];

  if (e.splitMode === "custom" && e.splitWeights && e.splitWeights.length === n) {
    return e.splitWeights.map((w) => {
      try {
        return BigInt(w);
      } catch {
        return 0n;
      }
    });
  }

  if (e.splitMode === "shares" && e.splitWeights && e.splitWeights.length === n) {
    const weights = e.splitWeights.map((w) => {
      try {
        return BigInt(w);
      } catch {
        return 0n;
      }
    });
    const total = weights.reduce((acc, x) => acc + x, 0n);
    if (total <= 0n) return new Array<bigint>(n).fill(0n);
    // Multiply, divide, distribute remainder to earliest members.
    const exact = weights.map((w) => (e.amountBase * w) / total);
    const distributed = exact.reduce((acc, x) => acc + x, 0n);
    let remainder = e.amountBase - distributed;
    return exact.map((x) => {
      if (remainder > 0n) {
        remainder -= 1n;
        return x + 1n;
      }
      return x;
    });
  }

  // Equal split (default). Distribute remainder to first members.
  const nB = BigInt(n);
  const base = e.amountBase / nB;
  const remainder = e.amountBase - base * nB;
  return e.splitBetween.map((_, idx) =>
    base + (BigInt(idx) < remainder ? 1n : 0n)
  );
}

/**
 * Compute one user's net balance in a group (positive = owed to you).
 */
export function netBalanceForMember(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
  memberId: string
): bigint {
  const debts = computeGroupDebts(group, expenses, settlements);
  let net = 0n;
  for (const d of debts) {
    if (d.from === memberId) net -= d.amount;
    if (d.to === memberId) net += d.amount;
  }
  return net;
}
