"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useGroupStore } from "@/lib/store/group-store";
import { shortAddress } from "@/lib/utils";

export function AppHeader() {
  const { publicKey, connected } = useWallet();
  const { setCurrentUserWallet } = useGroupStore();

  useEffect(() => {
    setCurrentUserWallet(connected && publicKey ? publicKey.toBase58() : null);
  }, [connected, publicKey, setCurrentUserWallet]);

  return (
    <header className="border-b border-paper-rim bg-paper/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight font-semibold">
          Tab
        </Link>

        <nav className="flex items-center gap-4">
          {connected && (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-ink-soft hover:text-ink transition-colors hidden sm:inline"
              >
                Dashboard
              </Link>
              <Link
                href="/groups"
                className="text-sm text-ink-soft hover:text-ink transition-colors hidden sm:inline"
              >
                Groups
              </Link>
            </>
          )}
          {publicKey && (
            <span className="hidden md:inline font-mono text-xs text-ink-mute">
              {shortAddress(publicKey.toBase58())}
            </span>
          )}
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
