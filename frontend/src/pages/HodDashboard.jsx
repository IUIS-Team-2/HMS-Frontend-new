import { REPORT_TEMPLATES } from "../constants/billing/reportTemplates";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { apiService, BASE_URL } from "../services/apiService";
import { HOD_CSS } from "../features/hod/hodStyles";
import {
  DEPARTMENTS, DEPT_META, STATUS_META, SECTION_KEYS, SECTION_LABELS,
  SECTION_ICONS, TAB_MAP, INSURANCE_TYPES_LIST, TPA_DOCS, PDF_DOC_TYPES,
  RADIOLOGY_REPORT_TYPES,
} from "../features/hod/constants/hodConstants";
import {
  isRadiologyType, fmtRs, fmtDt, initials, calcTotals,
  backendStatusFromUi, hodTaskRowStatus, isHodTaskCompleted, isTaskRowCompleted,
  emptyPathReport, emptyRadReport,
  resolveAdmissionNoFromPatient, pickAdmissionRecord, normalizeExpiry,
} from "../features/hod/utils/hodUtils";
import { apiFetch } from "../features/hod/hooks/useHodData";
import useHodData from "../features/hod/hooks/useHodData";
import { useHodToast } from "../features/hod/hooks/useHodToast";

// Layout
import HodSidebar from "../features/hod/components/HodSidebar";
import HodHeader  from "../features/hod/components/HodHeader";

// Shared components
import StatusBadge          from "../features/hod/components/StatusBadge";
import PriorityBadge        from "../features/hod/components/PriorityBadge";
import SectionComment       from "../features/hod/components/SectionComment";
import PdfDownloadBtn       from "../features/hod/components/PdfDownloadBtn";
import AdmissionNoteForm    from "../features/hod/components/AdmissionNoteForm";
import HodMedSearchDropdown from "../features/hod/components/HodMedSearchDropdown";
import MedicineHistoryPicker from "../features/hod/components/MedicineHistoryPicker";
import PathologyReportCard  from "../features/hod/components/PathologyReportCard";
import RadiologyReportCard  from "../features/hod/components/RadiologyReportCard";

// Views
import OverviewView  from "../features/hod/components/views/OverviewView";
import AssignView    from "../features/hod/components/views/AssignView";
import DeptTasksView from "../features/hod/components/views/DeptTasksView";
import AnalyticsView from "../features/hod/components/views/AnalyticsView";
import ReviewsView   from "../features/hod/components/views/ReviewsView";
import EmployeesView from "../features/hod/components/views/EmployeesView";

// MyWork views (large — kept in separate files)
import MyWorkList    from "../features/hod/components/views/MyWorkList";
import MyWorkPatient from "../features/hod/components/views/MyWorkPatient";

// Modals
import AssignModal  from "../features/hod/components/modals/AssignModal";
import ReviewModal  from "../features/hod/components/modals/ReviewModal";
import SubmitModal  from "../features/hod/components/modals/SubmitModal";
import ReviewWorkModal from "../features/hod/components/modals/ReviewWorkModal";
import EditTaskModal from "../features/hod/components/modals/EditTaskModal";

const API_BASE = BASE_URL;

async function patchTaskUpdateStatus(taskId, body) {
  return apiFetch(`/tasks/${taskId}/update-status/`, { method:"PATCH", body:JSON.stringify(body) });
}

