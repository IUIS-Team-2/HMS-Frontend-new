// ─── HMS Shared Data Store ────────────────────────────────────────────────────
// Cleaned up for Backend - Only keeping UI constants and helpers

export const BRANCHES = {
  all:   { label: 'All Branches',   color: '#1e40af' },
  laxmi: { label: 'Laxmi Nagar',    color: '#0f766e' },
  raya:  { label: 'Raya',           color: '#1d4ed8' },
};

export const DEPARTMENTS = ['Billing', 'Pharmacy', 'OPD', 'IPD', 'Lab', 'Admin', 'Others'];

// ─── Utility helpers ──────────────────────────────────────────────────────────
export const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

export const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

export const downloadCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};