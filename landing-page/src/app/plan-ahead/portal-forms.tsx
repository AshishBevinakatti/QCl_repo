"use client";

import { useEffect, useState, useTransition } from "react";
import { portalApi, type GuestUser, type InquiryRecord } from "../portal-client";
import { ArrowRight } from "../icons";

const ROOM_OPTIONS = [
  "Luxury Pool Villa",
  "Heritage Cottage",
  "Hill View Cottage",
  "Valley Suite",
  "Plantation Villa",
];

export default function PortalForms() {
  const [currentUser, setCurrentUser] = useState<GuestUser | null>(null);
  const [activeTab, setActiveTab] = useState<"book" | "account">("book");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isPending, startTransition] = useTransition();

  // Booking Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [roomCategory, setRoomCategory] = useState(ROOM_OPTIONS[0]);
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<InquiryRecord | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Auth Form State
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Inquiries List
  const [myInquiries, setMyInquiries] = useState<InquiryRecord[]>([]);

  useEffect(() => {
    const user = portalApi.getStoredUser();
    if (user) {
      setCurrentUser(user);
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      loadInquiries(user.token);
    }

    // Set default dates: checkin = tomorrow, checkout = 3 days later
    const today = new Date();
    const tmrw = new Date(today);
    tmrw.setDate(tmrw.getDate() + 1);
    const co = new Date(today);
    co.setDate(co.getDate() + 4);
    setCheckin(tmrw.toISOString().split("T")[0]);
    setCheckout(co.toISOString().split("T")[0]);
  }, []);

  function loadInquiries(token: string) {
    portalApi.getMyInquiries(token)
      .then(setMyInquiries)
      .catch(() => {});
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    startTransition(async () => {
      try {
        const u = await portalApi.login(authEmail, authPassword);
        setCurrentUser(u);
        setName(u.name);
        setEmail(u.email);
        setPhone(u.phone);
        loadInquiries(u.token);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : "Login failed");
      }
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    startTransition(async () => {
      try {
        const u = await portalApi.register(authName, authEmail, authPhone, authPassword);
        setCurrentUser(u);
        setName(u.name);
        setEmail(u.email);
        setPhone(u.phone);
        loadInquiries(u.token);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : "Registration failed");
      }
    });
  }

  function handleLogout() {
    portalApi.logout();
    setCurrentUser(null);
    setMyInquiries([]);
  }

  function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    startTransition(async () => {
      try {
        const rec = await portalApi.submitInquiry({
          name,
          email,
          phone,
          checkinDate: checkin,
          checkoutDate: checkout,
          roomCategory,
          guestCount: Number(guestCount),
          notes,
        }, currentUser?.token);

        setBookingSuccess(rec);
        if (currentUser) {
          loadInquiries(currentUser.token);
        }
      } catch (err: unknown) {
        setBookingError(err instanceof Error ? err.message : "Inquiry submission failed");
      }
    });
  }

  return (
    <div className="portal-container wrap">
      {/* Navigation Tabs */}
      <div className="portal-tabs" role="tablist">
        <button
          className={`portal-tab ${activeTab === "book" ? "active" : ""}`}
          onClick={() => setActiveTab("book")}
          role="tab"
          aria-selected={activeTab === "book"}
        >
          Book / Inquire Stay
        </button>
        <button
          className={`portal-tab ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
          role="tab"
          aria-selected={activeTab === "account"}
        >
          {currentUser ? `Guest Account (${currentUser.name})` : "Guest Login & Register"}
        </button>
      </div>

      {/* Tab 1: Booking Inquiry Form */}
      {activeTab === "book" && (
        <section className="portal-section" aria-labelledby="book-heading">
          <div className="portal-grid">
            <div className="portal-info">
              <span className="portal-eyebrow">Reservation Inquiry</span>
              <h2 id="book-heading">Plan your escape to Golden Hills.</h2>
              <p>
                Submit your preferred dates and cottage preference. Our Sales Executive
                is instantly alerted and will confirm availability, custom itineraries, and tariff plans.
              </p>
              {currentUser ? (
                <div className="portal-user-badge">
                  <span>Logged in as <strong>{currentUser.name}</strong></span>
                  <button type="button" onClick={handleLogout} className="portal-btn-link">Logout</button>
                </div>
              ) : (
                <p className="portal-hint">
                  Have an account? <button type="button" onClick={() => { setActiveTab("account"); setAuthMode("login"); }} className="portal-btn-link">Login here</button> to auto-fill your details and track inquiries.
                </p>
              )}
            </div>

            <div className="portal-form-wrapper">
              {bookingSuccess ? (
                <div className="portal-success-card">
                  <div className="portal-success-icon">✓</div>
                  <h3>Inquiry Received</h3>
                  <p className="portal-ref-code">Reference: <strong>{bookingSuccess.publicReference}</strong></p>
                  <p>
                    Thank you, <strong>{bookingSuccess.name}</strong>. Your inquiry for <strong>{bookingSuccess.roomCategory}</strong> ({bookingSuccess.checkinDate} to {bookingSuccess.checkoutDate}) has been forwarded to our Sales Executive.
                  </p>
                  <p className="portal-note-text">
                    📱 A notification has been dispatched to our sales team. We will call you shortly to assist with your reservation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="portal-btn-secondary"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="portal-form">
                  {bookingError && <div className="portal-error-banner">{bookingError}</div>}

                  <div className="portal-row">
                    <label>
                      <span>Full Name *</span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                      />
                    </label>
                    <label>
                      <span>Phone Number *</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9876543210"
                      />
                    </label>
                  </div>

                  <div className="portal-row">
                    <label>
                      <span>Email Address *</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                      />
                    </label>
                    <label>
                      <span>Number of Guests</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="portal-row">
                    <label>
                      <span>Check-in Date *</span>
                      <input
                        type="date"
                        required
                        value={checkin}
                        onChange={(e) => setCheckin(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Check-out Date *</span>
                      <input
                        type="date"
                        required
                        value={checkout}
                        onChange={(e) => setCheckout(e.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    <span>Preferred Accommodation *</span>
                    <select
                      value={roomCategory}
                      onChange={(e) => setRoomCategory(e.target.value)}
                    >
                      {ROOM_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Special Requests / Notes</span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Honeymoon celebration, airport pick-up, dietary requests..."
                    />
                  </label>

                  <button type="submit" disabled={isPending} className="portal-btn-primary">
                    {isPending ? "Submitting Inquiry..." : "Submit Inquiry"} <ArrowRight />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Guest Account (Login / Register / Profile) */}
      {activeTab === "account" && (
        <section className="portal-section" aria-labelledby="account-heading">
          {currentUser ? (
            <div className="portal-account-dashboard">
              <div className="portal-account-header">
                <div>
                  <span className="portal-eyebrow">Guest Portal</span>
                  <h2 id="account-heading">Welcome, {currentUser.name}</h2>
                  <p>{currentUser.email} • {currentUser.phone}</p>
                </div>
                <button type="button" onClick={handleLogout} className="portal-btn-secondary">
                  Logout
                </button>
              </div>

              <div className="portal-inquiries-box">
                <h3>Your Submitted Inquiries ({myInquiries.length})</h3>
                {myInquiries.length === 0 ? (
                  <p className="portal-muted-text">
                    You have not submitted any room inquiries yet.
                    <button type="button" onClick={() => setActiveTab("book")} className="portal-btn-link" style={{ marginLeft: 8 }}>
                      Submit your first inquiry now
                    </button>
                  </p>
                ) : (
                  <div className="portal-inquiry-cards">
                    {myInquiries.map((inq) => (
                      <div key={inq.id} className="portal-inquiry-card">
                        <div className="portal-inq-top">
                          <span className="portal-inq-ref">{inq.publicReference}</span>
                          <span className={`portal-badge ${inq.status.toLowerCase()}`}>
                            {inq.status}
                          </span>
                        </div>
                        <h4>{inq.roomCategory}</h4>
                        <p className="portal-inq-dates">
                          {inq.checkinDate} → {inq.checkoutDate} ({inq.guestCount} guests)
                        </p>
                        {inq.notes && <p className="portal-inq-notes">"{inq.notes}"</p>}
                        <div className="portal-inq-footer">
                          <span>Submitted: {new Date(inq.createdAt).toLocaleDateString()}</span>
                          {inq.claimedBy && <span className="portal-assigned">Sales Exec: {inq.claimedBy}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="portal-auth-split">
              <div className="portal-auth-toggle">
                <button
                  type="button"
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => setAuthMode("login")}
                >
                  Guest Login
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => setAuthMode("register")}
                >
                  Register Account
                </button>
              </div>

              {authError && <div className="portal-error-banner">{authError}</div>}

              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="portal-form portal-auth-form">
                  <h3 id="account-heading">Login to Guest Account</h3>
                  <p>Access your past inquiries and manage your stay requests.</p>
                  <label>
                    <span>Email Address *</span>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label>
                    <span>Password *</span>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </label>
                  <button type="submit" disabled={isPending} className="portal-btn-primary">
                    {isPending ? "Logging in..." : "Login"} <ArrowRight />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="portal-form portal-auth-form">
                  <h3 id="account-heading">Create a Guest Account</h3>
                  <p>Register once to submit booking inquiries and track requests.</p>
                  <label>
                    <span>Full Name *</span>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                    />
                  </label>
                  <label>
                    <span>Email Address *</span>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="priya@example.com"
                    />
                  </label>
                  <label>
                    <span>Mobile Phone *</span>
                    <input
                      type="tel"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+91-9876543210"
                    />
                  </label>
                  <label>
                    <span>Password (min. 6 characters) *</span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </label>
                  <button type="submit" disabled={isPending} className="portal-btn-primary">
                    {isPending ? "Creating Account..." : "Create Account"} <ArrowRight />
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
