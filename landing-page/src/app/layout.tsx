import type { Metadata } from "next";
import "./general-sans.css";
import "@fontsource-variable/inter";
import "./tokens.css";
import "./base.css";
import "./globals.css";
import "./opening.css";
import "./plan-ahead.css";

export const metadata: Metadata = {
  title: "Golden Hills Resort | Stay, dine and gather in Biligi",
  description:
    "Explore rooms, cottages, dining, experiences and gatherings at Golden Hills Resort in Anagawadi, Biligi, Karnataka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
