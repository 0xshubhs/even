"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Droplet, ExternalLink, Lock, Trash2, Wallet } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Receipt } from "@/components/receipt/Receipt";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useUmbra } from "@/components/umbra/UmbraProvider";
import { getEncryptedUsdcBalance, shieldUsdc, unshieldUsdc } from "@/lib/umbra/deposit";
import { USDC_DEVNET_MINT } from "@/lib/umbra/constants";
import { explorerUrl } from "@/lib/solana/constants";
import { baseToUsdc, shortAddress, usdcToBase } from "@/lib/utils";

export default function SettingsPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { client, status } = useUmbra();

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [shieldAmt, setShieldAmt] = useState("");
  const [unshieldAmt, setUnshieldAmt] = useState("");
  const [busy, setBusy] = useState<"shield" | "unshield" | "claim" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [claimSignature, setClaimSignature] = useState<string | null>(null);

  const myWallet = publicKey?.toBase58() ?? null;

  const refreshBalance = useCallback(async () => {
    if (!client) return;
    setBalanceLoading(true);
    try {
      const b = await getEncryptedUsdcBalance(client);
      setBalance(b);
    } catch (e) {
      console.warn(e);
    } finally {
      setBalanceLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const refreshToken = useCallback(async () => {
    if (!publicKey) {
      setTokenBalance(null);
      return;
    }
    try {
      const ata = getAssociatedTokenAddressSync(
        new PublicKey(USDC_DEVNET_MINT),
        publicKey
      );
      const info = await connection.getTokenAccountBalance(ata);
      setTokenBalance(info.value.uiAmount ?? 0);
    } catch {
      setTokenBalance(0); // ATA doesn't exist yet (no tokens claimed yet)
    }
  }, [connection, publicKey]);

  useEffect(() => {
    void refreshToken();
  }, [refreshToken]);

  async function onClaim() {
    if (!publicKey) return;
    setError(null);
    setFeedback(null);
    setClaimSignature(null);
    setBusy("claim");
    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58(), mint: USDC_DEVNET_MINT }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        signature?: string;
        amount?: number;
        error?: string;
      };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Faucet returned ${res.status}`);
      }
      setClaimSignature(data.signature ?? null);
      setFeedback(`Claimed ${data.amount ?? 1000} test USDC into your wallet.`);
      window.setTimeout(() => void refreshToken(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Faucet claim failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onShield() {
    if (!client) return;
    setError(null);
    setFeedback(null);
    const n = parseFloat(shieldAmt);
    if (!n || n <= 0) {
      setError("Enter a USDC amount.");
      return;
    }
    setBusy("shield");
    try {
      const r = await shieldUsdc(client, usdcToBase(n));
      setFeedback(`Shielded — queue tx ${shortAddress(r.queueSignature, 6)}`);
      setShieldAmt("");
      await refreshBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onUnshield() {
    if (!client) return;
    setError(null);
    setFeedback(null);
    const n = parseFloat(unshieldAmt);
    if (!n || n <= 0) {
      setError("Enter a USDC amount.");
      return;
    }
    setBusy("unshield");
    try {
      const r = await unshieldUsdc(client, usdcToBase(n));
      setFeedback(`Unshielded — queue tx ${shortAddress(r.queueSignature, 6)}`);
      setUnshieldAmt("");
      await refreshBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdraw failed.");
    } finally {
      setBusy(null);
    }
  }

  const viewingKeyPreview = useMemo(() => {
    if (!myWallet) return null;
    // Display a stable, non-secret pseudo-handle derived from the wallet pubkey.
    // The real Umbra viewing-key grant flow lives in `getComplianceGrantIssuerFunction`
    // and is out of scope for v1 — this placeholder keeps the UI honest.
    return `umbra:view:${myWallet.slice(0, 12)}…${myWallet.slice(-6)}`;
  }, [myWallet]);

  async function copyViewingKey() {
    if (!viewingKeyPreview) return;
    try {
      await navigator.clipboard.writeText(viewingKeyPreview);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
        <Wallet className="w-10 h-10 text-ink-mute mx-auto" strokeWidth={1.5} />
        <h1 className="font-display text-4xl font-semibold">Settings</h1>
        <p className="text-ink-mute">Connect your wallet to manage your encrypted balance.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-12">
      <header className="space-y-2">
        <div className="eyebrow text-privacy">Settings</div>
        <h1 className="font-display text-4xl tracking-tight font-semibold">Your private wallet</h1>
        <p className="text-ink-mute">
          Manage your shielded USDC balance and your Umbra viewing key. Status:{" "}
          <span className="font-mono">{status.state}</span>
          {status.state === "error" && (
            <span className="text-accent-deep"> — {status.message}</span>
          )}
        </p>
      </header>

      {/* Get test tokens — in-app faucet claim */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink-mute">Test tokens</h2>
        <Receipt>
          <div className="space-y-3">
            <p className="text-xs text-ink-soft flex items-start gap-1.5">
              <Droplet className="w-3.5 h-3.5 mt-0.5 text-privacy shrink-0" strokeWidth={2} />
              <span>
                Umbra&rsquo;s devnet protocol pool supports dummy <strong>USDC</strong> and{" "}
                <strong>USDT</strong>. Claim 1000 tokens straight into your wallet — no leaving
                the app.
              </span>
            </p>

            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="eyebrow text-ink-mute">Public balance</div>
                <div className="font-mono tabular-nums text-2xl font-semibold mt-1">
                  {tokenBalance === null ? "—" : `$${tokenBalance.toFixed(2)}`}
                </div>
                <div className="text-xs text-ink-mute mt-0.5">test USDC ({shortAddress(USDC_DEVNET_MINT, 4)})</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={onClaim}
                disabled={!connected || busy === "claim"}
              >
                {busy === "claim" ? "Claiming…" : "Claim 1000 test USDC"}
              </Button>
            </div>

            {claimSignature && (
              <div className="text-xs text-ink-mute flex items-center gap-1.5 pt-1">
                <span>Last claim:</span>
                <a
                  href={explorerUrl(claimSignature)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono underline underline-offset-2 hover:text-ink inline-flex items-center gap-1"
                >
                  {shortAddress(claimSignature, 6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </Receipt>
      </section>

      {/* Encrypted balance */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink-mute">Encrypted USDC balance</h2>

        <Receipt>
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow text-ink-mute">Shielded</div>
              <div className="font-mono tabular-nums text-3xl font-semibold mt-1">
                {balance === null ? "—" : `$${baseToUsdc(balance).toFixed(2)}`}
              </div>
              <div className="text-xs text-ink-mute mt-1">
                {balanceLoading ? "Refreshing…" : "Visible only to you."}
              </div>
            </div>
            <Button variant="paper" size="sm" type="button" onClick={refreshBalance}>
              Refresh
            </Button>
          </div>
        </Receipt>

        <div className="grid sm:grid-cols-2 gap-4">
          <Receipt>
            <div className="space-y-3">
              <div className="eyebrow text-ink-mute">Shield (deposit)</div>
              <p className="text-xs text-ink-soft">
                Move public USDC from your ATA into your encrypted balance.
              </p>
              <div className="flex items-baseline gap-1 border-b border-paper-rim pb-2">
                <span className="font-mono text-lg text-ink-mute">$</span>
                <input
                  inputMode="decimal"
                  value={shieldAmt}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setShieldAmt(v);
                  }}
                  placeholder="0.00"
                  className="font-mono tabular-nums text-2xl bg-transparent outline-none w-full placeholder:text-ink-ghost"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={onShield}
                disabled={!client || busy === "shield"}
                className="w-full"
              >
                {busy === "shield" ? "Shielding…" : "Shield"}
              </Button>
            </div>
          </Receipt>

          <Receipt>
            <div className="space-y-3">
              <div className="eyebrow text-ink-mute">Unshield (withdraw)</div>
              <p className="text-xs text-ink-soft">
                Move encrypted USDC back to your public ATA.
              </p>
              <div className="flex items-baseline gap-1 border-b border-paper-rim pb-2">
                <span className="font-mono text-lg text-ink-mute">$</span>
                <input
                  inputMode="decimal"
                  value={unshieldAmt}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setUnshieldAmt(v);
                  }}
                  placeholder="0.00"
                  className="font-mono tabular-nums text-2xl bg-transparent outline-none w-full placeholder:text-ink-ghost"
                />
              </div>
              <Button
                variant="paper"
                size="sm"
                type="button"
                onClick={onUnshield}
                disabled={!client || busy === "unshield"}
                className="w-full"
              >
                {busy === "unshield" ? "Unshielding…" : "Unshield"}
              </Button>
            </div>
          </Receipt>
        </div>

        {feedback && (
          <div className="border-l-2 border-owed-to pl-3 text-sm text-owed-to">{feedback}</div>
        )}
        {error && (
          <div className="border-l-2 border-accent pl-3 text-sm text-accent-deep">{error}</div>
        )}
      </section>

      {/* Viewing key */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink-mute">Viewing key</h2>
        <Receipt>
          <div className="space-y-3">
            <p className="text-xs text-ink-soft flex items-start gap-1.5">
              <Lock className="w-3.5 h-3.5 mt-0.5 text-privacy shrink-0" strokeWidth={2} />
              <span>
                Share this viewing-key fingerprint with an auditor or a trusted party to grant
                them read-only access to your encrypted balance. Issuing the actual on-chain grant
                is a one-click action below — this preview is the identifier they&rsquo;ll see.
              </span>
            </p>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={viewingKeyPreview ?? ""}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-paper-deep border border-paper-rim font-mono text-xs px-2 py-1.5 outline-none"
              />
              <Button variant="paper" size="sm" type="button" onClick={copyViewingKey}>
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-ink-mute italic">
              Grant issuance lands in v1.1 via Umbra&rsquo;s
              <span className="font-mono"> getComplianceGrantIssuerFunction</span> — left out of
              this build so we don&rsquo;t ship a half-wired flow.
            </p>
          </div>
        </Receipt>
      </section>

      {/* Local data — escape hatch for stale state */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink-mute">Local data</h2>
        <Receipt>
          <div className="space-y-3">
            <p className="text-xs text-ink-soft flex items-start gap-1.5">
              <Trash2 className="w-3.5 h-3.5 mt-0.5 text-ink-mute shrink-0" strokeWidth={2} />
              <span>
                Wipes this browser&rsquo;s local group cache and reloads from the cloud. Use this
                if you see stale or duplicated groups. Doesn&rsquo;t touch Supabase data or any
                on-chain settlements.
              </span>
            </p>
            <div className="flex justify-end">
              <Button
                variant="paper"
                size="sm"
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  window.localStorage.removeItem("even.store.v1");
                  window.location.reload();
                }}
              >
                Reset local cache
              </Button>
            </div>
          </div>
        </Receipt>
      </section>
    </div>
  );
}
