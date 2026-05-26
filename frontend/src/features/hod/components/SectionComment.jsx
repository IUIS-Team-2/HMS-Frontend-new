import React from "react";
import { MessageSquare } from "lucide-react";

export default function SectionComment({ sectionKey, comments, onChange }) {
  return (
    <div style={{ background:"rgba(245,158,11,0.06)", border:"1.5px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"12px 16px", marginTop:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
        <MessageSquare size={13} style={{ color:"#f59e0b" }}/>
        <span style={{ fontSize:11, fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:".07em" }}>HOD Comments for this section</span>
      </div>
      <textarea
        value={comments[sectionKey] || ""}
        onChange={e => onChange(sectionKey, e.target.value)}
        placeholder="Write your observations, corrections needed, or approval note…"
        rows={3}
        style={{ width:"100%", fontFamily:"inherit", fontSize:12, color:"var(--text)", background:"var(--surface)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, padding:"8px 12px", outline:"none", resize:"vertical", boxSizing:"border-box" }}
      />
    </div>
  );
}
