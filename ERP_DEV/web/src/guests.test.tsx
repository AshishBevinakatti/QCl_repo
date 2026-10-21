import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GuestsView } from './guests';
import type { GuestDto, MemberDto } from './api';

const mocks = vi.hoisted(() => ({
  searchGuests: vi.fn(),
  guestById: vi.fn(),
  createGuest: vi.fn(),
  enrollMember: vi.fn(),
  memberDashboard: vi.fn(),
  redeemPoints: vi.fn(),
  hasRole: vi.fn(),
}));

vi.mock('./api', () => {
  class HttpError extends Error {
    status: number;
    code?: string;
    details?: Record<string, string>;
    requestId?: string;
    constructor(
      status: number, message: string, code?: string,
      details?: Record<string, string>, requestId?: string,
    ) {
      super(message);
      this.status = status;
      this.code = code;
      this.details = details;
      this.requestId = requestId;
    }
  }
  return {
    HttpError,
    isAuthError: (err: unknown) =>
      err instanceof HttpError && err.status === 401,
    searchGuests: mocks.searchGuests,
    guestById: mocks.guestById,
    createGuest: mocks.createGuest,
    enrollMember: mocks.enrollMember,
    memberDashboard: mocks.memberDashboard,
    redeemPoints: mocks.redeemPoints,
  };
});

vi.mock('./auth', () => ({
  hasRole: mocks.hasRole,
  login: vi.fn(),
}));

const guest: GuestDto = {
  id: 'g1',
  name: 'Diya Shah',
  phone: '+91-9822000112',
  idType: 'Aadhaar',
  preferences: '{"diet":"vegetarian"}',
  status: 'active',
  mergedIntoId: null,
  memberId: null,
};

const member: MemberDto = {
  id: 'm1',
  guestId: 'g1',
  membershipNo: 'GHM-2026-A1B2C3',
  tier: 'Silver',
  status: 'active',
  validTo: '2027-10-01',
  points: 0,
};

const emptyPage = { items: [] as GuestDto[], page: 0, total: 0 };

describe('GuestsView', () => {
  beforeEach(() => {
    mocks.hasRole.mockReturnValue(true);
    mocks.searchGuests.mockResolvedValue({ items: [guest], page: 0, total: 1 });
    mocks.guestById.mockResolvedValue(guest);
    mocks.memberDashboard.mockResolvedValue(member);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('searches, opens the selected profile, and enrolls using the selected guest id', async () => {
    render(<GuestsView mode="live" />);

    expect(await screen.findByText('Diya Shah')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));

    expect(screen.getByRole('heading', { name: 'Diya Shah' })).toBeInTheDocument();
    expect(screen.getByText(/Diet: vegetarian/)).toBeInTheDocument();
    expect(screen.getByText('Not enrolled')).toBeInTheDocument();

    mocks.enrollMember.mockResolvedValue(member);
    fireEvent.click(screen.getByRole('button', { name: /Enroll in Membership/i }));

    await waitFor(() => expect(mocks.enrollMember).toHaveBeenCalledWith('g1'));
    expect(await screen.findByText('GHM-2026-A1B2C3')).toBeInTheDocument();
    expect(screen.getByText(/is now a Silver member/)).toBeInTheDocument();
  });

  it('sends the typed query to guest search', async () => {
    render(<GuestsView mode="live" />);
    await screen.findByText('Diya Shah');

    fireEvent.change(screen.getByLabelText(/Search guests by name or phone/i), {
      target: { value: 'diya' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(mocks.searchGuests).toHaveBeenCalledWith('diya', 0, 20));
    expect(await screen.findByText(/Matches for “diya”/)).toBeInTheDocument();
  });

  it('shows a helpful empty state when no guests exist', async () => {
    mocks.searchGuests.mockResolvedValue(emptyPage);
    render(<GuestsView mode="live" />);

    expect(await screen.findByText('No guest records yet.')).toBeInTheDocument();
    expect(screen.getByText(/Add a new guest to get started/)).toBeInTheDocument();
  });

  it('handles duplicate phones and can open the existing guest', async () => {
    mocks.searchGuests.mockResolvedValue(emptyPage);
    mocks.createGuest.mockRejectedValue(
      new (await import('./api')).HttpError(
        409, 'A guest with this phone number is already registered.',
        'GUEST_EXISTS', { existingGuestId: 'g1' },
      ),
    );
    render(<GuestsView mode="live" />);
    await screen.findByText('No guest records yet.');

    fireEvent.click(screen.getAllByRole('button', { name: /Add New Guest/i })[0]);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Copy Cat' } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+91-9822000112' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create guest' }));

    expect(await screen.findByText(/already registered to a guest/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open existing guest/i }));

    await waitFor(() => expect(mocks.guestById).toHaveBeenCalledWith('g1'));
    expect(await screen.findByRole('heading', { name: 'Diya Shah' })).toBeInTheDocument();
  });

  it('creates a guest, trims the values, and opens the new profile', async () => {
    const created: GuestDto = {
      ...guest,
      id: 'g2',
      name: 'New Guest',
      phone: '+91 98220 00123',
      idType: null,
      preferences: '',
    };
    mocks.createGuest.mockResolvedValue(created);
    render(<GuestsView mode="live" />);
    await screen.findByText('Diya Shah');

    fireEvent.click(screen.getAllByRole('button', { name: /Add New Guest/i })[0]);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  New Guest  ' } });
    fireEvent.change(screen.getByLabelText('Phone number'), {
      target: { value: ' +91 98220 00123 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create guest' }));

    await waitFor(() =>
      expect(mocks.createGuest).toHaveBeenCalledWith('New Guest', '+91 98220 00123'));
    expect(await screen.findByRole('heading', { name: 'New Guest' })).toBeInTheDocument();
    expect(screen.getByText(/New Guest was created/)).toBeInTheDocument();
  });

  it('auto-opens a single guest from a global-search jump', async () => {
    render(<GuestsView mode="live" initialQ={guest.phone} jumpNonce={1} />);

    expect(await screen.findByRole('heading', { name: 'Diya Shah' })).toBeInTheDocument();
    expect(mocks.searchGuests).toHaveBeenCalledWith(guest.phone, 0, 20);
  });

  it('does not call the API in preview and explains the mode', () => {
    render(<GuestsView mode="preview" />);
    expect(screen.getByText(/Connect Live to search real guest records/)).toBeInTheDocument();
    expect(screen.getByText('Guest records are available in Live mode.')).toBeInTheDocument();
    expect(mocks.searchGuests).not.toHaveBeenCalled();
  });

  it('hides enrollment for a role without membership permission', async () => {
    mocks.hasRole.mockReturnValue(false);
    render(<GuestsView mode="live" />);
    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));

    expect(screen.getByText(/Membership enrolment is restricted for your role/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enroll in Membership/i })).not.toBeInTheDocument();
  });
});
