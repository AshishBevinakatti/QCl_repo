import { useEffect, useState } from 'react';
import {
  HttpError,
  isAuthError,
  opsAudit,
  opsFlags,
  opsStatus,
  type OpsAuditEntry,
  type OpsAuditPage,
  type OpsFlag,
  type OpsFlags,
  type OpsStatus,
} from '../api';
import { hasRole, isAuthenticated } from '../auth';
import { Alert, Badge, Btn, Card, Icon, Kpi, Soon } from '../ui';

type Tab =
  | 'overview'
  | 'flags'
  | 'audit'
  | 'logs'
  | 'traces'
  | 'jobs'
  | 'incidents'
  | 'alerts'
  | 'deployments';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'monitoring' },
  { id: 'flags', label: 'Feature flags', icon: 'toggle_on' },
  { id: 'audit', label: 'Audit trail', icon: 'history' },
  { id: 'logs', label: 'Logs', icon: 'description' },
  { id: 'traces', label: 'Traces', icon: 'route' },
  { id: 'jobs', label: 'Jobs', icon: 'schedule' },
  { id: 'incidents', label: 'Incidents', icon: 'warning' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications' },
  { id: 'deployments', label: 'Deployments', icon: 'rocket_launch' },
];

function tone(state: string): 'green' | 'amber' | 'red' | undefined {
  if (state === 'OK' || state === 'UP') return 'green';
  if (state === 'DEGRADED' || state === 'UNKNOWN') return 'amber';
  if (state === 'DOWN' || state === 'UNAVAILABLE') return 'red';
  return undefined;
}

function when(value: string | null | undefined): string {
  if (!value) return 'never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function uptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function errorText(err: unknown): string {
  if (err instanceof HttpError) {
    if (isAuthError(err)) return 'Not signed in — use Staff log in.';
    if (err.status === 403) return 'Your role does not include this ops permission.';
    return err.requestId ? `${err.message} (request ${err.requestId})` : err.message;
  }
  return err instanceof Error ? err.message : 'Ops request failed.';
}

