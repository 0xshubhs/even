# Even — Split anything. Settle privately.

> Track shared expenses with anyone. Settle in stablecoins on Solana, with the amounts shielded so members don't see each other's wallet histories.

Submitted to the **Solana Frontier Hackathon** (Colosseum 2026) across three sponsor tracks: **Umbra Privacy** (anchor), **SNS Identity**, and **Encrypt FHE**.

---

## Running locally

```bash
cd even
cp .env.example .env.local      # optional: set DEMO_WALLET_SECRET_KEY for headless demos
npm install
npm run dev                     # http://localhost:3000
```

Connect Phantom or Solflare on **devnet** and open **/dashboard**. The first action that needs your Umbra master seed (registration, settling a debt) triggers a `signMessage` prompt.

## Deploying to Vercel

The Next.js app lives at `even/`, not the repo root. Either:

- **Easiest:** in Vercel project settings, set **Root Directory** = `even/`. Vercel auto-detects Next.js from there.
- **Or** keep the included `vercel.json` (root-level), which runs `cd even && npm install && npm run build` for you.

Set these env vars in Vercel (Production + Preview):

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_RPC_WSS_URL=wss://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
NEXT_PUBLIC_SNS_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_UMBRA_INDEXER_URL=https://utxo-indexer.api-devnet.umbraprivacy.com
NEXT_PUBLIC_UMBRA_RELAYER_URL=https://relayer.api-devnet.umbraprivacy.com
```

---

## Why this exists

Every public-blockchain payment broadcasts your financial life. The moment you pay a friend in stablecoins, they can read your entire transaction history on Solscan — that's *worse* than Venmo, not better.

**Even's fix:** use Solana for what it's good at — instant, near-free settlement — and shield the actual transfers with [Umbra Privacy](https://umbraprivacy.com)'s SDK. Friends see the debt cleared. Nobody else sees the amount or your history.

Privacy here is structurally load-bearing: strip Umbra and Even is a worse Splitwise. The privacy *is* the product improvement.

---

## What's in this repo

```
.
├── docs/                       # Strategy, integration, design docs
│   ├── 00-RUNDOWN.md           # Master strategy + prize math
│   ├── 01-UMBRA-INTEGRATION.md # All Umbra SDK calls
│   ├── 02-SCHEMA.sql           # Supabase schema (off-chain group state)
│   ├── 05-DEBT-GRAPH.md        # Splitwise debt-simplification spec
│   ├── 08-DESIGN-SYSTEM.md     # Visual identity (originally light "Receipt Paper")
│   ├── 09-COMPONENTS.md        # Component code
│   └── 10-PAGE-FLOW.md         # Page-by-page user journey
└── even/                       # The Next.js 14 app
    ├── app/
    │   ├── page.tsx                                  # Landing
    │   └── (app)/                                    # Sidebar-wrapped routes
    │       ├── layout.tsx
    │       ├── dashboard/page.tsx                    # Cross-group home
    │       ├── groups/page.tsx                       # Group list
    │       ├── groups/new/page.tsx                   # Create group
    │       ├── groups/[groupId]/page.tsx             # Ledger + activity
    │       ├── groups/[groupId]/add-expense/page.tsx
    │       └── groups/[groupId]/settle/page.tsx      # Shielded settle flow
    ├── components/
    │   ├── receipt/                # Receipt, ReceiptHeader, ReceiptLine
    │   ├── group/                  # GroupCard, LedgerRow, Monogram
    │   ├── ui/                     # Button, SettleButton, PrivacySeal
    │   ├── umbra/                  # ProofGenerationOverlay
    │   ├── settlement/             # SettlementReceipt
    │   ├── wallet/                 # WalletProvider, ConnectButton
    │   └── layout/                 # Sidebar, AppHeader
    └── lib/
        ├── debt-graph/             # Splitwise net-balance simplification
        ├── solana/constants.ts     # devnet RPC, USDC mint
        ├── store/group-store.tsx   # localStorage-backed state
        ├── umbra/settle.ts         # shielded settle helper
        └── utils.ts
