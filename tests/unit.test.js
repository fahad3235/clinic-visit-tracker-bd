// Node unit tests for logic.js — run: node tests/unit.test.js
const L = require('../logic.js');
let pass = 0, fail = 0;
function eq(name, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) { pass++; } else { fail++; console.log('FAIL ' + name + ': got ' + a + ' want ' + b); }
}
function ok(name, cond) { if (cond) pass++; else { fail++; console.log('FAIL ' + name); } }

// Date helpers
eq('isValidDate leap', L.isValidDate('2024-02-29'), true);
eq('isValidDate nonleap', L.isValidDate('2023-02-29'), false);
eq('isValidDate bad month', L.isValidDate('2026-13-01'), false);
eq('daysBetween', L.daysBetween('2026-10-27', '2026-11-03'), 7);
eq('daysBetween negative', L.daysBetween('2026-10-27', '2026-10-20'), -7);
// Money
eq('toPaisa', L.toPaisa(800.5), 80050);
eq('toPaisa negative', L.toPaisa(-5), null);
eq('fmtBDT', L.fmtBDT(123456), '1,234.56');
eq('fmtBDT bn digits', L.fmtBDT(120000, 'bn'), '১,২০০.০০');
// Validation
eq('valid visit', L.validateVisit({ doctor: 'Dr. A', specialty: 'Medicine', date: '2026-10-27', feePaisa: 80000, status: 'scheduled', tests: [] }), []);
ok('empty doctor rejected', L.validateVisit({ doctor: '', specialty: 'Medicine', date: '2026-10-27', feePaisa: 0, status: 'scheduled' }).length > 0);
ok('bad specialty rejected', L.validateVisit({ doctor: 'Dr. A', specialty: 'Nope', date: '2026-10-27', feePaisa: 0, status: 'scheduled' }).length > 0);
ok('bad date rejected', L.validateVisit({ doctor: 'Dr. A', specialty: 'Medicine', date: '2026-02-30', feePaisa: 0, status: 'scheduled' }).length > 0);
ok('negative fee rejected', L.validateVisit({ doctor: 'Dr. A', specialty: 'Medicine', date: '2026-10-27', feePaisa: -1, status: 'scheduled' }).length > 0);
ok('followUp before date rejected', L.validateVisit({ doctor: 'Dr. A', specialty: 'Medicine', date: '2026-10-27', followUp: '2026-10-20', feePaisa: 0, status: 'scheduled' }).length > 0);
ok('bad test rejected', L.validateVisit({ doctor: 'Dr. A', specialty: 'Medicine', date: '2026-10-27', feePaisa: 0, status: 'scheduled', tests: [{ name: '', status: 'ordered' }] }).length > 0);
// Stats — hand-verified scenario, asof 2026-10-27
const V = [
  { id: '1', doctor: 'Dr. A', specialty: 'Medicine', date: '2026-10-27', feePaisa: 80000, status: 'scheduled', followUp: '2026-10-27', tests: [{ name: 'CBC', status: 'ordered' }], followUpDone: false },
  { id: '2', doctor: 'Dr. B', specialty: 'Dental', date: '2026-10-20', feePaisa: 120000, status: 'done', tests: [{ name: 'X-ray', status: 'done' }] },
  { id: '3', doctor: 'Dr. C', specialty: 'Eye', date: '2026-10-15', feePaisa: 50000, status: 'scheduled', followUp: '2026-10-20', followUpDone: false, tests: [] },
];
const s = L.stats(V, '2026-10-27');
eq('stats total', s.total, 3);
eq('stats done', s.done, 1);
eq('stats upcoming', s.upcomingCount, 1);
eq('stats spent done-only', s.spentPaisa, 120000);
eq('stats overdue follow', s.overdueFollow, 1);
eq('stats due soon', s.dueSoon, 1);
eq('stats pending tests', s.pendingTests, 1);
eq('stats next visit doctor', s.nextVisit.doctor, 'Dr. A');
// Filter / sort
eq('filter by specialty', L.filterVisits(V, '', 'Dental', '').length, 1);
eq('filter by search', L.filterVisits(V, 'dr. b', '', '').length, 1);
eq('filter by status', L.filterVisits(V, '', '', 'done').length, 1);
eq('sort fee-desc first', L.sortVisits(V, 'fee-desc')[0].doctor, 'Dr. B');
eq('sort date-asc first', L.sortVisits(V, 'date-asc')[0].doctor, 'Dr. C');
// Import validation
eq('import ok', L.validateImport({ app: 'clinic-visit-tracker-bd', version: 1, visits: V }), null);
ok('import wrong app rejected', L.validateImport({ app: 'other', version: 1, visits: [] }) !== null);
ok('import bad visit rejected', L.validateImport({ app: 'clinic-visit-tracker-bd', version: 1, visits: [{ id: 'x', doctor: '', specialty: 'Medicine', date: '2026-10-27', feePaisa: 0, status: 'scheduled' }] }) !== null);
ok('import missing id rejected', L.validateImport({ app: 'clinic-visit-tracker-bd', version: 1, visits: [{ doctor: 'Dr. A', specialty: 'Medicine', date: '2026-10-27', feePaisa: 0, status: 'scheduled' }] }) !== null);
console.log(pass + '/' + (pass + fail) + ' unit tests passed');
process.exit(fail ? 1 : 0);