export default function HodDashboard({ currentUser, onLogout }) {
  const { toast, toasts } = useHodToast();
  const { loading, request } = useHodData(toast);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeView,  setActiveView]  = useState("overview");
  const [activeDept,  setActiveDept]  = useState("Billing");
  const [collapsed,   setCollapsed]   = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // ── Data state ─────────────────────────────────────────────────────────────
  const [allPatients,   setAllPatients]   = useState([]);
  const [employees,     setEmployees]     = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [hodOwnTasks,   setHodOwnTasks]   = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [analytics,     setAnalytics]     = useState(null);
  const [medicineMaster,setMedicineMaster]= useState([]);
  const [serviceMaster, setServiceMaster] = useState([]);

  // ── My Work state ──────────────────────────────────────────────────────────
  const [myWorkView,    setMyWorkView]    = useState("list");
  const [myWorkSel,     setMyWorkSel]     = useState(null);
  const [myActiveTab,   setMyActiveTab]   = useState("discharge");
  const [myShowConfirm, setMyShowConfirm] = useState(false);
  const [myEDis,        setMyEDis]        = useState({});
  const [myEMed,        setMyEMed]        = useState({});
  const [myESvc,        setMyESvc]        = useState([]);
  const [myELabRep,     setMyELabRep]     = useState([]);
  const [myEMedBill,    setMyEMedBill]    = useState([]);
  const [myEBilling,    setMyEBilling]    = useState({});
  const [myESaved,      setMyESaved]      = useState({});
  const [myRepFilter,   setMyRepFilter]   = useState("All");
  const [reportSearch,  setReportSearch]  = useState("");
  const [reportMaster]                    = useState([]);
  const [svcSearch,     setSvcSearch]     = useState({});
  const [myDischargeSummary,        setMyDischargeSummary]        = useState(null);
  const [myDischargeSummaryType,    setMyDischargeSummaryType]    = useState("NORMAL");
  const [myDischargeSummaryLoading, setMyDischargeSummaryLoading] = useState(false);

  // ── Review Work Modal state ────────────────────────────────────────────────
  const [reviewWorkModal,   setReviewWorkModal]   = useState(false);
  const [reviewWorkTask,    setReviewWorkTask]     = useState(null);
  const [reviewWorkPat,     setReviewWorkPat]      = useState(null);
  const [,                  setReviewWorkData]     = useState({});
  const [reviewWorkLoading, setReviewWorkLoading]  = useState(false);
  const [reviewSectionOpen, setReviewSectionOpen]  = useState({ discharge:true, admission:false, reports:false, medicines:false, billing:false });
  const [reviewEditMode,    setReviewEditMode]     = useState({});
  const [reviewComments,    setReviewComments]     = useState({});
  const [reviewRating,      setReviewRating]       = useState(5);
  const [reviewOverallNote, setReviewOverallNote]  = useState("");
  const [reviewSubmitting,  setReviewSubmitting]   = useState(false);
  const [reviewSaving,      setReviewSaving]       = useState({});
  const [rvEDis,            setRvEDis]             = useState({});
  const [rvEMed,            setRvEMed]             = useState({});
  const [rvELabRep,         setRvELabRep]          = useState([]);
  const [rvEMedBill,        setRvEMedBill]         = useState([]);
  const [rvESvc,            setRvESvc]             = useState([]);
  const [rvEBilling,        setRvEBilling]         = useState({});
  const [rvDischargeSummary,     setRvDischargeSummary]     = useState(null);
  const [rvDischargeSummaryType, setRvDischargeSummaryType] = useState("NORMAL");

  // ── Assignment modal state ─────────────────────────────────────────────────
  const [showAssignModal,    setShowAssignModal]    = useState(false);
  const [assignDept,         setAssignDept]         = useState("Billing");
  const [assignEmployee,     setAssignEmployee]     = useState("");
  const [assignPatients,     setAssignPatients]     = useState([]);
  const [assignPatientIds,   setAssignPatientIds]   = useState([]);
  const [assignPatientNames, setAssignPatientNames] = useState([]);
  const [assignPriority,     setAssignPriority]     = useState("Medium");
  const [assignDueDate,      setAssignDueDate]      = useState("");
  const [assignNotes,        setAssignNotes]        = useState("");
  const [patientSearch,      setPatientSearch]      = useState("");
  const [deptEmployees,      setDeptEmployees]      = useState([]);

  // ── Review / Submit / Edit modal state ────────────────────────────────────
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget,    setReviewTarget]    = useState(null);
  const [reviewForm,      setReviewForm]      = useState({ rating:5, comments:"", score:"", period:"weekly" });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTarget,    setSubmitTarget]    = useState(null);
  const [submitNote,      setSubmitNote]      = useState("");
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [editTask,        setEditTask]        = useState(null);
  const [editForm,        setEditForm]        = useState({ priority:"Medium", due_date:"", notes:"" });

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate,     setFilterDate]     = useState("");
  const [filterRange,    setFilterRange]    = useState("weekly");

  // ── API loaders ────────────────────────────────────────────────────────────
  const loadAllPatients = useCallback(async () => {
    const d = await request("/patients/");
    if (d) setAllPatients(Array.isArray(d) ? d : d.results||d.patients||[]);
  }, [request]);

  const loadEmployees = useCallback(async (dept=null) => {
    const effectiveDept = dept||activeDept||"Billing";
    const d = await request(`/hod/employees/?department=${encodeURIComponent(effectiveDept)}`);
    if (d) {
      const list = Array.isArray(d) ? d : d.employees||d.results||[];
      const next = [...list];
      const td = String(dept||"").trim().toLowerCase();
      const cd = String(currentUser?.department||currentUser?.dept||"").trim().toLowerCase();
      if (currentUser?.role==="hod" && td && cd===td && !next.some(e=>String(e.id)===String(currentUser.id)))
        next.unshift({ id:currentUser.id, name:currentUser.name||currentUser.full_name||currentUser.username, role:currentUser.role, employee_code:currentUser.employee_code||currentUser.employeeCode });
      setEmployees(next);
      return next;
    }
    return [];
  }, [request, currentUser, activeDept]);

  const loadTasks = useCallback(async () => {
    const p = new URLSearchParams({ department:activeDept });
    if (filterEmployee) p.append("employeeId", filterEmployee);
    if (filterDate)     p.append("date", filterDate);
    if (filterStatus)   p.append("status", filterStatus);
    const d = await request(`/hod/tasks/?${p}`);
    if (d) setTasks(Array.isArray(d) ? d : d.results||d.tasks||[]);
  }, [request, activeDept, filterEmployee, filterDate, filterStatus]);

  const loadHodOwnTasks = useCallback(async () => {
    const d = await request("/tasks/my-tasks/");
    if (d) setHodOwnTasks(Array.isArray(d) ? d : d.results||d.tasks||[]);
  }, [request]);

  const loadAnalytics = useCallback(async () => {
    const p = new URLSearchParams({ department:activeDept, range:filterRange });
    if (filterEmployee) p.append("employee_id", filterEmployee);
    const d = await request(`/hod/analytics/?${p}`);
    if (d) setAnalytics(d);
  }, [request, activeDept, filterRange, filterEmployee]);

  const loadReviews = useCallback(async () => {
    const d = await request(`/hod/reviews/?department=${encodeURIComponent(activeDept)}`);
    if (d) setReviews(Array.isArray(d) ? d : d.results||d.reviews||[]);
  }, [request, activeDept]);

  useEffect(() => {
    loadAllPatients(); loadEmployees(); loadTasks(); loadHodOwnTasks();
    apiService.getMedicineMaster().then(d=>setMedicineMaster(Array.isArray(d)?d:[])).catch(()=>{});
    apiService.getServiceMaster().then(d=>{ const m=Array.isArray(d)?d:[]; setServiceMaster(m); setMyESvc(prev=>prev.map(s=>{ if(Number(s.rate)===0&&s.name){ const match=m.find(x=>(x.description||x.name||"").toLowerCase()===s.name.toLowerCase()); if(match){ const rate=Number(match.rate||match.price||0); return{...s,rate,amount:Number(s.qty||1)*rate}; } } return s; })); }).catch(()=>{});
  }, []); 

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    loadTasks();
    loadEmployees(activeDept).then(l => setDeptEmployees(l));
  }, [activeDept, filterStatus, filterEmployee, filterDate]); 
  useEffect(() => { if(activeView==="analytics") loadAnalytics(); if(activeView==="reviews") loadReviews(); if(activeView==="employees") loadEmployees(activeDept).then(l=>setDeptEmployees(l)); }, [activeView, activeDept, filterRange]); 

  // ── Derived ────────────────────────────────────────────────────────────────
  const assignedUhids = new Set(tasks.filter(t=>!isTaskRowCompleted(t)).flatMap(t=>t.patientId?[t.patientId]:t.patient_uhids||(t.patient_uhid?[t.patient_uhid]:[])));
  const unassignedPatients    = allPatients.filter(p=>!assignedUhids.has(p.uhid));
  const filteredPatientSearch = unassignedPatients.filter(p=>!patientSearch||p.patientName?.toLowerCase().includes(patientSearch.toLowerCase())||p.uhid?.toLowerCase().includes(patientSearch.toLowerCase()));
  const pendingCount   = tasks.filter(t=>t.status==="pending").length;
  const overdueCount   = tasks.filter(t=>t.status==="overdue").length;
  const completedCount = tasks.filter(t=>t.status==="completed").length;
  const submittedCount = tasks.filter(t=>isTaskRowCompleted(t)).length;
  const deptColor      = DEPT_META[activeDept]?.color||"#10b981";

  const mapAdmissionServicesToUi = useCallback((services) => {
  if (!Array.isArray(services)) return [];

  return services.map(s => {
    const name = s.svcName || s.name || s.serviceName || "";

    const qty = Number(
      s.svcQty ??
      s.qty ??
      s.quantity ??
      1
    );

    let rate = Number(
      s.svcRate ??
      s.rate ??
      s.price ??
      s.serviceRate ??
      s.service_rate ??
      s.amount ??
      s.svcTot ??
      0
    );

    if (rate === 0 && name) {
      const m = serviceMaster.find(
        x => (x.description || x.name || "").toLowerCase() === name.toLowerCase()
      );

      if (m) {
        rate = Number(m.rate || m.price || 0);
      }
    }

    return {
      id: s.id || crypto.randomUUID(),
      name,
      category: s.svcCat || s.category || "",
      qty,
      rate,
      amount: qty * rate
    };
  });
}, [serviceMaster]);

  // ── Report helpers ─────────────────────────────────────────────────────────
  const updRvRep  = (ri,k,v) => setRvELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri][k]=v;return n;});
  const updRvTest = (ri,ti,k,v) => setRvELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests[ti][k]=v;return n;});
  const addRvTest = ri => setRvELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests.push({id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"});return n;});
  const delRvTest = (ri,ti) => setRvELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests.splice(ti,1);return n;});
  const updMyRep  = (ri,k,v) => setMyELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri][k]=v;return n;});
  const updMyTest = (ri,ti,k,v) => setMyELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests[ti][k]=v;return n;});
  const addMyTest = ri => setMyELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests.push({id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"});return n;});
  const delMyTest = (ri,ti) => setMyELabRep(p=>{const n=JSON.parse(JSON.stringify(p));n[ri].tests.splice(ti,1);return n;});
  const updMySvc  = (i,k,v) => setMyESvc(prev=>{const n=[...prev];n[i]={...n[i],[k]:v};if(k==="qty"||k==="rate")n[i].amount=Number(n[i].qty||0)*Number(n[i].rate||0);return n;});

  const normalizeMedKey = (v="") => String(v).toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g," ").trim();
  const findMedMaster = (name) => {
    if (!name) return null;
    const needle = normalizeMedKey(name);
    const nw = needle.split(" ").filter(w=>w.length>2);
    return medicineMaster.find(e=>normalizeMedKey(e?.name||e?.medicine_name)===needle)||
      medicineMaster.find(e=>{const h=normalizeMedKey(e?.name||e?.medicine_name);return h.startsWith(needle)||needle.startsWith(h);})||
      medicineMaster.find(e=>{const h=normalizeMedKey(e?.name||e?.medicine_name);return h.includes(needle)||needle.includes(h);})||
      medicineMaster.find(e=>{const h=normalizeMedKey(e?.name||e?.medicine_name);const hw=h.split(" ").filter(w=>w.length>2);const c=nw.filter(w=>hw.some(x=>x.includes(w)||w.includes(x)));return nw.length>0&&c.length>=Math.ceil(nw.length*0.6);})||null;
  };
  const addMedFromPicker = (medName) => {
    const m=findMedMaster(medName); const rate=Number(m?.rate??m?.price??0);
    setMyEMedBill(p=>[...p,{id:Date.now(),item:m?.name||m?.medicine_name||medName,date:new Date().toISOString().slice(0,10),quantity:1,rate,amount:rate,batchNo:m?.batch_no||"",expiryDate:normalizeExpiry(m?.expiry_date||""),availableQty:Number(m?.quantity||0)}]);
    toast(`Added: ${medName.slice(0,40)}`);
  };

  // ── openReviewWork ─────────────────────────────────────────────────────────
  const openReviewWork = async (task) => {
    setReviewWorkTask(task); setReviewWorkLoading(true); setReviewWorkModal(true);
    setReviewComments({}); setReviewRating(5); setReviewOverallNote(""); setReviewEditMode({});
    setReviewSectionOpen({discharge:true,admission:false,reports:false,medicines:false,billing:false});
    const uhid=task.patient_uhid||task.patientId||"";
    let admNo=Number(task.adm_no||task.admNo)||null;
    const patName=task.patient_name||task.patientName||"";
    let fullPatient={};
    try{fullPatient=await apiFetch(`/patients/${encodeURIComponent(uhid)}/`);}catch{}
    if(!admNo) admNo=resolveAdmissionNoFromPatient(fullPatient);
    const admission=pickAdmissionRecord(fullPatient,admNo);
    const nestedMed=admission?.medicalHistory||{};
    const nestedDis=admission?.discharge||{};
    const nestedBill=admission?.billing||{};
    const nestedSvc=mapAdmissionServicesToUi(admission?.services);
    setReviewWorkPat({uhid,admNo:admNo??"",patientName:patName,...task});
    try{
      const summType=String(nestedDis?.dischargeStatus||"NORMAL").toUpperCase();
      const[labRes,pharRes,summRes]=await Promise.allSettled([
        admNo?apiService.getLabReports(uhid,admNo).catch(()=>[]):Promise.resolve([]),
        admNo?apiService.getPharmacyRecords(uhid,admNo).catch(()=>[]):Promise.resolve([]),
        admNo?apiService.getDynamicSummary(uhid,admNo,summType).catch(()=>({content:{sections:[]}})):Promise.resolve({content:{sections:[]}}),
      ]);
      let canonicalData={};
      if(admNo){try{canonicalData=await apiService.getCanonicalRecords(uhid,admNo);}catch(e){if(process.env.NODE_ENV!=="production")toast.error("Unable to load records");}}
      const dis={...nestedDis,...(canonicalData?.discharge||{})};
      const med={...nestedMed,...(canonicalData?.medical||{})};
      const bill={...nestedBill,...(canonicalData?.billing||{})};
      const labs=Array.isArray(labRes.value)?labRes.value:(labRes.value?.results||[]);
      const phar=Array.isArray(pharRes.value)?pharRes.value:(pharRes.value?.results||[]);
      const disData=dis?.dischargeData||dis||{};
      const medData=med?.medicalData||med||{};
      const billData=bill?.billingData||bill||{};
      const labNorm=labs.map(r=>({id:r.id||crypto.randomUUID(),reportName:r.reportName||r.report_name||"",reportType:r.reportType||r.report_type||"Haematology",billCategory:r.billCategory||"PATHOLOGY",date:r.date||r.report_date||new Date().toISOString().slice(0,10),orderedBy:r.orderedBy||r.ordered_by||"",amount:Number(r.amount||0),remarks:r.remarks||"",findings:r.findings||"",impression:r.impression||"",tests:Array.isArray(r.tests||r.table_data)?(r.tests||r.table_data).map(t=>({id:t.id||crypto.randomUUID(),name:t.name||"",value:t.value||"",unit:t.unit||"",refRange:t.refRange||t.normal||"",status:t.status||"Normal"})):[]}));
      const pharNorm=phar.map(r=>({id:r.id||crypto.randomUUID(),item:r.name||r.medicine_name||"",date:r.date||r.date_given||new Date().toISOString().slice(0,10),quantity:Number(r.quantity||1),rate:Number(r.rate||0),amount:Number(r.rate||0)*Number(r.quantity||1),batchNo:r.batch||r.batch_no||"",expiryDate:r.expiry||r.expiry_date||""}));
      setReviewWorkData({discharge:disData,admission:medData,labReports:labNorm,medBill:pharNorm,services:nestedSvc,billing:billData,dischargeSummary:summRes.value?.content||null});
      setRvEDis({doa:(disData.doa||admission?.dateTime||"").slice(0,16),dod:disData.dod||"",ward:disData.wardName||disData.ward||"",bed:disData.bedNo||disData.bed||"",doctor:disData.doctorName||disData.doctor||medData.treatingDoctor||"",diagnosis:disData.diagnosis||medData.provisionalDiagnosis||"",condition:disData.dischargeStatus||disData.condition||"",instructions:disData.instructions||"",notes:disData.notes||"",expectedDod:disData.expectedDod||""});
      setRvEMed({presentComplaints:medData.presentComplaints||"",chiefComplaints:medData.chiefComplaints||"",bp:medData.bp||disData.bp||"",pr:medData.pr||medData.pulse||"",spo2:medData.spo2||"",temp:medData.temp||"",chest:medData.chest||"",cvs:medData.cvs||"",cns:medData.cns||"",pa:medData.pa||"",investigations:medData.investigations||"",provisionalDiagnosis:medData.provisionalDiagnosis||disData.diagnosis||"",treatmentAdvised:medData.treatmentAdvised||medData.treatmentGiven||"",previousDiagnosis:medData.previousDiagnosis||medData.pastHistory||"",pastSurgeries:medData.pastSurgeries||"",currentMedications:medData.currentMedications||"",treatingDoctor:medData.treatingDoctor||disData.doctorName||"",knownAllergies:medData.knownAllergies||"",notes:medData.notes||""});
      setRvELabRep(JSON.parse(JSON.stringify(labNorm)));
      setRvEMedBill(JSON.parse(JSON.stringify(pharNorm)));
      setRvESvc(JSON.parse(JSON.stringify(nestedSvc)));
      setRvEBilling({...billData});
      setRvDischargeSummary(summRes.value?.content||null);
      setRvDischargeSummaryType(String(nestedDis?.dischargeStatus||summRes.value?.summary_type||"NORMAL").toUpperCase());
    }catch{toast("Failed to load patient data","e");}
    finally{setReviewWorkLoading(false);}
  };

  const saveReviewSection = async (sectionKey) => {
    const pat=reviewWorkPat; if(!pat?.uhid) return;
    const admNo=pat.admNo||pat.adm_no||"";
    setReviewSaving(p=>({...p,[sectionKey]:true}));
    try{
      if(sectionKey==="discharge"){await apiService.dischargePatient(pat.uhid,admNo,rvEDis);if(rvDischargeSummary)await apiService.saveDynamicSummary(pat.uhid,admNo,{summary_type:rvDischargeSummaryType,content:rvDischargeSummary});}
      else if(sectionKey==="admission")  await apiService.updateMedicalHistory(pat.uhid,admNo,rvEMed);
      else if(sectionKey==="reports")    await apiService.saveLabReportsBulk(pat.uhid,admNo,rvELabRep);
      else if(sectionKey==="medicines")  await apiService.savePharmacyRecordsBulk(pat.uhid,admNo,rvEMedBill.filter(r=>String(r.item||"").trim()).map(r=>({medicine_name:r.item,date_given:r.date||new Date().toISOString().slice(0,10),quantity:Number(r.quantity||1),rate:Number(r.rate||0),batch_no:r.batchNo||"",expiry_date:r.expiryDate||""})));
      else if(sectionKey==="billing")    {await apiService.saveServicesBulk(pat.uhid,admNo,rvESvc);await apiService.updateBilling(pat.uhid,admNo,rvEBilling);}
      toast(`${SECTION_LABELS[sectionKey]} corrections saved ✓`);
      setReviewEditMode(p=>({...p,[sectionKey]:false}));
    }catch{toast(`Failed to save ${SECTION_LABELS[sectionKey]}`,"e");}
    finally{setReviewSaving(p=>({...p,[sectionKey]:false}));}
  };

  const approveReviewWork = async () => {
    if(!reviewWorkTask) return; setReviewSubmitting(true);
    try{
      await patchTaskUpdateStatus(reviewWorkTask.id,{status:"Completed",remarks:reviewOverallNote,notes:reviewOverallNote,hod_approved:true});
      const empId=reviewWorkTask.assigned_to||reviewWorkTask.employeeId;
      if(empId) await request("/hod/reviews/",{method:"POST",body:JSON.stringify({department:activeDept,employeeId:empId,rating:reviewRating,comments:reviewOverallNote||Object.values(reviewComments).filter(Boolean).join(" | "),period:"weekly",taskName:reviewWorkTask.taskType||reviewWorkTask.title||"Task Review"})});
      toast("Task approved & review submitted ✓"); setReviewWorkModal(false); loadTasks(); loadReviews();
    }catch{toast("Failed to approve","e");}
    finally{setReviewSubmitting(false);}
  };

  const revertReviewWork = async () => {
    if(!reviewWorkTask) return; setReviewSubmitting(true);
    try{
      await patchTaskUpdateStatus(reviewWorkTask.id,{status:"In Progress",remarks:`REVERTED: ${reviewOverallNote}`,notes:`HOD reverted — corrections: ${Object.entries(reviewComments).filter(([,v])=>v).map(([k,v])=>`[${SECTION_LABELS[k]}] ${v}`).join(" | ")||reviewOverallNote}`});
      toast("Task reverted to employee ✓","w"); setReviewWorkModal(false); loadTasks();
    }catch{toast("Failed to revert","e");}
    finally{setReviewSubmitting(false);}
  };

  // ── Assignment ─────────────────────────────────────────────────────────────
  const openAssignModal = async (dept=activeDept, preselectedEmployeeId="") => {
    setAssignDept(dept); setAssignPatients([]); setAssignPatientIds([]); setAssignPatientNames([]);
    setAssignEmployee(preselectedEmployeeId?String(preselectedEmployeeId):"");
    setAssignNotes(""); setAssignDueDate(""); setAssignPriority("Medium"); setPatientSearch("");
    const list=await loadEmployees(dept); setDeptEmployees(list);
    if(preselectedEmployeeId&&!list.some(e=>String(e.id)===String(preselectedEmployeeId))) setAssignEmployee("");
    setShowAssignModal(true);
  };
  const toggleAssignPatient = p => {
    const isSel=assignPatients.includes(p.uhid);
    if(isSel){const idx=assignPatients.indexOf(p.uhid);setAssignPatients(prev=>prev.filter(u=>u!==p.uhid));setAssignPatientIds(prev=>prev.filter((_,i)=>i!==idx));setAssignPatientNames(prev=>prev.filter((_,i)=>i!==idx));}
    else if(assignPatients.length<8){setAssignPatients(prev=>[...prev,p.uhid]);setAssignPatientIds(prev=>[...prev,p.id]);setAssignPatientNames(prev=>[...prev,p.patientName||p.name]);}
    else toast("Maximum 8 patients per assignment","w");
  };
  const handleAssign = async () => {
    if(!assignEmployee){toast("Select an employee","w");return;}
    if(assignPatients.length===0){toast("Select at least one patient","w");return;}
    const empId=parseInt(assignEmployee,10); if(isNaN(empId)){toast("Invalid employee","w");return;}
    const payload={department:assignDept,assign_to:empId,patient_ids:assignPatientIds,title:`${assignDept} — ${assignPatients.length} patient(s)`,priority:assignPriority};
    if(assignDueDate.trim()) payload.due_date=assignDueDate;
    if(assignNotes.trim())   payload.notes=assignNotes;
    const data=await request("/tasks/bulk-assign/",{method:"POST",body:JSON.stringify(payload)});
    if(data){toast(`Assigned ${assignPatients.length} patient(s) to ${assignDept}`);setShowAssignModal(false);loadTasks();}
  };

  // ── My Work ────────────────────────────────────────────────────────────────
  const openMyWork = async (p) => {
    const uhid=p?.uhid; if(!uhid){toast("Missing patient UHID","w");return;}
    let merged={...p};
    try{const full=await apiFetch(`/patients/${encodeURIComponent(uhid)}/`);merged={...full,...p,patientName:p.patientName||p.name||full.patientName||full.name};}catch{}
    const admNo=resolveAdmissionNoFromPatient(merged);
    const admission=pickAdmissionRecord(merged,admNo);
    const disFromAdm=admission?.discharge||{};
    const medFromAdm=admission?.medicalHistory||{};
    const billFromAdm=admission?.billing||{};

const servicesUi=mapAdmissionServicesToUi(
  admission?.services ||
  admission?.billing?.services ||
  admission?.serviceData ||
  []
);
    const sel={...merged,...(admNo!=null?{admNo}:{}),discharge:{...disFromAdm,...(p.discharge||{})},medicalHistory:{...medFromAdm,...(p.medicalHistory||{})},billing:{...billFromAdm,...(p.billing||{})}};
    setMyWorkSel(sel);
    setMyEDis({doa:(admission?.dateTime||p.doa||"").slice(0,16),dod:disFromAdm.dod||p.dod||"",ward:p.ward||p.wardName||"",bed:p.bed||p.bedNo||"",doctor:p.doctor||p.doctorName||"",diagnosis:p.diagnosis||"",...disFromAdm,...(p.discharge||{})});
    setMyEMed({...medFromAdm,...(p.medicalHistory||{})});
    setMyESvc(servicesUi); setMyELabRep([]); setMyEMedBill([]);
    setMyEBilling({insuranceType:"Self Pay",discount:0,advance:0,paidNow:0,paymentMode:"Cash",...billFromAdm,...(p.billing||{})});
    setMyESaved({discharge:false,admission:false,reports:false,medicines:false,billing:false});
    setMyRepFilter("All"); setMyDischargeSummary(null); setMyActiveTab("discharge"); setMyWorkView("patient");
    if(uhid&&admNo!=null){
      const summType=String(sel.discharge?.dischargeStatus||p.dischargeStatus||"NORMAL").toUpperCase();
      setMyDischargeSummaryType(summType); setMyDischargeSummaryLoading(true);
      apiService.getDynamicSummary(uhid,admNo,summType).then(res=>{const c=res?.content||{sections:[]};if(c.sections&&!Array.isArray(c.sections))c.sections=Object.entries(c.sections).map(([k,v])=>({key:k,...v}));setMyDischargeSummary(c);if(res?.is_existing&&res?.summary_type)setMyDischargeSummaryType(res.summary_type);}).catch(()=>setMyDischargeSummary({sections:[]})).finally(()=>setMyDischargeSummaryLoading(false));
      Promise.all([apiService.getLabReports(uhid,admNo).catch(()=>[]),apiService.getLabReportTemplates(uhid,admNo).catch(()=>({suggested_reports:[]}))]).then(([saved,tpl])=>{
        const existing=Array.isArray(saved)?saved:[];const suggested=Array.isArray(tpl?.suggested_reports)?tpl.suggested_reports:[];
        const keys=new Set(existing.map(r=>r.reportName||r.report_name||""));
        const merged=[...existing.map(r=>({id:r.id||crypto.randomUUID(),reportName:r.reportName||r.report_name||"",reportType:r.reportType||r.report_type||"Haematology",billCategory:r.billCategory||"PATHOLOGY",date:r.date||r.report_date||new Date().toISOString().slice(0,10),orderedBy:r.orderedBy||r.ordered_by||"",amount:Number(r.amount||0),remarks:r.remarks||"",findings:r.findings||"",impression:r.impression||"",tests:Array.isArray(r.tests||r.table_data)?(r.tests||r.table_data).map(t=>({id:t.id||crypto.randomUUID(),name:t.name||"",value:t.value||"",unit:t.unit||"",refRange:t.refRange||t.normal||"",status:t.status||"Normal"})):[]}))];
        suggested.forEach(s=>{const name=s.reportName||s.report_name||"";if(!keys.has(name))merged.push({id:crypto.randomUUID(),reportName:name,reportType:s.reportType||"Haematology",billCategory:"PATHOLOGY",date:new Date().toISOString().slice(0,10),orderedBy:"",amount:0,remarks:"",tests:[],findings:"",impression:""});});
        if(merged.length)setMyELabRep(merged);
      }).catch(()=>{});
      apiService.getPharmacyRecords(uhid,admNo).then(records=>{
  const arr=Array.isArray(records)?records:[];
  
  if(arr.length){
    setMyEMedBill(arr.map(r=>({
      id:r.id||crypto.randomUUID(),
      item:r.name||r.medicine_name||"",
      date:r.date||r.date_given||new Date().toISOString().slice(0,10),
      quantity:Number(r.quantity||1),
      rate:Number(r.rate||0),
      amount:Number(r.rate||0)*Number(r.quantity||1),
      batchNo:r.batch_no||r.batchNo||"",
      expiryDate:r.expiry_date||r.expiryDate||""
    })));
  } else {
    const meds=(myEMed?.currentMedications || "")
      .split(/,|\n/)
      .map(m=>m.trim())
      .filter(Boolean);

    if(meds.length){
      setMyEMedBill(meds.map(med=>({
        id:crypto.randomUUID(),
        item:med,
        date:new Date().toISOString().slice(0,10),
        quantity:1,
        rate:0,
        amount:0,
        batchNo:"",
        expiryDate:""
      })));
    }
  }
}).catch(()=>{});
    }
  };

  const saveMySection = async (sectionKey,label) => {
    if(!myWorkSel) return;
    try{
      const admNo=myWorkSel.admNo||myWorkSel.id;
      if(myActiveTab==="discharge")      await apiService.dischargePatient(myWorkSel.uhid,admNo,myEDis);
      else if(myActiveTab==="medical")   {if(typeof setMyEMed._flush==="function")setMyEMed._flush();await new Promise(r=>setTimeout(r,0));await apiService.updateMedicalHistory(myWorkSel.uhid,admNo,myEMed);}
      else if(myActiveTab==="reports")   await apiService.saveLabReportsBulk(myWorkSel.uhid,admNo,myELabRep.filter(r=>(r.reportName||r.reportType||r.findings||"").trim()||(Array.isArray(r.tests)&&r.tests.length)));
      else if(myActiveTab==="med_bill")  await apiService.savePharmacyRecordsBulk(myWorkSel.uhid,admNo,myEMedBill.filter(r=>String(r.item||"").trim()).map(r=>({medicine_name:r.item||"",date_given:r.date||new Date().toISOString().slice(0,10),quantity:Number(r.quantity||1),rate:Number(r.rate||0),batch_no:r.batchNo||"",expiry_date:r.expiryDate||""})));
      else if(myActiveTab==="finalbill") {await apiService.saveServicesBulk(myWorkSel.uhid,admNo,myESvc);await apiService.updateBilling(myWorkSel.uhid,admNo,myEBilling);}
      setMyESaved(p=>({...p,[sectionKey]:true})); toast(`${label} saved ✓`);
    }catch{toast(`Failed to save ${label}`,"e");}
  };

  const submitMyWork = async () => {
    if(!myWorkSel) return;
    try{
      const existing=hodOwnTasks.find(t=>t.patient_uhid===myWorkSel.uhid);
      if(existing) await patchTaskUpdateStatus(existing.id,{status:"Completed",remarks:submitNote,notes:submitNote});
      else await apiFetch("/hod/tasks/",{method:"POST",body:JSON.stringify({department:activeDept,employeeId:currentUser?.id,patientId:myWorkSel.uhid,taskType:`HOD Work — ${myWorkSel.patientName||myWorkSel.name}`,status:"completed",priority:"medium",notes:submitNote})});
      toast("Submitted to Admin Management ✓"); setMyShowConfirm(false); setMyWorkView("list"); loadHodOwnTasks();
    }catch{toast("Failed to submit","e");}
  };

  const openReview = (task,employee) => { setReviewTarget({task,employee}); setReviewForm({rating:5,comments:"",score:"",period:"weekly"}); setShowReviewModal(true); };
  const submitReview = async () => {
    if(!reviewTarget) return;
    const employeeId=reviewForm.employeeId||reviewTarget.employee?.id||reviewTarget.task?.assigned_to;
    const data=await request("/hod/reviews/",{method:"POST",body:JSON.stringify({department:activeDept,employeeId,rating:reviewForm.rating,comments:reviewForm.comments,period:reviewForm.period,performanceScore:reviewForm.score,taskName:reviewTarget.task?.taskType||reviewTarget.task?.title||"Department Performance"})});
    if(data){toast("Review submitted ✓");setShowReviewModal(false);loadReviews();}
  };

  const openSubmitToAdmin = target => { setSubmitTarget(target); setSubmitNote(""); setShowSubmitModal(true); };
  const confirmSubmitToAdmin = async () => {
    if(!submitTarget) return;
    try{await patchTaskUpdateStatus(submitTarget.id,{status:"Completed",remarks:submitNote,notes:submitNote});toast("Submitted to Admin Management ✓");setShowSubmitModal(false);setSubmitTarget(null);loadTasks();loadHodOwnTasks();}
    catch{toast("Failed to submit","e");}
  };

  const openEditTask = task => { setEditTask(task); setEditForm({priority:task.priority||"Medium",due_date:task.due_date||task.dueDate||"",notes:task.notes||""});setShowEditModal(true); };
  const saveEditTask = async () => {
    if(!editTask) return;
    try{
      const payload={priority:editForm.priority,notes:editForm.notes};
      if(editForm.due_date) payload.due_date=editForm.due_date;
      if(editForm.assigned_to) payload.assign_to=Number(editForm.assigned_to);
      if(editForm.status) payload.status=backendStatusFromUi(editForm.status);
      await apiFetch(`/tasks/${editTask.id}/`,{method:"PATCH",body:JSON.stringify(payload)});
      toast("Task updated ✓"); setShowEditModal(false); loadTasks();
    }catch{toast("Could not update task","e");}
  };

  const removeTask = async (id) => {
    if(!window.confirm("Remove this task?")) return;
    try{await apiFetch(`/tasks/${id}/`,{method:"DELETE"});setTasks(prev=>prev.filter(t=>t.id!==id));loadTasks();toast("Task removed ✓");}
    catch{toast("Could not remove task","e");}
  };

  const updateTaskStatus = async (id,uiStatus) => {
    try{await patchTaskUpdateStatus(id,{status:backendStatusFromUi(uiStatus)});toast(`Status → ${uiStatus}`);loadTasks();loadHodOwnTasks();}
    catch{toast("Could not update task status","e");}
  };

  // ── Shared props bundles ───────────────────────────────────────────────────
  const myWorkProps = {
    myWorkView,
    setMyWorkView,
    myWorkSel, myActiveTab, setMyActiveTab, myShowConfirm, setMyShowConfirm,
    myEDis, setMyEDis, myEMed, setMyEMed, myESvc, setMyESvc,
    myELabRep, setMyELabRep, myEMedBill, setMyEMedBill, myEBilling, setMyEBilling,
    myESaved, myRepFilter, setMyRepFilter, reportSearch, setReportSearch,
    reportMaster, medicineMaster, serviceMaster, svcSearch, setSvcSearch,
    myDischargeSummary, setMyDischargeSummary, myDischargeSummaryType, setMyDischargeSummaryType,
    myDischargeSummaryLoading, setMyDischargeSummaryLoading,
    updMyRep, updMyTest, addMyTest, delMyTest, updMySvc,
    addMedFromPicker, saveMySection, submitMyWork, submitNote, setSubmitNote,
    allPatients, hodOwnTasks, unassignedPatients, activeDept, currentUser,
    openMyWork, openAssignModal, openSubmitToAdmin,
    toast, REPORT_TEMPLATES, API_BASE, apiService,
  };

  const reviewWorkProps = {
    reviewWorkModal, setReviewWorkModal, reviewWorkTask, reviewWorkPat,
    reviewWorkLoading, reviewSectionOpen, setReviewSectionOpen,
    reviewEditMode, setReviewEditMode, reviewComments, setReviewComments,
    reviewRating, setReviewRating, reviewOverallNote, setReviewOverallNote,
    reviewSubmitting, reviewSaving,
    rvEDis, setRvEDis, rvEMed, setRvEMed,
    rvELabRep, setRvELabRep, rvEMedBill, setRvEMedBill,
    rvESvc, setRvESvc, rvEBilling, setRvEBilling,
    rvDischargeSummary, setRvDischargeSummary,
    rvDischargeSummaryType, setRvDischargeSummaryType,
    updRvRep, updRvTest, addRvTest, delRvTest,
    saveReviewSection, approveReviewWork, revertReviewWork,
    toast, apiService, SECTION_LABELS, PDF_DOC_TYPES, INSURANCE_TYPES_LIST,
    fmtRs, fmtDt, calcTotals, isRadiologyType, emptyPathReport, emptyRadReport,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{HOD_CSS}</style>
      <div className="hod-root">
        <HodSidebar
          collapsed={collapsed} setCollapsed={setCollapsed}
          activeDept={activeDept} setActiveDept={setActiveDept}
          activeView={activeView} setActiveView={setActiveView}
          setMyWorkView={setMyWorkView} currentUser={currentUser}
          pendingCount={pendingCount} overdueCount={overdueCount} completedCount={completedCount}
          deptColor={deptColor} onLogout={() => setShowLogoutConfirm(true)}
        />
        <div className="hod-main">
          <HodHeader
            loading={loading} activeDept={activeDept} activeView={activeView}
            myWorkView={myWorkView} myWorkSel={myWorkSel}
            onRefresh={() => { loadTasks(); loadAllPatients(); loadHodOwnTasks(); }}
            onLogout={() => setShowLogoutConfirm(true)}
          />
          <div className="hod-content">
            {activeView==="overview"   && <OverviewView allPatients={allPatients} tasks={tasks} hodOwnTasks={hodOwnTasks} pendingCount={pendingCount} overdueCount={overdueCount} completedCount={completedCount} submittedCount={submittedCount} unassignedPatients={unassignedPatients} openAssignModal={openAssignModal} openMyWork={openMyWork} setActiveDept={setActiveDept} setActiveView={setActiveView} setAssignPatients={setAssignPatients} setAssignPatientIds={setAssignPatientIds} setAssignPatientNames={setAssignPatientNames}/>}
            {activeView==="assign"     && <AssignView tasks={tasks} employees={employees} searchQ={searchQ} setSearchQ={setSearchQ} openAssignModal={openAssignModal}/>}
            {activeView==="my-work"    && (myWorkView==="patient" ? <MyWorkPatient {...myWorkProps}/> : <MyWorkList {...myWorkProps}/>)}
            {activeView==="dept-tasks" && <DeptTasksView tasks={tasks} employees={employees} activeDept={activeDept} deptColor={deptColor} filterEmployee={filterEmployee} setFilterEmployee={setFilterEmployee} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterDate={filterDate} setFilterDate={setFilterDate} loadTasks={loadTasks} openAssignModal={openAssignModal} openReviewWork={openReviewWork} openReview={openReview} openSubmitToAdmin={openSubmitToAdmin} removeTask={removeTask} updateTaskStatus={updateTaskStatus}/>}
            {activeView==="analytics"  && <AnalyticsView analytics={analytics} activeDept={activeDept} deptColor={deptColor} employees={employees} filterRange={filterRange} setFilterRange={setFilterRange} filterEmployee={filterEmployee} setFilterEmployee={setFilterEmployee} openReview={openReview}/>}
            {activeView==="reviews"    && <ReviewsView reviews={reviews} activeDept={activeDept} setReviewTarget={setReviewTarget} setReviewForm={setReviewForm} setShowReviewModal={setShowReviewModal}/>}
            {activeView==="employees"  && <EmployeesView deptEmployees={deptEmployees} activeDept={activeDept} tasks={tasks} deptColor={deptColor} loadEmployees={loadEmployees} setDeptEmployees={setDeptEmployees} openAssignModal={openAssignModal} openReview={openReview}/>}
          </div>
        </div>

        {showAssignModal  && <AssignModal assignDept={assignDept} setAssignDept={setAssignDept} assignEmployee={assignEmployee} setAssignEmployee={setAssignEmployee} assignPatients={assignPatients} assignPatientIds={assignPatientIds} assignPatientNames={assignPatientNames} assignPriority={assignPriority} setAssignPriority={setAssignPriority} assignDueDate={assignDueDate} setAssignDueDate={setAssignDueDate} assignNotes={assignNotes} setAssignNotes={setAssignNotes} patientSearch={patientSearch} setPatientSearch={setPatientSearch} deptEmployees={deptEmployees} setDeptEmployees={setDeptEmployees} filteredPatientSearch={filteredPatientSearch} setAssignPatients={setAssignPatients} setAssignPatientIds={setAssignPatientIds} setAssignPatientNames={setAssignPatientNames} toggleAssignPatient={toggleAssignPatient} handleAssign={handleAssign} loadEmployees={loadEmployees} onClose={() => setShowAssignModal(false)}/>}
        {showReviewModal  && <ReviewModal reviewForm={reviewForm} setReviewForm={setReviewForm} reviewTarget={reviewTarget} employees={employees} activeDept={activeDept} submitReview={submitReview} onClose={() => setShowReviewModal(false)}/>}
        {showSubmitModal  && <SubmitModal submitTarget={submitTarget} submitNote={submitNote} setSubmitNote={setSubmitNote} confirmSubmitToAdmin={confirmSubmitToAdmin} onClose={() => setShowSubmitModal(false)}/>}
        {showEditModal && editTask && <EditTaskModal editTask={editTask} editForm={editForm} setEditForm={setEditForm} deptEmployees={deptEmployees} saveEditTask={saveEditTask} onClose={() => setShowEditModal(false)} STATUS_META={STATUS_META} hodTaskRowStatus={hodTaskRowStatus} backendStatusFromUi={backendStatusFromUi}/>}
        {reviewWorkModal  && <ReviewWorkModal {...reviewWorkProps}/>}

        {showLogoutConfirm && (
          <div className="hod-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="hod-logout-modal" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:38, marginBottom:12 }}>👋</div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Sign out?</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:24, lineHeight:1.6 }}>You will be signed out of the HOD panel.<br/>Any unsaved changes will be lost.</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button className="hod-btn hod-btn-ghost" style={{ minWidth:100 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                <button className="hod-btn hod-btn-danger" style={{ minWidth:100 }} onClick={() => { setShowLogoutConfirm(false); onLogout(); }}>Sign Out</button>
              </div>
            </div>
          </div>
        )}

        <div className="hod-toasts">
          {toasts.map(t => (
            <div key={t.id} className={`hod-toast ${t.type}`}>
              {t.type==="s"?"✓":t.type==="e"?"✗":"⚠"} {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
