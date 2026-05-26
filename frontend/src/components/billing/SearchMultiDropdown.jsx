import { useState, useEffect, useRef } from "react";

export default function SearchMultiDropdown({
  value,
  onChange,
  groups,
  placeholder,
  chipColor  = "#0369a1",
  chipBg     = "#e0f2fe",
  chipBorder = "#7dd3fc",
  allowCustom = false,
  singleSelect = false,
}) {
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const [panelStyle, setPanelStyle] = useState({});

  const triggerRef = useRef(null);
  const panelRef   = useRef(null);

  const selected = Array.isArray(value)
    ? value
    : value
      ? value.split(",").map(v => v.trim()).filter(Boolean)
      : [];

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect    = triggerRef.current.getBoundingClientRect();
    const panelH  = 370;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUpward = spaceBelow < panelH && spaceAbove > spaceBelow;
    setPanelStyle({
      position: "fixed",
      left:     rect.left,
      width:    rect.width,
      minWidth: Math.max(rect.width, 320),
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 5, top: "auto" }
        : { top: rect.bottom + 5, bottom: "auto" }
      ),
      background:   "var(--white,#fff)",
      border:       "1.5px solid var(--border,#e2e8f0)",
      borderRadius: 10,
      boxShadow:    "0 12px 40px rgba(11,37,69,.22)",
      zIndex:       9999,
      maxHeight:    Math.min(panelH, openUpward ? spaceAbove : spaceBelow),
      display:      "flex",
      flexDirection:"column",
      overflow:     "hidden",
    });
  };

  useEffect(() => {
    if (open) {
      calcPosition();
      window.addEventListener("scroll", calcPosition, true);
      window.addEventListener("resize", calcPosition);
    }
    return () => {
      window.removeEventListener("scroll", calcPosition, true);
      window.removeEventListener("resize", calcPosition);
    };
  }, [open]);

  useEffect(() => {
    const handler = e => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = item => {
    if (singleSelect) {
      onChange(item === selected[0] ? "" : item);
      setOpen(false);
      setSearch("");
      return;
    }
    const set = new Set(selected);
    set.has(item) ? set.delete(item) : set.add(item);
    onChange([...set].join(", "));
  };

  const remove = item => {
    const set = new Set(selected);
    set.delete(item);
    onChange([...set].join(", "));
  };

  const addCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (singleSelect) {
      onChange(trimmed);
      setOpen(false);
      setSearch("");
      return;
    }
    if (!selected.includes(trimmed)) onChange([...selected, trimmed].join(", "));
    setSearch("");
  };

  const sl = search.toLowerCase();
  const filteredGroups = groups
    .map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(sl)) }))
    .filter(g => g.items.length > 0);
  const exactMatch = groups.flatMap(g => g.items).some(i => i.toLowerCase() === sl);

  return (
    <div style={{ position:"relative", width:"100%" }}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily:"inherit", fontSize:13,
          color: selected.length ? "var(--navy)" : "var(--text3)",
          background:"var(--bg)",
          border:`1.5px solid ${open ? "var(--teal)" : "var(--border)"}`,
          borderRadius:8, padding:"9px 12px", width:"100%", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          boxSizing:"border-box", minHeight:40, transition:"border-color .15s",
        }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>
          {selected.length > 0
            ? (singleSelect ? selected[0] : `${selected.length} selected`)
            : placeholder}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink:0, transform:open?"rotate(180deg)":"none", transition:"transform .2s" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Chips */}
      {!singleSelect && selected.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>
          {selected.map(item => (
            <span key={item} style={{
              display:"inline-flex", alignItems:"center", gap:4,
              background:chipBg, border:`1px solid ${chipBorder}`,
              borderRadius:20, padding:"2px 9px", fontSize:11, color:chipColor, maxWidth:260,
            }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item}</span>
              <span
                onMouseDown={e => { e.preventDefault(); remove(item); }}
                style={{ cursor:"pointer", fontSize:13, color:chipColor, fontWeight:700, lineHeight:1, flexShrink:0 }}
              >×</span>
            </span>
          ))}
          <span
            onMouseDown={e => { e.preventDefault(); onChange(""); }}
            style={{ cursor:"pointer", fontSize:11, color:"#ef4444", alignSelf:"center", marginLeft:3 }}
          >Clear all</span>
        </div>
      )}

      {/* Panel */}
      {open && (
        <div ref={panelRef} style={panelStyle}>
          {/* Search */}
          <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--border)", background:"var(--bg)", flexShrink:0 }}>
            <div style={{ position:"relative" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", pointerEvents:"none" }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && allowCustom && !exactMatch && addCustom()}
                style={{
                  width:"100%", fontFamily:"inherit", fontSize:12,
                  border:"1.5px solid var(--border)", borderRadius:7,
                  padding:"7px 9px 7px 30px", outline:"none", boxSizing:"border-box",
                  color:"var(--navy)", background:"var(--white,#fff)",
                }}
              />
            </div>
          </div>

          {/* Items */}
          <div style={{ overflowY:"auto", flex:1 }}>
            {filteredGroups.length === 0 && !allowCustom && (
              <div style={{ padding:"18px", textAlign:"center", fontSize:12, color:"var(--text3)" }}>
                No results found
              </div>
            )}
            {filteredGroups.map(({ group, color, items }) => (
              <div key={group}>
                <div style={{
                  padding:"7px 12px 4px", fontSize:10, fontWeight:700,
                  color: color || "var(--text3)", textTransform:"uppercase",
                  letterSpacing:".07em", background:"var(--bg)",
                  borderBottom:"1px solid var(--border)",
                }}>{group}</div>
                {items.map(item => {
                  const isSel = selected.includes(item);
                  return (
                    <div
                      key={item}
                      onMouseDown={e => { e.preventDefault(); toggle(item); }}
                      style={{
                        display:"flex", alignItems:"center", gap:9,
                        padding:"8px 12px", cursor:"pointer",
                        background: isSel ? (chipBg || "#e0f2fe") : "transparent",
                        borderBottom:"1px solid var(--border,#e2e8f0)22",
                        transition:"background .1s",
                      }}
                    >
                      {!singleSelect && (
                        <div style={{
                          width:15, height:15, borderRadius:4,
                          border:`2px solid ${isSel ? (chipColor||"#0369a1") : "var(--border2,#ccc)"}`,
                          background: isSel ? (chipColor||"#0369a1") : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0, transition:"all .1s",
                        }}>
                          {isSel && (
                            <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      )}
                      {singleSelect && (
                        <div style={{
                          width:15, height:15, borderRadius:"50%",
                          border:`2px solid ${isSel ? (chipColor||"#0369a1") : "var(--border2,#ccc)"}`,
                          background: isSel ? (chipColor||"#0369a1") : "transparent",
                          flexShrink:0, transition:"all .1s",
                        }}/>
                      )}
                      <span style={{
                        fontSize:12,
                        color:      isSel ? (chipColor||"#0369a1") : "var(--navy)",
                        fontWeight: isSel ? 600 : 400,
                      }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            {allowCustom && search.trim() && !exactMatch && (
              <div
                onMouseDown={e => { e.preventDefault(); addCustom(); }}
                style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding:"9px 12px", cursor:"pointer",
                  background:"#f0fdf4", borderTop:"1px solid #bbf7d0",
                }}
              >
                <span style={{ fontSize:16, color:"#059669" }}>+</span>
                <span style={{ fontSize:12, color:"#059669", fontWeight:600 }}>
                  Add "{search.trim()}"
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          {!singleSelect && (
            <div style={{
              padding:"7px 12px", borderTop:"1px solid var(--border)",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"var(--bg)", flexShrink:0,
            }}>
              <span style={{ fontSize:11, color:"var(--text3)" }}>{selected.length} selected</span>
              <button
                onMouseDown={e => { e.preventDefault(); setOpen(false); }}
                style={{
                  padding:"4px 14px", borderRadius:7, border:"none",
                  background:"var(--navy)", color:"#fff",
                  fontFamily:"inherit", fontSize:12, fontWeight:600, cursor:"pointer",
                }}
              >Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}