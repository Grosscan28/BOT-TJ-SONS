import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TJ & Sons | Operations Workspace",
  description: "Cleaning operations, quotations, finance and field team portal for TJ & Sons.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
