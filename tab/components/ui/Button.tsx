"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "paper" | "accent";
  size?: "sm" | "default" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-body font-semibold",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          size === "sm" && "h-8 px-3 text-xs",
          size === "default" && "h-10 px-5 text-sm",
          size === "lg" && "h-14 px-8 text-base",
          variant === "primary" && "bg-ink text-paper hover:bg-ink-soft active:bg-ink",
          variant === "paper" && "bg-paper-deep text-ink border border-paper-rim hover:bg-paper-rim",
          variant === "ghost" && "text-ink-soft hover:text-ink hover:bg-paper-deep",
          variant === "accent" && "bg-accent text-paper hover:bg-accent-deep",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
