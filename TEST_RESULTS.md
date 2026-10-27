# Test results — clinic-visit-tracker-bd (2026-10-27, 15:00 slot)

## Unit tests — 33/33 passed (`node tests/unit.test.js`)

- Date validation incl. leap-year edge (2024-02-29 valid, 2023-02-29 rejected).
- Money: 800.50 → 80050 paisa; negative rejected; fmtBDT 123456 → "1,234.56";
  Bengali digits 120000 → "১,২০০.০০".
- Validation rejects: empty doctor, bad specialty, bad date, negative fee,
  follow-up before visit date, unnamed test.
- Hand-verified stats scenario (asof 2026-10-27): 3 visits → total 3, done 1,
  upcoming 1, spent (done only) ৳1,200.00, overdue follow-ups 1, due-soon 1,
  pending tests 1, next visit Dr. A.
- Filter (specialty/search/status), sort (fee-desc, date-asc), import validation
  (good file accepted; wrong app / bad visit / missing id rejected).
- One test-side fix during the run: the stats fixture originally gave visit 3 a
  follow-up (2026-10-20) earlier than its visit date (2026-10-25); validation
  correctly rejected it. Fixture corrected to visit 2026-10-15 / follow-up
  2026-10-20; 0 app bugs found.

## Headless-Chrome smoke — desktop 14/14, mobile 15/15, 0 console/page errors

Raw-CDP harness against /opt/meta-chromium/chrome, `?asof=2026-10-27`:
boot + header, dashboard starts at 0, empty-visits message, empty-doctor
validation error, add visit → appears with ৳800.00, dashboard total → 1,
test add (CBC) to visit, search no-match message, BN toggle → Bengali tagline,
reload persistence via localStorage, sample loader → 2 visits incl. Ayesha Rahman,
mobile-only 390px no-overflow check. 0 app-logic repairs in smoke runs.
