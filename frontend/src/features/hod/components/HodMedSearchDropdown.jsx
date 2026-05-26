import React, { useState, useMemo, useEffect, useRef } from "react";

export default function HodMedSearchDropdown({ medicineMaster, existingItems, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return (medicineMaster || []).slice(0, 30);
    return (medicineMaster || []).filter(m => (m.name || m.medicine_name || "").toLowerCase().includes(q)).slice(0, 30);
  }, [query, medicineMaster]);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isAlready = name => (existingItems || []).some(r => (r.item || "").toLowerCase() === (name || "").toLowerCase());

  const openDrop = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const normExp = e => {
    if (!e) return "";
    if (/^\d{4}-\d{2}$/.test(e)) return e + "-01";
    if (/^\d{2}\/\d{4}$/.test(e)) { const [m,y]=e.split("/"); return `${y}-${m}-01`; }
    if (/^\d{2}\/\d{2}$/.test(e)) { const [m,y]=e.split("/"); return `20${y}-${m}-01`; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(e)) return e;
    return "";
  };

  const handleSelect = med => {
    const name = med.name || med.medicine_name || "";
    if (isAlready(name)) return;
    onSelect({ id:Date.now(), item:name, date:new Date().toISOString().slice(0,10), quantity:1, rate:Number(med.rate??med.price??0), amount:Number(med.rate??med.price??0), batchNo:med.batch_no||"", expiryDate:normExp(med.expiry_date||"") });
    setQuery(""); setOpen(false);
  };

  const handleManual = () => {
    const name = query.trim();
    if (!name) return;
    onSelect({ id:Date.now(), item:name, date:new Date().toISOString().slice(0,10), quantity:1, rate:0, amount:0, batchNo:"", expiryDate:"" });
    setQuery(""); setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position:"relative", marginBottom:12 }}>
      <input ref={inputRef} value={query} placeholder="🔍 Search & add medicine from master…"
        onChange={e => { setQuery(e.target.value); openDrop(); }}
        onFocus={openDrop}
        onKeyDown={e => { if (e.key==="Enter") handleManual(); if (e.key==="Escape") setOpen(false); }}
        style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, border:"1.5px solid var(--border)", background:"var(--surface)", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }}/>
      {open && rect && filtered.length > 0 && (
        <div style={{ position:"fixed", top:rect.bottom+4, left:rect.left, width:rect.width, zIndex:99999, maxHeight:260, overflowY:"auto", borderRadius:10, boxShadow:"0 12px 32px rgba(0,0,0,0.3)", background:"var(--surface)", border:"1px solid var(--border)" }}>
          {filtered.map((m, idx) => {
            const already = isAlready(m.name || m.medicine_name || "");
            return (
              <div key={idx} onClick={() => !already && handleSelect(m)}
                style={{ padding:"10px 14px", cursor:already?"default":"pointer", borderBottom:"1px solid var(--border)", opacity:already?0.45:1 }}
                onMouseEnter={e => { if (!already) e.currentTarget.style.background="var(--surface-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background=""; }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{already?"✓ ":"+ "}{m.name||m.medicine_name||""}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>₹{m.rate??m.price??0}{m.expiry_date?` · Exp: ${m.expiry_date}`:""}{already?" (already added)":""}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
