import type { Metadata } from "next";
import "./general-sans.css";
import "@fontsource-variable/inter";
import "./tokens.css";
import "./base.css";
import "./globals.css";
import "./home-visual.css";
import "./subpage.css";
import "./subpage-layouts.css";
import "./stay-editorial.css";
import "./membership.css";
import "./dining.css";
import "./opening.css";
import "./plan-ahead.css";
import "./room-detail.css";
import "./home-opening.css";
import "./experiences.css";
import "./gatherings.css";
import "./stay.css";
import { PencilDefs } from "./pencil";
import SketchObserver from "./sketch-observer";

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
      <body>
        <PencilDefs />
        {children}
        <SketchObserver />
      </body>
    </html>
  );
}
