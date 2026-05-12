import { getSupabase } from "./client";
import type { Expense, Group, Settlement } from "@/lib/store/group-store";

/**
 * Wire shape stored at `group_states.payload`. Mirrors the local bundle but
 * with bigint amounts serialised as strings (jsonb-safe).
 */
export interface CloudBundle {
  v: 1;
  group: Group;
  expenses: Array<Omit<Expense, "amountBase"> & { amountBase: string }>;
  settlements: Array<Omit<Settlement, "amountBase"> & { amountBase: string }>;
}

const TABLE = "group_states";

export function bundleFor(
  group: Group,
  allExpenses: Expense[],
  allSettlements: Settlement[]
): CloudBundle {
  return {
    v: 1,
    group,
    expenses: allExpenses
      .filter((e) => e.groupId === group.id)
      .map((e) => ({ ...e, amountBase: e.amountBase.toString() })),
    settlements: allSettlements
      .filter((s) => s.groupId === group.id)
      .map((s) => ({ ...s, amountBase: s.amountBase.toString() })),
  };
}

export function rehydrateBundle(b: CloudBundle): {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
} {
  return {
    group: b.group,
    expenses: b.expenses.map((e) => ({ ...e, amountBase: BigInt(e.amountBase) })),
    settlements: b.settlements.map((s) => ({ ...s, amountBase: BigInt(s.amountBase) })),
  };
}

/** Push a single group's whole bundle. Upserts on group_id. */
export async function pushBundle(bundle: CloudBundle): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from(TABLE)
    .upsert({ group_id: bundle.group.id, payload: bundle }, { onConflict: "group_id" });
  if (error) {
    console.warn("Supabase push failed:", error.message);
  }
}

/**
 * Pull every group that includes `wallet` as a member. We let Postgres do the
 * filtering server-side via a jsonb containment query on `payload->group->members`.
 */
export async function pullBundlesForWallet(
  wallet: string
): Promise<CloudBundle[]> {
  const sb = getSupabase();
  if (!sb) return [];
  // jsonb @> '{"group": {"members": [{"wallet": "..."}]}}'
  const filter = JSON.stringify({ group: { members: [{ wallet }] } });
  const { data, error } = await sb
    .from(TABLE)
    .select("payload, updated_at")
    .filter("payload", "cs", filter);
  if (error) {
    console.warn("Supabase pull failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.payload as CloudBundle);
}

/**
 * Subscribe to live changes on the `group_states` table. Returns an unsubscribe
 * fn. The caller filters bundles client-side to those including their wallet.
 */
export function subscribeToBundles(
  onChange: (bundle: CloudBundle, eventType: "INSERT" | "UPDATE" | "DELETE") => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel("group_states-feed")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      (payload) => {
        const row = (payload.new ?? payload.old) as { payload?: CloudBundle } | undefined;
        if (!row?.payload) return;
        onChange(row.payload, payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      }
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}
