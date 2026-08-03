/* PipSePaisa V31 — PSP Mentor text signal report */
(function () {
  'use strict';

  var reportRows = [];
  var currentReportText = '';

  function toast(message, type) {
    if (window.pipToast) window.pipToast(message, type || 'ok');
    else if (window.mentorAlert) window.mentorAlert(message);
  }

  function safeDate(value) {
    var d = value ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }

  function reportDate(row) {
    return safeDate(row.closed_at) || safeDate(row.created_at) || new Date();
  }

  function formatDate(value) {
    var d = value instanceof Date ? value : safeDate(value);
    if (!d) return '-';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }

  function formatPair(pair) {
    var raw = String(pair || '-').trim();
    var key = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (key.indexOf('XAU') >= 0 || key === 'GOLD') return 'Gold';
    if (key.indexOf('XAG') >= 0 || key === 'SILVER') return 'Silver';
    if (key.indexOf('BTC') >= 0) return 'Bitcoin';
    return raw;
  }

  function formatDirection(direction) {
    var d = String(direction || '-').toLowerCase();
    if (d === 'buy') return 'Buy';
    if (d === 'sell') return 'Sell';
    return d ? d.charAt(0).toUpperCase() + d.slice(1) : '-';
  }

  function formatResult(row) {
    var status = String(row.status || 'active').toLowerCase();
    if (status === 'tp1') return 'TP1';
    if (status === 'tp2') return 'TP2';
    if (status === 'tp3') return 'TP3';
    if (status === 'tp_hit') return row.tp_hit ? 'TP' + row.tp_hit : 'TP Hit';
    if (status === 'sl' || status === 'sl_hit') return 'SL';
    if (status === 'be') return 'Breakeven';
    if (status === 'closed') return 'Closed';
    if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
    return 'Active';
  }

  function formatPips(value) {
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var rounded = Math.round(n * 10) / 10;
    return (rounded > 0 ? '+' : '') + rounded + ' Pips';
  }

  function isReportable(row) {
    var status = String(row.status || 'active').toLowerCase();
    return row.result_pips !== null && row.result_pips !== undefined && row.result_pips !== '' ||
      ['tp1', 'tp2', 'tp3', 'tp_hit', 'sl', 'sl_hit', 'be', 'closed', 'cancelled', 'canceled'].indexOf(status) >= 0;
  }

  function selectedRows() {
    var period = (document.getElementById('mentorReportPeriod') || {}).value || 'month';
    var now = new Date();
    var from = null;
    var to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'week') {
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - 6);
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'custom') {
      var fromValue = (document.getElementById('mentorReportFrom') || {}).value;
      var toValue = (document.getElementById('mentorReportTo') || {}).value;
      from = fromValue ? new Date(fromValue + 'T00:00:00') : null;
      to = toValue ? new Date(toValue + 'T23:59:59') : to;
    }

    return reportRows.filter(function (row) {
      if (!isReportable(row)) return false;
      var d = reportDate(row);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    }).sort(function (a, b) {
      return reportDate(a) - reportDate(b);
    });
  }

  function buildReportText(rows) {
    var lines = ['Date | Pair | Direction | Result | PNL in Pips', ''];
    var total = 0;

    rows.forEach(function (row) {
      var pips = Number(row.result_pips);
      if (!isFinite(pips)) pips = 0;
      total += pips;
      lines.push([
        formatDate(reportDate(row)),
        formatPair(row.pair),
        formatDirection(row.direction),
        formatResult(row),
        formatPips(pips)
      ].join(' | '));
    });

    lines.push('');
    lines.push('Total Signals: ' + rows.length);
    lines.push('Total PNL: ' + formatPips(total));
    return lines.join('\n');
  }

  function updateCustomDates() {
    var period = (document.getElementById('mentorReportPeriod') || {}).value;
    var box = document.getElementById('mentorReportCustomDates');
    if (box) box.style.display = period === 'custom' ? 'grid' : 'none';
    renderReportPreview();
  }

  function renderReportPreview() {
    var preview = document.getElementById('mentorReportPreview');
    if (!preview) return;
    var rows = selectedRows();
    currentReportText = buildReportText(rows);
    preview.textContent = currentReportText;
    var empty = document.getElementById('mentorReportEmpty');
    if (empty) empty.style.display = rows.length ? 'none' : 'block';
  }

  function ensureStyles() {
    if (document.getElementById('mentorReportStyles')) return;
    var style = document.createElement('style');
    style.id = 'mentorReportStyles';
    style.textContent = [
      '#mentorReportOverlay{position:fixed;inset:0;z-index:100000;background:rgba(5,12,24,.76);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}',
      '#mentorReportCard{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fffaf1;color:#0f172a;border:1px solid rgba(245,158,11,.5);border-radius:20px;box-shadow:0 28px 80px rgba(0,0,0,.38);padding:22px}',
      '.mentor-report-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}',
      '.mentor-report-title{font-size:21px;font-weight:900;margin:0}',
      '.mentor-report-sub{font-size:12px;color:#64748b;margin-top:4px}',
      '.mentor-report-close{width:36px;height:36px;border:1px solid #e6dcc8;background:#fff;color:#64748b;border-radius:11px;font-size:18px;cursor:pointer}',
      '.mentor-report-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}',
      '.mentor-report-custom{display:none;grid-template-columns:1fr 1fr;gap:10px}',
      '.mentor-report-label{display:block;font-size:11px;font-weight:800;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px}',
      '.mentor-report-input{width:100%;min-height:44px;border:1px solid #e6dcc8;border-radius:11px;background:#fff;color:#0f172a;padding:9px 12px;font:inherit}',
      '#mentorReportPreview{white-space:pre-wrap;overflow:auto;min-height:230px;max-height:390px;background:#111827;color:#f8fafc;border-radius:14px;padding:16px;font:13px/1.65 Consolas,Monaco,monospace;border:1px solid rgba(245,158,11,.35)}',
      '#mentorReportEmpty{display:none;color:#b45309;font-size:12px;font-weight:700;margin:8px 0 0}',
      '.mentor-report-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:16px}',
      '.mentor-report-btn{min-height:44px;border-radius:11px;padding:10px 16px;font-weight:900;cursor:pointer;border:1px solid #e6dcc8;background:#fff;color:#334155}',
      '.mentor-report-btn.primary{border:0;background:linear-gradient(135deg,#f59e0b,#d97706);color:#111827}',
      '@media(max-width:600px){#mentorReportCard{padding:17px;border-radius:17px}.mentor-report-custom{grid-template-columns:1fr}.mentor-report-actions{display:grid;grid-template-columns:1fr}.mentor-report-btn{width:100%}#mentorReportPreview{font-size:11px;min-height:210px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeMentorReport() {
    var overlay = document.getElementById('mentorReportOverlay');
    if (overlay) overlay.remove();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  async function copyMentorReport() {
    var rows = selectedRows();
    if (!rows.length) {
      toast('No completed signal results were found for the selected period.', 'err');
      return;
    }
    currentReportText = buildReportText(rows);
    try {
      await copyText(currentReportText);
      toast('Report copied to clipboard.', 'ok');
    } catch (error) {
      toast('Unable to copy the report. Please try again.', 'err');
    }
  }

  function downloadMentorReport() {
    var rows = selectedRows();
    if (!rows.length) {
      toast('No completed signal results were found for the selected period.', 'err');
      return;
    }
    currentReportText = buildReportText(rows);
    var blob = new Blob([currentReportText], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'PipSePaisa_Signal_Report_' + stamp + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Text report downloaded successfully.', 'ok');
  }

  async function openMentorReport() {
    if (typeof sb === 'undefined' || !sb || typeof ME === 'undefined' || !ME || !ME.id) {
      toast('Unable to load the report. Please sign in again.', 'err');
      return;
    }
    ensureStyles();
    closeMentorReport();

    var overlay = document.createElement('div');
    overlay.id = 'mentorReportOverlay';
    overlay.innerHTML = '<div id="mentorReportCard" role="dialog" aria-modal="true" aria-labelledby="mentorReportTitle">' +
      '<div class="mentor-report-head"><div><h3 id="mentorReportTitle" class="mentor-report-title">📄 Signal Report</h3><div class="mentor-report-sub">Copy the text and share it directly on WhatsApp.</div></div><button class="mentor-report-close" type="button" onclick="closeMentorReport()" aria-label="Close">✕</button></div>' +
      '<div class="mentor-report-grid"><div><label class="mentor-report-label" for="mentorReportPeriod">Report period</label><select id="mentorReportPeriod" class="mentor-report-input" onchange="mentorReportPeriodChanged()"><option value="week">Last 7 Days</option><option value="month" selected>This Month</option><option value="all">All Time</option><option value="custom">Custom Dates</option></select></div>' +
      '<div id="mentorReportCustomDates" class="mentor-report-custom"><div><label class="mentor-report-label" for="mentorReportFrom">From</label><input id="mentorReportFrom" class="mentor-report-input" type="date" onchange="renderMentorReportPreview()"></div><div><label class="mentor-report-label" for="mentorReportTo">To</label><input id="mentorReportTo" class="mentor-report-input" type="date" onchange="renderMentorReportPreview()"></div></div></div>' +
      '<pre id="mentorReportPreview">Loading report...</pre><div id="mentorReportEmpty">No completed signal results were found for the selected period.</div>' +
      '<div class="mentor-report-actions"><button class="mentor-report-btn" type="button" onclick="closeMentorReport()">Close</button><button class="mentor-report-btn" type="button" onclick="copyMentorReport()">📋 Copy Report</button><button class="mentor-report-btn primary" type="button" onclick="downloadMentorReport()">⬇ Download Text Report</button></div></div>';
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeMentorReport();
    });
    document.body.appendChild(overlay);

    try {
      var response = await sb.from('signals')
        .select('pair,direction,status,result_pips,tp_hit,created_at,closed_at')
        .eq('owner_id', ME.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (response.error) throw response.error;
      reportRows = response.data || [];
      renderReportPreview();
    } catch (error) {
      reportRows = [];
      renderReportPreview();
      toast('Unable to load the report. Please try again.', 'err');
    }
  }

  window.openMentorReport = openMentorReport;
  window.closeMentorReport = closeMentorReport;
  window.copyMentorReport = copyMentorReport;
  window.downloadMentorReport = downloadMentorReport;
  window.renderMentorReportPreview = renderReportPreview;
  window.mentorReportPeriodChanged = updateCustomDates;
})();
