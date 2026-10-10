-- V8: remove V3 demo guests (user instruction 2026-10-10: no customer/guest
-- seed data anywhere). Forward-only fix — V3 itself is never edited after
-- apply (migration rule). Only the three fixed demo IDs are removed; real
-- guest rows (any other UUID) are untouched. Tests create their own guests.
DELETE FROM guest_communication WHERE guest_id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999'
);
DELETE FROM guest WHERE id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999'
);
