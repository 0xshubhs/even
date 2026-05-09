# 06 — Demo Scripts + Pitch Deck

## The video is what wins

Colosseum's own guidance: **judges watch the video first.** It usually decides whether your project gets a deeper review. 5 minutes max. Hook in 10 seconds. Show, don't tell.

Three videos, same project. The build is the same; the framing is different. Don't over-engineer this — record once, edit twice if you have to.

---

## Video 1 — The Umbra-flavored demo (5 min)

**Hook (0:00–0:15):**
> "Every time you Venmo a friend in stablecoins on Solana, you've handed them your entire financial history. Solscan shows your balance, every transaction you've ever made, who you pay, when. That's not a privacy upgrade over Venmo — it's a downgrade. Tab fixes it."

**Problem (0:15–0:45):**
- Open Solscan. Show a real wallet's transaction history. Highlight: "Imagine your roommate seeing all of this when you pay them rent."
- "Solana has the speed and the cost to be the global payments layer. But every payment is forensically public. Until Umbra."

**Product walkthrough (0:45–3:30):**
- Window A: connect Phantom (devnet). Show: "Tab uses Umbra to register a private inbox. One signature, takes 2 seconds."
- Create group: "Goa Trip 2026."
- Add member by `.sol` handle: `priya.sol`, `arjun.sol`. "Tab uses SNS so you don't paste wallet addresses."
- Add expense: "Hotel — ₹12,000 — paid by me — split equally."
- Show ledger: "Priya owes me ₹4,000. Arjun owes me ₹4,000."
- Switch to Window B (Priya's wallet). "Priya opens Tab and sees the group. She taps Settle up."
- *Show the privacy proof generation: "Generating privacy proof... ~5s"*
- Settlement completes. Window A shows: "Priya settled — ₹4,000 received."
- Open Solscan in a new tab. Search Priya's wallet. Show that the transaction appears as an Umbra interaction with no visible recipient or amount.
- *"Compare:"* show what a normal USDC transfer looks like on Solscan with full visibility.

**The why (3:30–4:30):**
- "Privacy isn't a feature in Tab — it's the whole point. Splitwise has 50 million users and they all hate that the easiest digital payments leak their private finances. We're the first product where settlement on a public chain doesn't doxx you."
- Show the viewing-key feature: "Group admin can grant a scoped viewing key to an accountant or landlord. Selective disclosure, not all-or-nothing."
- Show debt simplification: "If Alice owes Bob, Bob owes Carol, we net it out. One payment instead of three."

**Close (4:30–5:00):**
- "Tab is built on Umbra Privacy as the entire settlement engine. The SDK lets us deliver real privacy without us reinventing cryptography. It's the consumer product Umbra needs and the social-payments product Solana has been waiting for. Tab — split anything, settle privately."

---

## Video 2 — The SNS-flavored demo (5 min)

**Hook (0:00–0:15):**
> "Crypto's worst UX failure is wallet addresses. `7xK9vRmNzYjQpL3...` is not how humans share money. Your bank account is `Alice`. Your Venmo is `@alice`. Your Solana wallet should be `alice.sol`. Tab makes that real."

**Problem (0:15–0:45):**
- "Splitwise works because you add Alice. Crypto Splitwise clones don't work because you have to copy-paste a 44-character string. SNS solves identity. We just had to build the product."

**Product walkthrough (0:45–3:30):**
- Same flow as Video 1, but emphasize SNS at every step:
  - "I'm creating a group. I want to invite three people. I type `priya.sol` — Tab resolves the wallet behind the scenes."
  - "I send a group invite link. It contains the `.sol` handles, not wallet addresses. When Priya clicks it, Tab knows it's her without any address-paste step."
  - "When I settle a debt, I'm paying `priya.sol`. Tab resolves it, generates a stealth payment via Umbra. The actual wallet I send to is hidden from the network — but the user-facing handle stays human."
  - "Reverse lookup: when Priya sends me a payment, my UI shows `priya.sol`, not her wallet."
- Show a settlement happening end-to-end with `.sol` handles visible in the UI throughout.

**The why (3:30–4:30):**
- "SNS positioned itself as the universal identity layer for Solana. Tab is the proof. We use SNS as the login, the address book, the payment routing, and the social graph all at once. Without SNS, Tab is unusable. With SNS, it's better than Venmo."
- Show how a `.sol` handle works for both the public-facing identity *and* the privacy-preserving payment. SNS resolves; Umbra shields. They compose perfectly.

**Close (4:30–5:00):**
- "Tab is what `.sol` is for. Identity should resolve to *people*, and the payments behind it should stay private. We use SNS as the identity layer, Umbra as the privacy layer, and bring it all together in a Splitwise UX millions of people already understand."

---

## Video 3 — The Encrypt-flavored demo (5 min)

**Only record this if the spike succeeded.** If you're shipping the local stub, skip this video and don't submit to the Encrypt track. A weak Encrypt submission could hurt your judging.

**Hook (0:00–0:15):**
> "The most overlooked privacy leak in any group-payments app isn't the payment itself — it's the ledger. Who contributed what, who owes who. That sits in some company's database in plaintext. Tab encrypts it from day one."

**Problem (0:15–0:45):**
- Show the database problem. "Splitwise sees every contribution. So does Venmo, every shared-expense app, every fintech. Tab uses Encrypt's FHE on Solana so even our own server doesn't see individual amounts."

**Product walkthrough (0:45–3:30):**
- Show contributions being submitted as ciphertexts (open dev tools, show the encrypted handle).
- Show pairwise debt computation happening on encrypted data.
- Show pairwise totals being decrypted only by the two parties involved.
- Show server-side: even with full DB access, contributions are opaque.

**Close (4:30–5:00):**
- "Tab is the first social-payments app where confidentiality goes all the way down — payments shielded by Umbra, ledger encrypted by Encrypt, identity by SNS. Three privacy primitives, one consumer product."

---

## Pitch deck outline (5–7 slides max)

Make this a Google Slides or Pitch.com deck. Export to PDF for submission.

### Slide 1 — Title
- **Tab — Split anything. Settle privately.**
- One-line pitch
- Your name + handles
- "Solana Frontier Hackathon 2026"

### Slide 2 — The problem
- Screenshot: a Solscan page showing a real wallet's history
- "When you pay someone in stablecoins, this is what they see."
- "Crypto payments are *less private* than Venmo. That's why Splitwise hasn't moved onchain."

### Slide 3 — The product
- Screenshot of Tab's group detail page (your best UI shot)
- 3-bullet feature list (split, settle, see)
- "The Splitwise UX, but settlements don't leak."

### Slide 4 — How it works
- Architecture diagram (a clean version of the one in the README)
- Three layers: Umbra (privacy), SNS (identity), Encrypt (encrypted ledger)
- Each layer in one sentence.

### Slide 5 — Why now
- Solana stablecoin volume stat (you can pull a recent number from Solana DeFi reports)
- Splitwise has 50M+ users, $0 in onchain settlement
- Privacy infra (Umbra mainnet, Arcium, Encrypt devnet) just shipped — first-mover window

### Slide 6 — Traction / state
- Devnet live link
- GitHub link
- What's working today (specific list, not vague claims)
- Roadmap to mainnet (one sentence per milestone)

### Slide 7 — The team & ask
- Who you are (1 line each)
- "Looking for: Colosseum accelerator interview, Umbra/SNS/Encrypt prize, design partners"
- Contact

---

## Recording tips

- **Screen-record at 1920×1080.** Loom or QuickTime. Don't go higher — submission portals choke.
- **Two browser windows side-by-side.** Demo the social use case visually.
- **Keep terminal/dev-tools off-screen** unless you're explicitly showing a code/ciphertext moment.
- **Voice-over after recording.** Don't try to nail it live. Record clean clicks, then narrate.
- **Hard 5-minute cap.** Edit ruthlessly. The hook is 10 seconds, not 45.
- **Upload to YouTube unlisted.** Submission portals like YouTube links over file uploads. Title: "Tab — [Track name] — Solana Frontier Hackathon."
- **First frame should be your product, not a title card.** Judges scrub. The thumbnail must say "this is a real app."
