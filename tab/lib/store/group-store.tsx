"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Member {
  id: string;
  /** Display handle, e.g. "alice.sol" or short wallet */
  handle: string;
  /** Solana wallet pubkey (base58) */
  wallet: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  /** USDC base units (6 decimals) */
  amountBase: bigint;
  paidBy: string; // member id
  splitBetween: string[]; // member ids; equal split
  createdAt: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amountBase: bigint;
  /** Solana tx signature, if real settlement was sent */
  signature?: string;
  /** True if shielded via Umbra (in this demo, conceptually) */
  shielded: boolean;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
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
  createGroup: (input: { name: string; emoji: string; description?: string; members: Member[] }) => Group;
  getGroup: (id: string) => Group | undefined;
  addExpense: (input: Omit<Expense, "id" | "createdAt">) => Expense;
  addSettlement: (input: Omit<Settlement, "id" | "createdAt">) => Settlement;
}

const STORAGE_KEY = "tab.store.v1";

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

export function GroupStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GroupStoreState>(() => ({
    currentUserWallet: null,
    groups: [],
    expenses: [],
    settlements: [],
  }));

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    save(state);
  }, [state]);

  const setCurrentUserWallet = useCallback((wallet: string | null) => {
    setState((s) => ({ ...s, currentUserWallet: wallet }));
  }, []);

  const createGroup: GroupStoreApi["createGroup"] = useCallback(
    (input) => {
      const group: Group = {
        id: uid(),
        name: input.name,
        emoji: input.emoji,
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

  const api = useMemo<GroupStoreApi>(
    () => ({
      ...state,
      setCurrentUserWallet,
      createGroup,
      getGroup,
      addExpense,
      addSettlement,
    }),
    [state, setCurrentUserWallet, createGroup, getGroup, addExpense, addSettlement]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGroupStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGroupStore must be used inside GroupStoreProvider");
  return ctx;
}
