"use client";

import { Button, type ButtonProps } from "./Button";
import { cn } from "@/lib/utils";

export function SettleButton({ className, size = "lg", ...props }: ButtonProps) {
  return (
    <Button
      size={size}
      className={cn(
        "bg-accent text-paper hover:bg-accent-deep active:bg-accent-deep",
        "font-semibold uppercase tracking-wider",
        "shadow-[3px_3px_0_0_hsl(var(--ink))]",
        "hover:shadow-[2px_2px_0_0_hsl(var(--ink))] hover:translate-x-[1px] hover:translate-y-[1px]",
        "active:shadow-none active:translate-x-[3px] active:translate-y-[3px]",
        "transition-all duration-100 rounded-none",
        className
      )}
      {...props}
    />
  );
}
