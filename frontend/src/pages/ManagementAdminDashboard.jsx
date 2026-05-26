import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import MedDrawer from "../components/MedDrawer";
import { apiService, BASE_URL } from "../services/apiService";
import { useTheme } from "../context/ThemeContext";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import UpdateRecordsPanel from "../components/admin/UpdateRecordsPanel";
import MedicalHistoryPage from "./MedicalHistoryPage";
import { Printer, ChevronDown, ChevronUp, FlaskConical, CreditCard } from "lucide-react";
import { SANGI_MEDICINE_MASTER } from "../data/medicineMaster";

// ── feature imports ───────────────────────────────────────────────────────────
import {
  BC, BRANCH_KEYS, BRANCH_KEY_TO_CODE, BRANCH_CODE_TO_KEY,
  EMPLOYEE_ID_PREFIXES, DEPT_OPTIONS, TASK_STATUS, TASK_PRIORITY,
  SUMMARY_TYPES, SUMMARY_LABELS, DISCHARGE_TYPES_CFG, DISCHARGE_SECTIONS_MAP,
  RADIOLOGY_REPORT_TYPES_LIST, PATHOLOGY_REPORT_TYPES_LIST,
  SUMMARY_META, TASK_STATUS_META, TASK_PRIORITY_META,
  DEPT_ICONS, DEPT_ACCENT_CYCLE, EMPLOYEE_ROLE_OPTIONS, DEPARTMENT_ROLE_MAP,
  TASK_ASSIGNABLE_ROLES, NAV, MGMT_SERVICE_MASTER, LAB_TEMPLATES,
} from "../features/mgmt/constants/mgmtConstants";
import {
  fmt, fmtDt, initials, safeLoad, safeSave, statusColor,
  isRadiologyType, getRoleForDepartment, normalizeSummaryType,
  resolveAdmNo, mapTaskFromApi, emptyPathReport, emptyRadReport,
  exportTasksXLSX, exportCSV,
} from "../features/mgmt/utils/mgmtUtils";
import { MGMT_CSS, BILL_PRINT_CSS } from "../features/mgmt/mgmtStyles";
import { useMgmtToast } from "../features/mgmt/hooks/useMgmtToast";

// ── views ─────────────────────────────────────────────────────────────────────
import HomeView        from "../features/mgmt/components/views/HomeView";
import PatientsView    from "../features/mgmt/components/views/PatientsView";
import DischargeView   from "../features/mgmt/components/views/DischargeView";
import TasksView       from "../features/mgmt/components/views/TasksView";
import DepartmentsView from "../features/mgmt/components/views/DepartmentsView";
import EmployeesView   from "../features/mgmt/components/views/EmployeesView";
import ProfileView     from "../features/mgmt/components/views/ProfileView";

// ── modals ────────────────────────────────────────────────────────────────────
import SummaryModal  from "../features/mgmt/components/modals/SummaryModal";
import TaskModal     from "../features/mgmt/components/modals/TaskModal";
import EmployeeModal from "../features/mgmt/components/modals/EmployeeModal";
import DeptModal     from "../features/mgmt/components/modals/DeptModal";

