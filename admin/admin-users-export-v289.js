/* PipSePaisa V289 — User Management full export hotfix
   - Exports ALL profiles, not only the visible/filtered rows.
   - Paginates Supabase reads so accounts above the 1,000-row API limit are included.
   - Includes WhatsApp number and core user/account fields.
   - Overrides the older exportV28UsersCsv handler without changing the User Management UI.
*/
(function () {
  'use strict';

  const PAGE_SIZE = 1000;

  function csvCell(value) {
    let v = value == null ? '' : String(value);
    // Prevent spreadsheet formula injection while preserving the visible value.
    if (/^[=+\-@]/.test(v) && !/^\+?\d[\d\s().-]*$/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }

  function firstValue(row, keys) {
    for (const key of keys) {
      const value = row && row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
  }

  function whatsappOf(row) {
    return firstValue(row, ['whatsapp', 'whatsapp_number', 'phone', 'mobile', 'phone_number', 'contact_number']);
  }

  function registrationLinkOf(row) {
    return firstValue(row, [
      'registration_link_name', 'registration_link', 'link_name', 'link_slug',
      'registration_slug', 'source_slug', 'referral_source', 'signup_source',
      'registration_source', 'utm_source'
    ]) || 'Direct / Organic';
  }

  function joinedOf(row) {
    const raw = firstValue(row, ['created_at', 'joined_at', 'registered_at']);
    if (!raw) return '';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
  }

  function accountAccessOf(row) {
    if (row && (row.is_banned === true || String(row.status || '').toLowerCase() === 'banned')) return 'Banned';
    if (row && (row.is_premium === true || String(row.member_type || '').toLowerCase() === 'premium' || String(row.member_type || '').toLowerCase() === 'vip')) {
      return String(row.member_type || '').toLowerCase() === 'vip' ? 'VIP' : 'Premium';
    }
    const broker = String(firstValue(row, ['broker_verification_status', 'broker_status', 'verification_status'])).toLowerCase();
    if (broker && !['verified', 'approved', 'active'].includes(broker)) return 'Broker Verification';
    if (row && row.email_verified === false) return 'Restricted - Email Verification Pending';
    return 'Free / Standard';
  }

  async function fetchAllProfiles() {
    if (typeof sb === 'undefined' || !sb) throw new Error('Database connection is not ready. Please refresh the Admin Panel and try again.');

    const all = [];
    let from = 0;
    for (let page = 0; page < 100; page++) {
      const to = from + PAGE_SIZE - 1;
      const result = await sb.from('profiles').select('*').order('created_at', { ascending: false }).range(from, to);
      if (result.error) throw result.error;
      const rows = result.data || [];
      all.push.apply(all, rows);
      if (rows.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // Safety de-duplication in case the underlying data changes while pages are being fetched.
    const seen = new Set();
    return all.filter(function (row) {
      const key = row && (row.id || row.email || (String(row.full_name || '') + '|' + String(row.created_at || '')));
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function downloadCsv(rows) {
    const headers = [
      'Name', 'Email', 'WhatsApp Number', 'Client ID', 'Role', 'Plan',
      'Account Access', 'Country', 'Registration Link', 'Joined', 'User ID'
    ];

    const lines = [headers.map(csvCell).join(',')];
    rows.forEach(function (u) {
      const role = firstValue(u, ['role']) || (u.is_admin ? 'admin' : 'user');
      const plan = u && u.is_premium ? (String(u.member_type || '').toLowerCase() === 'vip' ? 'VIP' : 'Premium') : 'Free';
      const record = [
        firstValue(u, ['full_name', 'name']),
        firstValue(u, ['email']),
        whatsappOf(u),
        firstValue(u, ['client_id', 'client_code', 'psp_id']),
        role,
        plan,
        accountAccessOf(u),
        firstValue(u, ['country', 'country_name']),
        registrationLinkOf(u),
        joinedOf(u),
        firstValue(u, ['id'])
      ];
      lines.push(record.map(csvCell).join(','));
    });

    // UTF-8 BOM makes Excel open names/numbers more reliably.
    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PipSePaisa-All-Users-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function findExportButton() {
    return document.querySelector('#page-users button[onclick*="exportV28UsersCsv"]') ||
      document.querySelector('button[onclick*="exportV28UsersCsv"]');
  }

  window.exportV28UsersCsv = async function exportV28UsersCsvV289() {
    const btn = findExportButton();
    const oldHtml = btn ? btn.innerHTML : '';
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Exporting All Users...';
      }

      const rows = await fetchAllProfiles();
      if (!rows.length) {
        alert('No registered users found to export.');
        return;
      }

      downloadCsv(rows);
      console.log('✅ V289 exported all users:', rows.length);
    } catch (error) {
      console.error('V289 user export error:', error);
      alert('Export failed: ' + (error && error.message ? error.message : 'Please refresh the page and try again.'));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml || '📥 Export CSV';
      }
    }
  };
})();
