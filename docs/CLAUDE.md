# CLAUDE.md — Build Brief for Tab

You are helping build **Tab**, a Splitwise-for-crypto app for the Solana Frontier Hackathon. Read `00-RUNDOWN.md` first for full context. This file is your operating brief.

## Project at a glance

- **Name:** Tab
- **Tagline:** Split anything. Settle privately.
- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres) + Solana devnet
- **Privacy SDK (anchor):** `@umbra-privacy/sdk` v3.x + `@umbra-privacy/web-zk-prover` v2.x
- **Identity SDK (secondary):** `@bonfida/spl-name-service` v3.x
- **FHE SDK (stretch):** Encrypt — see `04-ENCRYPT-FALLBACK.md` for the pragmatic strategy
- **Wallet:** `@solana/wallet-adapter-react` with Phantom + Solflare
- **Deployment:** Vercel (frontend) + Supabase (DB)

## Repo structure to create

```
tab/
├── apps/
│   └── web/                       # Next.js 14 app (App Router)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx           # Landing page
│       │   ├── (app)/
│       │   │   ├── groups/
│       │   │   │   ├── page.tsx                 # Group list
│       │   │   │   ├── new/page.tsx             # Create group
│       │   │   │   └── [groupId]/
│       │   │   │       ├── page.tsx             # Group detail (ledger + activity)
│       │   │   │       ├── add-expense/page.tsx
│       │   │   │       └── settle/page.tsx      # Settlement UI
│       │   │   └── settings/page.tsx
│       │   └── api/
│       │       ├── groups/route.ts              # CRUD group
│       │       ├── expenses/route.ts            # CRUD expense
│       │       ├── settlement/route.ts          # Record on-chain settlement
│       │       └── sns/resolve/route.ts         # Resolve .sol handle
│       ├── components/
│       │   ├── wallet/WalletProvider.tsx
│       │   ├── umbra/UmbraProvider.tsx
│       │   ├── group/...
│       │   └── ui/                              # shadcn/ui components
│       ├── lib/
│       │   ├── umbra/
│       │   │   ├── client.ts                    # getUmbraClient wrapper
│       │   │   ├── register.ts
│       │   │   ├── deposit.ts
│       │   │   ├── settle.ts                    # Create UTXO from public balance
│       │   │   ├── scan.ts                      # Poll for received UTXOs
│       │   │   └── claim.ts
│       │   ├── sns/
│       │   │   └── resolve.ts                   # Resolve .sol → wallet
│       │   ├── encrypted-ledger/
│       │   │   ├── interface.ts                 # IEncryptedDebtGraph
│       │   │   ├── local.ts                     # Pure-TS fallback
│       │   │   └── encrypt.ts                   # Encrypt SDK adapter (if works)
│       │   ├── debt-graph/
│       │   │   └── simplify.ts                  # Splitwise debt simplification algorithm
│       │   └── supabase/
│       │       └── client.ts
│       └── package.json
├── packages/
│   └── tsconfig/                  # Shared tsconfig
├── supabase/
│   └── migrations/
│       └── 0001_init.sql          # Schema (see 02-SCHEMA.sql)
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── README.md                      # See 03-README-TEMPLATE.md
├── .env.example
└── .gitignore
```

## The 4-day execution checklist

Mark each as you go. Be ruthless about scope.

### Day 1 — Plumbing (target: working Umbra round-trip)
- [ ] `pnpm init` + Next.js 14 app + Tailwind + shadcn/ui setup
- [ ] Wallet adapter wired (Phantom + Solflare on devnet)
- [ ] Supabase project created, schema applied (see `02-SCHEMA.sql`)
- [ ] `lib/umbra/client.ts`: `getUmbraClient` configured for devnet
- [ ] Registration flow: user signs in with Phantom → calls `register({ confidential: true, anonymous: true })`
- [ ] Manual test page: deposit 1 USDC into encrypted balance, verify on-chain
- [ ] Manual test page: create receiver-claimable UTXO to a second wallet, scan from second wallet, claim it
- [ ] Devnet USDC airdrop helper (link to a faucet, fall back to wrapped-SOL if USDC devnet faucet broken)

**End of Day 1:** Two browser tabs, two devnet wallets, one shielded transfer end-to-end. No UI polish.

### Day 2 — Core product (target: full Tab UX working)
- [ ] **First**: skim `08-DESIGN-SYSTEM.md` and `09-COMPONENTS.md`. Set up Tailwind config, fonts (Cormorant Garamond + Inter Tight + JetBrains Mono from Google Fonts), color tokens, paper texture
- [ ] Drop in the `Receipt`, `Button`, `SettleButton`, `PrivacySeal`, `LedgerRow`, `EmptyExpenses` components from `09-COMPONENTS.md`
- [ ] Group create/list pages with Supabase persistence — use `GroupCard` from `09-COMPONENTS.md`
- [ ] Member add by **wallet address** for now (SNS comes Day 3)
- [ ] Add expense flow per `10-PAGE-FLOW.md`: amount, payer, split mode (equal first; share/exact are v2)
- [ ] `lib/debt-graph/simplify.ts`: implement Splitwise's debt simplification (see `05-DEBT-GRAPH.md`)
- [ ] Group ledger view: shows each pair "Alice owes Bob 350" using `LedgerRow`
- [ ] Activity feed (latest expenses)
- [ ] "Settle up" flow → calls Umbra UTXO creator
- [ ] Recipient scan: when recipient opens the app, it polls for unclaimed UTXOs and prompts to claim
- [ ] Mark settlement as confirmed in DB when callback signature returns

**End of Day 2:** Three users in a group, log a $30 dinner, settle it via shielded UTXOs. Already looks like a real product, not a prototype.

