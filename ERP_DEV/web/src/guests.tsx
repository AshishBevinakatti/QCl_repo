import { useEffect, useRef, useState } from 'react';
import {
  HttpError, createGuest, enrollMember, guestProfile, isAuthError, redeemPoints, rupees,
  searchGuests, updateGuest,
  type GuestDto, type GuestMembership, type GuestProfileDto, type GuestProfileGuest,
  type GuestReservation, type MemberDto,
} from './api';
import { hasRole, login } from './auth';
import type { Mode } from './dashboard';
import { Alert, Badge, Btn, EmptyState, Field, Icon, PageHeader, statusTone } from './ui';

const PAGE_SIZE = 20;
const PHONE_PATTERN = /^[+]?[0-9][0-9 ()-]{5,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoadError = { text: string; auth: boolean };
type Tab = 'overview' | 'stays' | 'billing' | 'notes';
type Tone = 'green' | 'amber' | 'red' | undefined;

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'person' },
  { id: 'stays', label: 'Reservations & stays', icon: 'calendar_month' },
  { id: 'billing', label: 'Billing & payments', icon: 'receipt_long' },
  { id: 'notes', label: 'Requests & notes', icon: 'note' },
];

function errorText(err: unknown): LoadError {
  if (isAuthError(err)) {
    return { text: 'You are signed out. Log in to search guest records.', auth: true };
  }
  if (err instanceof HttpError && err.status === 403) {
    return { text: 'Your role cannot access this guest action.', auth: false };
  }
  if (err instanceof HttpError && err.status === 404) {
    return { text: 'This guest record could not be found.', auth: false };
  }
  return {
    text: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    auth: false,
  };
}

function label(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortRef(id: string | null | undefined): string {
  return id ? id.slice(0, 8).toUpperCase() : '—';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.[0] ?? '?')
    .toUpperCase();
}

function displayDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function displayDateTime(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function nightsLabel(nights: number): string {
  return `${nights.toLocaleString('en-IN')} ${nights === 1 ? 'night' : 'nights'}`;
}

function preferenceText(preference: { key: string; label: string; value: string }): string {
  switch (preference.key.toLowerCase()) {
    case 'floor':
      return `${preference.value} floor preferred`;
    case 'view':
      return `${preference.value} view preferred`;
    case 'room':
      return `${preference.value} room preferred`;
    case 'diet':
      return `${preference.value} diet`;
    case 'pillow':
      return `${preference.value} pillow`;
    case 'newspaper':
      return preference.value.toLowerCase() === 'yes'
        ? 'Newspaper requested'
        : 'No newspaper';
    default:
      return `${preference.label}: ${preference.value}`;
  }
}

function stateMeta(state: string): { label: string; tone: Tone; icon: string } {
  switch (state) {
    case 'IN_HOUSE':
      return { label: 'In house', tone: 'green', icon: 'bed' };
    case 'ARRIVING_TODAY':
      return { label: 'Arriving today', tone: 'amber', icon: 'event_available' };
    case 'ARRIVAL_OVERDUE':
      return { label: 'Arrival overdue', tone: 'red', icon: 'warning' };
    case 'UPCOMING':
      return { label: 'Upcoming stay', tone: undefined, icon: 'calendar_month' };
    case 'DEPARTED':
      return { label: 'Departed', tone: undefined, icon: 'history' };
    case 'NO_ACTIVE_STAY':
      return { label: 'No active stay', tone: undefined, icon: 'event_busy' };
    default:
      return { label: 'No stay on record', tone: undefined, icon: 'person_search' };
  }
}

function severityMeta(severity: string): { icon: string; className: string } {
  if (severity === 'high') return { icon: 'error', className: 'is-high' };
  if (severity === 'medium') return { icon: 'warning', className: 'is-medium' };
  return { icon: 'info', className: 'is-info' };
}

function guestFromProfile(guest: GuestProfileGuest): GuestDto {
  return { ...guest, preferences: '', mergedIntoId: null };
}

function profileGuest(guest: GuestDto): GuestProfileGuest {
  return {
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    email: guest.email,
    idType: guest.idType,
    status: guest.status,
    memberId: guest.memberId,
  };
}

function membershipFromMember(
  member: MemberDto,
  existing: GuestMembership | null,
): GuestMembership {
  return {
    id: member.id,
    membershipNo: member.membershipNo,
    tier: member.tier,
    status: member.status,
    validFrom: existing?.validFrom ?? null,
    validTo: member.validTo,
    points: member.points,
  };
}

export function GuestsView({
  mode, initialQ, jumpNonce, onOpenFrontOffice, onOpenBilling,
}: {
  mode: Mode;
  initialQ?: string;
  jumpNonce?: number;
  onOpenFrontOffice: (reservationId: string) => void;
  onOpenBilling: (stayId: string) => void;
}) {
  const [query, setQuery] = useState(initialQ ?? '');
  const [committedQuery, setCommittedQuery] = useState(initialQ ?? '');
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<LoadError | null>(null);
  const [selected, setSelected] = useState<GuestDto | null>(null);
  const [profile, setProfile] = useState<GuestProfileDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<LoadError | null>(null);
  const [profileNonce, setProfileNonce] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [notice, setNotice] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemPointsInput, setRedeemPointsInput] = useState('100');
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createError, setCreateError] = useState('');
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIdType, setEditIdType] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);

  const searchSeq = useRef(0);
  const autoOpenRef = useRef(Boolean(initialQ));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLElement>(null);

  const canWrite = mode === 'preview' || hasRole('RECEPTION', 'MANAGER', 'SUPERADMIN');
  const canCreate = mode === 'live' && canWrite;
  const canEnroll = mode === 'preview' || hasRole(
    'RECEPTION', 'MEMBERSHIP', 'MANAGER', 'SUPERADMIN',
  );
  const canRedeem = mode === 'preview' || hasRole(
    'RECEPTION', 'MEMBERSHIP', 'MANAGER', 'SUPERADMIN', 'ACCOUNTS',
  );
  const headerGuest: GuestDto | GuestProfileGuest | null = profile?.guest ?? selected;
  const selectedId = selected?.id;
  const membership = profile?.membership ?? null;
  const billing = profile?.billing ?? null;

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
      setProfile(null);
      setProfileError(null);
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
            setProfile(null);
            setProfileError(null);
            setActiveTab('overview');
            setNotice('');
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
    if (!selectedId || mode === 'preview') {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfile((current) => (current?.guest.id === selectedId ? current : null));
    setProfileError(null);
    setProfileLoading(true);
    guestProfile(selectedId)
      .then((fresh) => {
        if (cancelled) return;
        setProfile(fresh);
        const guest = guestFromProfile(fresh.guest);
        setSelected((current) => (
          current && current.id === guest.id
            ? { ...current, ...guest, preferences: current.preferences, mergedIntoId: current.mergedIntoId }
            : current
        ));
        setGuests((current) => current.map((row) => (
          row.id === guest.id
            ? {
                ...row,
                name: guest.name,
                phone: guest.phone,
                email: guest.email,
                idType: guest.idType,
                status: guest.status,
                memberId: guest.memberId,
              }
            : row
        )));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProfileError(errorText(err));
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedId, profileNonce, mode]);

  useEffect(() => {
    if (!createOpen && !editOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (creating || duplicateBusy || savingEdit) return;
      if (createOpen) closeCreate();
      if (editOpen) closeEdit();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
    // close helpers are stable for this modal's purpose; re-registering on `creating` is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, editOpen, creating, duplicateBusy, savingEdit]);

  function scrollProfileIntoView() {
    if (window.innerWidth > 1100) return;
    window.setTimeout(() => {
      profileRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function resetProfileActions() {
    setActiveTab('overview');
    setProfileError(null);
    setNotice('');
    setRedeemOpen(false);
    setRedeemError('');
    setRedeemPointsInput('100');
    setEditOpen(false);
    setEditError('');
  }

  function openProfile(guest: GuestDto) {
    setSelected(guest);
    setProfile(null);
    resetProfileActions();
    scrollProfileIntoView();
  }

  function backToResults() {
    setSelected(null);
    setProfile(null);
    resetProfileActions();
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
    if (!canCreate) return;
    setCreateOpen(true);
    setCreateError('');
    setDuplicateId(null);
  }

  function closeCreate() {
    if (creating || duplicateBusy) return;
    setCreateOpen(false);
    setCreateName('');
    setCreatePhone('');
    setCreateEmail('');
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
    const email = createEmail.trim();
    if (!name) {
      setCreateError('Enter the guest’s full name.');
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setCreateError('Enter a valid phone number, including the country or STD code.');
      return;
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      setCreateError('Enter a valid email address, or leave it blank.');
      return;
    }
    if (mode === 'preview') {
      setCreateError('Preview mode — connect Live to create a real guest.');
      return;
    }

    setCreating(true);
    try {
      const guest = email
        ? await createGuest(name, phone, email)
        : await createGuest(name, phone);
      setCreateOpen(false);
      setCreateName('');
      setCreatePhone('');
      setCreateEmail('');
      setCreateError('');
      setDuplicateId(null);
      setQuery('');
      setCommittedQuery('');
      setSearchNonce((n) => n + 1);
      setGuests((current) => [guest, ...current.filter((g) => g.id !== guest.id)]);
      setTotal((current) => Math.max(current + 1, 1));
      setSelected(guest);
      setProfile(null);
      setProfileError(null);
      setNotice(`${guest.name} was created. You can enroll them in membership below.`);
      setActiveTab('overview');
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
      const fresh = await guestProfile(duplicateId);
      const guest = guestFromProfile(fresh.guest);
      setCreateOpen(false);
      setCreateName('');
      setCreatePhone('');
      setCreateEmail('');
      setDuplicateId(null);
      setQuery(guest.phone);
      setCommittedQuery(guest.phone);
      setGuests([guest]);
      setTotal(1);
      setSelected(guest);
      setProfile(fresh);
      resetProfileActions();
      setNotice('Existing guest profile opened.');
      scrollProfileIntoView();
    } catch (err) {
      setCreateError(errorText(err).text);
    } finally {
      setDuplicateBusy(false);
    }
  }

  function openEdit() {
    if (!headerGuest || !canWrite) return;
    setEditName(headerGuest.name);
    setEditPhone(headerGuest.phone);
    setEditEmail(headerGuest.email ?? '');
    setEditIdType(headerGuest.idType ?? '');
    setEditReason('');
    setEditError('');
    setEditOpen(true);
  }

  function closeEdit() {
    if (savingEdit) return;
    setEditOpen(false);
    setEditError('');
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || savingEdit) return;
    setEditError('');
    const name = editName.trim();
    const phone = editPhone.trim();
    const email = editEmail.trim();
    if (!name) {
      setEditError('Enter the guest’s full name.');
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setEditError('Enter a valid phone number, including the country or STD code.');
      return;
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      setEditError('Enter a valid email address, or leave it blank.');
      return;
    }
    if (mode === 'preview') {
      setEditError('Preview mode — connect Live to edit a real guest.');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await updateGuest(selected.id, {
        name,
        phone,
        email: email,
        idType: editIdType.trim(),
        reason: editReason.trim() || undefined,
      });
      setSelected(updated);
      setGuests((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setProfile((current) => (
        current && current.guest.id === updated.id
          ? { ...current, guest: profileGuest(updated) }
          : current
      ));
      setEditOpen(false);
      setNotice(`${updated.name}’s details were updated.`);
      try {
        const fresh = await guestProfile(updated.id);
        setProfile(fresh);
        setSelected((current) => (
          current && current.id === fresh.guest.id
            ? { ...current, ...guestFromProfile(fresh.guest), preferences: current.preferences }
            : current
        ));
        setGuests((current) => current.map((row) => (
          row.id === fresh.guest.id
            ? {
                ...row,
                name: fresh.guest.name,
                phone: fresh.guest.phone,
                email: fresh.guest.email,
                idType: fresh.guest.idType,
                status: fresh.guest.status,
                memberId: fresh.guest.memberId,
              }
            : row
        )));
      } catch (refreshErr) {
        setProfileError(errorText(refreshErr));
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setEditError('Your role cannot edit guest profiles.');
      } else if (err instanceof HttpError && err.status === 409) {
        setEditError('Another guest already uses this phone number.');
      } else if (err instanceof HttpError && err.status === 400) {
        setEditError('Check the name, phone and email details, then try again.');
      } else {
        setEditError(errorText(err).text);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function refreshProfile(id: string): Promise<GuestProfileDto> {
    const fresh = await guestProfile(id);
    setProfile(fresh);
    setProfileError(null);
    setSelected((current) => (
      current && current.id === fresh.guest.id
        ? { ...current, ...guestFromProfile(fresh.guest), preferences: current.preferences }
        : current
    ));
    setGuests((current) => current.map((row) => (
      row.id === fresh.guest.id
        ? {
            ...row,
            name: fresh.guest.name,
            phone: fresh.guest.phone,
            email: fresh.guest.email,
            idType: fresh.guest.idType,
            status: fresh.guest.status,
            memberId: fresh.guest.memberId,
          }
        : row
    )));
    return fresh;
  }

  async function enroll() {
    if (!selected || enrolling) return;
    if (mode === 'preview') {
      setNotice('Preview mode — membership enrolment is not saved.');
      return;
    }
    const guestId = selected.id;
    const guestName = selected.name;
    setEnrolling(true);
    setNotice('');
    setProfileError(null);
    try {
      const member = await enrollMember(guestId);
      setProfile((current) => (
        current && current.guest.id === guestId
          ? {
              ...current,
              guest: { ...current.guest, memberId: member.id },
              membership: membershipFromMember(member, current.membership),
            }
          : current
      ));
      setSelected((current) => (
        current && current.id === guestId ? { ...current, memberId: member.id } : current
      ));
      setGuests((current) => current.map((row) => (
        row.id === guestId ? { ...row, memberId: member.id } : row
      )));
      setNotice(`${guestName} is now a ${member.tier} member (${member.membershipNo}).`);
      try {
        await refreshProfile(guestId);
      } catch {
        // The enrolment response is authoritative for the member; keep it visible.
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        try {
          await refreshProfile(guestId);
          setNotice('Membership status refreshed for this guest.');
        } catch (refreshErr) {
          setProfileError(errorText(refreshErr));
        }
      } else if (err instanceof HttpError && err.status === 403) {
        setProfileError({ text: 'Your role cannot enroll guests in membership.', auth: false });
      } else {
        setProfileError(errorText(err));
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function redeem(event: React.FormEvent) {
    event.preventDefault();
    if (!profile?.membership || !billing?.folioId || redeemBusy) return;
    setRedeemError('');
    const points = Number(redeemPointsInput);
    if (!Number.isInteger(points) || points <= 0) {
      setRedeemError('Enter a positive whole number of points.');
      return;
    }
    if (points > profile.membership.points) {
      setRedeemError('Enter no more than the available points balance.');
      return;
    }
    if (mode === 'preview') {
      setNotice('Preview mode — points are not spent.');
      return;
    }
    const memberId = profile.membership.id;
    const guestId = profile.guest.id;
    setRedeemBusy(true);
    try {
      const member = await redeemPoints(memberId, billing.folioId, points);
      setProfile((current) => (
        current && current.membership
          ? { ...current, membership: { ...current.membership, points: member.points } }
          : current
      ));
      setNotice(`Redeemed ${points.toLocaleString('en-IN')} points to the folio.`);
      setRedeemOpen(false);
      setRedeemPointsInput('100');
      try {
        await refreshProfile(guestId);
      } catch {
        // Keep the member response's points balance visible if the refresh fails.
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setRedeemError('Your role cannot redeem membership points.');
      } else if (err instanceof HttpError && err.status === 422) {
        setRedeemError('The folio could not accept this redemption. Ask billing to check it.');
      } else {
        setRedeemError(errorText(err).text);
      }
    } finally {
      setRedeemBusy(false);
    }
  }

  function handleTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = index;
    if (event.key === 'ArrowRight') target = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') target = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = TABS.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(TABS[target].id);
    document.getElementById(`guest-tab-${TABS[target].id}`)?.focus();
  }

  return (
    <div className="guests-page">
      <PageHeader
        title="Guests"
        subtitle="Find guests, review their information and manage their records"
        actions={canCreate ? (
          <Btn onClick={openCreate}><Icon name="person_add" /> Add New Guest</Btn>
        ) : undefined}
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
              <span className="guests-count">
                {total.toLocaleString('en-IN')} {total === 1 ? 'guest' : 'guests'}
              </span>
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
              {!committedQuery && canCreate && (
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

        {selected && headerGuest ? (
          <aside
            className="card guest-profile guest-profile--360"
            ref={profileRef}
            aria-label="Selected guest profile"
            aria-busy={profileLoading}
          >
            <div className="guest-profile-toolbar">
              <button type="button" className="guest-back" onClick={backToResults}>
                <Icon name="arrow_back" size={16} /> Back to results
              </button>
              <div className="guest-profile-toolbar-actions">
                {profileLoading && profile && (
                  <span className="guest-refreshing" role="status">
                    <Icon name="progress_activity" size={14} /> Refreshing
                  </span>
                )}
                {canWrite && (
                  <Btn ghost onClick={openEdit}>
                    <Icon name="edit" size={15} /> Edit guest
                  </Btn>
                )}
              </div>
            </div>

            <header className="guest-identity">
              <span className="guest-avatar guest-avatar--large">{initials(headerGuest.name)}</span>
              <div className="guest-identity-copy">
                <div className="guest-identity-name">
                  <h2>{headerGuest.name}</h2>
                  <Badge tone={statusTone(headerGuest.status)}>{label(headerGuest.status)}</Badge>
                  {membership && <Badge>{membership.tier} member</Badge>}
                </div>
                <div className="guest-identity-meta">
                  <span><Icon name="badge_check" size={14} /> Guest ID {shortRef(headerGuest.id)}</span>
                  <a href={`tel:${headerGuest.phone.replace(/[^+0-9]/g, '')}`}>
                    <Icon name="call" size={14} /> {headerGuest.phone}
                  </a>
                  {headerGuest.email ? (
                    <a href={`mailto:${headerGuest.email}`}>
                      <Icon name="mail" size={14} /> {headerGuest.email}
                    </a>
                  ) : (
                    <span className="muted"><Icon name="mail" size={14} /> Email not recorded</span>
                  )}
                </div>
              </div>
            </header>

            {notice && <div className="guest-profile-message"><Alert kind="ok">{notice}</Alert></div>}

            {profileError && profile && (
              <div className="guest-profile-message">
                <Alert kind="err">{profileError.text}</Alert>
                <div className="guest-inline-actions">
                  {profileError.auth ? (
                    <Btn onClick={login}>Staff log in</Btn>
                  ) : (
                    <Btn ghost onClick={() => setProfileNonce((n) => n + 1)}>Retry profile refresh</Btn>
                  )}
                </div>
              </div>
            )}

            {profileLoading && !profile ? (
              <div className="guest-profile-loading" role="status" aria-live="polite">
                <Icon name="progress_activity" size={24} />
                <strong>Loading guest profile…</strong>
                <p>Reading reservations, stay, billing and membership records.</p>
              </div>
            ) : profile ? (
              <>
                <OperationalSummary
                  profile={profile}
                  onOpenFrontOffice={onOpenFrontOffice}
                  onOpenBilling={onOpenBilling}
                />

                {profile.alerts.length > 0 && (
                  <section className="guest-attention" aria-label="Guest alerts">
                    <h3><Icon name="warning" size={16} /> Needs attention</h3>
                    <ul>
                      {profile.alerts.map((alert, index) => {
                        const meta = severityMeta(alert.severity);
                        return (
                          <li key={`${alert.ref ?? 'alert'}-${index}`} className={meta.className}>
                            <Icon name={meta.icon} size={16} />
                            <span>{alert.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                <div className="guest-profile-tabs" role="tablist" aria-label="Guest profile sections">
                  {TABS.map((tab, index) => (
                    <button
                      key={tab.id}
                      id={`guest-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`guest-panel-${tab.id}`}
                      tabIndex={activeTab === tab.id ? 0 : -1}
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => setActiveTab(tab.id)}
                      onKeyDown={(event) => handleTabKey(event, index)}
                    >
                      <Icon name={tab.icon} size={15} />
                      <span>{tab.label}</span>
                      {tab.id === 'stays' && profile.reservationTotal > 0 && (
                        <span className="guest-tab-count">{profile.reservationTotal}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div
                  id={`guest-panel-${activeTab}`}
                  role="tabpanel"
                  aria-labelledby={`guest-tab-${activeTab}`}
                  tabIndex={0}
                  className="guest-tab-panel"
                >
                  {activeTab === 'overview' && (
                    <OverviewTab
                      profile={profile}
                      canEnroll={canEnroll}
                      canRedeem={canRedeem}
                      enrolling={enrolling}
                      onEnroll={enroll}
                      redeemOpen={redeemOpen}
                      setRedeemOpen={setRedeemOpen}
                      redeemPoints={redeemPointsInput}
                      setRedeemPoints={setRedeemPointsInput}
                      redeemBusy={redeemBusy}
                      redeemError={redeemError}
                      onRedeem={redeem}
                    />
                  )}
                  {activeTab === 'stays' && (
                    <ReservationsTab
                      profile={profile}
                      onOpenFrontOffice={onOpenFrontOffice}
                      onOpenBilling={onOpenBilling}
                    />
                  )}
                  {activeTab === 'billing' && (
                    <BillingTab
                      profile={profile}
                      onOpenFrontOffice={onOpenFrontOffice}
                      onOpenBilling={onOpenBilling}
                    />
                  )}
                  {activeTab === 'notes' && <RequestsNotesTab profile={profile} />}
                </div>
              </>
            ) : profileError ? (
              <div className="guest-profile-error" role="alert">
                <Icon name="error" size={24} />
                <strong>{profileError.text}</strong>
                {profileError.auth ? (
                  <Btn onClick={login}>Staff log in</Btn>
                ) : (
                  <Btn ghost onClick={() => setProfileNonce((n) => n + 1)}>Try again</Btn>
                )}
              </div>
            ) : null}
          </aside>
        ) : (
          <aside className="card guest-profile guest-profile--empty" aria-label="Guest profile">
            <span className="guest-avatar guest-avatar--large"><Icon name="person" size={24} /></span>
            <h2>Select a guest</h2>
            <p>Open a search result to review contact details, stay, billing, membership and available actions.</p>
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
              <Field label="Email (optional)">
                <input
                  type="email"
                  value={createEmail}
                  onChange={(event) => {
                    setCreateEmail(event.target.value);
                    setCreateError('');
                  }}
                  placeholder="guest@example.com"
                  autoComplete="email"
                />
              </Field>
              <p className="guest-help">
                Spaces, dashes and parentheses are accepted. The backend validates the number and
                prevents duplicate phone records. Email is optional and is not a unique identity.
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

      {editOpen && headerGuest && (
        <div
          className="guest-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <div className="guest-modal" role="dialog" aria-modal="true" aria-labelledby="edit-guest-title">
            <div className="guest-modal-head">
              <div>
                <h2 id="edit-guest-title">Edit guest details</h2>
                <p>Update contact details. Phone numbers remain the unique guest identity.</p>
              </div>
              <button
                type="button"
                className="guest-icon-button"
                onClick={closeEdit}
                aria-label="Close edit guest"
                disabled={savingEdit}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <form className="guest-modal-body" onSubmit={submitEdit}>
              <Field label="Full name">
                <input
                  autoFocus
                  value={editName}
                  onChange={(event) => { setEditName(event.target.value); setEditError(''); }}
                  required
                />
              </Field>
              <Field label="Phone number">
                <input
                  value={editPhone}
                  onChange={(event) => { setEditPhone(event.target.value); setEditError(''); }}
                  inputMode="tel"
                  required
                />
              </Field>
              <Field label="Email (optional)">
                <input
                  type="email"
                  value={editEmail}
                  onChange={(event) => { setEditEmail(event.target.value); setEditError(''); }}
                  placeholder="guest@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="ID type">
                <input
                  value={editIdType}
                  onChange={(event) => { setEditIdType(event.target.value); setEditError(''); }}
                  placeholder="Aadhaar, passport, driving licence…"
                />
              </Field>
              <Field label="Reason for change (optional)">
                <input
                  value={editReason}
                  onChange={(event) => setEditReason(event.target.value)}
                  placeholder="Contact number updated by phone"
                />
              </Field>
              <p className="guest-help">
                No identity document number is stored or displayed in this release. Every edit is
                recorded in the audit trail.
              </p>
              {editError && <Alert kind="err">{editError}</Alert>}
              <div className="guest-modal-actions">
                <button type="button" className="btn ghost" onClick={closeEdit} disabled={savingEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={savingEdit}>
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OperationalSummary({
  profile, onOpenFrontOffice, onOpenBilling,
}: {
  profile: GuestProfileDto;
  onOpenFrontOffice: (reservationId: string) => void;
  onOpenBilling: (stayId: string) => void;
}) {
  const state = stateMeta(profile.operationalState);
  const membership = profile.membership;
  const billing = profile.billing;
  const current = profile.currentStay;
  const next = profile.nextReservation;
  const latest = profile.reservations[0] ?? null;

  if (current) {
    return (
      <section className="guest-summary guest-summary--inhouse" aria-label="Current stay summary">
        <div className="guest-summary-main">
          <span className="guest-summary-icon"><Icon name="bed" size={20} /></span>
          <div>
            <span className="guest-summary-eyebrow">
              <Badge tone={state.tone}>{state.label}</Badge>
            </span>
            <h3>
              {current.roomNo ? `Room ${current.roomNo}` : 'Room not assigned'}
              {current.categoryName ? ` · ${current.categoryName}` : ''}
            </h3>
            <p>
              {displayDate(current.checkinDate)} → {displayDate(current.checkoutDate)} ·{' '}
              {nightsLabel(current.nights)}
            </p>
            <p className="guest-summary-sub">
              {current.checkinAt ? `Checked in ${displayDateTime(current.checkinAt)}` : 'Check-in time not recorded'}
              {current.stayStatus ? ` · ${label(current.stayStatus)}` : ''}
            </p>
          </div>
        </div>
        <div className="guest-summary-metrics">
          <div>
            <span>Outstanding</span>
            <strong className={billing.outstandingPaise > 0 ? 'is-due' : ''}>
              {rupees(billing.outstandingPaise)}
            </strong>
            <small>{billing.status ? `Folio ${label(billing.status)}` : 'No folio'}</small>
          </div>
          <div>
            <span>Membership</span>
            <strong>{membership ? membership.tier : 'Not a member'}</strong>
            <small>{membership ? `${membership.points.toLocaleString('en-IN')} points` : 'No membership'}</small>
          </div>
        </div>
        <div className="guest-summary-actions">
          <Btn ghost onClick={() => onOpenFrontOffice(current.reservationId)}>Front office</Btn>
          {billing.stayId && (
            <Btn onClick={() => onOpenBilling(billing.stayId!)}>Open folio</Btn>
          )}
        </div>
      </section>
    );
  }

  if (next) {
    return (
      <section className="guest-summary guest-summary--upcoming" aria-label="Upcoming reservation summary">
        <div className="guest-summary-main">
          <span className="guest-summary-icon"><Icon name={state.icon} size={20} /></span>
          <div>
            <span className="guest-summary-eyebrow">
              <Badge tone={state.tone}>{state.label}</Badge>
            </span>
            <h3>
              {next.categoryName ?? 'Room category not recorded'} · {nightsLabel(next.nights)}
            </h3>
            <p>{displayDate(next.checkinDate)} → {displayDate(next.checkoutDate)}</p>
            <p className="guest-summary-sub">
              Booking {next.reference} · {label(next.status)}
            </p>
          </div>
        </div>
        <div className="guest-summary-metrics">
          <div>
            <span>Advance due</span>
            <strong>{billing.advanceDuePaise === null ? '—' : rupees(billing.advanceDuePaise)}</strong>
            <small>{billing.advanceDuePaise === null ? 'Not recorded' : 'Balance at booking'}</small>
          </div>
          <div>
            <span>Advance paid</span>
            <strong>{billing.advancePaidPaise === null ? '—' : rupees(billing.advancePaidPaise)}</strong>
            <small>{next.stayId ? 'Linked to stay' : 'No stay yet'}</small>
          </div>
        </div>
        <div className="guest-summary-actions">
          <Btn ghost onClick={() => onOpenFrontOffice(next.reservationId)}>Front office</Btn>
        </div>
      </section>
    );
  }

  if (latest) {
    return (
      <section className="guest-summary guest-summary--past" aria-label="Most recent stay summary">
        <div className="guest-summary-main">
          <span className="guest-summary-icon"><Icon name="history" size={20} /></span>
          <div>
            <span className="guest-summary-eyebrow">
              <Badge tone={state.tone}>{state.label}</Badge>
            </span>
            <h3>
              {latest.roomNo ? `Room ${latest.roomNo}` : latest.categoryName ?? 'Most recent reservation'}
              {latest.categoryName && latest.roomNo ? ` · ${latest.categoryName}` : ''}
            </h3>
            <p>{displayDate(latest.checkinDate)} → {displayDate(latest.checkoutDate)} · {nightsLabel(latest.nights)}</p>
            <p className="guest-summary-sub">
              {latest.stayStatus ? `Stay ${label(latest.stayStatus)}` : `Reservation ${label(latest.status)}`}
              {latest.checkoutAt ? ` · Checked out ${displayDateTime(latest.checkoutAt)}` : ''}
            </p>
          </div>
        </div>
        <div className="guest-summary-metrics">
          <div>
            <span>Balance</span>
            <strong className={billing.outstandingPaise > 0 ? 'is-due' : ''}>
              {rupees(billing.outstandingPaise)}
            </strong>
            <small>{billing.folioId ? 'Most recent folio' : 'No folio'}</small>
          </div>
          <div>
            <span>Membership</span>
            <strong>{membership ? membership.tier : 'Not a member'}</strong>
            <small>{membership ? `${membership.points.toLocaleString('en-IN')} points` : 'No membership'}</small>
          </div>
        </div>
        {billing.stayId && (
          <div className="guest-summary-actions">
            <Btn onClick={() => onOpenBilling(billing.stayId!)}>Open folio</Btn>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="guest-summary guest-summary--none" aria-label="No stay summary">
      <div className="guest-summary-main">
        <span className="guest-summary-icon"><Icon name={state.icon} size={20} /></span>
        <div>
          <span className="guest-summary-eyebrow">
            <Badge tone={state.tone}>{state.label}</Badge>
          </span>
          <h3>No reservation on record</h3>
          <p>Bookings created in the reservation workspace will appear here.</p>
        </div>
      </div>
      <div className="guest-summary-metrics">
        <div>
          <span>Membership</span>
          <strong>{membership ? membership.tier : 'Not a member'}</strong>
          <small>{membership ? `${membership.points.toLocaleString('en-IN')} points` : 'No membership'}</small>
        </div>
      </div>
    </section>
  );
}

function OverviewTab({
  profile, canEnroll, canRedeem, enrolling, onEnroll, redeemOpen, setRedeemOpen,
  redeemPoints, setRedeemPoints, redeemBusy, redeemError, onRedeem,
}: {
  profile: GuestProfileDto;
  canEnroll: boolean;
  canRedeem: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  redeemOpen: boolean;
  setRedeemOpen: (open: boolean) => void;
  redeemPoints: string;
  setRedeemPoints: (points: string) => void;
  redeemBusy: boolean;
  redeemError: string;
  onRedeem: (event: React.FormEvent) => void;
}) {
  const member = profile.membership;
  const billing = profile.billing;
  const openFolio = billing.folioId && billing.status === 'open';

  return (
    <div className="guest-tab-stack">
      <div className="guest-tab-grid">
        <section className="guest-panel" aria-label="Contact details">
          <h3>Contact details</h3>
          <dl className="guest-detail-grid">
            <dt>Guest ID</dt>
            <dd className="guest-mono">{shortRef(profile.guest.id)}</dd>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${profile.guest.phone.replace(/[^+0-9]/g, '')}`}>{profile.guest.phone}</a>
            </dd>
            <dt>Email</dt>
            <dd>
              {profile.guest.email
                ? <a href={`mailto:${profile.guest.email}`}>{profile.guest.email}</a>
                : <span className="muted">Not recorded</span>}
            </dd>
            <dt>Record status</dt>
            <dd><Badge tone={statusTone(profile.guest.status)}>{label(profile.guest.status)}</Badge></dd>
            <dt>ID type</dt>
            <dd>{profile.guest.idType ?? <span className="muted">Not recorded</span>}</dd>
            <dt>Verification</dt>
            <dd className="muted">Not tracked in this release</dd>
          </dl>
        </section>

        <section className="guest-panel" aria-label="Guest preferences">
          <h3>Preferences</h3>
          {profile.preferences.length > 0 ? (
            <ul className="guest-preference-list">
              {profile.preferences.map((preference) => (
                <li key={preference.key}>
                  <Icon name="badge_check" size={14} />
                  <span>{preferenceText(preference)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted guest-panel-empty">No preferences recorded.</p>
          )}
        </section>
      </div>

      <section className="guest-panel guest-panel--membership" aria-label="Membership">
        <div className="guest-section-head">
          <h3>Membership</h3>
          {member && <Badge tone={statusTone(member.status)}>{label(member.status)}</Badge>}
        </div>

        {member ? (
          <div className="guest-member-box">
            <dl className="guest-member-grid">
              <div><dt>Membership no.</dt><dd>{member.membershipNo}</dd></div>
              <div><dt>Tier</dt><dd>{member.tier}</dd></div>
              <div><dt>Points</dt><dd>{member.points.toLocaleString('en-IN')}</dd></div>
              <div><dt>Valid from</dt><dd>{displayDate(member.validFrom)}</dd></div>
              <div><dt>Valid until</dt><dd>{displayDate(member.validTo)}</dd></div>
            </dl>
            {canRedeem && openFolio && member.points > 0 ? (
              <div className="guest-redeem">
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => setRedeemOpen(!redeemOpen)}
                  aria-expanded={redeemOpen}
                >
                  {redeemOpen ? 'Hide redemption' : 'Redeem points'}
                </button>
                {redeemOpen && (
                  <form onSubmit={onRedeem} className="guest-redeem-form guest-redeem-form--folio">
                    <div className="guest-redeem-target">
                      <span>Apply to folio</span>
                      <strong>{shortRef(billing.folioId)}</strong>
                    </div>
                    <Field label="Points">
                      <input
                        value={redeemPoints}
                        onChange={(event) => setRedeemPoints(event.target.value)}
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
            ) : canRedeem ? (
              <p className="guest-help">
                {member.points <= 0
                  ? 'No points are available to redeem.'
                  : 'Points can be redeemed once an open folio exists for a stay.'}
              </p>
            ) : (
              <p className="guest-help">Redeeming points is restricted for your role.</p>
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
              <Btn onClick={onEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling…' : 'Enroll in Membership'}
              </Btn>
            ) : (
              <p className="muted">Membership enrolment is restricted for your role.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ReservationsTab({
  profile, onOpenFrontOffice, onOpenBilling,
}: {
  profile: GuestProfileDto;
  onOpenFrontOffice: (reservationId: string) => void;
  onOpenBilling: (stayId: string) => void;
}) {
  const rows = profile.reservations;
  return (
    <div className="guest-tab-stack">
      <div className="guest-tab-heading">
        <div>
          <h3>Reservations & stays</h3>
          <p>Newest bookings first. Reservation status and stay status stay separate.</p>
        </div>
        <span className="guests-count">
          {profile.reservationTotal.toLocaleString('en-IN')} total
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title="No reservations yet"
          description="This guest has no booking history. Reservations created in the booking workspace will appear here."
        />
      ) : (
        <div className="guest-history">
          {rows.map((reservation) => (
            <ReservationRow
              key={reservation.reservationId}
              reservation={reservation}
              current={reservation.reservationId === profile.currentStay?.reservationId}
              onOpenFrontOffice={onOpenFrontOffice}
              onOpenBilling={onOpenBilling}
            />
          ))}
        </div>
      )}

      {profile.reservationTotal > rows.length && (
        <p className="guests-more">
          Showing the latest {rows.length.toLocaleString('en-IN')} of{' '}
          {profile.reservationTotal.toLocaleString('en-IN')} reservations.
        </p>
      )}
    </div>
  );
}

function ReservationRow({
  reservation, current, onOpenFrontOffice, onOpenBilling,
}: {
  reservation: GuestReservation;
  current: boolean;
  onOpenFrontOffice: (reservationId: string) => void;
  onOpenBilling: (stayId: string) => void;
}) {
  return (
    <article className={`guest-history-row${current ? ' is-current' : ''}`}>
      <div className="guest-history-main">
        <div className="guest-history-top">
          <strong>Booking {reservation.reference}</strong>
          <Badge tone={statusTone(reservation.status)}>{label(reservation.status)}</Badge>
          {current && <Badge tone="green">In house</Badge>}
          <span className="guest-history-source">{label(reservation.source)}</span>
        </div>
        <p className="guest-history-dates">
          <Icon name="calendar_month" size={14} />
          {displayDate(reservation.checkinDate)} → {displayDate(reservation.checkoutDate)} ·{' '}
          {nightsLabel(reservation.nights)}
        </p>
        <div className="guest-history-meta">
          <span>
            <Icon name="bed" size={14} />
            {reservation.categoryName ?? 'Category not recorded'}
            {reservation.roomNo ? ` · Room ${reservation.roomNo}` : ' · Room not assigned'}
          </span>
          <span>
            <Icon name="history" size={14} />
            {reservation.stayStatus ? `Stay ${label(reservation.stayStatus)}` : 'No stay yet'}
          </span>
          {reservation.checkinAt && (
            <span>
              <Icon name="schedule" size={14} />
              In {displayDateTime(reservation.checkinAt)}
            </span>
          )}
          {reservation.checkoutAt && (
            <span>
              <Icon name="schedule" size={14} />
              Out {displayDateTime(reservation.checkoutAt)}
            </span>
          )}
        </div>
      </div>
      <div className="guest-history-actions">
        <Btn ghost onClick={() => onOpenFrontOffice(reservation.reservationId)}>
          Front office
        </Btn>
        {reservation.stayId && (
          <Btn ghost onClick={() => onOpenBilling(reservation.stayId!)}>Open folio</Btn>
        )}
      </div>
    </article>
  );
}

function BillingTab({
  profile, onOpenFrontOffice, onOpenBilling,
}: {
  profile: GuestProfileDto;
  onOpenFrontOffice: (reservationId: string) => void;
  onOpenBilling: (stayId: string) => void;
}) {
  const billing = profile.billing;
  const next = profile.nextReservation;

  if (!billing.folioId) {
    return (
      <div className="guest-tab-stack">
        <div className="guest-tab-heading">
          <div>
            <h3>Billing & payments</h3>
            <p>Only real folio, payment and invoice records are shown.</p>
          </div>
        </div>
        {next ? (
          <section className="guest-panel">
            <div className="guest-billing-metrics">
              <div>
                <span>Advance due</span>
                <strong>{rupees(billing.advanceDuePaise ?? 0)}</strong>
                <small>Booking advance</small>
              </div>
              <div>
                <span>Advance paid</span>
                <strong>{rupees(billing.advancePaidPaise ?? 0)}</strong>
                <small>Captured payments</small>
              </div>
            </div>
            <p className="guest-help">
              No folio exists yet. A folio is opened when the guest checks in; payment and invoice
              records will appear here after that.
            </p>
            {billing.paymentAlerts.length > 0 && (
              <PaymentAlerts alerts={billing.paymentAlerts} />
            )}
            <div className="guest-panel-actions">
              <Btn ghost onClick={() => onOpenFrontOffice(next.reservationId)}>Front office</Btn>
            </div>
          </section>
        ) : (
          <EmptyState
            icon="receipt_long"
            title="No billing activity"
            description="No folio, payment or invoice exists for this guest. A folio is opened when a stay checks in."
          />
        )}
      </div>
    );
  }

  return (
    <div className="guest-tab-stack">
      <div className="guest-tab-heading">
        <div>
          <h3>Billing & payments</h3>
          <p>
            Folio {shortRef(billing.folioId)}
            {billing.stayId ? ` · Stay ${shortRef(billing.stayId)}` : ''}
          </p>
        </div>
        {billing.status && <Badge tone={statusTone(billing.status)}>{label(billing.status)}</Badge>}
      </div>

      <section className="guest-panel" aria-label="Folio summary">
        <div className="guest-billing-metrics">
          <div>
            <span>Charges</span>
            <strong>{rupees(billing.chargesPaise)}</strong>
            <small>Posted debits</small>
          </div>
          <div>
            <span>Payments received</span>
            <strong>{rupees(billing.paymentsPaise)}</strong>
            <small>Captured payments</small>
          </div>
          <div>
            <span>Other credits</span>
            <strong>{rupees(billing.creditsPaise)}</strong>
            <small>Loyalty and other credits</small>
          </div>
          <div className={billing.outstandingPaise > 0 ? 'is-due' : ''}>
            <span>Outstanding</span>
            <strong>{rupees(billing.outstandingPaise)}</strong>
            <small>Calculated by billing service</small>
          </div>
        </div>
        <p className="guest-help">
          The balance is calculated from signed folio entries by the billing service; this screen
          does not recalculate it from separate totals.
        </p>
        {billing.paymentAlerts.length > 0 ? (
          <PaymentAlerts alerts={billing.paymentAlerts} />
        ) : (
          <p className="guest-help">No pending or failed payment attempts are recorded.</p>
        )}
        <div className="guest-panel-actions">
          {billing.stayId && (
            <Btn onClick={() => onOpenBilling(billing.stayId!)}>Open billing workspace</Btn>
          )}
        </div>
      </section>

      <section className="guest-panel" aria-label="Invoice">
        <div className="guest-section-head">
          <h3>Invoice</h3>
          {billing.invoice && (
            <Badge tone={statusTone(billing.invoice.status)}>{label(billing.invoice.status)}</Badge>
          )}
        </div>
        {billing.invoice ? (
          <dl className="guest-detail-grid">
            <dt>Invoice</dt>
            <dd className="guest-mono">{shortRef(billing.invoice.id)}</dd>
            <dt>Total</dt>
            <dd>{rupees(billing.invoice.totalPaise)}</dd>
            <dt>Issued</dt>
            <dd>{displayDateTime(billing.invoice.issuedAt)}</dd>
            <dt>Status</dt>
            <dd>{label(billing.invoice.status)}</dd>
          </dl>
        ) : (
          <p className="guest-help">
            No invoice has been issued for this folio. Invoices are immutable once issued in the
            billing workspace.
          </p>
        )}
      </section>
    </div>
  );
}

function PaymentAlerts({ alerts }: { alerts: GuestProfileDto['billing']['paymentAlerts'] }) {
  return (
    <div className="guest-payment-alerts">
      <h4>Payment attempts needing attention</h4>
      <ul>
        {alerts.map((alert) => (
          <li key={alert.paymentId}>
            <Badge tone={statusTone(alert.status)}>{label(alert.status)}</Badge>
            <span>{rupees(alert.amountPaise)}</span>
            <span className="muted">{displayDateTime(alert.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequestsNotesTab({ profile }: { profile: GuestProfileDto }) {
  return (
    <div className="guest-tab-stack">
      <div className="guest-tab-heading">
        <div>
          <h3>Requests & notes</h3>
          <p>Only records exposed by the backend appear here. Nothing is inferred.</p>
        </div>
      </div>

      {profile.alerts.length > 0 && (
        <section className="guest-panel" aria-label="Operational alerts">
          <h3>Operational alerts</h3>
          <p className="guest-help">
            These alerts are derived from the reservation, folio and payment records above.
          </p>
          <ul className="guest-alert-list">
            {profile.alerts.map((alert, index) => {
              const meta = severityMeta(alert.severity);
              return (
                <li key={`${alert.ref ?? 'alert'}-${index}`} className={meta.className}>
                  <Icon name={meta.icon} size={16} />
                  <span>{alert.text}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="guest-tab-grid">
        <section className="guest-panel guest-panel--placeholder">
          <EmptyState
            icon="build"
            title="Service requests are not available yet"
            description="The service-request module is not implemented. No request records are shown or inferred."
          />
        </section>
        <section className="guest-panel guest-panel--placeholder">
          <EmptyState
            icon="note"
            title="Guest notes are not available yet"
            description="There is no notes store or visibility model in this release. Notes are not captured or inferred."
          />
        </section>
      </div>
    </div>
  );
}
