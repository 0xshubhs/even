import { cn } from "@/lib/utils";

interface MonogramProps {
  /** Group name; first 1-2 alphanumeric characters are used. */
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Monogram({ name, size = "md", className }: MonogramProps) {
  const initials = deriveInitials(name);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-paper-deep border border-paper-rim font-display font-semibold tracking-tight text-ink select-none shrink-0",
        size === "sm" && "w-8 h-8 text-base",
        size === "md" && "w-12 h-12 text-xl",
        size === "lg" && "w-16 h-16 text-3xl",
        size === "xl" && "w-20 h-20 text-4xl",
        className
      )}
      aria-hidden
    >
      {initials || "·"}
    </div>
  );
}

export function deriveInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
