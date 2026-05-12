import {
  createInMemorySigner,
  createSignerFromPrivateKeyBytes,
  getUmbraClient,
} from "@umbra-privacy/sdk";
import bs58 from "bs58";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  UMBRA_INDEXER_URL,
  UMBRA_NETWORK,
  UMBRA_RPC_URL,
  UMBRA_RPC_WSS_URL,
} from "./constants";
import { createPhantomSafeWalletSigner } from "./wallet-signer";
import type { IUmbraClient, IUmbraSigner } from "./types";

export type UmbraClient = IUmbraClient;

async function build(signer: IUmbraSigner): Promise<UmbraClient> {
  return await getUmbraClient({
    signer,
    network: UMBRA_NETWORK,
    rpcUrl: UMBRA_RPC_URL,
    rpcSubscriptionsUrl: UMBRA_RPC_WSS_URL,
    indexerApiEndpoint: UMBRA_INDEXER_URL,
  });
}

/**
 * Build a client from a Wallet Standard wallet/account (Phantom, Solflare).
 * Uses our Phantom-safe signer wrapper — see lib/umbra/wallet-signer.ts.
 */
export async function buildUmbraClientFromWallet(
  wallet: Wallet,
  account: WalletAccount
): Promise<UmbraClient> {
  const signer = createPhantomSafeWalletSigner(wallet, account);
  return build(signer);
}

/** Build a client from a base58-encoded 64-byte Solana secret key. */
export async function buildUmbraClientFromSecretKey(
  secretBase58: string
): Promise<UmbraClient> {
  const bytes = bs58.decode(secretBase58);
  const signer = await createSignerFromPrivateKeyBytes(bytes);
  return build(signer);
}

/** Build a throwaway in-memory keypair-backed client. Useful for development. */
export async function buildUmbraClientInMemory(): Promise<UmbraClient> {
  const signer = await createInMemorySigner();
  return build(signer);
}
