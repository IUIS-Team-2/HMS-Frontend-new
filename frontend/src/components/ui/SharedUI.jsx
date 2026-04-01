import { T } from "../../data/constants";
import { Ico, IC } from "./Icons";

export const statusBadge = status => {
  if(!status) return null;
  const s = status.toLowerCase();
  let cls = "badge-default";
  if(s.includes("recover")) cls="badge-recovered";
  else if(s.includes("refer")) cls="badge-referred";
  else if(s.includes("lama")||s.includes("against")) cls="badge-lama";
  return <span className={`status-badge ${cls}`}>{status}</span>;
};

export function Field({label,req,err,children,style}){return(<div className="fld" style={style}>{label&&<label>{label}{req&&<span className="req">*</span>}</label>}{children}{err&&<span className="fld-err">{err}</span>}</div>);}
export function Inp({label,req,err,type="text",...p}){return(<Field label={label} req={req} err={err}><input className={`ctrl${err?" err":""}`} type={type} {...p}/></Field>);}
export function Sel({label,req,err,opts,placeholder,...p}){return(<Field label={label} req={req} err={err}><div className="sel-w"><select className={`ctrl${err?" err":""}`} {...p}><option value="">{placeholder||"Select"}</option>{opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select><span className="sel-arr"><Ico d={IC.dn} size={13} sw={2.5}/></span></div></Field>);}
export function Txta({label,req,rows=3,...p}){return(<Field label={label} req={req}><textarea className="ctrl" rows={rows} {...p}/></Field>);}
export function Card({icon,title,subtitle,children,delay=0}){return(<div className="card" style={{animationDelay:`${delay}s`}}><div className="card-hd"><div className="card-ico"><Ico d={icon} size={16} sw={1.75}/></div><div><p className="card-ttl">{title}</p>{subtitle&&<p className="card-sub">{subtitle}</p>}</div></div><div className="card-bd">{children}</div></div>);}