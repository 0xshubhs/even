"use client";

import { type ReactNode } from "react";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { UmbraProvider } from "@/components/umbra/UmbraProvider";
import { GroupStoreProvider } from "@/lib/store/group-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <UmbraProvider>
        <GroupStoreProvider>{children}</GroupStoreProvider>
      </UmbraProvider>
    </WalletProvider>
  );
}
