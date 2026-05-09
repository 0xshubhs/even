# Tab — Master Rundown

**Owner:** Shubham
**Hackathon:** Solana Frontier (Colosseum) — closes May 11, 2026
**Time budget:** 4 days
**Stack confidence:** Strong TypeScript + Solana
**Network:** Devnet only

---

## What you're building

**Tab** is Splitwise for crypto. Groups split anything — bills, rent, trips, group gifts, project costs, shared subscriptions — and settle in stablecoins on Solana with payments shielded so members don't see each other's wallet histories.

The core insight: **the moment you Venmo a friend on a public chain, you've handed them your entire financial life.** Tab fixes that without giving up the social UX of a Splitwise.

### One-line pitch
> Split anything with anyone. Settle in stablecoins on Solana. Your wallet history stays your business.

### 30-second pitch
> Tab is the easiest way for any group — friends splitting dinner, roommates paying rent, a travel group covering a trip, coworkers buying a gift, a project team paying contributors — to track shared expenses and settle up in stablecoins. Every settlement is shielded by Umbra Privacy, so your friends see the debt was cleared, not your wallet history. We use SNS so you add people by `.sol` handle instead of cryptic addresses, and we use Encrypt's FHE primitives so even our own server can't see individual balances. Built on Solana for instant, near-free settlement.

### Mom test
*"You and your friends/roommates/family pay each other for shared stuff. Tab tracks who owes who. Tap one button, everyone's settled. Your bank history stays private."*
A non-crypto person understands this in 8 seconds.

---

## Why this wins Frontier

Frontier dropped tracks. They want **real startups, not feature demos.** The most recent Cypherpunk hackathon's grand champion was a hardware wallet (Unruggable). The 1st-place consumer track was a prediction-market aggregator (Capitola). Pure privacy products *placed*, but didn't win — Cloak got 3rd in stablecoins.

Tab wins because:

1. **Mainstream consumer use case.** Splitwise has 50M+ users. Every Frontier judge knows it.
2. **The crypto is invisible.** Stablecoins, near-zero fees, instant settlement — but users see "Settle up." That's the kind of crypto Frontier sponsors (Phantom, Privy, MoonPay, Coinbase) are paying to bring mainstream.
3. **Privacy is structurally load-bearing, not decorative.** Strip Umbra and Tab is worse than Splitwise — your friend now sees your wallet history. The privacy *is* the product improvement.
4. **Investable founder pitch.** "We're the social-payments layer for crypto. Splitwise raised $20M and never solved this problem."

---

## Three-track submission strategy

### Anchor: Umbra ($10K USDC, 5/3/2 split for 1/2/3rd)
- **Integration:** Settlements use Umbra's receiver-claimable UTXOs. Group state held off-chain in Postgres; settlement actions are real shielded transfers.
- **Pitch frame:** "Tab is the consumer product Umbra needs. Settlements are the product, and they're built on the SDK from day one."
- **Realistic prize:** $5K (1st) — strongest fit, most submissions will do generic privacy demos.

### Secondary: SNS ($5K USDC, 1.8K/1.8K/700/700 across 4 winners)
- **Integration:** Replace wallet-address inputs with `.sol` handle resolution via `@bonfida/spl-name-service`. Group invite links use `.sol` handles. Recipient resolution happens at the SNS layer before the Umbra UTXO is created.
- **Pitch frame:** "Tab proves `.sol` is the social identity layer Solana has been waiting for. Your friends are people, not wallet addresses."
- **Realistic prize:** $700-$1.8K — easy add, clean fit with their "social identity as universal login layer" language.

### Stretch: Encrypt ($15K USDC, 10K/3K/1K/500/500)
- **Integration risk:** Encrypt's devnet was scheduled for "early Q2 2026." It may exist, may be very rough, or may not be production-usable in 4 days.
- **Pragmatic plan:** Build a clean abstraction `IEncryptedDebtGraph` that defaults to a working pure-TypeScript implementation. If Encrypt's SDK works in the spike on Day 3, swap in their backend. If not, ship with the abstraction and pitch the design as "FHE-ready" honestly.
- **Pitch frame:** "Tab uses FHE for the most sensitive part of group payments — the ledger that says who owes who. Your contributions are encrypted from your friends, the server, and us."
- **Realistic prize:** $500-$1K (4th-5th) — honest secondary, not the anchor.

