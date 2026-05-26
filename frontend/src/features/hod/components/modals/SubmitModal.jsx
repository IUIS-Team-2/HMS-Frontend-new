import React from "react";

export default function SubmitModal({ submitTarget, submitNote, setSubmitNote, confirmSubmitToAdmin, onClose }) {
  return (
    <div className="hod-overlay" onClick={onClose}>
      <div className="hod-modal" onClick={e => e.stopPropagation()}>
        <button
  className="hod-modal-close"
  onClick={onClose}
  aria-label="Close"
  title="Close"
>
  ✕
</button>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📤</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Submit to Admin Management</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>Submitting: <strong style={{ color:"var(--text)" }}>{submitTarget?.name}</strong></div>
        </div>
        <div className="hod-form-row"><label className="hod-lbl">Handover Note (optional)</label><textarea className="hod-textarea" value={submitNote} placeholder="Any notes for Admin Management / Super Admin…" onChange={e => setSubmitNote(e.target.value)}/></div>
        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#6366f1" }}>✓ This will be visible to Admin Management and Super Admin for review & performance tracking.</div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={confirmSubmitToAdmin}>Confirm Submit →</button>
        </div>
      </div>
    </div>
  );
}
