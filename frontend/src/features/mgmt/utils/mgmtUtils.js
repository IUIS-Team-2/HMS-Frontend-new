import { REPORT_TEMPLATES } from "../../../constants/billing/reportTemplates";
import { SUMMARY_TYPES, RADIOLOGY_REPORT_TYPES_LIST } from "../constants/mgmtConstants";
import * as XLSX from "xlsx";

export const fmt     = n   => "₹" + Number(n||0).toLocaleString("en-IN");
export const fmtDt   = iso => iso ? new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
export const initials = (name="") => name.trim().split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
export const safeLoad = (key,fb) => { try { return JSON.parse(localStorage.getItem(key)||"null")||fb; } catch { return fb; } };
export const safeSave = (key,val) => { try { localStorage.setItem(key,JSON.stringify(val)); } catch {} };
export const statusColor = s => s==="High"?"#dc2626":s==="Low"?"#d97706":"#059669";
export const isRadiologyType = (t="") => RADIOLOGY_REPORT_TYPES_LIST.includes(t);
export const getRoleForDepartment = dept => ({ HOD:"hod", Billing:"billing", OPD:"opd", Intimation:"intimation", Query:"query", Uploading:"uploading", Receptionist:"receptionist", Doctor:"doctor", Nursing:"nursing", "Quality Analyst":"quality_analyst", Notes:"notes" }[String(dept||"").trim()] || "");

export const normalizeSummaryType = t => {
  if (!t) return "";
  const u = String(t).toUpperCase().trim();
  if (u.startsWith("REFER")||u==="REFERRED") return "REFER";
  if (u==="DAMA"||u==="DOPR"||u==="DOR"||u==="DAMA / DOPR")     return "DOPR";
  if (u==="LAMA")  return "LAMA";
  if (u==="DEATH"||u==="DIED") return "DEATH";
  if (u==="NORMAL"||u==="DISCHARGE") return "NORMAL";
  return SUMMARY_TYPES.includes(u) ? u : "";
};

export const resolveAdmNo = p => {
  const raw = p?.admissions?.[0]?.admNo ?? p?.admNo ?? 1;
  const clean = String(raw).replace(/\D/g,"");
  return clean || "1";
};

export const mapTaskFromApi = task => ({
  id: task.id, title: task.title, description: task.description||"",
  assignedToId: task.assigned_to, assignedTo: task.assigned_to_name||"—",
  department: task.department, priority: task.priority,
  dueDate: task.due_date ? task.due_date.slice(0,10) : "",
  createdAt: task.created_at, updatedAt: task.updated_at,
  completedAt: task.status==="Completed" ? task.updated_at : "",
  patientName:  task.patient_name||task.patient_names?.[0]||"",
  patientUhid:  task.patient_uhid||task.patient_uhids?.[0]||"",
  patientNames: task.patient_names||(task.patient_name?[task.patient_name]:[]),
  patientUhids: task.patient_uhids||(task.patient_uhid?[task.patient_uhid]:[]),
  createdBy: task.assigned_by_name||"—",
  remarks: task.remarks||task.notes||"",
  notes:   task.notes||task.remarks||"",
  hodNote: task.hod_note||task.review_note||task.hod_remarks||"",
  taskType: task.task_type||task.taskType||task.title||"",
  adm_no: task.adm_no||task.admNo||"",
  patient_uhid: task.patient_uhid||"",
  status: (()=>{
    const s = String(task.status||"").toLowerCase();
    if(s==="completed"||s==="done"||s==="approved") return "Completed";
    if(s==="in_progress"||s==="inprogress"||s==="in-progress") return "In Progress";
    if(s==="on_hold"||s==="onhold") return "On Hold";
    if(s==="pending") return "Pending";
    return task.status||"Pending";
  })(),
});

export const emptyPathReport = () => ({
  id: crypto.randomUUID(), reportName:"", reportType:"Haematology",
  date: new Date().toISOString().slice(0,10), orderedBy:"", amount:0,
  remarks:"", findings:"", impression:"",
  tests:[{ id:Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});
export const emptyRadReport = () => ({
  id: crypto.randomUUID(), reportName:"", reportType:"X-Ray",
  date: new Date().toISOString().slice(0,10), orderedBy:"", amount:0,
  remarks:"", findings:"", impression:"", tests:[],
});

export function exportTasksXLSX(tasks, filename="task_report.xlsx") {
  const wb = XLSX.utils.book_new();
  const headers = ["Task ID","Title","Assigned To","Department","Priority","Status","Due Date","Created Date","Description","Completed Date","Patient Name","Patient UHID"];
  const rows = tasks.map((t,i)=>[i+1,t.title,t.assignedTo,t.department,t.priority,t.status,t.dueDate||"—",t.createdAt?.split("T")[0]||"—",t.description||"—",t.completedAt?.split("T")[0]||"—",t.patientName||"—",t.patientUhid||"—"]);
  const aoa = [["SANGI HOSPITAL — TASK REPORT",...Array(11).fill("")],[`Generated: ${new Date().toLocaleDateString("en-IN")}`,...Array(11).fill("")],Array(12).fill(""),headers,...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [6,24,18,14,10,12,12,12,40,12,20,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws,"Task Report");
  XLSX.writeFile(wb,filename,{bookType:"xlsx"});
}

export function exportCSV(filename, rows, headers) {
  const csv = [headers.join(","),...rows.map(r=>headers.map(h=>`"${(r[h]??"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = filename; a.click();
}


export const LAB_TEMPLATES = Object.fromEntries(
  Object.values(REPORT_TEMPLATES)
    .filter(t => Array.isArray(t.tests) && t.tests.length > 0 && t.label)
    .map(t => [t.label, {
      tests: t.tests.map(row => ({ name: row.name, unit: row.unit || "", refRange: row.refRange || "", value: row.value || "" })),
      defaultRemarks: t.remarks || "",
    }])
);
