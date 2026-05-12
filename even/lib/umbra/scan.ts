import { getClaimableUtxoScannerFunction } from "@umbra-privacy/sdk";
import { SCAN_TREE_INDEX } from "./constants";
import type { IUmbraClient, ScannedUtxoData } from "./types";

export interface ScanResult {
  /** UTXOs sent to this wallet that they can claim into encrypted balance. */
  received: ScannedUtxoData[];
  publicReceived: ScannedUtxoData[];
  /** UTXOs the user deposited themselves and can withdraw. */
  selfBurnable: ScannedUtxoData[];
  publicSelfBurnable: ScannedUtxoData[];
}

/**
 * Scan the mixer tree for UTXOs addressed to this wallet's X25519 key.
 * Pass `lastSeenIndex` to resume scanning from where we left off.
 *
 * The SDK's scanner currently throws "can't convert BigInt to number" on
 * empty / fresh trees (internal `Number(BigInt)` call). We swallow that
 * specific error and return an empty result — there's nothing to claim.
 */
export async function scanForUtxos(
  client: IUmbraClient,
  lastSeenIndex = 0
): Promise<ScanResult> {
  const fetchUtxos = getClaimableUtxoScannerFunction({ client });
  try {
    const result = await fetchUtxos(
      SCAN_TREE_INDEX as never,
      lastSeenIndex as never
    );
    return {
      received: [...result.received],
      publicReceived: [...result.publicReceived],
      selfBurnable: [...result.selfBurnable],
      publicSelfBurnable: [...result.publicSelfBurnable],
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("BigInt") || msg.includes("convert")) {
      return { received: [], publicReceived: [], selfBurnable: [], publicSelfBurnable: [] };
    }
    throw e;
  }
}

const STORAGE_KEY_PREFIX = "even.umbra.lastSeenIndex.";

export function loadLastSeenIndex(walletAddress: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + walletAddress);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveLastSeenIndex(walletAddress: string, index: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_PREFIX + walletAddress, String(index));
}
