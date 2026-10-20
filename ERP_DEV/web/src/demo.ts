/**
 * PREVIEW-ONLY sample data (lives in the browser, never touches the server).
 * Purpose: let reviewers click every screen before Keycloak login lands.
 * Nothing here is real resort data — real data flows over the typed API
 * client in Live mode once you log in.
 */
import type { CategoryDto, DashboardDto, FolioDto, GuestDto, MemberDto, RoomBoard } from './api';

export const demoCategories: CategoryDto[] = [
  { id: 'c-deluxe', name: 'Deluxe', basePricePaise: 500000, currency: 'INR', capacity: 2 },
  { id: 'c-suite', name: 'Suite', basePricePaise: 900000, currency: 'INR', capacity: 3 },
  { id: 'c-villa', name: 'Villa', basePricePaise: 1500000, currency: 'INR', capacity: 4 },
];

export const demoDashboard: DashboardDto = {
  date: 'today',
  arrivals: [
    // No invented guest data (user rule) — placeholder rows keep the KPI count honest.
    { id: 'res-8f31', guestName: '—', category: 'Deluxe', checkinDate: 'today', checkoutDate: 'today', status: 'confirmed', advanceDuePaise: 0 },
    { id: 'res-8f32', guestName: '—', category: 'Suite', checkinDate: 'today', checkoutDate: 'today', status: 'confirmed', advanceDuePaise: 0 },
  ],
  inHouse: ['stay-11aa', 'stay-11ab', 'stay-11ac'],
  rooms: [
    { id: 'r1', roomNo: '101', status: 'ready' },
    { id: 'r2', roomNo: '102', status: 'occupied' },
    { id: 'r3', roomNo: '103', status: 'dirty' },
    { id: 'r4', roomNo: '201', status: 'occupied' },
    { id: 'r5', roomNo: '202', status: 'ready' },
    { id: 'r6', roomNo: '205', status: 'occupied' },
    { id: 'r7', roomNo: '210', status: 'cleaning' },
    { id: 'r8', roomNo: '302', status: 'inspect' },
  ],
  occupancy: [
    { categoryId: 'c-deluxe', category: 'Deluxe', total: 10, occupied: 6, free: 4 },
    { categoryId: 'c-suite', category: 'Suite', total: 10, occupied: 3, free: 7 },
  ],
};

export const demoGuests: GuestDto[] = [
  // Intentionally empty: user rule — no customer/guest seed data anywhere,
  // not even clearly-labeled preview samples. The Guests screen shows its
  // empty state in Preview; Live lists real guests after login.
];

export const demoMember: MemberDto = {
  id: 'm1', guestId: 'g1', membershipNo: 'GHM-2026-A1B2C3', tier: 'Gold',
  status: 'active', validTo: '2027-10-01', points: 1240,
};

export const demoFolio: FolioDto = {
  id: 'f1',
  entries: [
    { sourceType: 'room', sourceId: 'res-8f31', amountPaise: 1000000 },
    { sourceType: 'payment', sourceId: 'pay-1', amountPaise: -300000 },
  ],
  outstandingPaise: 700000,
};

export const demoBoard: RoomBoard[] = [
  { roomId: 'r1', roomNo: 'DEL-101', status: 'occupied', openTasks: 0 },
  { roomId: 'r2', roomNo: 'DEL-102', status: 'ready', openTasks: 0 },
  { roomId: 'r3', roomNo: 'DEL-103', status: 'dirty', openTasks: 1 },
  { roomId: 'r4', roomNo: 'SUI-201', status: 'cleaning', openTasks: 1 },
];
