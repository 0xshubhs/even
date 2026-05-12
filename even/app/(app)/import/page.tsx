"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt } from "@/components/receipt/Receipt";
import { Button } from "@/components/ui/Button";
import { useGroupStore } from "@/lib/store/group-store";

export default function ImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportInner />
    </Suspense>
  );
}

function ImportInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { importBundle } = useGroupStore();
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bundleFromUrl = useMemo(() => search.get("b") ?? "", [search]);

  useEffect(() => {
    if (!bundleFromUrl) return;
    const result = importBundle(bundleFromUrl);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.replace(`/groups/${result.groupId}`);
  }, [bundleFromUrl, importBundle, router]);

  function onPasteImport() {
    setError(null);
    const trimmed = pasted.trim();
    if (!trimmed) {
      setError("Paste a share code first.");
      return;
    }
    // Allow pasting full /import?b=... URLs too.
    const match = trimmed.match(/[?&]b=([^&\s]+)/);
    const payload = match ? match[1] : trimmed;
    const result = importBundle(payload);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/groups/${result.groupId}`);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-10">
      <Link href="/groups" className="eyebrow text-ink-mute hover:text-ink">
        ← All groups
      </Link>

      <div className="space-y-2">
        <div className="eyebrow text-privacy">Import</div>
        <h1 className="font-display text-4xl tracking-tight font-semibold">
          Open a shared group
        </h1>
        <p className="text-ink-mute">
          Paste a share code from another device to pull its group, expenses, and settlement
          history into this browser.
        </p>
      </div>

      <Receipt>
        <div className="space-y-3">
          <label className="eyebrow text-ink-mute">Share code or URL</label>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste here…"
            rows={5}
            className="w-full bg-paper-deep border border-paper-rim font-mono text-xs p-3 outline-none focus:border-ink"
          />
          {error && (
            <div className="border-l-2 border-accent pl-3 text-sm text-accent-deep">{error}</div>
          )}
          <div className="flex justify-end">
            <Button variant="primary" onClick={onPasteImport} type="button">
              Import
            </Button>
          </div>
        </div>
      </Receipt>
    </div>
  );
}
