# 10 — Page-by-Page Flow

The complete user journey through Tab. Every screen, every interaction, every moment of polish. Build pages in this order — each one builds on the previous.

---

## Page 1: Landing (`/`)

The first thing anyone sees, including judges scrubbing the demo.

### Layout
```
┌──────────────────────────────────────────┐
│  TAB                          [Sign in]  │
├──────────────────────────────────────────┤
│                                          │
│      Split anything.                     │  ← Display serif, 6rem
│      Settle privately.                   │
│                                          │
│      [Connect wallet to start]           │  ← Hard-shadow accent CTA
│                                          │
│      ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─          │  ← Dashed perforation
│                                          │
│   The shared-expenses app for crypto.    │  ← Lead paragraph
│   Settle in stablecoins on Solana, with  │
│   payments shielded so your friends      │
│   don't see your wallet history.         │
│                                          │
│  [Receipt component preview]             │  ← Live demo receipt
│                                          │
└──────────────────────────────────────────┘
```

### Key details
- **Hero copy must be off-asymmetric.** Top-left aligned, never centered.
- **The receipt preview** is a non-interactive Receipt component showing a sample settlement. This is your design statement.
- **Connect wallet** uses the wallet-adapter-react modal. Customize its z-index but don't restyle (compatibility risk).
- **Background:** the noise-textured paper (see `08-DESIGN-SYSTEM.md`).
- **No animations** on page load. Confidence reads as stillness here. The first interaction (Connect) is where motion starts.

### Implementation note
Use `<Receipt variant="sealed" />` with mock data to show what a settlement looks like. This communicates the product more than any tagline ever will.

---

## Page 2: Onboarding ("Set up your private inbox")

Triggered after the user connects a wallet for the first time.

### Why it exists
Umbra's `register({ confidential: true, anonymous: true })` requires an on-chain transaction (with SOL cost). Make this onboarding feel like a meaningful one-time setup, not a tax.

### Flow
1. User connects Phantom → wallet adapter returns connected
2. App checks `getUserAccountQuerierFunction` → if not registered, show this screen
3. User clicks "Set up private inbox" → triggers `register()` → wallet asks for signature
4. While transactions confirm: show the same `<ProofGenerationOverlay />`-style waiting screen, customized with phases:
   - "Initializing account"
   - "Generating X25519 keypair"
   - "Submitting commitment"
   - "Finalizing"
5. On success: confetti-equivalent (subtle, see below) + redirect to `/groups`

### Subtle "success" animation
No confetti. Confetti is for low-trust products. Tab's success animation:
- The dashed perforation line at the top of the next screen "draws in" left-to-right (200ms)
- The first time the user lands on `/groups`, the page title types in character-by-character (`Tab` → typewriter effect, 50ms per char)

This says "we typed you in to the system" — it's editorial, not gimmicky.

---

## Page 3: Groups list (`/groups`)

The home screen for authenticated users.

