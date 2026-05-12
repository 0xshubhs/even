/**
 * Phantom-safe replacement for the Umbra SDK's `createSignerFromWalletAccount`.
 *
 * ## The bug we're working around
 *
 * Phantom's Wallet Standard `signTransaction` injects safety instructions
 * ("Lighthouse guards") into the transaction *before* signing — so the
 * signature is computed over Phantom's modified message bytes, not the
 * original bytes the SDK constructed.
 *
 * The Umbra SDK's bundled signer merges Phantom's signatures back into the
 * *original* transaction. On-chain, the message bytes don't match what was
 * signed, and pre-flight simulation rejects the tx with "Transaction did not
 * pass signature verification."
 *
 * Our fix: return Phantom's decoded signed transaction as-is, so message
 * bytes and signatures match. The SDK's downstream `sendTransaction` then
 * broadcasts the exact bytes Phantom signed.
 */
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import {
  getTransactionDecoder,
  getTransactionEncoder,
} from "@solana/transactions";
import type { IUmbraSigner } from "./types";

const SolanaSignTransaction = "solana:signTransaction" as const;
const SolanaSignMessage = "solana:signMessage" as const;

interface SignTransactionFeature {
  readonly signTransaction: (
    ...inputs: Array<{ account: WalletAccount; transaction: Uint8Array; chain?: string }>
  ) => Promise<readonly { signedTransaction: Uint8Array }[]>;
}

interface SignMessageFeature {
  readonly signMessage: (
    ...inputs: Array<{ account: WalletAccount; message: Uint8Array }>
  ) => Promise<readonly { signature: Uint8Array }[]>;
}

export function createPhantomSafeWalletSigner(
  wallet: Wallet,
  account: WalletAccount
): IUmbraSigner {
  const features = wallet.features as Record<string, unknown>;
  const signTx = features[SolanaSignTransaction] as SignTransactionFeature | undefined;
  const signMsg = features[SolanaSignMessage] as SignMessageFeature | undefined;
  if (!signTx) {
    throw new Error(`Wallet "${wallet.name}" does not support "solana:signTransaction"`);
  }
  if (!signMsg) {
    throw new Error(`Wallet "${wallet.name}" does not support "solana:signMessage"`);
  }

  const encoder = getTransactionEncoder();
  const decoder = getTransactionDecoder();
  const encode = (tx: unknown): Uint8Array => {
    const out = encoder.encode(tx as Parameters<typeof encoder.encode>[0]);
    return out instanceof Uint8Array ? out : new Uint8Array(out as ArrayLike<number>);
  };
  const decode = (bytes: Uint8Array): unknown => decoder.decode(bytes);

  /**
   * Take Phantom's signed bytes + signatures (which may include Lighthouse
   * modifications) but PRESERVE the original transaction's runtime metadata
   * — fields like `lifetimeConstraint` that aren't part of the wire format
   * but the SDK reads after signing to track blockhash expiry.
   */
  const mergeSigned = (original: unknown, signedBytes: Uint8Array) => {
    const decoded = decode(signedBytes) as {
      messageBytes: Uint8Array;
      signatures: Record<string, Uint8Array | null>;
    };
    return {
      ...(original as object),
      messageBytes: decoded.messageBytes,
      signatures: decoded.signatures,
    };
  };

  return {
    address: account.address as IUmbraSigner["address"],
    async signTransaction(transaction: unknown) {
      const wireBytes = encode(transaction);
      const [output] = await signTx.signTransaction({ account, transaction: wireBytes });
      return mergeSigned(transaction, output.signedTransaction) as never;
    },
    async signTransactions(transactions: readonly unknown[]) {
      const inputs = transactions.map((tx) => ({
        account,
        transaction: encode(tx),
      }));
      const outputs = await signTx.signTransaction(...inputs);
      return transactions.map((tx, i) => mergeSigned(tx, outputs[i].signedTransaction)) as never;
    },
    async signMessage(message: Uint8Array) {
      const [output] = await signMsg.signMessage({ account, message });
      return {
        message,
        signature: output.signature as never,
        signer: account.address as IUmbraSigner["address"],
      };
    },
  } as IUmbraSigner;
}
