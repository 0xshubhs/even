# 08 — Design System

This is the visual identity for Tab. Read this **before** writing any UI code. Tab needs to feel like a serious 2026 consumer fintech product, not a hackathon submission. Judges will see hundreds of generic dark-purple-gradient apps. Yours has to feel like a brand.

---

## Aesthetic direction: "Receipt Paper"

Tab's visual identity is built on a single concept: **the receipt**. Splitwise is fundamentally about receipts. Every interaction in Tab should feel like reading or tearing a beautifully-printed receipt. This means:

- **Off-white paper backgrounds** (not pure white) with subtle warm tone
- **Monospace numbers** with tabular alignment, like a printed bill
- **Dashed dividers** and **perforated edges** as recurring visual motifs
- **Sharp, dense typography** with heavy weight for emphasis
- **Almost no color** — black and one accent. Receipts don't have brand colors.

The product feels physical, deliberate, *quiet* — but every interaction is sharp.

**What this is NOT:**
- ❌ Glass-morphism / frosted glass (overdone in crypto since 2023)
- ❌ Purple gradients (the universal AI-design tell)
- ❌ Floating cards with soft shadows
- ❌ Neon / cyberpunk (try-hard for crypto)
- ❌ "Linear-style" cool grays (everyone copies Linear; you'll look generic)

**What this IS:**
- ✅ Editorial. Think Monocle magazine, FT Weekend, a Muji catalog
- ✅ Confident silence. Black on cream, one bold accent
- ✅ Dense data. Numbers feel like they were typed by a typewriter
- ✅ Surprising motion. Tear effects, paper unfolding, ink-blot transitions

---

## Color tokens

```css
/* apps/web/app/globals.css */
@layer base {
  :root {
    /* Paper — the surface */
    --paper: 38 25% 96%;          /* #F7F2EA — warm off-white, the whole app background */
    --paper-deep: 38 18% 92%;     /* #EEE7DA — slightly darker recessed surfaces */
    --paper-rim: 38 14% 84%;      /* #DCD3C2 — borders, dividers */
    --paper-line: 38 12% 76%;     /* #C7BCA7 — dashed lines, sub-borders */

    /* Ink — the text */
    --ink: 30 10% 8%;             /* #181612 — primary text, near-black with warmth */
    --ink-soft: 30 8% 28%;        /* #4A453E — secondary text */
    --ink-mute: 30 6% 50%;        /* #837E74 — tertiary text, captions */
    --ink-ghost: 30 5% 70%;       /* #BAB5AB — disabled, decorative */

    /* Accent — used SPARINGLY. This is the only color in the product. */
    --accent: 14 88% 48%;         /* #E8451A — vermillion. Used for: CTA, alerts, "money owed" */
    --accent-deep: 14 88% 38%;    /* #B83611 — pressed CTA */
    --accent-tint: 14 88% 94%;    /* #FCE5DD — accent backgrounds */

    /* Money — distinct semantic colors */
    --owed: 14 88% 48%;           /* same as accent — what you owe */
    --owed-to: 145 50% 28%;       /* #246E45 — what's owed to you (forest green, ledger ink) */

    /* Privacy — the third color, used only in privacy moments */
    --privacy: 248 60% 36%;       /* #312698 — deep indigo, "private" badge color */
    --privacy-tint: 248 60% 94%;  /* #E5E2F4 */
  }

  /* Dark mode is OFF for Tab. The receipt aesthetic works in one mode.
     Don't waste time on dark mode. If a judge asks, the answer is
     "the paper aesthetic is intentional and singular."

     If you must, add a dark mode in v2. Dark mode = "old monitor terminal":
     deep-green text on near-black, never gray-on-gray. */
}
```

### Color usage rules

| Use | Token | Frequency |
|---|---|---|
| Backgrounds (everywhere) | `--paper` | 80% of pixels |
| Cards, modal bgs | `--paper-deep` | 12% |
| Body text | `--ink` | most text |
| Captions, metadata | `--ink-mute` | secondary text |
| Borders, dividers | `--paper-rim` | structure |
| **Settle Up** button, debt amounts | `--accent` | **rare and meaningful** |
| Owed-to-you amounts | `--owed-to` | balanced with accent |
| "Private" badges, lock icons | `--privacy` | privacy moments only |

**Do not use accent for hover states, links, or "fun." Save it.** When the user sees vermillion red, it should mean *money you owe* or *act now*. Privacy indigo should mean *this is shielded*. Everything else is ink on paper.

---

## Typography

Two fonts. No more.

### Display: **GT Sectra** (or fallback **Cormorant Garamond**)

- A sharp, editorial serif with cut terminals. Used for: headlines, group names, big numbers in the hero ledger.
- Get it from: https://www.grilli.type/typeface/gt-sectra
- Free fallback: Cormorant Garamond (Google Fonts) if licensing budget = 0

### Body & UI: **Söhne** (or fallback **Inter Tight**)

- Modern grotesk, slightly tighter than Helvetica. Used for: body text, UI labels, buttons.
- Get it from: https://klim.co.nz/retail-fonts/sohne/
- Free fallback: **Inter Tight** (Google Fonts) — it's tighter than regular Inter, less generic

### Monospace (numbers, addresses): **JetBrains Mono** or **Berkeley Mono**

- For: dollar amounts, wallet addresses, signatures, anywhere that benefits from tabular alignment.

```css
/* Add to globals.css */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --font-display: 'GT Sectra', 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Söhne', 'Inter Tight', -apple-system, sans-serif;
  --font-mono: 'Berkeley Mono', 'JetBrains Mono', 'SF Mono', monospace;
}

/* Numbers always use mono and tabular nums */
.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

### Type scale

```css
:root {
  --text-xs: 0.75rem;     /* 12px - captions, metadata */
  --text-sm: 0.875rem;    /* 14px - secondary body */
  --text-base: 1rem;      /* 16px - body */
  --text-lg: 1.125rem;    /* 18px - lead paragraph */
  --text-xl: 1.5rem;      /* 24px - card heading */
  --text-2xl: 2rem;       /* 32px - section heading */
  --text-3xl: 2.75rem;    /* 44px - page title */
  --text-4xl: 4rem;       /* 64px - hero (group name) */
  --text-5xl: 6rem;       /* 96px - the big number on the receipt */
}
```

Use `--font-display` only for `--text-2xl` and above. UI under that = `--font-body`.

### Letter spacing

- Display sizes: `letter-spacing: -0.025em` (tighter, more confident)
- Body: default
- All-caps labels (e.g. "TOTAL", "PAID BY"): `letter-spacing: 0.12em; font-size: 0.7rem; font-weight: 600;`

---

## Spatial system

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.5rem;   /* 24px */
  --space-6: 2rem;     /* 32px */
  --space-8: 3rem;     /* 48px */
  --space-10: 4rem;    /* 64px */
  --space-12: 6rem;    /* 96px */
  --space-16: 10rem;   /* 160px - generous space between sections */
}

/* Radii — receipts have NO rounded corners. Use square edges. */
--radius-none: 0;
--radius-sm: 2px;       /* the rare exception */
--radius-md: 4px;
/* Never use radius-lg or above. No "pill" buttons. */
```

**Layouts: hard left-align. Generous gutters. Never centered card-on-page.** Tab's pages have the visual rhythm of a printed receipt, where every line starts on the same vertical baseline.

---

## Iconography

- Use **Lucide React** (`lucide-react`) — clean line icons. Stroke width: `1.5`.
- For the "private" lock motif: a custom SVG. See `09-COMPONENTS.md`.
- No filled icons. No emoji except in group covers (user-chosen). No animations on icons except the accent CTA.

---

## Motion principles

Tab has a few moments of designed motion. Most of the app is still.

### Page transitions
- Cross-fade only, 200ms, ease-out. No slide. No swoop.

### "Settle Up" — the hero animation
- This is the moment the product earns trust. Spend animation budget here.
- Sequence (~2.5s total):
  1. Press button → button compresses (scale 0.97), 150ms
  2. Receipt slides up from below the button, perforated tear at top
  3. **The amount on the receipt animates as a counter** from 0 to the debt value, 800ms, monospace
  4. **A wax-seal-style stamp animates in** ("PRIVATE • SHIELDED") — rotates from -8° to 0°, 250ms with a subtle bounce
  5. Receipt holds for 600ms, then slides out the bottom of the screen with a paper-rustle sound (optional)

Implement with Framer Motion (`motion/react`). Reuse the receipt component for past settlements (no animation on render).

### Adding an expense
- The form fields appear staggered, 50ms delay each. Subtle.
- On submit, the row "prints" into the activity feed: appears with a tiny vertical squash/expand (scale-y from 0 to 1, transform-origin top), 250ms.

### Hover states
- **Buttons:** background shift only, no scale. Never lift.
- **Group cards:** subtle texture shift — a noise overlay becomes 4% more opaque. Almost imperceptible. (See `09-COMPONENTS.md`.)
- **Settlement rows:** the "Settle up" link reveals as you hover the row, sliding in from the right.

### Loading states
- **NEVER** use the generic spinner. Tab uses a typewriter cursor: a vertical bar (`|`) that blinks at 1Hz next to the operation label.
- For the ZK proof generation (5-8 seconds), show: `Generating privacy proof  ▍` with the cursor pulsing. Below: a thin progress bar that fills to 80% over the average proof time, then waits for the actual completion to finish.

### Reduced motion
- `@media (prefers-reduced-motion: reduce)` — collapse all animations to instant or 100ms fade. Tab respects users.

---

## The signature visual: dashed perforation

Every receipt-style boundary in Tab uses a dashed line that looks tearable. This is your visual signature. Use it on:

- The bottom of the activity feed
- Between expense items
- Around the "Settle up" CTA panel
- The footer

```css
/* The signature dashed border */
.tear {
  background-image: linear-gradient(
    to right,
    var(--paper-rim) 50%,
    transparent 50%
  );
  background-size: 8px 1px;
  background-repeat: repeat-x;
  background-position: top;
  height: 1px;
}

/* Or as a full border-top */
.tear-top {
  border-top: 1px dashed hsl(var(--paper-rim));
  border-top-style: dashed;
  border-image-source: repeating-linear-gradient(
    to right,
    hsl(var(--paper-rim)) 0,
    hsl(var(--paper-rim)) 4px,
    transparent 4px,
    transparent 8px
  );
}
```

For the **really** receipt-feeling tear — half-circles cut from the edges of cards:

```css
.tear-edge {
  position: relative;
}
.tear-edge::before,
.tear-edge::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: hsl(var(--paper));
  top: 50%;
  transform: translateY(-50%);
}
.tear-edge::before { left: -6px; }
.tear-edge::after { right: -6px; }
```

(Use sparingly — only on the settlement receipt component.)

---

## Texture

Add a subtle paper grain to the body background. This is what separates the look from "another flat web app."

```css
body {
  background-color: hsl(var(--paper));
  background-image:
    /* fine grain noise */
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E");
}
```

The `0.04` opacity in the matrix is critical — any higher and it looks dirty, any lower and there's no point. This is the move that makes screenshots look high-quality.

---

## What "good design" means for Tab

If a judge takes one screenshot of Tab and shares it on Twitter, three things should be evident:

1. **It's clearly a fintech product.** The receipt motif and hard-aligned numbers signal money software immediately.
2. **It looks expensive.** The serif display + paper texture + restrained color palette signal "this is not a hackathon project."
3. **It feels intentional.** Every visual choice — square corners, vermillion accent, dashed tears — is consistent with one idea (receipt).

If you find yourself adding a gradient, ask: "Would a receipt have a gradient?" The answer is no.

---

## Reference look-and-feel

Build mental models from these. Do not copy any of them — extract the **discipline**:

- **Are.na** — for editorial restraint and how to make off-white feel premium
- **Stripe Press** — for serif display + sans body composition
- **Vouch.io** — for fintech that doesn't look like every other fintech
- **Cash App's design system circa 2022** — for monospace numbers as the hero
- **Substack's reader view** — for paper textures on the web
- **Polymarket** — for how to make data-dense pages feel calm

**Do not reference:** Linear (everyone copies it), Phantom (you're submitting to their hackathon — don't look like them), every other crypto app on Behance.
