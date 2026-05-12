import {
  getUserAccountQuerierFunction,
  getUserRegistrationFunction,
} from "@umbra-privacy/sdk";
import { getUserRegistrationProver } from "@umbra-privacy/web-zk-prover";
import type { IUmbraClient } from "./types";

let cachedProver: ReturnType<typeof getUserRegistrationProver> | null = null;
function getProver() {
  if (!cachedProver) cachedProver = getUserRegistrationProver();
  return cachedProver;
}

export interface RegistrationStatus {
  registered: boolean;
  signatures: string[];
}

/**
 * Idempotent registration. Reads the on-chain status bits, and only skips the
 * SDK call when ALL three registration steps have already completed. If the
 * account exists in a partial state (e.g. PDA initialised but X25519 key not
 * registered — leaves the on-chain pubkey as all zeros, which then breaks
 * ECDH at settle time), we still call `register()`. The SDK is per-step
 * idempotent and will only submit the missing transactions.
 */
export async function ensureRegistered(
  client: IUmbraClient
): Promise<RegistrationStatus> {
  const query = getUserAccountQuerierFunction({ client });
  const accountResult = await query(client.signer.address).catch(() => null);

  if (accountResult && accountResult.state === "exists") {
    const d = accountResult.data;
    const fullyRegistered =
      d.isInitialised &&
      d.isUserAccountX25519KeyRegistered &&
      d.isUserCommitmentRegistered;
    if (fullyRegistered) {
      return { registered: true, signatures: [] };
    }
    console.log(
      `Umbra: account exists but incomplete (x25519=${d.isUserAccountX25519KeyRegistered}, commitment=${d.isUserCommitmentRegistered}). Resuming registration…`
    );
  }

  const register = getUserRegistrationFunction(
    { client },
    { zkProver: getProver() }
  );
  const signatures = await register({ confidential: true, anonymous: true });
  return { registered: true, signatures: signatures.map(String) };
}
