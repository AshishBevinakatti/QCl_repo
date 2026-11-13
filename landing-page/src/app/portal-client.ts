// API Client for Golden Hills Resort Public Portal -> Lead Microservice (:8082)

export interface GuestUser {
  guestId: string;
  name: string;
  email: string;
  phone: string;
  token: string;
}

export interface InquirySubmission {
  name: string;
  email: string;
  phone: string;
  checkinDate: string;
  checkoutDate: string;
  roomCategory: string;
  guestCount: number;
  notes?: string;
}

export interface InquiryRecord {
  id: string;
  publicReference: string;
  name: string;
  email: string;
  phone: string;
  checkinDate: string;
  checkoutDate: string;
  roomCategory: string;
  guestCount: number;
  notes?: string;
  status: string;
  priority: string;
  claimedBy?: string;
  slaDeadline: string;
  slaBreached: boolean;
  createdAt: string;
}

const PORTAL_API_BASE = process.env.NEXT_PUBLIC_LEAD_API_URL || "http://localhost:8082/api/v1/portal";

export const portalApi = {
  getStoredUser(): GuestUser | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("ghr_portal_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: GuestUser | null) {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("ghr_portal_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ghr_portal_user");
    }
  },

  async register(name: string, email: string, phone: string, password: string): Promise<GuestUser> {
    const res = await fetch(`${PORTAL_API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Registration failed. Please check your details.");
    }

    const data: GuestUser = await res.json();
    this.setStoredUser(data);
    return data;
  },

  async login(email: string, password: string): Promise<GuestUser> {
    const res = await fetch(`${PORTAL_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Invalid email or password.");
    }

    const data: GuestUser = await res.json();
    this.setStoredUser(data);
    return data;
  },

  logout() {
    this.setStoredUser(null);
  },

  async submitInquiry(payload: InquirySubmission, token?: string): Promise<InquiryRecord> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${PORTAL_API_BASE}/inquiries`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to submit inquiry. Please try again.");
    }

    return await res.json();
  },

  async getMyInquiries(token: string): Promise<InquiryRecord[]> {
    const res = await fetch(`${PORTAL_API_BASE}/inquiries/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load your inquiries.");
    }

    return await res.json();
  },
};
