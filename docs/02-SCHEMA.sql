-- 02-SCHEMA.sql
-- Apply via: Supabase dashboard → SQL editor → paste this whole file → Run.
-- Or: pnpm dlx supabase db push if you've set up the CLI.

-- ============================================================================
-- USERS / WALLETS
-- ============================================================================
-- A user is identified by their Solana wallet address. We keep a profile row
-- with optional .sol handle (resolved via SNS, cached here).
create table if not exists users (
  wallet text primary key,                       -- base58 Solana pubkey
  sol_handle text,                                -- e.g. "alice.sol", nullable
  display_name text,                              -- friendly name they set
  created_at timestamptz not null default now(),
  last_seen_utxo_index integer not null default 0
);
create index if not exists users_sol_handle_idx on users (sol_handle);

-- ============================================================================
-- GROUPS
-- ============================================================================
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by text not null references users(wallet),
  -- icon/emoji for visual flair
  emoji text default '💸',
  -- optional viewing key (X25519 pubkey, hex) granted to a group "auditor"
  -- e.g. landlord for rent group, accountant for project. v2 feature; nullable.
  auditor_x25519_pubkey text,
  created_at timestamptz not null default now()
);
create index if not exists groups_created_by_idx on groups (created_by);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  wallet text not null references users(wallet),
  joined_at timestamptz not null default now(),
  -- pending = invited but hasn't connected wallet yet (we know their .sol handle)
  status text not null default 'active' check (status in ('active', 'pending')),
  primary key (group_id, wallet)
);

-- ============================================================================
-- EXPENSES
-- ============================================================================
-- An expense is a single shared cost. Splits can be equal/share/exact.
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null,                       -- "Dinner at Mod Cafe"
  amount_base bigint not null,                     -- USDC base units (6 decimals)
  paid_by text not null references users(wallet),
  category text,                                   -- food, rent, travel, ...
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists expenses_group_idx on expenses (group_id, occurred_at desc);

-- One row per participant in the expense, with their share.
create table if not exists expense_splits (
  expense_id uuid not null references expenses(id) on delete cascade,
  wallet text not null references users(wallet),
  share_base bigint not null,                      -- base USDC owed by this member for this expense
  primary key (expense_id, wallet)
);

-- ============================================================================
-- SETTLEMENTS
-- ============================================================================
-- A settlement = a real on-chain Umbra UTXO transfer from one member to another.
-- We record it pending → confirmed once the callback signature returns.
create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_wallet text not null references users(wallet),
  to_wallet text not null references users(wallet),
  amount_base bigint not null,                     -- visible to from/to only in UI
  -- on-chain artifacts
  create_utxo_signature text,
  claim_signature text,
  status text not null default 'pending' check (status in ('pending', 'created', 'claimed', 'failed')),
  -- Why this settlement: which expenses it pays toward (multi-expense settle-up)
  expense_ids uuid[] default array[]::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists settlements_group_idx on settlements (group_id, created_at desc);
create index if not exists settlements_to_idx on settlements (to_wallet, status);

-- ============================================================================
-- AUDIT LOG (for the "viewing key" demo angle)
-- ============================================================================
-- Per-group activity log, simplified for demo. Prod would be append-only.
create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  actor text not null references users(wallet),
  kind text not null check (kind in ('group_created', 'member_added', 'expense_added', 'settlement_started', 'settlement_completed')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists activity_group_idx on activity (group_id, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (recommended; tighten before any prod use)
-- ============================================================================
-- For the hackathon demo, leave RLS off (or use a permissive policy) so the
-- frontend can read freely. For prod, gate by JWT-bound wallet pubkey.
alter table users enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table settlements enable row level security;
alter table activity enable row level security;

-- Demo-mode permissive policy (REMOVE for prod):
create policy "demo: anon read all" on users for select using (true);
create policy "demo: anon read all" on groups for select using (true);
create policy "demo: anon read all" on group_members for select using (true);
create policy "demo: anon read all" on expenses for select using (true);
create policy "demo: anon read all" on expense_splits for select using (true);
create policy "demo: anon read all" on settlements for select using (true);
create policy "demo: anon read all" on activity for select using (true);
create policy "demo: anon write all" on users for insert with check (true);
create policy "demo: anon write all" on groups for insert with check (true);
create policy "demo: anon write all" on group_members for insert with check (true);
create policy "demo: anon write all" on expenses for insert with check (true);
create policy "demo: anon write all" on expense_splits for insert with check (true);
create policy "demo: anon write all" on settlements for insert with check (true);
create policy "demo: anon update settlements" on settlements for update using (true);
create policy "demo: anon write activity" on activity for insert with check (true);
