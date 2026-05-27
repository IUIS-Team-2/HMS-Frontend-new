import { useT } from "../shared/tokens";
import { getBranchMeta } from "../shared/tokens";
import { Printer } from "lucide-react";
import { printWithAuth } from "../../../utils/printWithAuth";
import { BASE_URL } from "../../../services/apiService";

export default function BillPrintModal({ p, onClose }) {
  const T = useT();
  if (!p) return null;
  const branchMeta = getBranchMeta(p._branch);
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" });
  const svcs = p.services || [];
  const subtotal = p.subtotal ?? svcs.reduce((s,sv)=>s+(parseFloat(sv.rate)||0)*(parseFloat(sv.qty)||1),0);
  const discount = p.discount ?? (parseFloat(p.billingObj?.discount)||0);
  const grand    = p.grand   ?? (subtotal - discount);

  const handlePrint = async () => {
    try {
      await printWithAuth(`${BASE_URL}/patients/${encodeURIComponent(p.uhid)}/admissions/${encodeURIComponent(p.admNo)}/bill/print/`);
    } catch (e) { alert(e.message || "Print failed."); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:T.surface, borderRadius:16, width:"100%", maxWidth:900, maxHeight:"94vh", overflow:"hidden", display:"flex", flexDirection:"column", border:`1px solid ${T.border}`, boxShadow:"0 32px 100px rgba(0,0,0,.8)" }}>
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${T.border}`, background:T.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:15, fontWeight:900, color:T.white }}>Bill Preview — {p.name}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handlePrint} style={{ padding:"8px 18px", borderRadius:8, background:T.laxmi, color:"#000", border:"none", fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <Printer size={14}/> Print Bill
            </button>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", color:T.white, width:34, height:34, borderRadius:8, cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY:"auto", padding:24 }}>
          <div style={{ background:"#fff", color:"#000", fontFamily:"Arial,sans-serif", fontSize:12, padding:24, borderRadius:8 }}>
            <div style={{ textAlign:"center", padding:40, color:"#666", fontSize:14 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🖨️</div>
              <div style={{ fontWeight:700, marginBottom:8 }}>Click "Print Bill" to open the official bill</div>
              <div style={{ fontSize:12 }}>The official bill will open in a new tab using the hospital template.</div>
              <div style={{ marginTop:16, fontSize:12, color:"#999" }}>
                Patient: <strong>{p.name}</strong> · Adm No: <strong>{p.admNo}</strong> · Grand Total: <strong>Rs.{grand.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
