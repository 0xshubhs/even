import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TOKEN, baseToToken, formatToken, tokenToBase } from "./token-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(addr: string, chars = 4) {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

/**
 * Settlement-token helpers. The legacy names (`usdcToBase`, `baseToUsdc`,
 * `formatUsd`) are kept as aliases so existing callers compile; new code
 * should prefer `tokenToBase` / `baseToToken` / `formatToken` directly.
 */
export const usdcToBase = tokenToBase;
export const baseToUsdc = baseToToken;
export const formatUsd = formatToken;

/** Display the configured token symbol (e.g. "SOL", "USDC"). */
export const TOKEN_SYMBOL = TOKEN.symbol;
export const TOKEN_PREFIX = TOKEN.prefix;
