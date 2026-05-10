"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/Button";
import { Monogram, deriveInitials } from "@/components/group/Monogram";
import { useGroupStore, type Member } from "@/lib/store/group-store";
import { shortAddress } from "@/lib/utils";

export default function NewGroupPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { createGroup } = useGroupStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [walletInput, setWalletInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) return;
    const wallet = publicKey.toBase58();
    setMembers((prev) => {
      if (prev.some((m) => m.wallet === wallet)) return prev;
      return [{ id: "you", handle: "You", wallet }, ...prev];
    });
  }, [connected, publicKey]);

  function addMember() {
    setError(null);
    const wallet = walletInput.trim();
    const handle = handleInput.trim() || shortAddress(wallet);

    if (!wallet) {
      setError("Wallet address is required.");
      return;
    }
    try {
      new PublicKey(wallet);
    } catch {
      setError("Invalid Solana wallet address.");
      return;
    }
    if (members.some((m) => m.wallet === wallet)) {
      setError("That wallet is already a member.");
      return;
    }
    setMembers((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 10), handle, wallet },
    ]);
    setWalletInput("");
    setHandleInput("");
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Group needs a name.");
      return;
    }
    if (members.length < 2) {
      setError("Add at least one other member.");
      return;
    }
    const group = createGroup({
      name: name.trim(),
      cover: deriveInitials(name),
      description: description.trim() || undefined,
      members,
    });
    router.push(`/groups/${group.id}`);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-10">
      <Link href="/groups" className="eyebrow text-ink-mute hover:text-ink">
        ← All groups
      </Link>

      <div className="flex items-end gap-4">
        <Monogram name={name || "?"} size="xl" />
        <div className="space-y-2">
          <div className="eyebrow text-privacy">New group</div>
          <h1 className="font-display text-4xl tracking-tight font-semibold leading-none">
            Start a group
          </h1>
        </div>
      </div>

      <div className="space-y-8">
        <Field
          label="Name"
          placeholder="Goa Trip 2026"
          value={name}
          onChange={setName}
        />
        <Field
          label="Description (optional)"
          placeholder="What is this group for?"
          value={description}
          onChange={setDescription}
        />

        <div className="space-y-3">
          <Label>Members</Label>

          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
            <Field
              label=""
              placeholder="Solana wallet address"
              value={walletInput}
              onChange={setWalletInput}
              mono
            />
            <Field
              label=""
              placeholder="Display name"
              value={handleInput}
              onChange={setHandleInput}
            />
            <Button onClick={addMember} variant="paper" type="button" className="self-end h-[42px]">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <ul className="divide-y divide-dashed divide-paper-rim border-y border-dashed border-paper-rim">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{m.handle}</div>
                  <div className="font-mono text-xs text-ink-mute truncate">
                    {shortAddress(m.wallet, 6)}
                  </div>
                </div>
                {m.id !== "you" && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-ink-mute hover:text-ink"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="border-l-2 border-accent pl-3 text-sm text-accent-deep">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-dashed border-paper-rim">
          <Link href="/groups">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" onClick={submit} type="button">
            Create group
          </Button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow text-ink-mute">{children}</div>;
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  mono = false,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent border-0 border-b border-paper-rim focus:border-ink focus:border-b-2 outline-none py-2 ${
          mono ? "font-mono text-sm" : "text-base"
        } placeholder:text-ink-ghost transition-colors`}
      />
    </div>
  );
}
