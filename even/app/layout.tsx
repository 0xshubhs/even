import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Even — Split anything. Settle privately.",
  description:
    "Track shared expenses with anyone. Settle in stablecoins on Solana, with the amounts shielded so members don't see each other's wallet histories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink font-body min-h-screen antialiased">
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
