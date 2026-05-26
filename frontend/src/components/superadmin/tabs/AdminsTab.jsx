import { useState, useEffect, useCallback } from "react";
import { useT, bColor, bName, cardStyle, SD, ALL_HOSPITALS_LABEL, isGlobalAccessUser, roleUsesAllBranch } from "../shared/tokens";
import { Pill, Badge, StatCard, TH } from "../shared/MicroUI";
import { fmt } from "../shared/tokens";
import { apiService } from "../../../services/apiService";
import { toast } from "react-toastify";
import { Users, UserCog } from "lucide-react";

const ROLE_LABELS = { office_admin:"Office Admin", branch_admin:"Branch Admin", superadmin:"Super Admin" };
const roleColor = (role, T) => {
  if (role==="superadmin")   return T.amber;
  if (role==="office_admin") return T.laxmi;
  if (role==="branch_admin") return T.raya;
  return T.green;
};

export default function AdminsTab({ branches = [] }) {
  const T = useT();
  const defaultBranchSlug = branches[0]?.slug || "laxmi";
  const EMPTY = { id:"", name:"", password:"", confirmPassword:"", role:"office_admin", branch:"ALL" };
  const [users, setUsers]               = useState([]);
  const [subTab, setSubTab]             = useState("all");
  const [createModal, setCreateModal]   = useState(false);
  const [editModal, setEditModal]       = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch]             = useState("");
  const [form, setForm]                 = useState(EMPTY);
  const [editForm, setEditForm]         = useState({});
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [passErr, setPassErr]           = useState("");
  const [loading, setLoading]           = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data.map(u => ({
        ...u, id:u.id, username:u.username,
        name:`${u.first_name} ${u.last_name}`.trim() || u.username,
        role:u.role==="admin" ? "branch_admin" : u.role,
        branch:(u.branch==="ALL"||u.role==="superadmin"||roleUsesAllBranch(u.role))
          ? "ALL"
          : (branches.find(b=>b.code===u.branch)?.slug || defaultBranchSlug),
        isActive:u.is_active, lastLogin:u.last_login,
      })));
    } catch { setUsers([]); }
  }, [branches, defaultBranchSlug]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const ok = !search || [u.name,u.username,u.role].some(v=>v?.toLowerCase().includes(search.toLowerCase()));
    if (subTab==="active")      return ok && u.isActive!==false;
    if (subTab==="deactivated") return ok && u.isActive===false;
    return ok;
  });

  const sf  = k => e => { setForm(f=>({...f,[k]:e.target.value})); setPassErr(""); };
  const sef = k => e => setEditForm(f=>({...f,[k]:e.target.value}));
  const handleRoleChange = val => setForm(f=>({ ...f, role:val, branch:roleUsesAllBranch(val)?"ALL":(f.branch==="ALL"?defaultBranchSlug:f.branch) }));

  const handleCreate = async () => {
    if (!form.id||!form.name||!form.password) { toast.error("Fill all required fields"); return; }
    if (form.password!==form.confirmPassword) { setPassErr("Passwords do not match"); return; }
    const nameParts  = form.name.split(" ");
    const backendRole = form.role==="branch_admin" ? "admin" : form.role;
    const branchCode  = roleUsesAllBranch(form.role) ? "ALL" : (branches.find(b=>b.slug===form.branch)?.code || defaultBranchSlug.toUpperCase());
    try {
      await apiService.createUser({ username:form.id, first_name:nameParts[0], last_name:nameParts.length>1?nameParts.slice(1).join(" "):".", password:form.password, confirm_password:form.password, role:backendRole, branch:branchCode, email:`${form.id}@sangihospital.com` });
      toast.success("User created!"); setCreateModal(false); setForm(EMPTY); fetchUsers();
    } catch (err) {
      const d = err.response?.data;
      toast.error(d?.username?.[0] || d?.password?.[0] || "Failed to create user.");
    }
  };

  const openEdit = u => { setEditForm({ name:u.name||"", role:u.role||"branch_admin", branch:u.branch||defaultBranchSlug, newPass:"", confirmNewPass:"" }); setEditModal(u); };

  const handleSaveEdit = async () => {
    if (!editForm.name) { toast.error("Name cannot be empty"); return; }
    if (editForm.newPass && editForm.newPass!==editForm.confirmNewPass) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const nameParts   = editForm.name.split(" ");
    const backendRole = editForm.role==="branch_admin" ? "admin" : editForm.role;
    const branchCode  = roleUsesAllBranch(editForm.role) ? "ALL" : (branches.find(b=>b.slug===editForm.branch)?.code || defaultBranchSlug.toUpperCase());
    try {
      await apiService.updateUser(editModal.id, { first_name:nameParts[0], last_name:nameParts.length>1?nameParts.slice(1).join(" "):".", role:backendRole, branch:branchCode, ...(editForm.newPass?{password:editForm.newPass,confirm_password:editForm.newPass}:{}) });
      toast.success("User updated!"); setEditModal(null); fetchUsers();
    } catch { toast.error("Failed to update user."); } finally { setLoading(false); }
  };

  const handleToggleActive = async u => {
    setLoading(true);
    try {
      if (u.isActive===false) { await apiService.reactivateUser(u.id); toast.success(`${u.name} reactivated.`); }
      else                    { await apiService.deactivateUser(u.id);  toast.success(`${u.name} deactivated.`); }
      setConfirmModal(null); fetchUsers();
    } catch { toast.error("Failed to update user status."); } finally { setLoading(false); }
  };

  const handleDelete = async u => {
    setLoading(true);
    try { await apiService.deleteUser(u.id); toast.success(`${u.name} deleted.`); setConfirmModal(null); fetchUsers(); }
    catch { toast.error("Failed to delete user."); } finally { setLoading(false); }
  };

  const handleConfirm = () => {
    if (!confirmModal) return;
    if (confirmModal.type==="delete") handleDelete(confirmModal.user);
    else handleToggleActive(confirmModal.user);
  };

  const inp = { width:"100%", padding:"9px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:13, outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4, display:"block" };
  const bsm = (bg,c,bd) => ({ padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", border:`1px solid ${bd||bg}`, background:bg, color:c, whiteSpace:"nowrap" });

  const SubPill = ({ id, label, count }) => (
    <button onClick={()=>setSubTab(id)} style={{ padding:"6px 16px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:subTab===id?T.laxmi:T.bg, color:subTab===id?"#000":T.dim, display:"flex", alignItems:"center", gap:6 }}>
      {label}
      {count!==undefined && <span style={{ background:subTab===id?"rgba(0,0,0,.2)":T.dimmer, color:subTab===id?"#000":T.dim, borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:900 }}>{count}</span>}
    </button>
  );

  const activeCount = users.filter(u=>u.isActive!==false).length;
  const deactCount  = users.filter(u=>u.isActive===false).length;

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:18 }}>
        <StatCard icon={Users}   label="Total Users"    value={users.length}                                     color={T.laxmi} />
        <StatCard icon={UserCog} label="Active"         value={activeCount} sub="Can log in"                     color={T.green} />
        <StatCard icon={UserCog} label="Deactivated"    value={deactCount}  sub="Blocked from login"             color={T.red} />
        <StatCard icon={UserCog} label="Office Admins"  value={users.filter(u=>u.role==="office_admin").length}  color={T.laxmi} />
        <StatCard icon={UserCog} label="Branch Admins"  value={users.filter(u=>u.role==="branch_admin").length}  color={T.raya} />
      </div>

      <div style={{ ...cardStyle(T), marginBottom:18, display:"flex", gap:24, flexWrap:"wrap", padding:"14px 20px" }}>
        {[["Office Admin",T.laxmi,"Global operational authority across all hospitals."],
          ["Super Admin",T.amber,"Full system control across all hospitals."],
          ["Branch Admin",T.raya,"Dedicated admin for one branch only."]
        ].map(([label,color,desc]) => (
          <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <Pill color={color}>{label}</Pill>
            <div style={{ fontSize:12, color:T.dim, maxWidth:240 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4, background:T.bg, borderRadius:22, padding:3, border:`1px solid ${T.border}` }}>
          <SubPill id="all"         label="All Users"   count={users.length} />
          <SubPill id="active"      label="Active"      count={activeCount}  />
          <SubPill id="deactivated" label="Deactivated" count={deactCount}   />
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, username, role..." style={{ marginLeft:"auto", padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border2}`, background:T.card, color:T.white, fontSize:12, outline:"none", width:220 }} />
        <button onClick={()=>setCreateModal(true)} style={{ padding:"8px 20px", borderRadius:9, background:T.laxmi, color:"#000", border:"none", fontWeight:800, fontSize:13, cursor:"pointer" }}>+ Create User</button>
      </div>

      <div style={{ ...cardStyle(T), padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Username","Full Name","Role","Branch Access","Status","Last Login","Actions"].map(h=><TH key={h} h={h}/>)}</tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={7} style={{ padding:48, textAlign:"center", color:T.dim }}>{search?"No users match your search":"No users found"}</td></tr>}
            {filtered.map((u,i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:u.isActive===false?(i%2===0?T.bg+"cc":T.surface+"cc"):(i%2===0?T.card:T.surface), opacity:u.isActive===false?0.7:1 }}>
                <td style={{ padding:"10px 12px", fontSize:12, fontFamily:"monospace", color:T.laxmi }}>{u.username}</td>
                <td style={{ padding:"10px 12px" }}><div style={{ fontSize:13, fontWeight:600, color:T.white }}>{u.name}</div></td>
                <td style={{ padding:"10px 12px" }}><Pill color={roleColor(u.role,T)}>{ROLE_LABELS[u.role]||u.role}</Pill></td>
                <td style={{ padding:"10px 12px" }}>
                  {isGlobalAccessUser(u)
                    ? <Pill color={u.role==="superadmin"?T.amber:T.laxmi}>{ALL_HOSPITALS_LABEL}</Pill>
                    : u.branch ? <Pill color={bColor(u.branch,T)}>{bName(u.branch)}</Pill>
                    : <span style={{ color:T.dim }}>--</span>}
                </td>
                <td style={{ padding:"10px 12px" }}><Badge color={u.isActive===false?T.red:T.green}>{u.isActive===false?"Deactivated":"Active"}</Badge></td>
                <td style={{ padding:"10px 12px", fontSize:11, color:T.dim }}>{u.lastLogin?fmt(u.lastLogin):"--"}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button onClick={()=>openEdit(u)} style={bsm(T.laxmi+"20",T.laxmi,T.laxmi+"44")}>✏ Edit</button>
                    {u.isActive===false
                      ? <button onClick={()=>setConfirmModal({type:"reactivate",user:u})} style={bsm(T.green+"20",T.green,T.green+"44")}>▶ Activate</button>
                      : <button onClick={()=>setConfirmModal({type:"deactivate",user:u})} style={bsm(T.amber+"18",T.amber,T.amber+"44")}>⏸ Deactivate</button>}
                    <button onClick={()=>setConfirmModal({type:"delete",user:u})} style={bsm(T.red+"15",T.red,T.red+"44")}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ── */}
      {createModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:30,width:460,border:`1px solid ${T.border}`,boxShadow:SD,maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:16,fontWeight:800,color:T.white }}>Create New User</div>
              <button onClick={()=>setCreateModal(false)} style={{ background:"rgba(255,255,255,.07)",border:"none",color:T.white,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
            <div style={{ marginBottom:12 }}><label style={lbl}>Username / ID <span style={{ color:T.red }}>*</span></label><input type="text" placeholder="admin_xyz" value={form.id} onChange={sf("id")} style={inp}/></div>
            <div style={{ marginBottom:12 }}><label style={lbl}>Full Name <span style={{ color:T.red }}>*</span></label><input type="text" placeholder="Full Name" value={form.name} onChange={sf("name")} style={inp}/></div>
            {[["Password","password",showPass,()=>setShowPass(p=>!p)],["Confirm Password","confirmPassword",showConfirm,()=>setShowConfirm(p=>!p)]].map(([l,k,vis,tog]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={lbl}>{l} <span style={{ color:T.red }}>*</span></label>
                <div style={{ position:"relative" }}>
                  <input type={vis?"text":"password"} placeholder="••••••••" value={form[k]||""} onChange={sf(k)} style={{ ...inp,paddingRight:52 }}/>
                  <button type="button" onClick={tog} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:11,fontWeight:600 }}>{vis?"HIDE":"SHOW"}</button>
                </div>
                {k==="confirmPassword" && passErr && <div style={{ color:T.red,fontSize:12,marginTop:4 }}>{passErr}</div>}
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Role</label>
              <select value={form.role} onChange={e=>handleRoleChange(e.target.value)} style={{ ...inp,cursor:"pointer" }}>
                <option value="office_admin">Office Admin (All Hospitals)</option>
                <option value="branch_admin">Branch Admin (Single Branch)</option>
              </select>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Branch</label>
              {roleUsesAllBranch(form.role)
                ? <div style={{ padding:"9px 13px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.dim,fontSize:13,display:"flex",gap:8 }}><Pill color={T.laxmi}>{ALL_HOSPITALS_LABEL}</Pill></div>
                : <select value={form.branch} onChange={sf("branch")} style={{ ...inp,cursor:"pointer" }}>{branches.map(b=><option key={b.slug} value={b.slug}>{b.name}</option>)}</select>}
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button onClick={()=>setCreateModal(false)} style={{ padding:"9px 18px",borderRadius:8,background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={loading} style={{ padding:"9px 18px",borderRadius:8,background:T.laxmi,color:"#000",border:"none",fontWeight:800,cursor:"pointer",opacity:loading?0.7:1 }}>{loading?"Creating...":"Create User"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:30,width:460,border:`1px solid ${T.border}`,boxShadow:SD,maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <div style={{ fontSize:16,fontWeight:800,color:T.white }}>Edit User</div>
              <button onClick={()=>setEditModal(null)} style={{ background:"rgba(255,255,255,.07)",border:"none",color:T.white,width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
            <div style={{ fontSize:12,color:T.dim,marginBottom:20 }}>Editing: <strong style={{ color:T.laxmi,fontFamily:"monospace" }}>{editModal.username}</strong></div>
            <div style={{ marginBottom:12 }}><label style={lbl}>Full Name <span style={{ color:T.red }}>*</span></label><input type="text" value={editForm.name} onChange={sef("name")} style={inp}/></div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Role</label>
              <select value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value,branch:roleUsesAllBranch(e.target.value)?"ALL":(f.branch==="ALL"?defaultBranchSlug:f.branch)}))} style={{ ...inp,cursor:"pointer" }}>
                <option value="office_admin">Office Admin (All Hospitals)</option>
                <option value="branch_admin">Branch Admin (Single Branch)</option>
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Branch</label>
              {roleUsesAllBranch(editForm.role)
                ? <div style={{ padding:"9px 13px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,display:"flex",gap:8 }}><Pill color={T.laxmi}>{ALL_HOSPITALS_LABEL}</Pill></div>
                : <select value={editForm.branch} onChange={sef("branch")} style={{ ...inp,cursor:"pointer" }}>{branches.map(b=><option key={b.slug} value={b.slug}>{b.name}</option>)}</select>}
            </div>
            <div style={{ borderTop:`1px solid ${T.border}`,margin:"18px 0 14px",fontSize:11,color:T.dim,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",paddingTop:14 }}>
              Reset Password <span style={{ color:T.dimmer,textTransform:"none",fontWeight:400 }}>(leave blank to keep current)</span>
            </div>
            {[["New Password","newPass"],["Confirm New Password","confirmNewPass"]].map(([l,k]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={lbl}>{l}</label>
                <div style={{ position:"relative" }}>
                  <input type={showEditPass?"text":"password"} placeholder="••••••••" value={editForm[k]||""} onChange={sef(k)} style={{ ...inp,paddingRight:52 }}/>
                  {k==="newPass" && <button type="button" onClick={()=>setShowEditPass(p=>!p)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:11,fontWeight:600 }}>{showEditPass?"HIDE":"SHOW"}</button>}
                </div>
              </div>
            ))}
            {editForm.newPass && editForm.newPass!==editForm.confirmNewPass && <div style={{ color:T.red,fontSize:12,marginBottom:10 }}>Passwords do not match</div>}
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:18 }}>
              <button onClick={()=>setEditModal(null)} style={{ padding:"9px 18px",borderRadius:8,background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={loading} style={{ padding:"9px 18px",borderRadius:8,background:T.laxmi,color:"#000",border:"none",fontWeight:800,cursor:"pointer",opacity:loading?0.7:1 }}>{loading?"Saving...":"Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:T.surface,borderRadius:16,padding:28,width:400,border:`1px solid ${confirmModal.type==="delete"?T.red:confirmModal.type==="deactivate"?T.amber:T.green}44`,boxShadow:SD }}>
            <div style={{ textAlign:"center",marginBottom:16 }}>
              <div style={{ fontSize:44,marginBottom:8 }}>{confirmModal.type==="delete"?"🗑️":confirmModal.type==="deactivate"?"⏸️":"▶️"}</div>
              <div style={{ fontSize:16,fontWeight:900,color:T.white }}>
                {confirmModal.type==="delete"?"Permanently Delete User?":confirmModal.type==="deactivate"?"Deactivate User?":"Reactivate User?"}
              </div>
            </div>
            <div style={{ background:T.bg,borderRadius:10,padding:"12px 16px",marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.white,marginBottom:4 }}>{confirmModal.user.name}</div>
              <div style={{ fontSize:12,color:T.dim,fontFamily:"monospace" }}>{confirmModal.user.username}</div>
              <div style={{ marginTop:8,fontSize:12,color:T.dim }}>
                {confirmModal.type==="delete"?"⚠️ This action is permanent and cannot be undone.":confirmModal.type==="deactivate"?"This will block the user from logging in.":"This will restore the user's login access."}
              </div>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmModal(null)} style={{ padding:"9px 18px",borderRadius:8,background:"transparent",border:`1px solid ${T.border2}`,color:T.dim,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={loading} style={{ padding:"9px 20px",borderRadius:8,border:"none",fontWeight:800,cursor:"pointer",opacity:loading?0.7:1,background:confirmModal.type==="delete"?T.red:confirmModal.type==="deactivate"?T.amber:T.green,color:confirmModal.type==="delete"?"#fff":"#000" }}>
                {loading?"Processing...":confirmModal.type==="delete"?"Yes, Delete":confirmModal.type==="deactivate"?"Yes, Deactivate":"Yes, Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}