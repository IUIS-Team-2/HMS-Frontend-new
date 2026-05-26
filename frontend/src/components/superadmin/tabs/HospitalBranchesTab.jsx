import { useState } from "react";
import { useT, bColor, bName, cardStyle, SD } from "../shared/tokens";
import { Pill, StatCard, TH } from "../shared/MicroUI";
import { apiService } from "../../../services/apiService";
import { toast } from "react-toastify";
import { Building2, Hospital } from "lucide-react";

export default function HospitalBranchesTab({ branches = [], onChanged }) {
  const T = useT();
  const EMPTY = { branch:"", slug:"", uhid_prefix:"", hospital_name:"SANGI HOSPITAL", branch_name:"", address:"", phone:"", email:"", website:"https://www.sangihospital.com" };
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const reset = () => { setForm(EMPTY); setEditId(null); };

  const submit = async () => {
    if (!form.branch || !form.slug || !form.uhid_prefix || !form.branch_name) { toast.error("Branch code, slug, UHID prefix, and branch name are required."); return; }
    setLoading(true);
    try {
      if (editId) await apiService.updateHospitalBranch(editId, form);
      else await apiService.createHospitalBranch(form);
      toast.success(editId ? "Hospital branch updated." : "Hospital branch created.");
      reset(); onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.branch?.[0] || err.response?.data?.slug?.[0] || "Failed to save hospital branch.");
    } finally { setLoading(false); }
  };

  const removeBranch = async (b) => {
    if (!window.confirm(`Delete ${b.branch_name}?`)) return;
    try { await apiService.deleteHospitalBranch(b.id); toast.success("Hospital branch deleted."); onChanged?.(); }
    catch (err) { toast.error(err.response?.data?.branch?.[0] || "Failed to delete branch."); }
  };

  const inp = { width:"100%", padding:"9px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4, display:"block" };

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={Building2} label="Hospital Branches" value={branches.length} color={T.laxmi} />
        <StatCard icon={Hospital} label="UHID Prefixes" value={new Set(branches.map(b => b.uhidPrefix || b.uhid_prefix)).size} color={T.green} />
      </div>
      <div style={{ ...cardStyle(T), marginBottom:18 }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.white, marginBottom:14 }}>{editId ? "Edit Hospital Branch" : "Create Hospital Branch"}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          {[["Branch Code","branch"],["Slug","slug"],["UHID Prefix","uhid_prefix"],["Branch Name","branch_name"],
            ["Hospital Name","hospital_name"],["Phone","phone"],["Email","email"],["Website","website"]
          ].map(([label, key]) => (
            <div key={key}><label style={lbl}>{label}</label><input value={form[key]} onChange={upd(key)} style={inp} /></div>
          ))}
          <div style={{ gridColumn:"1 / -1" }}>
            <label style={lbl}>Address</label>
            <textarea value={form.address} onChange={upd("address")} style={{ ...inp, minHeight:90, resize:"vertical" }} />
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
          {editId && <button onClick={reset} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:`1px solid ${T.border2}`, color:T.dim, fontWeight:700, cursor:"pointer" }}>Cancel</button>}
          <button onClick={submit} disabled={loading} style={{ padding:"9px 18px", borderRadius:8, background:T.laxmi, color:"#000", border:"none", fontWeight:800, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading ? "Saving..." : (editId ? "Save Branch" : "Create Branch")}
          </button>
        </div>
      </div>
      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Branch","Code","Slug","UHID Prefix","Contact","Actions"].map(h => <TH key={h} h={h} />)}</tr></thead>
          <tbody>
            {branches.length === 0 && <tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:T.dim }}>No hospital branches configured.</td></tr>}
            {branches.map((b, i) => (
              <tr key={b.id || i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.card:T.surface }}>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{b.name||b.branch_name}</div>
                  <div style={{ fontSize:11, color:T.dim }}>{b.hospitalName||b.hospital_name}</div>
                </td>
                <td style={{ padding:"10px 12px", color:T.dim }}>{b.code||b.branch}</td>
                <td style={{ padding:"10px 12px", color:T.dim }}>{b.slug}</td>
                <td style={{ padding:"10px 12px" }}><Pill color={bColor(b.slug, T)}>{b.uhidPrefix||b.uhid_prefix}</Pill></td>
                <td style={{ padding:"10px 12px", color:T.dim }}>{b.phone||"—"}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => { setForm({ branch:b.code||b.branch||"", slug:b.slug||"", uhid_prefix:b.uhidPrefix||b.uhid_prefix||"", hospital_name:b.hospitalName||b.hospital_name||"SANGI HOSPITAL", branch_name:b.name||b.branch_name||"", address:b.address||"", phone:b.phone||"", email:b.email||"", website:b.website||"https://www.sangihospital.com" }); setEditId(b.id); }} style={{ padding:"5px 12px", borderRadius:7, background:T.laxmi+"20", color:T.laxmi, border:`1px solid ${T.laxmi}44`, fontSize:11, fontWeight:700, cursor:"pointer" }}>✏ Edit</button>
                    <button onClick={() => removeBranch(b)} style={{ padding:"5px 12px", borderRadius:7, background:T.red+"15", color:T.red, border:`1px solid ${T.red}44`, fontSize:11, fontWeight:700, cursor:"pointer" }}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}