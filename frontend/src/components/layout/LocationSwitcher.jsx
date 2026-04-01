import { useState } from "react";
import { T, LOCATIONS } from "../../data/constants";
import { Ico, IC } from "../ui/Icons";

export default function LocationSwitcher({locId, setLocId}) {
  const [open,setOpen]=useState(false);
  const loc=LOCATIONS.find(l=>l.id===locId);
  return(<div className="loc-switcher"><button className="loc-btn" onClick={()=>setOpen(o=>!o)}><div className="loc-dot" style={{background:loc.color}}/><div><div className="loc-name">{loc.name}</div><div className="loc-city">{loc.city}</div></div><div className={`loc-chevron${open?" open":""}`}><Ico d={IC.dn} size={13} sw={2.5}/></div></button>{open&&(<><div style={{position:"fixed",inset:0,zIndex:400}} onClick={()=>setOpen(false)}/><div className="loc-dropdown"><div style={{padding:"10px 16px 8px",borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:11,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:6}}><Ico d={IC.mapPin} size={12} sw={2}/> Select Branch</div></div>{LOCATIONS.map(l=>(<div key={l.id} className={`loc-option${l.id===locId?" active":""}`} onClick={()=>{setLocId(l.id);setOpen(false);}}><div className="loc-opt-dot" style={{background:l.color}}/><div><div className="loc-opt-name">{l.name}</div><div className="loc-opt-city">Mathura, Uttar Pradesh</div></div>{l.id===locId&&<div className="loc-opt-check"><Ico d={IC.check} size={14} sw={2.5}/></div>}</div>))}</div></>)}</div>);
}