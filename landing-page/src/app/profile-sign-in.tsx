"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { portalApi } from "./portal-client";
import { linkSampleMembership, startGuestSession, startSampleSession } from "./guest-session";

/* Sign-in for /profile and the membership page (unit 3.30).
 * Step 1: email or membership ID, with password.
 * Step 2: a one-time code.
 *
 * Email + password is checked by the ERP lead service; a wrong password or an
 * unreachable server is an error, never a pretend session. Membership-ID
 * sign-in and the one-time code have no ERP support yet, so they run as a
 * labelled preview: the code is shown on screen and the session is sample
 * data. */

type Mode = "email" | "member";
const PREVIEW_CODE = "246810";

export default function ProfileSignIn({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("email");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef<null | (() => void)>(null);
  const router = useRouter();
  const pathname = usePathname();

  /* Sign-in is for members in this phase (unit 3.32): once in, they land on
   * their card on the membership page. Already there: just scroll to it. */
  function arrive() {
    if (pathname === "/membership") {
      document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/membership");
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "email" && !/^\S+@\S+\.\S+$/.test(id)) return setError("Enter the email you registered with.");
    if (mode === "member" && !/^[A-Za-z0-9-]{4,}$/.test(id.trim())) return setError("Enter your membership ID, for example GHR-CM-0427.");
    if (password.length < 6) return setError("Your password has at least 6 characters.");

    if (mode === "member") {
      const no = id.trim().toUpperCase();
      pending.current = () => startSampleSession(no);
      setStep("otp");
      return;
    }

    setBusy(true);
    try {
      // Checked against the ERP before the code step; nothing is stored yet.
      const user = await portalApi.login(id.trim(), password);
      portalApi.setStoredUser(null);
      pending.current = () => {
        startGuestSession(user);
        // Members only in this phase. The ERP does not link logins to
        // membership numbers yet, so the booklet attached here is sample.
        linkSampleMembership(user.name, "GHR-CM-SAMPLE");
      };
      setStep("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(/fetch|network/i.test(msg)
        ? "We could not reach the booking system. Please try again in a moment."
        : msg || "That email and password do not match an account.");
    } finally {
      setBusy(false);
    }
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim() !== PREVIEW_CODE) return setError("That code is not right. Check it and try again.");
    pending.current?.();
    arrive();
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("password");
    setId("");
    setError(null);
  };

  return (
    <div className={`psign${compact ? " is-compact" : ""}`}>
      <div className="psign-tabs" role="tablist" aria-label="Sign in with">
        <button type="button" role="tab" aria-selected={mode === "email"} className={mode === "email" ? "is-on" : ""} onClick={() => switchMode("email")}>
          Email
        </button>
        <button type="button" role="tab" aria-selected={mode === "member"} className={mode === "member" ? "is-on" : ""} onClick={() => switchMode("member")}>
          Membership ID
        </button>
      </div>

      {step === "password" ? (
        <form className="psign-form" onSubmit={submitPassword} noValidate>
          <label>
            <span>{mode === "email" ? "Email" : "Membership ID"}</span>
            <input
              type={mode === "email" ? "email" : "text"}
              inputMode={mode === "email" ? "email" : "text"}
              autoComplete={mode === "email" ? "email" : "username"}
              autoCapitalize={mode === "member" ? "characters" : "none"}
              autoCorrect="off"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={mode === "email" ? "you@example.com" : "GHR-CM-0427"}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {mode === "member" && (
            <p className="psign-note">Preview: membership sign-in shows sample data until the ERP links membership IDs.</p>
          )}
          {error && <p className="psign-error" role="alert">{error}</p>}
          <button type="submit" className="psign-btn" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
        </form>
      ) : (
        <form className="psign-form" onSubmit={submitCode} noValidate>
          <label>
            <span>One-time code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="done"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
          </label>
          <p className="psign-note">
            Code delivery by SMS and email is not connected yet. For this preview, the code is <strong>{PREVIEW_CODE}</strong>.
          </p>
          {error && <p className="psign-error" role="alert">{error}</p>}
          <button type="submit" className="psign-btn">Sign in</button>
          <button type="button" className="psign-back" onClick={() => { setStep("password"); setCode(""); setError(null); }}>Back</button>
        </form>
      )}
    </div>
  );
}
