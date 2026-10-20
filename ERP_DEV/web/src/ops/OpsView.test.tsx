import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OpsView } from './OpsView';
import type { OpsAuditPage, OpsFlags, OpsStatus } from '../api';

const mocks = vi.hoisted(() => ({
  opsStatus: vi.fn(),
  opsFlags: vi.fn(),
  opsAudit: vi.fn(),
}));

vi.mock('../api', () => ({
  HttpError: class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  isAuthError: (err: unknown) =>
    err instanceof Error && (err as { status?: number }).status === 401,
  opsStatus: mocks.opsStatus,
  opsFlags: mocks.opsFlags,
  opsAudit: mocks.opsAudit,
}));

vi.mock('../auth', () => ({
  isAuthenticated: () => true,
  hasRole: () => true,
}));

const now = '2026-10-20T12:00:00Z';

const status: OpsStatus = {
  generatedAt: now,
  state: 'OK',
  environment: 'local',
  service: {
    name: 'erp-app',
    version: 'dev',
    state: 'UP',
    observedAt: now,
    uptimeSeconds: 90,
    database: { state: 'UP', latencyMs: 2 },
  },
  telemetry: {
    configured: false,
    stale: false,
    lastCheckedAt: now,
    sources: [
      {
        id: 'prometheus',
        state: 'NOT_CONFIGURED',
        configured: false,
        observedAt: now,
        lastSuccessAt: null,
        detail: 'Set OPS_PROMETHEUS_URL',
      },
    ],
  },
  links: {},
};

const flags: OpsFlags = {
  generatedAt: now,
  items: [
    {
      key: 'module.restaurant.enabled',
      value: 'false',
      type: 'boolean',
      updatedBy: 'seed',
      updatedAt: now,
    },
  ],
};

const audit: OpsAuditPage = {
  items: [
    {
      id: 'a1',
      actor: 'ops-admin',
      action: 'ops.audit.read',
      objectType: 'ops',
      objectId: 'console',
      before: null,
      after: null,
      reason: null,
      createdAt: now,
    },
  ],
  page: 0,
  size: 25,
  total: 1,
  totalPages: 1,
};

describe('OpsView', () => {
  beforeEach(() => {
    mocks.opsStatus.mockResolvedValue(status);
    mocks.opsFlags.mockResolvedValue(flags);
    mocks.opsAudit.mockResolvedValue(audit);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the real unconfigured telemetry state and flags', async () => {
    render(<OpsView mode="live" />);
    expect(await screen.findByText('Integration health')).toBeInTheDocument();
    expect(screen.getByText('Set OPS_PROMETHEUS_URL')).toBeInTheDocument();
    expect(screen.getByText(/Telemetry is not configured/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /feature flags/i }));
    expect(await screen.findByText('module.restaurant.enabled')).toBeInTheDocument();
  });

  it('shows the actual error instead of fake green metrics', async () => {
    mocks.opsStatus.mockRejectedValue(new Error('API down'));
    render(<OpsView mode="live" />);
    expect(await screen.findByText('API down')).toBeInTheDocument();
    expect(screen.queryByText('Integration health')).not.toBeInTheDocument();
  });

  it('renders audit rows for an authorized role', async () => {
    render(<OpsView mode="live" />);
    fireEvent.click(screen.getByRole('tab', { name: /audit trail/i }));
    expect(await screen.findByText('ops-admin')).toBeInTheDocument();
    expect(screen.getByText('ops.audit.read')).toBeInTheDocument();
  });

  it('does not call the API in preview mode', () => {
    render(<OpsView mode="preview" />);
    expect(screen.getByText(/Live mode only/)).toBeInTheDocument();
    expect(mocks.opsStatus).not.toHaveBeenCalled();
  });
});