```

---

## What works today

| Feature | Status |
|---|---|
| Connect Phantom / Solflare on devnet (`@solana/wallet-adapter`, `@solana/web3.js`) | Live |
| Sidebar layout for the authenticated app surface (Dashboard / Groups / New group) | Live |
| Create group, add members by Solana wallet address (`PublicKey` validation client-side) | Live |
| Auto-derived two-letter monogram covers (display serif on paper-deep) | Live |
| Add expense, equal split with live per-person preview | Live |
| Net-balance debt simplification (≤ n − 1 settlements) | Live |
| `/dashboard` — cross-group: total owed / owed to you / who hasn't paid / activity | Live |
| Settlement flow with ZK proof overlay + animated SettlementReceipt | UX live; settle helper produces a transient signature |
| Settlement amounts hidden from non-party group members (`$••.••`) | Live |
| Real Umbra UTXO via `@umbra-privacy/sdk` (`getPublicBalanceToReceiverClaimableUtxoCreatorFunction`) | Pending — see `lib/umbra/settle.ts` |
| SNS `.sol` resolution (`@bonfida/spl-name-service`) | Planned |
| Supabase persistence (groups currently live in localStorage) | Planned |
| Encrypt FHE for the debt graph | Planned, behind interface |

---

## Design — "Receipt Carbon"

Even ships in a single dark theme. Graphite surfaces (`paper`), warm cream ink, vermillion accent reserved for *money you owe*, and an indigo `privacy` colour for the wax-stamp `Private · Shielded` seal — and used as the editorial highlight on page-title eyebrows and inside display headings (italic indigo word).

The receipt motif from the original spec carries through unchanged: dashed perforation tears, square corners, monospace tabular numbers. The texture under everything is a soft silver film grain layered over a quiet indigo radial glow, so pages have depth instead of reading as a flat slab.

---

## Run locally

```bash
cd even
npm install        # ~3 min, lots of Solana deps
cp .env.example .env.local

npm run dev        # http://localhost:3000
```

`.env.local` defaults are pre-filled for Solana devnet. Get devnet SOL from [faucet.solana.com](https://faucet.solana.com).

To exercise the bidirectional settle flow, open the app in two browser profiles (e.g. Chrome + Firefox), connect a different Phantom wallet in each, create a group with both wallets as members, log an expense, then settle from the debtor's tab.

---

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript strict + Tailwind 3
- **Solana:** [`@solana/web3.js`](https://www.npmjs.com/package/@solana/web3.js), [`@solana/wallet-adapter-react`](https://www.npmjs.com/package/@solana/wallet-adapter-react), Phantom + Solflare adapters
- **Privacy (anchor track):** [`@umbra-privacy/sdk`](https://sdk.umbraprivacy.com) v3.x — wiring per `docs/01-UMBRA-INTEGRATION.md`
- **Identity (SNS track):** `@bonfida/spl-name-service` v3.x — mainnet resolution, devnet settlement
- **State:** localStorage today; Supabase Postgres planned (schema in `docs/02-SCHEMA.sql`)
- **Network:** Solana **devnet** for all on-chain actions; SNS resolves against mainnet

---

## How privacy works

A normal Solana payment leaks **3 things** to anyone with a block explorer: who sent, who received, how much.

Even shields all three:

| Step | What's on-chain | What's hidden |
|---|---|---|
| Add expense | nothing | (group state is off-chain) |
| View ledger | nothing | (computed locally / via FHE) |
| Settle up | a Umbra UTXO commitment | sender, recipient, amount |
| Receive | a relayer-paid claim | which UTXO went to whom |

The recipient sees the funds appear in their encrypted balance. Other group members see "Alice and Bob settled" — not how much. The UI today already redacts settlement amounts to `$••.••` for members who weren't party to the settlement, so the privacy story reads end-to-end as soon as the Umbra call lands behind `lib/umbra/settle.ts`.

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
