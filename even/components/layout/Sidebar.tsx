"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, LayoutDashboard, Plus, Settings, Users, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useGroupStore } from "@/lib/store/group-store";
import { shortAddress, cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const { setCurrentUserWallet } = useGroupStore();

  useEffect(() => {
    setCurrentUserWallet(connected && publicKey ? publicKey.toBase58() : null);
  }, [connected, publicKey, setCurrentUserWallet]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-paper-rim bg-paper/80 backdrop-blur-sm flex-col z-30">
        <div className="px-6 py-6 border-b border-paper-rim">
          <Link href="/" className="block">
            <div className="font-display text-3xl tracking-tight font-semibold leading-none">
              Even
            </div>
            <div className="eyebrow text-privacy mt-1.5">Split · Settle · Shielded</div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}

          <div className="pt-3 space-y-2">
            <Link
              href="/groups/new"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium border border-dashed border-paper-rim text-ink-soft hover:text-ink hover:border-ink-mute transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              New group
            </Link>
            <Link
              href="/import"
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              <Download className="w-4 h-4" strokeWidth={1.75} />
              Import shared group
            </Link>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-paper-rim space-y-3">
          {connected && publicKey ? (
            <div className="flex items-center gap-2 text-xs text-ink-mute">
              <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="font-mono">{shortAddress(publicKey.toBase58(), 5)}</span>
            </div>
          ) : null}
          <ConnectButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden border-b border-paper-rim bg-paper/85 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="font-display text-2xl tracking-tight font-semibold">
            Even
          </Link>
          <nav className="flex items-center gap-1 text-xs">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  isActive(pathname, item.href)
                    ? "text-ink font-semibold"
                    : "text-ink-soft hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ConnectButton />
        </div>
      </header>
    </>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors relative",
        active
          ? "bg-paper-deep text-ink font-semibold"
          : "text-ink-soft hover:text-ink hover:bg-paper-deep/60"
      )}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-privacy" aria-hidden />}
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/groups") return pathname === "/groups" || pathname.startsWith("/groups/");
  if (href === "/settings") return pathname === "/settings";
  return pathname === href;
}
