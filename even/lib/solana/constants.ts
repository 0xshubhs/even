/**
 * Solana cluster + Explorer config. Hardcoded for devnet; the wallet adapter
 * + Umbra SDK all share these endpoints. Helius API key in the RPC URL — swap
 * it when forking.
 */

export const SOLANA_NETWORK = "devnet" as const;

export const RPC_URL =
  "https://devnet.helius-rpc.com/?api-key=9e1ddbc7-d3d7-43a3-aa90-65cf69f92d04";

/** Default token mint shown in /settings (Umbra dummy USDC, 6 decimals). */
export const USDC_MINT = "4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7";

export const EXPLORER_BASE = "https://explorer.solana.com";

export function explorerUrl(signatureOrAddress: string, kind: "tx" | "address" = "tx") {
  const cluster = SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `${EXPLORER_BASE}/${kind === "tx" ? "tx" : "address"}/${signatureOrAddress}${cluster}`;
}
