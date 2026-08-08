import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Petronarc | Go-Kart Expense Showcase",
  description:
    "Explore a Petronarc go-kart system by system and understand how the build investment is distributed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
