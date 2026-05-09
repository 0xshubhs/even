# 03 — README Templates

You'll have **one root README.md** in the GitHub repo (the most complete version, framed neutrally) and three *short* track-specific framing pages or sections.

The actual judges read your README first. Make the root README excellent, then add three track-flavored sections at the bottom.

---

## ROOT README.md (the master)

```markdown
# Tab — Split anything. Settle privately.

Tab is Splitwise for crypto. Friends, roommates, travel groups, project teams — anyone who shares costs — can track expenses and settle in stablecoins on Solana, with payments shielded so members don't see each other's wallet histories.

> **The problem:** Every public-blockchain payment broadcasts your financial life. The moment you Venmo a friend in stablecoins, they can read your entire transaction history on Solscan. That's worse than Venmo, not better.
>
> **Tab's fix:** Use Solana for what it's good at — instant, near-free settlement — and shield the actual transfers with [Umbra Privacy](https://umbraprivacy.com)'s SDK. Your friends see the debt was cleared. Nobody sees the amount or your history.

## What Tab does

- 📋 **Track shared expenses** — dinners, trips, rent, gifts, project costs, anything
- 🤝 **Add people by `.sol` handle** — `alice.sol`, not `7xK9vRmNz...` (powered by [SNS](https://sns.id))
- 💸 **Smart debt simplification** — if Alice owes Bob, Bob owes Carol, and Carol owes Alice, Tab nets it out
- 🛡️ **Settle privately** — every "settle up" is a shielded transfer; only sender and receiver see the amount
- 🧾 **Selective audit** — issue a viewing key so an accountant or landlord can verify a specific scope without seeing your whole history

## Architecture

```
┌──────────────────┐
│   Next.js 14     │ ← UI: groups, expenses, ledger, settle button
│   (App Router)   │
└────────┬─────────┘
         │
         ├─→ ┌─────────────────────┐
         │   │  Supabase (Postgres)│ ← Off-chain group state: members,
         │   └─────────────────────┘   expenses, ledger entries, audit log
         │
         ├─→ ┌──────────────────────────────────────┐
         │   │   Umbra SDK (@umbra-privacy/sdk)     │ ← Settlement engine:
         │   │   + web-zk-prover                    │   shielded UTXOs, claims
         │   └──────────────────────────────────────┘
         │
         ├─→ ┌──────────────────────────────────────┐
         │   │   SNS (@bonfida/spl-name-service)    │ ← Identity layer:
         │   │   resolves .sol handles ↔ wallets    │   group invites, payouts
         │   └──────────────────────────────────────┘
         │
         └─→ ┌──────────────────────────────────────┐
             │   Encrypted Debt Graph               │ ← Optional FHE layer:
             │   IEncryptedDebtGraph (interface)    │   contributions encrypted
             │   ├── local.ts (default)             │   even from our server
             │   └── encrypt.ts (when SDK ready)    │
             └──────────────────────────────────────┘
```

## How privacy works in Tab

A normal Solana payment leaks **3 things** to anyone with a block explorer:
1. Who sent
2. Who received
3. How much

Tab shields all three:

| Step | What's on-chain | What's hidden |
|---|---|---|
| Add expense | nothing | (group state is off-chain) |
| View ledger | nothing | (computed locally / via FHE) |
| Settle up | a Umbra UTXO commitment | sender, recipient, amount |
| Receive | a relayer-paid claim | which UTXO went to whom |

The recipient sees the funds appear in their encrypted balance. Other group members see "Alice and Bob settled" — not how much. **Privacy is structurally load-bearing**: remove Umbra and Tab is *worse than Splitwise*, since now your wallet history is doxxed.

## Tech stack

- **Frontend:** Next.js 14 (App Router), Tailwind, shadcn/ui
- **Database:** Supabase (Postgres) — off-chain group state
- **Privacy / settlement:** [Umbra Privacy SDK](https://sdk.umbraprivacy.com) v3.x + web-zk-prover
- **Identity:** [Solana Name Service](https://sns.guide) via `@bonfida/spl-name-service`
- **Encrypted ledger (optional):** [Encrypt](https://encrypt.xyz) FHE — currently using local stub; will swap to real SDK on devnet availability
- **Wallets:** Phantom, Solflare via `@solana/wallet-adapter-react`
- **Network:** Solana devnet (settlements), mainnet (SNS resolution only)

## Run locally

```bash
# 1. Clone and install
git clone https://github.com/<you>/tab && cd tab
pnpm install

# 2. Set up Supabase
# Create a project at supabase.com, then in the SQL editor paste supabase/migrations/0001_init.sql
# Copy your Project URL and anon key into apps/web/.env.local:
cp apps/web/.env.example apps/web/.env.local
# Edit and fill in:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 3. Run the dev server
pnpm dev