### Layout
```
┌──────────────────────────────────────────┐
│  TAB                  alice.sol  [⚙]     │
├──────────────────────────────────────────┤
│                                          │
│   Groups                  [+ New group]  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│                                          │
│   ┌──────────────────┐  ┌──────────┐    │
│   │ 🍝               │  │ 🏠       │    │
│   │ Goa Trip 2026    │  │ Apt 4B   │    │
│   │ 4 members        │  │ 3 mem    │    │
│   │       Owed: +$80 │  │  -$240   │    │
│   └──────────────────┘  └──────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

### Details
- **Two-column grid on desktop**, single column on mobile
- **Each card is a `<Receipt>` component.** Yes, even here. The receipt motif is everywhere.
- **Top right of each card** shows your net balance for that group: green (`text-owed-to`) if you're owed, vermillion (`text-owed`) if you owe, gray if settled.
- **Empty state** (no groups): a single "New group" CTA centered with the same empty-receipt SVG from `EmptyExpenses`, with copy: "Start a group to split anything with anyone."

### Header bar
- Logo: just the word `TAB` in display serif, 1.5rem
- User identity: `.sol` handle if available, else truncated wallet address
- Settings gear opens a dropdown: View profile, Disconnect, Devnet faucet links

---

## Page 4: New group (`/groups/new`)

A small form. Don't make it fancy.

### Layout
```
┌──────────────────────────────────────────┐
│  ← Back                                  │
├──────────────────────────────────────────┤
│                                          │
│   New group                              │  ← Display serif
│                                          │
│   [Pick emoji: 🍝]  [▼]                  │
│                                          │
│   Name                                   │  ← eyebrow label
│   [____________________]                 │  ← Input, no border, just bottom line
│                                          │
│   Description (optional)                 │
│   [____________________]                 │
│                                          │
│   Members                                │
│   [Add by .sol handle, e.g. alice.sol]   │
│                                          │
│   • alice.sol      [×]                   │
│   • bob.sol        [×]                   │
│                                          │
│                          [Create group]  │
│                                          │
└──────────────────────────────────────────┘
```

### Member adding flow (this is where SNS shines)
When user types `alice.sol` and hits Enter:
1. Show a tiny inline spinner: "Resolving alice.sol..." (cursor blink)
2. Call `resolveSolHandle('alice.sol')` → wallet pubkey
3. On success: row appears with `alice.sol` and a faded wallet preview `7xK9...8a2P`
4. On failure: subtle error: "Couldn't find alice.sol — check spelling, or add by wallet address"

The "add by wallet address" fallback is a single click that swaps the input mode. Always offer this.

### Visual detail
- Inputs have **no boxes**. Just a 1px solid border-bottom. Focus state: border thickens to 2px and changes to `--ink`.
- Labels are always `text-eyebrow` above the input.
- The submit button is bottom-right aligned, paper variant (not the loud accent CTA — this isn't the moment).

---

## Page 5: Group detail (`/groups/[id]`)

The most-used page. Most of `09-COMPONENTS.md` was building toward this.

### Sections (top to bottom)
1. **Header** — emoji + display-serif group name + member count + "settlements shielded" privacy seal
2. **The Ledger** — the simplified debt graph as `LedgerRow`s inside a Receipt
3. **Activity** — timeline of expenses and settlements
4. **Members** — small pill list with `.sol` handles, click to view individual balance with that member

### Activity feed details
Each entry has its own minimal layout:

```
EXPENSE
🍕 Pizza dinner — $48.00
Paid by alice.sol · split equally with 4 people
Today, 8:42 PM

────── ── ── ── ── ── ── ── ── ── ──

