export const HOD_CSS = `
  *,*::before,*::after { box-sizing:border-box; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:2px; }
  .hod-root { display:flex; height:100dvh; min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--ui-font-sans); overflow:hidden; }
  .hod-sb { width:224px; min-width:224px; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width .22s; overflow:hidden; position:relative; z-index:10; min-height:0; }
  .hod-sb.col { width:62px; min-width:62px; }
  .hod-sb-head { padding:16px 14px 16px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:64px; }
  .hod-logo { width:32px; height:32px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#10b981; flex-shrink:0; }
  .hod-col-btn { width:24px; height:24px; border-radius:5px; background:var(--surface-2); border:1px solid var(--border); color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
  .hod-sb-scroll { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding-bottom:12px; }
  .hod-slbl { font-size:8px; letter-spacing:.12em; color:var(--text-muted); text-transform:uppercase; padding:12px 16px 5px; white-space:nowrap; overflow:hidden; }
  .hod-nav-item { display:flex; align-items:center; gap:9px; padding:9px 12px 9px 14px; cursor:pointer; background:transparent; border:none; width:100%; text-align:left; font-family:inherit; font-size:12px; color:var(--text-muted); transition:.13s; border-left:3px solid transparent; white-space:nowrap; position:relative; overflow:visible; }
  .hod-nav-item:hover { color:var(--text); background:var(--surface-2); }
  .hod-nav-item.act { color:#10b981; background:rgba(16,185,129,0.08); border-left-color:#10b981; font-weight:600; }
  .hod-nav-icon { width:30px; height:30px; min-width:30px; min-height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:visible; }
  .hod-sb-mini-stats { display:flex; gap:5px; padding:8px 12px; flex-wrap:wrap; }
  .hod-mini-stat { flex:1; min-width:40px; border-radius:6px; padding:5px 7px; text-align:center; border:1px solid; }
  .hod-sb-footer { margin-top:auto; border-top:1px solid var(--border); padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
  .hod-user-card { display:flex; align-items:center; gap:9px; }
  .hod-avatar { width:30px; height:30px; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#10b981; flex-shrink:0; }
  .hod-logout { display:flex; align-items:center; gap:7px; padding:8px 11px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:#ef4444; font-size:11px; cursor:pointer; font-family:inherit; width:100%; }
  .hod-hdr { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:58px; background:var(--surface); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .hod-hdr-right { display:flex; align-items:center; gap:10px; }
  .hod-sync-pill { display:flex; align-items:center; gap:6px; background:var(--surface-2); border:1px solid var(--border); border-radius:20px; padding:4px 11px; font-size:10px; color:#06b6d4; letter-spacing:.06em; }
  .hod-hdr-logout { display:flex; align-items:center; gap:6px; padding:6px 13px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; color:#ef4444; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; transition:.14s; }
  .hod-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; min-height:0; }
  .hod-content { flex:1; overflow-y:auto; min-width:0; min-height:0; overscroll-behavior:contain; padding:22px 26px; }
  .hod-stat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-bottom:22px; }
  .hod-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; position:relative; overflow:hidden; animation:fadeIn .3s ease; }
  .hod-stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .hod-patient-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
  .hod-patient-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; cursor:pointer; transition:.18s; animation:fadeIn .25s ease; }
  .hod-patient-card:hover { border-color:rgba(16,185,129,0.5); box-shadow:0 4px 20px rgba(16,185,129,0.1); transform:translateY(-2px); }
  .hod-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; white-space:nowrap; border:1px solid; }
  .hod-chip { padding:2px 9px; border-radius:20px; font-size:10px; font-weight:600; background:var(--surface-2); color:var(--text-muted); border:1px solid var(--border); white-space:nowrap; }
  .hod-table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:20px; }
  .hod-table { width:100%; border-collapse:collapse; font-size:12px; }
  .hod-table th { padding:10px 14px; text-align:left; font-size:9px; letter-spacing:.1em; color:var(--text-muted); text-transform:uppercase; border-bottom:1px solid var(--border); background:var(--surface-2); }
  .hod-table td { padding:10px 14px; border-bottom:1px solid var(--border); color:var(--text-mid); vertical-align:middle; }
  .hod-table tr:last-child td { border-bottom:none; }
  .hod-table tr:hover td { background:var(--surface-2); }
  .hod-inp { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; transition:.13s; }
  .hod-inp:focus { border-color:#10b981; background:var(--surface); }
  .hod-sel { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-textarea { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 11px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; resize:vertical; min-height:70px; }
  .hod-lbl { display:block; font-size:9px; letter-spacing:.1em; color:var(--text-muted); text-transform:uppercase; margin-bottom:5px; font-weight:700; }
  .hod-form-row { margin-bottom:13px; }
  .hod-form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
  .hod-btn { padding:8px 16px; border-radius:8px; font-size:12px; font-family:inherit; cursor:pointer; border:1px solid; transition:.14s; display:inline-flex; align-items:center; gap:6px; font-weight:600; white-space:nowrap; }
  .hod-btn-primary { background:#10b981; border-color:#10b981; color:#fff; }
  .hod-btn-primary:hover { background:#059669; }
  .hod-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
  .hod-btn-ghost { background:transparent; border-color:var(--border); color:var(--text-muted); }
  .hod-btn-ghost:hover { color:var(--text); border-color:var(--border-strong); }
  .hod-btn-danger { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); color:#ef4444; }
  .hod-btn-amber { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.3); color:#f59e0b; }
  .hod-btn-blue { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); color:#6366f1; }
  .hod-btn-navy { background:#0f172a; border-color:#0f172a; color:#fff; }
  .hod-btn-navy:disabled { opacity:.4; cursor:not-allowed; }
  .hod-btn-approve { background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.4); color:#10b981; }
  .hod-btn-revert { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.35); color:#ef4444; }
  .hod-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); animation:fadeIn .15s ease; }
  .hod-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:26px 28px; width:560px; max-width:95vw; max-height:88vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.5); position:relative; }
  .hod-modal-lg { width:780px; }
  .hod-modal-xl { width:1100px; max-width:98vw; max-height:95vh; }
  .hod-modal-title { font-size:15px; font-weight:700; color:var(--text); margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .hod-modal-close { position:absolute; top:14px; right:14px; width:28px; height:28px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; font-size:13px; }
  .hod-modal-foot { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; padding-top:14px; border-top:1px solid var(--border); }
  .hod-section { background:var(--surface); border:1px solid var(--border); border-radius:12px; margin-bottom:16px; overflow:hidden; }
  .hod-section-head { display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--border); background:var(--surface-2); }
  .hod-section-title { font-size:13px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; }
  .hod-section-body { padding:18px; }
  .hod-filter-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:11px 16px; margin-bottom:18px; }
  .hod-progress-track { height:4px; background:var(--border); border-radius:4px; overflow:hidden; }
  .hod-progress-fill { height:100%; border-radius:4px; transition:width .3s; }
  .hod-pt-list { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; max-height:200px; overflow-y:auto; margin-top:4px; }
  .hod-pt-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:.12s; font-size:12px; }
  .hod-pt-item:hover { background:rgba(16,185,129,0.06); }
  .hod-pt-item.sel { background:rgba(16,185,129,0.1); border-left:3px solid #10b981; }
  .hod-selected-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .hod-sel-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:600; }
  .hod-toasts { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
  .hod-toast { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:11px 16px; font-size:12px; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,0.3); display:flex; align-items:center; gap:8px; animation:fadeIn .2s ease; color:var(--text); }
  .hod-toast.s { border-left:3px solid #10b981; }
  .hod-toast.e { border-left:3px solid #ef4444; }
  .hod-toast.w { border-left:3px solid #f59e0b; }
  .hod-empty { text-align:center; padding:48px 20px; color:var(--text-muted); }
  .hod-empty-ico { font-size:40px; margin-bottom:12px; }
  .hod-tabs { display:flex; border-bottom:1px solid var(--border); background:var(--surface); overflow-x:auto; }
  .hod-tab { padding:11px 18px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:none; color:var(--text-muted); font-family:inherit; border-bottom:2px solid transparent; transition:.12s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
  .hod-tab.act { color:#10b981; border-bottom-color:#10b981; }
  .hod-tab-dot { width:6px; height:6px; border-radius:50%; background:#10b981; }
  .hod-rv-section { border:1px solid var(--border); border-radius:12px; margin-bottom:12px; overflow:hidden; }
  .hod-rv-section-head { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; cursor:pointer; background:var(--surface-2); transition:.13s; }
  .hod-rv-section-head:hover { background:rgba(99,102,241,0.06); }
  .hod-rv-section-body { padding:18px; border-top:1px solid var(--border); }
  .hod-pdf-panel { background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:16px 20px; margin-bottom:16px; }
  .hod-pdf-grid { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }
  .hod-checklist { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; margin-bottom:16px; }
  .hod-checklist-steps { display:flex; align-items:center; margin-bottom:16px; }
  .hod-step { display:flex; align-items:center; gap:8px; flex:1; min-width:0; padding:9px 10px; border-radius:9px; cursor:pointer; transition:.13s; }
  .hod-step:hover { background:var(--surface-2); }
  .hod-step.done { background:rgba(16,185,129,0.08); }
  .hod-step.cur { background:rgba(99,102,241,0.08); }
  .hod-step-chk { width:26px; height:26px; border-radius:50%; border:2px solid var(--border-strong); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; font-weight:700; background:var(--surface); color:var(--text-muted); }
  .hod-step.done .hod-step-chk { background:#10b981; border-color:#10b981; color:#fff; }
  .hod-step-lbl { font-size:11px; font-weight:600; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hod-step.done .hod-step-lbl { color:#10b981; }
  .hod-step-con { width:14px; height:2px; background:var(--border); flex-shrink:0; }
  .hod-step-con.done { background:#10b981; }
  .hod-patient-hdr { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px 24px; margin-bottom:14px; }
  .hod-dod-strip { display:flex; background:var(--surface-2); border-radius:10px; border:1px solid var(--border); overflow:hidden; margin-top:12px; }
  .hod-dod-item { flex:1; padding:10px 16px; display:flex; flex-direction:column; gap:3px; border-right:1px solid var(--border); }
  .hod-dod-item:last-child { border-right:none; }
  .hod-dod-lbl { font-size:9px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.07em; }
  .hod-dod-val { font-size:12px; font-weight:700; color:var(--text); }
  .hod-tot-box { margin-top:18px; border-top:2px solid var(--border); padding-top:14px; max-width:360px; margin-left:auto; }
  .hod-tot-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
  .hod-tot-fin { border-top:2px solid var(--text); margin-top:8px; padding-top:10px; font-size:15px; font-weight:800; color:var(--text); }
  .hod-finp { background:var(--surface-2); border:1.5px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-size:13px; font-family:inherit; transition:.14s; outline:none; width:100%; }
  .hod-finp:focus { border-color:#10b981; }
  .hod-fsel { background:var(--surface-2); border:1.5px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-size:13px; font-family:inherit; outline:none; width:100%; }
  .hod-ftxt { background:var(--surface-2); border:1.5px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-size:13px; font-family:inherit; outline:none; width:100%; resize:vertical; min-height:78px; }
  .hod-tinp { background:var(--surface-2); border:1.5px solid var(--border); border-radius:6px; padding:6px 9px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-tinp:focus { border-color:#10b981; }
  .hod-tsel { background:var(--surface-2); border:1.5px solid var(--border); border-radius:6px; padding:6px 8px; color:var(--text); font-size:12px; font-family:inherit; outline:none; width:100%; }
  .hod-addbtn { display:inline-flex; align-items:center; gap:6px; padding:8px 15px; background:var(--surface-2); border:1.5px dashed var(--border-strong); color:var(--text-muted); border-radius:8px; cursor:pointer; font-size:12px; font-family:inherit; font-weight:600; margin-top:12px; transition:.14s; }
  .hod-addbtn:hover { border-color:#10b981; color:#10b981; }
  .hod-savebtn { padding:10px 22px; border-radius:8px; font-size:13px; font-weight:700; background:#0f172a; color:#fff; border:none; cursor:pointer; font-family:inherit; transition:.14s; }
  .hod-bgrid { display:grid; grid-template-columns:1fr 320px; gap:16px; align-items:start; }
  .hod-logout-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px 28px; width:380px; max-width:92vw; box-shadow:0 24px 60px rgba(0,0,0,0.5); position:relative; text-align:center; }
  .hod-stars { display:flex; gap:4px; }
  .hod-star { font-size:22px; cursor:pointer; transition:.1s; line-height:1; }
  .hod-star:hover { transform:scale(1.2); }
  .hod-dept-assign-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; animation:slideIn .2s ease; }
  .hod-dept-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .hod-dept-icon-wrap { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .hod-review-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; animation:fadeIn .25s ease; }
  @media(max-width:860px) {
    .hod-sb { display:none; }
    .hod-stat-grid { grid-template-columns:repeat(2,1fr); }
    .hod-patient-grid { grid-template-columns:1fr; }
    .hod-bgrid { grid-template-columns:1fr; }
  }
`;
