import { Connection, PublicKey } from "@solana/web3.js";
import {
  getDomainKeySync,
  getPrimaryDomain,
  resolve,
  reverseLookup,
} from "@bonfida/spl-name-service";

/**
 * SNS only lives on mainnet, even when settlements happen on devnet.
 *
 * `api.mainnet-beta.solana.com` rate-limits `getMultipleAccountsInfo` (used
 * internally by `resolve`) hard enough that lookups fail with HTTP 429, so we
 * pin to publicnode, which serves SNS lookups without throttling.
 */
export const SNS_RPC_URL = "https://solana-rpc.publicnode.com";

let cachedConnection: Connection | null = null;
function getConn() {
  if (!cachedConnection) cachedConnection = new Connection(SNS_RPC_URL, "confirmed");
  return cachedConnection;
}

/**
 * Resolve `alice.sol` (or `alice`) to a base58 wallet pubkey, or `null` if the
 * domain doesn't exist / can't be resolved.
 */
export async function resolveSnsHandle(handle: string): Promise<string | null> {
  const trimmed = handle.trim().replace(/^@/, "").replace(/\.sol$/i, "");
  if (!trimmed) return null;
  try {
    const owner = await resolve(getConn(), trimmed);
    return owner.toBase58();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("SNS resolve failed:", trimmed, err);
    }
    return null;
  }
}

/**
 * Reverse-lookup a wallet's primary SNS handle, returning "alice.sol" or null.
 */
export async function reverseLookupSnsHandle(wallet: string): Promise<string | null> {
  try {
    const owner = new PublicKey(wallet);
    const primary = await getPrimaryDomain(getConn(), owner);
    if (primary && primary.reverse) return `${primary.reverse}.sol`;
  } catch {
    // fall through to manual reverse below
  }
  try {
    const { pubkey } = getDomainKeySync(wallet);
    const name = await reverseLookup(getConn(), pubkey);
    return name ? `${name}.sol` : null;
  } catch {
    return null;
  }
}

/** "JL5...XYZ" → quick visual fingerprint of a base58 address. */
export function looksLikeWalletAddress(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
}
