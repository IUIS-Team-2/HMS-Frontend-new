import { useT, cardStyle, SD } from "./tokens";

export function Pill({ children, color }) {
  return <span style={{ background: color+"1A", color, border:`1px solid ${color}40`, borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{children}</span>;
}
export function Badge({ children, color }) {
  return <span style={{ background:color+"18", color, borderRadius:5, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{children}</span>;
}
export function STitle({ children, action }) {
  const T = useT();
  return <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
    <div style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:T.dim }}>{children}</div>
    {action}
  </div>;
}
export function StatCard({ icon, label, value, sub, color }) {
  const T = useT();
  const cs = cardStyle(T);
  const Icon = icon;
  return <div style={{ ...cs, borderLeft:`4px solid ${color||T.laxmi}`, flex:1, minWidth:150 }}>
    <div style={{ display:"flex", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:900, color:T.white }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:T.dim, marginTop:3 }}>{sub}</div>}
      </div>
      <div style={{ fontSize:22, opacity:.75 }}>{Icon ? <Icon size={20} strokeWidth={1.9}/> : null}</div>
    </div>
  </div>;
}
export function XlsBtn({ onClick, label }) {
  const T = useT();
  return <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:T.green, color:"#000", fontSize:12, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>{label||"Download Excel"}</button>;
}
export function FilterSelect({ value, onChange, options, style }) {
  const T = useT();
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{ padding:"6px 28px 6px 12px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:12, fontWeight:600, cursor:"pointer", outline:"none", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", ...style }}>
    {options.map(([val,label])=>(<option key={val} value={val}>{label}</option>))}
  </select>;
}
export function TH({ h }) {
  const T = useT();
  return <th style={{ padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".06em", whiteSpace:"nowrap", background:T.bg }}>{h}</th>;
}
export function StarRating({ rating, max=5, size=16 }) {
  const T = useT();
  return <span style={{ display:"inline-flex", gap:2 }}>{Array.from({length:max}).map((_,i)=>(<span key={i} style={{ fontSize:size, color:i<rating?"#FBBF24":T.dimmer, lineHeight:1 }}>{i<rating?"★":"☆"}</span>))}</span>;
}
