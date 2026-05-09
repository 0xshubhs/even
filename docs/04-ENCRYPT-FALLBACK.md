# 04 — Encrypt Fallback Strategy

## The honest situation

Encrypt's docs (encrypt.xyz) say "Devnet launch early Q2." It's a Frontier track sponsor with promised devnet pre-alpha access. Whether it's stable enough to integrate in 4 days is unknown.

**The strategy:** Build a clean abstraction and a working pure-TS implementation. Spike the real Encrypt integration on Day 3 afternoon (4-hour timebox). If it works, swap the implementation. If not, ship with the abstraction documented as FHE-ready.

This is a legitimate engineering pattern, not deception, and you can defend it in the pitch with confidence.

---

## The interface

```ts
// lib/encrypted-ledger/interface.ts

/**
 * IEncryptedDebtGraph computes pairwise debts within a group using inputs
 * that may be encrypted. Implementations either run plaintext (local stub)
 * or via FHE (Encrypt SDK).
 *
 * The intent: server never sees individual contribution amounts; only
 * derived pairwise debts (which the parties already know).
 */

export type Wallet = string;

/**
 * One participant's contribution to one expense.
 * - In the local stub, `amount` is plaintext (a string-encoded bigint).
 * - In an FHE backend, `amount` is a ciphertext handle (opaque base64 / hex).
 */
export interface Contribution {
  expenseId: string;
  wallet: Wallet;
  amount: string; // base units USDC, opaque to caller (encrypted handle in FHE mode)
}

/**
 * Same shape for what each member owes for an expense.
 */
export interface Share {
  expenseId: string;
  wallet: Wallet;
  share: string;
}

/**
 * The output of debt computation: pairwise simplified debts.
 * `amount` here is plaintext — it represents what one party owes another,
 * which both parties already know. Decryption is scoped to the pair.
 */
export interface PairwiseDebt {
  from: Wallet;
  to: Wallet;
  amount: bigint; // base units USDC
}

export interface IEncryptedDebtGraph {
  /**
   * Submit one user's contribution. In the FHE backend, `amount` is encrypted
   * client-side before being sent.
   */
  submitContribution(c: Contribution): Promise<void>;

  /**
   * Submit each member's owed share for an expense.
   */
  submitShare(s: Share): Promise<void>;

  /**
   * Compute simplified pairwise debts. The result is plaintext to the caller,
   * but the *internal computation* is performed without revealing individual
   * contributions (in the FHE backend).
   *
   * Implementations should use the Splitwise simplification algorithm
   * (see 05-DEBT-GRAPH.md).
   */
  computeDebts(groupId: string): Promise<PairwiseDebt[]>;

  /**
   * Identify which backend is running, for UI/README transparency.
   */
  backend(): 'local' | 'encrypt';
}
```

---

## Local fallback (the default — always works)

```ts
// lib/encrypted-ledger/local.ts
import { IEncryptedDebtGraph, Contribution, Share, PairwiseDebt } from "./interface";
import { simplifyDebts } from "../debt-graph/simplify";
import { supabase } from "../supabase/client";

export class LocalDebtGraph implements IEncryptedDebtGraph {
  async submitContribution(c: Contribution): Promise<void> {
    // In local mode, contribution = expense.amount and expense.paid_by.
    // We rely on the expenses table for source-of-truth and don't store extra.
    // This method is a no-op for the local stub; data flows via the expenses
    // table. We keep the method for interface parity.
  }

  async submitShare(s: Share): Promise<void> {
    await supabase.from('expense_splits').insert({
      expense_id: s.expenseId,
      wallet: s.wallet,
      share_base: s.share, // server-side stored as bigint
    });
  }

  async computeDebts(groupId: string): Promise<PairwiseDebt[]> {
    // Pull all expenses + splits for the group, build raw pairwise debts,
    // then simplify.
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, amount_base, paid_by')
      .eq('group_id', groupId);

    const { data: splits } = await supabase
      .from('expense_splits')
      .select('expense_id, wallet, share_base');

    if (!expenses || !splits) return [];

    // Build raw pairwise debt map: payer is owed each non-payer's share.
    const pairs = new Map<string, bigint>(); // key = `${from}:${to}`
    const splitByExpense = new Map<string, typeof splits>();
    for (const sp of splits) {
      const arr = splitByExpense.get(sp.expense_id) ?? [];
      arr.push(sp);
      splitByExpense.set(sp.expense_id, arr);
    }

    for (const exp of expenses) {
      const expSplits = splitByExpense.get(exp.id) ?? [];
      for (const sp of expSplits) {
        if (sp.wallet === exp.paid_by) continue;
        const key = `${sp.wallet}:${exp.paid_by}`; // sp.wallet owes exp.paid_by
        const prev = pairs.get(key) ?? 0n;
        pairs.set(key, prev + BigInt(sp.share_base));
      }
    }

    const rawDebts: PairwiseDebt[] = [];
    for (const [key, amount] of pairs) {
      const [from, to] = key.split(':');
      rawDebts.push({ from, to, amount });
    }

    return simplifyDebts(rawDebts);
  }

  backend() { return 'local' as const; }
}
```

