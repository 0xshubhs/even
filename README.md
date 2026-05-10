# Tab — Split anything. Settle privately.

> Splitwise for crypto. Track shared expenses with a group, settle in stablecoins on Solana, and keep the amounts shielded so members don't see each other's wallet histories.

Submitted to the **Solana Frontier Hackathon** (Colosseum 2026) across three sponsor tracks: **Umbra Privacy** (anchor), **SNS Identity**, and **Encrypt FHE**.

---

## Why this exists

Every public-blockchain payment broadcasts your financial life. The moment you pay a friend in stablecoins, they can read your entire transaction history on Solscan — that's *worse* than Venmo, not better.

**Tab's fix:** use Solana for what it's good at — instant, near-free settlement — and shield the actual transfers with [Umbra Privacy](https://umbraprivacy.com)'s SDK. Friends see the debt cleared. Nobody else sees the amount or your history.

Privacy here is structurally load-bearing: strip Umbra and Tab is a worse Splitwise. The privacy *is* the product improvement.

---

## What's in this repo

```
.
├── docs/                       # Strategy, integration, design docs
│   ├── 00-RUNDOWN.md           # Master strategy + prize math
│   ├── 01-UMBRA-INTEGRATION.md # All Umbra SDK calls, working code
│   ├── 02-SCHEMA.sql           # Supabase schema (off-chain group state)
│   ├── 05-DEBT-GRAPH.md        # Splitwise debt-simplification spec
│   ├── 08-DESIGN-SYSTEM.md     # The "Receipt Paper" visual identity
│   ├── 09-COMPONENTS.md        # Real component code
│   └── 10-PAGE-FLOW.md         # Page-by-page user journey
└── tab/                        # The Next.js 14 app
    ├── app/
    │   ├── page.tsx                          # Landing
    │   ├── dashboard/page.tsx                # Cross-group home
    │   ├── groups/page.tsx                   # Group list
    │   ├── groups/new/page.tsx               # Create group
    │   ├── groups/[groupId]/page.tsx         # Ledger + activity
    │   ├── groups/[groupId]/add-expense/...  # Expense form
    │   └── groups/[groupId]/settle/...       # Shielded settle flow
    ├── components/
    │   ├── receipt/                # Receipt, ReceiptHeader, ReceiptLine
    │   ├── group/                  # GroupCard, LedgerRow, Monogram
    │   ├── ui/                     # Button, SettleButton, PrivacySeal
    │   ├── umbra/                  # ProofGenerationOverlay
    │   ├── settlement/             # SettlementReceipt
    │   ├── wallet/                 # WalletProvider, ConnectButton
    │   └── layout/AppHeader.tsx
    └── lib/
        ├── debt-graph/             # Splitwise net-balance simplification
        ├── solana/constants.ts     # devnet RPC, USDC mint
        ├── store/group-store.tsx   # localStorage-backed state
        ├── umbra/settle.ts         # shielded settle (currently a stub)
        └── utils.ts
```

---

## What works today

| Feature | Status |
|---|---|
| Connect Phantom / Solflare on devnet (`@solana/wallet-adapter`, `@solana/web3.js`) | ✅ Live |
| Create group, add members by Solana wallet address | ✅ Live |
| Add expense, equal split with live per-person preview | ✅ Live |
| Net-balance debt simplification (≤ n−1 settlements) | ✅ Live |
| `/dashboard` — cross-group: total owed / owed to you / who hasn't paid / activity | ✅ Live |
| Settlement flow with ZK proof overlay + animated SettlementReceipt | ✅ UX live; settle call is a stub |
| Settlement amounts hidden from non-party group members (`$••.••`) | ✅ Live |
| Real Umbra UTXO via `@umbra-privacy/sdk` | 🚧 Stub — replace `lib/umbra/settle.ts` |
| SNS `.sol` resolution (`@bonfida/spl-name-service`) | 🚧 Planned |
| Supabase persistence (groups currently live in localStorage) | 🚧 Planned |
| Encrypt FHE for the debt graph | 🚧 Behind interface; default = local stub |

---

## Design — "Receipt Paper"

Tab's visual identity is built on one concept: **the receipt**. Off-white paper backgrounds (`#F7F2EA`), monospace tabular numbers, dashed perforations, square corners, one accent (vermillion `#E8451A`) reserved for *money you owe*, one privacy color (indigo `#312698`) for the wax-stamp `Private · Shielded` seal.

**Light theme is the only theme.** From `docs/08-DESIGN-SYSTEM.md`:

> Dark mode is OFF for Tab. The receipt aesthetic works in one mode. Don't waste time on dark mode.

The texture is a fine-grain SVG noise overlay at `0.04` opacity — barely perceptible, but it's the move that makes screenshots look high-quality.

---

## Run locally

```bash
cd tab
npm install        # ~3 min, lots of Solana deps
cp .env.example .env.local

npm run dev        # http://localhost:3000
```

`.env.local` defaults are pre-filled for Solana devnet. Get devnet SOL from [faucet.solana.com](https://faucet.solana.com).

To test the bidirectional settle flow, open the app in two browser profiles (e.g. Chrome + Firefox), connect a different Phantom wallet in each, create a group with both wallets as members, log an expense, then settle from the debtor's tab.

---

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript strict + Tailwind 3
- **Solana:** [`@solana/web3.js`](https://www.npmjs.com/package/@solana/web3.js), [`@solana/wallet-adapter-react`](https://www.npmjs.com/package/@solana/wallet-adapter-react), Phantom + Solflare adapters
- **Privacy (anchor track):** [`@umbra-privacy/sdk`](https://sdk.umbraprivacy.com) v3.x (planned wiring per `docs/01-UMBRA-INTEGRATION.md`)
- **Identity (SNS track):** `@bonfida/spl-name-service` v3.x — mainnet resolution, devnet settlement
- **State:** localStorage today; Supabase Postgres planned (schema in `docs/02-SCHEMA.sql`)
- **Network:** Solana **devnet** for all on-chain actions; SNS resolves against mainnet

---

## How privacy is supposed to work

A normal Solana payment leaks **3 things** to anyone with a block explorer: who sent, who received, how much.

Tab shields all three:

| Step | What's on-chain | What's hidden |
|---|---|---|
| Add expense | nothing | (group state is off-chain) |
| View ledger | nothing | (computed locally / via FHE) |
| Settle up | a Umbra UTXO commitment | sender, recipient, amount |
| Receive | a relayer-paid claim | which UTXO went to whom |

The recipient sees the funds appear in their encrypted balance. Other group members see "Alice and Bob settled" — not how much. In the UI today, `/groups/[groupId]` already redacts settlement amounts to `$••.••` for members not party to the settlement, so the privacy story is visible end-to-end as soon as the Umbra call replaces the stub.

---

## Roadmap

- **v1.0** — wire `lib/umbra/settle.ts` to the real `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`, add `UmbraProvider` + first-time registration
- **v1.1** — SNS handle resolution on the New Group form
- **v1.2** — Supabase persistence (`docs/02-SCHEMA.sql`) so groups are shareable across devices
- **v1.3** — recipient-side scan + claim loop with toast notifications
- **v2** — recurring expenses, multi-token (USDT, jupSOL), mainnet, mobile, FHE swap-in once Encrypt is mainnet-stable

---

## License

MIT
