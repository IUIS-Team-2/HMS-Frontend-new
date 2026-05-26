import React from "react";
import { Star } from "lucide-react";
import { fmtDt } from "../../utils/hodUtils";

export default function ReviewsView({ reviews, activeDept, setReviewTarget, setReviewForm, setShowReviewModal }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>Department Reviews — {activeDept}</div>
        <button className="hod-btn hod-btn-primary" onClick={() => { setReviewTarget(null); setReviewForm({rating:5,comments:"",score:"",period:"weekly"}); setShowReviewModal(true); }}>
          <Star size={13}/> Submit Review
        </button>
      </div>
      {reviews.length === 0
        ? <div className="hod-empty"><div className="hod-empty-ico">⭐</div><div>No reviews yet.</div></div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
            {reviews.map(rev => (
              <div key={rev.id} className="hod-review-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{rev.employee_name||rev.employeeName}</div>
                    <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{rev.period} · {fmtDt(rev.submitted_at||rev.created_at)}</div>
                  </div>
                  <span className="hod-badge" style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", borderColor:"rgba(245,158,11,0.3)" }}>{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</span>
                </div>
                {rev.performance_score && <div style={{ fontSize:12, color:"#10b981", fontWeight:700, marginBottom:6 }}>Score: {rev.performance_score}</div>}
                <div style={{ fontSize:12, color:"var(--text-mid)", lineHeight:1.6 }}>{rev.comments}</div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
