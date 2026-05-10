import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacySealProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function PrivacySeal({ size = "md", label = "Private · Shielded", className }: PrivacySealProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-privacy text-privacy bg-paper font-mono uppercase",
        size === "sm" && "text-[0.6rem] px-2 py-0.5 tracking-wider",
        size === "md" && "text-eyebrow px-3 py-1.5",
        size === "lg" && "text-xs px-4 py-2 tracking-widest",
        className
      )}
    >
      <Lock className="w-3 h-3" strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
}
