\set ON_ERROR_STOP on
\if :allow_demo
\else
  \echo 'Refusing to run: pass -v allow_demo=1 (use scripts/dev/reception-demo.sh).'
  \quit
\endif

DO $$
DECLARE
  n integer;
  d0 date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  SELECT count(*) INTO n FROM guest WHERE id IN (
    'd0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000003',
    'd0000000-0000-4000-8000-000000000004',
    'd0000000-0000-4000-8000-000000000005',
    'd0000000-0000-4000-8000-000000000006'
  );
  IF n <> 6 THEN RAISE EXCEPTION 'expected 6 fixture guests, found %', n; END IF;

  SELECT count(*) INTO n FROM reservation WHERE source = 'demo';
  IF n <> 6 THEN RAISE EXCEPTION 'expected 6 demo reservations, found %', n; END IF;

  SELECT count(*) INTO n FROM stay WHERE id IN (
    'd5000000-0000-4000-8000-000000000002',
    'd5000000-0000-4000-8000-000000000003',
    'd5000000-0000-4000-8000-000000000004'
  ) AND status = 'checked-in';
  IF n <> 3 THEN RAISE EXCEPTION 'expected 3 checked-in fixture stays, found %', n; END IF;

  SELECT count(*) INTO n FROM reservation
  WHERE status = 'confirmed' AND checkin_date = d0 AND id = 'd4000000-0000-4000-8000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'expected 1 fixture arrival, found %', n; END IF;

  SELECT count(*) INTO n FROM reservation
  WHERE status = 'checked-in' AND checkout_date = d0
    AND id IN ('d4000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000004');
  IF n <> 2 THEN RAISE EXCEPTION 'expected 2 fixture departures, found %', n; END IF;

  SELECT COALESCE(sum(amount_paise),0) INTO n FROM folio_entry
  WHERE folio_id = 'd6000000-0000-4000-8000-000000000002';
  IF n <> 450000 THEN RAISE EXCEPTION 'in-house folio expected 450000, found %', n; END IF;

  SELECT COALESCE(sum(amount_paise),0) INTO n FROM folio_entry
  WHERE folio_id = 'd6000000-0000-4000-8000-000000000003';
  IF n <> 0 THEN RAISE EXCEPTION 'ready departure expected settled, found %', n; END IF;

  SELECT COALESCE(sum(amount_paise),0) INTO n FROM folio_entry
  WHERE folio_id = 'd6000000-0000-4000-8000-000000000004';
  IF n <> 500000 THEN RAISE EXCEPTION 'pending departure expected 500000, found %', n; END IF;

  SELECT count(*) INTO n FROM housekeeping_task
  WHERE status IN ('todo','doing','inspect') AND id IN (
    'd9000000-0000-4000-8000-000000000101',
    'd9000000-0000-4000-8000-000000000202',
    'd9000000-0000-4000-8000-000000000303'
  );
  IF n <> 3 THEN RAISE EXCEPTION 'expected 3 open demo tasks, found %', n; END IF;

  SELECT count(*) INTO n FROM room
  WHERE (id = 'a1020000-0000-0000-0000-000000000001' AND status = 'occupied')
     OR (id = 'a1030000-0000-0000-0000-000000000001' AND status = 'occupied')
     OR (id = 'a1010000-0000-0000-0000-000000000003' AND status = 'occupied')
     OR (id = 'a1010000-0000-0000-0000-000000000002' AND status = 'dirty')
     OR (id = 'a1020000-0000-0000-0000-000000000003' AND status = 'dirty')
     OR (id = 'a1030000-0000-0000-0000-000000000002' AND status = 'dirty');
  IF n <> 6 THEN RAISE EXCEPTION 'expected 6 fixture room states, found %', n; END IF;

  IF EXISTS (SELECT 1 FROM room r
             JOIN stay s ON s.room_id = r.id AND s.status = 'checked-in'
             WHERE r.status <> 'occupied') THEN
    RAISE EXCEPTION 'an active stay has a room that is not occupied';
  END IF;
END $$;

\echo 'Fixture assertions passed.'
SELECT g.name, r.id::text AS reservation_id, r.status, r.checkin_date, r.checkout_date,
       r.quoted_total_paise, r.advance_due_paise
FROM reservation r JOIN guest g ON g.id = r.guest_id
WHERE r.source = 'demo'
ORDER BY r.checkin_date, g.name;

SELECT rm.room_no, rm.status,
       COALESCE(SUM(e.amount_paise),0) AS folio_outstanding
FROM room rm
LEFT JOIN stay s ON s.room_id = rm.id AND s.status = 'checked-in'
LEFT JOIN folio f ON f.stay_id = s.id
LEFT JOIN folio_entry e ON e.folio_id = f.id
WHERE rm.id IN (
  'a1010000-0000-0000-0000-000000000002',
  'a1010000-0000-0000-0000-000000000003',
  'a1020000-0000-0000-0000-000000000001',
  'a1020000-0000-0000-0000-000000000003',
  'a1030000-0000-0000-0000-000000000001',
  'a1030000-0000-0000-0000-000000000002'
)
GROUP BY rm.room_no, rm.status
ORDER BY rm.room_no;
