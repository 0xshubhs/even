import {
  getBatchMerkleProofFetcher,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getUmbraRelayer,
} from "@umbra-privacy/sdk";
import { getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver } from "@umbra-privacy/web-zk-prover";
import { UMBRA_INDEXER_URL, UMBRA_RELAYER_URL } from "./constants";
import type { IUmbraClient, ScannedUtxoData } from "./types";

let cachedClaimProver: ReturnType<
  typeof getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver
> | null = null;
function getProver() {
  if (!cachedClaimProver) {
    cachedClaimProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
  }
  return cachedClaimProver;
}

/**
 * Claim a batch of receiver-claimable UTXOs into the user's encrypted balance.
 * The Umbra relayer pays the SOL fee, so a recipient can claim even with 0 SOL.
 */
export async function claimUtxos(client: IUmbraClient, utxos: ScannedUtxoData[]) {
  if (utxos.length === 0) return null;
  const relayer = getUmbraRelayer({ apiEndpoint: UMBRA_RELAYER_URL });
  const fetchBatchMerkleProof = getBatchMerkleProofFetcher({
    apiEndpoint: UMBRA_INDEXER_URL,
  });
  const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    {
      zkProver: getProver(),
      relayer,
      fetchBatchMerkleProof,
    }
  );
  return await claim(utxos);
}
