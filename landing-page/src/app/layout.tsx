import type { Metadata } from "next";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/manrope";
import "./tokens.css";
import "./base.css";
import "./globals.css";
import "./opening.css";
import "./plan-ahead.css";

export const metadata: Metadata = {
  title: "Golden Hills Resort | A resort in the making",
  description:
    "Explore the design vision for Golden Hills Resort through artist's impressions of a resort in development.",
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