---

## Encrypt-backed implementation (filled in if/when SDK works)

```ts
// lib/encrypted-ledger/encrypt.ts
import { IEncryptedDebtGraph, Contribution, Share, PairwiseDebt } from "./interface";
// import { ... } from "@encrypt/sdk"; // pseudocode — fill in when SDK stabilizes

export class EncryptDebtGraph implements IEncryptedDebtGraph {
  async submitContribution(c: Contribution): Promise<void> {
    // 1. Encrypt c.amount client-side using Encrypt's threshold FHE pubkey
    // 2. Submit ciphertext handle to a dedicated Solana program account
    //    (or off-chain encrypted-state service per Encrypt's pattern)
    throw new Error("EncryptDebtGraph: integrate with Encrypt SDK on Day 3 spike");
  }

  async submitShare(s: Share): Promise<void> {
    // Same pattern: encrypt share.share, submit ciphertext handle.
    throw new Error("EncryptDebtGraph: integrate with Encrypt SDK on Day 3 spike");
  }

  async computeDebts(groupId: string): Promise<PairwiseDebt[]> {
    // 1. Run encrypted summation per pair via Encrypt's encrypted-add primitive
    // 2. Threshold-decrypt only the pairwise totals (decryption scoped to the
    //    two parties involved, not the server)
    // 3. Run plain debt simplification on the small set of pairwise totals
    throw new Error("EncryptDebtGraph: integrate with Encrypt SDK on Day 3 spike");
  }

  backend() { return 'encrypt' as const; }
}
```

---

## Selector — pick backend based on env

```ts
// lib/encrypted-ledger/index.ts
import { IEncryptedDebtGraph } from "./interface";
import { LocalDebtGraph } from "./local";
import { EncryptDebtGraph } from "./encrypt";

export function getDebtGraph(): IEncryptedDebtGraph {
  if (process.env.NEXT_PUBLIC_USE_ENCRYPT === '1') {
    return new EncryptDebtGraph();
  }
  return new LocalDebtGraph();
}
```

---

## The Day 3 afternoon spike (4-hour timebox)

Here's the exact set of questions to answer in the spike. If you can't answer "yes" to all four within 4 hours, drop it.

1. **Does Encrypt have a working JavaScript/TypeScript SDK on devnet?**
   Look at: https://encrypt.xyz/docs (or whatever the Frontier-linked Pre-Alpha Docs URL is). Find a quickstart with `npm install` and a code sample.

2. **Can you encrypt a U64, send it to their network, and get back a handle in <30 seconds?**
   This is a hello-world: encrypt the number `42`, post it, get a ciphertext id back.

3. **Can you do encrypted addition of two ciphertexts and decrypt the result?**
   `enc(10) + enc(20)` → handle `H` → decrypt `H` → `30`.

4. **Can a third-party "viewer" pubkey decrypt a handle without seeing other handles?**
   This is the access-control angle — only the two parties of a pairwise debt should be able to decrypt that pair's total.

If 1+2+3 work but 4 is hard, you can still ship a partial Encrypt integration: encrypted contributions, plain pairwise totals computed by encrypted-add, with access control as future work. That's still a real integration and worth submitting.

If 1 doesn't work (no SDK, or unworkably rough), drop the Encrypt submission cleanly. **Don't** burn Day 4 trying to make it work — Day 4 is for pitch videos, which is what wins.

---

## Pitch language for each path

### If Encrypt works:
> "Tab uses FHE for the most overlooked part of group payments — the ledger itself. Each member's contribution is encrypted client-side; the running tally of who owes whom is computed on ciphertext. Even our own server doesn't see individual amounts."

### If Encrypt is local stub:
> "Tab is FHE-ready. We built the encrypted-ledger abstraction first because we believe contribution amounts shouldn't sit in our database in plaintext. The current build uses a local implementation; the Encrypt-backed implementation is in the repo and will swap in as Encrypt's devnet stabilizes. The architecture is the proof; the implementation is config."

Both are honest. The second is a worse pitch but defensible. Don't fake the demo.
