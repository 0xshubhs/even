# 01 — Umbra Integration Cheatsheet

All code below uses the **real** `@umbra-privacy/sdk` v3.x API (verified from docs at sdk.umbraprivacy.com).

## Install

```bash
pnpm add @umbra-privacy/sdk @umbra-privacy/web-zk-prover
pnpm add @solana/wallet-adapter-react @solana/wallet-adapter-base @solana/wallet-adapter-wallets @solana/wallet-adapter-react-ui
```

## Devnet constants

```ts
// lib/umbra/constants.ts
export const UMBRA_NETWORK = "devnet" as const;
export const UMBRA_RPC_URL = "https://api.devnet.solana.com";
export const UMBRA_RPC_WSS_URL = "wss://api.devnet.solana.com";
export const UMBRA_INDEXER_URL = "https://utxo-indexer.api-devnet.umbraprivacy.com";
export const UMBRA_RELAYER_URL = "https://relayer.api-devnet.umbraprivacy.com";

// Devnet USDC mint — verify on https://spl-token-faucet.com/?token-name=USDC-Dev
export const USDC_DEVNET_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// USDC has 6 decimals; convert UI amounts with this helper:
export const usdcToBase = (uiAmount: number): bigint =>
  BigInt(Math.round(uiAmount * 1_000_000));
export const baseToUsdc = (base: bigint): number =>
  Number(base) / 1_000_000;
```

## 1. Build the Umbra client (browser, Phantom-backed)

```ts
// lib/umbra/client.ts
import { createSignerFromWalletAccount, getUmbraClient } from "@umbra-privacy/sdk";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  UMBRA_NETWORK,
  UMBRA_RPC_URL,
  UMBRA_RPC_WSS_URL,
  UMBRA_INDEXER_URL,
} from "./constants";

export async function buildUmbraClient(wallet: Wallet, account: WalletAccount) {
  const signer = createSignerFromWalletAccount(wallet, account);
  return await getUmbraClient({
    signer,
    network: UMBRA_NETWORK,
    rpcUrl: UMBRA_RPC_URL,
    rpcSubscriptionsUrl: UMBRA_RPC_WSS_URL,
    indexerApiEndpoint: UMBRA_INDEXER_URL,
  });
}
```

The first action that needs the master seed (`register()` or `deposit()`) will trigger a `signMessage` prompt in Phantom. Subsequent actions reuse the cached seed.

## 2. Registration (idempotent, one-time setup per wallet)

```ts
// lib/umbra/register.ts
import { getUserRegistrationFunction, getUserAccountQuerierFunction } from "@umbra-privacy/sdk";

export async function ensureRegistered(client: Awaited<ReturnType<typeof import("./client").buildUmbraClient>>) {
  const query = getUserAccountQuerierFunction({ client });
  const account = await query(client.signer.address).catch(() => null);
  if (account?.isRegistered) return; // skip if already registered

  const register = getUserRegistrationFunction({ client });
  const signatures = await register({
    confidential: true, // enables encrypted balances
    anonymous: true,    // enables mixer/UTXOs
  });
  console.log(`Registered with ${signatures.length} tx(s)`);
}
```

> **Cost note:** `register()` is on-chain and costs SOL. Make sure the user has devnet SOL — link to https://faucet.solana.com from the UI.

## 3. Shield: deposit USDC into encrypted balance

This is what happens before a user can pay anyone — they need an encrypted balance to draw from. (For Tab, you actually skip this and do "public-balance → receiver-claimable UTXO" directly, see step 4. But you might still want this for Power Users who want to pre-shield.)

```ts
// lib/umbra/deposit.ts
import { getPublicBalanceToEncryptedBalanceDirectDepositorFunction } from "@umbra-privacy/sdk";
import { USDC_DEVNET_MINT } from "./constants";

export async function shieldUsdc(
  client: any,
  amountBase: bigint,
) {
  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
  const result = await deposit(
    client.signer.address,    // depositing to your own encrypted account
    USDC_DEVNET_MINT,
    amountBase,
  );
  return {
    queueSignature: result.queueSignature,
    callbackSignature: result.callbackSignature,
  };
}
```

## 4. Settle (the core mechanic): public USDC → recipient's shielded inbox

This is the **primary flow Tab uses for "Settle up."** The debtor sends from their public USDC balance directly into a receiver-claimable UTXO. The recipient claims later. No on-chain link between sender and recipient address.

```ts
// lib/umbra/settle.ts
import { getPublicBalanceToReceiverClaimableUtxoCreatorFunction } from "@umbra-privacy/sdk";
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from "@umbra-privacy/web-zk-prover";
import { USDC_DEVNET_MINT } from "./constants";

let cachedZkProver: ReturnType<typeof getCreateReceiverClaimableUtxoFromPublicBalanceProver> | null = null;
function getProver() {
  if (!cachedZkProver) {
    cachedZkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  }
  return cachedZkProver;
}

export async function settleDebt(
  client: any,
  recipientWallet: string, // the .sol-resolved wallet address
  amountBase: bigint,
): Promise<{ signatures: string[] }> {
  const zkProver = getProver();
  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver },
  );

  const signatures = await createUtxo({
    destinationAddress: recipientWallet,
    mint: USDC_DEVNET_MINT,
    amount: amountBase,
  });

  return { signatures };
}
```

