import {
  getEncryptedBalanceQuerierFunction,
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
} from "@umbra-privacy/sdk";
import { USDC_DEVNET_MINT } from "./constants";
import { toAddress, toU64, type IUmbraClient } from "./types";

/** Shield public USDC into the user's encrypted balance. */
export async function shieldUsdc(client: IUmbraClient, amountBase: bigint) {
  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
  const result = await deposit(
    client.signer.address,
    toAddress(USDC_DEVNET_MINT),
    toU64(amountBase)
  );
  return {
    queueSignature: String(result.queueSignature),
    callbackSignature: result.callbackSignature
      ? String(result.callbackSignature)
      : undefined,
  };
}

/** Unshield encrypted USDC back to the public ATA. */
export async function unshieldUsdc(client: IUmbraClient, amountBase: bigint) {
  const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
  const result = await withdraw(
    client.signer.address,
    toAddress(USDC_DEVNET_MINT),
    toU64(amountBase)
  );
  return {
    queueSignature: String(result.queueSignature),
    callbackSignature: result.callbackSignature
      ? String(result.callbackSignature)
      : undefined,
  };
}

/** Query the user's encrypted USDC balance (returns base units or null if not queryable). */
export async function getEncryptedUsdcBalance(client: IUmbraClient): Promise<bigint | null> {
  const query = getEncryptedBalanceQuerierFunction({ client });
  const result = await query([toAddress(USDC_DEVNET_MINT)]);
  const entry = result.get(toAddress(USDC_DEVNET_MINT));
  if (!entry) return null;
  if (entry.state === "shared") return BigInt(entry.balance);
  return null;
}
