import { NextResponse } from "next/server";

const FAUCET_URL = "https://faucet.umbraprivacy.com/api/faucet";
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Umbra's faucet API has its labels reversed relative to the on-chain mints:
 *
 *   `token: "dUSDC"` → mints mint `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7`
 *   `token: "dUSDT"` → mints mint `DXQwBNGgyQ2BzGWxEriJPVmXYFQBsQbXvfvfSNTaJkL6`
 *
 * To shield users from this, our API accepts the *mint address* directly and
 * translates to the correct faucet token field. The client passes the mint
 * we're configured to settle in, and gets that exact mint funded.
 */
const MINT_TO_FAUCET_LABEL: Record<string, "dUSDC" | "dUSDT"> = {
  "4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7": "dUSDC",
  DXQwBNGgyQ2BzGWxEriJPVmXYFQBsQbXvfvfSNTaJkL6: "dUSDT",
};

export async function POST(req: Request) {
  let body: { wallet?: string; mint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const wallet = (body.wallet ?? "").trim();
  const mint = (body.mint ?? "").trim();

  if (!BASE58_RE.test(wallet)) {
    return NextResponse.json({ error: "Invalid Solana wallet address." }, { status: 400 });
  }
  const faucetToken = MINT_TO_FAUCET_LABEL[mint];
  if (!faucetToken) {
    return NextResponse.json(
      { error: `Mint ${mint} isn't claimable from the Umbra faucet.` },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(FAUCET_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet, token: faucetToken }),
      cache: "no-store",
    });
    const data = (await upstream.json()) as Record<string, unknown>;
    // The upstream `token` field is mislabeled relative to the mint — overwrite
    // with the actual mint we just funded so the client doesn't get confused.
    return NextResponse.json({ ...data, mint }, { status: upstream.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Faucet upstream failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
