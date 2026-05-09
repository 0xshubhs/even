# 09 — Component Specifications

Real component code. Drop these into your repo. They embody the design system from `08-DESIGN-SYSTEM.md`.

---

## Tailwind config

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'hsl(var(--paper))',
          deep: 'hsl(var(--paper-deep))',
          rim: 'hsl(var(--paper-rim))',
          line: 'hsl(var(--paper-line))',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          soft: 'hsl(var(--ink-soft))',
          mute: 'hsl(var(--ink-mute))',
          ghost: 'hsl(var(--ink-ghost))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          deep: 'hsl(var(--accent-deep))',
          tint: 'hsl(var(--accent-tint))',
        },
        owed: 'hsl(var(--owed))',
        'owed-to': 'hsl(var(--owed-to))',
        privacy: {
          DEFAULT: 'hsl(var(--privacy))',
          tint: 'hsl(var(--privacy-tint))',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        'eyebrow': ['0.7rem', { letterSpacing: '0.12em', fontWeight: '600' }],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'tear-in': 'tearIn 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'stamp-in': 'stampIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'count-up': 'countUp 800ms ease-out both',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        tearIn: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        stampIn: {
          '0%': { transform: 'scale(2) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(0.95) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-4deg)', opacity: '1' },
        },
        countUp: {
          '0%': { transform: 'translateY(0.6em)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## Root layout

```tsx
// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Tab — Split anything. Settle privately.',
  description: 'The shared-expenses app for crypto. Settle in stablecoins on Solana with payments shielded.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body min-h-screen antialiased">
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

---

## The Receipt component (your hero element)

This is the one component that *makes* the design. Every settlement, every expense, renders as one of these.

```tsx
// components/receipt/Receipt.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ReceiptProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'sealed';
}

export function Receipt({ children, className, variant = 'default' }: ReceiptProps) {
  return (
    <div
      className={cn(
        'relative bg-paper-deep border-x border-paper-rim',
        'shadow-[0_2px_0_0_hsl(var(--paper-rim))]',
        className,
      )}
    >
      {/* Top tear */}
      <ReceiptEdge position="top" />

      <div className="px-6 py-5">{children}</div>

      {/* Bottom tear */}
      <ReceiptEdge position="bottom" />

      {variant === 'sealed' && <PrivacySeal />}
    </div>
  );
}

function ReceiptEdge({ position }: { position: 'top' | 'bottom' }) {
  return (
    <svg
      className={cn(
        'block w-full text-paper-deep absolute left-0',
        position === 'top' ? '-top-2' : '-bottom-2 rotate-180',
      )}
      height="8"
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
    >
      <path
        d="M0,8 L0,4 Q2.5,0 5,4 T10,4 T15,4 T20,4 T25,4 T30,4 T35,4 T40,4 T45,4 T50,4 T55,4 T60,4 T65,4 T70,4 T75,4 T80,4 T85,4 T90,4 T95,4 T100,4 L100,8 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PrivacySeal() {
  return (
    <div className="absolute -right-2 top-6 origin-top-right animate-stamp-in">
      <div className="border-2 border-privacy text-privacy px-3 py-1.5 -rotate-4 bg-paper">
        <div className="font-mono text-eyebrow">Private · Shielded</div>
      </div>
    </div>
  );
}
```

```tsx
// components/receipt/ReceiptHeader.tsx
import { ReactNode } from 'react';

export function ReceiptHeader({
  merchant,
  meta,
}: {
  merchant: string;
  meta?: ReactNode;
}) {
  return (
    <div className="space-y-1 mb-4 text-center">
      <div className="font-display text-2xl tracking-tight">{merchant}</div>
      {meta && <div className="font-mono text-xs text-ink-mute uppercase tracking-wider">{meta}</div>}
      <div className="tear pt-2 mt-2" />
    </div>
  );
}
```

```tsx
// components/receipt/ReceiptLine.tsx
export function ReceiptLine({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`flex justify-between items-baseline py-1.5 ${emphasis ? 'border-t border-dashed border-paper-rim mt-3 pt-3' : ''}`}>
      <span className={`text-sm ${emphasis ? 'font-semibold' : 'text-ink-soft'}`}>{label}</span>
      <span className={`font-mono tabular-nums ${emphasis ? 'text-lg font-semibold' : 'text-base'}`}>{value}</span>
    </div>
  );
}
```

---

## The CTA Button

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'paper';
  size?: 'default' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-body font-semibold',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // Sizes
          size === 'default' && 'h-10 px-5 text-sm',
          size === 'lg' && 'h-14 px-8 text-base',
          // Variants
          variant === 'primary' && 'bg-ink text-paper hover:bg-ink-soft active:bg-ink',
          variant === 'paper' && 'bg-paper-deep text-ink border border-paper-rim hover:bg-paper-rim',
          variant === 'ghost' && 'text-ink-soft hover:text-ink hover:bg-paper-deep',
          className,
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

For the *signature* CTA — the "Settle Up" button — make it the loud one:

```tsx
// components/ui/SettleButton.tsx
import { Button, ButtonProps } from './Button';
import { cn } from '@/lib/utils';

export function SettleButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      size="lg"
      className={cn(
        'bg-accent text-paper hover:bg-accent-deep active:bg-accent-deep',
        'font-semibold uppercase tracking-wider',
        'shadow-[3px_3px_0_0_hsl(var(--ink))]',
        'hover:shadow-[2px_2px_0_0_hsl(var(--ink))] hover:translate-x-[1px] hover:translate-y-[1px]',
        'active:shadow-none active:translate-x-[3px] active:translate-y-[3px]',
        'transition-all duration-100',
        className,
      )}
      {...props}
    />
  );
}
```

The hard offset shadow + press animation gives this button real physical weight. It's the moment the user commits to a payment.

---

## Group Card (the home grid)

```tsx
// components/group/GroupCard.tsx
import Link from 'next/link';
import { Receipt } from '@/components/receipt/Receipt';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    emoji: string;
    memberCount: number;
    yourBalance: bigint; // negative = you owe, positive = owed to you
  };
}

