import { useEffect, useRef, useState } from 'react';
import {
  HttpError, createGuest, enrollMember, guestById, isAuthError, memberDashboard,
  redeemPoints, searchGuests, type GuestDto, type MemberDto,
} from './api';
import { hasRole, login } from './auth';
import type { Mode } from './dashboard';
import { Alert, Badge, Btn, Field, Icon, PageHeader, statusTone } from './ui';

const PAGE_SIZE = 20;
const PHONE_PATTERN = /^[+]?[0-9][0-9 ()-]{5,}$/;

type LoadError = { text: string; auth: boolean };

function errorText(err: unknown): LoadError {
  if (isAuthError(err)) {
    return { text: 'You are signed out. Log in to search guest records.', auth: true };
  }
  if (err instanceof HttpError && err.status === 403) {
    return { text: 'Your role cannot access this guest action.', auth: false };
  }
  return {
    text: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    auth: false,
  };
}

function label(value: string | null | undefined): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.[0] ?? '?')
    .toUpperCase();
}

function preferenceEntries(raw: string): [string, string][] {
  if (!raw || raw.trim() === '' || raw.trim() === '{}') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    return Object.entries(parsed)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, String(value)]);
  } catch {
    return [];
  }
}

function displayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function membershipError(err: unknown): string {
  if (isAuthError(err)) return 'You are signed out. Log in to manage membership.';
  if (err instanceof HttpError && err.status === 403) {
    return 'Your role can view guests but cannot enroll or redeem memberships.';
  }
  return err instanceof Error ? err.message : 'Membership action failed. Please try again.';
}