### Day 3 morning — SNS integration (4h)
- [ ] Install `@bonfida/spl-name-service`
- [ ] `lib/sns/resolve.ts`: resolve `.sol` handle → wallet (mainnet RPC; SNS only lives on mainnet, see note)
- [ ] Group invite by `.sol` handle in UI
- [ ] Reverse lookup: show `.sol` name in member list when available
- [ ] Group invite link: `tab.app/g/{groupId}?invite={token}` with handle pre-filled

**Note on SNS network:** SNS lives on mainnet. Even with all settlements on devnet, you can do the **identity lookup against mainnet** and use the resolved wallet pubkey on devnet. This is fine and honest — document it in the README.

### Day 3 afternoon — Encrypt spike + decision (4h)
- [ ] Read Encrypt's docs at https://encrypt.xyz (or whatever the Frontier track linked — "Encrypt Solana Devnet Pre-Alpha Docs")
- [ ] **2-hour timebox:** can you submit one encrypted U64 ciphertext, perform an addition on it via their SDK, and decrypt the result?
- [ ] **If yes:** swap `lib/encrypted-ledger/local.ts` for `lib/encrypted-ledger/encrypt.ts` for the contribution-summing step
- [ ] **If no:** ship with `local.ts`. Update README to honestly describe the abstraction as "FHE-ready, currently using a local stub pending Encrypt mainnet readiness." Don't submit to Encrypt track. Don't lie.

### Day 4 — Submission materials
- [ ] **Final design pass** — refer to `08-DESIGN-SYSTEM.md` and `09-COMPONENTS.md`. Make sure: receipt motif present everywhere, no gradients, no purple, monospace numbers, dashed perforations, privacy seal visible
- [ ] **Polish UI** (loading states, errors, mobile responsiveness, empty states — all per `10-PAGE-FLOW.md`)
- [ ] **README** finalized (use `03-README-TEMPLATE.md`)
- [ ] **Demo video #1 — Umbra-flavored** (5 min). See `06-DEMO-SCRIPTS.md`.
- [ ] **Demo video #2 — SNS-flavored** (5 min)
- [ ] **Demo video #3 — Encrypt-flavored** (only if you integrated for real)
- [ ] **Pitch deck** (5-7 slides max — see `06-DEMO-SCRIPTS.md`)
- [ ] Deploy to Vercel
- [ ] **Submit:**
  - [ ] Superteam Earn — Umbra track
  - [ ] Superteam Earn — SNS track
  - [ ] Superteam Earn — Encrypt track (if applicable)
  - [ ] Colosseum portal — Frontier overall (this is the real prize, don't forget)

## Coding standards

- **Strict TypeScript.** No `any`. Use Umbra's branded types (`U64`, `Address`) directly.
- **Async error handling.** Every Umbra call wrapped with try/catch + user-facing toast.
- **Loading + error states everywhere.** Empty states have a clear CTA.
- **Server components for static, client components for interactive.** Don't `"use client"` everything.
- **No localStorage for sensitive data.** Wallet adapter handles persistence.
- **Logger:** `console.log` is fine; don't ship a logging library.
- **Tests:** unit tests for `lib/debt-graph/simplify.ts` only. Everything else is integration-tested by the demo.

## Things that will go wrong (mitigations)

| Risk | Mitigation |
|---|---|
| Devnet USDC faucet down | Use devnet wSOL instead; doc swap is one constant change |
| ZK prover slow on first run | Pre-warm on app load, show progress UI |
| Umbra relayer flaky on devnet | Catch + retry once; show "submitting" with explicit "this can take 30s" copy |
| Phantom doesn't sign on devnet | Test with Solflare too; document wallet selection in README |
| Encrypt SDK doesn't work | See Day 3 afternoon — drop track, don't sink time |
| SNS only on mainnet | This is fine — do identity lookup mainnet, payments devnet. Document. |
| Supabase rate limits during demo | Add 100ms client-side debounce on autosave |

## Files in this handoff package

**Strategy & integration**
- `00-RUNDOWN.md` — Full strategy, prize math, why we win
- `CLAUDE.md` — This file. Operating brief.
- `01-UMBRA-INTEGRATION.md` — All Umbra SDK calls with working code
- `02-SCHEMA.sql` — Supabase schema, copy-paste ready
- `03-README-TEMPLATE.md` — Three README versions (Umbra / SNS / Encrypt)
- `04-ENCRYPT-FALLBACK.md` — The IEncryptedDebtGraph abstraction + local fallback
- `05-DEBT-GRAPH.md` — Splitwise debt-simplification algorithm spec
- `06-DEMO-SCRIPTS.md` — Three video scripts + pitch deck outline
- `07-PACKAGE-JSON.md` — package.json + dependency list

**Design & frontend** (READ THESE FOR ANY UI WORK)
- `08-DESIGN-SYSTEM.md` — Visual identity ("Receipt Paper"), color tokens, typography, motion principles
- `09-COMPONENTS.md` — Real component code (Receipt, SettleButton, ProofGenerationOverlay, etc.)
- `10-PAGE-FLOW.md` — Page-by-page user journey with layout specs and what to cut if time runs out

## Design discipline (CRITICAL)

Tab is judged not just on tech but on whether it *looks* like a real product. **Never default to generic shadcn/ui styling.** Every component should feel like it was designed for Tab specifically. The receipt motif, the dashed perforations, the wax-seal "Private · Shielded" stamp — these are the things that get screenshotted and shared. Read `08-DESIGN-SYSTEM.md` before writing any JSX. If you find yourself reaching for a purple gradient or a glass-morphism card, stop — go back to the design doc.