**Important UX detail:** ZK proof generation takes 2-8 seconds in the browser. Show a clear loading state: *"Generating privacy proof... ~5s"*. This is the moment users will think the app froze.

## 5. Recipient: scan + claim

When the recipient opens the app, scan for UTXOs addressed to their X25519 key.

```ts
// lib/umbra/scan.ts
import { getClaimableUtxoScannerFunction } from "@umbra-privacy/sdk";

export async function scanForUtxos(client: any, lastSeenIndex = 0) {
  const fetchUtxos = getClaimableUtxoScannerFunction({ client });
  // Tree 0 from the start — pass last seen index to resume
  const result = await fetchUtxos(0, lastSeenIndex);
  return result.received; // array of receiver-claimable UTXOs for this wallet
}
```

Run this on app mount + every 15 seconds while group detail is open. Cache `lastSeenIndex` per-user in localStorage to avoid re-scanning the entire tree.

```ts
// lib/umbra/claim.ts
import {
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getUmbraRelayer,
} from "@umbra-privacy/sdk";
import { getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver } from "@umbra-privacy/web-zk-prover";
import { UMBRA_RELAYER_URL } from "./constants";

let cachedClaimProver: any = null;
function getClaimProver() {
  if (!cachedClaimProver) {
    cachedClaimProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
  }
  return cachedClaimProver;
}

export async function claimUtxos(client: any, utxos: any[]) {
  const zkProver = getClaimProver();
  const relayer = getUmbraRelayer({ apiEndpoint: UMBRA_RELAYER_URL });
  const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { zkProver, relayer },
  );
  return await claim(utxos);
}
```

The relayer pays the SOL transaction fee for the claim — this means a recipient can claim funds even with zero SOL in their wallet. Mention this in the demo. ("Alice can settle to Bob even if Bob's wallet is empty.")

## 6. Withdraw (optional, for completeness)

If a user wants to off-ramp encrypted balance back to a public wallet:

```ts
// lib/umbra/withdraw.ts
import { getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction } from "@umbra-privacy/sdk";
import { USDC_DEVNET_MINT } from "./constants";

export async function unshieldUsdc(client: any, amountBase: bigint) {
  const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
  return await withdraw(
    client.signer.address,
    USDC_DEVNET_MINT,
    amountBase,
  );
}
```

## React provider pattern

Keep the Umbra client at the layout level so it persists across navigations.

```tsx
// components/umbra/UmbraProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { buildUmbraClient } from "@/lib/umbra/client";
import { ensureRegistered } from "@/lib/umbra/register";

const UmbraContext = createContext<{
  client: any | null;
  isRegistering: boolean;
  isReady: boolean;
}>({ client: null, isRegistering: false, isReady: false });

export function UmbraProvider({ children }: { children: React.ReactNode }) {
  const { wallet, publicKey, connected } = useWallet();
  const [client, setClient] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!connected || !wallet || !publicKey) {
      setClient(null);
      return;
    }
    let cancelled = false;
    (async () => {
      // Build client. NOTE: wallet-adapter-react gives you an Adapter; you'll
      // need to bridge to the Wallet Standard interface that Umbra wants.
      // See SDK wallet-adapters docs; Phantom and Solflare both support
      // Wallet Standard so this works via the wallet's account directly.
      const adapter: any = wallet.adapter;
      const account = adapter.wallet?.accounts?.[0];
      if (!account) return;
      const c = await buildUmbraClient(adapter.wallet, account);
      if (cancelled) return;
      setIsRegistering(true);
      await ensureRegistered(c);
      setIsRegistering(false);
      setClient(c);
    })();
    return () => { cancelled = true; };
  }, [connected, wallet, publicKey]);

  return (
    <UmbraContext.Provider value={{ client, isRegistering, isReady: !!client && !isRegistering }}>
      {children}
    </UmbraContext.Provider>
  );
}

export const useUmbra = () => useContext(UmbraContext);
```

> **Bridge gotcha:** wallet-adapter-react exposes `Adapter` but Umbra wants Wallet Standard's `Wallet` + `WalletAccount`. Most modern wallets (Phantom, Solflare) implement Wallet Standard, so `adapter.wallet` and `adapter.wallet.accounts[0]` give you what you need. If your wallet adapter version doesn't, fall back to `createInMemorySigner` for testing and document the production gap.

## Common pitfalls

1. **Branded types.** `amount` is a `U64` (branded `bigint`). Don't pass a plain `number`; use `BigInt()` or use the `usdcToBase` helper.
2. **Recipient must be registered.** If recipient hasn't called `register()`, the UTXO will still be created but they can't claim it. Show the recipient a "Set up your private inbox" CTA the first time they sign in.
3. **Tree index.** The mixer has multiple trees (1M leaves each). For Tab v1, hardcode tree 0. Document this as a v2 concern.
4. **Devnet vs mainnet program IDs.** SDK auto-resolves based on `network` param — don't hardcode.
5. **Web ZK prover bundle size.** It's ~few MB. Ensure your Next.js config doesn't tree-shake it. Test in production build (`pnpm build && pnpm start`).
