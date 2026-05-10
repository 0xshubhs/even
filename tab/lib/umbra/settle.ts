/**
 * Tab settlement abstraction.
 *
 * In production this calls Umbra's getPublicBalanceToReceiverClaimableUtxoCreatorFunction
 * which builds a shielded UTXO so on-chain observers can't link sender ↔ recipient
 * with the amount visible. See docs/01-UMBRA-INTEGRATION.md for the production flow.
 *
 * For Day 1 we ship a stub that simulates the proof-generation latency so the UX is
 * end-to-end testable. Swap in the real Umbra SDK call once registration is wired.
 */

export interface SettleResult {
  signature: string;
  shielded: boolean;
}

/**
 * Simulate a shielded settlement. The UI shows the ProofGenerationOverlay during this delay.
 * Replace the body with real Umbra SDK calls when ready.
 */
export async function settleDebt(params: {
  recipientWallet: string;
  amountBase: bigint;
}): Promise<SettleResult> {
  const proofMs = 4500 + Math.random() * 1500;
  await new Promise((resolve) => setTimeout(resolve, proofMs));

  // Pseudo-signature: a base58-ish stand-in until the real SDK returns a tx sig.
  const signature = mockSignature(params.recipientWallet, params.amountBase);
  return { signature, shielded: true };
}

function mockSignature(seed: string, amount: bigint) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let s = "";
  let n = BigInt(seed.length) * amount + BigInt(Date.now());
  for (let i = 0; i < 64; i++) {
    n = (n * 1103515245n + 12345n) & 0x7fffffffffffffffn;
    s += alphabet[Number(n % BigInt(alphabet.length))];
  }
  return s;
}
