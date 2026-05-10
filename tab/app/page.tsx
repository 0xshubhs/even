import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Receipt } from "@/components/receipt/Receipt";
import { ReceiptHeader } from "@/components/receipt/ReceiptHeader";
import { ReceiptLine } from "@/components/receipt/ReceiptLine";
import { PrivacySeal } from "@/components/ui/PrivacySeal";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export default function LandingPage() {
  return (
    <>
      <AppHeader />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Hero copy */}
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="eyebrow text-ink-mute">Tab — Splitwise for crypto</div>
              <h1 className="font-display tracking-tight text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-semibold">
                Split anything.
                <br />
                Settle privately.
              </h1>
            </div>

            <p className="text-lg text-ink-soft max-w-md leading-relaxed">
              The shared-expenses app for crypto. Settle in stablecoins on Solana, with payments
              shielded so your friends don&rsquo;t see your wallet history.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <ConnectButton />
              <Link href="/groups">
                <Button variant="paper">View groups →</Button>
              </Link>
            </div>

            <div className="tear pt-4 mt-4" />

            <div className="grid grid-cols-3 gap-4 max-w-md">
              <Stat label="Network" value="Solana" />
              <Stat label="Settlement" value="USDC" />
              <Stat label="Privacy" value="Umbra" />
            </div>
          </div>

          {/* Sample receipt */}
          <div className="md:pt-8">
            <Receipt variant="sealed">
              <ReceiptHeader merchant="TAB" meta="Settlement · Demo" />
              <div className="space-y-1">
                <ReceiptLine label="Group" value="Goa Trip 2026" />
                <ReceiptLine label="To" value="alice.sol" />
                <ReceiptLine label="Amount" value="$400.00" emphasis />
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
                  <span className="font-mono">5K9p…aB2R</span>
                </div>
              </div>
              <div className="tear my-4" />
              <div className="text-center eyebrow text-ink-mute">Thank you for using Tab.</div>
            </Receipt>

            <div className="flex justify-center mt-6">
              <PrivacySeal label="Settlements shielded by default" size="sm" />
            </div>
          </div>
        </div>

        {/* Three-up feature row */}
        <div className="mt-24 md:mt-32 grid md:grid-cols-3 gap-8">
          <Feature
            eyebrow="Step 01"
            title="Track shared expenses"
            body="Create a group for any reason — a trip, an apartment, a coworker birthday gift — and log who paid for what."
          />
          <Feature
            eyebrow="Step 02"
            title="See who owes who"
            body="Tab simplifies the debt graph automatically — at most n−1 settlements clear the entire group."
          />
          <Feature
            eyebrow="Step 03"
            title="Settle, shielded"
            body="One tap creates a shielded UTXO on Solana. Your friend sees the debt cleared, not your wallet history."
          />
        </div>

        <div className="tear mt-24" />
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-mute font-mono">
          <span>© Tab — built for Solana Frontier 2026</span>
          <span>Devnet · USDC · Umbra Privacy</span>
        </footer>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow text-ink-mute">{label}</div>
      <div className="font-mono text-base mt-1">{value}</div>
    </div>
  );
}

function Feature({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="space-y-3">
      <div className="eyebrow text-ink-mute">{eyebrow}</div>
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
    </div>
  );
}
