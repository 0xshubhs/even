import Link from "next/link";
import { Receipt } from "@/components/receipt/Receipt";
import { baseToUsdc } from "@/lib/utils";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    emoji: string;
    memberCount: number;
    yourBalanceBase: bigint;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  const isOwed = group.yourBalanceBase > 0n;
  const isOwing = group.yourBalanceBase < 0n;
  const amount = baseToUsdc(group.yourBalanceBase < 0n ? -group.yourBalanceBase : group.yourBalanceBase);

  return (
    <Link href={`/groups/${group.id}`} className="group block">
      <Receipt className="hover:bg-paper transition-colors duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="text-3xl leading-none">{group.emoji}</div>
            <div className="font-display text-2xl tracking-tight pt-2 truncate">{group.name}</div>
            <div className="font-mono text-xs text-ink-mute uppercase tracking-wider">
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </div>
          </div>

          <div className="text-right shrink-0">
            {isOwed && (
              <>
                <div className="eyebrow text-ink-mute">Owed to you</div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-owed-to">
                  +${amount.toFixed(2)}
                </div>
              </>
            )}
            {isOwing && (
              <>
                <div className="eyebrow text-ink-mute">You owe</div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-owed">
                  -${amount.toFixed(2)}
                </div>
              </>
            )}
            {!isOwed && !isOwing && (
              <>
                <div className="eyebrow text-ink-mute">Settled</div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-ink-mute">
                  $0.00
                </div>
              </>
            )}
          </div>
        </div>
      </Receipt>
    </Link>
  );
}
