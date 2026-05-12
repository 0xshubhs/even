-- Even — minimal Supabase schema for cross-device group sync.
-- Apply via: Supabase dashboard → SQL editor → paste this whole file → Run.
--
-- We deliberately keep this dead-simple: one row per group, the whole bundle
-- (group meta + members + expenses + settlements) lives in a single jsonb
-- payload. Devices push the entire bundle on any local change; reads filter
-- by member wallet via a GIN-indexed JSONB query. Last-write-wins by
-- `updated_at` — fine for a hackathon demo, not for prod.

create extension if not exists "pgcrypto";

create table if not exists group_states (
  group_id     text primary key,
  -- The bundle shape mirrors `GroupBundleV1` on the client (see
  -- lib/store/group-store.tsx). Members live at payload->'group'->'members'.
  payload      jsonb not null,
  updated_at   timestamptz not null default now()
);

-- Find groups that include a given wallet as a member.
create index if not exists group_states_members_idx
  on group_states
  using gin ((payload -> 'group' -> 'members'));

-- Bump updated_at automatically.
create or replace function group_states_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists group_states_touch on group_states;
create trigger group_states_touch
  before update on group_states
  for each row execute procedure group_states_touch_updated_at();

-- Demo RLS: anon can read/write everything. Tighten before any real use.
alter table group_states enable row level security;
drop policy if exists "demo anon read"  on group_states;
drop policy if exists "demo anon write" on group_states;
drop policy if exists "demo anon update" on group_states;
create policy "demo anon read"   on group_states for select using (true);
create policy "demo anon write"  on group_states for insert with check (true);
create policy "demo anon update" on group_states for update using (true) with check (true);

-- Enable Realtime for this table:
--   Supabase dashboard → Database → Replication → publication "supabase_realtime"
--   → toggle ON for the `group_states` table.
