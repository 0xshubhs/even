"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  buildUmbraClientFromWallet,
  buildUmbraClientInMemory,
  type UmbraClient,
} from "@/lib/umbra/client";
import { ensureRegistered } from "@/lib/umbra/register";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() + "n" : x));
  } catch {
    return String(v);
  }
}

type Status =
  | { state: "idle" }
  | { state: "connecting" }
  | { state: "registering" }
  | { state: "ready" }
  | { state: "error"; message: string };

interface UmbraContextValue {
  client: UmbraClient | null;
  status: Status;
  /** Triggers a fresh build + registration sweep. */
  reconnect: () => Promise<void>;
  /**
   * Build a client without a connected browser wallet (for demos/local dev).
   * Uses an in-memory keypair signer.
   */
  useInMemoryClient: () => Promise<void>;
}

const UmbraContext = createContext<UmbraContextValue>({
  client: null,
  status: { state: "idle" },
  reconnect: async () => {},
  useInMemoryClient: async () => {},
});

export function UmbraProvider({ children }: { children: ReactNode }) {
  const { wallet, publicKey, connected } = useWallet();
  const [client, setClient] = useState<UmbraClient | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const buildIdRef = useRef(0);

  const buildFromConnectedWallet = useCallback(async () => {
    const myBuildId = ++buildIdRef.current;
    if (!connected || !wallet || !publicKey) {
      setClient(null);
      setStatus({ state: "idle" });
      return;
    }
    setStatus({ state: "connecting" });
    try {
      const adapter = wallet.adapter as unknown as {
        wallet?: Wallet & { accounts?: readonly WalletAccount[] };
      };
      const standardWallet = adapter.wallet;
      if (!standardWallet || !standardWallet.accounts?.length) {
        throw new Error(
          "Wallet does not expose Wallet Standard accounts. Try Phantom or Solflare."
        );
      }
      // CRITICAL: pick the account whose address matches the connected
      // `publicKey` — Phantom can expose multiple accounts and `accounts[0]`
      // is not always the one the user actually authorized. Signing with the
      // wrong account yields "Transaction did not pass signature verification".
      const connectedAddress = publicKey.toBase58();
      const account =
        standardWallet.accounts.find((a) => a.address === connectedAddress) ??
        standardWallet.accounts[0];
      if (account.address !== connectedAddress) {
        console.warn(
          `Umbra: connected wallet ${connectedAddress} not found in wallet.accounts; falling back to ${account.address}. Settlement signatures may fail.`
        );
      }
      const c = await buildUmbraClientFromWallet(standardWallet, account);
      if (myBuildId !== buildIdRef.current) return;
      setStatus({ state: "registering" });
      await ensureRegistered(c).catch((err) => {
        // Walk the error chain so we actually see what failed — JSON.stringify
        // hides `cause`. Common cases: devnet RPC throttling, Phantom rejection,
        // simulation failure with on-chain logs.
        const chain: string[] = [];
        let cur: unknown = err;
        while (cur && chain.length < 8) {
          const e = cur as { name?: string; message?: string; cause?: unknown; context?: unknown; code?: unknown };
          chain.push(
            `[${e.name ?? "Error"}] ${e.message ?? "(no message)"}` +
              (e.code !== undefined ? ` · code=${String(e.code)}` : "") +
              (e.context ? ` · context=${safeJson(e.context).slice(0, 300)}` : "")
          );
          cur = e.cause;
        }
        const looksRpc = chain.some((m) => /unexpected error|-32603|429|too many|throttl/i.test(m));
        console.warn(
          looksRpc
            ? "Umbra registration deferred (devnet RPC throttling). Try a different RPC."
            : "Umbra registration failed:",
          "\n  " + chain.join("\n  ")
        );
      });
      if (myBuildId !== buildIdRef.current) return;
      setClient(c);
      setStatus({ state: "ready" });
    } catch (err) {
      if (myBuildId !== buildIdRef.current) return;
      const message = err instanceof Error ? err.message : "Failed to build Umbra client";
      setClient(null);
      setStatus({ state: "error", message });
    }
  }, [connected, wallet, publicKey]);

  const useInMemoryClient = useCallback(async () => {
    const myBuildId = ++buildIdRef.current;
    setStatus({ state: "connecting" });
    try {
      const c = await buildUmbraClientInMemory();
      if (myBuildId !== buildIdRef.current) return;
      setClient(c);
      setStatus({ state: "ready" });
    } catch (err) {
      if (myBuildId !== buildIdRef.current) return;
      const message = err instanceof Error ? err.message : "Failed to build Umbra client";
      setClient(null);
      setStatus({ state: "error", message });
    }
  }, []);

  useEffect(() => {
    void buildFromConnectedWallet();
  }, [buildFromConnectedWallet]);

  const value = useMemo<UmbraContextValue>(
    () => ({ client, status, reconnect: buildFromConnectedWallet, useInMemoryClient }),
    [client, status, buildFromConnectedWallet, useInMemoryClient]
  );

  return <UmbraContext.Provider value={value}>{children}</UmbraContext.Provider>;
}

export function useUmbra() {
  return useContext(UmbraContext);
}
