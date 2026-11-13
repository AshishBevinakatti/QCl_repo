import { useEffect, useState, useTransition } from 'react';
import {
  listSalesLeads, claimSalesLead, addLeadActivity,
  convertLeadToGuest, createGuest,
  type LeadDetailDto,
} from './api';
import { username } from './auth';
import { Alert, Badge, Btn, Icon, PageHeader, Stat } from './ui';

interface LeadsViewProps {
  onViewGuest?: (guestId: string) => void;
}

type LeadFilter = 'ALL' | 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST';

/* The service's enum values are the API contract and stay as they are; these
 * are only how they read on screen. IN_PROGRESS is not a word. */
const LEAD_FILTERS: { id: LeadFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'NEW', label: 'New' },
  { id: 'IN_PROGRESS', label: 'In follow-up' },
  { id: 'CONVERTED', label: 'Converted' },
  { id: 'LOST', label: 'Lost' },
];

const LEAD_STATE: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In follow-up',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

function leadState(status: string): string {
  return LEAD_STATE[status] ?? status;
}

/* How an activity reads in the log. */
const ACTIVITY_LABEL: Record<string, string> = {
  CALL: 'Call',
  WHATSAPP: 'WhatsApp',
  NOTE: 'Note',
  CLAIMED: 'Claimed',
  CONVERTED: 'Converted',
};

function activityLabel(type: string): string {
  return ACTIVITY_LABEL[type] ?? type.toLowerCase();
}

