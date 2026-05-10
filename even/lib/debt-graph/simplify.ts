export interface PairwiseDebt {
  from: string;
  to: string;
  amount: bigint;
}

/**
 * Net-balance greedy debt simplification.
 * Returns at most n-1 settlement edges for n members.
 */
export function simplifyDebts(debts: PairwiseDebt[]): PairwiseDebt[] {
  const net = new Map<string, bigint>();
  for (const d of debts) {
    net.set(d.from, (net.get(d.from) ?? 0n) - d.amount);
    net.set(d.to, (net.get(d.to) ?? 0n) + d.amount);
  }

  const creditors: { wallet: string; amount: bigint }[] = [];
  const debtors: { wallet: string; amount: bigint }[] = [];
  for (const [wallet, balance] of net) {
    if (balance > 0n) creditors.push({ wallet, amount: balance });
    else if (balance < 0n) debtors.push({ wallet, amount: -balance });
  }

  creditors.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));
  debtors.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));

  const result: PairwiseDebt[] = [];
  let ci = 0;
  let di = 0;
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