export function OpsView({ mode }: { mode: 'live' | 'preview' }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [status, setStatus] = useState<OpsStatus | null>(null);
  const [flags, setFlags] = useState<OpsFlags | null>(null);
  const [audit, setAudit] = useState<OpsAuditPage | null>(null);
  const [auditError, setAuditError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [auditPage, setAuditPage] = useState(0);
  const [auditAction, setAuditAction] = useState('');
  const [auditDays, setAuditDays] = useState(7);
  const canAudit = hasRole('SUPERADMIN', 'OPS_ADMIN', 'OPS_APPROVER');

  async function loadAudit(page: number, action: string, days: number) {
    if (!canAudit) return;
    setAuditError('');
    try {
      setAudit(await opsAudit(page, 25, action || undefined, days));
      setAuditPage(page);
    } catch (err) {
      setAuditError(errorText(err));
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextStatus, nextFlags] = await Promise.all([opsStatus(), opsFlags()]);
      setStatus(nextStatus);
      setFlags(nextFlags);
      setLastLoaded(new Date());
      if (canAudit) await loadAudit(auditPage, auditAction, auditDays);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode !== 'live' || !isAuthenticated()) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (mode !== 'live') {
    return (
      <Card title="Operations console">
        <Alert kind="info">
          Live mode only. This console reads real health, flags and audit rows — switch to Live and
          sign in with an ops role. No sample telemetry is shown.
        </Alert>
      </Card>
    );
  }

  if (!isAuthenticated()) {
    return (
      <Card title="Operations console">
        <Alert kind="info">Sign in with an ops role to open the console.</Alert>
      </Card>
    );
  }

  return (
    <>
      <div className="topbar" style={{ marginBottom: '0.75rem' }}>
        <h1>Operations console</h1>
        <span className="sub">Read-only Phase 1 — real state only</span>
        <span className={`status-pill${status?.state === 'DOWN' ? ' down' : ''}`}>
          {status ? status.state : '…'}
        </span>
      </div>

      <div className="ops-tabs" role="tablist" aria-label="ops sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => {
              setTab(t.id);
              if (t.id === 'audit' && canAudit && audit === null) {
                void loadAudit(0, auditAction, auditDays);
              }
            }}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {error && <Alert kind="err">{error}</Alert>}
      {loading && !status && <p className="muted">Loading ops status…</p>}

      {tab === 'overview' && status && (
        <>
          <div className="grid">
            <Kpi
              icon="monitor_heart"
              tint={status.state === 'OK' ? '#dff0dc' : '#fbeecb'}
              num={status.state}
              lbl="Overall"
              sub={status.environment}
            />
            <Kpi
              icon="dns"
              tint="#e8eefb"
              num={status.service.state}
              lbl="Application"
              sub={`${status.service.name} ${status.service.version}`}
            />
            <Kpi
              icon="database"
              tint="#eee9d8"
              num={`${status.service.database.latencyMs} ms`}
              lbl="Database"
              sub={status.service.database.state}
            />
            <Kpi
              icon="schedule"
              tint="#eee9d8"
              num={uptime(status.service.uptimeSeconds)}
              lbl="Uptime"
              sub={`checked ${when(status.service.observedAt)}`}
            />
          </div>

          {!status.telemetry.configured && (
            <Alert kind="info">
              Telemetry is not configured. The application is healthy, but no Prometheus, Loki,
              Tempo or Grafana endpoint is set yet (Phase 2). The console reports that honestly
              instead of inventing data.
            </Alert>
          )}
          {status.telemetry.stale && (
            <Alert kind="err">
              A configured telemetry source has no recent successful check — data may be stale.
            </Alert>
          )}

          <Card title="Integration health">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>State</th>
                    <th>Last success</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {status.telemetry.sources.map((source) => (
                    <tr key={source.id}>
                      <td>{source.id}</td>
                      <td>
                        <Badge tone={tone(source.state)}>{source.state}</Badge>
                      </td>
                      <td>{when(source.lastSuccessAt)}</td>
                      <td className="muted">{source.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              Checked {when(status.telemetry.lastCheckedAt)}
              {lastLoaded ? ` · loaded ${lastLoaded.toLocaleTimeString()}` : ''}
            </p>
          </Card>

          <Card title="Links">
            {Object.keys(status.links).length === 0 ? (
              <p className="muted">No telemetry links configured.</p>
            ) : (
              <div className="row">
                {Object.entries(status.links).map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noreferrer">
                    Open {name}
                  </a>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'flags' && (
        <Card title="Feature and module flags">
          {!flags ? (
            <p className="muted">Loading flags…</p>
          ) : flags.items.length === 0 ? (
            <p className="muted">No feature/module flags are seeded.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Type</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.items.map((flag: OpsFlag) => (
                    <tr key={flag.key}>
                      <td><code>{flag.key}</code></td>
                      <td>{flag.value}</td>
                      <td>{flag.type}</td>
                      <td className="muted">
                        {flag.updatedBy} · {when(flag.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted">
            Read-only in Phase 1. Changing flags stays with the existing SUPERADMIN config API until
            Phase 4 adds approval and audit-write controls.
          </p>
        </Card>
      )}

      {tab === 'audit' && (
        <Card title="Audit trail">
          {!canAudit ? (
            <Alert kind="info">
              Audit search needs OPS_ADMIN, OPS_APPROVER or SUPERADMIN. The server enforces this;
              hiding the table is not the control.
            </Alert>
          ) : (
            <>
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadAudit(0, auditAction, auditDays);
                }}
              >
                <label className="field">
                  Action (exact)
                  <input
                    value={auditAction}
                    onChange={(e) => setAuditAction(e.target.value)}
                    placeholder="ops.audit.read"
                  />
                </label>
                <label className="field">
                  Window
                  <select
                    value={auditDays}
                    onChange={(e) => setAuditDays(Number(e.target.value))}
                  >
                    <option value={1}>Last 24 hours</option>
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </label>
                <Btn type="submit" ghost>Apply</Btn>
              </form>
              {auditError && <Alert kind="err">{auditError}</Alert>}
              {!audit ? (
                <p className="muted">Loading audit rows…</p>
              ) : audit.items.length === 0 ? (
                <p className="muted">No matching audit rows in this window.</p>
              ) : (
                <>
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Actor</th>
                          <th>Action</th>
                          <th>Target</th>
                          <th>Reason</th>
                          <th>Payload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audit.items.map((entry: OpsAuditEntry) => (
                          <tr key={entry.id}>
                            <td>{when(entry.createdAt)}</td>
                            <td>{entry.actor}</td>
                            <td><code>{entry.action}</code></td>
                            <td>{entry.objectType}/{entry.objectId}</td>
                            <td>{entry.reason ?? '—'}</td>
                            <td>
                              {entry.before || entry.after ? (
                                <details>
                                  <summary>view</summary>
                                  <pre className="ops-json">
                                    {entry.before ? `before: ${entry.before}\n` : ''}
                                    {entry.after ? `after: ${entry.after}` : ''}
                                  </pre>
                                </details>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="row" style={{ marginTop: '0.75rem' }}>
                    <Btn
                      ghost
                      disabled={audit.page <= 0}
                      onClick={() => void loadAudit(audit.page - 1, auditAction, auditDays)}
                    >
                      Previous
                    </Btn>
                    <span className="muted">
                      Page {audit.page + 1} of {Math.max(1, audit.totalPages)} · {audit.total} rows
                    </span>
                    <Btn
                      ghost
                      disabled={audit.page + 1 >= audit.totalPages}
                      onClick={() => void loadAudit(audit.page + 1, auditAction, auditDays)}
                    >
                      Next
                    </Btn>
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      )}

      {tab === 'logs' && (
        <Soon
          icon="description"
          title="Logs arrive in Phase 2"
          why="JSON logs (with request and trace IDs) are already written locally to logs/erp-app.jsonl. Loki/Promtail search and retention are Phase 2."
        />
      )}
      {tab === 'traces' && (
        <Soon
          icon="route"
          title="Traces arrive in Phase 2"
          why="OTLP tracing is wired; Tempo storage and the trace search UI are Phase 2. No trace rows are fabricated."
        />
      )}
      {tab === 'jobs' && (
        <Soon
          icon="schedule"
          title="Job history arrives in Phase 4"
          why="The two scheduled jobs (hold expiry, membership expiry) run today without a run-history table. Phase 4 adds per-run records and bounded retries."
        />
      )}
      {tab === 'incidents' && (
        <Soon
          icon="warning"
          title="Incidents arrive in Phase 4"
          why="Incident ownership, acknowledgement and the timeline are Phase 4. Read-only alert data is Phase 2/4."
        />
      )}
      {tab === 'alerts' && (
        <Soon
          icon="notifications"
          title="Alerts arrive in Phase 2"
          why="Alertmanager rule health and alert history need the Phase 2 telemetry services. This page will show their real state, not placeholders."
        />
      )}
      {tab === 'deployments' && (
        <Soon
          icon="rocket_launch"
          title="Deployments unavailable"
          why="There is no Dockerfile, Kubernetes manifest, deployment pipeline or production credential in this repository yet. Deployment history/rollback stays disabled until those exist and are approved."
        />
      )}
    </>
  );
}