export function LeadsView({ onViewGuest }: LeadsViewProps) {
  const [leads, setLeads] = useState<LeadDetailDto[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadDetailDto | null>(null);
  const [filter, setFilter] = useState<LeadFilter>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Activity Note form
  const [noteType, setNoteType] = useState('CALL');
  const [noteText, setNoteText] = useState('');

  // Conversion state
  const [converting, setConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);
  /* Failures belong on the screen next to the thing that failed, not in a
   * browser dialog the user has to dismiss before they can read the row. */
  const [error, setError] = useState<string | null>(null);

  const actor = username() || 'sales_executive';

  useEffect(() => {
    refreshLeads();
    const interval = setInterval(refreshLeads, 10000); // Poll every 10s for new leads & timer updates
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshLeads() {
    listSalesLeads()
      .then((data) => {
        setLeads(data);
        setLoading(false);
        if (selectedLead) {
          const fresh = data.find((l) => l.id === selectedLead.id);
          if (fresh) setSelectedLead(fresh);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }

  function handleClaim(leadId: string) {
    startTransition(async () => {
      setError(null);
      try {
        const updated = await claimSalesLead(leadId, actor);
        refreshLeads();
        setSelectedLead(updated);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not claim this inquiry.');
      }
    });
  }

  function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;

    startTransition(async () => {
      setError(null);
      try {
        const updated = await addLeadActivity(selectedLead.id, actor, noteType, noteText.trim());
        setSelectedLead(updated);
        setNoteText('');
        refreshLeads();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not add that to the log.');
      }
    });
  }

  function handleConvertToGuest() {
    if (!selectedLead) return;
    setConverting(true);
    setConversionMessage(null);

    startTransition(async () => {
      try {
        // 1. Create canonical Guest in Core ERP
        const erpGuest = await createGuest(selectedLead.name, selectedLead.phone, selectedLead.email);

        // 2. Mark Lead as CONVERTED in Lead Service with link to ERP Guest ID
        const updatedLead = await convertLeadToGuest(selectedLead.id, actor, erpGuest.id);
        setSelectedLead(updatedLead);
        refreshLeads();
        setConverting(false);
        setConversionMessage(`${erpGuest.name} now has a guest record — reception can book against it`);
      } catch (err: unknown) {
        setConverting(false);
        setError(err instanceof Error ? err.message : 'Could not create a guest record.');
      }
    });
  }

  // Filtered leads
  const filtered = leads.filter((l) => {
    if (filter !== 'ALL' && l.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.publicReference.toLowerCase().includes(q) ||
        l.roomCategory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const newCount = leads.filter((l) => l.status === 'NEW').length;
  const inProgressCount = leads.filter((l) => l.status === 'IN_PROGRESS').length;
  const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;
  const breachedCount = leads.filter((l) => l.slaBreached && l.status === 'NEW').length;

  return (
    <div className="leads-workspace">
      <PageHeader
        title="Sales leads"
        subtitle="Booking inquiries from the public site, with a five-minute response clock on each new one"
      />

      {/* One stat row on the shared grid, so these cannot stack full width again. */}
      <div className="stats">
        <Stat
          label="Unattended"
          num={newCount}
          sub="waiting to be claimed"
          lead={newCount > 0}
        />
        <Stat
          label="Past five minutes"
          num={breachedCount}
          sub={breachedCount > 0 ? 'call placed automatically' : 'all answered in time'}
        />
        <Stat label="In follow-up" num={inProgressCount} sub="conversation open" />
        <Stat label="Converted" num={convertedCount} sub="now a guest record" />
      </div>

      <div className="leads-controls">
        <div className="leads-search">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Name, phone or reference"
            aria-label="Search leads by name, phone or reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="leads-filter-pills">
          <div className="leads-filters" role="group" aria-label="Filter leads by state">
            {LEAD_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-pill ${filter === f.id ? 'active' : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Btn ghost onClick={refreshLeads}>Refresh</Btn>
        </div>
      </div>

      {error && <Alert kind="err">{error}</Alert>}

      {/* Main Split: Leads Table + Detail Panel */}
      <div className={`leads-split${selectedLead ? ' has-selection' : ''}`}>
        <div className="card leads-table-card">
          {loading ? (
            <p className="muted" style={{ padding: 20 }}>Loading leads…</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon"><Icon name="person_search" size={18} /></span>
              <strong>No leads to show</strong>
              <p>
                {leads.length === 0
                  ? 'Nothing has come in from the public site yet. An inquiry submitted there appears here within a few seconds.'
                  : 'No lead matches this filter or search.'}
              </p>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl tbl--pick">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Guest</th>
                    <th>Stay</th>
                    <th>Received</th>
                    <th>Response clock</th>
                    <th>State</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const now = new Date().getTime();
                    const deadline = new Date(lead.slaDeadline).getTime();
                    const secondsLeft = Math.round((deadline - now) / 1000);
                    const isOverdue = secondsLeft <= 0 && lead.status === 'NEW';

                    return (
                      <tr
                        key={lead.id}
                        tabIndex={0}
                        className={isSelected ? 'is-selected' : ''}
                        aria-selected={isSelected}
                        onClick={() => setSelectedLead(lead)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLead(lead); }
                        }}
                      >
                        <td><span className="lead-ref">{lead.publicReference}</span></td>
                        <td>
                          <div className="lead-guest-cell">
                            <span className="guest-name">{lead.name}</span>
                            <span className="guest-phone">{lead.phone}</span>
                          </div>
                        </td>
                        <td>
                          <div className="lead-stay-cell">
                            <span>{lead.roomCategory}</span>
                            <span className="stay-dates">{lead.checkinDate} → {lead.checkoutDate}</span>
                          </div>
                        </td>
                        <td className="num">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          {lead.status === 'NEW' ? (
                            isOverdue || lead.slaBreached ? (
                              <Badge tone="red">Call placed</Badge>
                            ) : (
                              <Badge tone="amber">
                                <span className="lead-countdown">
                                  {Math.floor(secondsLeft / 60)}m {String(secondsLeft % 60).padStart(2, '0')}s
                                </span>
                                {' '}left
                              </Badge>
                            )
                          ) : (
                            <span className="muted">Answered</span>
                          )}
                        </td>
                        <td>
                          <Badge tone={lead.status === 'CONVERTED' ? 'green' : lead.status === 'LOST' ? 'red' : 'amber'}>
                            {leadState(lead.status)}
                          </Badge>
                        </td>
                        <td>
                          {lead.status === 'NEW' ? (
                            <button
                              type="button"
                              className="mini-btn primary"
                              onClick={(e) => { e.stopPropagation(); handleClaim(lead.id); }}
                            >
                              Claim
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="mini-btn"
                              onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedLead && (
          <div className="card lead-detail-card">
            <div className="detail-header">
              <div>
                <span className="detail-eyebrow">Inquiry</span>
                <h3>{selectedLead.publicReference}</h3>
              </div>
              <Badge tone={selectedLead.status === 'CONVERTED' ? 'green' : selectedLead.status === 'LOST' ? 'red' : 'amber'}>
                {leadState(selectedLead.status)}
              </Badge>
            </div>

            <div className="detail-guest-info">
              <h4>{selectedLead.name}</h4>
              <p>
                <Icon name="call" size={18} /> <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a>
              </p>
              <p>
                <Icon name="mail" size={18} /> <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a>
              </p>
              <div className="stay-spec">
                <strong>{selectedLead.roomCategory}</strong> for {selectedLead.guestCount}{' '}
                {selectedLead.guestCount === 1 ? 'guest' : 'guests'}<br />
                <span>{selectedLead.checkinDate} to {selectedLead.checkoutDate}</span>
              </div>
              {selectedLead.notes && (
                <div className="detail-guest-notes">
                  <p>{selectedLead.notes}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="detail-actions">
              {selectedLead.status === 'NEW' && (
                <Btn
                  onClick={() => handleClaim(selectedLead.id)}
                  disabled={isPending}
                  title="Claiming stops the five-minute clock and the automatic call that follows it"
                >
                  Claim this inquiry
                </Btn>
              )}

              {selectedLead.status === 'IN_PROGRESS' && (
                <div className="conversion-box">
                  <Btn
                    onClick={handleConvertToGuest}
                    disabled={converting || isPending}
                  >
                    {converting ? 'Creating guest' : 'Create guest record'}
                  </Btn>
                  <span className="convert-hint">
                    Saves the profile to the resort database, where reception can find it and
                    book against it.
                  </span>
                </div>
              )}

              {selectedLead.status === 'CONVERTED' && (
                <div className="converted-success-box">
                  <Badge tone="green">Guest record created</Badge>
                  {selectedLead.erpGuestId && (
                    <Btn ghost onClick={() => onViewGuest?.(selectedLead.erpGuestId!)}>
                      Open guest
                    </Btn>
                  )}
                </div>
              )}

              {conversionMessage && (
                <div className="conversion-alert">{conversionMessage}</div>
              )}
            </div>

            {/* Activity History & Log Call Form */}
            <div className="detail-timeline">
              <h4>What has happened</h4>

              <form onSubmit={handleAddActivity} className="activity-form">
                <div className="activity-inputs">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    aria-label="Kind of contact"
                  >
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="NOTE">Note</option>
                  </select>
                  <input
                    type="text"
                    placeholder="What was said"
                    aria-label="What was said"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                  />
                  <Btn type="submit" disabled={isPending}>Add to log</Btn>
                </div>
              </form>

              <div className="activity-list">
                {selectedLead.activities?.map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className="act-meta">
                      <span className="act-type">{activityLabel(act.activityType)}</span>
                      <span className="act-actor">{act.actor}</span>
                      <span className="act-time">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="act-desc">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
