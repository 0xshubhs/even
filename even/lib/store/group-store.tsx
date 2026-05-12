"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  bundleFor,
  pullBundlesForWallet,
  pushBundle,
  rehydrateBundle,
  subscribeToBundles,
  type CloudBundle,
} from "@/lib/supabase/sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface Member {
  id: string;
  /** Display handle, e.g. "alice.sol" or short wallet */
  handle: string;
  /** Solana wallet pubkey (base58) */
  wallet: string;
}

export type SplitMode = "equal" | "shares" | "custom";

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  /** USDC base units (6 decimals) */
  amountBase: bigint;
  paidBy: string; // member id
  splitBetween: string[]; // member ids
  /** Omitted on legacy expenses; treat as "equal". */
  splitMode?: SplitMode;
  /**
   * For "shares": positive integer share counts per included member, same order as splitBetween.
   * For "custom": USDC base-unit amounts per included member, same order as splitBetween (must sum to amountBase).
   */
  splitWeights?: string[];
  createdAt: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amountBase: bigint;
  /** Solana tx signature returned by the settlement helper */
  signature?: string;
  /** True if the settlement went through Umbra's shielded path */
  shielded: boolean;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  /** Optional cover label (1-2 chars). If absent, derived from name. */
  cover?: string;
  description?: string;
  members: Member[];
  createdAt: number;
}

interface GroupStoreState {
  currentUserWallet: string | null;
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
}

interface GroupStoreApi extends GroupStoreState {
  setCurrentUserWallet: (wallet: string | null) => void;
  createGroup: (input: { name: string; cover?: string; description?: string; members: Member[] }) => Group;
  getGroup: (id: string) => Group | undefined;
  addExpense: (input: Omit<Expense, "id" | "createdAt">) => Expense;
  addSettlement: (input: Omit<Settlement, "id" | "createdAt">) => Settlement;
  /** Build a compact, shareable bundle of one group's state. */
  exportGroup: (groupId: string) => string | null;
  /** Merge a bundle into the local store. Returns the group's id on success. */
  importBundle: (encoded: string) => { groupId: string } | { error: string };
}

const STORAGE_KEY = "even.store.v1";

const Ctx = createContext<GroupStoreApi | null>(null);

interface SerializedState {
  currentUserWallet: string | null;
  groups: Group[];
  expenses: Array<Omit<Expense, "amountBase"> & { amountBase: string }>;
  settlements: Array<Omit<Settlement, "amountBase"> & { amountBase: string }>;
}

