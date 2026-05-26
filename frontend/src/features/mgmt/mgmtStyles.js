export const MGMT_CSS = (accent, isDark) => `
  option { background: var(--surface); color: var(--text); }
  body { background: var(--bg); color: var(--text); }
  .hms-hdr { background: var(--surface); }
  .hms-logo-text { color: var(--text); }
  .hms-logo-sub { color: var(--text-muted); }
  .hms-role-badge { background: ${accent}18; border: 1px solid ${accent}30; color: ${accent}; }
  .hms-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-big-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-avatar-pill { background: ${isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.05)"}; border: 1px solid ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-avatar-name { color: ${isDark?"#94a3b8":"#475569"}; }
  .hms-logout-btn { border: 1px solid ${isDark?"#1e2a3a":"#dde8f5"}; color: #64748b; }
  .hms-wrap { background: var(--bg); color: var(--text); }
  .hms-sb { background: var(--sidebar); border-right: 1px solid var(--sidebar-border); }
  .hms-nav-item { color: #64748b; }
  .hms-nav-item:hover { color: ${isDark?"#f1f5f9":"#0f172a"}; background: ${isDark?"rgba(0,0,0,.05)":"rgba(0,0,0,.05)"}; }
  .hms-nav-item.active { color: ${isDark?"#f1f5f9":"#0f172a"}; background: ${isDark?"rgba(0,0,0,.05)":"rgba(0,0,0,.05)"}; border-left: 2px solid ${accent}; font-weight: 600; }
  .hms-branch-select { border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background-color: ${isDark?"#0b1120":"#ffffff"}; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .hms-card { background: var(--card); border-color: var(--border); }
  .hms-card-title { color: var(--text); }
  .hms-prof-card { background: var(--card); }
  .hms-stat-card { background: var(--card); border-color: var(--border); }
  .hms-stat-label { color: var(--text-muted); }
  .hms-th { color: var(--text-muted); }
  .hms-td { color: var(--text-mid); }
  .hms-td-hi { color: var(--text); }
  .hms-td-mono { color: var(--text-muted); }
  .hms-td-sm { color: var(--text-muted); }
  .hms-add-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-add-btn-lg { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-cancel-btn { color: #64748b; }
  .hms-save-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-lbl { color: #64748b; }
  .hms-inp { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-inp-sm { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-sel { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-textarea { background: var(--input-bg); color: var(--text); border-color: var(--input-border); }
  .hms-modal-overlay { background: var(--modal-overlay); }
  .hms-modal-box { background: var(--modal-bg); border-color: var(--modal-border); }
  .hms-modal-title { color: var(--text); }
  .hms-empty { color: ${isDark?"#2d3a50":"#94a3b8"}; }
  .hms-view-key { color: #64748b; }
  .hms-view-val { color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .hms-dept-card { background: ${isDark?"#0b1120":"#ffffff"}; }
  .hms-progress-bar { background: ${isDark?"#1e2a3a":"#dde8f5"}; }
  .hms-med-inline-input { background: var(--input-bg); color: var(--text); border: 1px solid var(--input-border); border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none; }
  .hms-med-inline-input:focus { border-color: ${accent}; }
  .hms-patient-select-box { background: ${isDark?"#080c18":"#f8faff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 8px; max-height: 150px; overflow-y: auto; margin-top: 4px; }
  .hms-patient-select-item { padding: 7px 12px; cursor: pointer; font-size: 11px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${isDark?"#1a2540":"#e8eef8"}; transition: background 0.15s; }
  .hms-patient-select-item:hover { background: ${accent}18; }
  .hms-patient-select-item.selected { background: ${accent}22; border-left: 3px solid ${accent}; }
  .hms-patient-selected-pill { display: inline-flex; align-items: center; gap: 6px; background: ${accent}18; border: 1px solid ${accent}40; color: ${accent}; border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .hms-patient-search { background: ${isDark?"#080c18":"#ffffff"}; color: ${isDark?"#e2e8f0":"#1e293b"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 6px; padding: 6px 10px; font-size: 11px; width: 100%; box-sizing: border-box; margin-bottom: 4px; outline: none; }
  .hms-patient-search:focus { border-color: ${accent}; }
  .hms-mh-pill { display: inline-flex; align-items: center; font-size: 11px; padding: 3px 10px; border-radius: 12px; background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); cursor: pointer; }
  .rep-patient-card { background: ${isDark?"#0b1120":"#ffffff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
  .rep-patient-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; background: ${isDark?"#080c18":"#f8faff"}; border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; }
  .rep-patient-head:hover { background: ${accent}10; }
  .rep-patient-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; background: linear-gradient(135deg, ${accent}, #818cf8); }
  .rep-patient-name { font-size: 13px; font-weight: 700; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .rep-patient-meta { font-size: 10px; color: ${isDark?"#475569":"#64748b"}; margin-top: 2px; }
  .dis-section-card { background: ${isDark?"#0b1120":"#ffffff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 12px; margin-bottom: 14px; overflow: hidden; }
  .dis-section-head { display: flex; align-items: center; gap: 10px; padding: 11px 18px; border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background: ${isDark?"#080c18":"#f8faff"}; }
  .dis-section-body { padding: 16px 18px; }
  .bill-page-wrap { display: flex; gap: 18px; align-items: flex-start; }
  .bill-patient-list { width: 240px; flex-shrink: 0; background: ${isDark?"#0b1120":"#f8faff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 10px; overflow: hidden; }
  .bill-patient-list-head { padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: ${accent}; border-bottom: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; background: ${isDark?"#080c18":"#eef3fc"}; }
  .bill-patient-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid ${isDark?"#111827":"#e8eef8"}; transition: background 0.15s; }
  .bill-patient-item:hover { background: ${accent}12; }
  .bill-patient-item.active { background: ${accent}20; border-left: 3px solid ${accent}; }
  .bill-patient-name { font-size: 12px; font-weight: 600; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .bill-patient-uhid { font-size: 10px; color: ${isDark?"#475569":"#64748b"}; margin-top: 2px; }
  .bill-detail-pane { flex: 1; min-width: 0; }
  .bill-print-card { background: ${isDark?"#0b1120":"#ffffff"}; border: 1px solid ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 12px; padding: 28px; font-family: 'Courier New', monospace; }
  .bill-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
  .bill-info-cell { padding: 7px 12px; border-right: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-bottom: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; background: ${isDark?"#0b1120":"#ffffff"}; }
  .bill-info-cell:nth-child(even) { border-right: none; }
  .bill-info-label { font-size: 9px; font-weight: 700; color: ${isDark?"#475569":"#94a3b8"}; text-transform: uppercase; letter-spacing: .05em; }
  .bill-info-value { font-size: 12px; color: ${isDark?"#e2e8f0":"#1e293b"}; font-weight: 600; margin-top: 2px; }
  .bill-services-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .bill-services-table th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${isDark?"#0f172a":"#f1f5f9"}; color: #64748b; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; }
  .bill-services-table td { padding: 7px 10px; font-size: 12px; border: 1px solid ${isDark?"#1e2a3a":"#e2e8f0"}; color: ${isDark?"#e2e8f0":"#1e293b"}; }
  .bill-add-svc-row { display: flex; gap: 8px; align-items: center; padding: 8px 10px; border: 1px dashed ${isDark?"#1a2540":"#c7d5eb"}; border-radius: 6px; background: ${isDark?"#080c18":"#f8faff"}; margin-top: 6px; margin-bottom: 12px; }
  .bill-totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .bill-totals-box { width: 280px; border: 1px solid ${isDark?"#1e2a3a":"#c7d5eb"}; border-radius: 8px; overflow: hidden; }
  .bill-total-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 14px; border-bottom: 1px solid ${isDark?"#1e2a3a":"#e2e8f0"}; font-size: 12px; }
  .bill-total-row:last-child { border-bottom: none; }
  .bill-total-row.net { background: ${accent}15; font-weight: 700; font-size: 14px; padding: 10px 14px; }
`;

export const BILL_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #bill-print-area, #bill-print-area * { visibility: visible !important; }
    #bill-print-area { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; z-index: 99999 !important; padding: 24px !important; background: #fff !important; color: #000 !important; }
    .no-print { display: none !important; }
  }
`;
