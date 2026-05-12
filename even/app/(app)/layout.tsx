import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ClaimToast } from "@/components/umbra/ClaimToast";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:pl-64 min-h-screen">
      <Sidebar />
      <div className="min-h-screen">{children}</div>
      <ClaimToast />
    </div>
  );
}
