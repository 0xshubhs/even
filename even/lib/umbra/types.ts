import type { IUmbraClient, IUmbraSigner, ScannedUtxoData } from "@umbra-privacy/sdk/interfaces";
import type { U64 } from "@umbra-privacy/sdk/types";
import type { Address } from "@solana/kit";

export type { IUmbraClient, IUmbraSigner, ScannedUtxoData, U64, Address };

/** Cast a base58 wallet string to a branded `Address`. */
export const toAddress = (s: string) => s as unknown as Address;

/** Cast a `bigint` USDC base-unit value to the SDK's branded `U64`. */
export const toU64 = (n: bigint) => n as unknown as U64;
