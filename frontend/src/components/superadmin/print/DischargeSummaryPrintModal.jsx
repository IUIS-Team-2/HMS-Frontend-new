import { useState, useEffect } from "react";
import { printWithAuth } from "../../../utils/printWithAuth";
import { useT, bColor, bName, cardStyle } from "../shared/tokens";
import { Pill } from "../shared/MicroUI";
import { apiService, BASE_URL } from "../../../services/apiService";
import { toast } from "react-toastify";
import { Printer, FileText } from "lucide-react";
import { fmt } from "../shared/tokens";

export function DischargeSummaryPrintModal({ p, branchKey, onClose }) {
  const T = useT();
  const [docTemplate, setDocTemplate] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!p) return;
    const load = async () => {
      setDocLoading(true);
      try {
        const res = await apiService.getDynamicSummary(p.uhid, p.admNo, p.dischargeStatus || "NORMAL");
        let content = res.content;
        if (content && content.sections && !Array.isArray(content.sections)) {
          content.sections = Object.entries(content.sections).map(([k,v])=>({key:k,...v}));
        }
        setDocTemplate(content);
      } catch { toast.error("Failed to load discharge summary from server."); }
      setDocLoading(false);
    };
    load();
  }, [p]);

  if (!p) return null;
  const col = bColor(branchKey || p._branch, T);
  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.bg, color:T.white, fontSize:13, outline:"none", boxSizing:"border-box" };

  const handleSave = async () => {
    if (!docTemplate) return;
    try {
      await apiService.saveDynamicSummary(p.uhid, p.admNo, { summary_type:(p.dischargeStatus||"NORMAL").toUpperCase(), content:docTemplate });
      toast.success("Discharge summary saved!");
    } catch { toast.error("Failed to save."); }
  };
  const handlePrint = async () => { try { await printWithAuth(`${BASE_URL}/patients/${p.uhid}/admissions/${p.admNo}/dynamic-summary/print/`); } catch(e) { toast.error(e.message||"Print failed."); } };
  const updateSection = (idx, val) => { const s=[...docTemplate.sections]; s[idx]={...s[idx],value:val}; setDocTemplate({...docTemplate,sections:s}); };
  const updateVital = (idx,vKey,val) => { const s=[...docTemplate.sections]; s[idx]={...s[idx],value:{...s[idx].value,[vKey]:val}}; setDocTemplate({...docTemplate,sections:s}); };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:4500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:T.surface, borderRadius:16, width:"100%", maxWidth:860, maxHeight:"94vh", overflow:"hidden", display:"flex", flexDirection:"column", border:`1px solid ${T.border}`, boxShadow:"0 32px 100px rgba(0,0,0,.8)" }}>
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${T.border}`, background:T.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:T.white }}>Official Discharge Summary</div>
            <div style={{ fontSize:12, color:T.dim, marginTop:3, display:"flex", gap:8 }}>
              <span>{p.name}</span>·<span>{p.uhid}</span>
              <Pill color={col}>{bName(branchKey||p._branch)}</Pill>
              <Pill color={T.amber}>{p.dischargeStatus}</Pill>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {docTemplate && (<>
              <button onClick={handleSave} style={{ padding:"8px 16px", borderRadius:8, background:T.green, color:"#000", border:"none", fontWeight:800, fontSize:12, cursor:"pointer" }}>💾 Save</button>
              <button onClick={handlePrint} style={{ padding:"8px 16px", borderRadius:8, background:T.laxmi, color:"#000", border:"none", fontWeight:800, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Printer size={13}/> Print</button>
            </>)}
            <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", color:T.white, width:34, height:34, borderRadius:8, cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY:"auto", padding:24 }}>
          {docLoading ? (
            <div style={{ textAlign:"center", padding:60 }}><div style={{ fontSize:40, marginBottom:12 }}>📄</div><div style={{ color:T.dim, fontSize:14 }}>Loading discharge summary from server...</div></div>
          ) : !docTemplate ? (
            <div style={{ textAlign:"center", padding:60 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <div style={{ color:T.dim, fontSize:14 }}>Could not load the document template.</div>
              <button onClick={async()=>{ setDocLoading(true); try{ const res=await apiService.getDynamicSummary(p.uhid,p.admNo,p.dischargeStatus||"NORMAL"); let content=res.content; if(content?.sections&&!Array.isArray(content.sections)){content.sections=Object.entries(content.sections).map(([k,v])=>({key:k,...v}));} setDocTemplate(content); }catch{ toast.error("Still failing — check backend."); } setDocLoading(false); }} style={{ marginTop:14, padding:"9px 20px", borderRadius:8, background:T.laxmi, color:"#000", border:"none", fontWeight:800, cursor:"pointer" }}>Retry</button>
            </div>
          ) : (
            <>
              <div style={{ background:T.card, borderRadius:10, padding:"14px 18px", marginBottom:20, border:`1px solid ${col}30`, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {[["Patient",p.name],["UHID",p.uhid],["Age / Gender",`${p.age} / ${p.gender}`],["Doctor",p.doctor],
                  ["Ward",p.ward],["Bed",p.bed],["Admitted",fmt(p.admDate)],["Discharged",p.dischargeDate?fmt(p.dischargeDate):"—"],
                  ["Diagnosis",p.diagnosis],["Status",p.dischargeStatus],["Payment",p.paymentMode],["Type",p.admType]
                ].map(([k,v])=>(<div key={k}><div style={{ fontSize:10, color:T.dim, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{k}</div><div style={{ fontSize:12, color:T.white, fontWeight:600 }}>{v||"--"}</div></div>))}
              </div>
              {Array.isArray(docTemplate.sections) && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {docTemplate.sections.map((sec,idx)=>{
                    if(sec.type==="textarea") return <div key={sec.key||idx}><label style={{ fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>{sec.label}</label><textarea value={sec.value||""} onChange={e=>updateSection(idx,e.target.value)} rows={3} style={{ ...inp, resize:"vertical" }}/></div>;
                    if(sec.type==="text") return <div key={sec.key||idx}><label style={{ fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>{sec.label}</label><input type="text" value={sec.value||""} onChange={e=>updateSection(idx,e.target.value)} style={inp}/></div>;
                    if(sec.type==="vitals_grid") return <div key={sec.key||idx} style={{ background:T.bg, border:`1px solid ${T.border2}`, padding:16, borderRadius:8 }}><div style={{ fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", marginBottom:12 }}>{sec.label}</div><div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>{Object.entries(sec.value||{}).map(([vKey,vVal])=>(<div key={vKey}><div style={{ fontSize:10, color:T.dim, textTransform:"uppercase", marginBottom:4 }}>{vKey}</div><input type="text" value={vVal||""} onChange={e=>updateVital(idx,vKey,e.target.value)} style={{ width:"100%", padding:"8px", borderRadius:6, background:T.card, border:`1px solid ${T.border2}`, color:T.white, fontSize:12, outline:"none", boxSizing:"border-box" }}/></div>))}</div></div>;
                    return null;
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
