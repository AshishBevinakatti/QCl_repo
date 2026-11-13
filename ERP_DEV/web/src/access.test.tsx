import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { canSee, departmentLabel, landingView } from './access';
import { Sidebar, Topbar, type View } from './dashboard';
import * as api from './api';
import App from './App';

const auth = vi.hoisted(() => ({
  signedIn: true,
  login: vi.fn(),
}));

vi.mock('./auth', () => ({
  initAuthOnce: () => Promise.resolve(auth.signedIn),
  isAuthenticated: () => auth.signedIn,
  authReachable: () => true,
  username: () => 'tester',
  roles: () => [],
  hasRole: () => false,
  login: auth.login,
  logout: vi.fn(),
  getToken: () => Promise.resolve(null),
}));

afterEach(cleanup);

const SALES = new Set(['leads:manage', 'guests:view']);
const HOUSEKEEPING = new Set(['housekeeping:tasks']);
const RECEPTION = new Set(['frontdesk:view', 'bookings:view', 'bookings:create', 'stays:checkin', 'guests:view', 'payments:collect']);

function sidebarLabels(perms: Set<string>): string[] {
  render(
    <Sidebar view="dashboard" go={() => {}} mode="live" setMode={() => {}} mobileOpen={false} onClose={() => {}}
      perms={perms} who={{ name: 'x', dept: 'y' }} persona="sales" setPersona={() => {}} />,
  );
  const nav = screen.getByRole('complementary', { name: 'Primary navigation' });
  return within(nav).getAllByRole('button').map((b) => b.textContent ?? '');
}

describe('access rules (unit 3.15)', () => {
  it('sales see only leads and guests, and land on leads', () => {
    const visible = (['dashboard', 'leads', 'guests', 'check', 'billing', 'housekeeping', 'ops'] as View[])
      .filter((v) => canSee(v, SALES));
    expect(visible).toEqual(['leads', 'guests']);
    expect(landingView(SALES)).toBe('leads');
  });

  it('housekeeping lands on housekeeping and cannot open billing', () => {
    expect(landingView(HOUSEKEEPING)).toBe('housekeeping');
    expect(canSee('billing', HOUSEKEEPING)).toBe(false);
  });

  it('reception lands on the dashboard and has no sales leads', () => {
    expect(landingView(RECEPTION)).toBe('dashboard');
    expect(canSee('leads', RECEPTION)).toBe(false);
  });

  it('several roles see the union of their screens', () => {
    const both = new Set([...SALES, ...HOUSEKEEPING]);
    expect(canSee('leads', both) && canSee('housekeeping', both)).toBe(true);
  });

  it('superadmin (*) sees everything', () => {
    expect(canSee('settings', new Set(['*']))).toBe(true);
    expect(landingView(new Set(['*']))).toBe('dashboard');
  });

  it('department label ignores Keycloak default roles', () => {
    expect(departmentLabel(['SALES_EXEC', 'offline_access', 'default-roles-resort'])).toBe('Sales');
    expect(departmentLabel(['uma_authorization'])).toBe('Staff');
  });
});

describe('navigation and search follow permissions', () => {
  it('sidebar shows only the sales workspace for sales staff', () => {
    const labels = sidebarLabels(SALES).join('|');
    expect(labels).toContain('Sales Leads');
    expect(labels).toContain('Guests');
    expect(labels).not.toContain('Billing');
    expect(labels).not.toContain('Housekeeping');
    expect(labels).not.toContain('Settings');
  });

  it('housekeeping staff get no guest/booking search', () => {
    render(<Topbar onJump={() => {}} api="UP" onMenu={() => {}} perms={HOUSEKEEPING} />);
    expect(screen.queryByPlaceholderText(/Search guest/)).toBeNull();
  });

  it('reception staff keep the search', () => {
    render(<Topbar onJump={() => {}} api="UP" onMenu={() => {}} perms={RECEPTION} />);
    expect(screen.getByPlaceholderText(/Search guest/)).toBeInTheDocument();
  });
});

describe('App sign-in and access gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    auth.login.mockReset();
    vi.spyOn(api, 'apiHealth').mockResolvedValue({ status: 'UP', service: 'erp-app' });
  });

  it('shows the sign-in screen when nobody is signed in; dev tiles pre-fill the username', async () => {
    auth.signedIn = false;
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(auth.login).toHaveBeenCalledWith();
    fireEvent.click(screen.getByRole('button', { name: /Housekeeping/ }));
    expect(auth.login).toHaveBeenCalledWith('housekeeping-staff');
  });

  it('an account without permissions sees the restricted panel, not a workspace', async () => {
    auth.signedIn = true;
    vi.spyOn(api, 'me').mockResolvedValue({ username: 'newbie', roles: ['offline_access'], permissions: [] });
    render(<App />);
    expect(await screen.findByText('Restricted section')).toBeInTheDocument();
    expect(screen.queryByText('Sales Leads')).toBeNull();
  });

  it('sales staff land on the leads workspace with their department shown', async () => {
    auth.signedIn = true;
    vi.spyOn(api, 'me').mockResolvedValue({ username: 'sales-staff', roles: ['SALES_EXEC'], permissions: [...SALES] });
    vi.spyOn(api, 'listSalesLeads').mockResolvedValue([]);
    render(<App />);
    expect(await screen.findByText('Sales')).toBeInTheDocument();
    expect(screen.queryByText('Billing & Payments')).toBeNull();
    await waitFor(() => expect(api.listSalesLeads).toHaveBeenCalled());
  });
});
