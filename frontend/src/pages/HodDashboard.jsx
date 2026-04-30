import { useState } from "react";

const DEPARTMENTS = ["Billing", "Uploading", "Query", "OPD", "Intimation"];
const BILLING_TASK_TYPES = ["Generate Bill", "Discharge Summary", "Reports", "Medical History", "Medicines"];

const T = {
  bg:"#f0f4f8", surface:"#ffffff", surfaceAlt:"#f7fafc",
  topbar:"#1e3a5f", topbarText:"#ffffff",
  primary:"#1e7bbf", primaryDark:"#155d99", primaryLight:"#e8f4fd",
  border:"#dde8f0", borderLight:"#eef4f9",
  text:"#1a2e45", textMid:"#4a6585", textLight:"#7a9ab8", textMuted:"#a0b8cc",
  sectionIcon:"#2a7dc4",
  danger:"#e53e3e", dangerBg:"#fff5f5", dangerBorder:"#fc8181",
  success:"#2f855a", successBg:"#f0fff4", successBorder:"#68d391",
  warning:"#b7791f",
};

const DEPT_ACCENT = { Billing:"#1e7bbf", Uploading:"#6b48d4", Query:"#b7791f", OPD:"#2f855a", Intimation:"#c05621" };
const DEPT_ICONS  = { Billing:"₹", Uploading:"↑", Query:"?", OPD:"⚕", Intimation:"📋" };

const STATUS_CFG = {
  pending:       { bg:"#fffbeb", text:"#b7791f", border:"#f6d860" },
  "in-progress": { bg:"#ebf8ff", text:"#1e7bbf", border:"#90cdf4" },
  completed:     { bg:"#f0fff4", text:"#2f855a", border:"#68d391" },
  overdue:       { bg:"#fff5f5", text:"#c53030", border:"#fc8181" },
};
const PRIORITY_COLOR = { low:"#718096", medium:"#b7791f", high:"#c53030" };

const MOCK_EMPLOYEES = {
  Billing:    [
    { id:"EMP001", name:"Priya Sharma",  username:"priya.sharma", email:"priya@sangihospital.com",  role:"Billing Executive",    department:"Billing",    taskCount:8  },
    { id:"EMP002", name:"Rahul Mehta",   username:"rahul.mehta",  email:"rahul@sangihospital.com",  role:"Senior Biller",        department:"Billing",    taskCount:12 },
    { id:"EMP003", name:"Sunita Verma",  username:"sunita.v",     email:"sunita@sangihospital.com", role:"Billing Executive",    department:"Billing",    taskCount:5  },
  ],
  Uploading:  [
    { id:"EMP004", name:"Amit Kumar",    username:"amit.k",       email:"amit@sangihospital.com",   role:"Data Entry Operator",  department:"Uploading",  taskCount:14 },
    { id:"EMP005", name:"Neha Singh",    username:"neha.s",       email:"neha@sangihospital.com",   role:"Upload Specialist",    department:"Uploading",  taskCount:9  },
  ],
  Query:      [
    { id:"EMP006", name:"Deepak Joshi",  username:"deepak.j",     email:"deepak@sangihospital.com", role:"Query Handler",        department:"Query",      taskCount:6  },
    { id:"EMP007", name:"Kavita Rao",    username:"kavita.r",     email:"kavita@sangihospital.com", role:"Senior Query Analyst", department:"Query",      taskCount:11 },
  ],
  OPD:        [
    { id:"EMP008", name:"Manish Gupta",  username:"manish.g",     email:"manish@sangihospital.com", role:"OPD Coordinator",      department:"OPD",        taskCount:7  },
  ],
  Intimation: [
    { id:"EMP009", name:"Pooja Nair",    username:"pooja.n",      email:"pooja@sangihospital.com",  role:"Intimation Officer",   department:"Intimation", taskCount:10 },
    { id:"EMP010", name:"Sanjay Patel",  username:"sanjay.p",     email:"sanjay@sangihospital.com", role:"Intimation Executive", department:"Intimation", taskCount:3  },
  ],
};

const MOCK_TASKS_INIT = [
  { id:"T001", employeeId:"EMP001", employeeName:"Priya Sharma", taskType:"Generate Bill",     patientId:"PT-10234", patientType:"TPA",  priority:"high",   dueDate:"2026-04-24", status:"pending",     notes:"Urgent TPA claim"         },
  { id:"T002", employeeId:"EMP002", employeeName:"Rahul Mehta",  taskType:"Discharge Summary", patientId:"PT-10198", patientType:"Card", priority:"medium", dueDate:"2026-04-25", status:"in-progress", notes:""                         },
  { id:"T003", employeeId:"EMP003", employeeName:"Sunita Verma", taskType:"Reports",           patientId:"PT-10301", patientType:"TPA",  priority:"low",    dueDate:"2026-04-23", status:"overdue",     notes:"Follow up with insurance" },
  { id:"T004", employeeId:"EMP001", employeeName:"Priya Sharma", taskType:"Medicines",         patientId:"PT-10222", patientType:"Card", priority:"medium", dueDate:"2026-04-26", status:"completed",   notes:""                         },
  { id:"T005", employeeId:"EMP002", employeeName:"Rahul Mehta",  taskType:"Medical History",   patientId:"PT-10189", patientType:"TPA",  priority:"high",   dueDate:"2026-04-24", status:"pending",     notes:"Priority case"            },
];