export function GuestsView({ mode, initialQ, jumpNonce }: {
  mode: Mode; initialQ?: string; jumpNonce?: number;
}) {
  const [query, setQuery] = useState(initialQ ?? '');
  const [committedQuery, setCommittedQuery] = useState(initialQ ?? '');
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<LoadError | null>(null);
  const [selected, setSelected] = useState<GuestDto | null>(null);
  const [profileMember, setProfileMember] = useState<MemberDto | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberNonce, setMemberNonce] = useState(0);
  const [notice, setNotice] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemFolio, setRedeemFolio] = useState('');
  const [redeemPointsInput, setRedeemPointsInput] = useState('100');
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createError, setCreateError] = useState('');
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);

  const searchSeq = useRef(0);
  const autoOpenRef = useRef(Boolean(initialQ));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLElement>(null);

  const canEnroll = mode === 'preview' || hasRole(
    'RECEPTION', 'MEMBERSHIP', 'MANAGER', 'SUPERADMIN',
  );
  const canRedeem = mode === 'preview' || hasRole(
    'RECEPTION', 'MEMBERSHIP', 'MANAGER', 'SUPERADMIN', 'ACCOUNTS',
  );
  const preferences = selected ? preferenceEntries(selected.preferences) : [];

  useEffect(() => {
    if (initialQ === undefined) return;
    setQuery(initialQ);
    setCommittedQuery(initialQ);
    autoOpenRef.current = true;
    setSearchNonce((n) => n + 1);
  }, [initialQ, jumpNonce]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCommittedQuery(query.trim());
    }, query.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (mode === 'preview') {
      searchSeq.current += 1;
      setGuests([]);
      setTotal(0);
      setSearching(false);
      setSearchError(null);
      setSelected(null);
      setProfileMember(null);
      setMemberError('');
      setNotice('');
      return;
    }

    const id = ++searchSeq.current;
    setSearching(true);
    setSearchError(null);
    searchGuests(committedQuery, 0, PAGE_SIZE)
      .then((page) => {
        if (id !== searchSeq.current) return;
        setGuests(page.items);
        setTotal(page.total);
        if (autoOpenRef.current) {
          autoOpenRef.current = false;
          if (page.items.length === 1) {
            setSelected(page.items[0]);
            setProfileMember(null);
            setNotice('');
            setMemberError('');
            setRedeemOpen(false);
          }
        }
      })
      .catch((err: unknown) => {
        if (id !== searchSeq.current) return;
        setGuests([]);
        setTotal(0);
        setSearchError(errorText(err));
      })
      .finally(() => {
        if (id === searchSeq.current) setSearching(false);
      });
  }, [committedQuery, mode, searchNonce]);

  useEffect(() => {
    if (!selected) {
      setProfileMember(null);
      setMemberLoading(false);
      setMemberError('');
      return;
    }
    if (!selected.memberId) {
      setProfileMember(null);
      setMemberLoading(false);
      setMemberError('');
      return;
    }

    let cancelled = false;
    setProfileMember(null);
    setMemberLoading(true);
    setMemberError('');
    memberDashboard(selected.memberId)
      .then((member) => {
        if (!cancelled) setProfileMember(member);
      })
      .catch((err: unknown) => {
        if (!cancelled) setMemberError(membershipError(err));
      })
      .finally(() => {
        if (!cancelled) setMemberLoading(false);
      });
    return () => { cancelled = true; };
  }, [selected, memberNonce]);

  useEffect(() => {
    if (!createOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !creating) closeCreate();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
    // closeCreate is stable for this modal's purpose; re-registering on `creating` is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, creating]);

  function scrollProfileIntoView() {
    if (window.innerWidth > 1100) return;
    window.setTimeout(() => {
      profileRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function openProfile(guest: GuestDto) {
    setSelected(guest);
    setProfileMember(null);
    setMemberError('');
    setNotice('');
    setRedeemOpen(false);
    setRedeemError('');
    setRedeemFolio('');
    setRedeemPointsInput('100');
    scrollProfileIntoView();
  }

  function backToResults() {
    setSelected(null);
    setProfileMember(null);
    setMemberError('');
    setNotice('');
    setRedeemOpen(false);
    setRedeemError('');
    if (window.innerWidth <= 1100) {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    autoOpenRef.current = false;
    setCommittedQuery(query.trim());
    setSearchNonce((n) => n + 1);
  }

  function clearSearch() {
    setQuery('');
    setCommittedQuery('');
    setSearchNonce((n) => n + 1);
    searchInputRef.current?.focus();
  }

  function openCreate() {
    setCreateOpen(true);
    setCreateError('');
    setDuplicateId(null);
  }

  function closeCreate() {
    if (creating || duplicateBusy) return;
    setCreateOpen(false);
    setCreateName('');
    setCreatePhone('');
    setCreateError('');
    setDuplicateId(null);
  }

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    if (creating) return;
    setCreateError('');
    setDuplicateId(null);
    const name = createName.trim();
    const phone = createPhone.trim();
    if (!name) {
      setCreateError('Enter the guest’s full name.');
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setCreateError('Enter a valid phone number, including the country or STD code.');
      return;
    }
    if (mode === 'preview') {
      setCreateError('Preview mode — connect Live to create a real guest.');
      return;
    }

    setCreating(true);
    try {
      const guest = await createGuest(name, phone);
      setCreateOpen(false);
      setCreateName('');
      setCreatePhone('');
      setCreateError('');
      setDuplicateId(null);
      setQuery('');
      setCommittedQuery('');
      setSearchNonce((n) => n + 1);
      setGuests((current) => [guest, ...current.filter((g) => g.id !== guest.id)]);
      setTotal((current) => Math.max(current + 1, 1));
      setSelected(guest);
      setProfileMember(null);
      setMemberError('');
      setNotice(`${guest.name} was created. You can enroll them in membership below.`);
      setRedeemOpen(false);
      scrollProfileIntoView();
    } catch (err) {
      if (err instanceof HttpError && err.code === 'GUEST_EXISTS') {
        setCreateError('This phone number is already registered to a guest.');
        setDuplicateId(err.details?.existingGuestId ?? null);
      } else if (err instanceof HttpError && err.status === 403) {
        setCreateError('Your role cannot create guest profiles.');
      } else {
        setCreateError(errorText(err).text);
      }
    } finally {
      setCreating(false);
    }
  }

  async function openExistingGuest() {
    if (!duplicateId) return;
    setDuplicateBusy(true);
    setCreateError('');
    try {
      const guest = await guestById(duplicateId);
      setCreateOpen(false);
      setCreateName('');
      setCreatePhone('');
      setDuplicateId(null);
      setQuery(guest.phone);
      setCommittedQuery(guest.phone);
      setGuests([guest]);
      setTotal(1);
      setSelected(guest);
      setProfileMember(null);
      setMemberError('');
      setNotice('Existing guest profile opened.');
      setRedeemOpen(false);
      scrollProfileIntoView();
    } catch (err) {
      setCreateError(errorText(err).text);
    } finally {
      setDuplicateBusy(false);
    }
  }

  async function enroll() {
    if (!selected || enrolling) return;
    if (mode === 'preview') {
      setNotice('Preview mode — membership enrolment is not saved.');
      return;
    }
    setEnrolling(true);
    setMemberError('');
    setNotice('');
    try {
      const member = await enrollMember(selected.id);
      setProfileMember(member);
      setSelected((current) => (
        current && current.id === selected.id ? { ...current, memberId: member.id } : current
      ));
      setGuests((current) => current.map((g) => (
        g.id === selected.id ? { ...g, memberId: member.id } : g
      )));
      setNotice(`${selected.name} is now a ${member.tier} member (${member.membershipNo}).`);
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        try {
          const fresh = await guestById(selected.id);
          setSelected(fresh);
          setGuests((current) => current.map((g) => (
            g.id === fresh.id ? { ...g, memberId: fresh.memberId } : g
          )));
          setNotice('Membership status refreshed for this guest.');
          setMemberNonce((n) => n + 1);
        } catch {
          setMemberError('This guest is already enrolled. Refresh the profile to see the membership.');
        }
      } else {
        setMemberError(membershipError(err));
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function redeem(event: React.FormEvent) {
    event.preventDefault();
    if (!profileMember || redeemBusy) return;
    setRedeemError('');
    const points = Number(redeemPointsInput);
    if (!redeemFolio.trim()) {
      setRedeemError('Enter the folio ID to credit.');
      return;
    }
    if (!Number.isInteger(points) || points <= 0) {
      setRedeemError('Enter a positive whole number of points.');
      return;
    }
    if (mode === 'preview') {
      setNotice('Preview mode — points are not spent.');
      return;
    }
    setRedeemBusy(true);
    try {
      const member = await redeemPoints(profileMember.id, redeemFolio.trim(), points);
      setProfileMember(member);
      setNotice(`Redeemed ${points.toLocaleString('en-IN')} points to the folio.`);
      setRedeemOpen(false);
      setRedeemFolio('');
    } catch (err) {
      setRedeemError(membershipError(err));
    } finally {
      setRedeemBusy(false);
    }
  }

  return (
    <div className="guests-page">
      <PageHeader
        title="Guests"
        subtitle="Find guests, review their information and manage their records"
        actions={<Btn onClick={openCreate}><Icon name="person_add" /> Add New Guest</Btn>}
      />

      <section className="card guests-search-card" aria-label="Guest search">
        <form className="guests-search" onSubmit={submitSearch} role="search">
          <Icon name="search" size={18} />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) clearSearch();
            }}
            placeholder="Search by guest name or phone number"
            aria-label="Search guests by name or phone number"
          />
          {query && (
            <button
              type="button"
              className="guests-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <Icon name="close" size={16} />
            </button>
          )}
          <button type="submit" className="btn guests-search-btn">Search</button>
        </form>
        {mode === 'preview' && (
          <p className="guests-search-note">
            Preview mode shows the workspace layout only. Connect Live to search real guest records.
          </p>
        )}
      </section>

      <div className={`guests-workspace${selected ? ' has-selection' : ''}`}>
        <section className="card guests-results" ref={resultsRef} aria-label="Guest results">
          <div className="guests-results-head">
            <div>
              <h2>{committedQuery ? 'Search results' : 'All guests'}</h2>
              <p>
                {committedQuery
                  ? `Matches for “${committedQuery}”.`
                  : 'Search by name or phone, or select a guest below.'}
              </p>
            </div>
            {!searching && !searchError && (
              <span className="guests-count">{total.toLocaleString('en-IN')} {total === 1 ? 'guest' : 'guests'}</span>
            )}
          </div>

          {searching ? (
            <div className="guests-state" role="status" aria-live="polite">
              <Icon name="progress_activity" size={24} />
              <strong>Searching guests…</strong>
            </div>
          ) : searchError ? (
            <div className="guests-state guests-state--error" role="alert">
              <Icon name="error" size={24} />
              <strong>{searchError.text}</strong>
              {searchError.auth ? (
                <Btn onClick={login}>Staff log in</Btn>
              ) : (
                <Btn ghost onClick={() => setSearchNonce((n) => n + 1)}>Try again</Btn>
              )}
            </div>
          ) : guests.length === 0 ? (
            <div className="guests-state">
              <Icon name="person_search" size={24} />
              <strong>
                {mode === 'preview'
                  ? 'Guest records are available in Live mode.'
                  : committedQuery
                    ? 'No guests match this search.'
                    : 'No guest records yet.'}
              </strong>
              <p>
                {committedQuery
                  ? 'Try a different name or phone number.'
                  : mode === 'preview'
                    ? 'Switch to Live to search the resort guest database.'
                    : 'Add a new guest to get started.'}
              </p>
              {!committedQuery && mode === 'live' && (
                <Btn ghost onClick={openCreate}>Add New Guest</Btn>
              )}
            </div>
          ) : (
            <>
              <div className="guest-list">
                {guests.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    className={`guest-row${selected?.id === guest.id ? ' is-selected' : ''}`}
                    onClick={() => openProfile(guest)}
                    aria-current={selected?.id === guest.id ? 'true' : undefined}
                    aria-label={`Open profile for ${guest.name}`}
                  >
                    <span className="guest-row-main">
                      <span className="guest-avatar">{initials(guest.name)}</span>
                      <span className="guest-row-copy">
                        <strong>{guest.name}</strong>
                        <span>{guest.phone}</span>
                      </span>
                    </span>
                    <span className="guest-row-status">
                      <Badge tone={statusTone(guest.status)}>{label(guest.status)}</Badge>
                    </span>
                    <span className="guest-row-member">
                      {guest.memberId ? (
                        <span className="guest-member-chip">
                          <Icon name="workspace_premium" /> Member
                        </span>
                      ) : (
                        <span className="muted">Not a member</span>
                      )}
                    </span>
                    <span className="guest-row-open">Open <Icon name="chevron_right" size={16} /></span>
                  </button>
                ))}
              </div>
              {total > guests.length && (
                <p className="guests-more">
                  Showing the first {guests.length.toLocaleString('en-IN')} of{' '}
                  {total.toLocaleString('en-IN')} matches. Refine your search to narrow the list.
                </p>
              )}
            </>
          )}
        </section>

        {selected ? (
          <aside className="card guest-profile" ref={profileRef} aria-label="Selected guest profile">
            <button type="button" className="guest-back" onClick={backToResults}>
              <Icon name="arrow_back" size={16} /> Back to results
            </button>

            <div className="guest-profile-head">
              <span className="guest-avatar guest-avatar--large">{initials(selected.name)}</span>
              <div>
                <h2>{selected.name}</h2>
                <a href={`tel:${selected.phone.replace(/[^+0-9]/g, '')}`}>{selected.phone}</a>
              </div>
              <Badge tone={statusTone(selected.status)}>{label(selected.status)}</Badge>
            </div>

            {notice && <Alert kind="ok">{notice}</Alert>}

            <section className="guest-section">
              <h3>Guest information</h3>
              <dl className="guest-detail-grid">
                <dt>Phone</dt>
                <dd><a href={`tel:${selected.phone.replace(/[^+0-9]/g, '')}`}>{selected.phone}</a></dd>
                <dt>Status</dt>
                <dd>{label(selected.status)}</dd>
                {selected.idType && (
                  <>
                    <dt>ID type</dt>
                    <dd>{selected.idType}</dd>
                  </>
                )}
                {preferences.length > 0 && (
                  <>
                    <dt>Preferences</dt>
                    <dd>
                      {preferences.map(([key, value]) => (
                        <span key={key} className="guest-preference">{label(key)}: {value}</span>
                      ))}
                    </dd>
                  </>
                )}
              </dl>
            </section>

            <section className="guest-section">
              <div className="guest-section-head">
                <h3>Membership</h3>
                {profileMember && (
                  <Badge tone={statusTone(profileMember.status)}>{label(profileMember.status)}</Badge>
                )}
              </div>

              {memberLoading ? (
                <p className="muted" role="status">Loading membership…</p>
              ) : profileMember ? (
                <div className="guest-member-box">
                  <dl className="guest-member-grid">
                    <div><dt>Membership no.</dt><dd>{profileMember.membershipNo}</dd></div>
                    <div><dt>Tier</dt><dd>{profileMember.tier}</dd></div>
                    <div><dt>Points</dt><dd>{profileMember.points.toLocaleString('en-IN')}</dd></div>
                    <div><dt>Valid until</dt><dd>{displayDate(profileMember.validTo)}</dd></div>
                  </dl>
                  {canRedeem ? (
                    <div className="guest-redeem">
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => { setRedeemOpen((open) => !open); setRedeemError(''); }}
                        aria-expanded={redeemOpen}
                      >
                        {redeemOpen ? 'Hide redemption' : 'Redeem points'}
                      </button>
                      {redeemOpen && (
                        <form onSubmit={redeem} className="guest-redeem-form">
                          <Field label="Folio ID">
                            <input
                              value={redeemFolio}
                              onChange={(event) => setRedeemFolio(event.target.value)}
                              placeholder="Folio UUID"
                              required
                            />
                          </Field>
                          <Field label="Points">
                            <input
                              value={redeemPointsInput}
                              onChange={(event) => setRedeemPointsInput(event.target.value)}
                              inputMode="numeric"
                              required
                            />
                          </Field>
                          <Btn type="submit" disabled={redeemBusy}>
                            {redeemBusy ? 'Redeeming…' : 'Redeem'}
                          </Btn>
                        </form>
                      )}
                      {redeemError && <Alert kind="err">{redeemError}</Alert>}
                    </div>
                  ) : (
                    <p className="muted">Redeeming points is restricted for your role.</p>
                  )}
                </div>
              ) : (
                <div className="guest-member-empty">
                  <Icon name="workspace_premium" size={20} />
                  <div>
                    <strong>Not enrolled</strong>
                    <p className="muted">This guest does not have a membership yet.</p>
                  </div>
                  {canEnroll ? (
                    <Btn onClick={enroll} disabled={enrolling}>
                      {enrolling ? 'Enrolling…' : 'Enroll in Membership'}
                    </Btn>
                  ) : (
                    <p className="muted">Membership enrolment is restricted for your role.</p>
                  )}
                </div>
              )}
              {memberError && (
                <div className="guest-inline-actions">
                  <Alert kind="err">{memberError}</Alert>
                  <Btn ghost onClick={() => setMemberNonce((n) => n + 1)}>Refresh membership</Btn>
                </div>
              )}
            </section>
          </aside>
        ) : (
          <aside className="card guest-profile guest-profile--empty" aria-label="Guest profile">
            <span className="guest-avatar guest-avatar--large"><Icon name="person" size={24} /></span>
            <h2>Select a guest</h2>
            <p>Open a search result to review contact details, membership status and available actions.</p>
          </aside>
        )}
      </div>

      {createOpen && (
        <div
          className="guest-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreate();
          }}
        >
          <div className="guest-modal" role="dialog" aria-modal="true" aria-labelledby="new-guest-title">
            <div className="guest-modal-head">
              <div>
                <h2 id="new-guest-title">Add new guest</h2>
                <p>Create a guest profile using the phone number as the unique identity.</p>
              </div>
              <button
                type="button"
                className="guest-icon-button"
                onClick={closeCreate}
                aria-label="Close add guest"
                disabled={creating || duplicateBusy}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <form className="guest-modal-body" onSubmit={submitCreate}>
              <Field label="Full name">
                <input
                  autoFocus
                  value={createName}
                  onChange={(event) => {
                    setCreateName(event.target.value);
                    setCreateError('');
                    setDuplicateId(null);
                  }}
                  placeholder="Guest’s full name"
                  required
                />
              </Field>
              <Field label="Phone number">
                <input
                  value={createPhone}
                  onChange={(event) => {
                    setCreatePhone(event.target.value);
                    setCreateError('');
                    setDuplicateId(null);
                  }}
                  placeholder="+91 98220 00100"
                  inputMode="tel"
                  required
                />
              </Field>
              <p className="guest-help">
                Spaces, dashes and parentheses are accepted. The backend validates the number and
                prevents duplicate phone records.
              </p>
              {createError && <Alert kind="err">{createError}</Alert>}
              {duplicateId && (
                <div className="guest-duplicate">
                  <Btn ghost onClick={openExistingGuest} disabled={duplicateBusy}>
                    {duplicateBusy ? 'Opening…' : 'Open existing guest'}
                  </Btn>
                </div>
              )}
              <div className="guest-modal-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={closeCreate}
                  disabled={creating || duplicateBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={creating || duplicateBusy}>
                  {creating ? 'Creating…' : 'Create guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
