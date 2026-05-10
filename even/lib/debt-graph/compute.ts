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

    // Equal split. Distribute remainder to first members so total matches.
    const total = e.amountBase;
    const n = BigInt(e.splitBetween.length);
    const base = total / n;
    const remainder = total - base * n;

    e.splitBetween.forEach((memberId, idx) => {
      const share = base + (BigInt(idx) < remainder ? 1n : 0n);
      if (memberId === e.paidBy) return; // payer doesn't owe themselves
      raw.push({ from: memberId, to: e.paidBy, amount: share });
    });
  }

  for (const s of settlements) {
    if (s.groupId !== group.id) continue;
    // Settling reduces what `from` owes `to` — equivalent to a reverse debt
    raw.push({ from: s.toMemberId, to: s.fromMemberId, amount: s.amountBase });
  }

  return simplifyDebts(raw);
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