const MOCK_REVIEWS_INIT = [
  { id:"R001", employeeId:"EMP001", employeeName:"Priya Sharma", period:"weekly",  rating:4, performanceScore:"88/100", comments:"Excellent performance, handles TPA cases efficiently.", submittedAt:"2026-04-20" },
  { id:"R002", employeeId:"EMP002", employeeName:"Rahul Mehta",  period:"monthly", rating:5, performanceScore:"95/100", comments:"Outstanding work on billing accuracy.",                submittedAt:"2026-04-15" },
];

export default function HodDashboard({ currentUser = { name: "Dr. Admin" }, onLogout }) {
  const [activeDept, setActiveDept] = useState("Billing");
  const [activeView, setActiveView] = useState("tasks");
  const [employees,  setEmployees]  = useState(MOCK_EMPLOYEES["Billing"]);
  const [tasks,      setTasks]      = useState(MOCK_TASKS_INIT);
  const [reviews,    setReviews]    = useState(MOCK_REVIEWS_INIT);
  const [collapsed,  setCollapsed]  = useState(false);

  const [fEmp, setFEmp] = useState(""); const [fDate, setFDate] = useState(""); const [fStatus, setFStatus] = useState(""); const [fRange, setFRange] = useState("weekly");
  const [showTask, setShowTask] = useState(false); const [showEmp, setShowEmp] = useState(false); const [showReview, setShowReview] = useState(false); const [editTask, setEditTask] = useState(null); const [showLogout, setShowLogout] = useState(false);
  const [taskF, setTaskF] = useState({ employeeId:"", taskType:"", patientId:"", patientType:"TPA", priority:"medium", dueDate:"", notes:"" });
  const [empF,  setEmpF]  = useState({ fullName:"", username:"", department:"Billing", empId:"", email:"", password:"", confirmPassword:"" });
  const [empErr, setEmpErr] = useState("");
  const [revF,  setRevF]  = useState({ employeeId:"", period:"weekly", rating:5, comments:"", performanceScore:"" });
  const [nextT, setNextT] = useState(6); const [nextE, setNextE] = useState(11); const [nextR, setNextR] = useState(3);

  function switchDept(d) { setActiveDept(d); setEmployees(MOCK_EMPLOYEES[d]||[]); setActiveView("tasks"); setFEmp(""); setFDate(""); setFStatus(""); }

  const deptTasks = tasks.filter(t => {
    if (!(MOCK_EMPLOYEES[activeDept]||[]).some(e=>e.id===t.employeeId)) return false;
    if (fEmp    && t.employeeId!==fEmp)    return false;
    if (fStatus && t.status!==fStatus)     return false;
    if (fDate   && t.dueDate!==fDate)      return false;
    return true;
  });

  const pendingCnt = deptTasks.filter(t=>t.status==="pending").length;
  const overdueCnt = deptTasks.filter(t=>t.status==="overdue").length;
  const doneCnt    = deptTasks.filter(t=>t.status==="completed").length;
  const inProgCnt  = deptTasks.filter(t=>t.status==="in-progress").length;

  const empStats = employees.map(emp => {
    const et = tasks.filter(t=>t.employeeId===emp.id);
    const comp = et.filter(t=>t.status==="completed").length;
    return { ...emp, assigned:et.length, completed:comp, pending:et.filter(t=>t.status==="pending").length, overdue:et.filter(t=>t.status==="overdue").length, pct:et.length?Math.round(comp/et.length*100):0 };
  });

  function submitTask(e) {
    e.preventDefault();
    const emp = employees.find(em=>em.id===taskF.employeeId);
    setTasks(p=>[...p,{ id:`T${String(nextT).padStart(3,"0")}`, ...taskF, employeeName:emp?.name||taskF.employeeId, status:"pending" }]);
    setNextT(n=>n+1); setShowTask(false); setTaskF({ employeeId:"", taskType:"", patientId:"", patientType:"TPA", priority:"medium", dueDate:"", notes:"" });
  }
  function updateTask(id, upd) { setTasks(p=>p.map(t=>t.id===id?{...t,...upd}:t)); setEditTask(null); }
  function submitEmp(e) {
    e.preventDefault(); setEmpErr("");
    if (empF.password!==empF.confirmPassword) { setEmpErr("Passwords do not match."); return; }
    const d=empF.department;
    const ne={ id:empF.empId||`EMP${String(nextE).padStart(3,"0")}`, name:empF.fullName, username:empF.username, email:empF.email, role:"Staff", department:d, taskCount:0 };
    MOCK_EMPLOYEES[d]=[...(MOCK_EMPLOYEES[d]||[]),ne];
    if(d===activeDept) setEmployees(MOCK_EMPLOYEES[d]);
    setNextE(n=>n+1); setShowEmp(false); setEmpF({ fullName:"", username:"", department:"Billing", empId:"", email:"", password:"", confirmPassword:"" });
  }
  function submitReview(e) {
    e.preventDefault();
    const emp=employees.find(em=>em.id===revF.employeeId);
    setReviews(p=>[...p,{ id:`R${String(nextR).padStart(3,"0")}`, ...revF, employeeName:emp?.name||revF.employeeId, submittedAt:new Date().toISOString().split("T")[0] }]);
    setNextR(n=>n+1); setShowReview(false); setRevF({ employeeId:"", period:"weekly", rating:5, comments:"", performanceScore:"" });
  }

  const inp  = (full) => ({ width:full?"100%":"auto", background:T.surface, border:`1px solid ${T.border}`, color:T.text, padding:"9px 12px", borderRadius:6, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" });
  const sel  = (full) => ({ ...inp(full), cursor:"pointer" });
  const lbl  = ()     => ({ display:"block", fontSize:10, letterSpacing:"1.5px", color:T.textLight, textTransform:"uppercase", marginBottom:5, fontWeight:600 });

  function Btn({ variant="default", onClick, type="button", children, sm }) {
    const base = { padding:sm?"5px 11px":"9px 18px", borderRadius:7, fontSize:sm?11:13, fontFamily:"inherit", cursor:"pointer", border:"1px solid", display:"inline-flex", alignItems:"center", gap:6, fontWeight:600, transition:"all 0.15s" };
    const v = { primary:{background:T.primary,borderColor:T.primaryDark,color:"#fff"}, ghost:{background:"transparent",borderColor:T.border,color:T.textMid}, danger:{background:T.dangerBg,borderColor:T.dangerBorder,color:T.danger}, success:{background:T.successBg,borderColor:T.successBorder,color:T.success}, default:{background:T.surface,borderColor:T.border,color:T.textMid} };
    return <button type={type} onClick={onClick} style={{...base,...(v[variant]||v.default)}}>{children}</button>;
  }

  function Badge({ status }) {
    const c=STATUS_CFG[status]||{bg:"#f7fafc",text:"#4a6585",border:T.border};
    return <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:c.bg,color:c.text,border:`1px solid ${c.border}` }}>{status}</span>;
  }

  function SectionCard({ icon, title, subtitle, children }) {
    return (
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden", marginBottom:18 }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.borderLight}`, display:"flex", alignItems:"center", gap:12, background:T.surfaceAlt }}>
          <div style={{ width:34, height:34, borderRadius:8, background:T.primaryLight, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:T.sectionIcon }}>{icon}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:T.textLight, marginTop:1 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ padding:"18px 20px" }}>{children}</div>
      </div>
    );
  }

  function Modal({ title, icon, onClose, children, width=520 }) {
    return (
      <div style={{ position:"fixed",inset:0,background:"rgba(30,58,95,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)" }} onClick={onClose}>
        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,width,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(30,58,95,0.2)" }} onClick={e=>e.stopPropagation()}>
          <div style={{ padding:"15px 22px",background:T.topbar,borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:16 }}>{icon}</span>
            <span style={{ fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"0.3px" }}>{title}</span>
          </div>
          <div style={{ padding:"22px" }}>{children}</div>
        </div>
      </div>
    );
  }

  const FR = ({ label, children }) => <div style={{ marginBottom:14 }}><label style={lbl()}>{label}</label>{children}</div>;
  const ModalFooter = ({ onCancel, submitLabel }) => (
    <div style={{ display:"flex",gap:10,justifyContent:"flex-end",paddingTop:14,borderTop:`1px solid ${T.border}`,marginTop:4 }}>
      <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      <Btn variant="primary" type="submit">{submitLabel}</Btn>
    </div>
  );

  function StatsRow({ items }) {
    return (
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${items.length},1fr)`, gap:14, marginBottom:20 }}>
        {items.map(({label,value,color,icon})=>(
          <div key={label} style={{ background:T.surface,border:`1px solid ${T.border}`,borderLeft:`3px solid ${color}`,borderRadius:8,padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:8,background:`${color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color,flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:24,fontWeight:700,color,lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11,color:T.textLight,marginTop:3,fontWeight:500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function THead({ cols }) {
    return (
      <thead>
        <tr style={{ background:T.surfaceAlt }}>
          {cols.map(c=><th key={c} style={{ padding:"10px 14px",textAlign:"left",fontSize:10,letterSpacing:"1.5px",color:T.textLight,textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,fontWeight:700,whiteSpace:"nowrap" }}>{c}</th>)}
        </tr>
      </thead>
    );
  }

  const tdS = (bold,light,mono) => ({ padding:"11px 14px",borderBottom:`1px solid ${T.borderLight}`,color:bold?T.text:light?T.textMuted:T.textMid,fontWeight:bold?600:400,fontFamily:mono?"'Courier New',monospace":"inherit",fontSize:13,verticalAlign:"middle" });

  // ── Views
  function TasksView() {
    return (
      <>
        <StatsRow items={[
          { label:"Total Tasks",  value:deptTasks.length, color:T.primary,  icon:"📋" },
          { label:"Pending",      value:pendingCnt,       color:"#b7791f",  icon:"⏳" },
          { label:"In Progress",  value:inProgCnt,        color:"#1e7bbf",  icon:"▶"  },
          { label:"Completed",    value:doneCnt,          color:"#2f855a",  icon:"✓"  },
          { label:"Overdue",      value:overdueCnt,       color:"#c53030",  icon:"⚠"  },
        ]} />
        <SectionCard icon="📋" title={`Task List — ${activeDept}`} subtitle="Assign and track department tasks">
          <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
            <select style={sel()} value={fEmp} onChange={e=>setFEmp(e.target.value)}><option value="">All Employees</option>{employees.map(em=><option key={em.id} value={em.id}>{em.name}</option>)}</select>
            <select style={sel()} value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">All Status</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="overdue">Overdue</option></select>
            <input type="date" style={inp()} value={fDate} onChange={e=>setFDate(e.target.value)} />
            <div style={{ marginLeft:"auto" }}><Btn variant="primary" onClick={()=>setShowTask(true)}>+ Assign Task</Btn></div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <THead cols={["Task ID","Employee","Task Type","Patient ID","Type","Priority","Due Date","Status","Actions"]} />
              <tbody>
                {deptTasks.length===0
                  ? <tr><td colSpan={9} style={{ padding:48,textAlign:"center",color:T.textMuted,fontSize:13 }}>No tasks found. Click "Assign Task" to get started.</td></tr>
                  : deptTasks.map(t=>(
                    <tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background=T.primaryLight} onMouseLeave={e=>e.currentTarget.style.background=""} style={{ transition:"background 0.1s" }}>
                      <td style={tdS(false,true,true)}>#{t.id}</td>
                      <td style={tdS(true)}>{t.employeeName}</td>
                      <td style={tdS()}>{t.taskType}</td>
                      <td style={tdS(false,false,true)}>{t.patientId||"—"}</td>
                      <td style={tdS()}>
                        <span style={{ padding:"2px 9px",borderRadius:4,fontSize:11,fontWeight:600,background:t.patientType==="TPA"?"#ebf8ff":"#f3f0ff",color:t.patientType==="TPA"?"#1e7bbf":"#553c9a",border:`1px solid ${t.patientType==="TPA"?"#90cdf4":"#b794f4"}` }}>{t.patientType}</span>
                      </td>
                      <td style={tdS()}>
                        <span style={{ display:"inline-flex",alignItems:"center",gap:5,color:PRIORITY_COLOR[t.priority],fontWeight:600,fontSize:12 }}>
                          <span style={{ width:7,height:7,borderRadius:"50%",background:PRIORITY_COLOR[t.priority],display:"inline-block" }} />{t.priority}
                        </span>
                      </td>
                      <td style={tdS(false,true,true)}>{t.dueDate||"—"}</td>
                      <td style={tdS()}><Badge status={t.status} /></td>
                      <td style={tdS()}>
                        <div style={{ display:"flex",gap:6 }}>
                          {t.status!=="completed"&&<Btn variant="success" sm onClick={()=>updateTask(t.id,{status:"completed"})}>✓ Done</Btn>}
                          <Btn variant="ghost" sm onClick={()=>setEditTask(t)}>Edit</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </>
    );
  }

  function AnalyticsView() {
    const tot=empStats.reduce((a,e)=>a+e.assigned,0), com=empStats.reduce((a,e)=>a+e.completed,0), pen=empStats.reduce((a,e)=>a+e.pending,0), avg=empStats.length?Math.round(empStats.reduce((a,e)=>a+e.pct,0)/empStats.length):0;
    return (
      <>
        <StatsRow items={[{label:"Total Assigned",value:tot,color:T.primary,icon:"📁"},{label:"Completed",value:com,color:"#2f855a",icon:"✓"},{label:"Pending",value:pen,color:"#b7791f",icon:"⏳"},{label:"Avg Completion",value:`${avg}%`,color:"#553c9a",icon:"↗"}]} />
        <SectionCard icon="↗" title="Employee Performance" subtitle="Task completion analytics by staff member">
          <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
            <select style={sel()} value={fRange} onChange={e=>setFRange(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
            <select style={sel()} value={fEmp} onChange={e=>setFEmp(e.target.value)}><option value="">All Employees</option>{employees.map(em=><option key={em.id} value={em.id}>{em.name}</option>)}</select>
            <div style={{ marginLeft:"auto" }}><Btn variant="ghost">↓ Export Report</Btn></div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <THead cols={["Employee","Assigned","Completed","Pending","Overdue","Completion %"]} />
              <tbody>
                {empStats.length===0
                  ? <tr><td colSpan={6} style={{ padding:48,textAlign:"center",color:T.textMuted }}>No data available.</td></tr>
                  : empStats.map(emp=>(
                    <tr key={emp.id} onMouseEnter={e=>e.currentTarget.style.background=T.primaryLight} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <td style={tdS(true)}>{emp.name}</td>
                      <td style={tdS()}>{emp.assigned}</td>
                      <td style={{ ...tdS(),color:"#2f855a",fontWeight:600 }}>{emp.completed}</td>
                      <td style={{ ...tdS(),color:"#b7791f",fontWeight:600 }}>{emp.pending}</td>
                      <td style={{ ...tdS(),color:"#c53030",fontWeight:600 }}>{emp.overdue}</td>
                      <td style={tdS()}>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <div style={{ flex:1,height:7,background:T.borderLight,borderRadius:4,overflow:"hidden" }}>
                            <div style={{ width:`${emp.pct}%`,height:"100%",background:emp.pct>=80?"#2f855a":emp.pct>=50?"#b7791f":"#c53030",borderRadius:4,transition:"width 0.5s" }} />
                          </div>
                          <span style={{ fontSize:12,minWidth:34,color:T.text,fontWeight:700 }}>{emp.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </>
    );
  }

  function ReviewsView() {
    const dr=reviews.filter(r=>employees.some(e=>e.id===r.employeeId));
    return (
      <SectionCard icon="⭐" title={`Employee Reviews — ${activeDept}`} subtitle="Performance reviews submitted by HOD">
        <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:16 }}><Btn variant="primary" onClick={()=>setShowReview(true)}>+ Submit Review</Btn></div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <THead cols={["Employee","Period","Rating","Score","Comments","Submitted"]} />
            <tbody>
              {dr.length===0
                ? <tr><td colSpan={6} style={{ padding:48,textAlign:"center",color:T.textMuted }}>No reviews yet.</td></tr>
                : dr.map(rev=>(
                  <tr key={rev.id} onMouseEnter={e=>e.currentTarget.style.background=T.primaryLight} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={tdS(true)}>{rev.employeeName}</td>
                    <td style={tdS()}>
                      <span style={{ padding:"2px 9px",borderRadius:4,fontSize:11,fontWeight:600,background:rev.period==="weekly"?"#ebf8ff":"#f3f0ff",color:rev.period==="weekly"?"#1e7bbf":"#553c9a",border:`1px solid ${rev.period==="weekly"?"#90cdf4":"#b794f4"}` }}>{rev.period}</span>
                    </td>
                    <td style={{ ...tdS(),color:"#b7791f" }}>{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</td>
                    <td style={tdS(false,false,true)}>{rev.performanceScore||"—"}</td>
                    <td style={{ ...tdS(),maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{rev.comments}</td>
                    <td style={tdS(false,true,true)}>{rev.submittedAt}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }

  function EmployeesView() {
    const cols=[T.primary,"#6b48d4","#b7791f","#2f855a","#c05621"];
    return (
      <SectionCard icon="👥" title={`Staff Directory — ${activeDept}`} subtitle="All employees in this department">
        <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:18 }}><Btn variant="primary" onClick={()=>setShowEmp(true)}>+ Add Employee</Btn></div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14 }}>
          {employees.length===0
            ? <div style={{ padding:48,textAlign:"center",color:T.textMuted,gridColumn:"1/-1" }}>No employees found in this department.</div>
            : employees.map((emp,i)=>{
              const ec=cols[i%cols.length];
              return (
                <div key={emp.id}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(30,123,191,0.12)";e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}
                  style={{ background:T.surface,border:`1px solid ${T.border}`,borderLeft:`3px solid ${ec}`,borderRadius:8,padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:14,transition:"all 0.18s",cursor:"default" }}>
                  <div style={{ width:44,height:44,borderRadius:10,background:`${ec}14`,border:`1px solid ${ec}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:ec,flexShrink:0 }}>{emp.name?.[0]||"?"}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:14,color:T.text,fontWeight:700,marginBottom:2 }}>{emp.name}</div>
                    <div style={{ fontSize:11,color:T.textLight,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600,marginBottom:6 }}>{emp.role||"Staff"}</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
                      {emp.username && <div style={{ fontSize:12,color:T.textMid }}>@{emp.username}</div>}
                      {emp.email    && <div style={{ fontSize:12,color:T.textMid }}>{emp.email}</div>}
                      <div style={{ fontSize:11,color:T.textMuted,fontFamily:"'Courier New',monospace" }}>ID: {emp.id} · {emp.department}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:22,fontWeight:700,color:ec }}>{emp.taskCount}</div>
                    <div style={{ fontSize:10,color:T.textLight,letterSpacing:"1.5px",textTransform:"uppercase" }}>Tasks</div>
                  </div>
                </div>
              );
            })}
        </div>
      </SectionCard>
    );
  }

  return (
    <div style={{ display:"flex",height:"100vh",background:T.bg,color:T.text,fontFamily:"'Segoe UI','Helvetica Neue',Arial,sans-serif",overflow:"hidden" }}>
      <style>{`
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#f0f4f8;}
        ::-webkit-scrollbar-thumb{background:#b0c8e0;border-radius:4px;}
        input:focus,select:focus,textarea:focus{border-color:#1e7bbf!important;box-shadow:0 0 0 3px rgba(30,123,191,0.1)!important;outline:none;}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:0.45;}
        button:hover{filter:brightness(0.96);}
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width:collapsed?68:240,minWidth:collapsed?68:240,background:T.sidebarBg,borderRight:`1px solid ${T.sidebarBorder}`,display:"flex",flexDirection:"column",transition:"all 0.28s cubic-bezier(.4,0,.2,1)",overflow:"hidden",flexShrink:0 }}>
        <div style={{ background:T.topbar,padding:collapsed?"18px 0":"18px 18px",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",minHeight:72,gap:10 }}>
          {!collapsed&&<div><div style={{ fontSize:9,letterSpacing:"3px",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",marginBottom:2 }}>Sangi Hospital</div><div style={{ fontSize:16,fontWeight:700,color:"#fff" }}>HOD Panel</div></div>}
          {collapsed&&<div style={{ width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15 }}>S</div>}
          <button onClick={()=>setCollapsed(!collapsed)} style={{ width:26,height:26,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.22)",color:"#fff",borderRadius:5,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>{collapsed?"›":"‹"}</button>
        </div>

        {!collapsed&&(
          <div style={{ display:"flex",gap:6,padding:"10px 12px",background:T.surfaceAlt,borderBottom:`1px solid ${T.border}` }}>
            {[{v:pendingCnt,l:"Pend",c:"#b7791f"},{v:overdueCnt,l:"Over",c:"#c53030"},{v:doneCnt,l:"Done",c:"#2f855a"}].map(({v,l,c})=>(
              <div key={l} style={{ flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"7px 5px",textAlign:"center" }}>
                <div style={{ fontSize:15,fontWeight:700,color:c }}>{v}</div>
                <div style={{ fontSize:9,color:T.textLight,letterSpacing:"1px",textTransform:"uppercase",marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:collapsed?"12px 0 4px":"12px 16px 4px",fontSize:9,letterSpacing:"2px",color:T.textMuted,textTransform:"uppercase",fontWeight:700,textAlign:collapsed?"center":"left" }}>{collapsed?"·":"Departments"}</div>
        {DEPARTMENTS.map(d=>(
          <button key={d} onClick={()=>switchDept(d)} style={{ display:"flex",alignItems:"center",gap:10,padding:collapsed?"12px 0":"10px 16px",justifyContent:collapsed?"center":"flex-start",cursor:"pointer",background:activeDept===d?T.primaryLight:"transparent",borderLeft:activeDept===d?`3px solid ${DEPT_ACCENT[d]}`:"3px solid transparent",color:activeDept===d?DEPT_ACCENT[d]:T.textMid,fontSize:13,border:"none",width:"100%",textAlign:"left",fontFamily:"inherit",fontWeight:activeDept===d?600:400,transition:"all 0.12s" }}>
            <div style={{ width:26,height:26,borderRadius:7,background:activeDept===d?`${DEPT_ACCENT[d]}16`:T.borderLight,border:`1px solid ${activeDept===d?DEPT_ACCENT[d]+"35":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,color:DEPT_ACCENT[d] }}>{DEPT_ICONS[d]}</div>
            {!collapsed&&<span style={{ flex:1 }}>{d}</span>}
            {!collapsed&&activeDept===d&&deptTasks.length>0&&<span style={{ fontSize:10,background:`${DEPT_ACCENT[d]}14`,color:DEPT_ACCENT[d],borderRadius:10,padding:"1px 8px",border:`1px solid ${DEPT_ACCENT[d]}28` }}>{deptTasks.length}</span>}
          </button>
        ))}

        <div style={{ padding:collapsed?"14px 0 4px":"14px 16px 4px",fontSize:9,letterSpacing:"2px",color:T.textMuted,textTransform:"uppercase",fontWeight:700,textAlign:collapsed?"center":"left" }}>{collapsed?"·":"Views"}</div>
        {[{id:"tasks",icon:"☑",l:"Tasks"},{id:"analytics",icon:"↗",l:"Analytics"},{id:"reviews",icon:"★",l:"Reviews"},{id:"employees",icon:"👥",l:"Employees"}].map(v=>(
          <button key={v.id} onClick={()=>setActiveView(v.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 16px",justifyContent:collapsed?"center":"flex-start",cursor:"pointer",background:activeView===v.id?T.primaryLight:"transparent",color:activeView===v.id?T.primary:T.textMid,fontSize:13,border:"none",width:"100%",fontFamily:"inherit",fontWeight:activeView===v.id?600:400,borderLeft:activeView===v.id?`3px solid ${T.primary}`:"3px solid transparent",transition:"all 0.12s" }}>
            <span style={{ fontSize:14,opacity:activeView===v.id?1:0.5,flexShrink:0 }}>{v.icon}</span>
            {!collapsed&&v.l}
          </button>
        ))}

        <div style={{ marginTop:"auto",borderTop:`1px solid ${T.border}`,padding:collapsed?"12px 0":"14px 16px",display:"flex",flexDirection:"column",gap:10 }}>
          {!collapsed&&(
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.surfaceAlt,borderRadius:8,border:`1px solid ${T.border}` }}>
              <div style={{ width:34,height:34,borderRadius:9,background:T.primaryLight,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:T.primary,fontWeight:700,flexShrink:0 }}>{(currentUser?.name||"H")[0]}</div>
              <div>
                <div style={{ fontSize:12,color:T.text,fontWeight:700 }}>{currentUser?.name||"HOD"}</div>
                <div style={{ fontSize:10,color:T.textLight,textTransform:"uppercase",letterSpacing:"1px",marginTop:1 }}>HOD · {activeDept}</div>
              </div>
            </div>
          )}
          <button onClick={()=>setShowLogout(true)} style={{ display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-start",gap:8,padding:collapsed?"9px 0":"9px 12px",background:T.dangerBg,border:`1px solid ${T.dangerBorder}`,borderRadius:7,color:T.danger,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600,width:"100%",transition:"all 0.15s" }}>
            <span>⎋</span>{!collapsed&&"Logout"}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ background:T.topbar,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:64,flexShrink:0 }}>
          <div>
            <div style={{ fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:"2px",textTransform:"uppercase",marginBottom:3 }}>HOD Dashboard / {activeDept} / {activeView}</div>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:10 }}>
              {activeDept} Department
              <span style={{ padding:"2px 12px",borderRadius:20,fontSize:10,background:"rgba(255,255,255,0.15)",color:"#fff",letterSpacing:"1px",fontWeight:600 }}>{activeView}</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.55)" }}>{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</div>
            <div style={{ background:"rgba(255,255,255,0.14)",border:"1px solid rgba(255,255,255,0.2)",padding:"5px 14px",borderRadius:6,fontSize:12,color:"#fff",fontWeight:600 }}>Laxmi Nagar Branch</div>
            <button onClick={()=>setShowLogout(true)} style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",padding:"6px 14px",borderRadius:6,fontSize:12,color:"#fff",cursor:"pointer",fontWeight:600,fontFamily:"inherit" }}>Logout</button>
          </div>
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"22px 24px" }}>
          {activeView==="tasks"     && <TasksView />}
          {activeView==="analytics" && <AnalyticsView />}
          {activeView==="reviews"   && <ReviewsView />}
          {activeView==="employees" && <EmployeesView />}
        </div>
      </div>

      {/* Assign Task */}
      {showTask&&(
        <Modal title={`Assign Task — ${activeDept}`} icon="📋" onClose={()=>setShowTask(false)}>
          <form onSubmit={submitTask}>
            <FR label="Employee *"><select style={sel(true)} value={taskF.employeeId} onChange={e=>setTaskF({...taskF,employeeId:e.target.value})} required><option value="">Select Employee</option>{employees.map(em=><option key={em.id} value={em.id}>{em.name}</option>)}</select></FR>
            {activeDept==="Billing"?(
              <><FR label="Task Type *"><select style={sel(true)} value={taskF.taskType} onChange={e=>setTaskF({...taskF,taskType:e.target.value})} required><option value="">Select Task</option>{BILLING_TASK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></FR>
              <div style={{ display:"flex",gap:12 }}>
                <div style={{ flex:1 }}><FR label="Patient ID"><input style={inp(true)} value={taskF.patientId} onChange={e=>setTaskF({...taskF,patientId:e.target.value})} placeholder="PT-00123" /></FR></div>
                <div style={{ flex:1 }}><FR label="Patient Type"><select style={sel(true)} value={taskF.patientType} onChange={e=>setTaskF({...taskF,patientType:e.target.value})}><option value="TPA">TPA</option><option value="Card">Card</option></select></FR></div>
              </div></>
            ):(
              <FR label="Task Type *"><input style={inp(true)} value={taskF.taskType} onChange={e=>setTaskF({...taskF,taskType:e.target.value})} placeholder="Enter task type" required /></FR>
            )}
            <div style={{ display:"flex",gap:12 }}>
              <div style={{ flex:1 }}><FR label="Priority"><select style={sel(true)} value={taskF.priority} onChange={e=>setTaskF({...taskF,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></FR></div>
              <div style={{ flex:1 }}><FR label="Due Date"><input type="date" style={inp(true)} value={taskF.dueDate} onChange={e=>setTaskF({...taskF,dueDate:e.target.value})} /></FR></div>
            </div>
            <FR label="Notes"><textarea style={{ ...inp(true),resize:"vertical",minHeight:70 }} value={taskF.notes} onChange={e=>setTaskF({...taskF,notes:e.target.value})} placeholder="Optional notes..." /></FR>
            <ModalFooter onCancel={()=>setShowTask(false)} submitLabel="Assign Task" />
          </form>
        </Modal>
      )}

      {/* Edit Task */}
      {editTask&&(
        <Modal title={`Update Task #${editTask.id}`} icon="✎" onClose={()=>setEditTask(null)}>
          <form onSubmit={e=>{e.preventDefault();updateTask(editTask.id,{status:editTask.status,priority:editTask.priority,notes:editTask.notes});}}>
            <FR label="Status"><select style={sel(true)} value={editTask.status} onChange={e=>setEditTask({...editTask,status:e.target.value})}><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="overdue">Overdue</option></select></FR>
            <FR label="Priority"><select style={sel(true)} value={editTask.priority} onChange={e=>setEditTask({...editTask,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></FR>
            <FR label="Notes"><textarea style={{ ...inp(true),resize:"vertical",minHeight:70 }} value={editTask.notes||""} onChange={e=>setEditTask({...editTask,notes:e.target.value})} /></FR>
            <ModalFooter onCancel={()=>setEditTask(null)} submitLabel="Save Changes" />
          </form>
        </Modal>
      )}

      {/* Add Employee */}
      {showEmp&&(
        <Modal title="Add New Employee" icon="👤" onClose={()=>setShowEmp(false)}>
          <form onSubmit={submitEmp}>
            <div style={{ display:"flex",gap:12 }}>
              <div style={{ flex:1 }}><FR label="Full Name *"><input style={inp(true)} value={empF.fullName} onChange={e=>setEmpF({...empF,fullName:e.target.value})} placeholder="e.g. Priya Sharma" required /></FR></div>
              <div style={{ flex:1 }}><FR label="Username *"><input style={inp(true)} value={empF.username} onChange={e=>setEmpF({...empF,username:e.target.value})} placeholder="e.g. priya.sharma" required /></FR></div>
            </div>
            <div style={{ display:"flex",gap:12 }}>
              <div style={{ flex:1 }}><FR label="Department *"><select style={sel(true)} value={empF.department} onChange={e=>setEmpF({...empF,department:e.target.value})} required>{DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}</select></FR></div>
              <div style={{ flex:1 }}><FR label="Employee ID"><input style={inp(true)} value={empF.empId} onChange={e=>setEmpF({...empF,empId:e.target.value})} placeholder={`EMP${String(nextE).padStart(3,"0")}`} /></FR></div>
            </div>
            <FR label="Email Address *"><input type="email" style={inp(true)} value={empF.email} onChange={e=>setEmpF({...empF,email:e.target.value})} placeholder="employee@sangihospital.com" required /></FR>
            <div style={{ display:"flex",gap:12 }}>
              <div style={{ flex:1 }}><FR label="Password *"><input type="password" style={inp(true)} value={empF.password} onChange={e=>setEmpF({...empF,password:e.target.value})} placeholder="Min. 8 characters" required minLength={8} /></FR></div>
              <div style={{ flex:1 }}><FR label="Confirm Password *"><input type="password" style={inp(true)} value={empF.confirmPassword} onChange={e=>setEmpF({...empF,confirmPassword:e.target.value})} placeholder="Repeat password" required /></FR></div>
            </div>
            {empErr&&<div style={{ background:T.dangerBg,border:`1px solid ${T.dangerBorder}`,color:T.danger,padding:"9px 14px",borderRadius:7,fontSize:12,marginBottom:12 }}>⚠ {empErr}</div>}
            <ModalFooter onCancel={()=>setShowEmp(false)} submitLabel="Add Employee" />
          </form>
        </Modal>
      )}

      {/* Review */}
      {showReview&&(
        <Modal title="Submit Employee Review" icon="⭐" onClose={()=>setShowReview(false)}>
          <form onSubmit={submitReview}>
            <FR label="Employee *"><select style={sel(true)} value={revF.employeeId} onChange={e=>setRevF({...revF,employeeId:e.target.value})} required><option value="">Select Employee</option>{employees.map(em=><option key={em.id} value={em.id}>{em.name}</option>)}</select></FR>
            <div style={{ display:"flex",gap:12 }}>
              <div style={{ flex:1 }}><FR label="Period"><select style={sel(true)} value={revF.period} onChange={e=>setRevF({...revF,period:e.target.value})}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></FR></div>
              <div style={{ flex:1 }}><FR label="Rating (1–5)"><select style={sel(true)} value={revF.rating} onChange={e=>setRevF({...revF,rating:Number(e.target.value)})}>{[1,2,3,4,5].map(r=><option key={r} value={r}>{"★".repeat(r)} ({r}/5)</option>)}</select></FR></div>
            </div>
            <FR label="Performance Score"><input style={inp(true)} value={revF.performanceScore} onChange={e=>setRevF({...revF,performanceScore:e.target.value})} placeholder="e.g. 87/100" /></FR>
            <FR label="Comments *"><textarea style={{ ...inp(true),resize:"vertical",minHeight:80 }} value={revF.comments} onChange={e=>setRevF({...revF,comments:e.target.value})} placeholder="Performance observations and feedback..." required /></FR>
            <ModalFooter onCancel={()=>setShowReview(false)} submitLabel="Submit Review" />
          </form>
        </Modal>
      )}

      {/* Logout */}
      {showLogout&&(
        <Modal title="Confirm Logout" icon="⎋" onClose={()=>setShowLogout(false)} width={380}>
          <div style={{ textAlign:"center",padding:"8px 0 4px" }}>
            <div style={{ fontSize:40,marginBottom:14 }}>👋</div>
            <div style={{ fontSize:14,fontWeight:700,color:T.text,marginBottom:8 }}>Are you sure you want to logout?</div>
            <div style={{ fontSize:13,color:T.textMid,marginBottom:22,lineHeight:1.6 }}>You'll be signed out of the HOD Panel.<br/>Any unsaved changes will be lost.</div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <Btn variant="ghost" onClick={()=>setShowLogout(false)}>Stay Logged In</Btn>
              <Btn variant="danger" onClick={()=>{setShowLogout(false);onLogout?.();}}>Logout</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}