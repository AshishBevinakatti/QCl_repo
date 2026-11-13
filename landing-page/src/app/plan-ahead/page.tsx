import type { Metadata } from "next";
import LoginPortal from "./login-portal";

export const metadata: Metadata = {
  title: "Guest Sign In & Plan Your Stay | Golden Hills Resort",
  description: "Official guest account access, reservation lookup, and membership portal for Golden Hills Resort, Biligi.",
};

export default function PlanAheadPage() {
  return (
    <main className="login-page-root">
      <LoginPortal />
    </main>
  );
}