export function GroupCard({ group }: GroupCardProps) {
  const isOwed = group.yourBalance > 0n;
  const isOwing = group.yourBalance < 0n;
  const amount = Number(group.yourBalance < 0n ? -group.yourBalance : group.yourBalance) / 1_000_000;

  return (
    <Link href={`/groups/${group.id}`} className="group block">
      <Receipt className="hover:bg-paper transition-colors duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-3xl leading-none">{group.emoji}</div>
            <div className="font-display text-2xl tracking-tight pt-2">{group.name}</div>
            <div className="font-mono text-xs text-ink-mute uppercase tracking-wider">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </div>
          </div>

          <div className="text-right">
            {isOwed && (
              <>
                <div className="text-eyebrow text-ink-mute">Owed to you</div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-owed-to">
                  +${amount.toFixed(2)}
                </div>
              </>
            )}
            {isOwing && (
              <>
                <div className="text-eyebrow text-ink-mute">You owe</div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-owed">
                  -${amount.toFixed(2)}
                </div>
              </>
            )}
            {!isOwed && !isOwing && (
              <>
                <div className="text-eyebrow text-ink-mute">Settled</div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-ink-mute">
                  $0.00
                </div>
              </>
            )}
          </div>
        </div>
      </Receipt>
    </Link>
  );
}
```

---

## The Ledger Row (the core of every group page)

```tsx
// components/group/LedgerRow.tsx
import { ArrowRight, Lock } from 'lucide-react';
import { SettleButton } from '@/components/ui/SettleButton';

interface LedgerRowProps {
  from: { handle: string; isYou: boolean };
  to: { handle: string; isYou: boolean };
  amount: bigint;
  onSettle?: () => void;
}

export function LedgerRow({ from, to, amount, onSettle }: LedgerRowProps) {
  const usd = Number(amount) / 1_000_000;
  const youCanSettle = from.isYou; // you can only settle debts where you're the debtor

  return (
    <div className="group flex items-center justify-between py-4 border-b border-dashed border-paper-rim last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-base">
          <span className={from.isYou ? 'font-semibold' : 'text-ink-soft'}>
            {from.isYou ? 'You' : from.handle}
          </span>
          <ArrowRight className="w-4 h-4 text-ink-ghost" strokeWidth={1.5} />
          <span className={to.isYou ? 'font-semibold' : 'text-ink-soft'}>
            {to.isYou ? 'You' : to.handle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono tabular-nums text-lg font-semibold">
          ${usd.toFixed(2)}
        </span>
        {youCanSettle && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <SettleButton onClick={onSettle} size="default" className="text-xs">
              Settle <Lock className="w-3 h-3 ml-1.5" strokeWidth={2} />
            </SettleButton>
          </div>
        )}
      </div>
    </div>
  );
}
```

The "Settle" CTA appears on hover — calm in steady state, alive on intent. The `Lock` icon + accent color is the visual link to "this will be private."

---

## The Privacy Seal (used in many places)

```tsx
// components/ui/PrivacySeal.tsx
import { Lock } from 'lucide-react';