### Submission targets

| Track | Realistic | Stretch |
|---|---|---|
| Umbra | $3K (2nd) | $5K (1st) |
| SNS | $700 (runner-up) | $1.8K (1st) |
| Encrypt | $0 (drop if SDK rough) | $1K (3rd) |
| **Floor** | **$3K** | |
| **Median** | **$5.7K** | |
| **Stretch** | | **$7.8K** |
| Frontier Grand | $0 | $30K + accelerator interview |

Realistic floor is $3K, realistic median is $5.7K. Plus the Colosseum portal submission for the overall Frontier Grand Champion ($30K) and accelerator pipeline ($250K).

---

## Why Tab beats other Umbra-track entries

The 19 other Umbra submissions are almost certainly:
- 6-8x "private payment apps" (Solana Pay clones, gift cards, payment links)
- 3-4x "private payroll" tools
- 2-3x compliance dashboards
- 2-3x generic private wallets

**They're all picking from the listed bullet points in Umbra's prompt.** Tab is mentioned nowhere. It's a consumer-shaped product that uses Umbra naturally, not a privacy-shaped product that bolts on a use case.

Comments on the Umbra listing reveal the SDK has integration friction ("documentation outdated, SDK works differently"). Whoever ships a polished, working integration with strong DX has a moat. Tab gives you that opening — its core flow is well-trodden ground in the SDK (deposit → UTXO creation → claim), so you avoid the rough edges.

---

## Critical decisions made

1. **Devnet only.** Mainnet has no upside in 4 days; bugs cost more than they impress.
2. **Off-chain group state.** Postgres (Supabase) for groups/members/expenses/ledger. Settlements are on-chain. Don't waste a day writing an Anchor program for state that doesn't need to be on-chain.
3. **USDC only.** Token: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` (devnet USDC). Multi-token support is a v2 feature.
4. **Phantom + Solflare wallet adapters.** Standard `@solana/wallet-adapter` stack.
5. **Next.js 14 App Router + Tailwind + shadcn/ui.** Fast UI, professional polish.
6. **Single repo, three pitch videos.** Same code, three submissions, framed differently.

---

## What "done" looks like by Day 4

A working Next.js app deployed on Vercel where:

1. Two browser tabs (with two real Solana wallets on devnet) can:
   - Sign in with Phantom
   - Create a group, invite by `.sol` handle
   - Add an expense (e.g., "Dinner at Mod Café — ₹1,200 — paid by alice.sol — split equally")
   - See the running ledger update
   - Tap "Settle up" — debtor's wallet creates a shielded UTXO to creditor's
   - Recipient's app auto-scans, sees the UTXO, claims it into their encrypted balance
   - Activity feed shows "Settled" without the amount visible to other group members
2. README.md with complete setup, architecture, and integration explanation
3. 5-minute demo video (×3, one per track)
4. Submitted to: Superteam Earn (×3 listings), Colosseum portal (Frontier overall)

---

## What's NOT in scope (resist scope creep)

- ❌ Multi-token support (USDC only)
- ❌ Mobile native app (responsive web is enough)
- ❌ Recurring/scheduled payments (mention as roadmap)
- ❌ Custom Anchor program (off-chain state is fine)
- ❌ Mainnet deployment
- ❌ Real KYC/compliance flows (mention viewing-key feature, don't build a portal)
- ❌ Mobile push notifications
- ❌ Group chat / messaging
- ❌ OCR receipt scanning
- ❌ Currency conversion (everyone uses USDC)

If during the build you feel the urge to add something not on this list, the answer is **no.** Pitch quality > feature count.
