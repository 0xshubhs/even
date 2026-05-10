import { clusterApiUrl } from "@solana/web3.js";

export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
  "devnet") as "devnet" | "mainnet-beta" | "testnet";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT ||
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

export const EXPLORER_BASE = "https://explorer.solana.com";

export function explorerUrl(signatureOrAddress: string, kind: "tx" | "address" = "tx") {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `${EXPLORER_BASE}/${kind === "tx" ? "tx" : "address"}/${signatureOrAddress}${cluster}`;
}
