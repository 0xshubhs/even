import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(addr: string, chars = 4) {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

/** USDC has 6 decimals on Solana. */
export const usdcToBase = (uiAmount: number): bigint =>
  BigInt(Math.round(uiAmount * 1_000_000));

export const baseToUsdc = (base: bigint): number =>
  Number(base) / 1_000_000;

export function formatUsd(base: bigint, opts?: { signed?: boolean }): string {
  const n = baseToUsdc(base < 0n ? -base : base);
  const sign = opts?.signed ? (base < 0n ? "-" : base > 0n ? "+" : "") : "";
  return `${sign}$${n.toFixed(2)}`;
}