// ── inline components (small enough to stay here) ─────────────────────────────
function MedSearchDropdown({ medicineMaster, existingMedicines, onSelect, isDark, accent, placeholder="Search & add medicine..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const merged = [...SANGI_MEDICINE_MASTER, ...(medicineMaster||[]).filter(b =>
      !SANGI_MEDICINE_MASTER.some(s => s.name.toLowerCase() === (b.name||b.medicine_name||"").toLowerCase())
    )];
    if (!q) return merged.slice(0,30);
    return merged.filter(m => (m.name||m.medicine_name||"").toLowerCase().includes(q)).slice(0,30);
  }, [query, medicineMaster]);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isAlready  = name => (existingMedicines||[]).some(m => (m.name||"").toLowerCase() === (name||"").toLowerCase());
  const openDrop   = ()   => { if (inputRef.current) setRect(inputRef.current.getBoundingClientRect()); setOpen(true); };
  const handleSel  = med  => { const n=med.name||med.medicine_name||""; if (isAlready(n)) return; onSelect({...med,name:n}); setQuery(""); setOpen(false); };
  const handleAdd  = ()   => { if (!query.trim()||isAlready(query.trim())) return; onSelect({name:query.trim(),rate:0,expiry_date:""}); setQuery(""); setOpen(false); };

  return (
    <div ref={wrapRef} style={{position:"relative",width:"100%"}}>
      <input ref={inputRef} placeholder={placeholder} value={query}
        onChange={e=>{setQuery(e.target.value);openDrop();}} onFocus={openDrop}
        onKeyDown={e=>{if(e.key==="Enter")handleAdd();if(e.key==="Escape")setOpen(false);}}
        style={{width:"100%",padding:"10px 12px",borderRadius:8,boxSizing:"border-box",background:isDark?"#0f172a":"#fff",color:isDark?"#e2e8f0":"#0f172a",border:`1px solid ${isDark?"#1e293b":"#c7d5eb"}`,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
      {open && rect && filtered.length>0 && (
        <div style={{position:"fixed",top:rect.bottom+4,left:rect.left,width:rect.width,zIndex:99999,maxHeight:260,overflowY:"auto",borderRadius:10,boxShadow:"0 12px 32px rgba(0,0,0,0.35)",background:isDark?"#0f172a":"#ffffff",border:`1px solid ${isDark?"#334155":"#c7d5eb"}`}}>
          {filtered.map((m,idx)=>{
            const already=isAlready(m.name||m.medicine_name||"");
            return (
              <div key={idx} onClick={()=>!already&&handleSel(m)}
                style={{padding:"10px 14px",cursor:already?"default":"pointer",borderBottom:`1px solid ${isDark?"#1e293b":"#f1f5f9"}`,opacity:already?0.45:1}}
                onMouseEnter={e=>{if(!already)e.currentTarget.style.background=isDark?"#1e293b":"#f0f9ff";}}
                onMouseLeave={e=>{e.currentTarget.style.background="inherit";}}>
                <div style={{fontSize:13,fontWeight:600,color:isDark?"#e2e8f0":"#0f172a"}}>{already?"✓ ":"+ "}{m.name||m.medicine_name}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>₹{m.rate??m.price??0}{m.expiry_date?` · Exp: ${m.expiry_date}`:""}{already?" (already added)":""}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MgtPathologyReportCard({ rep, ri, patientName, isDark, accent, updRep, updTest, addTest, delTest, onRemove, onSave, onPrint, isSaving }) {
  return (
    <div style={{background:isDark?"#0b1120":"#ffffff",border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`,borderRadius:14,marginBottom:18,overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",color:"#fff",padding:"14px 20px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div style={{flex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.12)",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:"#93c5fd",marginBottom:8,textTransform:"uppercase"}}>🧪 PATHOLOGY</div>
          <input value={rep.reportName} placeholder="Report Name" onChange={e=>updRep(ri,"reportName",e.target.value)}
            style={{background:"transparent",border:"none",borderBottom:"1.5px solid rgba(255,255,255,.3)",outline:"none",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:700,width:"100%",paddingBottom:3}}/>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:10,fontSize:12,color:"rgba(255,255,255,.7)",alignItems:"center"}}>
            <span>👤 <strong style={{color:"#fff"}}>{patientName||"—"}</strong></span>
            <span>Dept:&nbsp;<select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.3)",outline:"none",color:"rgba(255,255,255,.85)",fontFamily:"inherit",fontSize:12}}>{PATHOLOGY_REPORT_TYPES_LIST.map(t=><option key={t} value={t} style={{background:"#1e3a5f"}}>{t}</option>)}</select></span>
            <span>Date:&nbsp;<input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.3)",outline:"none",color:"rgba(255,255,255,.7)",fontFamily:"inherit",fontSize:12}}/></span>
            <span>Ref.by:&nbsp;<input value={rep.orderedBy||""} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.3)",outline:"none",color:"rgba(255,255,255,.7)",fontFamily:"inherit",fontSize:12,width:120}}/></span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0,flexDirection:"column",alignItems:"flex-end"}}>
          <button onClick={onRemove} style={{background:"rgba(248,113,113,.15)",color:"#fca5a5",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>Remove</button>
          <div style={{display:"flex",gap:6}}>
            <button onClick={onPrint} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:"transparent",border:`1px solid ${accent}60`,color:accent,cursor:"pointer"}}><Printer size={11}/> Print</button>
            <button onClick={onSave} disabled={!!isSaving} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:700,background:isSaving?"#1e2a3a":`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:isSaving?"default":"pointer"}}>{isSaving?"Saving…":"💾 Save"}</button>
          </div>
          {rep.saved===true&&<span style={{fontSize:10,color:"#34d399",fontWeight:600}}>✓ Saved</span>}
          {rep.saved===false&&<span style={{fontSize:10,color:"#f59e0b",fontWeight:600}}>● Unsaved</span>}
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:isDark?"#0f172a":"#f8fafc"}}>
              {["Test Name","Value ✏️","Unit","Normal Range","Status",""].map((h,i)=><th key={i} style={{textAlign:i===1||i===4?"center":"left",padding:"9px 14px",fontSize:10,fontWeight:700,color:i===1?"#0369a1":isDark?"#475569":"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",borderBottom:`2px solid ${isDark?"#1a2540":"#e2e8f0"}`,background:i===1?"#f0f9ff":"inherit"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {!(rep.tests||[]).length&&<tr><td colSpan={6} style={{textAlign:"center",padding:"14px",color:"#64748b",fontStyle:"italic",fontSize:12}}>No test rows — click "+ Add Row".</td></tr>}
            {(rep.tests||[]).map((t,ti)=>(
              <tr key={t.id||ti} style={{borderBottom:`1px solid ${isDark?"#111827":"#f1f5f9"}`}}>
                <td style={{padding:"7px 14px"}}><input value={t.name||""} placeholder="e.g. Haemoglobin" onChange={e=>updTest(ri,ti,"name",e.target.value)} style={{background:isDark?"#0b1120":"#f8fafc",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:6,padding:"5px 9px",color:isDark?"#cbd5e1":"#334155",fontSize:12,fontFamily:"inherit",outline:"none",width:"100%"}}/></td>
                <td style={{padding:"7px 8px",background:"#f0f9ff",textAlign:"center"}}><input value={t.value||""} placeholder="—" onChange={e=>updTest(ri,ti,"value",e.target.value)} style={{background:"#fff",border:"2px solid #bae6fd",borderRadius:6,padding:"5px 7px",color:statusColor(t.status),fontSize:13,fontFamily:"inherit",fontWeight:700,outline:"none",width:"100%",textAlign:"center"}}/></td>
                <td style={{padding:"7px 8px"}}><input value={t.unit||""} onChange={e=>updTest(ri,ti,"unit",e.target.value)} style={{background:isDark?"#0b1120":"#f8fafc",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:6,padding:"5px 7px",color:isDark?"#94a3b8":"#64748b",fontSize:11,fontFamily:"inherit",outline:"none",width:"100%"}}/></td>
                <td style={{padding:"7px 14px"}}><input value={t.refRange||""} onChange={e=>updTest(ri,ti,"refRange",e.target.value)} style={{background:isDark?"#0b1120":"#f8fafc",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:6,padding:"5px 9px",color:isDark?"#94a3b8":"#64748b",fontSize:12,fontFamily:"inherit",outline:"none",width:"100%"}}/></td>
                <td style={{padding:"7px 8px",textAlign:"center"}}><select value={t.status||"Normal"} onChange={e=>updTest(ri,ti,"status",e.target.value)} style={{background:isDark?"#0b1120":"#f8fafc",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:6,padding:"4px",color:statusColor(t.status||"Normal"),fontSize:11,fontFamily:"inherit",outline:"none",fontWeight:700}}><option>Normal</option><option>High</option><option>Low</option></select></td>
                <td style={{padding:"7px 8px",textAlign:"center"}}><button onClick={()=>delTest(ri,ti)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:13}}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"8px 14px",borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}`}}>
        <button onClick={()=>addTest(ri)} style={{fontSize:11,color:accent,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>+ Add Row</button>
      </div>
      <div style={{padding:"10px 14px 14px",borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}`}}>
        <label style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4}}>Remarks / Interpretation</label>
        <input value={rep.remarks||""} placeholder="Remarks..." onChange={e=>updRep(ri,"remarks",e.target.value)}
          style={{width:"100%",background:isDark?"#080c18":"#fff",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:8,padding:"7px 11px",color:isDark?"#e2e8f0":"#0f172a",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
      </div>
    </div>
  );
}

function MgtRadiologyReportCard({ rep, ri, patientName, isDark, accent, updRep, onRemove, onSave, onPrint, isSaving }) {
  return (
    <div style={{background:isDark?"#0b1120":"#ffffff",border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`,borderRadius:14,marginBottom:18,overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,#064e3b 0%,#065f46 100%)",color:"#fff",padding:"14px 20px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div style={{flex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.12)",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:"#6ee7b7",marginBottom:8,textTransform:"uppercase"}}>🩻 RADIOLOGY</div>
          <input value={rep.reportName} placeholder="Radiology Report Name" onChange={e=>updRep(ri,"reportName",e.target.value)}
            style={{background:"transparent",border:"none",borderBottom:"1.5px solid rgba(255,255,255,.3)",outline:"none",color:"#fff",fontFamily:"inherit",fontSize:15,fontWeight:700,width:"100%",paddingBottom:3}}/>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:10,fontSize:12,color:"rgba(255,255,255,.7)",alignItems:"center"}}>
            <span>👤 <strong style={{color:"#fff"}}>{patientName||"—"}</strong></span>
            <span>Modality:&nbsp;<select value={rep.reportType} onChange={e=>updRep(ri,"reportType",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.3)",outline:"none",color:"rgba(255,255,255,.85)",fontFamily:"inherit",fontSize:12}}>{RADIOLOGY_REPORT_TYPES_LIST.map(t=><option key={t} value={t} style={{background:"#065f46"}}>{t}</option>)}</select></span>
            <span>Date:&nbsp;<input type="date" value={rep.date} onChange={e=>updRep(ri,"date",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.3)",outline:"none",color:"rgba(255,255,255,.7)",fontFamily:"inherit",fontSize:12}}/></span>
            <span>Ref.by:&nbsp;<input value={rep.orderedBy||""} placeholder="Doctor" onChange={e=>updRep(ri,"orderedBy",e.target.value)} style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.3)",outline:"none",color:"rgba(255,255,255,.7)",fontFamily:"inherit",fontSize:12,width:120}}/></span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0,flexDirection:"column",alignItems:"flex-end"}}>
          <button onClick={onRemove} style={{background:"rgba(248,113,113,.15)",color:"#fca5a5",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>Remove</button>
          <div style={{display:"flex",gap:6}}>
            <button onClick={onPrint} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:"transparent",border:`1px solid ${accent}60`,color:accent,cursor:"pointer"}}><Printer size={11}/> Print</button>
            <button onClick={onSave} disabled={!!isSaving} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:700,background:isSaving?"#1e2a3a":`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:isSaving?"default":"pointer"}}>{isSaving?"Saving…":"💾 Save"}</button>
          </div>
          {rep.saved===true&&<span style={{fontSize:10,color:"#34d399",fontWeight:600}}>✓ Saved</span>}
        </div>
      </div>
      <div style={{padding:"18px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>Findings / Report</label>
          <textarea value={rep.findings||""} placeholder="Describe radiological findings..." onChange={e=>updRep(ri,"findings",e.target.value)} rows={5}
            style={{width:"100%",background:isDark?"#080c18":"#f8fafc",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:8,padding:"9px 11px",color:isDark?"#e2e8f0":"#0f172a",fontSize:12,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6}}>Impression / Conclusion</label>
          <textarea value={rep.impression||""} placeholder="Clinical impression..." onChange={e=>updRep(ri,"impression",e.target.value)} rows={5}
            style={{width:"100%",background:isDark?"#080c18":"#f8fafc",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:8,padding:"9px 11px",color:isDark?"#e2e8f0":"#0f172a",fontSize:12,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{padding:"10px 20px 16px",borderTop:`1px solid ${isDark?"#111827":"#f1f5f9"}`}}>
        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4}}>Remarks</label>
        <input value={rep.remarks||""} placeholder="Additional remarks..." onChange={e=>updRep(ri,"remarks",e.target.value)}
          style={{width:"100%",background:isDark?"#080c18":"#fff",border:`1.5px solid ${isDark?"#1a2540":"#e2e8f0"}`,borderRadius:8,padding:"7px 11px",color:isDark?"#e2e8f0":"#0f172a",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
      </div>
    </div>
  );
}

function ManualReportAdder({ isDark, accent, onAdd }) {
  const [name, setName] = useState("");
  return (
    <div style={{display:"flex",gap:6,alignItems:"center"}}>
      <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&(onAdd(name.trim()),setName(""))} placeholder="Custom report name…"
        style={{background:isDark?"#080c18":"#ffffff",color:isDark?"#e2e8f0":"#1e293b",border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`,borderRadius:6,padding:"5px 10px",fontSize:11,outline:"none",width:180}}/>
      <button onClick={()=>name.trim()&&(onAdd(name.trim()),setName(""))} disabled={!name.trim()}
        style={{padding:"5px 11px",borderRadius:6,fontSize:11,fontWeight:700,background:name.trim()?`linear-gradient(135deg,${accent},${accent}cc)`:isDark?"#1e2a3a":"#e2e8f0",color:name.trim()?"#fff":"#64748b",border:"none",cursor:name.trim()?"pointer":"default",whiteSpace:"nowrap"}}>
        + Add
      </button>
    </div>
  );
}

// ── SHARED UI HELPERS (passed as props to views) ──────────────────────────────
function makeSharedUI(accent, isDark) {
  const Badge      = ({col,children}) => <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:`${col}20`,color:col,border:`1px solid ${col}40`}}>{children}</span>;
  const Pill       = ({col,bg,children,small}) => <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:small?"2px 8px":"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:bg||`${col}20`,color:col,border:`1px solid ${col}40`}}>{children}</span>;
  const ActionBtn  = ({col,onClick,children}) => <button style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:`${col}12`,color:col,border:`1px solid ${col}30`,cursor:"pointer"}} onClick={onClick}>{children}</button>;
  const Th         = ({children}) => <th style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",borderBottom:"1px solid var(--border)",background:"var(--surface-2)"}}>{children}</th>;
  const Td         = ({children,hi,mono,sm,style:s}) => <td style={{padding:"9px 14px",color:hi?"var(--text)":mono||sm?"var(--text-muted)":"var(--text-mid)",fontSize:sm?11:12,fontFamily:mono?"monospace":"inherit",...s}}>{children}</td>;
  const TableWrap  = ({heads,children}) => <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{heads.map(h=><Th key={h}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table></div>;
  const CardRow    = ({title,action}) => <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:10,borderBottom:"1px solid var(--border)"}}><div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{title}</div>{action}</div>;
  const EmptyState = ({icon,label,sub}) => <div style={{textAlign:"center",padding:"3rem",color:"#64748b"}}><div style={{fontSize:40,marginBottom:12}}>{icon}</div><div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>{label}</div>{sub&&<div style={{fontSize:12}}>{sub}</div>}</div>;
  const StatCard   = ({col,icon:Icon,label,val,sub,topBorder}) => <div style={{background:"var(--card)",border:`1px solid ${col}15`,borderRadius:12,padding:"16px 18px",borderTop:topBorder?`3px solid ${col}`:undefined}}>{Icon&&<Icon size={18} style={{color:col,marginBottom:8}}/>}{topBorder&&<div style={{fontSize:10,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{label}</div>}<div style={{fontSize:topBorder?26:22,fontWeight:800,color:col,marginBottom:4}}>{val}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{topBorder?sub:label}</div></div>;
  const ProgressBar = ({pct,col}) => <div style={{height:4,background:isDark?"#1e2a3a":"#dde8f5",borderRadius:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:4}}/></div>;
 const SummaryPill = ({type,p}) => { const actualType=type||p?.dischargeSummary?.dischargeStatus||""; const key=normalizeSummaryType(actualType); const m=SUMMARY_META[key]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}><span style={{width:6,height:6,borderRadius:"50%",background:m.color,display:"inline-block"}}/>{SUMMARY_LABELS[key]||actualType||"-"}</Pill>; };
  const StatusPill  = ({s}) => { const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}>{s}</Pill>; };
  const PriorityPill = ({p}) => { const m=TASK_PRIORITY_META[p]||{color:"#6b7280",bg:"#6b728018"}; return <Pill small col={m.color} bg={m.bg}>{p}</Pill>; };
  return { Badge, Pill, ActionBtn, Th, Td, TableWrap, CardRow, EmptyState, StatCard, ProgressBar, SummaryPill, StatusPill, PriorityPill };
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ManagementAdminDashboard({ currentUser, db, locId, onLogout }) {
  const { isDark } = useTheme();
  const { notif, toast } = useMgmtToast();

  const userBranchKey = BRANCH_CODE_TO_KEY[String(currentUser?.branch||"").toUpperCase()];
  const locBranchKey  = BRANCH_KEYS.includes(locId) ? locId : null;
  const homeBranch    = userBranchKey||locBranchKey||(currentUser?.locations?.find(l=>BRANCH_KEYS.includes(l))||"laxmi");
  const isOfficeAdmin = String(currentUser?.role||"").toLowerCase()==="office_admin";
  const isSuperAdmin  = String(currentUser?.role||"").toLowerCase()==="superadmin";

  const [viewBranch, setViewBranch]   = useState(homeBranch);
  const activeBranchCode              = BRANCH_KEY_TO_CODE[viewBranch]||"LNM";
  const bc                            = BC[viewBranch]||BC.laxmi;
  const accent                        = bc.accent;
  const ui                            = useMemo(()=>makeSharedUI(accent,isDark),[accent,isDark]);

  const [activeTab,   setActiveTab]   = useState("home");
  const [collapsed,   setCollapsed]   = useState(false);
  const [profileForm, setProfileForm] = useState({first_name:"",last_name:"",email:"",phone_number:"",emp_id:""});
  const [allPatients, setAllPatients] = useState({laxmi:[],raya:[]});
  const [employees,      setEmployees]      = useState([]);
  const [showEmpModal,   setShowEmpModal]   = useState(false);
  const [editEmpId,      setEditEmpId]      = useState(null);
  const [empForm,        setEmpForm]        = useState({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});
  const [empShowPass,    setEmpShowPass]    = useState(false);
  const [empShowConfirm, setEmpShowConfirm] = useState(false);
  const [empPassErr,     setEmpPassErr]     = useState("");
  const [tasks,          setTasks]          = useState([]);
  const [tasksLoading,   setTasksLoading]   = useState(false);
  const [showTaskModal,  setShowTaskModal]  = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [taskForm,       setTaskForm]       = useState({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhids:[],patientNames:[]});
  const [taskPatientSearch, setTaskPatientSearch] = useState("");
  const [taskReportFilter,  setTaskReportFilter]  = useState({period:"all",dept:"All",status:"All",empName:""});
  const [departments,   setDepartments]   = useState(()=>safeLoad("hms_mgmt_departments",[]));
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm,      setDeptForm]      = useState({name:"",description:"",head:""});
  const [selectedBillPatient, setSelectedBillPatient] = useState(null);
  const [billData,     setBillData]     = useState({});
  const [billServices, setBillServices] = useState({});
  const [newSvcRow,    setNewSvcRow]    = useState({date:"",cghs:"",desc:"",qty:1,rate:0});
  const [svcSearch,    setSvcSearch]    = useState("");
  const [svcSearchOpen, setSvcSearchOpen] = useState(false);
  const billPrintRef = useRef(null);
  const svcSearchRef = useRef(null);
  const [expandedRepPatient, setExpandedRepPatient] = useState(null);
  const [patientReports,     setPatientReports]     = useState({});
  const [repLoading,         setRepLoading]         = useState({});
  const [repSaving,          setRepSaving]          = useState({});
  const [repTemplateSearch,  setRepTemplateSearch]  = useState({});
  const [repFilter,          setRepFilter]          = useState({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryTypeCache, setSummaryTypeCache] = useState({});
  const [editSumPt,        setEditSumPt]        = useState(null);
  const [summaryType,      setSummaryType]      = useState("");
  const [summaryAdmNo,     setSummaryAdmNo]     = useState(null);
  const [editDisFields,    setEditDisFields]    = useState({});
  const [summarySaving,    setSummarySaving]    = useState(false);
  const [showViewModal,     setShowViewModal]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewPt,            setViewPt]            = useState(null);
  const [deletePt,          setDeletePt]          = useState(null);
  const [dischSumFilter,    setDischSumFilter]    = useState("All");
  const [medSearch,      setMedSearch]      = useState("");
  const [medicineMaster, setMedicineMaster] = useState([]);
  const [showMedModal,   setShowMedModal]   = useState(false);
  const [editMedPt,      setEditMedPt]      = useState(null);
  const [medHistData,    setMedHistData]    = useState({});
  const [selectedMedPt,  setSelectedMedPt]  = useState(null);

  // ── derived ───────────────────────────────────────────────────────────────
  const allPatientsFlat   = useMemo(()=>BRANCH_KEYS.flatMap(bk=>(allPatients[bk]||[]).map(p=>({...p,_branch:bk,_branchLabel:BC[bk].label}))),[allPatients]);
  const locationPatients = useMemo(
  () => {
    if (isOfficeAdmin) {
      return allPatients[viewBranch] || [];
    }
    return allPatients[viewBranch] || [];
  },
  [isOfficeAdmin, allPatients, viewBranch]
);
  const allAdmissions     = useMemo(()=>locationPatients.flatMap(p=>(p.admissions||[]).map(a=>({...a,patientName:p.patientName||p.name,uhid:p.uhid}))),[locationPatients]);
  const currentlyAdmitted = allAdmissions.filter(a=>!a.discharge?.dod).length;
  const discharged        = allAdmissions.filter(a=> a.discharge?.dod).length;
  const allDeptOptions    = [...DEPT_OPTIONS,...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>d.name)];
  const allPatientsForTask = useMemo(()=>allPatientsFlat.map(p=>({id:p.id,uhid:p.uhid,name:p.patientName||p.name,branch:p._branchLabel,status:(p.admissions?.[p.admissions.length-1]?.discharge?.dod)?"Discharged":"Admitted"})),[allPatientsFlat]);
  const filteredTaskPatients = useMemo(()=>{ if(!taskPatientSearch.trim()) return allPatientsForTask; const q=taskPatientSearch.toLowerCase(); return allPatientsForTask.filter(p=>p.name.toLowerCase().includes(q)||p.uhid.toLowerCase().includes(q)); },[allPatientsForTask,taskPatientSearch]);
  const taskAssignableEmployees = useMemo(()=>{ const expectedRole=getRoleForDepartment(taskForm.department); return employees.filter(e=>{ const role=String(e.role||"").toLowerCase(); if(!TASK_ASSIGNABLE_ROLES.has(role)) return false; return !expectedRole||role===expectedRole; }); },[employees,taskForm.department]);
  const currentDisplayName = `${profileForm.first_name||""} ${profileForm.last_name||""}`.trim()||currentUser?.name||"";
  const filteredTaskReport = useMemo(()=>{ const now=new Date(); return tasks.filter(t=>{ const created=new Date(t.createdAt); if(taskReportFilter.period==="today"&&created.toDateString()!==now.toDateString()) return false; if(taskReportFilter.period==="week"){const w=new Date(now);w.setDate(w.getDate()-7);if(created<w) return false;} if(taskReportFilter.period==="month"&&(created.getMonth()!==now.getMonth()||created.getFullYear()!==now.getFullYear())) return false; if(taskReportFilter.dept!=="All"&&t.department!==taskReportFilter.dept) return false; if(taskReportFilter.status!=="All"&&t.status!==taskReportFilter.status) return false; if(taskReportFilter.empName&&!t.assignedTo.toLowerCase().includes(taskReportFilter.empName.toLowerCase())) return false; return true; }); },[tasks,taskReportFilter]);

  // ── effects ───────────────────────────────────────────────────────────────
  useEffect(()=>{ if(!BRANCH_KEYS.includes(viewBranch)) setViewBranch(homeBranch); },[viewBranch,homeBranch]);
  useEffect(()=>{ if(db) setAllPatients(prev=>{ const merged={...db}; for(const bk of["laxmi","raya"]){ if(!Array.isArray(db[bk])) continue; merged[bk]=db[bk].map(dbPt=>{ const localPt=(prev[bk]||[]).find(p=>p.uhid===dbPt.uhid); return localPt?{...dbPt,medicines:localPt.medicines??dbPt.medicines}:dbPt; }); } return merged; }); },[db]);
  useEffect(()=>safeSave("hms_mgmt_departments",departments),[departments]);
  useEffect(()=>{ loadTasks(); const i=setInterval(loadTasks,60000); return()=>clearInterval(i); },[]);
  useEffect(()=>{ apiService.getMedicineMaster().then(l=>setMedicineMaster(Array.isArray(l)&&l.length?l:[])).catch(()=>setMedicineMaster([])); },[]);
  useEffect(()=>{ const load=async()=>{ try{ const users=await apiService.getUsers(); setEmployees(users.map(u=>({id:u.id,empId:u.emp_id||"—",username:u.username,fullName:`${u.first_name} ${u.last_name}`.trim(),name:`${u.first_name} ${u.last_name}`.trim()||u.username,email:u.email,phone:u.phone_number,role:u.role,dept:u.role.replaceAll("_"," ").replace(/\b\w/g,ch=>ch.toUpperCase()),status:u.is_active?"Active":"Inactive"}))); }catch{} }; load(); },[]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async()=>{ setTasksLoading(true); try{ const d=await apiService.getTasks(); const l=Array.isArray(d)?d:(d?.results||[]); setTasks(l.map(mapTaskFromApi)); }catch{} finally{setTasksLoading(false);} },[]);
  const updatePatient = useCallback((branchKey,uhid,updater)=>setAllPatients(prev=>({...prev,[branchKey]:(prev[branchKey]||[]).map(p=>p.uhid===uhid?updater(p):p)})),[]);
  const getEmployeeBranchCode = useCallback(()=>{ if(isOfficeAdmin) return "ALL"; if(isSuperAdmin) return activeBranchCode; return String(currentUser?.branch||activeBranchCode||"LNM").toUpperCase(); },[isOfficeAdmin,isSuperAdmin,activeBranchCode,currentUser?.branch]);
  const buildEmployeeId = useCallback(branchCode=>{ const prefix=EMPLOYEE_ID_PREFIXES[branchCode]||"EMP"; const hi=employees.reduce((max,e)=>{ const c=String(e.empId||"").trim().toUpperCase(); if(!c.startsWith(prefix)) return max; const n=Number(c.slice(prefix.length)); return Number.isInteger(n)?Math.max(max,n):max; },0); return `${prefix}${String(hi+1).padStart(4,"0")}`; },[employees]);
  const getPreferredAdmission = p => p.admissions?.[0]||{};
  const getPreferredDischarge = p => ({...(p.dischargeSummary||{}),...(getPreferredAdmission(p).discharge||{})});

  // ── medicine helpers ──────────────────────────────────────────────────────
  const openMedEditor = useCallback(p=>{ const copy=JSON.parse(JSON.stringify(p)); copy.medicines=Array.isArray(copy.medicines)?copy.medicines:[]; setEditMedPt(copy); setShowMedModal(true); },[]);
  const addMedToPatientInline = useCallback((branchKey,p,med)=>{ const already=(p.medicines||[]).some(m=>(m.name||"").toLowerCase()===(med.name||"").toLowerCase()); if(already){toast(`"${med.name}" already added`,"err");return;} updatePatient(branchKey,p.uhid,pt=>({...pt,medicines:[...(pt.medicines||[]),{id:Date.now(),name:med.name||med.medicine_name||"",qty:1,rate:parseFloat(med.rate??med.price??0),batchNo:med.batch_no||med.batchNo||"",expiryDate:med.expiry_date||med.expiryDate||""}]})); toast(`"${med.name}" added`); },[updatePatient]);
  const addMedFromHistoryPill = useCallback((branchKey,p,medName)=>{ const already=(p.medicines||[]).some(m=>(m.name||"").toLowerCase()===medName.toLowerCase()); if(already){toast(`"${medName}" already in list`,"err");return;} const normName=n=>String(n||"").toLowerCase().replace(/[^a-z0-9]/g,""); const normMed=normName(medName); const masterMed=(medicineMaster||[]).find(m=>normName(m.name)===normMed)||(medicineMaster||[]).find(m=>normName(m.name).includes(normMed.slice(0,8))); updatePatient(branchKey,p.uhid,pt=>({...pt,medicines:[...(pt.medicines||[]),{id:Date.now(),name:medName,qty:1,rate:parseFloat(masterMed?.rate??masterMed?.price??0),batchNo:masterMed?.batch_no||"",expiryDate:masterMed?.expiry_date||""}]})); toast(`Added "${medName}"`); },[updatePatient,medicineMaster]);
  const updateMed  = (idx,field,val)=>setEditMedPt(prev=>{ if(!prev) return prev; const m=[...(prev.medicines||[])]; m[idx]={...m[idx],[field]:field==="name"?val:(parseFloat(val)||0)}; return{...prev,medicines:m}; });
  const addMedRow  = ()=>setEditMedPt(prev=>prev&&({...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}));
  const delMedRow  = idx=>setEditMedPt(prev=>prev&&({...prev,medicines:(prev.medicines||[]).filter((_,i)=>i!==idx)}));
  const addMedFromDropdownToDrawer = useCallback(med=>setEditMedPt(prev=>{ if(!prev) return prev; const already=(prev.medicines||[]).some(m=>(m.name||"").toLowerCase()===(med.name||"").toLowerCase()); if(already) return prev; return{...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:med.name,qty:1,rate:parseFloat(med.rate??med.price??0),batchNo:med.batch_no||"",expiryDate:med.expiry_date||""}]}; }),[]);
  const saveMeds   = ()=>{ if(!editMedPt) return; updatePatient(editMedPt._branch||viewBranch,editMedPt.uhid,p=>({...p,medicines:editMedPt.medicines||[]})); toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null); };

  // ── discharge summary helpers ─────────────────────────────────────────────
  const openSummaryEditor = async p => {
    setEditSumPt(p);
    const adm = p.admissions?.[0] || {};
    const d   = adm.discharge || {};
    const mh  = adm.medicalHistory || p.medicalHistory || {};
    let ds    = p.dischargeSummary || {};

    // Determine discharge type from local data first
    const dischargeStatus = d.dischargeStatus || ds.dischargeStatus || ds.summary_type || ds.type || "";
    let initialType = normalizeSummaryType(dischargeStatus);

    // Merged fields — start with local data as fallback
    let merged = {
      doa:                 d.doa || adm.dateTime?.slice(0,10) || "",
      dod:                 d.dod || "",
      expectedDod:         d.expectedDod || "",
      ward:                d.wardName || d.ward || "",
      bed:                 d.bedNo   || d.bed  || "",
      doctor:              d.doctorName || ds.doctorName || mh.treatingDoctor || "",
      summary_type:        initialType,
      diagnosis:           ds.diagnosis || d.diagnosis || mh.diagnosis || "",
      chiefComplaints:     ds.chiefComplaints || mh.chiefComplaints || "",
      historyOfIllness:    ds.historyOfIllness || mh.historyOfIllness || "",
      investigations:      ds.investigations || mh.investigations || "",
      treatmentGiven:      ds.treatmentGiven || ds.treatment || mh.treatmentAdvised || "",
      conditionAtDischarge:ds.conditionAtDischarge || "",
      adviceOnDischarge:   ds.adviceOnDischarge || mh.adviceOnDischarge || "",
      followUp:            ds.followUp || mh.followUp || "",
      reasonForLama:       ds.reasonForLama || "",
      lamaDeclaration:     ds.lamaDeclaration || "",
      reasonForDopr:       ds.reasonForDopr || "",
      referredTo:          ds.referredTo || "",
      notes:               ds.notes || mh.notes || "",
      bp:    d.bp    || mh.bp    || "",
      pr:    d.pr    || mh.pr    || "",
      spo2:  d.spo2  || mh.spo2  || "",
      temp:  d.temp  || mh.temp  || "",
      chest: d.chest || mh.chest || "",
      cvs:   d.cvs   || mh.cvs   || "",
      cns:   d.cns   || mh.cns   || "",
      pa:    d.pa    || mh.pa    || "",
    };

    // Fetch saved summary from API and overlay on top of local fallbacks
    try {
      const admNo = String(resolveAdmNo(p));
      const data  = await apiService.getDynamicSummary(p.uhid, admNo, initialType || "NORMAL").catch(() => null);
      if (data) {
        // Only override type from API if we have no local type (prevents LAMA response overwriting known DOPR)
        const apiType = data.summary_type ? normalizeSummaryType(data.summary_type === "REFERRED" ? "REFER" : data.summary_type) : null;
        if (apiType && !initialType) {
          initialType = apiType;
        }
        const c = data.content || {};
        // Header fields saved in content
        if (c.doa)         merged.doa         = c.doa.slice(0,10);
        if (c.dod)         merged.dod         = c.dod.slice(0,10);
        if (c.expectedDod) merged.expectedDod = c.expectedDod.slice(0,10);
        if (c.ward)        merged.ward        = c.ward;
        if (c.bed)         merged.bed         = c.bed;
        if (c.doctor)      merged.doctor      = c.doctor;
        if (c.diagnosis)   merged.diagnosis   = c.diagnosis;
        // Dynamic sections
        const sections = Array.isArray(c.sections)
          ? c.sections
          : c.sections && typeof c.sections === "object"
            ? Object.entries(c.sections).map(([k,v]) => ({key:k,...v}))
            : [];
        sections.forEach(s => {
          if (s.type === "vitals_grid" && s.value && typeof s.value === "object") {
            merged.bp    = s.value.bp    || merged.bp;
            merged.pr    = s.value.pulse || merged.pr;
            merged.spo2  = s.value.spo2  || merged.spo2;
            merged.temp  = s.value.temp  || merged.temp;
            merged.chest = s.value.chest || merged.chest;
            merged.cvs   = s.value.cvs   || merged.cvs;
            merged.cns   = s.value.cns   || merged.cns;
            merged.pa    = s.value.abd   || merged.pa;
          } else if (s.key && s.value !== undefined) {
            merged[s.key] = s.value || merged[s.key] || "";
          }
        });
      }
    } catch {}

    setSummaryAdmNo(resolveAdmNo(p));
    setEditDisFields(merged);
    p.summaryType = initialType;
    setSummaryTypeCache(prev => ({...prev, [p.uhid]: initialType}));
    setSummaryType(initialType);
    setTimeout(() => setShowSummaryModal(true), 0);
  };

  const saveSummary = async () => {
    if (!editSumPt) return;
    setSummarySaving(true);
    try {
      const admNo    = summaryAdmNo || resolveAdmNo(editSumPt);
      const sections = (DISCHARGE_SECTIONS_MAP[summaryType] || DISCHARGE_SECTIONS_MAP.NORMAL).map(sec => ({
        key:   sec.key,
        label: sec.label,
        type:  sec.type || "text",
        value: sec.type === "vitals_grid"
          ? { bp: editDisFields.bp || "", pulse: editDisFields.pr || "", spo2: editDisFields.spo2 || "", temp: editDisFields.temp || "", chest: editDisFields.chest || "", cvs: editDisFields.cvs || "", cns: editDisFields.cns || "", abd: editDisFields.pa || "" }
          : (editDisFields[sec.key] || ""),
      }));

      // POST to correct endpoint: /patients/{uhid}/admissions/{admNo}/dynamic-summary/
      await apiService.saveDynamicSummary(editSumPt.uhid, admNo, {
        summary_type: summaryType,
        content: {
          summary_type: summaryType,
          doa:          editDisFields.doa         || "",
          dod:          editDisFields.dod         || "",
          expectedDod:  editDisFields.expectedDod || "",
          ward:         editDisFields.ward        || "",
          bed:          editDisFields.bed         || "",
          doctor:       editDisFields.doctor      || "",
          diagnosis:    editDisFields.diagnosis   || "",
          sections,
        },
      });

      // Update local state so UI reflects the save immediately
      updatePatient(editSumPt._branch || viewBranch, editSumPt.uhid, p => ({
        ...p,
        dischargeSummary: {
          ...(p.dischargeSummary || {}),
          type:         summaryType,
          summary_type: summaryType,
          dischargeStatus: summaryType,
          diagnosis:    editDisFields.diagnosis    || "",
          treatment:    editDisFields.treatmentGiven || "",
          followUp:     editDisFields.followUp     || "",
          notes:        editDisFields.notes        || "",
          doctorName:   editDisFields.doctor       || "",
          ward:         editDisFields.ward         || "",
          bed:          editDisFields.bed          || "",
          doa:          editDisFields.doa          || "",
          dod:          editDisFields.dod          || "",
        },
      }));

      setSummaryTypeCache(prev => ({...prev, [editSumPt.uhid]: summaryType}));
      toast("Discharge summary saved");
      setShowSummaryModal(false);
      setEditSumPt(null);
    } catch { toast("Failed to save discharge summary", "err"); }
    finally { setSummarySaving(false); }
  };

  const handlePrintSummary = p => {
    if (!p?.uhid) return;
    const admNo    = resolveAdmNo(p);
    // Resolve the discharge type — check every possible location it could be stored
    const rawType  = p.summaryType
      || summaryTypeCache?.[p.uhid]
      || p.dischargeSummary?.summary_type
      || p.dischargeSummary?.dischargeStatus
      || p.dischargeSummary?.type
      || p.admissions?.[0]?.discharge?.dischargeStatus
      || "NORMAL";
    const printType = normalizeSummaryType(rawType === "REFERRED" ? "REFER" : rawType) || "NORMAL";
    window.open(`${BASE_URL}/patients/${p.uhid}/admissions/${admNo}/dynamic-summary/print/?type=${encodeURIComponent(printType)}`, "_blank");
  };

  // ── reports helpers ───────────────────────────────────────────────────────
  const fetchPatientReports = async p => {
    const uhid=p.uhid; const admNo=String(resolveAdmNo(p));
    setRepLoading(prev=>({...prev,[uhid]:true}));
    try {
      const repMap={};
      try { const fetched=await apiService.getLabReports(uhid,admNo); (Array.isArray(fetched)?fetched:fetched.reports||[]).forEach(rep=>{ const name=rep.report_name||rep.reportName||rep.name||"Report"; repMap[name]={id:rep.id||Date.now(),reportName:name,report_date:rep.report_date||rep.date||new Date().toISOString().slice(0,10),reportType:rep.report_type||rep.reportType||"Haematology",orderedBy:rep.ordered_by||rep.orderedBy||"",remarks:rep.remarks||"",findings:rep.findings||"",impression:rep.impression||"",tests:(rep.table_data||rep.tests||[]).map(t=>({id:Date.now()+Math.random(),name:t.test||t.name||"",value:t.result||t.value||"",unit:t.unit||"",refRange:t.ref||t.refRange||"",status:t.status||"Normal"})),saved:true}; }); } catch{}
      try { const tplData=await apiService.getLabReportTemplates(uhid,admNo); const suggested=Array.isArray(tplData)?tplData:tplData.suggested_reports||tplData.templates||tplData.suggested||[]; suggested.forEach(tpl=>{ const tplName=tpl.reportName||tpl.name||tpl.report_name||tpl; if(repMap[tplName]) return; repMap[tplName]={id:tpl.id||Date.now()+Math.random(),reportName:tplName,report_date:tpl.date||new Date().toISOString().slice(0,10),reportType:tpl.reportType||tpl.report_type||"Haematology",orderedBy:tpl.orderedBy||tpl.ordered_by||"",remarks:tpl.remarks||"",findings:tpl.findings||"",impression:tpl.impression||"",tests:(tpl.tests||[]).map(t=>({id:Date.now()+Math.random(),name:t.name||"",value:t.value||"",unit:t.unit||"",refRange:t.refRange||t.ref||"",status:t.status||"Normal"})),saved:false}; }); } catch{}
      setPatientReports(prev=>({...prev,[uhid]:repMap}));
    } catch{}
    setRepLoading(prev=>({...prev,[uhid]:false}));
  };
  const toggleRepPatient = p => { if(expandedRepPatient===p.uhid){setExpandedRepPatient(null);return;} setExpandedRepPatient(p.uhid); if(!patientReports[p.uhid]) fetchPatientReports(p); };
  const addTemplateReport = (p,templateName) => { const t=LAB_TEMPLATES[templateName]; if(!t) return; setPatientReports(prev=>{ const existing=prev[p.uhid]||{}; if(existing[templateName]) return prev; const tests=t.tests.map(tt=>({id:Date.now()+Math.random(),name:tt.name||"",value:"",unit:tt.unit||"",refRange:tt.refRange||"",status:"Normal"})); return{...prev,[p.uhid]:{...existing,[templateName]:{id:Date.now(),reportName:templateName,report_date:new Date().toISOString().slice(0,10),reportType:"Haematology",orderedBy:"",amount:0,remarks:t.defaultRemarks||"",findings:"",impression:"",tests,saved:false}}}; }); };
  const updRepField = (uhid,rn,field,val) => setPatientReports(prev=>{ const rm={...prev[uhid]}; rm[rn]={...rm[rn],[field]:val,saved:false}; return{...prev,[uhid]:rm}; });
  const updRepTest  = (uhid,rn,ti,field,val) => setPatientReports(prev=>{ const rm={...prev[uhid]}; const rep={...rm[rn]}; const tests=[...(rep.tests||[])]; tests[ti]={...tests[ti],[field]:val}; rep.tests=tests; rep.saved=false; rm[rn]=rep; return{...prev,[uhid]:rm}; });
  const addRepTest  = (uhid,rn) => setPatientReports(prev=>{ const rm={...prev[uhid]}; const rep={...rm[rn]}; rep.tests=[...(rep.tests||[]),{id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}]; rep.saved=false; rm[rn]=rep; return{...prev,[uhid]:rm}; });
  const delRepTest  = (uhid,rn,ti) => setPatientReports(prev=>{ const rm={...prev[uhid]}; const rep={...rm[rn]}; rep.tests=(rep.tests||[]).filter((_,i)=>i!==ti); rep.saved=false; rm[rn]=rep; return{...prev,[uhid]:rm}; });
  const delRepReport = (uhid,rn) => setPatientReports(prev=>{ const rm={...(prev[uhid]||{})}; delete rm[rn]; return{...prev,[uhid]:rm}; });
  const saveRepReport = async (p,rn) => { const uhid=p.uhid; const admNo=String(resolveAdmNo(p)); const rep=patientReports[uhid]?.[rn]; if(!rep) return; const key=`${uhid}-${rn}`; setRepSaving(prev=>({...prev,[key]:true})); try{ await apiService.saveLabReportsBulk(uhid,admNo,[{report_name:rn,report_type:rep.reportType||"Haematology",report_date:rep.report_date||new Date().toISOString().slice(0,10),findings:rep.findings||"",impression:rep.impression||"",remarks:rep.remarks||"",table_data:(rep.tests||[]).map(t=>({test:t.name,result:t.value||"",unit:t.unit||"",ref:t.refRange||"",status:t.status||"Normal"}))}]); setPatientReports(prev=>({...prev,[uhid]:{...prev[uhid],[rn]:{...prev[uhid][rn],saved:true}}})); toast(`${rn} saved`); }catch{ toast(`Failed to save ${rn}`,"err"); } setRepSaving(prev=>({...prev,[key]:false})); };
  const printRepReport = (p,rn) => window.open(`${BASE_URL}/patients/${p.uhid}/admissions/${String(resolveAdmNo(p))}/lab-reports/print/?report=${encodeURIComponent(rn)}`,"_blank");

  // ── billing helpers ───────────────────────────────────────────────────────
  const getBillKey   = (uhid,admNo) => `${uhid}-${admNo}`;
  const initBillData = (p,adm) => { const key=getBillKey(p.uhid,adm.admNo); if(billData[key]) return billData[key]; const d=adm.discharge||{}; return{patientName:p.patientName||p.name||"",guardianName:p.guardianName||"",uhid:p.uhid||"",ageYY:p.ageYY||p.age||"",gender:p.gender||"",address:p.address||"",phone:p.phone||"",cardNo:p.cardNo||adm.billing?.cardNo||"",admNo:adm.admNo||"",admType:adm.admType||"General",billDate:new Date().toISOString().slice(0,10),doa:d.doa||adm.dateTime?.slice(0,10)||"",dod:d.dod||"",wardName:d.wardName||"",bedNo:d.bedNo||"",doctorName:d.doctorName||"",panel:adm.billing?.panel||"CASH",paymentMode:adm.billing?.paymentMode||"Cash",claimId:adm.billing?.claimId||"",advance:parseFloat(adm.billing?.advance)||0,discount:parseFloat(adm.billing?.discount)||0,status:p.dischargeSummary?.summary_type || p.dischargeSummary?.summaryType || p.dischargeSummary?.type || "",contactNo:p.phone||""}; };
  const setBillField = (uhid,admNo,field,val) => { const key=getBillKey(uhid,admNo); setBillData(prev=>({...prev,[key]:{...(prev[key]||{}),[field]:val}})); };
  const getServices  = (uhid,admNo) => billServices[getBillKey(uhid,admNo)]||[];
  const fetchBillServices = async (p,adm) => { const key=getBillKey(p.uhid,adm.admNo); if(billServices[key]) return; const admServices=adm.services||[]; if(admServices.length){const services=admServices.map((s,i)=>({id:s.id||Date.now()+i,date:s.svcDate||new Date().toISOString().slice(0,10),cghs:s.svcCode||s.code||"",desc:s.svcName||s.title||s.name||"",qty:parseFloat(s.svcQty||s.qty)||1,rate:parseFloat(s.svcRate||s.rate)||0}));setBillServices(prev=>({...prev,[key]:services}));const billing=adm.billing||{};setBillData(prev=>({...prev,[key]:{...initBillData(p,adm),discount:parseFloat(billing.discount||0),advance:parseFloat(billing.advance||0),panel:billing.panel||"CASH",paymentMode:billing.paymentMode||"Cash",claimId:billing.claimId||"",cardNo:billing.cardNo||""}}));}else{const medServices=(p.medicines||[]).map((m,i)=>({id:Date.now()+i,date:new Date().toISOString().slice(0,10),cghs:"",desc:m.name,qty:m.qty||1,rate:m.rate||0}));setBillServices(prev=>({...prev,[key]:medServices}));} };
  const addService    = (uhid,admNo) => { if(!newSvcRow.desc) return; const key=getBillKey(uhid,admNo); setBillServices(prev=>({...prev,[key]:[...(prev[key]||[]),{id:Date.now(),...newSvcRow}]})); setNewSvcRow({date:"",cghs:"",desc:"",qty:1,rate:0}); };
  const updateService = (uhid,admNo,idx,field,val) => { const key=getBillKey(uhid,admNo); setBillServices(prev=>{ const list=[...(prev[key]||[])]; list[idx]={...list[idx],[field]:field==="qty"||field==="rate"?parseFloat(val)||0:val}; return{...prev,[key]:list}; }); };
  const removeService = (uhid,admNo,idx) => { const key=getBillKey(uhid,admNo); setBillServices(prev=>({...prev,[key]:(prev[key]||[]).filter((_,i)=>i!==idx)})); };
  const calcBillTotals = (uhid,admNo,bd) => { const services=getServices(uhid,admNo); const gross=services.reduce((s,svc)=>s+(parseFloat(svc.qty)||0)*(parseFloat(svc.rate)||0),0); const disc=parseFloat(bd?.discount)||0; const adv=parseFloat(bd?.advance)||0; return{gross,disc,adv,net:gross-disc-adv}; };
  const printBill = (uhid,admNo) => apiService.printBill(uhid,admNo);

  // ── task helpers ──────────────────────────────────────────────────────────
  const openNewTask  = ()=>{ setEditTask(null);setTaskForm({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhids:[],patientNames:[]});setTaskPatientSearch("");setShowTaskModal(true); };
  const openEditTask = t=>{ setEditTask(t);setTaskForm({title:t.title,description:t.description||"",assignedToId:t.assignedToId?String(t.assignedToId):"",department:t.department,priority:t.priority,status:t.status,dueDate:t.dueDate||"",patientUhids:t.patientUhids||(t.patientUhid?[t.patientUhid]:[]),patientNames:t.patientNames||(t.patientName?[t.patientName]:[])});setTaskPatientSearch("");setShowTaskModal(true); };
  const toggleTaskPatient = p=>{ const isSel=taskForm.patientUhids.includes(p.uhid); if(isSel){setTaskForm(f=>({...f,patientUhids:f.patientUhids.filter(u=>u!==p.uhid),patientNames:f.patientNames.filter((_,i)=>f.patientUhids[i]!==p.uhid)}));}else if(taskForm.patientUhids.length<8){setTaskForm(f=>({...f,patientUhids:[...f.patientUhids,p.uhid],patientNames:[...f.patientNames,p.name]}));}else{toast("Maximum 8 patients allowed","err");} };
  const saveTask = async()=>{ if(!taskForm.title||!taskForm.assignedToId){toast("Title and Assigned To are required","err");return;} const assignedEmployee=taskAssignableEmployees.find(e=>String(e.id)===String(taskForm.assignedToId)); if(!assignedEmployee){toast("Select a valid employee","err");return;} const linkedPatientIds=taskForm.patientUhids.map(uhid=>allPatientsForTask.find(p=>p.uhid===uhid)?.id).filter(Boolean); const payload={title:taskForm.title,description:taskForm.description,assigned_to:Number(taskForm.assignedToId),department:taskForm.department,priority:taskForm.priority,status:taskForm.status,due_date:taskForm.dueDate?`${taskForm.dueDate}T23:59:00Z`:null,patient:linkedPatientIds[0]||null}; try{ if(editTask){const u=await apiService.updateTask(editTask.id,payload);setTasks(prev=>prev.map(t=>t.id===editTask.id?mapTaskFromApi(u):t));toast("Task updated");}else{if(linkedPatientIds.length>1){await apiService.bulkAssignTasks({department:taskForm.department,assign_to:Number(taskForm.assignedToId),patient_ids:linkedPatientIds,title:taskForm.title,priority:taskForm.priority,due_date:taskForm.dueDate?`${taskForm.dueDate}T23:59:00Z`:null,notes:taskForm.description||""});const r=await apiService.getTasks();setTasks((r||[]).map(mapTaskFromApi));toast(`Assigned ${linkedPatientIds.length} patients`);}else{await apiService.createTask(payload);await loadTasks();toast("Task assigned");}} setShowTaskModal(false);setEditTask(null); }catch(e){const ae=e.response?.data||{};toast(ae?.patient?.[0]||ae?.assigned_to?.[0]||ae?.detail||"Failed to save task","err");} };
  const deleteTask      = async id=>{ try{await apiService.deleteTask(id);setTasks(prev=>prev.filter(t=>t.id!==id));toast("Task deleted");}catch{toast("Failed to delete task","err");} };
  const updateTaskStatus= async(id,status)=>{ try{const u=await apiService.updateTask(id,{status});setTasks(prev=>prev.map(t=>t.id===id?mapTaskFromApi(u):t));toast(`Task marked ${status}`);}catch{toast("Failed to update task","err");} };

  // ── dept / employee helpers ───────────────────────────────────────────────
  const saveDepartment   = ()=>{ if(!deptForm.name){toast("Department name required","err");return;} setDepartments(prev=>[...prev,{id:`DEPT-${Date.now()}`,...deptForm,createdAt:new Date().toISOString(),memberCount:0}]);setShowDeptModal(false);setDeptForm({name:"",description:"",head:""});toast("Department created"); };
  const openEditEmployee = emp=>{ setEditEmpId(emp.id);setEmpForm({fullName:emp.fullName||emp.name,username:emp.username,empId:emp.empId,dept:emp.dept||"HOD",email:emp.email,phone:emp.phone,role:emp.role,password:"",confirmPassword:""});setEmpPassErr("");setShowEmpModal(true); };
  const handleToggleActive = async(emp,index)=>{ const isActive=emp.status!=="Inactive"; try{await apiService.updateUser(emp.id,{is_active:!isActive});setEmployees(prev=>prev.map((e,ei)=>ei===index?{...e,status:isActive?"Inactive":"Active"}:e));toast(`Employee ${isActive?"deactivated":"activated"}`);}catch{toast("Failed to update employee status.","err");} };
  const saveEmployee = async()=>{ if(!empForm.fullName||!empForm.username||!empForm.email||!empForm.phone||!empForm.dept){setEmpPassErr("Please fill all required fields");return;} if(empForm.password!==empForm.confirmPassword){setEmpPassErr("Passwords do not match");return;} if(!editEmpId&&!empForm.password){setEmpPassErr("Password is required for new employees");return;} try{ const[firstName,...lastNameArr]=empForm.fullName.split(" "); const mappedRole=empForm.role||DEPARTMENT_ROLE_MAP[empForm.dept]||"receptionist"; const branchCode=getEmployeeBranchCode(); const payload={username:empForm.username,email:empForm.email,first_name:firstName,last_name:lastNameArr.join(" ")||"",emp_id:empForm.empId||buildEmployeeId(branchCode),phone_number:empForm.phone,role:mappedRole,branch:branchCode}; if(empForm.password){payload.password=empForm.password;payload.confirm_password=empForm.confirmPassword;} if(editEmpId){await apiService.updateUser(editEmpId,payload);toast("Employee updated!");}else{await apiService.createUser(payload);toast("Employee created!");} const users=await apiService.getUsers(); setEmployees(users.map(u=>({id:u.id,empId:u.emp_id||"—",username:u.username,fullName:`${u.first_name} ${u.last_name}`.trim(),email:u.email,phone:u.phone_number,role:u.role,dept:u.role.replaceAll("_"," ").replace(/\b\w/g,ch=>ch.toUpperCase()),status:u.is_active?"Active":"Inactive"}))); setShowEmpModal(false);setEditEmpId(null);setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""}); }catch(e){const ae=e.response?.data||{};setEmpPassErr(ae.detail||ae.error||ae.username?.[0]||ae.emp_id?.[0]||"Failed to save user.");} };
  const saveMyProfile = async()=>{ try{ const payload={first_name:profileForm.first_name,last_name:profileForm.last_name,email:profileForm.email,phone_number:profileForm.phone_number,emp_id:profileForm.emp_id}; const updated=await apiService.updateMyProfile(payload); setProfileForm({first_name:updated.first_name||"",last_name:updated.last_name||"",email:updated.email||"",phone_number:updated.phone_number||"",emp_id:updated.emp_id||""}); toast("Profile updated"); }catch(e){const ae=e.response?.data||{};toast(ae.email?.[0]||ae.detail||"Failed to update profile","err");} };
  const openViewModal = p=>{ setViewPt(p); setShowViewModal(true); };
  const confirmDelete = p=>{ setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary = ()=>{ updatePatient(deletePt?._branch||viewBranch,deletePt.uhid,p=>({...p,dischargeSummary:{type:"NORMAL",summary_type: summaryType,
diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""}})); toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null); };

  // ── page renderers ────────────────────────────────────────────────────────
  const sharedProps = { accent, isDark, fmtDt, initials, normalizeSummaryType, summaryTypeCache, SUMMARY_META, SUMMARY_LABELS, ...ui };

  const renderMedicines = () => {
    const filtered=locationPatients.filter(p=>!medSearch||((p.patientName||p.name||"").toLowerCase().includes(medSearch.toLowerCase())||(p.uhid||"").toLowerCase().includes(medSearch.toLowerCase())));
    return (
      <div>
        <div style={{marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14,fontWeight:700}}>Medicines — {bc.label}</div>
          <input className="hms-inp" placeholder="Search patient…" style={{maxWidth:320}} value={medSearch} onChange={e=>setMedSearch(e.target.value)}/>
        </div>
        {!locationPatients.length&&<div className="hms-card hms-empty">No patients for {bc.label}.</div>}
        {filtered.map(p=>{ const branchKey=p._branch||viewBranch; const medTotal=(p.medicines||[]).reduce((s,m)=>s+((m.qty||0)*(m.rate||0)),0); const mhRaw=(p.admissions?.[0]?.medicalHistory||p.medicalHistory||{}).currentMedications||""; const mhMeds=mhRaw?mhRaw.split(/[,;|\n]+/).map(s=>s.trim()).filter(Boolean):[];
          return (
            <div key={p.uhid} className="hms-card">
              <ui.CardRow title={<><span className="hms-td-hi">{p.patientName||p.name}</span><span className="hms-td-mono" style={{marginLeft:8}}>{p.uhid}</span><span style={{color:"#f59e0b",marginLeft:8,fontWeight:700}}>· {fmt(medTotal)}</span></>} action={<div style={{display:"flex",gap:8}}><ui.ActionBtn col={accent} onClick={()=>updatePatient(branchKey,p.uhid,pt=>({...pt,medicines:[...(pt.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}))}>+ Add Row</ui.ActionBtn><button className="hms-add-btn" onClick={()=>openMedEditor(p)}>Open Drawer</button></div>}/>
              {mhMeds.length>0&&(<div style={{marginBottom:12,padding:"10px 14px",background:isDark?"rgba(56,189,248,0.06)":"rgba(56,189,248,0.08)",borderRadius:8,border:"1px solid rgba(56,189,248,0.2)"}}><div style={{fontSize:10,fontWeight:700,color:"#38bdf8",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>📋 Current Medications (History)</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{mhMeds.map((med,mi)=>{ const already=(p.medicines||[]).some(m=>(m.name||"").toLowerCase()===med.toLowerCase()); return(<span key={mi} className="hms-mh-pill" style={{opacity:already?0.45:1,cursor:already?"default":"pointer"}} onClick={()=>{if(!already)addMedFromHistoryPill(branchKey,p,med);}}>{already?"✓ ":"+ "}{med}</span>); })}</div></div>)}
              <div style={{marginBottom:14,position:"relative",zIndex:100}}><MedSearchDropdown medicineMaster={medicineMaster} existingMedicines={p.medicines||[]} onSelect={med=>addMedToPatientInline(branchKey,p,med)} isDark={isDark} accent={accent}/></div>
              {!(p.medicines||[]).length?<div className="hms-empty">No medicines.</div>:(
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Medicine Name","Qty","Rate (₹)","Batch No","Expiry Date","Total","Remove"].map(h=><ui.Th key={h}>{h}</ui.Th>)}</tr></thead>
                    <tbody>{(p.medicines||[]).map((m,mi)=>(
                      <tr key={m.id||mi}>
                        <td className="hms-td hms-td-hi"><input className="hms-med-inline-input" style={{width:"100%",minWidth:140}} value={m.name||""} placeholder="Medicine name" onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],name:e.target.value};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input type="number" min={0} className="hms-med-inline-input" style={{width:70,textAlign:"center"}} value={m.qty||0} onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],qty:Math.max(0,parseInt(e.target.value)||0)};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input type="number" min={0} step="0.01" className="hms-med-inline-input" style={{width:90,textAlign:"right"}} value={m.rate||0} onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],rate:Math.max(0,parseFloat(e.target.value)||0)};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input className="hms-med-inline-input" style={{width:90,textAlign:"center",fontSize:11}} value={m.batchNo||""} placeholder="Batch No" onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],batchNo:e.target.value};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><input className="hms-med-inline-input" style={{width:100,textAlign:"center",fontSize:11}} value={m.expiryDate||""} placeholder="MM/YYYY" onChange={e=>updatePatient(branchKey,p.uhid,pt=>{const meds=[...(pt.medicines||[])];meds[mi]={...meds[mi],expiryDate:e.target.value};return{...pt,medicines:meds};})}/></td>
                        <td className="hms-td"><span style={{color:"#f59e0b",fontWeight:700}}>{fmt((m.qty||0)*(m.rate||0))}</span></td>
                        <td className="hms-td"><ui.ActionBtn col="#f87171" onClick={()=>updatePatient(branchKey,p.uhid,pt=>({...pt,medicines:(pt.medicines||[]).filter((_,i)=>i!==mi)}))}>✕</ui.ActionBtn></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {(p.medicines||[]).length>0&&<div style={{display:"flex",justifyContent:"flex-end",marginTop:10,paddingTop:10,borderTop:`1px solid ${accent}18`}}><span style={{fontSize:13,fontWeight:800,color:"#f59e0b"}}>Total: {fmt(medTotal)}</span></div>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderReports = () => (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Lab Reports — {bc.label}</div>
        <div style={{fontSize:11,color:"#64748b"}}>Expand a patient → add reports → fill results → Save → Print.</div>
      </div>
      {!locationPatients.length&&<ui.EmptyState icon={<FlaskConical size={36}/>} label="No patients" sub="No patients found for this branch"/>}
      {locationPatients.map(p=>{
        const uhid=p.uhid; const isExpanded=expandedRepPatient===uhid; const repMap=patientReports[uhid]||{}; const repNames=Object.keys(repMap); const isLoading=repLoading[uhid]; const admNo=resolveAdmNo(p); const tSearch=repTemplateSearch[uhid]||""; const currentFilter=repFilter[uhid]||"All";
        const visibleReps=repNames.filter(name=>{ if(currentFilter==="All") return true; if(currentFilter==="🧪 Pathology") return !isRadiologyType(repMap[name]?.reportType); if(currentFilter==="🩻 Radiology") return isRadiologyType(repMap[name]?.reportType); return true; });
        return (
          <div key={uhid} className="rep-patient-card">
            <div className="rep-patient-head" onClick={()=>toggleRepPatient(p)}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div className="rep-patient-avatar">{initials(p.patientName||p.name||"")}</div>
                <div><div className="rep-patient-name">{p.patientName||p.name}</div><div className="rep-patient-meta">{uhid} · Adm #{admNo} · {p.gender} · {p.ageYY||p.age}y</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {repNames.length>0&&<ui.Badge col="#34d399">{repNames.length} report{repNames.length!==1?"s":""}</ui.Badge>}
                {isLoading&&<span style={{fontSize:11,color:"#64748b"}}>Loading…</span>}
                {isExpanded?<ChevronUp size={16} color="#64748b"/>:<ChevronDown size={16} color="#64748b"/>}
              </div>
            </div>
            {isExpanded&&(
              <div style={{padding:16}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:16,padding:"12px 14px",background:isDark?"rgba(59,130,246,0.05)":"rgba(59,130,246,0.04)",border:`1px solid ${accent}20`,borderRadius:8}}>
                  {["All","🧪 Pathology","🩻 Radiology"].map(f=>(<button key={f} onClick={()=>setRepFilter(prev=>({...prev,[uhid]:f}))} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:currentFilter===f?`1.5px solid ${accent}`:`1.5px solid ${isDark?"#1e2a3a":"#e2e8f0"}`,background:currentFilter===f?accent:"transparent",color:currentFilter===f?"#fff":isDark?"#94a3b8":"#475569"}}>{f}</button>))}
                  <div style={{width:1,height:22,background:isDark?"#1e2a3a":"#dde8f5",flexShrink:0}}/>
                  <input className="hms-inp" placeholder="Filter templates…" value={tSearch} onChange={e=>setRepTemplateSearch(prev=>({...prev,[uhid]:e.target.value}))} style={{maxWidth:160,padding:"5px 10px",fontSize:11}}/>
                  <select className="hms-sel" value="" style={{fontSize:11}} onChange={e=>{if(!e.target.value)return;addTemplateReport(p,e.target.value);e.target.value="";}}><option value="">+ From Template</option>{Object.keys(LAB_TEMPLATES).filter(n=>!tSearch||n.toLowerCase().includes(tSearch.toLowerCase())).map(n=><option key={n} value={n}>{n}</option>)}</select>
                  <button onClick={()=>{const r=emptyPathReport();setPatientReports(prev=>({...prev,[uhid]:{...(prev[uhid]||{}),[`Report-${Date.now()}`]:r}}));}} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:"linear-gradient(135deg,#1e3a5f,#0f172a)",color:"#fff",border:"none",cursor:"pointer"}}>🧪 + Pathology</button>
                  <button onClick={()=>{const r=emptyRadReport();setPatientReports(prev=>({...prev,[uhid]:{...(prev[uhid]||{}),[`Radiology-${Date.now()}`]:r}}));}} style={{padding:"5px 11px",borderRadius:7,fontSize:11,fontWeight:700,background:"linear-gradient(135deg,#065f46,#064e3b)",color:"#fff",border:"none",cursor:"pointer"}}>🩻 + Radiology</button>
                  <div style={{width:1,height:22,background:isDark?"#1e2a3a":"#dde8f5",flexShrink:0}}/>
                  <ManualReportAdder isDark={isDark} accent={accent} onAdd={customName=>{ if(repMap[customName]){toast(`"${customName}" already added`,"err");return;} setPatientReports(prev=>({...prev,[uhid]:{...(prev[uhid]||{}),[customName]:{id:Date.now(),reportName:customName,report_date:new Date().toISOString().slice(0,10),reportType:"Haematology",orderedBy:"",amount:0,remarks:"",findings:"",impression:"",tests:[],saved:false}}})); toast(`"${customName}" added`); }}/>
                </div>
                {visibleReps.length===0&&!isLoading&&<div style={{textAlign:"center",padding:"28px 16px",color:"#64748b",fontSize:12,border:`1px dashed ${isDark?"#1e2a3a":"#dde8f5"}`,borderRadius:8}}><FlaskConical size={26} style={{opacity:0.3,marginBottom:8}}/><div style={{fontWeight:600,color:"#94a3b8",marginBottom:4}}>No lab reports yet</div></div>}
                {visibleReps.map(rn=>{ const rep=repMap[rn]; if(!rep) return null; const ri=repNames.indexOf(rn); const isSavingThis=repSaving[`${uhid}-${rn}`]; const isRad=isRadiologyType(rep.reportType);
                  if(isRad) return <MgtRadiologyReportCard key={rn} rep={{...rep,reportName:rn,date:rep.report_date||rep.date||""}} ri={ri} patientName={p.patientName||p.name} isDark={isDark} accent={accent} updRep={(_ri,field,val)=>updRepField(uhid,rn,field==="date"?"report_date":field,val)} onRemove={()=>delRepReport(uhid,rn)} onSave={()=>saveRepReport(p,rn)} onPrint={()=>printRepReport(p,rn)} isSaving={isSavingThis}/>;
                  return <MgtPathologyReportCard key={rn} rep={{...rep,reportName:rn,date:rep.report_date||rep.date||""}} ri={ri} patientName={p.patientName||p.name} isDark={isDark} accent={accent} updRep={(_ri,field,val)=>updRepField(uhid,rn,field==="date"?"report_date":field,val)} updTest={(_ri,ti,field,val)=>updRepTest(uhid,rn,ti,field,val)} addTest={()=>addRepTest(uhid,rn)} delTest={(_ri,ti)=>delRepTest(uhid,rn,ti)} onRemove={()=>delRepReport(uhid,rn)} onSave={()=>saveRepReport(p,rn)} onPrint={()=>printRepReport(p,rn)} isSaving={isSavingThis}/>;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderBilling = () => {
    const branchInfo="Lakshmi Nagar Branch · Lakshmi Nagar, Mathura, U.P. - 281004 · +91-9717444531";
    return (
      <div className="bill-page-wrap">
        <div className="bill-patient-list">
          <div className="bill-patient-list-head"><CreditCard size={12} style={{marginRight:6,verticalAlign:"middle"}}/>Patients ({locationPatients.length})</div>
          {!locationPatients.length&&<div style={{padding:"16px",fontSize:12,color:"#64748b",textAlign:"center"}}>No patients found.</div>}
          {locationPatients.map(p=>{ const adm=p.admissions?.[0]||{}; const isActive=selectedBillPatient===p.uhid; const status=adm.discharge?.dod?"Discharged":"Admitted"; return (
            <div key={p.uhid} className={`bill-patient-item${isActive?" active":""}`} onClick={()=>{ setSelectedBillPatient(isActive?null:p.uhid); if(!isActive){const key=getBillKey(p.uhid,adm.admNo);if(!billData[key])setBillData(prev=>({...prev,[key]:initBillData(p,adm)}));fetchBillServices(p,adm);} }}>
              <div className="bill-patient-name">{p.patientName||p.name}</div>
              <div className="bill-patient-uhid">{p.uhid}</div>
              <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,marginTop:4,display:"inline-block",background:status==="Admitted"?"#34d39918":"#6b728018",color:status==="Admitted"?"#34d399":"#6b7280",border:`1px solid ${status==="Admitted"?"#34d39930":"#6b728030"}`}}>{status}</span>
            </div>
          );})}
        </div>
        <div className="bill-detail-pane">
          {!selectedBillPatient&&<div style={{textAlign:"center",padding:"60px 20px",color:"#64748b"}}><CreditCard size={40} style={{marginBottom:12,opacity:0.3}}/><div style={{fontSize:14,fontWeight:600,color:"#94a3b8"}}>Select a patient to generate their bill</div></div>}
          {selectedBillPatient&&(()=>{
            const p=locationPatients.find(pt=>pt.uhid===selectedBillPatient); if(!p) return null;
            const adm=p.admissions?.[0]||{}; const key=getBillKey(p.uhid,adm.admNo); const bd=billData[key]||initBillData(p,adm); const services=getServices(p.uhid,adm.admNo); const {gross,net}=calcBillTotals(p.uhid,adm.admNo,bd); const setF=(f,v)=>setBillField(p.uhid,adm.admNo,f,v); const today=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
            return (
              <div>
                <div className="no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700}}>Bill for {p.patientName||p.name}</div>
                  <button style={{padding:"7px 14px",borderRadius:7,fontSize:11,fontWeight:700,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6}} onClick={()=>printBill(p.uhid,bd.admNo)}><Printer size={13}/>Print Bill</button>
                </div>
                <div id="bill-print-area" ref={billPrintRef} className="bill-print-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:16,borderBottom:`2px solid ${isDark?"#1e2a3a":"#c7d5eb"}`,marginBottom:18}}>
                    <div><div style={{fontSize:20,fontWeight:800,color:isDark?"#f1f5f9":"#0f172a",fontFamily:"sans-serif"}}>SANGi HOSPITAL</div><div style={{fontSize:10,color:"#64748b",marginTop:3,lineHeight:1.5}}>{branchInfo}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Date: {today}</div><div style={{fontSize:18,fontWeight:900,color:accent,fontFamily:"sans-serif",letterSpacing:".05em"}}>FINAL BILL</div></div>
                  </div>
                  <div className="bill-info-grid">
                    {[["UHID",bd.uhid,"uhid"],["Bill No.","—",null],["IPD No.",bd.admNo,"admNo"],["Patient Name",bd.patientName,"patientName"],["Guardian",bd.guardianName,"guardianName"],["Age/Sex",`${bd.ageYY||"—"} YRS / ${bd.gender||"—"}`,null],["Contact",bd.contactNo,"contactNo"],["Address",bd.address,"address"],["Consultant",bd.doctorName,"doctorName"],["Panel",bd.panel,"panel"],["DOA",bd.doa,"doa"],["DOD",bd.dod||"—","dod"],["Payment Mode",bd.paymentMode,"paymentMode"]].map(([label,value,field],i)=>(
                      <div key={i} className="bill-info-cell"><div className="bill-info-label">{label}</div>{field?<input style={{fontSize:12,color:isDark?"#e2e8f0":"#1e293b",fontWeight:600,marginTop:2,background:"transparent",border:"1px dashed transparent",borderRadius:4,width:"100%",outline:"none",padding:"1px 4px"}} value={bd[field]||""} onChange={e=>setF(field,e.target.value)} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="transparent"}/>:<div className="bill-info-value">{value||"—"}</div>}</div>
                    ))}
                  </div>
                  <table className="bill-services-table">
                    <thead><tr><th style={{width:"5%"}}>SR</th><th style={{width:"12%"}}>DATE</th><th style={{width:"12%"}}>CGHS CODE</th><th style={{width:"36%"}}>DESCRIPTION</th><th style={{width:"10%"}}>QTY</th><th style={{width:"12%"}}>RATE</th><th style={{width:"13%"}}>AMOUNT</th></tr></thead>
                    <tbody>
                      {!services.length&&<tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",fontStyle:"italic",padding:"12px"}}>No services added</td></tr>}
                      {services.map((svc,si)=>{ const amount=(parseFloat(svc.qty)||0)*(parseFloat(svc.rate)||0); return (<tr key={svc.id||si}><td>{si+1}</td><td><input value={svc.date||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"date",e.target.value)} style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:12}}/></td><td><input value={svc.cghs||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"cghs",e.target.value)} style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:12}}/></td><td><input value={svc.desc||""} onChange={e=>updateService(p.uhid,adm.admNo,si,"desc",e.target.value)} style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:12}}/></td><td><input type="number" min={0} value={svc.qty||0} onChange={e=>updateService(p.uhid,adm.admNo,si,"qty",e.target.value)} style={{width:"100%",textAlign:"right",background:"transparent",border:"none",outline:"none",fontSize:12}}/></td><td><input type="number" min={0} step="0.01" value={svc.rate||0} onChange={e=>updateService(p.uhid,adm.admNo,si,"rate",e.target.value)} style={{width:"100%",textAlign:"right",background:"transparent",border:"none",outline:"none",fontSize:12}}/></td><td style={{textAlign:"right",fontWeight:600,color:isDark?"#f59e0b":"#b45309"}}>₹ {amount.toFixed(2)}<button className="no-print" style={{marginLeft:6,background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:10}} onClick={()=>removeService(p.uhid,adm.admNo,si)}>✕</button></td></tr>); })}
                    </tbody>
                  </table>
                  <div ref={svcSearchRef} style={{position:"relative",marginBottom:8}} className="no-print">
                    <input value={svcSearch} placeholder="🔍 Search service master…" onChange={e=>{setSvcSearch(e.target.value);setSvcSearchOpen(true);}} onFocus={()=>setSvcSearchOpen(true)} style={{width:"100%",boxSizing:"border-box",padding:"8px 12px",borderRadius:7,border:`1px solid ${isDark?"#1a2540":"#c7d5eb"}`,fontSize:12,outline:"none",background:isDark?"#080c18":"#f8faff",color:isDark?"#e2e8f0":"#0f172a",fontFamily:"inherit"}}/>
                    {svcSearchOpen&&(()=>{ const q=svcSearch.trim().toLowerCase(); const filtered=q?MGMT_SERVICE_MASTER.filter(s=>s.name.toLowerCase().includes(q)||s.code.toLowerCase().includes(q)).slice(0,20):MGMT_SERVICE_MASTER.slice(0,20); return (<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:9999,maxHeight:260,overflowY:"auto",background:isDark?"#0f172a":"#fff",border:`1px solid ${isDark?"#1e293b":"#c7d5eb"}`,borderRadius:10,boxShadow:"0 12px 32px rgba(0,0,0,0.2)"}}>{filtered.map((svc,si)=>(<div key={si} onClick={()=>{const key=getBillKey(p.uhid,adm.admNo);setBillServices(prev=>({...prev,[key]:[...(prev[key]||[]),{id:Date.now(),date:new Date().toISOString().slice(0,10),cghs:svc.code,desc:svc.name,qty:1,rate:svc.rate}]}));setSvcSearch("");setSvcSearchOpen(false);}} style={{padding:"9px 14px",cursor:"pointer",borderBottom:`1px solid ${isDark?"#1e293b":"#f1f5f9"}`,fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=isDark?"#1e293b":"#f0f9ff"} onMouseLeave={e=>e.currentTarget.style.background=""}><span><strong>{svc.name}</strong> <span style={{fontSize:11,color:"#94a3b8"}}>({svc.code}) · {svc.cat}</span></span><span style={{fontSize:12,color:"#059669",fontWeight:700}}>₹{svc.rate}</span></div>))}</div>); })()}
                  </div>
                  <div className="bill-add-svc-row no-print">
                    <input placeholder="Description *" value={newSvcRow.desc||""} onChange={e=>setNewSvcRow(f=>({...f,desc:e.target.value}))} style={{flex:2,background:"var(--input-bg)",color:"var(--text)",border:"1px solid var(--input-border)",borderRadius:5,padding:"5px 8px",fontSize:11,outline:"none"}}/>
                    <input type="date" value={newSvcRow.date||""} onChange={e=>setNewSvcRow(f=>({...f,date:e.target.value}))} style={{flex:1,background:"var(--input-bg)",color:"var(--text)",border:"1px solid var(--input-border)",borderRadius:5,padding:"5px 8px",fontSize:11,outline:"none"}}/>
                    <input placeholder="CGHS" value={newSvcRow.cghs||""} onChange={e=>setNewSvcRow(f=>({...f,cghs:e.target.value}))} style={{flex:1,background:"var(--input-bg)",color:"var(--text)",border:"1px solid var(--input-border)",borderRadius:5,padding:"5px 8px",fontSize:11,outline:"none"}}/>
                    <input type="number" min={0} value={newSvcRow.qty||1} onChange={e=>setNewSvcRow(f=>({...f,qty:e.target.value}))} placeholder="Qty" style={{width:60,background:"var(--input-bg)",color:"var(--text)",border:"1px solid var(--input-border)",borderRadius:5,padding:"5px 8px",fontSize:11,outline:"none"}}/>
                    <input type="number" min={0} step="0.01" value={newSvcRow.rate||0} onChange={e=>setNewSvcRow(f=>({...f,rate:e.target.value}))} placeholder="Rate" style={{width:80,background:"var(--input-bg)",color:"var(--text)",border:"1px solid var(--input-border)",borderRadius:5,padding:"5px 8px",fontSize:11,outline:"none"}}/>
                    <button style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:"pointer"}} onClick={()=>addService(p.uhid,adm.admNo)}>+ Add</button>
                  </div>
                  <div className="bill-totals-section">
                    <div className="bill-totals-box">
                      <div className="bill-total-row"><span style={{color:"#64748b"}}>Gross Total:</span><span style={{fontWeight:700}}>₹ {gross.toFixed(2)}</span></div>
                      <div className="bill-total-row"><span style={{color:"#64748b"}}>Discount:</span><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:"#c084fc"}}>- ₹</span><input type="number" min={0} className="no-print" style={{width:80,textAlign:"right",background:"transparent",border:`1px dashed ${isDark?"#1e2a3a":"#c7d5eb"}`,borderRadius:4,padding:"1px 6px",fontSize:12,color:"#c084fc",outline:"none"}} value={bd.discount||0} onChange={e=>setF("discount",e.target.value)}/><span style={{fontWeight:700,color:"#c084fc"}}>{parseFloat(bd.discount||0).toFixed(2)}</span></div></div>
                      <div className="bill-total-row"><span style={{color:"#64748b"}}>Advance:</span><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:"#34d399"}}>- ₹</span><input type="number" min={0} className="no-print" style={{width:80,textAlign:"right",background:"transparent",border:`1px dashed ${isDark?"#1e2a3a":"#c7d5eb"}`,borderRadius:4,padding:"1px 6px",fontSize:12,color:"#34d399",outline:"none"}} value={bd.advance||0} onChange={e=>setF("advance",e.target.value)}/><span style={{fontWeight:700,color:"#34d399"}}>{parseFloat(bd.advance||0).toFixed(2)}</span></div></div>
                      <div className="bill-total-row net"><span style={{color:accent}}>NET PAYABLE:</span><span style={{color:accent,fontSize:16}}>₹ {net.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderTaskReport = () => {
    const periodLabel={all:"All Time",today:"Today",week:"This Week",month:"This Month"};
    const empMap={};
    filteredTaskReport.forEach(t=>{ if(!empMap[t.assignedTo]) empMap[t.assignedTo]={name:t.assignedTo,dept:t.department,total:0,completed:0,pending:0,inprogress:0}; empMap[t.assignedTo].total++; if(t.status==="Completed") empMap[t.assignedTo].completed++; else if(t.status==="Pending") empMap[t.assignedTo].pending++; else if(t.status==="In Progress") empMap[t.assignedTo].inprogress++; });
    const empList=Object.values(empMap);
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700}}>Task Report</div>
          <button onClick={loadTasks} disabled={tasksLoading} style={{fontSize:11,fontWeight:700,color:accent,background:`${accent}12`,border:`1px solid ${accent}30`,borderRadius:6,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit"}}>{tasksLoading?"⏳ Loading…":"↻ Refresh"}</button>
        </div>
        <div className="hms-card">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:8}}>
            <div><label className="hms-lbl">Time Period</label><select className="hms-sel" value={taskReportFilter.period} onChange={e=>setTaskReportFilter(f=>({...f,period:e.target.value}))}><option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select></div>
            <div><label className="hms-lbl">Department</label><select className="hms-sel" value={taskReportFilter.dept} onChange={e=>setTaskReportFilter(f=>({...f,dept:e.target.value}))}><option value="All">All Departments</option>{allDeptOptions.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="hms-lbl">Status</label><select className="hms-sel" value={taskReportFilter.status} onChange={e=>setTaskReportFilter(f=>({...f,status:e.target.value}))}><option value="All">All Status</option>{TASK_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="hms-lbl">Employee</label><input className="hms-inp" style={{marginBottom:0}} placeholder="Search…" value={taskReportFilter.empName} onChange={e=>setTaskReportFilter(f=>({...f,empName:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <ui.ActionBtn col="#34d399" onClick={()=>{exportTasksXLSX(filteredTaskReport,`task_report_${taskReportFilter.period}.xlsx`);toast("Exported XLSX");}}>↓ XLSX</ui.ActionBtn>
            <ui.ActionBtn col="#38bdf8" onClick={()=>{exportCSV(`task_report.csv`,filteredTaskReport.map(t=>({TaskID:t.id,Title:t.title,AssignedTo:t.assignedTo,Department:t.department,Priority:t.priority,Status:t.status,DueDate:t.dueDate||"—",CreatedDate:t.createdAt?.split("T")[0]||"—",PatientNames:(t.patientNames||[]).join("; ")||"—"})),["TaskID","Title","AssignedTo","Department","Priority","Status","DueDate","CreatedDate","PatientNames"]);toast("Exported CSV");}}>↓ CSV</ui.ActionBtn>
            <span style={{marginLeft:"auto",fontSize:11,color:"#64748b"}}><strong>{filteredTaskReport.length}</strong> records · <span style={{color:accent}}>{periodLabel[taskReportFilter.period]}</span></span>
          </div>
        </div>
        <div className="hms-card">
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Employee Summary</div>
          {!empList.length?<div className="hms-empty">No tasks match filters.</div>:(
            <ui.TableWrap heads={["Employee","Dept","Total","Pending","In Progress","Completed","Completion %"]}>
              {empList.map((e,i)=>{ const pct=e.total?Math.round((e.completed/e.total)*100):0; return (<tr key={i}><ui.Td hi>{e.name}</ui.Td><ui.Td><ui.Badge col={accent}>{e.dept}</ui.Badge></ui.Td><ui.Td><strong>{e.total}</strong></ui.Td><ui.Td><span style={{color:"#f59e0b"}}>{e.pending}</span></ui.Td><ui.Td><span style={{color:"#38bdf8"}}>{e.inprogress}</span></ui.Td><ui.Td><span style={{color:"#34d399"}}>{e.completed}</span></ui.Td><ui.Td><div style={{display:"flex",alignItems:"center",gap:8}}><ui.ProgressBar pct={pct} col="#34d399"/><span style={{fontSize:10,fontWeight:700,color:pct>=75?"#34d399":pct>=50?"#f59e0b":"#f87171",minWidth:32}}>{pct}%</span></div></ui.Td></tr>); })}
            </ui.TableWrap>
          )}
        </div>
      </div>
    );
  };

  const renderMedHistory = () => {
    const handleOpenMedPt = p => { const adm=p.admissions?.[0]||{}; setMedHistData(adm.medicalHistory||p.medicalHistory||{}); setSelectedMedPt(p); };
    const handleSaveMed = async () => { if(!selectedMedPt) return; const admNo=String(resolveAdmNo(selectedMedPt)); try{ await apiService.updateMedicalHistory(selectedMedPt.uhid,admNo,medHistData); updatePatient(selectedMedPt._branch||viewBranch,selectedMedPt.uhid,p=>({...p,admissions:(p.admissions||[]).map((a,i)=>i===0?{...a,medicalHistory:medHistData}:a)})); toast("Medical history saved"); setSelectedMedPt(null); }catch{toast("Failed to save","err");} };
    if(selectedMedPt) return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={()=>setSelectedMedPt(null)} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #1e2a3a",background:"transparent",color:"#64748b",cursor:"pointer",fontSize:13,fontWeight:600}}>← Back</button>
          <div style={{fontSize:14,fontWeight:700}}>{selectedMedPt.patientName||selectedMedPt.name}</div>
          <span className="hms-role-badge">{selectedMedPt.uhid}</span>
          <button onClick={()=>apiService.printMedicalHistory(selectedMedPt.uhid,String(resolveAdmNo(selectedMedPt)))} style={{marginLeft:"auto",padding:"7px 16px",borderRadius:8,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#fff",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}><Printer size={13}/> Print Medical History</button>
        </div>
        <MedicalHistoryPage data={medHistData} setData={setMedHistData} onSave={handleSaveMed} onSkip={()=>setSelectedMedPt(null)} patient={selectedMedPt} discharge={selectedMedPt.admissions?.[0]?.discharge} locId={selectedMedPt._branch||viewBranch}/>
      </div>
    );
    const withMed=locationPatients.filter(p=>{ const mh=p.admissions?.[0]?.medicalHistory||p.medicalHistory||{}; return Object.values(mh).some(v=>v); });
    return (
      <div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
          {[{label:"With History",val:withMed.length,col:"#34d399"},{label:"Total Patients",val:locationPatients.length,col:accent},{label:"Pending Fill",val:locationPatients.length-withMed.length,col:"#f59e0b"}].map((s,i)=><div key={i} className="hms-stat-card" style={{padding:"10px 14px",border:`1px solid ${s.col}18`}}><div className="hms-stat-num" style={{fontSize:18,color:s.col}}>{s.val}</div><div className="hms-stat-label">{s.label}</div></div>)}
        </div>
        <div className="hms-card">
          <ui.TableWrap heads={["Patient","UHID","Age/Gender","Doctor","Adm Date","Diagnosis","History Status","Action"]}>
            {locationPatients.length===0?<tr><td colSpan={8}><div className="hms-empty">No patients for {bc.label}.</div></td></tr>:locationPatients.map((p,i)=>{ const adm=p.admissions?.[0]||{}; const mh=adm.medicalHistory||p.medicalHistory||{}; const hasMed=Object.values(mh).some(v=>v); return (<tr key={i}><ui.Td hi>{p.patientName||p.name}</ui.Td><ui.Td mono>{p.uhid}</ui.Td><ui.Td sm>{p.ageYY||p.age}y / {p.gender}</ui.Td><ui.Td sm>{adm.discharge?.doctorName||"—"}</ui.Td><ui.Td sm>{fmtDt(adm.dateTime)}</ui.Td><ui.Td>{adm.discharge?.diagnosis||p.dischargeSummary?.diagnosis||"—"}</ui.Td><ui.Td><ui.Badge col={hasMed?"#34d399":"#f59e0b"}>{hasMed?"Filled":"Not Filled"}</ui.Badge></ui.Td><ui.Td><ui.ActionBtn col={accent} onClick={()=>handleOpenMedPt(p)}>{hasMed?"Edit":"Add"} History</ui.ActionBtn></ui.Td></tr>); })}
          </ui.TableWrap>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const commonProps = { ...sharedProps, bc, locationPatients, allAdmissions, currentlyAdmitted, discharged, tasks, departments, setActiveTab, openSummaryEditor, handlePrintSummary, Badge:ui.Badge, StatCard:ui.StatCard, CardRow:ui.CardRow, TableWrap:ui.TableWrap, Th:ui.Th, Td:ui.Td, ActionBtn:ui.ActionBtn, EmptyState:ui.EmptyState, PriorityPill:ui.PriorityPill, StatusPill:ui.StatusPill, SummaryPill:ui.SummaryPill, ProgressBar:ui.ProgressBar };
    switch(activeTab) {
      case "home":        return <HomeView {...commonProps} currentUser={currentUser}/>;
      case "patients":    return <PatientsView {...commonProps} openMedEditor={openMedEditor} toggleRepPatient={toggleRepPatient} openViewModal={openViewModal} confirmDelete={confirmDelete}/>;
      case "discharge":   return <DischargeView {...commonProps} dischSumFilter={dischSumFilter} setDischSumFilter={setDischSumFilter} normalizeSummaryType={normalizeSummaryType} getPreferredDischarge={getPreferredDischarge} getPreferredAdmission={getPreferredAdmission} openViewModal={openViewModal} confirmDelete={confirmDelete}/>;
      case "medicines":   return renderMedicines();
      case "reports":     return renderReports();
      case "billing":     return renderBilling();
      case "tasks":       return <TasksView {...commonProps} openNewTask={openNewTask} openEditTask={openEditTask} deleteTask={deleteTask} updateTaskStatus={updateTaskStatus} allDeptOptions={allDeptOptions}/>;
      case "taskreport":  return renderTaskReport();
      case "medhistory":  return renderMedHistory();
      case "records":     return <UpdateRecordsPanel roleLabel="Office Admin"/>;
      case "departments": return <DepartmentsView accent={accent} employees={employees} tasks={tasks} departments={departments} setDepartments={setDepartments} setShowDeptModal={setShowDeptModal} Badge={ui.Badge} ProgressBar={ui.ProgressBar}/>;
      case "employees":   return <EmployeesView accent={accent} employees={employees} openEditEmployee={openEditEmployee} handleToggleActive={handleToggleActive} setEditEmpId={setEditEmpId} setEmpPassErr={setEmpPassErr} setEmpForm={setEmpForm} setShowEmpModal={setShowEmpModal} Badge={ui.Badge} ActionBtn={ui.ActionBtn} EmptyState={ui.EmptyState} TableWrap={ui.TableWrap} Th={ui.Th} Td={ui.Td}/>;
      case "profile":     return <ProfileView accent={accent} currentUser={currentUser} currentDisplayName={currentDisplayName} profileForm={profileForm} setProfileForm={setProfileForm} saveMyProfile={saveMyProfile} initials={initials} Badge={ui.Badge}/>;
      default:            return <HomeView {...commonProps} currentUser={currentUser}/>;
    }
  };

  const sbWidth = collapsed ? 52 : 220;

  return (
    <div className="hms-wrap">
      <style>{MGMT_CSS(accent,isDark)}</style>
      <style>{BILL_PRINT_CSS}</style>
      {notif&&<div className="hms-notif" style={{background:notif.type==="ok"?(isDark?"#052e1c":"#f0fdf4"):(isDark?"#3b0f05":"#fef2f2"),borderColor:notif.type==="ok"?"#34d399":"#f87171",color:notif.type==="ok"?"#86efac":"#fca5a5"}}>{notif.type==="ok"?"✓ ":"⚠ "}{notif.msg}</div>}

      <header className="hms-hdr">
        <div className="hms-logo-row">
          <img src="/app_icon.png" alt="logo" style={{width:30,height:30,borderRadius:8,objectFit:"cover"}}/>
          <div><div className="hms-logo-text">Sangi Hospital</div><div className="hms-logo-sub">{currentUser?.dept||currentUser?.role} · Management</div></div>
        </div>
        <div className="hms-hdr-right">
          <span className="hms-role-badge">{currentUser?.role?.toUpperCase()}</span>
          <ThemeModeDock variant="inline"/>
          <div className="hms-avatar-pill"><span className="hms-avatar-name">{currentDisplayName}</span><div className="hms-avatar">{initials(currentDisplayName)}</div></div>
          <button className="hms-logout-btn" onClick={onLogout}>↪ Logout</button>
        </div>
      </header>

      <div className="hms-body">
        <aside className="hms-sb" style={{width:sbWidth}}>
          <div className="hms-sb-top" style={{padding:collapsed?"14px 8px":"14px 12px"}}>
            {!collapsed&&<div className="hms-branch-label">Branch</div>}
            {collapsed?(
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {BRANCH_KEYS.map(bk=>(<button key={bk} className="hms-branch-dot-btn" onClick={()=>setViewBranch(bk)} style={{background:viewBranch===bk?BC[bk].dim:"transparent"}}><div className="hms-branch-dot" style={{background:BC[bk].accent}}/></button>))}
              </div>
            ):(
              <select className="hms-branch-select" value={viewBranch} onChange={e=>setViewBranch(e.target.value)}>
                {BRANCH_KEYS.map(bk=><option key={bk} value={bk}>{BC[bk].label}</option>)}
              </select>
            )}
          </div>
          <nav className="hms-nav-wrap">
            {NAV.map(item=>{ const Icon=item.icon; return (<div key={item.id} className={`hms-nav-item${activeTab===item.id?" active":""}`} style={{padding:collapsed?"10px 0":"10px 14px",justifyContent:collapsed?"center":"flex-start"}} onClick={()=>setActiveTab(item.id)} title={item.label}><span style={{display:"inline-flex",alignItems:"center"}}>{Icon&&<Icon size={15} strokeWidth={1.9}/>}</span>{!collapsed&&<span style={{marginLeft:8}}>{item.label}</span>}</div>); })}
          </nav>
          {!collapsed&&<div style={{padding:"10px 12px",borderTop:"1px solid #1e2030",borderBottom:"1px solid #1e2030"}}><div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>Signed in as</div><div style={{fontSize:12,fontWeight:700,marginTop:2}}>{currentDisplayName}</div><div style={{fontSize:10,color:"#64748b"}}>{currentUser?.dept||currentUser?.role}</div></div>}
          <div className="hms-sb-bot" style={{padding:collapsed?"10px 8px":"10px 12px"}}><button className="hms-col-btn" onClick={()=>setCollapsed(x=>!x)}>{collapsed?"▶":"◀"}</button></div>
        </aside>
        <main className="hms-main">{renderContent()}</main>
      </div>

      {/* ── Modals ── */}
      <SummaryModal showSummaryModal={showSummaryModal} editSumPt={editSumPt} summaryAdmNo={summaryAdmNo} summaryType={summaryType} setSummaryType={setSummaryType} editDisFields={editDisFields} setEditDisFields={setEditDisFields} summarySaving={summarySaving} saveSummary={saveSummary} handlePrintSummary={handlePrintSummary} setShowSummaryModal={setShowSummaryModal} setEditSumPt={setEditSumPt} bc={bc} isDark={isDark} SUMMARY_TYPES={SUMMARY_TYPES} SUMMARY_LABELS={SUMMARY_LABELS}/>
      <TaskModal showTaskModal={showTaskModal} editTask={editTask} taskForm={taskForm} setTaskForm={setTaskForm} allDeptOptions={allDeptOptions} taskAssignableEmployees={taskAssignableEmployees} taskPatientSearch={taskPatientSearch} setTaskPatientSearch={setTaskPatientSearch} filteredTaskPatients={filteredTaskPatients} toggleTaskPatient={toggleTaskPatient} saveTask={saveTask} setShowTaskModal={setShowTaskModal} setEditTask={setEditTask} accent={accent} isDark={isDark}/>
      <EmployeeModal showEmpModal={showEmpModal} editEmpId={editEmpId} empForm={empForm} setEmpForm={setEmpForm} empPassErr={empPassErr} setEmpPassErr={setEmpPassErr} empShowPass={empShowPass} setEmpShowPass={setEmpShowPass} empShowConfirm={empShowConfirm} setEmpShowConfirm={setEmpShowConfirm} allDeptOptions={allDeptOptions} saveEmployee={saveEmployee} setShowEmpModal={setShowEmpModal} setEditEmpId={setEditEmpId}/>
      <DeptModal showDeptModal={showDeptModal} deptForm={deptForm} setDeptForm={setDeptForm} saveDepartment={saveDepartment} setShowDeptModal={setShowDeptModal}/>

      {/* View Summary Modal */}
      {showViewModal&&viewPt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}><div className="hms-modal-box" style={{width:640}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div className="hms-modal-title">Discharge Summary</div><div style={{display:"flex",alignItems:"center",gap:8}}><ui.SummaryPill type={viewPt.dischargeSummary?.summary_type || viewPt.dischargeSummary?.summaryType || viewPt.dischargeSummary?.type} p={viewPt}/><span className="hms-td-mono">{viewPt.uhid}</span></div></div><button className="hms-logout-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button></div><div className="hms-stat-card" style={{padding:"12px 14px",marginBottom:14}}>{[["Patient",viewPt.patientName||viewPt.name],["Age/Gender",`${viewPt.ageYY||viewPt.age}Y / ${viewPt.gender}`],["UHID",viewPt.uhid],["Phone",viewPt.phone||"—"]].map(([k,v])=><div key={k} style={{marginBottom:6}}><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{k}</div><div style={{fontSize:12,fontWeight:700}}>{v}</div></div>)}</div>{[["Diagnosis",viewPt.dischargeSummary?.diagnosis],["Treatment",viewPt.dischargeSummary?.treatment],["Doctor",viewPt.dischargeSummary?.doctorName],["Follow-up",viewPt.dischargeSummary?.followUp],["Notes",viewPt.dischargeSummary?.notes]].map(([k,v])=><div key={k} style={{marginBottom:8}}><div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{k}</div><div style={{fontSize:12,color:v&&v!=="—"?"inherit":"#64748b",fontStyle:v&&v!=="—"?"normal":"italic"}}>{v||"Not set"}</div></div>)}<div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button><ui.ActionBtn col={accent} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</ui.ActionBtn><button className="hms-save-btn" onClick={()=>handlePrintSummary(viewPt)}>↓ Download</button></div></div></div>)}

      {/* Delete Confirm */}
      {showDeleteConfirm&&deletePt&&(<div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}><div className="hms-modal-box" style={{width:380}}><div className="hms-modal-title" style={{color:"#f87171"}}>Clear Discharge Summary?</div><div style={{fontSize:12,color:"#94a3b8",marginBottom:18,lineHeight:1.6}}>This will reset the discharge summary for <strong>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This cannot be undone.</div><div className="hms-modal-foot"><button className="hms-cancel-btn" onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button><button className="hms-danger-btn" onClick={doDeleteSummary}>Yes, Clear Summary</button></div></div></div>)}

      {/* Med Drawer */}
      {showMedModal&&editMedPt&&<MedDrawer editMedPt={editMedPt} onClose={()=>{setShowMedModal(false);setEditMedPt(null);}} updateMed={updateMed} addMedRow={addMedRow} delMedRow={delMedRow} saveMeds={saveMeds} fmt={fmt} canEditRate={true} medicineMaster={medicineMaster} onAddFromMaster={addMedFromDropdownToDrawer} MedSearchDropdown={MedSearchDropdown} isDark={isDark} accent={accent}/>}
    </div>
  );
}
