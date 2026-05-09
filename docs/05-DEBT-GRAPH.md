# 05 — Debt Graph Simplification

This is the algorithm Splitwise made famous. You have a group where many people owe many others various amounts. You simplify the graph to the minimum set of payments that clears every debt.

## Algorithm

Given a list of `PairwiseDebt { from, to, amount }`:

1. Compute each member's **net balance** = (sum owed to them) − (sum they owe)
2. Positive balance = creditor; negative = debtor
3. Greedy match: largest creditor with largest debtor; transfer `min(creditor, debtor)`; repeat until all zero (within a small tolerance)

The result is at most `n - 1` settlements for a group of `n` members, which is provably optimal in number of edges.

## Implementation

```ts
// lib/debt-graph/simplify.ts

export interface PairwiseDebt {
  from: string;  // wallet
  to: string;    // wallet
  amount: bigint;
}

/**
 * Simplifies a debt graph using net-balance greedy settlement.
 *
 * @param debts - raw pairwise debts (may have multiple edges between same pair)
 * @returns minimum-edge settlement set
 *
 * Example:
 *   Input:  Alice owes Bob 50, Bob owes Carol 30
 *   Output: Alice owes Bob 20, Alice owes Carol 30
 *           (Bob is settled, Alice paid Carol on Bob's behalf)
 */
export function simplifyDebts(debts: PairwiseDebt[]): PairwiseDebt[] {
  // 1. Compute net balance per wallet
  const net = new Map<string, bigint>();
  for (const d of debts) {
    net.set(d.from, (net.get(d.from) ?? 0n) - d.amount);
    net.set(d.to, (net.get(d.to) ?? 0n) + d.amount);
  }

  // 2. Separate creditors and debtors (skip zeros)
  const creditors: { wallet: string; amount: bigint }[] = [];
  const debtors: { wallet: string; amount: bigint }[] = [];
  for (const [wallet, balance] of net) {
    if (balance > 0n) creditors.push({ wallet, amount: balance });
    else if (balance < 0n) debtors.push({ wallet, amount: -balance });
  }

  // 3. Sort descending so largest matches largest (heuristic for balance)
  creditors.sort((a, b) => (b.amount > a.amount ? 1 : -1));
  debtors.sort((a, b) => (b.amount > a.amount ? 1 : -1));

  // 4. Greedy match
  const result: PairwiseDebt[] = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const transfer = credit.amount < debt.amount ? credit.amount : debt.amount;

    result.push({ from: debt.wallet, to: credit.wallet, amount: transfer });

    credit.amount -= transfer;
    debt.amount -= transfer;
    if (credit.amount === 0n) ci++;
    if (debt.amount === 0n) di++;
  }

  return result;
}
```

## Tests

```ts
// lib/debt-graph/simplify.test.ts
import { describe, it, expect } from 'vitest';
import { simplifyDebts } from './simplify';

describe('simplifyDebts', () => {
  it('returns empty for empty input', () => {
    expect(simplifyDebts([])).toEqual([]);
  });

  it('passes through a single debt', () => {
    const result = simplifyDebts([{ from: 'A', to: 'B', amount: 100n }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ from: 'A', to: 'B', amount: 100n });
  });

  it('cancels a 2-cycle: A->B 50, B->A 30 collapses to A->B 20', () => {
    const result = simplifyDebts([
      { from: 'A', to: 'B', amount: 50n },
      { from: 'B', to: 'A', amount: 30n },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ from: 'A', to: 'B', amount: 20n });
  });

  it('chains: A owes B 50, B owes C 30 → A->B 20, A->C 30', () => {
    const result = simplifyDebts([
      { from: 'A', to: 'B', amount: 50n },
      { from: 'B', to: 'C', amount: 30n },
    ]);
    // Net: A=-50, B=20, C=30 → debtors [A:50], creditors [C:30, B:20]
    // A->C 30, A->B 20
    expect(result).toHaveLength(2);
    expect(result.find(d => d.to === 'C')).toEqual({ from: 'A', to: 'C', amount: 30n });
    expect(result.find(d => d.to === 'B')).toEqual({ from: 'A', to: 'B', amount: 20n });
  });

  it('full circular debt cancels to nothing', () => {
    // A->B 10, B->C 10, C->A 10. Net = 0,0,0. No settlements needed.
    const result = simplifyDebts([
      { from: 'A', to: 'B', amount: 10n },
      { from: 'B', to: 'C', amount: 10n },
      { from: 'C', to: 'A', amount: 10n },
    ]);
    expect(result).toEqual([]);
  });

  it('reduces n^2 debts to at most n-1 settlements', () => {
    // 4 members, all 6 pairs have small debts in some direction
    const result = simplifyDebts([
      { from: 'A', to: 'B', amount: 10n },
      { from: 'A', to: 'C', amount: 20n },
      { from: 'A', to: 'D', amount: 30n },
      { from: 'B', to: 'C', amount: 10n },
      { from: 'B', to: 'D', amount: 20n },
      { from: 'C', to: 'D', amount: 10n },
    ]);
    expect(result.length).toBeLessThanOrEqual(3); // n-1 = 3 for 4 members
  });
});
```

## How it gets called in the app

In the group detail page:

```ts
// app/(app)/groups/[groupId]/page.tsx (server-rendered or client-fetched)
import { getDebtGraph } from "@/lib/encrypted-ledger";

const debts = await getDebtGraph().computeDebts(groupId);
// debts = [{ from: 'alice', to: 'bob', amount: 350_000_000n }, ...]
// Render in UI as "Alice owes Bob $350"
```

When a user taps **Settle up** on a row, you take the `from`/`to`/`amount` and pass them to `lib/umbra/settle.ts`.
