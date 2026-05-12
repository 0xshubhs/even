/**
 * Umbra + Solana devnet configuration.
 *
 * Everything except Supabase keys is hardcoded so Vercel only needs two env
 * vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). The Helius
 * RPC URL embeds an API key — if you fork this repo, swap it for your own.
 */

export const UMBRA_NETWORK = "devnet" as const;

/** Helius devnet RPC (free tier). Replace the key when forking. */
export const UMBRA_RPC_URL =
  "https://devnet.helius-rpc.com/?api-key=9e1ddbc7-d3d7-43a3-aa90-65cf69f92d04";

export const UMBRA_RPC_WSS_URL =
  "wss://devnet.helius-rpc.com/?api-key=9e1ddbc7-d3d7-43a3-aa90-65cf69f92d04";

export const UMBRA_INDEXER_URL =
  "https://utxo-indexer.api-devnet.umbraprivacy.com";

export const UMBRA_RELAYER_URL =
  "https://relayer.api-devnet.umbraprivacy.com";

export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
export const UMBRA_TEST_TOKEN_1 = "DXQwBNGgyQ2BzGWxEriJPVmXYFQBsQbXvfvfSNTaJkL6";
export const UMBRA_TEST_TOKEN_2 = "4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7";

/**
 * Default settlement mint. Must be on the Umbra relayer's supported-mints list
 * — `getSupportedMints()` — or the claim leg won't get sponsored.
 *
 *   - DXQwBNGgyQ2BzGWxEriJPVmXYFQBsQbXvfvfSNTaJkL6 (Umbra dummy token, 6 dec)
 *   - 4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7 (Umbra dummy token, 6 dec)
 *   - So11111111111111111111111111111111111111112  (wSOL — requires the SDK's
 *     "staged SOL" path; not implemented, pool deposits fail)
 *
 * We default to mint `4oG4s…` because Umbra's faucet's `dUSDC` button mints
 * exactly this one. Get test tokens via /settings → Claim, which proxies to
 * https://faucet.umbraprivacy.com.
 */
export const USDC_DEVNET_MINT = UMBRA_TEST_TOKEN_2;

export const SCAN_TREE_INDEX = 0;
export const SCAN_INTERVAL_MS = 15_000;