interface PrivacySealProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function PrivacySeal({ size = 'md', label = 'Private · Shielded' }: PrivacySealProps) {
  const sizeStyles = {
    sm: 'text-[0.6rem] px-2 py-0.5',
    md: 'text-eyebrow px-3 py-1.5',
    lg: 'text-xs px-4 py-2',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 border-2 border-privacy text-privacy bg-paper font-mono ${sizeStyles[size]}`}>
      <Lock className="w-3 h-3" strokeWidth={2.5} />
      {label}
    </div>
  );
}
```

---

## The ZK Loading State (the most-watched UI in the app)

When the user taps Settle Up, they wait 5-8 seconds for the ZK proof. This is the only chance to make crypto-waiting feel intentional.

```tsx
// components/umbra/ProofGenerationOverlay.tsx
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

const PHASES = [
  'Generating commitment',
  'Building Merkle proof',
  'Running Groth16',
  'Submitting to Solana',
];

export function ProofGenerationOverlay({ onCancel }: { onCancel?: () => void }) {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      setElapsed(e);
      // Move through phases roughly linearly over 6 seconds
      setPhase(Math.min(PHASES.length - 1, Math.floor(e / 1.5)));
    }, 100);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-paper/85 backdrop-blur-[2px] flex items-center justify-center">
      <div className="bg-paper-deep border border-paper-rim shadow-2xl max-w-md w-full mx-4">
        <div className="px-8 py-10 space-y-6">
          {/* Lock icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-privacy flex items-center justify-center">
                <Lock className="w-8 h-8 text-privacy" strokeWidth={1.5} />
              </div>
              {/* Animated dashed border */}
              <div
                className="absolute inset-0 border-2 border-dashed border-privacy/40 animate-spin"
                style={{ animationDuration: '8s' }}
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="font-display text-2xl tracking-tight">Sealing your payment</div>
            <div className="text-sm text-ink-mute">
              Computing zero-knowledge proof so no one but you and the recipient can see the amount.
            </div>
          </div>

          {/* Phase status */}
          <div className="font-mono text-sm space-y-1.5">
            {PHASES.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 ${i < phase ? 'bg-privacy' : i === phase ? 'bg-privacy animate-cursor-blink' : 'bg-paper-rim'}`} />
                <span className={i <= phase ? 'text-ink' : 'text-ink-ghost'}>
                  {p}
                  {i === phase && <span className="inline-block w-2 h-3 ml-1 bg-ink animate-cursor-blink" />}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-1 bg-paper-rim relative overflow-hidden">
              <div
                className="h-full bg-privacy transition-[width] duration-100 ease-out"
                style={{ width: `${Math.min(95, (elapsed / 6) * 95)}%` }}
              />
            </div>
            <div className="flex justify-between text-eyebrow text-ink-mute">
              <span>Elapsed</span>
              <span className="font-mono tabular-nums">{elapsed.toFixed(1)}s</span>
            </div>
          </div>

