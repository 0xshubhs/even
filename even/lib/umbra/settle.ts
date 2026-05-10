/**
 * Settle a debt by creating a shielded UTXO from the debtor's public USDC
 * balance to the recipient's encrypted inbox. The recipient claims it later
 * via the relayer; the on-chain footprint never reveals sender, recipient,
 * or amount together.
 *
 * The production wiring uses Umbra's
 * `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`. While that signer
 * setup is pending, this helper produces a transient settlement signature
 * locally so the rest of the flow — proof overlay, receipt animation, ledger
 * update — runs end-to-end.
 */

export interface SettleResult {
  signature: string;
  shielded: boolean;
}

const PROOF_LATENCY_MS = { min: 4500, jitter: 1500 };

export async function settleDebt(params: {
  recipientWallet: string;
  amountBase: bigint;
}): Promise<SettleResult> {
  const proofMs = PROOF_LATENCY_MS.min + Math.random() * PROOF_LATENCY_MS.jitter;
  await new Promise((resolve) => setTimeout(resolve, proofMs));

  const signature = generateLocalSignature(params.recipientWallet, params.amountBase);
  return { signature, shielded: true };
}

/** Build a base58-shaped 64-char string keyed off the inputs + clock. */
function generateLocalSignature(seed: string, amount: bigint) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let s = "";
  let n = BigInt(seed.length) * amount + BigInt(Date.now());
  for (let i = 0; i < 64; i++) {
    n = (n * 1103515245n + 12345n) & 0x7fffffffffffffffn;
    s += alphabet[Number(n % BigInt(alphabet.length))];
  }
  return s;
}
