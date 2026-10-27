// UI strings EN / BN. App code looks up t(key) for the active language.
(function (root) {
  'use strict';
  var STR = {
    en: {
      tagline: 'Track doctor visits, follow-ups, tests and clinic costs — fully offline.',
      dashboard: 'Dashboard', visits: 'Visits', addVisit: 'Add visit', data: 'Data',
      totalVisits: 'Total visits', done: 'Done', upcoming: 'Upcoming', spentDone: 'Spent (done visits)',
      overdueFollow: 'Overdue follow-ups', dueSoon: 'Follow-ups in 7 days', pendingTests: 'Tests pending',
      nextVisit: 'Next visit', none: 'None', sample: 'Load sample', erase: 'Erase all',
      doctor: 'Doctor name', specialty: 'Specialty', clinic: 'Clinic / hospital', date: 'Visit date',
      reason: 'Reason for visit', fee: 'Fee (BDT)', status: 'Status', followUp: 'Follow-up date (optional)',
      followUpDone: 'Follow-up done', save: 'Save visit', cancel: 'Cancel',
      search: 'Search doctor, clinic or reason…', allSpecialties: 'All specialties', allStatuses: 'All statuses',
      sort: 'Sort', dateAsc: 'Date ↑', dateDesc: 'Date ↓', feeDesc: 'Fee ↓', feeAsc: 'Fee ↑',
      tests: 'Tests / reports for this visit', testName: 'Test name (e.g. CBC, X-ray)', addTest: 'Add test',
      markDone: 'Mark done', markScheduled: 'Reopen', delete: 'Delete', edit: 'Edit',
      noVisits: 'No visits yet. Add your first visit above.',
      noMatch: 'Nothing matches this search or filter.',
      confirmDelete: 'Delete this visit?', confirmErase: 'Type DELETE to erase everything.',
      erased: 'All data erased.', imported: 'Import successful.', export: 'Export JSON', import: 'Import JSON',
      badImport: 'Import rejected: ', sampleLoaded: 'Sample loaded.',
      scheduled: 'Scheduled', cancelled: 'Cancelled', ordered: 'Ordered',
      overdue: 'OVERDUE', dueSoonLabel: 'due soon', daysLeft: 'days left', daysOverdue: 'days overdue',
      footer: 'Personal offline tracker. Not medical advice — always follow your doctor’s guidance.',
      followUpSection: 'Follow-ups needing attention'
    },
    bn: {
      tagline: 'ডাক্তার দেখানো, ফলো-আপ, টেস্ট ও খরচের হিসাব রাখুন — সম্পূর্ণ অফলাইনে।',
      dashboard: 'ড্যাশবোর্ড', visits: 'ভিজিট', addVisit: 'ভিজিট যোগ করুন', data: 'ডেটা',
      totalVisits: 'মোট ভিজিট', done: 'সম্পন্ন', upcoming: 'আসন্ন', spentDone: 'খরচ (সম্পন্ন ভিজিট)',
      overdueFollow: 'মেয়াদোত্তীর্ণ ফলো-আপ', dueSoon: '৭ দিনের মধ্যে ফলো-আপ', pendingTests: 'বাকি টেস্ট',
      nextVisit: 'পরবর্তী ভিজিট', none: 'নেই', sample: 'নমুনা লোড করুন', erase: 'সব মুছুন',
      doctor: 'ডাক্তারের নাম', specialty: 'বিশেষজ্ঞতা', clinic: 'ক্লিনিক / হাসপাতাল', date: 'ভিজিটের তারিখ',
      reason: 'ভিজিটের কারণ', fee: 'ফি (টাকা)', status: 'অবস্থা', followUp: 'ফলো-আপের তারিখ (ঐচ্ছিক)',
      followUpDone: 'ফলো-আপ সম্পন্ন', save: 'ভিজিট সংরক্ষণ করুন', cancel: 'বাতিল',
      search: 'ডাক্তার, ক্লিনিক বা কারণ খুঁজুন…', allSpecialties: 'সব বিশেষজ্ঞতা', allStatuses: 'সব অবস্থা',
      sort: 'সাজান', dateAsc: 'তারিখ ↑', dateDesc: 'তারিখ ↓', feeDesc: 'ফি ↓', feeAsc: 'ফি ↑',
      tests: 'এই ভিজিটের টেস্ট / রিপোর্ট', testName: 'টেস্টের নাম (যেমন: CBC, X-ray)', addTest: 'টেস্ট যোগ করুন',
      markDone: 'সম্পন্ন করুন', markScheduled: 'আবার খুলুন', delete: 'মুছুন', edit: 'সম্পাদনা',
      noVisits: 'এখনো কোনো ভিজিট নেই। উপরে প্রথম ভিজিট যোগ করুন।',
      noMatch: 'এই খোঁজ বা ফিল্টারের সাথে কিছু মিলছে না।',
      confirmDelete: 'এই ভিজিটটি মুছবেন?', confirmErase: 'সব মুছতে DELETE লিখুন।',
      erased: 'সব ডেটা মোছা হয়েছে।', imported: 'ইমপোর্ট সফল হয়েছে।', export: 'JSON এক্সপোর্ট', import: 'JSON ইমপোর্ট',
      badImport: 'ইমপোর্ট বাতিল: ', sampleLoaded: 'নমুনা লোড হয়েছে।',
      scheduled: 'নির্ধারিত', cancelled: 'বাতিল', ordered: 'অর্ডার করা',
      overdue: 'মেয়াদোত্তীর্ণ', dueSoonLabel: 'শীঘ্রই', daysLeft: 'দিন বাকি', daysOverdue: 'দিন মেয়াদোত্তীর্ণ',
      footer: 'ব্যক্তিগত অফলাইন ট্র্যাকার। এটি চিকিৎসা পরামর্শ নয় — সবসময় আপনার ডাক্তারের নির্দেশনা মেনে চলুন।',
      followUpSection: 'যেসব ফলো-আপে নজর দরকার'
    }
  };
  var SPEC = { en: { General: 'General', Medicine: 'Medicine', Cardiology: 'Cardiology', Diabetes: 'Diabetes', Dental: 'Dental', Eye: 'Eye', ENT: 'ENT', Skin: 'Skin', Child: 'Child', Gynae: 'Gynae', Other: 'Other' },
    bn: { General: 'জেনারেল', Medicine: 'মেডিসিন', Cardiology: 'হৃদরোগ', Diabetes: 'ডায়াবেটিস', Dental: 'দাঁত', Eye: 'চোখ', ENT: 'নাক-কান-গলা', Skin: 'চর্ম', Child: 'শিশু', Gynae: 'গাইনি', Other: 'অন্যান্য' } };
  var api = { STR: STR, SPEC: SPEC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ClinicI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
