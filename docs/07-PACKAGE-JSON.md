# 07 — package.json + dependencies

## Root `package.json`

```json
{
  "name": "tab",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.4"
  }
}
```

## `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": {},
    "type-check": {}
  }
}
```

## `apps/web/package.json`

```json
{
  "name": "@tab/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@umbra-privacy/sdk": "^3.0.0",
    "@umbra-privacy/web-zk-prover": "^2.0.1",
    "@bonfida/spl-name-service": "^3.0.19",
    "@solana/web3.js": "^1.95.0",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.32",
    "@wallet-standard/base": "^1.0.1",
    "@wallet-standard/app": "^1.0.1",
    "@supabase/supabase-js": "^2.45.0",
    "next": "14.2.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.10",
    "tailwind-merge": "^2.5.2",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.441.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "sonner": "^1.5.0",
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0"
  },
  "devDependencies": {
    "@types/node": "^22.5.5",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.10.0",
    "eslint-config-next": "14.2.13",
    "postcss": "^8.4.45",
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
```

## `.env.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_RPC_WSS_URL=wss://api.devnet.solana.com

# SNS uses mainnet for resolution (where SNS lives) regardless of payment network
NEXT_PUBLIC_SNS_RPC_URL=https://api.mainnet-beta.solana.com

# Umbra devnet endpoints
NEXT_PUBLIC_UMBRA_NETWORK=devnet
NEXT_PUBLIC_UMBRA_INDEXER_URL=https://utxo-indexer.api-devnet.umbraprivacy.com
NEXT_PUBLIC_UMBRA_RELAYER_URL=https://relayer.api-devnet.umbraprivacy.com

# Devnet USDC mint (verify with the SPL faucet you use)
NEXT_PUBLIC_USDC_MINT=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

# Encrypt (off by default; flip to '1' if you complete the integration)
NEXT_PUBLIC_USE_ENCRYPT=0
```

## `.gitignore`

```
# deps
node_modules/
.pnpm-store/

# next
.next/
out/

# turbo
.turbo

# env
.env
.env.local
.env.*.local

# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# misc
.DS_Store
*.tsbuildinfo
.vercel
```

## Quick install commands

```bash
# Initial setup (after cloning)
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in Supabase URL + key

# Run dev
pnpm dev
# → http://localhost:3000

# Type check
pnpm type-check

# Tests (debt graph)
pnpm test
```

## shadcn/ui setup

```bash
cd apps/web
pnpm dlx shadcn@latest init
# Choose defaults, set aliases to @/components, @/lib

# Add the components you'll use
pnpm dlx shadcn@latest add button card input label dialog dropdown-menu \
  toast tabs select badge avatar separator skeleton
```

## SNS resolver (the actual `lib/sns/resolve.ts`)

Since SNS lives on mainnet but payments are on devnet, the resolver needs its own Connection.

```ts
// lib/sns/resolve.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { resolve, reverseLookup, getDomainKeySync } from "@bonfida/spl-name-service";

const SNS_RPC = process.env.NEXT_PUBLIC_SNS_RPC_URL || "https://api.mainnet-beta.solana.com";
const conn = new Connection(SNS_RPC, "confirmed");

/**
 * Resolve a `.sol` handle to a wallet pubkey.
 * Accepts handle with or without ".sol" suffix.
 * Returns null if not registered.
 */
export async function resolveSolHandle(handle: string): Promise<string | null> {
  const clean = handle.toLowerCase().replace(/\.sol$/, "");
  try {
    const owner = await resolve(conn, clean);
    return owner.toBase58();
  } catch (e) {
    return null;
  }
}

/**
 * Reverse lookup: wallet pubkey → primary `.sol` handle, if any.
 */
export async function reverseSolHandle(walletAddress: string): Promise<string | null> {
  try {
    // Get all domains owned, pick the favorite (or first)
    const pk = new PublicKey(walletAddress);
    const { getAllDomains, getFavoriteDomain } = await import("@bonfida/spl-name-service");
    try {
      const fav = await getFavoriteDomain(conn, pk);
      if (fav?.reverse) return `${fav.reverse}.sol`;
    } catch {}
    const all = await getAllDomains(conn, pk);
    if (all.length === 0) return null;
    const name = await reverseLookup(conn, all[0]);
    return name ? `${name}.sol` : null;
  } catch {
    return null;
  }
}
```

## Done. What to do now

1. Save these handoff files (`00-` through `07-`) somewhere your Claude Code session can read them. A folder like `~/tab-spec/` works.
2. Open Claude Code in a fresh empty directory.
3. Tell Claude Code: *"Read all files in ~/tab-spec/. Build the project per `CLAUDE.md`. Start with Day 1 checklist."*
4. As you progress, mark off the checklist in `CLAUDE.md`.
5. On Day 4, use `06-DEMO-SCRIPTS.md` to record videos.

Good luck. Ship something they want to acquire.
