"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGroupStore } from "@/lib/store/group-store";

export function ShareGroupButton({ groupId }: { groupId: string }) {
  const { exportGroup } = useGroupStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"url" | "code" | null>(null);

  const encoded = open ? exportGroup(groupId) : null;
  const url =
    typeof window !== "undefined" && encoded
      ? `${window.location.origin}/import?b=${encoded}`
      : null;

  async function copy(text: string, kind: "url" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // fallback: do nothing, the textarea is still selectable
    }
  }

  return (
    <>
      <Button variant="paper" size="sm" type="button" onClick={() => setOpen((o) => !o)}>
        <Share2 className="w-3.5 h-3.5 mr-1.5" />
        {open ? "Hide share" : "Share group"}
      </Button>

      {open && encoded && (
        <div className="border border-paper-rim bg-paper-deep/60 p-4 mt-3 space-y-3">
          <div className="space-y-1">
            <div className="eyebrow text-ink-mute">Open on another device</div>
            <p className="text-xs text-ink-soft">
              Send this link to a co-member — opening it in their browser will pull this
              group&rsquo;s ledger into their local store. State stays per-device; settlements still
              go through Umbra on devnet.
            </p>
          </div>

          {url && (
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-paper border border-paper-rim font-mono text-xs px-2 py-1.5 outline-none"
              />
              <Button variant="paper" size="sm" type="button" onClick={() => copy(url, "url")}>
                {copied === "url" ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Copied
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5 mr-1.5" /> URL
                  </>
                )}
              </Button>
            </div>
          )}

          <details className="text-xs text-ink-mute">
            <summary className="cursor-pointer hover:text-ink">Or copy raw share code</summary>
            <div className="flex gap-2 items-start mt-2">
              <textarea
                readOnly
                value={encoded}
                onFocus={(e) => e.currentTarget.select()}
                rows={3}
                className="flex-1 bg-paper border border-paper-rim font-mono text-[10px] p-2 outline-none break-all"
              />
              <Button
                variant="paper"
                size="sm"
                type="button"
                onClick={() => copy(encoded, "code")}
              >
                {copied === "code" ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Copied
                  </>
                ) : (
                  "Code"
                )}
              </Button>
            </div>
          </details>
        </div>
      )}
    </>
  );
}
