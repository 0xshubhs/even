import { cn } from "@/lib/utils";

export function ReceiptLine({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-baseline py-1.5",
        emphasis && "border-t border-dashed border-paper-rim mt-3 pt-3"
      )}
    >
      <span className={cn("text-sm", emphasis ? "font-semibold" : "text-ink-soft")}>{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          emphasis ? "text-lg font-semibold" : "text-base"
        )}
      >
        {value}
      </span>
    </div>
  );
}
