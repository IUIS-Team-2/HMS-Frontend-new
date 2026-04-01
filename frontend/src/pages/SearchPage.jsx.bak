import { useState } from "react";
import { T, LOCATIONS } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";
import { initials } from "../utils/helpers";

export default function SearchPage({db,locId,onNewAdmission,onNewPatient}){
  const [searchType,setSearchType]=useState("phone");
  const [query,setQuery]=useState("");
  const [searched,setSearched]=useState(false);
  const [result,setResult]=useState(null);
  const loc=LOCATIONS.find(l=>l.id===locId);
  const doSearch=()=>{if(!query.trim())return;const q=query.trim().toLowerCase();const found=db.find(p=>searchType==="phone"?p.phone===q||p.altPhone===q:p.nationalId.toLowerCase()===q);setResult(found||null);setSearched(true);};
  const clear=()=>{setQuery("");setSearched(false);setResult(null);};
  
  return(<>
    <div className="search-hero">
      <div className="hero-top">
        <div>
          <h1 className="hero-title">Patient Registration</h1>
          <p className="hero-subtitle">Search for a returning patient or register a new one</p>
          <div className="hero-loc-badge"><div style={{width:8,height:8,borderRadius:"50%",background:loc.color}}/>{loc.name} Branch · Mathura</div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="hero-stat-num">{db.length}</span><span className="hero-stat-lbl">Patients</span></div>
          <div className="hero-stat"><span className="hero-stat-num">{db.reduce((a,p)=>a+p.admissions.length,0)}</span><span className="hero-stat-lbl">Admissions</span></div>
        </div>
      </div>
      <div className="search-panel">
        <div className="search-panel-title"><div style={{width:34,height:34,borderRadius:9,background:T.bgTint,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentDeep,flexShrink:0}}><Ico d={IC.search} size={16} sw={2}/></div>Find Existing Patient</div>
        <p className="search-panel-sub">Search by phone or National ID to check if this patient has visited before</p>
        <div className="search-toggle">
          <button className={`tgl-btn${searchType==="phone"?" active":""}`} onClick={()=>{setSearchType("phone");clear();}}><Ico d={IC.phone} size={14} sw={2}/> Phone Number</button>
          <button className={`tgl-btn${searchType==="nationalId"?" active":""}`} onClick={()=>{setSearchType("nationalId");clear();}}><Ico d={IC.id} size={14} sw={2}/> National ID</button>
        </div>
        <div className="search-input-group">
          <div className="search-input-wrap">
            <span className="search-input-icon"><Ico d={searchType==="phone"?IC.phone:IC.id} size={16} sw={1.75}/></span>
            <input className="search-ctrl" placeholder={searchType==="phone"?"Enter 10-digit mobile number…":"Enter Aadhar / PAN / Passport No…"} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()}/>
            {query&&<button className="search-clear" onClick={clear}><Ico d={IC.x} size={14} sw={2}/></button>}
          </div>
          <button className="search-btn" onClick={doSearch}><Ico d={IC.search} size={15} sw={2}/> Search</button>
          <button className="new-patient-btn" onClick={onNewPatient}><Ico d={IC.plus} size={15} sw={2.5}/> New Patient</button>
        </div>
      </div>
    </div>
    <div className="content-area">
      {searched&&result&&(<>
        <div className="result-found">
          <div className="result-found-hd">
            <div className="rf-left">
              <div className="rf-avatar">{initials(result.patientName)}</div>
              <div>
                <div className="rf-name">{result.patientName}</div>
                <div className="rf-meta">
                  <span className="rf-chip" style={{background:"rgba(255,255,255,.15)",borderColor:"rgba(255,255,255,.2)",color:"#fff",fontWeight:700}}>{result.uhid}</span>
                  <span className="rf-chip">{result.gender}</span>
                  <span className="rf-chip">{result.bloodGroup}</span>
                  <span className="rf-chip"><Ico d={IC.phone} size={11} sw={2}/>{result.phone}</span>
                  <span className="rf-chip"><Ico d={IC.history} size={11} sw={2}/>{result.admissions.length} admission{result.admissions.length!==1?"s":""}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:"16px 24px",background:T.white,display:"flex",gap:10,flexWrap:"wrap"}}>
            {[["Phone",result.phone],["National ID",result.nationalId],["Address",result.address],["Allergies",result.allergies||"None"]].map(([l,v])=>(
              <div key={l} style={{background:T.offwhite,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 13px",minWidth:140}}>
                <div style={{fontSize:10,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:500,color:T.text}}>{v||"—"}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="new-adm-banner">
          <div className="nab-icon"><Ico d={IC.newadm} size={22} sw={1.75}/></div>
          <div className="nab-text" style={{flex:1}}><h3>New Admission — {result.patientName}</h3><p>Same UHID <strong style={{color:T.accentLight}}>{result.uhid}</strong> will be retained. A new admission entry will be added to their history.</p></div>
          <button className="nab-btn" onClick={()=>onNewAdmission(result)}><Ico d={IC.plus} size={16} sw={2.5}/> New Admission</button>
        </div>
      </>)}
      {searched&&!result&&(<div className="not-found"><div className="not-found-icon"><Ico d={IC.search} size={28} sw={1.5}/></div><h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.primary,marginBottom:8}}>No patient found</h3><p style={{fontSize:14,color:T.textMuted,marginBottom:28,maxWidth:340,margin:"0 auto 28px",lineHeight:1.6}}>No record matches <strong>"{query}"</strong> at this branch.</p><button className="btn btn-accent" style={{margin:"0 auto"}} onClick={onNewPatient}><Ico d={IC.plus} size={15} sw={2.5}/> Register New Patient</button></div>)}
      {!searched&&(
        <div className="info-grid">
          {[{icon:"🔍",bg:"#EFF6FF",title:"Search First",desc:"Always search by phone or National ID before registering — avoids duplicate records."},{icon:"📋",bg:"#F0FDF4",title:"Patients History",desc:"Use Patients History in the sidebar to view all admissions, discharge status and bills."},{icon:"⚡",bg:"#FFF7ED",title:"Same UHID",desc:"Returning patients keep their original UHID — only a new admission is added."}].map(c=>(<div className="info-card" key={c.title}><div className="info-card-icon" style={{background:c.bg}}>{c.icon}</div><div className="info-card-title">{c.title}</div><p className="info-card-desc">{c.desc}</p></div>))}
        </div>
      )}
    </div>
  </>);
}