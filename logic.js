// Clinic Visit Tracker BD — pure logic (no DOM). Shared by app.js and node tests.
// Money is integer paisa (1 BDT = 100 paisa). Dates are ISO YYYY-MM-DD strings.
(function (root) {
  'use strict';
  var SPECIALTIES = ['General', 'Medicine', 'Cardiology', 'Diabetes', 'Dental', 'Eye', 'ENT', 'Skin', 'Child', 'Gynae', 'Other'];
  var STATUSES = ['scheduled', 'done', 'cancelled'];
  var TEST_STATUSES = ['ordered', 'done'];

  function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }
  function todayISO(asof) { return (asof || new Date().toISOString().slice(0, 10)); }
  function daysBetween(a, b) {
    var da = new Date(a + 'T00:00:00Z'), db = new Date(b + 'T00:00:00Z');
    return Math.round((db - da) / 86400000);
  }
  function toPaisa(v) {
    if (typeof v !== 'number' || !isFinite(v) || v < 0) return null;
    return Math.round(v * 100);
  }
  function fmtBDT(paisa, digits) {
    var neg = paisa < 0, abs = Math.abs(paisa);
    var s = (Math.floor(abs / 100)).toLocaleString('en-US') + '.' + String(abs % 100).padStart(2, '0');
    if (digits === 'bn') s = s.replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; });
    return (neg ? '-' : '') + s;
  }
  function validateVisit(v) {
    var errs = [];
    if (!v || typeof v !== 'object') return ['visit must be an object'];
    if (!v.doctor || !String(v.doctor).trim()) errs.push('doctor required');
    if (!SPECIALTIES.includes(v.specialty)) errs.push('specialty invalid');
    if (!isValidDate(v.date)) errs.push('date invalid');
    if (v.followUp && !isValidDate(v.followUp)) errs.push('followUp invalid');
    if (v.followUp && isValidDate(v.date) && isValidDate(v.followUp) && v.followUp < v.date) errs.push('followUp before visit date');
    if (typeof v.feePaisa !== 'number' || !Number.isInteger(v.feePaisa) || v.feePaisa < 0) errs.push('fee invalid');
    if (!STATUSES.includes(v.status)) errs.push('status invalid');
    if (v.tests !== undefined) {
      if (!Array.isArray(v.tests)) errs.push('tests must be an array');
      else v.tests.forEach(function (t, i) {
        if (!t.name || !String(t.name).trim()) errs.push('test ' + i + ' name required');
        if (!TEST_STATUSES.includes(t.status)) errs.push('test ' + i + ' status invalid');
      });
    }
    return errs;
  }
  function validateTest(t) {
    if (!t || !String(t.name || '').trim()) return 'test name required';
    if (!TEST_STATUSES.includes(t.status)) return 'test status invalid';
    return null;
  }
  // Dashboard stats for a visit list, as of a given date.
  function stats(visits, asof) {
    var today = todayISO(asof);
    var done = visits.filter(function (v) { return v.status === 'done'; });
    var upcoming = visits.filter(function (v) { return v.status === 'scheduled' && v.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var overdueFollow = visits.filter(function (v) {
      return v.status !== 'cancelled' && v.followUp && v.followUp < today && !v.followUpDone;
    });
    var dueSoon = visits.filter(function (v) {
      return v.status !== 'cancelled' && v.followUp && !v.followUpDone &&
        v.followUp >= today && daysBetween(today, v.followUp) <= 7;
    });
    var spent = visits.reduce(function (s, v) { return s + (v.status === 'done' ? v.feePaisa : 0); }, 0);
    var pendingTests = 0;
    visits.forEach(function (v) { (v.tests || []).forEach(function (t) { if (t.status === 'ordered') pendingTests++; }); });
    return { total: visits.length, done: done.length, upcomingCount: upcoming.length,
      nextVisit: upcoming.length ? upcoming[0] : null, overdueFollow: overdueFollow.length,
      dueSoon: dueSoon.length, spentPaisa: spent, pendingTests: pendingTests };
  }
  function filterVisits(visits, q, specialty, status) {
    q = (q || '').trim().toLowerCase();
    return visits.filter(function (v) {
      if (specialty && v.specialty !== specialty) return false;
      if (status && v.status !== status) return false;
      if (!q) return true;
      return [v.doctor, v.clinic, v.reason].join(' ').toLowerCase().includes(q);
    });
  }
  function sortVisits(visits, key) {
    var arr = visits.slice();
    if (key === 'date-desc') arr.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    else if (key === 'fee-desc') arr.sort(function (a, b) { return b.feePaisa - a.feePaisa; });
    else if (key === 'fee-asc') arr.sort(function (a, b) { return a.feePaisa - b.feePaisa; });
    else arr.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return arr;
  }
  function validateImport(data) {
    if (!data || data.app !== 'clinic-visit-tracker-bd' || data.version !== 1 || !Array.isArray(data.visits)) return 'bad import header';
    for (var i = 0; i < data.visits.length; i++) {
      var v = data.visits[i];
      if (typeof v.id !== 'string' || !v.id) return 'visit ' + i + ' id invalid';
      var errs = validateVisit(v);
      if (errs.length) return 'visit ' + i + ': ' + errs.join('; ');
    }
    return null;
  }
  var api = { SPECIALTIES: SPECIALTIES, STATUSES: STATUSES, TEST_STATUSES: TEST_STATUSES,
    isValidDate: isValidDate, todayISO: todayISO, daysBetween: daysBetween, toPaisa: toPaisa,
    fmtBDT: fmtBDT, validateVisit: validateVisit, validateTest: validateTest,
    stats: stats, filterVisits: filterVisits, sortVisits: sortVisits, validateImport: validateImport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ClinicLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