SETTLEMENT  [Private · Shielded]
priya.sol → alice.sol
[Click to view receipt]
Today, 9:15 PM
```

For settlements, the amount is **only visible to the parties involved**. Other group members see "Settlement: priya.sol → alice.sol" with no number. This is not just UI — it's enforced because the amount is encrypted in the Umbra UTXO. **This is the key Twitter screenshot.** Show it in the demo: log in as a third party who can't see the amount.

### Hover states
- Expense rows: subtle bg shift on hover, "View details" appears bottom-right
- Settlement rows: same shift, "View receipt" appears (only for involved parties)
- Ledger rows: the Settle button slides in from the right (only for debts where you're the debtor)

---

## Page 6: Add expense (`/groups/[id]/add-expense`)

A modal or full page (full page is easier to build fast, modal is more polished). Build full page first.

### Layout
```
┌──────────────────────────────────────────┐
│  ← Goa Trip 2026                         │
├──────────────────────────────────────────┤
│                                          │
│   New expense                            │
│                                          │
│   Amount                                 │
│   [$___________]                          │  ← Big mono numeric input
│                                          │
│   What was it for?                       │
│   [_____________________________]        │
│                                          │
│   Paid by                                │
│   [▼ alice.sol (you)]                    │  ← Dropdown of group members
│                                          │
│   Split between                          │
│   ☑ alice.sol  [25%]                     │
│   ☑ priya.sol  [25%]                     │
│   ☑ arjun.sol  [25%]                     │
│   ☑ rohan.sol  [25%]                     │
│                                          │
│   [Equal] [By share] [Custom amounts]    │  ← Tabs
│                                          │
│                            [Add expense] │
│                                          │
└──────────────────────────────────────────┘
```

### Amount input — make this hero
- Font size: `text-4xl` (or 3rem)
- Font: `--font-mono`
- The `$` sign is its own element, slightly smaller (text-2xl) and ink-mute
- No box around the input. Just a thick (2px) bottom border that's solid.
- Live formatting: as user types `48`, it shows `48`. As they type `48.50`, it shows `48.50`. No grouping commas (looks unprofessional with currency).

### Split modes
Three tabs at the bottom:
1. **Equal** — auto-divides; checkboxes select participants
2. **By share** — each person gets a "share" number (1, 2, etc.); useful for "Alice ate twice as much"
3. **Custom amounts** — type each person's exact share

For demo, **Equal** is enough. Build others as v2.

### Validation
- Sum of splits must equal amount (within $0.01 tolerance for floating-point cents)
- "Paid by" must be a member
- At least one participant
- Inline errors below each field, never a top-of-page banner

---

## Page 7: Settle Up (`/groups/[id]/settle`)

The moment of truth. The most-watched UI in the app.

### Flow
1. User taps "Settle" on a `LedgerRow` in the group detail page
2. Routes to `/groups/[id]/settle?to=alice.sol&amount=400`
3. Show a confirmation Receipt (preview):

```
┌────────────────────────┐
│       TAB              │
│  Settling debt         │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                        │
│  To       alice.sol    │
│  Group    Goa Trip     │
│  Amount      $400.00   │
│                        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                        │
│  This payment will be  │
│  shielded — only you   │
│  and alice will see    │
│  the amount.           │
│                        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                        │
│   [✗ Cancel]  [Settle ▶]
└────────────────────────┘
```

4. User taps "Settle ▶":
   - Wallet adapter prompts for signature (Phantom popup)
   - On signature: show `<ProofGenerationOverlay />`
   - SDK calls happen: `settleDebt()` → returns signatures
   - On callback signature confirmed: replace overlay with `<SettlementReceipt />` for ~3 seconds
   - Auto-redirect back to group detail page; new entry in activity feed

### What the recipient sees (the magic moment for the demo)
On a separate browser tab logged in as alice:
1. App is already polling `scanForUtxos` every 15s
2. New UTXO appears in scan results
3. Toast notification: "💌 You received a private settlement from priya.sol"
4. User clicks → opens claim flow
5. App calls `claimUtxos` → relayer pays gas, claim completes
6. Activity feed updates: settlement now shows as confirmed on both sides

**This bidirectional flow is THE demo moment.** Record both screens side-by-side in the video.

---

## Page 8: Settlement Receipt detail (`/settlements/[id]`)

For the parties involved, click an old settlement to see its full receipt.

Same `<SettlementReceipt />` component, but with a "View on Solana Explorer" link at the bottom. This is the *proof* — explorer shows the Umbra interaction with no visible amount. This is a critical pitch detail.

```
[Open on Solana Explorer ↗]    ← Opens explorer in new tab
   ~ Notice: amount not visible to outside observers ~
```

---

## Page 9: Profile / Settings (`/settings`)

Minimal. Don't overbuild.

### Sections
- **Identity** — your wallet address, your `.sol` handle (if any), claim button if not set
- **Encrypted balance** — your private USDC balance + button to deposit/withdraw
- **Viewing keys** — list of grants you've issued (v2; show empty state for v1)
- **Sign out**

---

## Mobile-specific tweaks

The app should work on mobile but it doesn't need to be mobile-first. Tweaks:
- Header collapses to logo + hamburger
- Group cards stack
- Add expense form: amount input becomes full-width with even larger font
- The settle confirmation receipt is full-screen on mobile (it's already small enough on desktop)
- Touch targets: minimum 44×44

---

## What can be cut if you run out of time

In priority order, drop these:

1. **Activity feed pagination** — show last 20, that's enough for demo
2. **By share / Custom amounts split modes** — Equal-only is fine
3. **Group settings page** — link to it but make it a 404 with "coming soon"
4. **Profile page** — embed identity into a header dropdown instead
5. **Mobile polish** — desktop-only is OK for demo, just don't break on resize

What you **cannot cut**:
- The receipt component (it's the design)
- The privacy seal (it's the brand)
- The ZK loading overlay (it's the wow moment)
- The settlement receipt (it's the trust moment)
- Bidirectional demo flow (it's the proof)
