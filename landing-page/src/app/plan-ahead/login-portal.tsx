"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { logo, logoLight, getScene } from "../resort-assets";
import { portalApi, type GuestUser } from "../portal-client";
import { register as keycloakRegister, signIn } from "../guest-auth";
import { signOut as endSession, useSession } from "../guest-session";

const LOGIN_SCENES = [
  { id: "dusk-pool-candidate-p38", title: "Golden Hills Resort Dusk Pool & Cottages" },
  { id: "cottage-pool-terrace-p34", title: "Private Poolside Cottage & Daybed Terrace" },
  { id: "suite-master-bed-p18", title: "Master Suite Room with Jacuzzi Bath" },
  { id: "cottage-entry-p32", title: "Standalone Timber Cottage & Wellness Enclave" },
  { id: "hero-pool-day-desktop-p37", title: "Central Colonnade Infinity Pool & Sun Terrace" },
];

export default function LoginPortal() {
  // Main view mode: "login" or "register"
  const [viewMode, setViewMode] = useState<"login" | "register">("login");

  // Sign In sub-tabs: password | otp | booking
  const [authTab, setAuthTab] = useState<"password" | "otp" | "booking">("password");

  // Automatic 4-second slideshow for the visual image card
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % LOGIN_SCENES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlideIdx]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [enrollPrivilege, setEnrollPrivilege] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP mode state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);

  // Booking reference lookup state
  const [bookingId, setBookingId] = useState("");
  const [guestLastName, setGuestLastName] = useState("");

  // Common UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState<GuestUser | null>(null);

  // Forgot password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const heroScene = getScene("dusk-pool-candidate-p38");

  // Initialize stored session from portalApi on mount
  useEffect(() => {
    const stored = portalApi.getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
  }, []);

  // A real sign-in (Keycloak, gh-guests; D-119) shows the same signed-in card.
  const session = useSession();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session && session.kind !== "sample") setCurrentUser(session.user);
  }, [session]);

  // -------------------------------------------------------------------------
  // Sign In Handler (Connected to portalApi.login)
  // -------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginEmail || !loginEmail.includes("@")) {
      setErrorMsg("Please enter a valid guest email address.");
      return;
    }
    // The password is typed on the secure Golden Hills page (Keycloak), never here.
    setIsLoading(true);
    try {
      await signIn(loginEmail.trim(), "/membership?welcome=1");
    } catch {
      setErrorMsg("We could not reach the sign-in service. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Register Handler (Connected to portalApi.register)
  // -------------------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!regEmail || !regEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    // The account (with its password) is created on the secure Golden Hills page (Keycloak registration).
    setIsLoading(true);
    try {
      await keycloakRegister("/membership?welcome=1");
    } catch {
      setErrorMsg("We could not reach the sign-in service. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Mobile OTP Handlers
  // -------------------------------------------------------------------------
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setSuccessMsg(`A 6-digit verification code was sent to +91 ${cleanPhone}.`);
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const code = otpCode.join("");
    if (code.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: GuestUser = {
        guestId: "GHR-M" + Math.floor(1000 + Math.random() * 9000),
        name: "Guest " + phone.slice(-4),
        email: `guest${phone.slice(-4)}@goldenhills.in`,
        phone: "+91 " + phone,
        token: "otp-jwt-token-" + Date.now(),
      };
      portalApi.setStoredUser(user);
      setCurrentUser(user);
      setSuccessMsg("Mobile verification successful! Welcome to Golden Hills Resort.");
    }, 900);
  };

  // -------------------------------------------------------------------------
  // Booking Reference Lookup Handler
  // -------------------------------------------------------------------------
  const handleBookingLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!bookingId.trim()) {
      setErrorMsg("Please enter your Booking Confirmation ID (e.g. GH-4281).");
      return;
    }
    if (!guestLastName.trim()) {
      setErrorMsg("Please enter the primary guest's last name or registered mobile.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: GuestUser = {
        guestId: bookingId.toUpperCase(),
        name: guestLastName,
        email: "booking." + bookingId.toLowerCase() + "@goldenhills.in",
        phone: "+91 8353 200 100",
        token: "booking-token-" + Date.now(),
      };
      portalApi.setStoredUser(user);
      setCurrentUser(user);
      setSuccessMsg(`Reservation #${bookingId.toUpperCase()} verified for ${guestLastName}.`);
    }, 900);
  };

  // -------------------------------------------------------------------------
  // Sign Out Handler
  // -------------------------------------------------------------------------
  const handleSignOut = () => {
    endSession();   // also ends a Keycloak session (guest-session.ts)
    portalApi.logout();
    setCurrentUser(null);
    setSuccessMsg("You have signed out safely.");
    setErrorMsg("");
  };

  // Quick Demo fill helper
  const handleQuickDemo = (type: "guest" | "member") => {
    setErrorMsg("");
    setSuccessMsg("");
    if (type === "guest") {
      setLoginEmail("guest.retreat@goldenhills.in");
    } else {
      setLoginEmail("privilege.vip@goldenhills.in");
    }
  };

  // Forgot Password Submit
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotSent(true);
    }, 700);
  };

  return (
    <div className="login-screen-wrapper">
      {/* =========================================================================
          LEFT / HERO VISUAL PANEL (Desktop) with 4-Second Slideshow
          ========================================================================= */}
      <div className="login-hero-panel">
        {(() => {
          const currentSlide = LOGIN_SCENES[heroSlideIdx];
          const scene = getScene(currentSlide.id);
          return (
            <Image
              key={currentSlide.id}
              src={scene.src}
              alt={currentSlide.title}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 50vw"
              className="login-hero-image"
            />
          );
        })()}
        <div className="login-hero-scrim" />

        <div className="login-hero-content">
          <div className="login-hero-brand">
            <Link href="/" className="login-hero-logo-link" aria-label="Golden Hills Resort Home">
              <Image
                src={logoLight}
                alt="Golden Hills Resort"
                width={190}
                height={90}
                className="login-hero-logo"
              />
            </Link>
          </div>

          <div className="login-hero-message">
            <span className="login-hero-kicker">
              {viewMode === "register" ? "Create Guest Folio" : "Official Guest & Member Portal"}
            </span>
            <h1 className="login-hero-title">
              {viewMode === "register"
                ? "Join the circle of peaceful hospitality."
                : "Where Northern Karnataka's heritage meets serene luxury."}
            </h1>
            <p className="login-hero-desc">
              {viewMode === "register"
                ? "Register today for personalized villa stays, dining reservations, and complimentary enrollment in the Golden Hills Privilege Club with 180 vouchers."
                : "Manage your villa reservations, unlock 180 Privilege Club vouchers, reserve specialized dining tables, and access personalized stay concierge services."}
            </p>

            <div className="login-hero-perks">
              <div className="login-perk-item">
                <span className="login-perk-dot" />
                <span>Verified Reservation Management &amp; Direct Invoicing</span>
              </div>
              <div className="login-perk-item">
                <span className="login-perk-dot" />
                <span>Privilege Club Digital Voucher Ledger &amp; Dining Passes</span>
              </div>
              <div className="login-perk-item">
                <span className="login-perk-dot" />
                <span>24/7 Resort Concierge &amp; Itinerary Customization</span>
              </div>
            </div>
          </div>

          <div className="login-hero-footer">
            <div className="login-security-indicator">
              <span className="security-icon-dot" />
              <span>Connected to Golden Hills ERP Backend (:8082) · SSL Protected</span>
            </div>
            <Link href="/" className="login-hero-back-link">
              <ArrowLeft size={14} />
              <span>Back to Main Site</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT / AUTHENTICATION FORM PANEL
          ========================================================================= */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Mobile Top Bar */}
          <div className="login-top-bar">
            <Link href="/" className="login-back-button" aria-label="Return to resort homepage">
              <ArrowLeft size={16} />
              <span>Return to Resort</span>
            </Link>
            <div className="login-top-logo">
              <Image
                src={logo}
                alt="Golden Hills"
                width={120}
                height={55}
                className="login-mobile-brand-img"
              />
            </div>
          </div>

          {/* Active Logged-in State Card */}
          {currentUser ? (
            <div className="login-success-card">
              <div className="success-badge-icon">
                <CheckCircle2 size={40} color="var(--color-forest)" />
              </div>
              <span className="login-header-tag">Authenticated Session</span>
              <h3>Welcome, {currentUser.name}</h3>
              <p className="success-user-email">{currentUser.email}</p>
              <p className="success-instruction">
                Your guest profile is active and synced with Golden Hills ERP. You can explore accommodations, check dining options, or review reservations.
              </p>
              <div className="success-actions">
                <Link href="/stay" className="login-primary-btn">
                  <span>Explore Accommodations</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/membership" className="login-secondary-btn">
                  <span>View Privilege Vouchers</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="login-logout-link"
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header with Switcher: Sign In vs Create Account */}
              <div className="login-header">
                <div className="login-mode-switch-row">
                  <span className="login-header-tag">
                    {viewMode === "register" ? "New Guest Registration" : "Guest Sign In"}
                  </span>
                  <div className="login-mode-pills" role="group" aria-label="Sign in or Register">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("login");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className={`login-mode-pill ${viewMode === "login" ? "active" : ""}`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("register");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className={`login-mode-pill ${viewMode === "register" ? "active" : ""}`}
                    >
                      Register
                    </button>
                  </div>
                </div>

                <h2 className="login-title">
                  {viewMode === "register" ? "Create your guest account" : "Sign in to your stay"}
                </h2>
                <p className="login-subtitle">
                  {viewMode === "register"
                    ? "Fill in your details below to register your guest account and access member rates."
                    : "Welcome back. Access your bookings, dining reservations, and member perks."}
                </p>
              </div>

              {/* Status / Error Alerts */}
              {errorMsg && (
                <div className="login-alert login-alert-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="login-alert login-alert-success" role="status">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* =============================================================
                  VIEW 1: REGISTRATION FORM
                  ============================================================= */}
              {viewMode === "register" ? (
                <form onSubmit={handleRegisterSubmit} className="login-form" noValidate>
                  <div className="login-field-group">
                    <label htmlFor="reg-name" className="login-label">
                      Full Name *
                    </label>
                    <div className="login-input-wrapper">
                      <User size={17} className="login-input-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Rohan Sharma"
                        className="login-input"
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label htmlFor="reg-email" className="login-label">
                      Email Address *
                    </label>
                    <div className="login-input-wrapper">
                      <Mail size={17} className="login-input-icon" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="rohan.sharma@example.com"
                        className="login-input"
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label htmlFor="reg-phone" className="login-label">
                      Mobile Number (for SMS &amp; Booking Alerts) *
                    </label>
                    <div className="login-input-wrapper login-phone-wrapper">
                      <span className="login-phone-prefix">🇮🇳 +91</span>
                      <input
                        id="reg-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="login-input login-input-phone"
                      />
                    </div>
                  </div>

                  <p className="login-secure-note">
                    <Lock size={15} /> Next you choose your password on the secure Golden Hills page and confirm your email.
                  </p>

                  {/* Privilege Club Enrollment Opt-in */}
                  <div className="register-privilege-box">
                    <label className="login-checkbox-label">
                      <input
                        type="checkbox"
                        checked={enrollPrivilege}
                        onChange={(e) => setEnrollPrivilege(e.target.checked)}
                        className="login-checkbox"
                      />
                      <span className="privilege-box-text">
                        <strong>Enroll in Golden Hills Privilege Club (Free)</strong>
                        <small>Receive 180 vouchers, member discounts &amp; dining perks</small>
                      </span>
                    </label>
                    <Sparkles size={18} className="privilege-box-sparkle" />
                  </div>

                  <div className="login-options-row">
                    <label className="login-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="login-checkbox"
                      />
                      <span>I agree to the Terms of Service &amp; Privacy Policy</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="login-primary-btn"
                  >
                    {isLoading ? (
                      <span className="login-btn-loading">
                        <span className="login-spinner" />
                        <span>Creating Account...</span>
                      </span>
                    ) : (
                      <>
                        <span>Create Guest Account</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="login-footer-pitch">
                    <p>
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("login");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="login-signup-link-btn"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* =============================================================
                   VIEW 2: SIGN IN FORMS (Tabs: Password, OTP, Booking)
                   ============================================================= */
                <>
                  <div className="login-tabs" role="tablist" aria-label="Sign In Options">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === "password"}
                      onClick={() => {
                        setAuthTab("password");
                        setErrorMsg("");
                      }}
                      className={`login-tab ${authTab === "password" ? "active" : ""}`}
                    >
                      <Mail size={15} />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === "otp"}
                      disabled
                      aria-disabled="true"
                      title="Coming soon"
                      onClick={() => {
                        setAuthTab("otp");
                        setErrorMsg("");
                      }}
                      className={`login-tab is-soon ${authTab === "otp" ? "active" : ""}`}
                    >
                      <Phone size={15} />
                      <span>Mobile OTP · Coming soon</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === "booking"}
                      disabled
                      aria-disabled="true"
                      title="Coming soon"
                      onClick={() => {
                        setAuthTab("booking");
                        setErrorMsg("");
                      }}
                      className={`login-tab is-soon ${authTab === "booking" ? "active" : ""}`}
                    >
                      <Search size={15} />
                      <span>Find Booking · Coming soon</span>
                    </button>
                  </div>

                  {/* TAB 1: Password Form */}
                  {authTab === "password" && (
                    <form onSubmit={handleLoginSubmit} className="login-form" noValidate>
                      <div className="login-field-group">
                        <label htmlFor="login-email" className="login-label">
                          Email Address
                        </label>
                        <div className="login-input-wrapper">
                          <Mail size={17} className="login-input-icon" />
                          <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="guest@example.com"
                            className="login-input"
                          />
                        </div>
                      </div>

                      <div className="login-field-group">
                        <div className="login-label-row">
                          <span className="login-label">Password</span>
                          <button
                            type="button"
                            onClick={() => void signIn(loginEmail.trim(), "/membership?welcome=1")}
                            className="login-forgot-link"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <p className="login-secure-note">
                          <Lock size={15} /> Next, on the secure Golden Hills page, enter the password you set from your welcome email.
                        </p>
                      </div>

                      <div className="login-options-row">
                        <label className="login-checkbox-label">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="login-checkbox"
                          />
                          <span>Remember this device for 30 days</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="login-primary-btn"
                      >
                        {isLoading ? (
                          <span className="login-btn-loading">
                            <span className="login-spinner" />
                            <span>Verifying credentials...</span>
                          </span>
                        ) : (
                          <>
                            <span>Sign In to Guest Portal</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>

                      <div className="login-demo-bar">
                        <span className="demo-label">Quick Demo Fill:</span>
                        <button
                          type="button"
                          onClick={() => handleQuickDemo("guest")}
                          className="demo-chip"
                        >
                          Guest Demo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDemo("member")}
                          className="demo-chip"
                        >
                          Privilege VIP
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: Mobile OTP Form */}
                  {authTab === "otp" && (
                    <form
                      onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                      className="login-form"
                      noValidate
                    >
                      {!otpSent ? (
                        <>
                          <div className="login-field-group">
                            <label htmlFor="login-phone" className="login-label">
                              Mobile Number
                            </label>
                            <div className="login-input-wrapper login-phone-wrapper">
                              <span className="login-phone-prefix">🇮🇳 +91</span>
                              <input
                                id="login-phone"
                                type="tel"
                                maxLength={10}
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="98765 43210"
                                className="login-input login-input-phone"
                              />
                            </div>
                            <span className="login-field-hint">
                              We will send a 6-digit one-time code to this number.
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="login-primary-btn"
                          >
                            {isLoading ? (
                              <span className="login-btn-loading">
                                <span className="login-spinner" />
                                <span>Sending OTP...</span>
                              </span>
                            ) : (
                              <>
                                <span>Send Verification Code</span>
                                <ArrowRight size={16} />
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="login-field-group">
                            <div className="login-label-row">
                              <label className="login-label">Enter 6-Digit Code</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpSent(false);
                                  setOtpCode(["", "", "", "", "", ""]);
                                }}
                                className="login-forgot-link"
                              >
                                Change Number
                              </button>
                            </div>
                            <div className="login-otp-grid">
                              {otpCode.map((digit, idx) => (
                                <input
                                  key={idx}
                                  id={`otp-${idx}`}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    const next = [...otpCode];
                                    next[idx] = val ? val[0] : "";
                                    setOtpCode(next);
                                    if (val && idx < 5) {
                                      const nextField = document.getElementById(`otp-${idx + 1}`);
                                      nextField?.focus();
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
                                      const prevField = document.getElementById(`otp-${idx - 1}`);
                                      prevField?.focus();
                                    }
                                  }}
                                  className="login-otp-box"
                                />
                              ))}
                            </div>
                            <div className="otp-resend-row">
                              <span>Didn&apos;t receive code?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSuccessMsg("New 6-digit code resent!");
                                }}
                                className="login-resend-btn"
                              >
                                Resend Code
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="login-primary-btn"
                          >
                            {isLoading ? (
                              <span className="login-btn-loading">
                                <span className="login-spinner" />
                                <span>Verifying...</span>
                              </span>
                            ) : (
                              <>
                                <span>Verify &amp; Sign In</span>
                                <ArrowRight size={16} />
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </form>
                  )}

                  {/* TAB 3: Booking Lookup */}
                  {authTab === "booking" && (
                    <form onSubmit={handleBookingLookup} className="login-form" noValidate>
                      <div className="login-field-group">
                        <label htmlFor="lookup-id" className="login-label">
                          Booking Confirmation Number
                        </label>
                        <div className="login-input-wrapper">
                          <KeyRound size={17} className="login-input-icon" />
                          <input
                            id="lookup-id"
                            type="text"
                            required
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            placeholder="e.g. GH-84291"
                            className="login-input"
                          />
                        </div>
                      </div>

                      <div className="login-field-group">
                        <label htmlFor="lookup-name" className="login-label">
                          Guest Last Name or Registered Phone
                        </label>
                        <div className="login-input-wrapper">
                          <Search size={17} className="login-input-icon" />
                          <input
                            id="lookup-name"
                            type="text"
                            required
                            value={guestLastName}
                            onChange={(e) => setGuestLastName(e.target.value)}
                            placeholder="e.g. Sharma or 9876543210"
                            className="login-input"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="login-primary-btn"
                      >
                        {isLoading ? (
                          <span className="login-btn-loading">
                            <span className="login-spinner" />
                            <span>Searching Reservation...</span>
                          </span>
                        ) : (
                          <>
                            <span>Find My Reservation</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Social SSO Divider */}
                  <div className="login-divider">
                    <span>or continue with</span>
                  </div>

                  <div className="login-social-grid">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                          setIsLoading(false);
                          const user: GuestUser = {
                            guestId: "GHR-G" + Math.floor(1000 + Math.random() * 9000),
                            name: "Google Guest",
                            email: "google.guest@goldenhills.in",
                            phone: "+91 98765 00001",
                            token: "google-token-" + Date.now(),
                          };
                          portalApi.setStoredUser(user);
                          setCurrentUser(user);
                          setSuccessMsg("Signed in with Google account.");
                        }, 600);
                      }}
                      className="login-social-btn"
                      aria-label="Continue with Google"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9c-.3-.7-.5-1.5-.5-2.2z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.8 7.4 23 12 23z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                          setIsLoading(false);
                          const user: GuestUser = {
                            guestId: "GHR-A" + Math.floor(1000 + Math.random() * 9000),
                            name: "Apple Guest",
                            email: "apple.guest@goldenhills.in",
                            phone: "+91 98765 00002",
                            token: "apple-token-" + Date.now(),
                          };
                          portalApi.setStoredUser(user);
                          setCurrentUser(user);
                          setSuccessMsg("Signed in with Apple ID.");
                        }, 600);
                      }}
                      className="login-social-btn"
                      aria-label="Continue with Apple"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.79 1.44-.59.69-1.11 1.83-.97 2.94 1.07.08 2.15-.54 2.77-1.28" />
                      </svg>
                      <span>Apple</span>
                    </button>
                  </div>

                  {/* New Guest Registration Callout Card */}
                  <div className="login-register-prompt-card">
                    <div className="register-prompt-content">
                      <div className="register-prompt-header">
                        <span className="register-prompt-badge">New Guest?</span>
                        <h4 className="register-prompt-title">Don&apos;t have an account yet?</h4>
                      </div>
                      <p className="register-prompt-desc">
                        Register in 30 seconds to manage reservations, check in online, and receive 180 complimentary Privilege Club vouchers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("register");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="login-register-now-btn"
                      aria-label="Register a new guest account"
                    >
                      <UserPlus size={16} />
                      <span>Register Now</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="login-footer-pitch">
                    <div className="login-concierge-help">
                      <span>Need assistance with your reservation?</span>
                      <a href="tel:+918353200100" className="login-phone-link">
                        Concierge Desk: +91 8353 200 100
                      </a>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Privacy & Trust Badge */}
          <div className="login-trust-bar">
            <span>🛡️ Protected by Golden Hills Hospitality Security Protocol · SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FORGOT PASSWORD MODAL
          ========================================================================= */}
      {forgotPasswordOpen && (
        <div className="login-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <div className="login-modal-card">
            <h3 id="forgot-title">Reset Your Password</h3>
            <p>
              Enter the email address registered with your Golden Hills stay or Privilege Club membership. We will send you a secure password reset link.
            </p>

            {forgotSent ? (
              <div className="modal-sent-state">
                <CheckCircle2 size={32} color="var(--color-forest)" />
                <p>
                  Reset instructions have been dispatched to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setForgotSent(false);
                  }}
                  className="login-primary-btn"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="modal-form">
                <div className="login-field-group">
                  <label htmlFor="forgot-email" className="login-label">
                    Registered Email
                  </label>
                  <div className="login-input-wrapper">
                    <Mail size={17} className="login-input-icon" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="guest@example.com"
                      className="login-input"
                    />
                  </div>
                </div>
                <div className="modal-btn-row">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="modal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="modal-submit-btn"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
