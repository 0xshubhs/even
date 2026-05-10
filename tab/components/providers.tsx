"use client";

import { type ReactNode } from "react";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { GroupStoreProvider } from "@/lib/store/group-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <GroupStoreProvider>{children}</GroupStoreProvider>
    </WalletProvider>
  );
}
