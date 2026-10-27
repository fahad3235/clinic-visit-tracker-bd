// Clinic Visit Tracker BD — DOM layer. Logic lives in logic.js, strings in i18n.js.
(function () {
  'use strict';
  var L = window.ClinicLogic, I18N = window.ClinicI18n;
  var KEY = 'clinic-visit-tracker-bd-v1', LANG_KEY = 'clinic-visit-tracker-bd-lang';
  var lang = localStorage.getItem(LANG_KEY) || 'en';
  var visits = load();
  var editingId = null, tab = 'dashboard', q = '', fSpec = '', fStatus = '', sortKey = 'date-asc';
  function t(k) { return (I18N.STR[lang] || I18N.STR.en)[k] || k; }
  function specName(s) { return (I18N.SPEC[lang] || I18N.SPEC.en)[s] || s; }
  function statusName(s) { return s === 'done' ? t('done') : s === 'cancelled' ? t('cancelled') : t('scheduled'); }
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
  function save() { localStorage.setItem(KEY, JSON.stringify(visits)); }
  function uid() { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function digits(s) { return lang === 'bn' ? String(s).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[+d]; }) : String(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function asof() { var p = new URLSearchParams(location.search); return p.get('asof') || undefined; }
  function today() { return L.todayISO(asof()); }
  function followBadge(v) {
    if (!v.followUp || v.followUpDone || v.status === 'cancelled') return '';
    var d = L.daysBetween(today(), v.followUp);
    if (d < 0) return ' <span class="badge b-overdue">' + t('overdue') + ' ' + digits(-d) + ' ' + t('daysOverdue') + '</span>';
    if (d <= 7) return ' <span class="badge b-soon">' + t('dueSoonLabel') + ' ' + digits(d) + ' ' + t('daysLeft') + '</span>';
    return ' <span class="badge">' + digits(d) + ' ' + t('daysLeft') + '</span>';
  }
  function render() {
    document.documentElement.lang = lang;
    var tabBtns = document.querySelectorAll('[data-tab]');
    tabBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); b.textContent = t(b.dataset.tab === 'dashboard' ? 'dashboard' : b.dataset.tab === 'visits' ? 'visits' : b.dataset.tab === 'add' ? 'addVisit' : 'data'); });
    document.getElementById('tagline').textContent = t('tagline');
    var fs = document.getElementById('fSpecFilter');
    if (fs) fs.innerHTML = '<option value="">' + t('allSpecialties') + '</option>' + L.SPECIALTIES.map(function (sp) { return '<option value="' + sp + '"' + (fSpec === sp ? ' selected' : '') + '>' + specName(sp) + '</option>'; }).join('');
    var fst = document.getElementById('fStatusFilter');
    if (fst) fst.innerHTML = '<option value="">' + t('allStatuses') + '</option><option value="scheduled"' + (fStatus === 'scheduled' ? ' selected' : '') + '>' + t('scheduled') + '</option><option value="done"' + (fStatus === 'done' ? ' selected' : '') + '>' + t('done') + '</option><option value="cancelled"' + (fStatus === 'cancelled' ? ' selected' : '') + '>' + t('cancelled') + '</option>';
    document.getElementById('langBtn').textContent = lang === 'en' ? 'বাংলা' : 'English';
    var ft = document.getElementById('footerText'); if (ft) ft.textContent = t('footer');
    var s = L.stats(visits, asof());
    var dash = document.getElementById('dashboard');
    dash.innerHTML = '<div class="cards">' +
      '<div class="card"><b>' + digits(s.total) + '</b><span>' + t('totalVisits') + '</span></div>' +
      '<div class="card"><b>' + digits(s.done) + '</b><span>' + t('done') + '</span></div>' +
      '<div class="card"><b>' + digits(s.upcomingCount) + '</b><span>' + t('upcoming') + '</span></div>' +
      '<div class="card"><b>৳' + digits(L.fmtBDT(s.spentPaisa)) + '</b><span>' + t('spentDone') + '</span></div>' +
      '<div class="card"><b>' + digits(s.overdueFollow) + '</b><span>' + t('overdueFollow') + '</span></div>' +
      '<div class="card"><b>' + digits(s.dueSoon) + '</b><span>' + t('dueSoon') + '</span></div>' +
      '<div class="card"><b>' + digits(s.pendingTests) + '</b><span>' + t('pendingTests') + '</span></div>' +
      '<div class="card"><b>' + (s.nextVisit ? esc(s.nextVisit.doctor) + ' · ' + digits(s.nextVisit.date) : t('none')) + '</b><span>' + t('nextVisit') + '</span></div></div>';
    var attn = visits.filter(function (v) { return v.followUp && !v.followUpDone && v.status !== 'cancelled' && L.daysBetween(today(), v.followUp) <= 7; });
    if (attn.length) {
      dash.innerHTML += '<div class="panel"><h2 style="margin:0 0 8px;font-size:18px">' + t('followUpSection') + '</h2>' +
        attn.map(function (v) { return '<p style="margin:6px 0">🏥 ' + esc(v.doctor) + ' — ' + digits(v.followUp) + followBadge(v) + '</p>'; }).join('') + '</div>';
    }
    renderVisits(); renderForm();
    document.getElementById('dashboard').style.display = tab === 'dashboard' ? '' : 'none';
    document.getElementById('visitsPanel').style.display = tab === 'visits' ? '' : 'none';
    document.getElementById('formPanel').style.display = tab === 'add' ? '' : 'none';
    document.getElementById('dataPanel').style.display = tab === 'data' ? '' : 'none';
  }
  function renderVisits() {
    var list = L.sortVisits(L.filterVisits(visits, q, fSpec, fStatus), sortKey);
    var el = document.getElementById('visitList');
    if (!visits.length) { el.innerHTML = '<p>' + t('noVisits') + '</p>'; return; }
    if (!list.length) { el.innerHTML = '<p>' + t('noMatch') + '</p>'; return; }
    el.innerHTML = list.map(function (v) {
      var tests = (v.tests || []).map(function (tt, i) {
        return '<div class="testrow"><span>' + esc(tt.name) + ' — ' + (tt.status === 'done' ? t('done') : t('ordered')) + '</span>' +
          '<button data-test-toggle="' + v.id + ':' + i + '">' + (tt.status === 'done' ? t('markScheduled') : t('markDone')) + '</button>' +
          '<button data-test-del="' + v.id + ':' + i + '">✕</button></div>';
      }).join('');
      return '<div class="visit"><h3>' + esc(v.doctor) + ' <span class="badge b-' + v.status + '">' + statusName(v.status) + '</span>' + followBadge(v) + '</h3>' +
        '<p>' + specName(v.specialty) + (v.clinic ? ' · ' + esc(v.clinic) : '') + ' · ' + digits(v.date) + ' · ৳' + digits(L.fmtBDT(v.feePaisa)) + '</p>' +
        (v.reason ? '<p>' + esc(v.reason) + '</p>' : '') +
        (v.followUp ? '<p>' + t('followUp') + ': ' + digits(v.followUp) + (v.followUpDone ? ' ✓' : '') + '</p>' : '') +
        '<div><strong>' + t('tests') + '</strong>' + (tests || '<p style="color:var(--muted);font-size:14px">' + t('none') + '</p>') +
        '<div class="row"><input data-test-name="' + v.id + '" placeholder="' + t('testName') + '"><button data-test-add="' + v.id + '">' + t('addTest') + '</button></div></div>' +
        '<div class="row"><button data-edit="' + v.id + '">' + t('edit') + '</button>' +
        (v.status !== 'done' ? '<button data-done="' + v.id + '">' + t('markDone') + '</button>' : '') +
        (v.followUp && !v.followUpDone ? '<button data-fudone="' + v.id + '">' + t('followUpDone') + '</button>' : '') +
        '<button class="danger" data-del="' + v.id + '">' + t('delete') + '</button></div></div>';
    }).join('');
  }
  function renderForm() {
    var v = editingId ? visits.find(function (x) { return x.id === editingId; }) : null;
    document.getElementById('formTitle').textContent = v ? t('edit') : t('addVisit');
    document.getElementById('fDoctor').value = v ? v.doctor : '';
    document.getElementById('fClinic').value = v ? (v.clinic || '') : '';
    document.getElementById('fDate').value = v ? v.date : today();
    document.getElementById('fReason').value = v ? (v.reason || '') : '';
    document.getElementById('fFee').value = v ? (v.feePaisa / 100) : '';
    document.getElementById('fFollow').value = v ? (v.followUp || '') : '';
    var sel = document.getElementById('fSpec');
    sel.innerHTML = L.SPECIALTIES.map(function (sp) { return '<option value="' + sp + '"' + (v && v.specialty === sp ? ' selected' : '') + '>' + specName(sp) + '</option>'; }).join('');
    document.getElementById('fStatus').value = v ? v.status : 'scheduled';
    ['fDoctorLab', 'fSpecLab', 'fClinicLab', 'fDateLab', 'fReasonLab', 'fFeeLab', 'fStatusLab', 'fFollowLab'].forEach(function (id) {
      var map = { fDoctorLab: 'doctor', fSpecLab: 'specialty', fClinicLab: 'clinic', fDateLab: 'date', fReasonLab: 'reason', fFeeLab: 'fee', fStatusLab: 'status', fFollowLab: 'followUp' };
      document.getElementById(id).textContent = t(map[id]);
    });
    document.getElementById('saveBtn').textContent = t('save');
    document.getElementById('cancelBtn').textContent = t('cancel');
    document.getElementById('searchInput').placeholder = t('search');
  }
  function showMsg(msg) { var el = document.getElementById('msg'); el.textContent = msg; setTimeout(function () { el.textContent = ''; }, 4000); }
  function bind() {
    document.getElementById('langBtn').onclick = function () { lang = lang === 'en' ? 'bn' : 'en'; localStorage.setItem(LANG_KEY, lang); render(); };
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { tab = b.dataset.tab; render(); }; });
    document.getElementById('searchInput').oninput = function (e) { q = e.target.value; renderVisits(); };
    document.getElementById('fSpecFilter').onchange = function (e) { fSpec = e.target.value; renderVisits(); };
    document.getElementById('fStatusFilter').onchange = function (e) { fStatus = e.target.value; renderVisits(); };
    document.getElementById('sortSel').onchange = function (e) { sortKey = e.target.value; renderVisits(); };
    document.getElementById('saveBtn').onclick = function () {
      var fee = parseFloat(document.getElementById('fFee').value);
      var cand = { id: editingId || uid(), doctor: document.getElementById('fDoctor').value.trim(),
        specialty: document.getElementById('fSpec').value, clinic: document.getElementById('fClinic').value.trim(),
        date: document.getElementById('fDate').value, reason: document.getElementById('fReason').value.trim(),
        feePaisa: isNaN(fee) ? -1 : L.toPaisa(fee), status: document.getElementById('fStatus').value,
        followUp: document.getElementById('fFollow').value || null,
        tests: editingId ? (visits.find(function (x) { return x.id === editingId; }) || {}).tests || [] : [],
        followUpDone: editingId ? !!(visits.find(function (x) { return x.id === editingId; }) || {}).followUpDone : false };
      var errs = L.validateVisit(cand);
      document.getElementById('formErr').textContent = errs.length ? errs.join('; ') : '';
      if (errs.length) return;
      if (editingId) { var i = visits.findIndex(function (x) { return x.id === editingId; }); visits[i] = cand; }
      else visits.push(cand);
      save(); editingId = null; tab = 'visits'; render();
    };
    document.getElementById('cancelBtn').onclick = function () { editingId = null; tab = 'visits'; render(); };
    document.getElementById('visitList').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var id;
      if (b.dataset.edit) { editingId = b.dataset.edit; tab = 'add'; render(); return; }
      if (b.dataset.del) { id = b.dataset.del; if (confirm(t('confirmDelete'))) { visits = visits.filter(function (x) { return x.id !== id; }); save(); render(); } return; }
      if (b.dataset.done) { id = b.dataset.done; visits.find(function (x) { return x.id === id; }).status = 'done'; save(); render(); return; }
      if (b.dataset.fudone) { id = b.dataset.fudone; visits.find(function (x) { return x.id === id; }).followUpDone = true; save(); render(); return; }
      if (b.dataset.testAdd) {
        id = b.dataset.testAdd;
        var inp = document.querySelector('[data-test-name="' + id + '"]');
        var tt = { name: inp.value.trim(), status: 'ordered' };
        var err = L.validateTest(tt); if (err) { alert(err); return; }
        var vv = visits.find(function (x) { return x.id === id; }); vv.tests = vv.tests || []; vv.tests.push(tt); save(); renderVisits(); return;
      }
      if (b.dataset.testToggle) { var parts = b.dataset.testToggle.split(':'); var v2 = visits.find(function (x) { return x.id === parts[0]; }); v2.tests[+parts[1]].status = v2.tests[+parts[1]].status === 'done' ? 'ordered' : 'done'; save(); renderVisits(); return; }
      if (b.dataset.testDel) { var p2 = b.dataset.testDel.split(':'); var v3 = visits.find(function (x) { return x.id === p2[0]; }); v3.tests.splice(+p2[1], 1); save(); renderVisits(); return; }
    };
    document.getElementById('sampleBtn').onclick = function () {
      var d = today();
      visits = [
        { id: uid(), doctor: 'Dr. Ayesha Rahman', specialty: 'Medicine', clinic: 'Dhaka Medical College Hospital', date: d, reason: 'Fever and check-up', feePaisa: 80000, status: 'scheduled', followUp: d, tests: [{ name: 'CBC', status: 'ordered' }], followUpDone: false },
        { id: uid(), doctor: 'Dr. Tanvir Hasan', specialty: 'Dental', clinic: 'City Dental Care', date: '2026-10-20', reason: 'Tooth pain', feePaisa: 120000, status: 'done', followUp: null, tests: [{ name: 'X-ray', status: 'done' }], followUpDone: false }
      ];
      save(); showMsg(t('sampleLoaded')); tab = 'visits'; render();
    };
    document.getElementById('eraseBtn').onclick = function () {
      var v = prompt(t('confirmErase'));
      if (v === 'DELETE') { visits = []; save(); showMsg(t('erased')); render(); }
    };
    document.getElementById('exportBtn').onclick = function () {
      var blob = new Blob([JSON.stringify({ app: 'clinic-visit-tracker-bd', version: 1, visits: visits }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'clinic-visits.json'; a.click();
    };
    document.getElementById('importFile').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          var err = L.validateImport(data);
          if (err) { showMsg(t('badImport') + err); return; }
          visits = data.visits; save(); showMsg(t('imported')); render();
        } catch (ex) { showMsg(t('badImport') + ex.message); }
      };
      r.readAsText(f);
    };
  }
  // Expose for smoke tests
  window.__clinic = { getVisits: function () { return visits; }, setLang: function (l) { lang = l; render(); } };
  document.addEventListener('DOMContentLoaded', function () {
    // Populate filter selects once (labels refreshed in render via textContent where needed)
    var fs = document.getElementById('fSpecFilter');
    fs.innerHTML = '<option value="">' + t('allSpecialties') + '</option>' + L.SPECIALTIES.map(function (sp) { return '<option value="' + sp + '">' + specName(sp) + '</option>'; }).join('');
    var fst = document.getElementById('fStatusFilter');
    fst.innerHTML = '<option value="">' + t('allStatuses') + '</option><option value="scheduled">' + t('scheduled') + '</option><option value="done">' + t('done') + '</option><option value="cancelled">' + t('cancelled') + '</option>';
    bind(); render();
  });
})();