# 4. Open two browser windows (different profiles, e.g. Chrome + Firefox)
# Connect a Phantom wallet in each (devnet mode)
# Get devnet SOL from https://faucet.solana.com
# Get devnet USDC from https://spl-token-faucet.com (token: USDC-Dev)
# Create a group in window A, invite the wallet from window B, log an expense, settle up
```

## Demo

🎥 [Demo video](https://...) (5 min)
🌐 [Live demo](https://tab.vercel.app) on devnet
📊 [Pitch deck](./docs/pitch.pdf)

## Roadmap

- v1.1 — recurring expenses (rent splits, shared subscriptions)
- v1.2 — multi-token support (USDT, SOL, jupSOL)
- v1.3 — Mainnet launch + audit
- v2 — Mobile native app
- v2 — Cross-chain settle-up (pay USDC debts from your BTC holdings via Ika dWallets)
- v2 — Encrypted debt graph swap-in once Encrypt SDK is mainnet-stable

## License

MIT

---

## Hackathon submissions

Tab is submitted to the **Solana Frontier Hackathon** (overall) plus three sponsor side tracks:

- **🛡️ Umbra Privacy** — anchor integration, the settlement engine
- **🪪 SNS Identity** — `.sol`-based group invites and payouts
- **🔐 Encrypt FHE** — abstraction designed for Encrypt's encrypted-ledger primitives

See [`SUBMISSIONS.md`](./SUBMISSIONS.md) for track-specific framing.
```

---

## SUBMISSIONS.md (track-specific framing)

```markdown
# Track Submissions

## 🛡️ Umbra Privacy Track

**The role of Umbra in Tab is the entire settlement layer.**

Every "Settle up" action calls `getPublicBalanceToReceiverClaimableUtxoCreatorFunction` to create a shielded UTXO from the debtor's public USDC balance to the creditor's encrypted inbox. The creditor scans for received UTXOs (`getClaimableUtxoScannerFunction`) and claims them via the relayer (so they need zero SOL to claim).

This is not a wrapper. The product literally cannot exist without Umbra:

- **Without Umbra:** Tab is a Splitwise UI on top of public USDC transfers. Every settlement is a Solscan link revealing the amount and counterparty. Users have *less* privacy than Venmo.
- **With Umbra:** Settlements are unlinkable shielded transfers. Group members see the debt cleared, not the amount. Recipients have full audit history through their own viewing keys.

Files where Umbra is used:
- `lib/umbra/client.ts` — client construction, devnet config
- `lib/umbra/register.ts` — first-time registration (`confidential: true, anonymous: true`)
- `lib/umbra/settle.ts` — receiver-claimable UTXO creation (the core mechanic)
- `lib/umbra/scan.ts` — recipient-side polling
- `lib/umbra/claim.ts` — claim into encrypted balance via relayer
- `lib/umbra/withdraw.ts` — optional off-ramp

We additionally use:
- **Viewing keys** for the "Group auditor" feature: a group can grant a scoped viewing key to an external auditor (landlord for rent group, accountant for project group) so they can verify settlements within scope without seeing other members' history.

The integration depth here is high: Umbra is *the* product, not a bolt-on.

---

## 🪪 SNS Identity Track

**SNS is Tab's social layer.**

In Tab, you don't add `7xK9vRmNz...` to a group. You add `alice.sol`. This is exactly the "Social Identity: reimagine `.sol` as the universal identity and login layer" use case from the SNS track brief.

Where SNS lives in Tab:
- `lib/sns/resolve.ts` — `.sol` handle → wallet pubkey using `@bonfida/spl-name-service`
- Group invite flow: shareable link `tab.app/g/{id}?invite=alice.sol` resolves to a wallet on accept
- Member list: reverse-lookup wallets to display `.sol` handles where set
- Settlement targets: pay `bob.sol` — Tab resolves to wallet and constructs the Umbra UTXO

This unlocks the social-payments UX that crypto has lacked. Splitwise works because you add Alice, not Alice's bank account number. Tab works because you add `alice.sol`, not Alice's wallet.

We resolve handles against **mainnet** (where SNS lives) but settle on **devnet** (where Umbra is for hackathon stability). This is documented and intentional.

---

## 🔐 Encrypt FHE Track

**Encrypt's role: encrypt the debt graph itself.**

The core ledger of Tab — "Alice's contribution to expense X = $30, Bob's contribution = $10..." — is sensitive even before settlement. In v0, this lives in our Postgres. With Encrypt's FHE primitives, individual contributions can be submitted as ciphertexts; the per-pair "who-owes-who" computation runs on encrypted inputs; only the parties involved in a specific debt see the cleartext amount.

> **Honest disclosure:** Encrypt's Solana devnet was scheduled for early Q2 2026. We built the full abstraction (`lib/encrypted-ledger/interface.ts`), shipped a local TypeScript implementation (`local.ts`) as the default, and prototyped the Encrypt-backed implementation (`encrypt.ts`) against the SDK as it stabilizes. The interface is FHE-shaped from day one: contributions in/out are ciphertext, computation happens via encrypted ops, decryption is access-controlled per-party.

This is integration depth without integration theater. The architecture is real, the swap is one config change, and we're transparent about which path runs in the demo.

If the SDK is fully usable by submission day, demo runs against Encrypt. If not, demo runs against the local stub but the Encrypt path is in the repo for review.
```
