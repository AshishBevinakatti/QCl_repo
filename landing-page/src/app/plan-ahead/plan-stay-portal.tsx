"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
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
  Calendar,
  Users,
  LogOut,
  BedDouble,
  Compass,
} from "lucide-react";
import { logoLight, getScene, impression } from "../resort-assets";
import { portalApi, type GuestUser, type InquiryRecord, type InquirySubmission } from "../portal-client";
import { register as keycloakRegister, signIn } from "../guest-auth";
import { signOut as endSession, useSession } from "../guest-session";
import { useMotionPreference } from "../motion-provider";

const ROOM_OPTIONS = [
  "Private Pool Cottage",
  "Suite Room with Jacuzzi",
  "Wooden Cottage",
  "Dormitory Cottage (10–12 guests)",
  "Premium Room — Queen",
  "Premium Room — Twin",
];

const SCENE_STORY = [
  { id: "cottage-pool-terrace-p34", label: "Poolside Villa", title: "Private Pool Villa", caption: "Direct water access and covered timber deck" },
  { id: "suite-master-bed-p18", label: "Master Suite", title: "Suite Room with Jacuzzi", caption: "Panoramic garden glazing and whirlpool bath" },
  { id: "cottage-entry-p32", label: "Timber Cottage", title: "Standalone Timber Cottage", caption: "High rafters in the quiet wellness enclave" },
  { id: "dusk-pool-candidate-p38", label: "Sunset Reflection", title: "Biligi Ridge Twilight", caption: "Reflections across the central resort courtyard" },
  { id: "hero-pool-day-desktop-p37", label: "Daylight Colonnade", title: "Central Infinity Pool", caption: "Natural stone colonnade and swimming pool" },
];

