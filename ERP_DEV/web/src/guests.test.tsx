import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GuestsView } from './guests';
import type { GuestDto, GuestProfileDto, MemberDto } from './api';

const mocks = vi.hoisted(() => ({
  searchGuests: vi.fn(),
  guestProfile: vi.fn(),
  createGuest: vi.fn(),
  updateGuest: vi.fn(),
  enrollMember: vi.fn(),
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
    rupees: (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`,
    searchGuests: mocks.searchGuests,
    guestProfile: mocks.guestProfile,
    createGuest: mocks.createGuest,
    updateGuest: mocks.updateGuest,
    enrollMember: mocks.enrollMember,
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
  email: 'diya@example.com',
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

function profileGuest(source: GuestDto): GuestProfileDto['guest'] {
  return {
    id: source.id,
    name: source.name,
    phone: source.phone,
    email: source.email,
    idType: source.idType,
    status: source.status,
    memberId: source.memberId,
  };
}

const emptyProfile: GuestProfileDto = {
  guest: profileGuest(guest),
  membership: null,
  currentStay: null,
  nextReservation: null,
  operationalState: 'NO_STAY',
  reservations: [],
  reservationTotal: 0,
  billing: {
    folioId: null,
    stayId: null,
    status: null,
    chargesPaise: 0,
    paymentsPaise: 0,
    creditsPaise: 0,
    outstandingPaise: 0,
    advanceDuePaise: null,
    advancePaidPaise: null,
    invoice: null,
    paymentAlerts: [],
  },
  alerts: [],
  preferences: [{ key: 'diet', label: 'Diet', value: 'Vegetarian' }],
};

const memberProfile: GuestProfileDto = {
  ...emptyProfile,
  guest: { ...emptyProfile.guest, memberId: member.id },
  membership: {
    id: member.id,
    membershipNo: member.membershipNo,
    tier: member.tier,
    status: member.status,
    validFrom: '2026-10-01',
    validTo: member.validTo,
    points: member.points,
  },
};

const stay = {
  reservationId: 'r1',
  reference: 'GH-1001',
  status: 'checked-in',
  source: 'web',
  categoryId: 'c1',
  categoryName: 'Villa',
  checkinDate: '2026-10-20',
  checkoutDate: '2026-10-24',
  nights: 4,
  roomId: 'room1',
  roomNo: '104',
  roomStatus: 'occupied',
  stayId: 's1',
  stayStatus: 'checked-in',
  checkinAt: '2026-10-20T08:45:00Z',
  checkoutAt: null,
};

const activeProfile: GuestProfileDto = {
  ...emptyProfile,
  currentStay: stay,
  operationalState: 'IN_HOUSE',
  reservations: [stay],
  reservationTotal: 1,
  billing: {
    folioId: 'f1',
    stayId: 's1',
    status: 'open',
    chargesPaise: 3000000,
    paymentsPaise: 900000,
    creditsPaise: 0,
    outstandingPaise: 2100000,
    advanceDuePaise: 900000,
    advancePaidPaise: 900000,
    invoice: {
      id: 'i1',
      status: 'issued',
      totalPaise: 2460000,
      issuedAt: '2026-10-22T09:30:00Z',
    },
    paymentAlerts: [
      {
        paymentId: 'p1',
        status: 'pending',
        amountPaise: 900000,
        createdAt: '2026-10-22T09:05:00Z',
      },
    ],
  },
  alerts: [
    {
      severity: 'high',
      text: 'Outstanding balance ₹21,000 remains on the folio.',
      ref: 'f1',
    },
  ],
};

const emptyPage = { items: [] as GuestDto[], page: 0, total: 0 };

function renderView(overrides: Partial<{
  mode: 'live' | 'preview';
  initialQ: string;
  jumpNonce: number;
  onOpenFrontOffice: (reservationId: string) => void;
  onOpenBilling: (stayId: string) => void;
}> = {}) {
  const onOpenFrontOffice = overrides.onOpenFrontOffice ?? vi.fn();
  const onOpenBilling = overrides.onOpenBilling ?? vi.fn();
  render(
    <GuestsView
      mode={overrides.mode ?? 'live'}
      initialQ={overrides.initialQ}
      jumpNonce={overrides.jumpNonce}
      onOpenFrontOffice={onOpenFrontOffice}
      onOpenBilling={onOpenBilling}
    />,
  );
  return { onOpenFrontOffice, onOpenBilling };
}

describe('GuestsView', () => {
  beforeEach(() => {
    mocks.hasRole.mockReturnValue(true);
    mocks.searchGuests.mockResolvedValue({ items: [guest], page: 0, total: 1 });
    mocks.guestProfile.mockResolvedValue(emptyProfile);
    mocks.enrollMember.mockResolvedValue(member);
    mocks.updateGuest.mockResolvedValue(guest);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('loads the profile projection and shows sourced contact, preference and membership data', async () => {
    renderView();

    expect(await screen.findByText('Diya Shah')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));

    await waitFor(() => expect(mocks.guestProfile).toHaveBeenCalledWith('g1'));
    expect(screen.getByRole('heading', { name: 'Diya Shah' })).toBeInTheDocument();
    expect(screen.getAllByText('diya@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Vegetarian diet')).toBeInTheDocument();
    expect(screen.getByText('Not enrolled')).toBeInTheDocument();
    expect(screen.getByText('Not tracked in this release')).toBeInTheDocument();
  });

  it('enrolls using the selected guest id and refreshes the authoritative membership', async () => {
    mocks.guestProfile
      .mockResolvedValueOnce(emptyProfile)
      .mockResolvedValueOnce(memberProfile);
    renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    expect(await screen.findByRole('button', { name: /Enroll in Membership/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Enroll in Membership/i }));

    await waitFor(() => expect(mocks.enrollMember).toHaveBeenCalledWith('g1'));
    expect(await screen.findByText('GHM-2026-A1B2C3')).toBeInTheDocument();
    expect(screen.getByText(/is now a Silver member/)).toBeInTheDocument();
    await waitFor(() => expect(mocks.guestProfile.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('shows the active stay summary and opens real front-office and billing destinations', async () => {
    mocks.guestProfile.mockResolvedValue(activeProfile);
    const { onOpenFrontOffice, onOpenBilling } = renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    expect(await screen.findByText('Room 104 · Villa')).toBeInTheDocument();
    expect(screen.getAllByText('₹21,000').length).toBeGreaterThan(0);
    expect(screen.getByText(/Outstanding balance ₹21,000 remains/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Open folio' })[0]);
    expect(onOpenBilling).toHaveBeenCalledWith('s1');

    fireEvent.click(screen.getByRole('tab', { name: /Reservations & stays/ }));
    expect(screen.getByText('Booking GH-1001')).toBeInTheDocument();
    const frontOfficeButtons = screen.getAllByRole('button', { name: 'Front office' });
    fireEvent.click(frontOfficeButtons[frontOfficeButtons.length - 1]);
    expect(onOpenFrontOffice).toHaveBeenCalledWith('r1');
  });

  it('renders canonical folio totals, payment attempt state and invoice metadata', async () => {
    mocks.guestProfile.mockResolvedValue(activeProfile);
    const { onOpenBilling } = renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    await screen.findByText('Room 104 · Villa');

    fireEvent.click(screen.getByRole('tab', { name: /Billing & payments/ }));
    expect(screen.getByText('Charges')).toBeInTheDocument();
    expect(screen.getAllByText('₹30,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹9,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹21,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹24,600').length).toBeGreaterThan(0);
    expect(screen.getByText('Payment attempts needing attention')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Issued').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Open billing workspace' }));
    expect(onOpenBilling).toHaveBeenCalledWith('s1');
  });

  it('edits only contact fields, sends an audit reason and refreshes the profile', async () => {
    const updatedGuest: GuestDto = {
      ...guest,
      email: 'diya.new@example.com',
      idType: 'Passport',
    };
    const updatedProfile: GuestProfileDto = {
      ...emptyProfile,
      guest: profileGuest(updatedGuest),
    };
    mocks.guestProfile
      .mockResolvedValueOnce(emptyProfile)
      .mockResolvedValueOnce(updatedProfile);
    mocks.updateGuest.mockResolvedValue(updatedGuest);
    renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    await screen.findByRole('heading', { name: 'Diya Shah' });
    fireEvent.click(screen.getByRole('button', { name: /Edit guest/i }));

    expect(screen.getByLabelText('Full name')).toHaveValue('Diya Shah');
    fireEvent.change(screen.getByLabelText('Email (optional)'), {
      target: { value: 'diya.new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('ID type'), { target: { value: 'Passport' } });
    fireEvent.change(screen.getByLabelText(/Reason for change/), {
      target: { value: 'Guest confirmed new email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mocks.updateGuest).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        email: 'diya.new@example.com',
        idType: 'Passport',
        reason: 'Guest confirmed new email',
      }),
    ));
    expect(await screen.findByText(/details were updated/)).toBeInTheDocument();
    expect((await screen.findAllByText('diya.new@example.com')).length).toBeGreaterThan(0);
  });

  it('sends empty strings when clearing optional email and ID type', async () => {
    const clearedGuest: GuestDto = { ...guest, email: null, idType: null };
    const clearedProfile: GuestProfileDto = {
      ...emptyProfile,
      guest: profileGuest(clearedGuest),
    };
    mocks.guestProfile
      .mockResolvedValueOnce(emptyProfile)
      .mockResolvedValueOnce(clearedProfile);
    mocks.updateGuest.mockResolvedValue(clearedGuest);
    renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    await screen.findByRole('heading', { name: 'Diya Shah' });
    fireEvent.click(screen.getByRole('button', { name: /Edit guest/i }));

    fireEvent.change(screen.getByLabelText('Email (optional)'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('ID type'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mocks.updateGuest).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ email: '', idType: '' }),
    ));
    expect(await screen.findByText(/details were updated/)).toBeInTheDocument();
  });

  it('creates a guest with optional email and opens the new profile', async () => {
    const created: GuestDto = {
      ...guest,
      id: 'g2',
      name: 'New Guest',
      phone: '+91 98220 00123',
      email: 'new@example.com',
      idType: null,
      preferences: '',
    };
    mocks.createGuest.mockResolvedValue(created);
    mocks.guestProfile.mockResolvedValue({
      ...emptyProfile,
      guest: profileGuest(created),
      preferences: [],
    });
    renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getAllByRole('button', { name: /Add New Guest/i })[0]);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  New Guest  ' } });
    fireEvent.change(screen.getByLabelText('Phone number'), {
      target: { value: ' +91 98220 00123 ' },
    });
    fireEvent.change(screen.getByLabelText('Email (optional)'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create guest' }));

    await waitFor(() => expect(mocks.createGuest).toHaveBeenCalledWith(
      'New Guest', '+91 98220 00123', 'new@example.com',
    ));
    expect(await screen.findByRole('heading', { name: 'New Guest' })).toBeInTheDocument();
    expect(screen.getByText(/New Guest was created/)).toBeInTheDocument();
    expect((await screen.findAllByText('new@example.com')).length).toBeGreaterThan(0);
  });

  it('handles duplicate phones and opens the existing guest projection', async () => {
    mocks.searchGuests.mockResolvedValue(emptyPage);
    mocks.createGuest.mockRejectedValue(
      new (await import('./api')).HttpError(
        409, 'A guest with this phone number is already registered.',
        'GUEST_EXISTS', { existingGuestId: 'g1' },
      ),
    );
    renderView();
    await screen.findByText('No guest records yet.');

    fireEvent.click(screen.getAllByRole('button', { name: /Add New Guest/i })[0]);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Copy Cat' } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+91-9822000112' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create guest' }));

    expect(await screen.findByText(/already registered to a guest/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open existing guest/i }));

    await waitFor(() => expect(mocks.guestProfile).toHaveBeenCalledWith('g1'));
    expect(await screen.findByRole('heading', { name: 'Diya Shah' })).toBeInTheDocument();
  });

  it('keeps Requests & Notes honest about unsupported records', async () => {
    mocks.guestProfile.mockResolvedValue(activeProfile);
    renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    await screen.findByText('Room 104 · Villa');
    fireEvent.click(screen.getByRole('tab', { name: /Requests & notes/ }));

    expect(screen.getByText('Service requests are not available yet')).toBeInTheDocument();
    expect(screen.getByText('Guest notes are not available yet')).toBeInTheDocument();
    expect(screen.getByText(/derived from the reservation, folio and payment records/))
      .toBeInTheDocument();
  });

  it('shows a profile error with a retry action', async () => {
    mocks.guestProfile.mockRejectedValue(
      new (await import('./api')).HttpError(404, 'guest not found'),
    );
    renderView();

    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));

    expect(await screen.findByText('This guest record could not be found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('sends the typed query to guest search', async () => {
    renderView();
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
    renderView();

    expect(await screen.findByText('No guest records yet.')).toBeInTheDocument();
    expect(screen.getByText(/Add a new guest to get started/)).toBeInTheDocument();
  });

  it('auto-opens a single guest from a global-search jump', async () => {
    renderView({ initialQ: guest.phone, jumpNonce: 1 });

    expect(await screen.findByRole('heading', { name: 'Diya Shah' })).toBeInTheDocument();
    expect(mocks.searchGuests).toHaveBeenCalledWith(guest.phone, 0, 20);
    expect(mocks.guestProfile).toHaveBeenCalledWith('g1');
  });

  it('supports keyboard movement across profile tabs', async () => {
    renderView();
    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));
    await screen.findByRole('tab', { name: 'Overview' });

    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Reservations & stays/ }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('does not call the API in preview and explains the mode', () => {
    renderView({ mode: 'preview' });
    expect(screen.getByText(/Connect Live to search real guest records/)).toBeInTheDocument();
    expect(screen.getByText('Guest records are available in Live mode.')).toBeInTheDocument();
    expect(mocks.searchGuests).not.toHaveBeenCalled();
    expect(mocks.guestProfile).not.toHaveBeenCalled();
  });

  it('hides profile writes and enrollment for a role without permission', async () => {
    mocks.hasRole.mockReturnValue(false);
    renderView();
    await screen.findByText('Diya Shah');
    fireEvent.click(screen.getByRole('button', { name: /Open profile for Diya Shah/i }));

    expect(await screen.findByText(/Membership enrolment is restricted for your role/))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enroll in Membership/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit guest/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add New Guest/i })).not.toBeInTheDocument();
  });
});
