import { useEffect, useState, useTransition } from 'react';
import {
  listSalesLeads, claimSalesLead, addLeadActivity,
  convertLeadToGuest, createGuest,
  type LeadDetailDto,
} from './api';
import { username } from './auth';
import { Badge, Btn, Icon, PageHeader } from './ui';

interface LeadsViewProps {
  onViewGuest?: (guestId: string) => void;
}

export function LeadsView({ onViewGuest }: LeadsViewProps) {
  const [leads, setLeads] = useState<LeadDetailDto[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadDetailDto | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Activity Note form
  const [noteType, setNoteType] = useState('CALL');
  const [noteText, setNoteText] = useState('');

  // Conversion state
  const [converting, setConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);

  const actor = username() || 'sales_executive';

  useEffect(() => {
    refreshLeads();
    const interval = setInterval(refreshLeads, 10000); // Poll every 10s for new leads & timer updates
    return () => clearInterval(interval);
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
      try {
        const updated = await claimSalesLead(leadId, actor);
        refreshLeads();
        setSelectedLead(updated);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Claim failed');
      }
    });
  }

  function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !noteText.trim()) return;

    startTransition(async () => {
      try {
        const updated = await addLeadActivity(selectedLead.id, actor, noteType, noteText.trim());
        setSelectedLead(updated);
        setNoteText('');
        refreshLeads();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to add activity');
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
        setConversionMessage(`Successfully converted! Created ERP Guest: ${erpGuest.name} (ID: ${erpGuest.id})`);
      } catch (err: unknown) {
        setConverting(false);
        alert(err instanceof Error ? err.message : 'Conversion to ERP Guest failed');
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
        title="Sales Leads &amp; Guest Inquiries"
        subtitle="Landing page booking intents, instant WhatsApp alerts, and 5-minute SLA monitoring"
      />

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Unattended Inquiries</span>
            <Icon name="notifications" size={18} />
          </div>
          <div className="kpi-value">{newCount}</div>
          <span className="kpi-sub">Awaiting Sales claim</span>
        </div>

        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">5-Min SLA Breached</span>
            <Icon name="warning" size={18} />
          </div>
          <div className="kpi-value" style={{ color: breachedCount > 0 ? '#b91c1c' : 'inherit' }}>
            {breachedCount}
          </div>
          <span className="kpi-sub">{breachedCount > 0 ? 'Automated voice calls triggered' : 'All within SLA'}</span>
        </div>

        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">In Follow-Up</span>
            <Icon name="call" size={18} />
          </div>
          <div className="kpi-value">{inProgressCount}</div>
          <span className="kpi-sub">Active conversations</span>
        </div>

        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Converted to ERP</span>
            <Icon name="badge_check" size={18} />
          </div>
          <div className="kpi-value">{convertedCount}</div>
          <span className="kpi-sub">Ready for Front Office</span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="leads-controls">
        <div className="leads-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Search by guest name, phone, or ref (GHR-...)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="leads-filter-pills">
          {(['ALL', 'NEW', 'IN_PROGRESS', 'CONVERTED', 'LOST'] as const).map((st) => (
            <button
              key={st}
              className={`filter-pill ${filter === st ? 'active' : ''}`}
              onClick={() => setFilter(st)}
            >
              {st}
            </button>
          ))}
          <Btn ghost onClick={refreshLeads}>
            Refresh
          </Btn>
        </div>
      </div>

      {/* Main Split: Leads Table + Detail Panel */}
      <div className="leads-split">
        <div className="card leads-table-card">
          {loading ? (
            <p className="loading-state">Loading sales leads from microservice (:8082)...</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="person_search" size={32} />
              <p>No leads found matching your criteria.</p>
              {leads.length === 0 && (
                <span className="empty-sub">
                  Submit a test inquiry on the Landing Page at <code>http://localhost:3000/plan-ahead</code>.
                </span>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Guest</th>
                    <th>Cottage / Dates</th>
                    <th>Received</th>
                    <th>SLA Status</th>
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
                        className={`lead-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td>
                          <strong>{lead.publicReference}</strong>
                        </td>
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
                        <td>{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {lead.status === 'NEW' ? (
                            isOverdue || lead.slaBreached ? (
                              <Badge tone="red">
                                <Icon name="warning" size={12} /> BREACHED (Call Placed)
                              </Badge>
                            ) : (
                              <Badge tone="amber">
                                <Icon name="schedule" size={12} /> {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s left
                              </Badge>
                            )
                          ) : (
                            <span className="text-muted">Disarmed</span>
                          )}
                        </td>
                        <td>
                          <Badge tone={lead.status === 'CONVERTED' ? 'green' : lead.status === 'IN_PROGRESS' ? 'amber' : 'amber'}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td>
                          {lead.status === 'NEW' ? (
                            <Btn
                              onClick={() => {
                                handleClaim(lead.id);
                              }}
                            >
                              Claim &amp; Attend
                            </Btn>
                          ) : (
                            <Btn ghost onClick={() => setSelectedLead(lead)}>
                              View
                            </Btn>
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
                <span className="detail-eyebrow">Lead Detail</span>
                <h3>{selectedLead.publicReference}</h3>
              </div>
              <Badge tone={selectedLead.status === 'CONVERTED' ? 'green' : selectedLead.status === 'IN_PROGRESS' ? 'amber' : 'amber'}>
                {selectedLead.status}
              </Badge>
            </div>

            <div className="detail-guest-info">
              <h4>{selectedLead.name}</h4>
              <p>
                <Icon name="call" size={14} /> <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a>
              </p>
              <p>
                <Icon name="mail" size={14} /> <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a>
              </p>
              <div className="stay-spec">
                <strong>{selectedLead.roomCategory}</strong> • {selectedLead.guestCount} guests<br />
                <span>{selectedLead.checkinDate} to {selectedLead.checkoutDate}</span>
              </div>
              {selectedLead.notes && (
                <div className="detail-guest-notes">
                  <em>"{selectedLead.notes}"</em>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="detail-actions">
              {selectedLead.status === 'NEW' && (
                <Btn
                  onClick={() => handleClaim(selectedLead.id)}
                  disabled={isPending}
                >
                  Claim Lead (Disarms 5-Min Alert)
                </Btn>
              )}

              {selectedLead.status === 'IN_PROGRESS' && (
                <div className="conversion-box">
                  <Btn
                    onClick={handleConvertToGuest}
                    disabled={converting || isPending}
                  >
                    {converting ? 'Creating in ERP...' : 'Convert to ERP Guest Record'}
                  </Btn>
                  <span className="convert-hint">
                    Saves profile to Core ERP database. Receptionist will immediately see it in Guest 360.
                  </span>
                </div>
              )}

              {selectedLead.status === 'CONVERTED' && (
                <div className="converted-success-box">
                  <Badge tone="green">
                    Converted to ERP Guest
                  </Badge>
                  {selectedLead.erpGuestId && (
                    <div style={{ marginTop: 8 }}>
                      <Btn
                        ghost
                        onClick={() => onViewGuest?.(selectedLead.erpGuestId!)}
                      >
                        View in Guest 360 Workspace →
                      </Btn>
                    </div>
                  )}
                </div>
              )}

              {conversionMessage && (
                <div className="conversion-alert">{conversionMessage}</div>
              )}
            </div>

            {/* Activity History & Log Call Form */}
            <div className="detail-timeline">
              <h4>Activity &amp; Interactions</h4>

              <form onSubmit={handleAddActivity} className="activity-form">
                <div className="activity-inputs">
                  <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="NOTE">Internal Note</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Log conversation outcome..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                  />
                  <Btn type="submit" disabled={isPending}>
                    Save
                  </Btn>
                </div>
              </form>

              <div className="activity-list">
                {selectedLead.activities?.map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className="act-meta">
                      <span className="act-type">{act.activityType}</span>
                      <span className="act-actor">{act.actor}</span>
                      <span className="act-time">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