export default function PlanStayPortal() {
  const reduced = useMotionPreference();

  // Primary mode: "login" | "register" | "reserve"
  const [portalMode, setPortalMode] = useState<"login" | "register" | "reserve">("login");

  // Sign In sub-tabs: "password" | "otp" | "booking"
  const [authTab, setAuthTab] = useState<"password" | "otp" | "booking">("password");

  // Visual Storytelling Scene State with Automatic 4-Second Slideshow
  const [sceneIdx, setSceneIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Automatic 4-second slideshow effect
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setSceneIdx((prev) => (prev + 1) % SCENE_STORY.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, sceneIdx]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [enrollPrivilege, setEnrollPrivilege] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Mobile OTP Mode
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);

  // Booking Lookup Mode
  const [bookingId, setBookingId] = useState("");
  const [guestLastName, setGuestLastName] = useState("");

  // Reservation / Inquiry Form
  const [inqName, setInqName] = useState("");
  const [inqEmail, setInqEmail] = useState("");
  const [inqPhone, setInqPhone] = useState("");
  const [checkinDate, setCheckinDate] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  const [roomCategory, setRoomCategory] = useState(ROOM_OPTIONS[0]);
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [reservationSuccess, setReservationSuccess] = useState<InquiryRecord | null>(null);

  // Guest Folio Inquiries
  const [userInquiries, setUserInquiries] = useState<InquiryRecord[]>([]);

  // Forgot Password Modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // A real sign-in (Keycloak, gh-guests; D-119) fills the same folio; a Gold Member's card shows their number.
  const session = useSession();
  const realMembership = session?.membership?.real ? session.membership : null;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session && session.kind !== "sample") setCurrentUser(session.user);
  }, [session]);

  // Check stored user on mount
  useEffect(() => {
    const stored = portalApi.getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      fetchUserInquiries(stored.token);
    }
  }, []);

  const fetchUserInquiries = async (token: string) => {
    try {
      const list = await portalApi.getMyInquiries(token);
      setUserInquiries(list);
    } catch {
      // Offline fallback: keep empty or local sample
    }
  };

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginEmail || !loginEmail.includes("@")) {
      setErrorMsg("Please enter a valid guest email.");
      return;
    }
    // The password is typed on the secure Golden Hills page (Keycloak), never here; no offline stand-in session.
    setIsLoading(true);
    try {
      await signIn(loginEmail.trim(), "/membership?welcome=1");
    } catch {
      setErrorMsg("We could not reach the sign-in service. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!regEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
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

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const nameToUse = currentUser?.name || inqName;
    const emailToUse = currentUser?.email || inqEmail;
    const phoneToUse = currentUser?.phone || inqPhone;

    if (!nameToUse.trim()) {
      setErrorMsg("Please provide your name.");
      return;
    }
    if (!emailToUse.includes("@")) {
      setErrorMsg("Please provide a valid email.");
      return;
    }
    if (!checkinDate || !checkoutDate) {
      setErrorMsg("Please select your check-in and check-out dates.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: InquirySubmission = {
        name: nameToUse.trim(),
        email: emailToUse.trim(),
        phone: phoneToUse.trim() || "+91 98765 43210",
        checkinDate,
        checkoutDate,
        roomCategory,
        guestCount,
        notes,
      };

      const record = await portalApi.submitInquiry(payload, currentUser?.token);
      setReservationSuccess(record);
      setSuccessMsg(`Reservation inquiry #${record.publicReference || "GH-77821"} dispatched directly to ERP sales desk.`);
    } catch (err: unknown) {
      // Offline fallback
      const mockRecord: InquiryRecord = {
        id: "inq-" + Date.now(),
        publicReference: "GH-" + Math.floor(10000 + Math.random() * 90000),
        name: nameToUse,
        email: emailToUse,
        phone: phoneToUse,
        checkinDate,
        checkoutDate,
        roomCategory,
        guestCount,
        notes,
        status: "NEW",
        priority: "HIGH",
        slaDeadline: new Date(Date.now() + 86400000).toISOString(),
        slaBreached: false,
        createdAt: new Date().toISOString(),
      };
      setReservationSuccess(mockRecord);
      setSuccessMsg(`Reservation inquiry #${mockRecord.publicReference} confirmed (Offline Preview).`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    endSession();   // also ends a Keycloak session (guest-session.ts)
    portalApi.logout();
    setCurrentUser(null);
    setUserInquiries([]);
    setSuccessMsg("Signed out safely.");
    setErrorMsg("");
  };

  const handleQuickDemo = (type: "guest" | "member") => {
    setErrorMsg("");
    setSuccessMsg("");
    if (type === "guest") {
      setLoginEmail("guest.retreat@goldenhills.in");
    } else {
      setLoginEmail("privilege.vip@goldenhills.in");
    }
  };

  const activeSceneData = SCENE_STORY[sceneIdx];
  const activeSceneAsset = getScene(activeSceneData.id);

  // Spring animation configs (Emil Kowalski principles)
  const springConfig = { type: "spring" as const, stiffness: 420, damping: 30 };
  const smoothEase = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="plan-portal-stage">
      <div className="plan-portal-shell">
        {/* ===================================================================
            LEFT / INTERACTIVE GUEST PORTAL
            =================================================================== */}
        <div className="plan-form-column">
          {/* Header & Bodoni Title */}
          <div className="plan-form-header">
            <span className="plan-kicker-badge">
              <Sparkles size={13} className="plan-kicker-icon" />
              <span>Official Guest Access · ERP Integrated</span>
            </span>
            <h1 className="plan-main-title">
              {currentUser
                ? `Welcome, ${currentUser.name}`
                : portalMode === "reserve"
                ? "Reserve Your Sanctuary"
                : portalMode === "register"
                ? "Join Golden Hills Club"
                : "Sign In to Your Stay"}
            </h1>
            <p className="plan-main-subtitle">
              {currentUser
                ? "Manage your active reservations, digital folio, and concierge requests."
                : portalMode === "reserve"
                ? "Check real-time availability and dispatch reservation requests directly to the resort sales desk."
                : portalMode === "register"
                ? "Create your guest profile in 30 seconds to unlock 180 Privilege Club passes."
                : "Access your booking folio, view meal plan allocations, and track stay requests."}
            </p>
          </div>

          {/* Primary Mode Tabs with Spring Indicator */}
          {!currentUser && (
            <div className="plan-mode-switcher" role="tablist" aria-label="Portal Mode">
              <button
                type="button"
                className={`plan-mode-tab ${portalMode === "login" ? "is-active" : ""}`}
                onClick={() => {
                  setPortalMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                role="tab"
                aria-selected={portalMode === "login"}
              >
                {portalMode === "login" && (
                  <motion.span
                    layoutId="planModePill"
                    className="plan-mode-pill-bg"
                    transition={springConfig}
                  />
                )}
                <User size={14} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                className={`plan-mode-tab ${portalMode === "register" ? "is-active" : ""}`}
                onClick={() => {
                  setPortalMode("register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                role="tab"
                aria-selected={portalMode === "register"}
              >
                {portalMode === "register" && (
                  <motion.span
                    layoutId="planModePill"
                    className="plan-mode-pill-bg"
                    transition={springConfig}
                  />
                )}
                <UserPlus size={14} />
                <span>Register</span>
              </button>

              <button
                type="button"
                className={`plan-mode-tab ${portalMode === "reserve" ? "is-active" : ""}`}
                onClick={() => {
                  setPortalMode("reserve");
                  setErrorMsg("");
                  setSuccessMsg("");
                  setReservationSuccess(null);
                }}
                role="tab"
                aria-selected={portalMode === "reserve"}
              >
                {portalMode === "reserve" && (
                  <motion.span
                    layoutId="planModePill"
                    className="plan-mode-pill-bg"
                    transition={springConfig}
                  />
                )}
                <Calendar size={14} />
                <span>Reserve Stay</span>
              </button>
            </div>
          )}

          {/* Banners */}
          {errorMsg && (
            <motion.div
              className="plan-alert-banner is-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              className="plan-alert-banner is-success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* =================================================================
              LOGGED IN GUEST FOLIO
              ================================================================= */}
          {currentUser ? (
            <motion.div
              className="plan-folio-card"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: smoothEase }}
            >
              <div className="plan-folio-user-row">
                <div className="plan-folio-avatar">
                  <span>{currentUser.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="plan-folio-info">
                  <h3>{currentUser.name}</h3>
                  <p>{currentUser.email} · {currentUser.phone}</p>
                </div>
                <span className="plan-folio-tier">{realMembership ? `Gold Member · ${realMembership.membershipNo}` : "Privilege Member"}</span>
              </div>

              <div className="plan-folio-stats">
                <div className="plan-folio-stat">
                  <span className="plan-stat-num">{realMembership
                    ? Object.values(realMembership.used).reduce((left, u) => left - u.vouchers - u.coupons, 180)
                    : 180}</span>
                  <span className="plan-stat-title">{realMembership ? "Privileges Left" : "Club Vouchers"}</span>
                </div>
                <div className="plan-folio-stat">
                  <span className="plan-stat-num">{userInquiries.length}</span>
                  <span className="plan-stat-title">Stay Requests</span>
                </div>
                <div className="plan-folio-stat">
                  <span className="plan-stat-num">24×7</span>
                  <span className="plan-stat-title">Concierge Desk</span>
                </div>
              </div>

              {/* Action row */}
              <div className="plan-folio-actions">
                <button
                  type="button"
                  onClick={() => {
                    setPortalMode("reserve");
                    setReservationSuccess(null);
                  }}
                  className="plan-primary-action"
                >
                  <Calendar size={15} />
                  <span>New Stay Reservation</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="plan-secondary-action"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="plan-form-body">
              <AnimatePresence mode="wait">
                {/* -------------------------------------------------------------
                    1. SIGN IN MODE
                    ------------------------------------------------------------- */}
                {portalMode === "login" && (
                  <motion.div
                    key="login-mode"
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: smoothEase }}
                  >
                    {/* Sub-tabs: Password / OTP / Booking Reference */}
                    <div className="plan-subtabs">
                      <button
                        type="button"
                        className={`plan-subtab-btn ${authTab === "password" ? "is-active" : ""}`}
                        onClick={() => setAuthTab("password")}
                      >
                        <Lock size={13} />
                        <span>Email</span>
                      </button>
                      <button
                        type="button"
                        className={`plan-subtab-btn is-soon ${authTab === "otp" ? "is-active" : ""}`}
                        onClick={() => setAuthTab("otp")}
                        disabled
                        aria-disabled="true"
                        title="Coming soon"
                      >
                        <Phone size={13} />
                        <span>Mobile OTP · Coming soon</span>
                      </button>
                      <button
                        type="button"
                        className={`plan-subtab-btn is-soon ${authTab === "booking" ? "is-active" : ""}`}
                        onClick={() => setAuthTab("booking")}
                        disabled
                        aria-disabled="true"
                        title="Coming soon"
                      >
                        <KeyRound size={13} />
                        <span>Booking ID · Coming soon</span>
                      </button>
                    </div>

                    {authTab === "password" && (
                      <form onSubmit={handleLogin} className="plan-auth-form">
                        <div className="plan-field">
                          <label htmlFor="login-email">Guest Email Address</label>
                          <div className="plan-input-wrap">
                            <Mail size={16} className="plan-icon" />
                            <input
                              id="login-email"
                              type="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="guest@example.com"
                              className="plan-input"
                            />
                          </div>
                        </div>

                        <div className="plan-field">
                          <div className="plan-field-between">
                            <span>Password</span>
                            <button
                              type="button"
                              onClick={() => void signIn(loginEmail.trim(), "/membership?welcome=1")}
                              className="plan-text-link"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <p className="login-secure-note">
                            <Lock size={15} /> Next, on the secure Golden Hills page, enter the password you set from your welcome email.
                          </p>
                        </div>

                        <div className="plan-options-row">
                          <label className="plan-check-label">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="plan-check-input"
                            />
                            <span>Keep me signed in</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="plan-submit-btn"
                        >
                          {isLoading ? "Authenticating..." : "Sign In to Guest Folio"}
                          <ArrowRight size={15} />
                        </button>

                        {/* Quick Demo Fill Helper */}
                        <div className="plan-demo-helpers">
                          <span>Quick Demo:</span>
                          <button
                            type="button"
                            onClick={() => handleQuickDemo("guest")}
                            className="plan-demo-pill"
                          >
                            Retreat Guest
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDemo("member")}
                            className="plan-demo-pill"
                          >
                            Club Member
                          </button>
                        </div>
                      </form>
                    )}

                    {authTab === "otp" && (
                      <div className="plan-auth-form">
                        <div className="plan-field">
                          <label htmlFor="phone-otp">Registered Mobile Number</label>
                          <div className="plan-input-wrap">
                            <Phone size={16} className="plan-icon" />
                            <input
                              id="phone-otp"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="plan-input"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(true);
                            setSuccessMsg("Verification code dispatched via SMS.");
                          }}
                          className="plan-submit-btn"
                        >
                          Send 6-Digit OTP
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    )}

                    {authTab === "booking" && (
                      <div className="plan-auth-form">
                        <div className="plan-field">
                          <label htmlFor="booking-ref">Reservation Reference</label>
                          <div className="plan-input-wrap">
                            <KeyRound size={16} className="plan-icon" />
                            <input
                              id="booking-ref"
                              type="text"
                              value={bookingId}
                              onChange={(e) => setBookingId(e.target.value)}
                              placeholder="e.g. GH-84291"
                              className="plan-input"
                            />
                          </div>
                        </div>
                        <div className="plan-field">
                          <label htmlFor="booking-name">Guest Last Name</label>
                          <div className="plan-input-wrap">
                            <Search size={16} className="plan-icon" />
                            <input
                              id="booking-name"
                              type="text"
                              value={guestLastName}
                              onChange={(e) => setGuestLastName(e.target.value)}
                              placeholder="e.g. Sharma"
                              className="plan-input"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccessMsg(`Reservation #${bookingId || "GH-84291"} verified for guest.`);
                          }}
                          className="plan-submit-btn"
                        >
                          Find My Reservation
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    )}

                    {/* New Guest Register Prompt */}
                    <div className="plan-switch-prompt">
                      <span>Don&apos;t have an account yet?</span>
                      <button
                        type="button"
                        onClick={() => setPortalMode("register")}
                        className="plan-switch-action"
                      >
                        Register now
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------------------------------
                    2. REGISTER MODE
                    ------------------------------------------------------------- */}
                {portalMode === "register" && (
                  <motion.div
                    key="register-mode"
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: smoothEase }}
                  >
                    <form onSubmit={handleRegister} className="plan-auth-form">
                      <div className="plan-field">
                        <label htmlFor="reg-name">Full Name</label>
                        <div className="plan-input-wrap">
                          <User size={16} className="plan-icon" />
                          <input
                            id="reg-name"
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Ananya Sharma"
                            className="plan-input"
                          />
                        </div>
                      </div>

                      <div className="plan-field-row">
                        <div className="plan-field">
                          <label htmlFor="reg-email">Email Address</label>
                          <div className="plan-input-wrap">
                            <Mail size={16} className="plan-icon" />
                            <input
                              id="reg-email"
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="ananya@example.com"
                              className="plan-input"
                            />
                          </div>
                        </div>

                        <div className="plan-field">
                          <label htmlFor="reg-phone">Mobile Number</label>
                          <div className="plan-input-wrap">
                            <Phone size={16} className="plan-icon" />
                            <input
                              id="reg-phone"
                              type="tel"
                              required
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="9876543210"
                              className="plan-input"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="login-secure-note">
                        <Lock size={15} /> Next you choose your password on the secure Golden Hills page and confirm your email.
                      </p>

                      <div className="plan-options-row">
                        <label className="plan-check-label">
                          <input
                            type="checkbox"
                            checked={enrollPrivilege}
                            onChange={(e) => setEnrollPrivilege(e.target.checked)}
                            className="plan-check-input"
                          />
                          <span>Enroll me in Golden Hills Privilege Club (180 Vouchers)</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="plan-submit-btn"
                      >
                        {isLoading ? "Creating Guest Account..." : "Create Guest Account"}
                        <ArrowRight size={15} />
                      </button>

                      <div className="plan-switch-prompt">
                        <span>Already have an account?</span>
                        <button
                          type="button"
                          onClick={() => setPortalMode("login")}
                          className="plan-switch-action"
                        >
                          Sign in
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* -------------------------------------------------------------
                    3. RESERVE STAY MODE (Fast ERP Reservation Inquiry)
                    ------------------------------------------------------------- */}
                {portalMode === "reserve" && (
                  <motion.div
                    key="reserve-mode"
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={reduced ? undefined : { opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: smoothEase }}
                  >
                    {reservationSuccess ? (
                      <div className="plan-reserve-confirmed">
                        <CheckCircle2 size={40} className="plan-confirmed-icon" />
                        <h3>Reservation Dispatched</h3>
                        <p>
                          Your reservation inquiry reference is{" "}
                          <strong>#{reservationSuccess.publicReference || "GH-84920"}</strong>.
                        </p>
                        <p className="plan-confirmed-sub">
                          The front desk sales team will verify availability for <strong>{reservationSuccess.roomCategory}</strong> and send your confirmed itinerary &amp; invoice.
                        </p>
                        <button
                          type="button"
                          onClick={() => setReservationSuccess(null)}
                          className="plan-submit-btn"
                          style={{ marginTop: "16px" }}
                        >
                          Submit Another Stay Inquiry
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleReservation} className="plan-auth-form">
                        {!currentUser && (
                          <div className="plan-field-row">
                            <div className="plan-field">
                              <label htmlFor="inq-name">Your Full Name</label>
                              <div className="plan-input-wrap">
                                <User size={16} className="plan-icon" />
                                <input
                                  id="inq-name"
                                  type="text"
                                  required
                                  value={inqName}
                                  onChange={(e) => setInqName(e.target.value)}
                                  placeholder="e.g. Rahul Patil"
                                  className="plan-input"
                                />
                              </div>
                            </div>
                            <div className="plan-field">
                              <label htmlFor="inq-phone">Contact Number</label>
                              <div className="plan-input-wrap">
                                <Phone size={16} className="plan-icon" />
                                <input
                                  id="inq-phone"
                                  type="tel"
                                  required
                                  value={inqPhone}
                                  onChange={(e) => setInqPhone(e.target.value)}
                                  placeholder="9876543210"
                                  className="plan-input"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="plan-field-row">
                          <div className="plan-field">
                            <label htmlFor="inq-checkin">Check-in Date</label>
                            <input
                              id="inq-checkin"
                              type="date"
                              required
                              value={checkinDate}
                              onChange={(e) => setCheckinDate(e.target.value)}
                              className="plan-input plan-date-input"
                            />
                          </div>
                          <div className="plan-field">
                            <label htmlFor="inq-checkout">Check-out Date</label>
                            <input
                              id="inq-checkout"
                              type="date"
                              required
                              value={checkoutDate}
                              onChange={(e) => setCheckoutDate(e.target.value)}
                              className="plan-input plan-date-input"
                            />
                          </div>
                        </div>

                        <div className="plan-field-row">
                          <div className="plan-field">
                            <label htmlFor="inq-room">Accommodation Category</label>
                            <select
                              id="inq-room"
                              value={roomCategory}
                              onChange={(e) => setRoomCategory(e.target.value)}
                              className="plan-select"
                            >
                              {ROOM_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="plan-field">
                            <label htmlFor="inq-guests">Guests</label>
                            <select
                              id="inq-guests"
                              value={guestCount}
                              onChange={(e) => setGuestCount(Number(e.target.value))}
                              className="plan-select"
                            >
                              <option value={1}>1 Guest</option>
                              <option value={2}>2 Guests (Standard)</option>
                              <option value={3}>3 Guests (Extra Bed)</option>
                              <option value={4}>4 Guests</option>
                              <option value={6}>6+ Guests</option>
                              <option value={12}>10–12 Guests (Full Dormitory Unit)</option>
                            </select>
                          </div>
                        </div>

                        <div className="plan-field">
                          <label htmlFor="inq-notes">Special Requests / Meal Plan Preference</label>
                          <textarea
                            id="inq-notes"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. CP plan with breakfast, ground floor preference, pet-friendly cottage..."
                            className="plan-textarea"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="plan-submit-btn"
                        >
                          {isLoading ? "Submitting Inquiry to ERP..." : "Check Availability & Dispatch"}
                          <ArrowRight size={15} />
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Secure Protocol Badge */}
          <div className="plan-security-footer">
            <ShieldCheck size={14} className="plan-security-icon" />
            <span>256-Bit SSL Encrypted · Direct ERP Sales Verification Protocol</span>
          </div>
        </div>

        {/* ===================================================================
            RIGHT / VISUAL STORYTELLING CANVAS
            Automatic 4-second slideshow with interactive angle controls
            =================================================================== */}
        <div
          className="plan-visual-column"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="plan-visual-frame">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSceneData.id}
                initial={reduced ? false : { opacity: 0.35, scale: 1.02 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0.35, scale: 0.99 }}
                transition={{ duration: 0.45, ease: smoothEase }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              >
                <Image
                  src={activeSceneAsset.src}
                  alt={activeSceneData.title}
                  fill
                  sizes="(max-width: 980px) 100vw, 50vw"
                  className="plan-visual-img"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            <div className="plan-visual-scrim" />

            {/* Top Bar with Biligi Ridge Coordinates & 4s Autoplay Indicator */}
            <div className="plan-visual-top">
              <div className="plan-visual-badge">
                <span className="plan-badge-dot" />
                <span>16.3475° N, 75.6259° E · Biligi Ridge</span>
              </div>

              <div className="plan-slideshow-indicator" title={isPaused ? "Slideshow paused on hover" : "Slideshow playing (4s per image)"}>
                <span className="plan-slideshow-dot" />
                <span>{isPaused ? "Paused" : `4s Slide · ${sceneIdx + 1}/${SCENE_STORY.length}`}</span>
              </div>
            </div>

            {/* Interactive Scene Angle Switcher */}
            <div className="plan-visual-angles" role="group" aria-label="Visual Story Scenes">
              {SCENE_STORY.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className={`plan-angle-pill ${sceneIdx === idx ? "is-active" : ""}`}
                  onClick={() => setSceneIdx(idx)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Bottom Visual Storytelling Content */}
            <div className="plan-visual-content">
              <span className="plan-visual-tag">Architectural Preview</span>
              <h3 className="plan-visual-title">{activeSceneData.title}</h3>
              <p className="plan-visual-caption">{activeSceneData.caption}</p>

              {/* Visual Privilege Tokens (Replacing Plain Text) */}
              <div className="plan-story-tokens">
                <div className="plan-token">
                  <div className="plan-token-icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="plan-token-text">
                    <strong>Direct ERP Folio</strong>
                    <span>Real-time front desk sync</span>
                  </div>
                </div>

                <div className="plan-token">
                  <div className="plan-token-icon">
                    <Sparkles size={16} />
                  </div>
                  <div className="plan-token-text">
                    <strong>180 Club Vouchers</strong>
                    <span>Complimentary guest passes</span>
                  </div>
                </div>

                <div className="plan-token">
                  <div className="plan-token-icon">
                    <Compass size={16} />
                  </div>
                  <div className="plan-token-text">
                    <strong>24×7 Concierge</strong>
                    <span>Bespoke stay planning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Second Slideshow Progress Track */}
            <div className="plan-slideshow-progress-track">
              <motion.div
                key={sceneIdx}
                className="plan-slideshow-progress-bar"
                initial={{ width: "0%" }}
                animate={{ width: isPaused ? undefined : "100%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="plan-modal-overlay" role="dialog" aria-modal="true">
          <div className="plan-modal-card">
            <h3>Reset Guest Password</h3>
            <p>
              Enter the email address registered with your stay. We will dispatch a secure reset link to your inbox.
            </p>
            {forgotSent ? (
              <div>
                <p className="plan-modal-sent">
                  Reset instructions have been sent to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotSent(false);
                  }}
                  className="plan-submit-btn"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="plan-input"
                  style={{ marginBottom: "16px" }}
                />
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="plan-secondary-action"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="plan-primary-action">
                    Send Reset Link
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