          {onCancel && (
            <button onClick={onCancel} className="w-full text-xs text-ink-mute hover:text-ink underline underline-offset-2">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Settlement Receipt (the post-settle screen)

This is the moment the user sees their payment was successful. Make it satisfying.

```tsx
// components/settlement/SettlementReceipt.tsx
import { Receipt } from '@/components/receipt/Receipt';
import { ReceiptHeader } from '@/components/receipt/ReceiptHeader';
import { ReceiptLine } from '@/components/receipt/ReceiptLine';
import { motion } from 'motion/react'; // import 'motion' (the new framer-motion)

interface SettlementReceiptProps {
  to: string;
  amount: bigint;
  signature: string;
  groupName: string;
  timestamp: Date;
}

export function SettlementReceipt({ to, amount, signature, groupName, timestamp }: SettlementReceiptProps) {
  const usd = (Number(amount) / 1_000_000).toFixed(2);

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200 }}
      className="max-w-sm mx-auto"
    >
      <Receipt variant="sealed">
        <ReceiptHeader merchant="TAB" meta={`Settlement · ${timestamp.toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`} />

        <div className="space-y-1">
          <ReceiptLine label="Group" value={groupName} />
          <ReceiptLine label="To" value={to} />
          <ReceiptLine label="Amount" value={`$${usd}`} emphasis />
        </div>

        <div className="tear my-4" />

        <div className="space-y-1 text-xs text-ink-mute">
          <div className="flex justify-between">
            <span>Settlement type</span>
            <span className="font-mono">Umbra UTXO (shielded)</span>
          </div>
          <div className="flex justify-between">
            <span>Network</span>
            <span className="font-mono">Solana devnet</span>
          </div>
          <div className="flex justify-between">
            <span>Tx signature</span>
            <span className="font-mono">{signature.slice(0, 8)}…{signature.slice(-6)}</span>
          </div>
        </div>

        <div className="tear my-4" />

        <div className="text-center text-eyebrow text-ink-mute">
          Thank you for using Tab.
        </div>
      </Receipt>
    </motion.div>
  );
}
```

---

## Empty State

Nothing tells a hackathon judge "amateur build" faster than a blank screen with no expenses. Always have a designed empty state.

```tsx
// components/group/EmptyExpenses.tsx
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function EmptyExpenses({ groupId }: { groupId: string }) {
  return (
    <div className="py-20 text-center space-y-6 max-w-sm mx-auto">
      <div className="inline-block">
        {/* Stylized empty receipt SVG */}
        <svg width="72" height="96" viewBox="0 0 72 96" className="text-ink-ghost mx-auto">
          <rect x="8" y="8" width="56" height="80" fill="hsl(var(--paper-deep))" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="18" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="1" />
          <line x1="18" y1="38" x2="46" y2="38" stroke="currentColor" strokeWidth="1" />
          <line x1="18" y1="58" x2="54" y2="58" stroke="currentColor" strokeWidth="1" />
          <line x1="18" y1="68" x2="40" y2="68" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="space-y-2">
        <div className="font-display text-2xl tracking-tight">No expenses yet</div>
        <div className="text-ink-mute text-sm">
          Add your first shared expense — a dinner, a hotel, anything.
        </div>
      </div>
      <Link href={`/groups/${groupId}/add-expense`}>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-1.5" /> Add expense
        </Button>
      </Link>
    </div>
  );
}
```

---

## The full group detail page assembly

```tsx
// app/(app)/groups/[groupId]/page.tsx (client-fetched parts simplified)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Receipt } from '@/components/receipt/Receipt';
import { LedgerRow } from '@/components/group/LedgerRow';
import { EmptyExpenses } from '@/components/group/EmptyExpenses';
import { PrivacySeal } from '@/components/ui/PrivacySeal';

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  // Fetch group, members, debts, expenses...
  // (Hook into your API routes)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div className="space-y-3">
          <Link href="/groups" className="text-eyebrow text-ink-mute hover:text-ink">
            ← All groups
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">🍝</span>
            <h1 className="font-display text-4xl tracking-tight">Goa Trip 2026</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-mute">
            <span>4 members</span>
            <span>·</span>
            <span>$1,847.20 total</span>
            <PrivacySeal size="sm" label="Settlements shielded" />
          </div>
        </div>
        <Link href={`/groups/${params.groupId}/settings`}>
          <Button variant="ghost"><Settings className="w-4 h-4" /></Button>
        </Link>
      </header>

      {/* Ledger */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-eyebrow text-ink-mute">Who owes who</h2>
          <Link href={`/groups/${params.groupId}/add-expense`}>
            <Button variant="primary"><Plus className="w-4 h-4 mr-1.5" /> Add expense</Button>
          </Link>
        </div>

        <Receipt>
          {/* Ledger rows */}
          <LedgerRow
            from={{ handle: 'priya.sol', isYou: false }}
            to={{ handle: 'you', isYou: true }}
            amount={400_000_000n}
          />
          <LedgerRow
            from={{ handle: 'arjun.sol', isYou: false }}
            to={{ handle: 'you', isYou: true }}
            amount={400_000_000n}
          />
          <LedgerRow
            from={{ handle: 'you', isYou: true }}
            to={{ handle: 'rohan.sol', isYou: false }}
            amount={150_000_000n}
            onSettle={() => {/* trigger settle flow */}}
          />
        </Receipt>
      </section>

      {/* Activity */}
      <section className="space-y-4">
        <h2 className="text-eyebrow text-ink-mute">Activity</h2>
        {/* Activity feed list... */}
      </section>
    </div>
  );
}
```

---

## What this gets you

The components above are everything Tab needs to *look* like a real product. Not generic, not crypto-typical. The receipt motif gives you a unique visual identity that no other Frontier submission will have. Numbers in monospace, dashed perforations, the wax-seal "Private · Shielded" stamp — these are the screenshots that get retweeted.

If you have time on Day 4 to add **one more** detail: implement the **counter animation** on the ZK proof success screen using Motion's `useAnimate` hook to count from 0 to the settlement amount. It's a 30-minute task and it's the kind of detail judges remember.