function load(): GroupStoreState {
  if (typeof window === "undefined") {
    return { currentUserWallet: null, groups: [], expenses: [], settlements: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no data");
    const parsed = JSON.parse(raw) as SerializedState;
    return {
      currentUserWallet: parsed.currentUserWallet ?? null,
      groups: parsed.groups ?? [],
      expenses: (parsed.expenses ?? []).map((e) => ({ ...e, amountBase: BigInt(e.amountBase) })),
      settlements: (parsed.settlements ?? []).map((s) => ({ ...s, amountBase: BigInt(s.amountBase) })),
    };
  } catch {
    return { currentUserWallet: null, groups: [], expenses: [], settlements: [] };
  }
}

function save(state: GroupStoreState) {
  if (typeof window === "undefined") return;
  const serialized: SerializedState = {
    currentUserWallet: state.currentUserWallet,
    groups: state.groups,
    expenses: state.expenses.map((e) => ({ ...e, amountBase: e.amountBase.toString() })),
    settlements: state.settlements.map((s) => ({ ...s, amountBase: s.amountBase.toString() })),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface GroupBundleV1 {
  v: 1;
  group: Group;
  expenses: Array<Omit<Expense, "amountBase"> & { amountBase: string }>;
  settlements: Array<Omit<Settlement, "amountBase"> & { amountBase: string }>;
}

function encodeBundle(bundle: GroupBundleV1): string {
  const json = JSON.stringify(bundle);
  if (typeof window === "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }
  // browser: btoa(unescape(encodeURIComponent(...))) to support multibyte chars
  const utf8 = unescape(encodeURIComponent(json));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBundle(
  encoded: string
): { bundle: GroupBundleV1 } | { error: string } {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 ? 4 - (padded.length % 4) : 0;
    const utf8 =
      typeof atob === "function"
        ? atob(padded + "=".repeat(pad))
        : Buffer.from(padded + "=".repeat(pad), "base64").toString("binary");
    const json = decodeURIComponent(escape(utf8));
    const parsed = JSON.parse(json) as Partial<GroupBundleV1>;
    if (parsed.v !== 1 || !parsed.group || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.settlements)) {
      return { error: "Invalid bundle format." };
    }
    return { bundle: parsed as GroupBundleV1 };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not decode bundle." };
  }
}

export function GroupStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GroupStoreState>(() => ({
    currentUserWallet: null,
    groups: [],
    expenses: [],
    settlements: [],
  }));
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  // Persist on every state change, but NOT before hydration — otherwise
  // the initial empty state would overwrite saved data on first paint.
  useEffect(() => {
    if (!hydrated) return;
    save(state);
  }, [state, hydrated]);

  // ── Cloud sync (Supabase) ─────────────────────────────────────────────────
  // When the wallet connects, pull every group it's a member of. Subscribe
  // to realtime changes and merge them in. Push local changes (debounced) so
  // other devices owned by the same wallet stay in sync.
  const lastPushedRef = useRef<Map<string, string>>(new Map());

  const mergeBundleIntoState = useCallback((bundle: CloudBundle) => {
    const { group, expenses, settlements } = rehydrateBundle(bundle);
    setState((s) => {
      const existing = s.groups.find((g) => g.id === group.id);
      // Last-write-wins on createdAt of latest mutation; we keep the bundle
      // with the highest expense/settlement timestamp.
      const remoteMax = Math.max(
        group.createdAt,
        ...expenses.map((e) => e.createdAt),
        ...settlements.map((x) => x.createdAt)
      );
      const localExpenses = s.expenses.filter((e) => e.groupId === group.id);
      const localSettlements = s.settlements.filter((x) => x.groupId === group.id);
      const localMax = Math.max(
        existing?.createdAt ?? 0,
        ...localExpenses.map((e) => e.createdAt),
        ...localSettlements.map((x) => x.createdAt)
      );
      if (existing && localMax > remoteMax) return s; // local is newer

      const groups = existing
        ? s.groups.map((g) => (g.id === group.id ? group : g))
        : [group, ...s.groups];

      // Union by id for child collections.
      const expenseIds = new Set(s.expenses.map((e) => e.id));
      const mergedExpenses = [
        ...s.expenses.filter((e) => e.groupId !== group.id),
        ...expenses,
        ...s.expenses
          .filter((e) => e.groupId === group.id)
          .filter((e) => !expenses.some((re) => re.id === e.id)),
      ];
      void expenseIds; // (kept for clarity)

      const mergedSettlements = [
        ...s.settlements.filter((x) => x.groupId !== group.id),
        ...settlements,
        ...s.settlements
          .filter((x) => x.groupId === group.id)
          .filter((x) => !settlements.some((rs) => rs.id === x.id)),
      ];

      return { ...s, groups, expenses: mergedExpenses, settlements: mergedSettlements };
    });
  }, []);

  // Pull on wallet connect.
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured) return;
    const wallet = state.currentUserWallet;
    if (!wallet) return;
    let cancelled = false;
    void (async () => {
      const bundles = await pullBundlesForWallet(wallet);
      if (cancelled) return;
      for (const b of bundles) mergeBundleIntoState(b);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, state.currentUserWallet, mergeBundleIntoState]);

  // Realtime subscription — merge any incoming bundle that includes our wallet.
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured) return;
    const wallet = state.currentUserWallet;
    if (!wallet) return;
    const unsubscribe = subscribeToBundles((bundle) => {
      const isMember = bundle.group.members.some((m) => m.wallet === wallet);
      if (!isMember) return;
      mergeBundleIntoState(bundle);
    });
    return () => unsubscribe();
  }, [hydrated, state.currentUserWallet, mergeBundleIntoState]);

  // Push: any time a group / its expenses / its settlements change locally,
  // push the bundle for groups the connected wallet is a member of.
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured) return;
    const wallet = state.currentUserWallet;
    if (!wallet) return;
    const myGroups = state.groups.filter((g) =>
      g.members.some((m) => m.wallet === wallet)
    );
    for (const g of myGroups) {
      const bundle = bundleFor(g, state.expenses, state.settlements);
      const sig = JSON.stringify(bundle);
      if (lastPushedRef.current.get(g.id) === sig) continue;
      lastPushedRef.current.set(g.id, sig);
      void pushBundle(bundle);
    }
  }, [hydrated, state.currentUserWallet, state.groups, state.expenses, state.settlements]);
  // ── end cloud sync ────────────────────────────────────────────────────────

  const setCurrentUserWallet = useCallback((wallet: string | null) => {
    setState((s) => ({ ...s, currentUserWallet: wallet }));
  }, []);

  const createGroup: GroupStoreApi["createGroup"] = useCallback(
    (input) => {
      const group: Group = {
        id: uid(),
        name: input.name,
        cover: input.cover,
        description: input.description,
        members: input.members,
        createdAt: Date.now(),
      };
      setState((s) => ({ ...s, groups: [group, ...s.groups] }));
      return group;
    },
    []
  );

  const getGroup = useCallback(
    (id: string) => state.groups.find((g) => g.id === id),
    [state.groups]
  );

  const addExpense: GroupStoreApi["addExpense"] = useCallback((input) => {
    const expense: Expense = { ...input, id: uid(), createdAt: Date.now() };
    setState((s) => ({ ...s, expenses: [expense, ...s.expenses] }));
    return expense;
  }, []);

  const addSettlement: GroupStoreApi["addSettlement"] = useCallback((input) => {
    const s: Settlement = { ...input, id: uid(), createdAt: Date.now() };
    setState((prev) => ({ ...prev, settlements: [s, ...prev.settlements] }));
    return s;
  }, []);

  const exportGroup: GroupStoreApi["exportGroup"] = useCallback(
    (groupId) => {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return null;
      const bundle: GroupBundleV1 = {
        v: 1,
        group,
        expenses: state.expenses
          .filter((e) => e.groupId === groupId)
          .map((e) => ({ ...e, amountBase: e.amountBase.toString() })),
        settlements: state.settlements
          .filter((s) => s.groupId === groupId)
          .map((s) => ({ ...s, amountBase: s.amountBase.toString() })),
      };
      return encodeBundle(bundle);
    },
    [state.groups, state.expenses, state.settlements]
  );

  const importBundle: GroupStoreApi["importBundle"] = useCallback((encoded) => {
    const parsed = decodeBundle(encoded);
    if ("error" in parsed) return parsed;
    const bundle = parsed.bundle;
    setState((s) => {
      const groups = s.groups.some((g) => g.id === bundle.group.id)
        ? s.groups.map((g) => (g.id === bundle.group.id ? bundle.group : g))
        : [bundle.group, ...s.groups];

      const expenseIds = new Set(s.expenses.map((e) => e.id));
      const expenses = [
        ...s.expenses,
        ...bundle.expenses
          .filter((e) => !expenseIds.has(e.id))
          .map((e) => ({ ...e, amountBase: BigInt(e.amountBase) })),
      ];

      const settlementIds = new Set(s.settlements.map((x) => x.id));
      const settlements = [
        ...s.settlements,
        ...bundle.settlements
          .filter((x) => !settlementIds.has(x.id))
          .map((x) => ({ ...x, amountBase: BigInt(x.amountBase) })),
      ];

      return { ...s, groups, expenses, settlements };
    });
    return { groupId: bundle.group.id };
  }, []);

  const api = useMemo<GroupStoreApi>(
    () => ({
      ...state,
      setCurrentUserWallet,
      createGroup,
      getGroup,
      addExpense,
      addSettlement,
      exportGroup,
      importBundle,
    }),
    [
      state,
      setCurrentUserWallet,
      createGroup,
      getGroup,
      addExpense,
      addSettlement,
      exportGroup,
      importBundle,
    ]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGroupStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGroupStore must be used inside GroupStoreProvider");
  return ctx;
}
