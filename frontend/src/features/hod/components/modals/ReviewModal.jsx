import React from "react";
import { Star } from "lucide-react";

export default function ReviewModal({ reviewForm, setReviewForm, reviewTarget, employees, activeDept, submitReview, onClose }) {
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
        <div className="hod-modal-title"><Star size={16}/> Submit Employee Review</div>
        <div className="hod-form-row">
          <label className="hod-lbl">Employee</label>
          <select className="hod-sel" value={reviewForm.employeeId||(reviewTarget?.employee?.id||reviewTarget?.task?.assigned_to||"")} onChange={e => setReviewForm(p=>({...p,employeeId:e.target.value}))}>
            <option value="">Select Employee</option>
            {employees.filter(e=>(e.department||e.dept)===activeDept).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div className="hod-form-row">
            <label className="hod-lbl">Period</label>
            <select className="hod-sel" value={reviewForm.period} onChange={e => setReviewForm(p=>({...p,period:e.target.value}))}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="hod-form-row">
            <label className="hod-lbl">Rating (1–5)</label>
            <select className="hod-sel" value={reviewForm.rating} onChange={e => setReviewForm(p=>({...p,rating:Number(e.target.value)}))}>
              {[1,2,3,4,5].map(r=><option key={r} value={r}>{"★".repeat(r)} ({r}/5)</option>)}
            </select>
          </div>
        </div>
        <div className="hod-form-row"><label className="hod-lbl">Performance Score</label><input className="hod-inp" value={reviewForm.score} placeholder="e.g. 87/100" onChange={e => setReviewForm(p=>({...p,score:e.target.value}))}/></div>
        <div className="hod-form-row"><label className="hod-lbl">Comments *</label><textarea className="hod-textarea" value={reviewForm.comments} placeholder="Performance observations…" onChange={e => setReviewForm(p=>({...p,comments:e.target.value}))}/></div>
        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#6366f1" }}>ℹ This review will be submitted to Admin Management and reflected in Super Admin analytics.</div>
        <div className="hod-modal-foot">
          <button className="hod-btn hod-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="hod-btn hod-btn-primary" onClick={submitReview} disabled={!reviewForm.comments.trim()}>Submit Review</button>
        </div>
      </div>
    </div>
  );
}
