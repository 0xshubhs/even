import { getPublicBalanceToReceiverClaimableUtxoCreatorFunction } from "@umbra-privacy/sdk";
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from "@umbra-privacy/web-zk-prover";
import { USDC_DEVNET_MINT } from "./constants";
import { toAddress, toU64, type IUmbraClient } from "./types";

let cachedZkProver: ReturnType<
  typeof getCreateReceiverClaimableUtxoFromPublicBalanceProver
> | null = null;
function getProver() {
  if (!cachedZkProver) {
    cachedZkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
  }
  return cachedZkProver;
}

export interface SettleResult {
  /** Primary on-chain settlement signature (the one to surface in the UI). */
  signature: string;
  /** Auxiliary proof-account create signature, returned by the SDK. */
  createProofAccountSignature: string;
  /** Optional close-proof-account signature, present when an existing one was reused. */
  closeProofAccountSignature?: string;
  shielded: true;
}

/**
 * Settle a debt by creating a receiver-claimable UTXO from the debtor's
 * public USDC ATA.
 */
export async function settleDebt(
  client: IUmbraClient,
  params: { recipientWallet: string; amountBase: bigint; mint?: string }
): Promise<SettleResult> {
  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver: getProver() }
  );

  const result = await createUtxo({
    destinationAddress: toAddress(params.recipientWallet),
    mint: toAddress(params.mint ?? USDC_DEVNET_MINT),
    amount: toU64(params.amountBase),
  });

  return {
    signature: String(result.createUtxoSignature),
    createProofAccountSignature: String(result.createProofAccountSignature),
    closeProofAccountSignature: result.closeProofAccountSignature
      ? String(result.closeProofAccountSignature)
      : undefined,
    shielded: true,
  };
}
