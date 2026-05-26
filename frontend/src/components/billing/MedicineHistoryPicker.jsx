import { useState } from "react";

export default function MedicineHistoryPicker({ eMed, onAdd }) {
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState(true);

  const historyMeds = eMed?.currentMedications
    ? eMed.currentMedications.split(", ").filter(Boolean)
    : [];

  const historyFiltered = search.trim()
    ? historyMeds.filter(m => m.toLowerCase().includes(search.toLowerCase()))
    : historyMeds;

  if (!expanded) {
    return (
      <div style={{
        background:"#f0fdf4", border:"1.5px dashed #86efac", borderRadius:10,
        padding:"10px 16px", marginBottom:14,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#15803d" }}>
          💊 Add from Medical History
          {historyMeds.length > 0 && (
            <span style={{
              background:"#dcfce7", border:"1px solid #86efac",
              borderRadius:20, padding:"1px 8px", fontSize:11, marginLeft:6,
            }}>
              {historyMeds.length} prescribed
            </span>
          )}
        </span>
        <button
          onClick={() => setExpanded(true)}
          style={{
            background:"#15803d", color:"#fff", border:"none",
            borderRadius:7, padding:"5px 14px", fontSize:12,
            fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          }}
        >Show ▾</button>
      </div>
    );
  }

  return (
    <div style={{
      background:"var(--white,#fff)", border:"1.5px solid #86efac",
      borderRadius:12, marginBottom:16, overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#14532d,#15803d)",
        padding:"12px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{
            fontSize:13, fontWeight:700, color:"#fff",
            display:"flex", alignItems:"center", gap:8,
          }}>
            💊 Add Medicines from Medical History &amp; Library
            {historyMeds.length > 0 && (
              <span style={{
                background:"rgba(255,255,255,.2)",
                border:"1px solid rgba(255,255,255,.3)",
                borderRadius:20, padding:"2px 9px",
                fontSize:11, color:"#bbf7d0",
              }}>
                {historyMeds.length} from this patient's Rx
              </span>
            )}
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", marginTop:2 }}>
            Click any medicine to add to the bill
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background:"rgba(255,255,255,.15)", color:"#fff",
            border:"1px solid rgba(255,255,255,.25)",
            borderRadius:7, padding:"5px 12px", fontSize:12,
            fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          }}
        >Hide ▴</button>
      </div>

      {/* Search */}
      <div style={{
        padding:"10px 16px", borderBottom:"1px solid #dcfce7",
        background:"#f0fdf4",
      }}>
        <div style={{ position:"relative" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            style={{
              position:"absolute", left:10, top:"50%",
              transform:"translateY(-50%)", color:"#86efac", pointerEvents:"none",
            }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Search medicines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width:"100%", fontFamily:"inherit", fontSize:12,
              border:"1.5px solid #86efac", borderRadius:8,
              padding:"7px 10px 7px 32px", outline:"none",
              boxSizing:"border-box", color:"var(--navy)", background:"#fff",
            }}
          />
        </div>
      </div>

      {/* Medicine pills */}
      <div style={{
        maxHeight:280, overflowY:"auto", padding:"12px 16px",
        display:"flex", flexDirection:"column", gap:10,
      }}>
        {historyFiltered.length > 0 && (
          <div>
            <div style={{
              fontSize:10, fontWeight:700, color:"#15803d",
              textTransform:"uppercase", letterSpacing:".08em",
              marginBottom:7, display:"flex", alignItems:"center", gap:6,
            }}>
              <span style={{ background:"#dcfce7", borderRadius:4, padding:"1px 6px" }}>
                ⭐ From This Patient's Medical History
              </span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {historyFiltered.map(med => (
                <button
                  key={med}
                  onClick={() => onAdd(med)}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:5,
                    background:"#dcfce7", border:"1.5px solid #86efac",
                    borderRadius:20, padding:"5px 12px", fontSize:12,
                    color:"#14532d", fontWeight:600, cursor:"pointer",
                    fontFamily:"inherit", transition:"all .13s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background  = "#bbf7d0";
                    e.currentTarget.style.transform   = "scale(1.03)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background  = "#dcfce7";
                    e.currentTarget.style.transform   = "scale(1)";
                  }}
                >
                  + {med}
                </button>
              ))}
            </div>
          </div>
        )}

        {historyMeds.length === 0 && !search && (
          <div style={{ fontSize:11, color:"#86efac", fontStyle:"italic", marginBottom:4 }}>
            No medications found in Medical History. Fill in the Admission Note to see them here.
          </div>
        )}
      </div>
    </div>
  );
}