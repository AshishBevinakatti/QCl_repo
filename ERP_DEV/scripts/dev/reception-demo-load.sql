\set ON_ERROR_STOP on
\if :allow_demo
\else
  \echo 'Refusing to run: pass -v allow_demo=1 (use scripts/dev/reception-demo.sh).'
  \quit
\endif

SELECT to_char((now() AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS d0 \gset
\echo 'Loading reception demo fixture for business date' :d0

BEGIN;

INSERT INTO guest (id, property_id, name, phone, id_type, preferences, status) VALUES
  ('d0000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Demo Aarav Mehta', '+91-9000000101', 'Aadhaar', '{"demo": true, "preference": "high floor"}', 'active'),
  ('d0000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Demo Diya Shah', '+91-9000000102', 'Passport', '{"demo": true, "preference": "quiet room"}', 'active'),
  ('d0000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Demo Kabir Rao', '+91-9000000103', 'DrivingLicence', '{"demo": true}', 'active'),
  ('d0000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'Demo Meera Nair', '+91-9000000104', 'Aadhaar', '{"demo": true, "preference": "late checkout"}', 'active'),
  ('d0000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'Demo Rohan Iyer', '+91-9000000105', 'Passport', '{"demo": true}', 'active'),
  ('d0000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'Demo Ananya Verma', '+91-9000000106', 'Aadhaar', '{"demo": true, "preference": "villa"}', 'active');

INSERT INTO reservation (
  id, property_id, guest_id, category_id, room_id, checkin_date, checkout_date, nights,
  quoted_total_paise, advance_due_paise, cancellation_fee_paise, status, source,
  idempotency_key, created_at
) VALUES
  ('d4000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', NULL,
   :'d0'::date, :'d0'::date + 1, 1, 500000, 150000, 0, 'confirmed', 'demo',
   'demo-fixture-arrival', now() - interval '3 hours'),
  ('d4000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000002', '33333333-3333-3333-3333-333333333333',
   'a1020000-0000-0000-0000-000000000001',
   :'d0'::date, :'d0'::date + 1, 1, 900000, 270000, 0, 'checked-in', 'demo',
   'demo-fixture-inhouse', now() - interval '4 hours'),
  ('d4000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000003', '44444444-4444-4444-4444-444444444444',
   'a1030000-0000-0000-0000-000000000001',
   :'d0'::date - 1, :'d0'::date, 1, 1500000, 0, 0, 'checked-in', 'demo',
   'demo-fixture-departure-ready', now() - interval '1 day 4 hours'),
  ('d4000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000004', '22222222-2222-2222-2222-222222222222',
   'a1010000-0000-0000-0000-000000000003',
   :'d0'::date - 1, :'d0'::date, 1, 500000, 0, 0, 'checked-in', 'demo',
   'demo-fixture-departure-pending', now() - interval '1 day 3 hours'),
  ('d4000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000005', '33333333-3333-3333-3333-333333333333', NULL,
   :'d0'::date + 1, :'d0'::date + 2, 1, 900000, 270000, 0, 'hold', 'demo',
   'demo-fixture-hold', now() - interval '1 hour'),
  ('d4000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000006', '44444444-4444-4444-4444-444444444444', NULL,
   :'d0'::date + 7, :'d0'::date + 9, 2, 3000000, 900000, 0, 'confirmed', 'demo',
   'demo-fixture-future', now() - interval '2 days');

INSERT INTO reservation_hold (reservation_id, expires_at) VALUES
  ('d4000000-0000-4000-8000-000000000005', now() + interval '2 hours');

INSERT INTO stay (id, property_id, reservation_id, room_id, checkin_at, checkout_at, status) VALUES
  ('d5000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'd4000000-0000-4000-8000-000000000002', 'a1020000-0000-0000-0000-000000000001',
   now() - interval '4 hours', NULL, 'checked-in'),
  ('d5000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'd4000000-0000-4000-8000-000000000003', 'a1030000-0000-0000-0000-000000000001',
   now() - interval '1 day 4 hours', NULL, 'checked-in'),
  ('d5000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   'd4000000-0000-4000-8000-000000000004', 'a1010000-0000-0000-0000-000000000003',
   now() - interval '1 day 3 hours', NULL, 'checked-in');

INSERT INTO folio (id, property_id, guest_id, stay_id, member_id, status) VALUES
  ('d6000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000002', 'd5000000-0000-4000-8000-000000000002', NULL, 'open'),
  ('d6000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000003', 'd5000000-0000-4000-8000-000000000003', NULL, 'open'),
  ('d6000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   'd0000000-0000-4000-8000-000000000004', 'd5000000-0000-4000-8000-000000000004', NULL, 'open');

INSERT INTO folio_entry (id, folio_id, source_type, source_id, amount_paise, actor, created_at) VALUES
  ('d7000000-0000-4000-8000-000000000201', 'd6000000-0000-4000-8000-000000000002',
   'room', 'd4000000-0000-4000-8000-000000000002', 900000, 'demo-seed', now() - interval '4 hours'),
  ('d7000000-0000-4000-8000-000000000202', 'd6000000-0000-4000-8000-000000000002',
   'payment', 'd8000000-0000-4000-8000-000000000202', -450000, 'demo-seed', now() - interval '3 hours'),
  ('d7000000-0000-4000-8000-000000000301', 'd6000000-0000-4000-8000-000000000003',
   'room', 'd4000000-0000-4000-8000-000000000003', 1500000, 'demo-seed', now() - interval '1 day 4 hours'),
  ('d7000000-0000-4000-8000-000000000302', 'd6000000-0000-4000-8000-000000000003',
   'payment', 'd8000000-0000-4000-8000-000000000303', -1500000, 'demo-seed', now() - interval '1 day 2 hours'),
  ('d7000000-0000-4000-8000-000000000401', 'd6000000-0000-4000-8000-000000000004',
   'room', 'd4000000-0000-4000-8000-000000000004', 500000, 'demo-seed', now() - interval '1 day 3 hours');

INSERT INTO payment (
  id, property_id, folio_id, booking_id, amount_paise, currency, status, gateway_ref,
  idempotency_key, created_at
) VALUES
  ('d8000000-0000-4000-8000-000000000101', '11111111-1111-1111-1111-111111111111', NULL,
   'd4000000-0000-4000-8000-000000000001', 150000, 'INR', 'captured',
   'demo-gw-arrival-advance', 'demo-fixture-pay-arrival', now() - interval '2 hours'),
  ('d8000000-0000-4000-8000-000000000202', '11111111-1111-1111-1111-111111111111',
   'd6000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000002', 450000,
   'INR', 'captured', 'demo-gw-inhouse-part', 'demo-fixture-pay-inhouse', now() - interval '3 hours'),
  ('d8000000-0000-4000-8000-000000000303', '11111111-1111-1111-1111-111111111111',
   'd6000000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000003', 1500000,
   'INR', 'captured', 'demo-gw-departure-settled', 'demo-fixture-pay-departure', now() - interval '1 day 2 hours'),
  ('d8000000-0000-4000-8000-000000000606', '11111111-1111-1111-1111-111111111111', NULL,
   'd4000000-0000-4000-8000-000000000006', 900000, 'INR', 'captured',
   'demo-gw-future-advance', 'demo-fixture-pay-future', now() - interval '2 days');

INSERT INTO housekeeping_task (
  id, property_id, room_id, assignee, status, notes, created_at, updated_at
) VALUES
  ('d9000000-0000-4000-8000-000000000101', '11111111-1111-1111-1111-111111111111',
   'a1010000-0000-0000-0000-000000000002', 'Demo Housekeeping', 'todo',
   'demo: checkout clean', now() - interval '2 hours', now() - interval '2 hours'),
  ('d9000000-0000-4000-8000-000000000202', '11111111-1111-1111-1111-111111111111',
   'a1020000-0000-0000-0000-000000000003', 'Demo Housekeeping', 'inspect',
   'demo: inspection', now() - interval '4 hours', now() - interval '1 hour'),
  ('d9000000-0000-4000-8000-000000000303', '11111111-1111-1111-1111-111111111111',
   'a1030000-0000-0000-0000-000000000002', 'Demo Housekeeping', 'doing',
   'demo: deep clean', now() - interval '3 hours', now() - interval '30 minutes');

UPDATE room SET status = 'occupied' WHERE id IN (
  'a1020000-0000-0000-0000-000000000001',
  'a1030000-0000-0000-0000-000000000001',
  'a1010000-0000-0000-0000-000000000003'
);
UPDATE room SET status = 'dirty' WHERE id IN (
  'a1010000-0000-0000-0000-000000000002',
  'a1020000-0000-0000-0000-000000000003',
  'a1030000-0000-0000-0000-000000000002'
);

COMMIT;

\echo 'Reception demo fixture loaded.'
\echo 'Guests: 6 | Reservations: 6 (3 in-house, 1 arrival, 1 hold, 1 future) | Open tasks: 3'
