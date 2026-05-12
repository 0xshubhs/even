/**
 * Token configuration for settlements.
 *
 * The Umbra devnet relayer only supports a small set of mints. We pick one
 * here and the entire UI (labels, formatting, decimals) adapts.
 *
 * Note: when switching mints you MUST also update the conversion in the
 * `formatTokenAmount` / `tokenToBase` helpers, since decimals vary by mint.
 */

import {
  USDC_DEVNET_MINT,
  UMBRA_TEST_TOKEN_1,
  UMBRA_TEST_TOKEN_2,
  WRAPPED_SOL_MINT,
} from "./umbra/constants";

export interface TokenConfig {
  /** SPL mint address (base58). */
  mint: string;
  /** Token decimals as published by the mint. */
  decimals: number;
  /** Short symbol to display next to numbers, e.g. "SOL", "USDC". */
  symbol: string;
  /** Optional currency prefix shown before the amount (e.g. "$" for USDC). */
  prefix: string;
  /** Display name for help text. */
  name: string;
}

/**
 * The Umbra-supported devnet mints. Listed here so users can pick from a known-
 * good set without guessing.
 */
export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  [WRAPPED_SOL_MINT]: {
    mint: WRAPPED_SOL_MINT,
    decimals: 9,
    symbol: "SOL",
    prefix: "",
    name: "Wrapped SOL",
  },
  [UMBRA_TEST_TOKEN_1]: {
    mint: UMBRA_TEST_TOKEN_1,
    decimals: 6,
    symbol: "USDC",
    prefix: "$",
    name: "Umbra test token A",
  },
  [UMBRA_TEST_TOKEN_2]: {
    mint: UMBRA_TEST_TOKEN_2,
    decimals: 6,
    symbol: "USDC",
    prefix: "$",
    name: "Umbra test token B",
  },
};

/**
 * The active token. Reads from NEXT_PUBLIC_USDC_MINT (yes, the env var name is
 * historical) and falls back to wSOL. If the configured mint isn't in our
 * known-supported set, we still serve it but with neutral defaults.
 */
export const TOKEN: TokenConfig = (() => {
  const mint = USDC_DEVNET_MINT;
  const known = SUPPORTED_TOKENS[mint];
  if (known) return known;
  return { mint, decimals: 9, symbol: "TOKEN", prefix: "", name: "Custom token" };
})();

/** Convert a human-readable UI amount (e.g. `0.05`) into base units. */
export const tokenToBase = (uiAmount: number): bigint => {
  const factor = 10 ** TOKEN.decimals;
  return BigInt(Math.round(uiAmount * factor));
};

/** Convert base units back to a UI number. */
export const baseToToken = (base: bigint): number => {
  const factor = 10 ** TOKEN.decimals;
  return Number(base) / factor;
};

/** Pretty-print a token amount with the configured symbol. */
export function formatToken(base: bigint, opts?: { signed?: boolean; decimals?: number }): string {
  const abs = base < 0n ? -base : base;
  const n = baseToToken(abs);
  const sign = opts?.signed ? (base < 0n ? "-" : base > 0n ? "+" : "") : "";
  const dp = opts?.decimals ?? (TOKEN.decimals >= 9 ? 4 : 2);
  return `${sign}${TOKEN.prefix}${n.toFixed(dp)} ${TOKEN.symbol}`.trim();
}
