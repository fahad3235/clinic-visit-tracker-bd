# Clinic Visit Tracker BD 🏥

Offline bilingual (EN/বাংলা) doctor & clinic visit tracker for Bangladesh. Record every
doctor visit, its follow-up date, ordered tests/reports and what you paid — all stored only
in your browser. No account, no server, no network requests.

## Features

1. **Visit log** — doctor name, specialty (11 options), clinic/hospital, date, reason,
   fee in BDT, and status (Scheduled / Done / Cancelled), with edit and delete.
2. **Dashboard** — total visits, done count, upcoming visits, money spent on done visits,
   overdue follow-ups, follow-ups due within 7 days, pending tests, and the next visit.
3. **Follow-up alerts** — a follow-up date per visit, with OVERDUE / due-soon badges and
   a "needs attention" section; mark a follow-up done when you attend it.
4. **Tests & reports** — add tests (e.g. CBC, X-ray) to any visit, flip them Ordered ↔ Done.
5. **Search, filter & sort** — search doctor/clinic/reason, filter by specialty or status,
   sort by date or fee.
6. **Data portability** — JSON export, strict-validated JSON import (a bad file is rejected
   whole, your data stays intact), labelled sample data, and typed-DELETE erase-all.
7. **Bilingual UI** — EN/বাংলা toggle persisted across reloads, Bengali digits in BN mode,
   390px mobile layout.

## Stack

Vanilla HTML + CSS + JavaScript. No build step, no dependencies, no CDN. Money is stored
as integer paisa (1 BDT = 100 paisa) so totals never drift with floating-point error.

## Run locally

Open `index.html` in any modern browser — or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

For deterministic dates in tests, append `?asof=YYYY-MM-DD`.

## Testing

```sh
node tests/unit.test.js        # 33 logic tests (validation, stats, filter/sort, import)
node tests/smoke.js            # 14 headless-Chrome checks (desktop)
node tests/smoke.js --viewport=mobile  # 15 checks incl. 390px no-overflow
```

## Data & privacy

Everything lives in `localStorage` under one key (`clinic-visit-tracker-bd-v1`) on your
own device. Export a JSON backup before clearing browser data — clearing it erases your
visits. No analytics, no tracking, no network calls.

## Limitations

- This is a personal organizer, **not medical advice** and not a substitute for your
  doctor's guidance, prescriptions, or hospital records.
- It does not book appointments, send reminders outside the browser, or sync between
  devices — open the page to see your follow-up alerts.
- Fees are whatever you type; nothing here verifies a clinic's actual charges.

## Status

Built by the MUSE Project Factory (run #156, 2026-10-27, 15:00 slot). Tests green at
ship time: 33/33 unit + 14/14 desktop smoke + 15/15 mobile smoke, 0 console errors.
