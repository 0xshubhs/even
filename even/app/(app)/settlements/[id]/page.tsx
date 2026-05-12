"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SettlementReceipt } from "@/components/settlement/SettlementReceipt";
import { useGroupStore } from "@/lib/store/group-store";

export default function SettlementDetailPage() {
  const params = useParams<{ id: string }>();
  const { settlements, groups } = useGroupStore();

  const settlement = settlements.find((s) => s.id === params.id);
  const group = settlement
    ? groups.find((g) => g.id === settlement.groupId)
    : undefined;

  if (!settlement || !group) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="font-display text-3xl">Settlement not found</div>
        <p className="text-ink-mute">
          The settlement may have been recorded on a different device — try{" "}
          <Link href="/import" className="underline">
            importing the shared group
          </Link>{" "}
          first.
        </p>
        <Link href="/groups">
          <Button variant="paper">Back to groups</Button>
        </Link>
      </div>
    );
  }

  const fromMember = group.members.find((m) => m.id === settlement.fromMemberId);
  const toMember = group.members.find((m) => m.id === settlement.toMemberId);

  return (
    <div className="max-w-md mx-auto px-6 py-12 space-y-8">
      <Link href={`/groups/${group.id}`} className="eyebrow text-ink-mute hover:text-ink inline-flex items-center gap-1.5">
        <ArrowLeft className="w-3 h-3" /> {group.name}
      </Link>

      <div className="space-y-2 text-center">
        <div className="eyebrow text-owed-to">Settlement</div>
        <h1 className="font-display text-3xl tracking-tight font-semibold">
          {fromMember?.handle ?? "?"} → {toMember?.handle ?? "?"}
        </h1>
      </div>

      <SettlementReceipt
        to={toMember?.handle ?? "?"}
        amountBase={settlement.amountBase}
        signature={settlement.signature}
        groupName={group.name}
        timestamp={new Date(settlement.createdAt)}
      />
    </div>
  );
}
