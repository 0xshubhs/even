import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ReceiptProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "sealed";
}

export function Receipt({ children, className, variant = "default" }: ReceiptProps) {
  return (
    <div
      className={cn(
        "relative bg-paper-deep border-x border-paper-rim",
        "shadow-[0_2px_0_0_hsl(var(--paper-rim))]",
        className
      )}
    >
      <ReceiptEdge position="top" />
      <div className="px-6 py-5">{children}</div>
      <ReceiptEdge position="bottom" />
      {variant === "sealed" && <SealStamp />}
    </div>
  );
}

function ReceiptEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <svg
      className={cn(
        "block w-full text-paper-deep absolute left-0 pointer-events-none",
        position === "top" ? "-top-[7px]" : "-bottom-[7px] rotate-180"
      )}
      height="8"
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,8 L0,4 Q2.5,0 5,4 T10,4 T15,4 T20,4 T25,4 T30,4 T35,4 T40,4 T45,4 T50,4 T55,4 T60,4 T65,4 T70,4 T75,4 T80,4 T85,4 T90,4 T95,4 T100,4 L100,8 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SealStamp() {
  return (
    <div className="absolute -right-2 top-6 origin-top-right animate-stamp-in z-10 pointer-events-none">
      <div className="border-2 border-privacy text-privacy px-3 py-1.5 bg-paper" style={{ transform: "rotate(-4deg)" }}>
        <div className="font-mono text-eyebrow whitespace-nowrap">Private · Shielded</div>
      </div>
    </div>
  );
}
