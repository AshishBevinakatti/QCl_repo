import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { LeadsView } from './leads';
import * as api from './api';

afterEach(cleanup);

describe('LeadsView', () => {
  const mockLead: api.LeadDetailDto = {
    id: '11111111-2222-3333-4444-555555555555',
    publicReference: 'GHR-100200',
    name: 'Siddharth Roy',
    email: 'siddharth@example.com',
    phone: '+91-9876543210',
    checkinDate: '2026-11-20',
    checkoutDate: '2026-11-23',
    roomCategory: 'Luxury Pool Villa',
    guestCount: 2,
    notes: 'Airport transfer required',
    status: 'NEW',
    priority: 'HIGH',
    slaDeadline: new Date(Date.now() + 300000).toISOString(),
    slaBreached: false,
    voiceEscalationTriggered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      {
        id: 'act-1',
        actor: 'Guest (Online)',
        activityType: 'INQUIRY_SUBMITTED',
        description: 'Inquiry submitted online',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders leads list and displays unattended lead', async () => {
    vi.spyOn(api, 'listSalesLeads').mockResolvedValue([mockLead]);

    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getByText('GHR-100200')).toBeInTheDocument();
      expect(screen.getAllByText('Siddharth Roy').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Claim/i).length).toBeGreaterThan(0);
    });
  });

  it('claims an unattended lead and shows claimed state', async () => {
    vi.spyOn(api, 'listSalesLeads').mockResolvedValue([mockLead]);
    const claimedLead: api.LeadDetailDto = {
      ...mockLead,
      status: 'IN_PROGRESS',
      claimedBy: 'sales_executive',
      claimedAt: new Date().toISOString(),
    };
    vi.spyOn(api, 'claimSalesLead').mockResolvedValue(claimedLead);

    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getAllByText(/^Claim$/).length).toBeGreaterThan(0);
    });

    const claimButtons = screen.getAllByText(/^Claim$/);
    fireEvent.click(claimButtons[0]);

    await waitFor(() => {
      expect(api.claimSalesLead).toHaveBeenCalledWith(mockLead.id, expect.any(String));
    });
  });

  it('converts an in-progress lead to an official ERP Guest record', async () => {
    const inProgLead: api.LeadDetailDto = {
      ...mockLead,
      status: 'IN_PROGRESS',
      claimedBy: 'sales_executive',
    };
    vi.spyOn(api, 'listSalesLeads').mockResolvedValue([inProgLead]);
    vi.spyOn(api, 'createGuest').mockResolvedValue({
      id: 'guest-uuid-999',
      name: 'Siddharth Roy',
      phone: '+91-9876543210',
      email: 'siddharth@example.com',
      idType: null,
      preferences: '{}',
      status: 'active',
      mergedIntoId: null,
      memberId: null,
    });
    vi.spyOn(api, 'convertLeadToGuest').mockResolvedValue({
      ...inProgLead,
      status: 'CONVERTED',
      erpGuestId: 'guest-uuid-999',
    });

    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View'));

    await waitFor(() => {
      expect(screen.getAllByText('Create guest record').length).toBeGreaterThan(0);
    });

    const convertButtons = screen.getAllByText('Create guest record');
    fireEvent.click(convertButtons[0]);

    await waitFor(() => {
      expect(api.createGuest).toHaveBeenCalledWith('Siddharth Roy', '+91-9876543210', 'siddharth@example.com');
      expect(api.convertLeadToGuest).toHaveBeenCalledWith(mockLead.id, expect.any(String), 'guest-uuid-999');
    });
  });
});
