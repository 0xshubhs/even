"use client";

import { Receipt } from "@/components/receipt/Receipt";
import { ReceiptHeader } from "@/components/receipt/ReceiptHeader";
import { ReceiptLine } from "@/components/receipt/ReceiptLine";
import { baseToUsdc, shortAddress } from "@/lib/utils";
import { explorerUrl } from "@/lib/solana/constants";

interface SettlementReceiptProps {
  to: string;
  amountBase: bigint;
  signature?: string;
  groupName: string;
  timestamp: Date;
}

export function SettlementReceipt({
  to,
  amountBase,
  signature,
  groupName,
  timestamp,
}: SettlementReceiptProps) {
  const usd = baseToUsdc(amountBase).toFixed(2);

  return (
    <div className="max-w-sm mx-auto animate-tear-in">
      <Receipt variant="sealed">
        <ReceiptHeader
          merchant="TAB"
          meta={`Settlement · ${timestamp.toLocaleString("en", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`}
        />

        <div className="space-y-1">
          <ReceiptLine label="Group" value={groupName} />
          <ReceiptLine label="To" value={to} />
          <ReceiptLine label="Amount" value={`$${usd}`} emphasis />
        </div>

        <div className="tear my-4" />

        <div className="space-y-1 text-xs text-ink-mute">
          <div className="flex justify-between">
            <span>Settlement type</span>
            <span className="font-mono">Umbra UTXO (shielded)</span>
          </div>
          <div className="flex justify-between">
            <span>Network</span>
            <span className="font-mono">Solana devnet</span>
          </div>
          {signature && (
            <div className="flex justify-between">
              <span>Tx signature</span>
              <a
                href={explorerUrl(signature)}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline underline-offset-2 hover:text-ink"
              >
                {shortAddress(signature, 6)}
              </a>
            </div>
          )}
        </div>

        <div className="tear my-4" />

        <div className="text-center eyebrow text-ink-mute">Thank you for using Tab.</div>
      </Receipt>
    </div>
  );
}
