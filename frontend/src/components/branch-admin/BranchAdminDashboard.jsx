import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { apiService } from "../../services/apiService";
import { useDoctors } from "../../hooks/useDoctors";
import DoctorsView from "../doctors/DoctorsView";
import { normalizeReportName } from "./branchAdminHelpers";
import { getDefaultTests } from "./views/records/recordsConstants";

import Sidebar        from "./Sidebar";
import Topbar         from "./Topbar";
import EmployeeModal  from "./EmployeeModal";
import OverviewView        from "./views/OverviewView";
import PatientListView     from "./views/PatientListView";
import FinancialsView      from "./views/FinancialsView";
import PrintApprovalsView  from "./views/PrintApprovalsView";
import EmployeesView       from "./views/EmployeesView";
import RecordsView         from "./views/RecordsView";

import {
  BRANCH_THEMES, EMPTY_EMP_FORM, T, mkBtn, mkInput,
} from "./branchAdminConstants";
import {
  mapLiveBranchPatients, mapBranchUsers,
  buildOverviewData, buildFinancialData,
} from "./branchAdminHelpers";

export default function BranchAdminDashboard({
  currentUser, db, locId,
  printRequests = [], onApprovePrint, onViewBill, onLogout,
  branchId = "raya", branchName = "", adminName = "Admin",
}) {
  const contentScrollRef = useRef(null);

  const resolvedBranchRaw  = locId || String(currentUser?.branch || "").toLowerCase() || branchId;
  const resolvedBranchCode = String(currentUser?.branchCode || "").toUpperCase() ||
    String(currentUser?.branch || "").toUpperCase() ||
    (resolvedBranchRaw === "raya" ? "RYM" : resolvedBranchRaw === "laxmi" || resolvedBranchRaw === "lakshmi" ? "LNM" : String(resolvedBranchRaw || "").toUpperCase());
  const resolvedBranchKey = resolvedBranchRaw === "lnm" ? "laxmi" : resolvedBranchRaw === "rym" ? "raya" : resolvedBranchRaw;
  const theme              = BRANCH_THEMES[resolvedBranchKey] || BRANCH_THEMES.default;
  const resolvedBranchName = branchName || theme.label;
  const resolvedAdminName  = currentUser?.name || adminName;

  const [nav,      setNav]      = useState("overview");
  const [range,    setRange]    = useState("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");
  const [overview,   setOverview]   = useState(null);
  const [patients,   setPatients]   = useState([]);
  const [cashPats,   setCashPats]   = useState([]);
  const [financials, setFinancials] = useState(null);
  const [employees,  setEmployees]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [statusFil, setStatusFil] = useState("all");

  const [selPatient,      setSelPatient]      = useState(null);
  const [recTab,          setRecTab]          = useState("discharge_summary");
  const [editableRows,    setEditableRows]    = useState([]);
  const [persistedSvcRows, setPersistedSvcRows] = useState([]);
  const [persistedMedRows, setPersistedMedRows] = useState([]);
  const [savingRecords,   setSavingRecords]   = useState(false);
  const [isRecordDirty,   setIsRecordDirty]   = useState(false);
  const isRecordDirtyRef = useRef(false);
  const [medicineMaster,  setMedicineMaster]  = useState([]);
  const [billEdit, setBillEdit] = useState({ discount: 0, advance: 0 });

  const [empForm,  setEmpForm]  = useState(EMPTY_EMP_FORM);
  const [empError, setEmpError] = useState("");
  const [modal,    setModal]    = useState(null);

  const { doctors, addDoctor, removeDoctor } = useDoctors(resolvedBranchCode);

  useEffect(() => {
    apiService.getMedicineMaster()
      .then(list => setMedicineMaster(Array.isArray(list) ? list : []))
      .catch(() => setMedicineMaster([]));
  }, []);

  // ─── Load branch patients & employees ──────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      setSearch(""); setStatusFil("all");
      if (nav !== "records") setSelPatient(null);
      const branchPatients = (
        (Array.isArray(db?.[resolvedBranchKey]) && db[resolvedBranchKey]) ||
        (Array.isArray(db?.[resolvedBranchRaw]) && db[resolvedBranchRaw]) ||
        (resolvedBranchCode === "LNM" && (Array.isArray(db?.laxmi) ? db.laxmi : [])) ||
        (resolvedBranchCode === "RYM" && (Array.isArray(db?.raya) ? db.raya : [])) || []
      );
      let safe = branchPatients;
      if (!safe.length) {
        try {
          const apiPatients = await apiService.getPatients();
          const list = Array.isArray(apiPatients) ? apiPatients : (apiPatients?.results || []);
          safe = list.filter(p => {
            const bl = String(p.branch_location || '').toUpperCase();
            const bs = String(p.branch_location || '').toLowerCase();
            return bl === resolvedBranchCode || bs === resolvedBranchKey || bs === resolvedBranchRaw;
          });
        } catch { safe = []; }
      }
      const mapped = mapLiveBranchPatients(safe);
      if (!active) return;
      setPatients(mapped);
      setCashPats(mapped.filter(p => p.paymentMode === "cash"));
      setFinancials(buildFinancialData(mapped));
      try {
        const users = await apiService.getUsers();
        if (!active) return;
        const branchUsers = mapBranchUsers(users, resolvedBranchCode);
        setEmployees(branchUsers);
        setOverview(buildOverviewData(mapped, branchUsers));
      } catch { if (!active) return; setEmployees([]); setOverview(buildOverviewData(mapped, [])); }
    };
    load();
    return () => { active = false; };
  }, [nav, range, fromDate, toDate, db, resolvedBranchKey, resolvedBranchRaw, resolvedBranchCode]);

  // ─── Reset record state on patient/tab change ──────────────────────────
  useEffect(() => {
    setIsRecordDirty(false); isRecordDirtyRef.current = false;
    setPersistedSvcRows([]); setPersistedMedRows([]);
  }, [nav, selPatient?.uhid, selPatient?.admObj?.admNo]);

  useEffect(() => {
    const b = selPatient?.admObj?.billing || {};
    setBillEdit({ discount: Number(b.discount || 0), advance: Number(b.advance || 0) });
  }, [selPatient?.uhid, selPatient?.admObj?.admNo]);

  // ─── Seed editable rows per tab ────────────────────────────────────────
  useEffect(() => {
    if (nav !== "records" || !selPatient) { setEditableRows([]); return; }
    if (isRecordDirtyRef.current) return;
    const admission  = selPatient.admObj || {};
    const discharge  = admission.discharge || {};
    const medical    = admission.medicalHistory || {};
    const admDate    = (admission.dateTime || discharge.doa || "").slice(0, 10);
    const rowsByTab  = {
      discharge_summary: [], // DischargeTab fetches from API itself via getDynamicSummary
      admission_note: [{ treatingDoctor: medical.treatingDoctor||discharge.doctorName||"", doctorQual: medical.doctorQual||"", presentComplaints: medical.presentComplaints||"", chiefComplaints: medical.chiefComplaints||"", bp: medical.bp||"", pulse: medical.pulse||"", spo2: medical.spo2||"", temp: medical.temp||"", chest: medical.chest||"", cvs: medical.cvs||"", cns: medical.cns||"", pa: medical.pa||"", investigations: medical.investigations||"", provisionalDiagnosis: medical.provisionalDiagnosis||"", treatmentAdvised: medical.treatmentAdvised||"", notes: medical.notes||"" }],
      medical_history: [{ previousDiagnosis: medical.previousDiagnosis||medical.past_history||"", pastSurgeries: medical.pastSurgeries||"", currentMedications: medical.currentMedications||"", knownAllergies: medical.knownAllergies||"", chronicConditions: medical.chronicConditions||"", familyHistory: medical.familyHistory||"", smokingStatus: medical.smokingStatus||"", alcoholUse: medical.alcoholUse||"", treatingDoctor: medical.treatingDoctor||"", notes: medical.notes||"" }],
      services: (Array.isArray(admission?.services) ? admission.services : []).map((s,i)=>({ _localId: s.id?`svc-${s.id}`:`svc-seed-${i}`, isSvc:true, medicine_name:s.svcName||s.description||s.title||"", date_given:s.svcDate||admDate, quantity:Number(s.svcQty||s.qty||1), rate:Number(s.rate||s.svcRate||0), batch_no:s.svcCode||s.code||s.cghs||"", expiry_date:"", amount:Number(s.svcTot||s.total||(Number(s.svcRate||0)*Number(s.svcQty||1))) })),
      reports: [],
      medicines: [],
      final_bill: [],
    };
    setEditableRows(rowsByTab[recTab] || []);
  }, [nav, selPatient?.uhid, selPatient?.admObj?.admNo, recTab]);

  // ─── API fetch for reports / medicines tabs ────────────────────────────
  useEffect(() => {
    if (nav !== "records" || !selPatient) return;
    if (!["reports","medicines","final_bill","services"].includes(recTab)) return;
    const admObj  = selPatient?.admObj;
    const uhid    = selPatient?.uhid;
    const admNo   = admObj?.admNo;
    if (!uhid || !admNo) return;
    const admDate = (admObj?.dateTime || admObj?.discharge?.doa || "").slice(0, 10);
    const doctor  = admObj?.discharge?.doctorName || admObj?.medicalHistory?.treatingDoctor || "";
    const services = Array.isArray(admObj?.services) ? admObj.services : [];
    let active = true;

    if (recTab === "services" && persistedSvcRows.length === 0) {
      fetch(`${process.env.REACT_APP_API_URL}/service-master/`, { headers: { Authorization: "Bearer " + (sessionStorage.getItem("hms_token") || "") } })
        .then(r => r.json()).then(master => {
          if (!active) return;
          const ml = Array.isArray(master) ? master : master?.results || [];
          const lr = (code, name) => { const c=(code||"").toUpperCase().trim(),n=(name||"").toLowerCase().trim(); const hit=ml.find(s=>s.code===c)||ml.find(s=>(s.description||"").toLowerCase()===n); return Number(hit?.rate||0); };
          const mapped = services.map((s,i)=>{ const rate=Number(s.rate||s.svcRate||0)||lr(s.svcCode||s.code,s.svcName||s.title); const qty=Number(s.svcQty||s.qty||1); return { _localId:s.id?"svc-"+s.id:"svc-seed-"+i, isSvc:true, medicine_name:s.svcName||s.description||s.title||"", date_given:s.svcDate||admDate, quantity:qty, rate, batch_no:s.svcCode||s.code||s.cghs||"", expiry_date:"", amount:rate*qty }; });
          isRecordDirtyRef.current = false; setEditableRows(mapped); setPersistedSvcRows(mapped);
        }).catch(()=>{ if(!active)return; const mapped=services.map((s,i)=>({_localId:s.id?"svc-"+s.id:"svc-seed-"+i,isSvc:true,medicine_name:s.svcName||s.description||s.title||"",date_given:s.svcDate||admDate,quantity:Number(s.svcQty||1),rate:0,batch_no:s.svcCode||s.code||s.cghs||"",expiry_date:"",amount:0})); isRecordDirtyRef.current=false; setEditableRows(mapped); setPersistedSvcRows(mapped); });
      return () => { active = false; };
    } else if (recTab === "services" && persistedSvcRows.length > 0) {
      isRecordDirtyRef.current = false; setEditableRows(persistedSvcRows); return;
    }

    if (recTab === "medicines" || recTab === "final_bill") {
      const load = async () => {
        try {
          const data = await apiService.getPharmacyRecords(uhid, admNo);
          if (!active) return;
          let items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : (data&&typeof data==="object"?Object.values(data).find(v=>Array.isArray(v)):[]) || [];
            if (!items.length) {
              const medSrc = admObj?.medicalHistory?.currentMedications || admObj?.medicalHistory?.treatmentAdvised || "";
              if (medSrc) {
                items = String(medSrc).split(/,|\n/).map((m, i) => ({
                  medicine_name: m.trim(), quantity: 1, rate: 0,
                  date_given: admDate, id: `fallback-med-${i}`
                })).filter(m => m.medicine_name);
              }
            }


          const PURE_MED = ["pharmacy","pharma","medicine","drug","tablet","capsule","injection","iv fluid","consumable"];
          const svcRowsForBill = services.filter(s=>!PURE_MED.some(k=>(s.svcCat||s.type||"").toLowerCase().includes(k))).map((s,i)=>({ _localId:s.id?`svc-${s.id}`:`svc-${i}`, isSvc:true, medicine_name:s.svcName||s.title||"Service", date_given:s.svcDate||admDate, quantity:Number(s.svcQty||s.qty||1), rate:Number(s.rate||s.svcRate||0), batch_no:s.svcCode||s.code||"", expiry_date:"", amount:Number(s.svcTot||s.total||(Number(s.rate||s.svcRate||0)*Number(s.svcQty||s.qty||1))) }));
          if (items.length) {
            const medRows = items.map((r,i)=>({ _localId:r.id||`m-${i}`, isSvc:false, medicine_name:r.medicine_name||r.item||r.name||r.drug_name||r.medicine||r.description||"", date_given:String(r.date_given||r.given_date||r.date||admDate).slice(0,10), quantity:Number(r.quantity||r.qty||r.units||1), rate:Number(r.rate||r.unit_price||r.price||r.cost||0), batch_no:r.batch_no||r.batch_number||r.batch||"", expiry_date:String(r.expiry_date||r.expiry||r.exp_date||"").slice(0,10), amount:Number(r.amount||r.total||(Number(r.quantity||1)*Number(r.rate||0))) }));
            isRecordDirtyRef.current = false;
            if (recTab === "final_bill") { if(persistedMedRows.length===0) setPersistedMedRows(medRows); setEditableRows(persistedMedRows.length?persistedMedRows:medRows); }
            else { if(persistedMedRows.length===0){setPersistedMedRows(medRows);setEditableRows(medRows);}else{setEditableRows(persistedMedRows);} }
          } else {
            if (recTab === "final_bill") { isRecordDirtyRef.current=false; setEditableRows(svcRowsForBill); return; }
            const svcMeds = services.filter(s=>["med","medicine","medicines","pharma","drug","pharmacy","tablet","capsule","injection","iv fluid","consumable","rx"].some(k=>(s.svcCat||s.type||"").toLowerCase().includes(k))).map((s,i)=>({_localId:s.id||`m-svc-${i}`,medicine_name:s.svcName||s.name||"",date_given:String(s.svcDate||admDate).slice(0,10),quantity:Number(s.svcQty||1),rate:Number(s.svcRate||0),batch_no:"",expiry_date:"",amount:Number(s.svcTot||s.total||0)}));
            setEditableRows(svcMeds.length ? svcMeds : []);
          }
        } catch { if (!active) return; setEditableRows([]); }
      };
      load(); return () => { active = false; };
    }

    if (recTab === "reports") {
      const { normalizeReportName } = require("./branchAdminHelpers");
      const { getDefaultTests } = require("./views/records/recordsConstants");
      const load = async () => {
        try {
          const data = await apiService.getLabReports(uhid, admNo);
          if (!active) return;
          let items = Array.isArray(data)?data:Array.isArray(data?.results)?data.results:Array.isArray(data?.data)?data.data:(data&&typeof data==="object"?Object.values(data).find(v=>Array.isArray(v)):[]) || [];
            if (!items.length && admObj?.medicalHistory?.investigations) {
              items = String(admObj.medicalHistory.investigations)
                .split(/,|\n/)
                .map((r, i) => ({
                  report_name: r.trim(),
                  report_date: admDate,
                  id: `fallback-report-${i}`
                }))
                .filter(r => r.report_name);
            }


            if (!items.length) {
              const medSrc = admObj?.medicalHistory?.currentMedications || admObj?.medicalHistory?.treatmentAdvised || "";
              if (medSrc) {
                items = String(medSrc).split(/,|\n/).map((m, i) => ({
                  medicine_name: m.trim(), quantity: 1, rate: 0,
                  date_given: admDate, id: `fallback-med-${i}`
                })).filter(m => m.medicine_name);
              }
            }


          const fromLab = items.map((r,i)=>{ const rawName=r.report_name||r.reportName||r.name||r.test_name||"Report"; return { _localId:r.id||`r-lab-${i}`, reportName:rawName, reportType:r.report_type||r.reportType||r.category||r.type||"Haematology", date:String(r.report_date||r.date||r.test_date||admDate).slice(0,10), orderedBy:r.ordered_by||r.orderedBy||r.doctor_name||doctor, amount:Number(r.amount||r.rate||r.price||r.cost||0), remarks:r.remarks||r.interpretation||r.finding||r.observation||"", impression:r.impression||r.conclusion||"", tests:(()=>{const t=Array.isArray(r.tests)?r.tests:(Array.isArray(r.test_rows)?r.test_rows:[]);return t.length?t:getDefaultTests(normalizeReportName(rawName));})() }; });
          const labIds = new Set(fromLab.map(r=>String(r._localId)));
          const fromSvc = services.filter(s=>{const cat=(s.svcCat||s.type||"").toLowerCase();return ["path","lab","report","investigation","bio","haem","micro","sero","histo","radiology","x-ray","xray","scan","echo","usg","mri","ct","ecg"].some(k=>cat.includes(k));}).filter(s=>s.svcName&&!labIds.has(String(s.id))).map((s,i)=>{ const name=normalizeReportName(s.svcName||"Report"); return { _localId:s.id||`r-svc-${i}`, reportName:name, reportType:s.svcCat||"Haematology", date:String(s.svcDate||admDate).slice(0,10), orderedBy:doctor, amount:Number(s.svcTot||s.total||s.amount||(Number(s.rate||s.svcRate||0)*Number(s.svcQty||s.qty||1))), remarks:"", impression:"", tests:getDefaultTests(normalizeReportName(s.svcName||"")) }; });
          setEditableRows([...fromLab,...fromSvc]);
        } catch { if(!active)return; setEditableRows([]); }
      };
      load(); return () => { active = false; };
    }
  }, [nav, recTab, selPatient?.uhid, selPatient?.admObj?.admNo]);

  // ─── Row helpers ───────────────────────────────────────────────────────
  const updateEditableField = (rowIdx, field, value) => {
    setIsRecordDirty(true); isRecordDirtyRef.current = true;
    setEditableRows(prev => {
      const next = prev.map((row, idx) => idx === rowIdx ? { ...row, [field]: value } : row);
      if (recTab === "services") setPersistedSvcRows(next);
      if (recTab === "medicines") setPersistedMedRows(next);
      return next;
    });
  };
  const addEditableRow = template => {
    setIsRecordDirty(true); isRecordDirtyRef.current = true;
    setEditableRows(prev => {
      const next = [...prev, template];
      if (recTab === "services") setPersistedSvcRows(next);
      if (recTab === "medicines") setPersistedMedRows(next);
      return next;
    });
  };
  const removeEditableRow = rowIdx => {
    setIsRecordDirty(true); isRecordDirtyRef.current = true;
    setEditableRows(prev => {
      const next = prev.filter((_, idx) => idx !== rowIdx);
      if (recTab === "services") setPersistedSvcRows(next);
      if (recTab === "medicines") setPersistedMedRows(next);
      return next;
    });
  };

  // ─── Employee helpers ──────────────────────────────────────────────────
  function updateEmpField(field, value) { setEmpForm(f => ({ ...f, [field]: value })); if (empError) setEmpError(""); }

  async function addEmployee(e) {
    e.preventDefault(); setEmpError("");
    if (!empForm.name || !empForm.username || !empForm.password) { setEmpError("Fill all required fields."); return; }
    if (empForm.password !== empForm.confirmPassword) { setEmpError("Passwords do not match."); return; }
    const [firstName, ...rest] = empForm.name.trim().split(/\s+/);
    const roleMap = { Receptionist: "receptionist", HOD: "hod", OPD: "opd", Intimation: "intimation", Query: "query", Uploading: "uploading" };
    try {
      await apiService.createUser({ username: empForm.username, email: empForm.email || `${empForm.username}@sangihospital.com`, first_name: firstName || empForm.username, last_name: rest.join(" ") || ".", emp_id: empForm.employeeId || empForm.username, phone_number: empForm.phone, role: roleMap[empForm.role] || "receptionist", branch: resolvedBranchCode, password: empForm.password, confirm_password: empForm.confirmPassword });
      const users = await apiService.getUsers();
      const branchUsers = mapBranchUsers(users, resolvedBranchCode);
      setEmployees(branchUsers); setOverview(buildOverviewData(patients, branchUsers));
      setModal(null); setEmpForm(EMPTY_EMP_FORM);
    } catch (error) {
      const data = error.response?.data || {};
      setEmpError(data.username?.[0] || data.emp_id?.[0] || data.password?.[0] || "Failed to create employee.");
    }
  }

  async function deleteEmp(id) {
    if (!window.confirm("Remove this employee?")) return;
    try {
      await apiService.deleteUser(id);
      const next = employees.filter(e => e.id !== id);
      setEmployees(next); setOverview(buildOverviewData(patients, next));
    } catch { toast.error("Failed to remove employee from backend."); }
  }

  useEffect(() => {
    if (modal !== "emp") return;
    apiService.getNextEmpId({ role: "receptionist", branch: resolvedBranchCode })
      .then(data => setEmpForm(f => ({ ...f, employeeId: data?.next_id || f.employeeId })))
      .catch(() => setEmpForm(f => ({ ...f, employeeId: f.employeeId || `${resolvedBranchCode.slice(0,3)||"EMP"}0001` })));
  }, [modal, resolvedBranchCode]);

  const canEditRecords = selPatient?.paymentMode === "cash";

  return (
    <div style={{ display: "flex", height: "100dvh", minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "var(--ui-font-sans)", fontSize: "15px", overflow: "hidden" }}>
      <Sidebar nav={nav} setNav={setNav} theme={theme} resolvedBranchName={resolvedBranchName} resolvedAdminName={resolvedAdminName} onLogout={onLogout} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, minHeight: 0 }}>
        <Topbar nav={nav} range={range} setRange={setRange} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} resolvedBranchName={resolvedBranchName} />

        <div ref={contentScrollRef} style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "26px 28px" }}>
          {nav === "overview"        && <OverviewView overview={overview} printRequests={printRequests} resolvedBranchCode={resolvedBranchCode} theme={theme} setSelPatient={setSelPatient} setNav={setNav} onApprovePrint={onApprovePrint} onViewBill={onViewBill} />}
          {nav === "patients"        && <PatientListView data={patients}  exportFile={`all_patients_${resolvedBranchKey}_${range}`}  title="All Patients"   theme={theme} resolvedBranchName={resolvedBranchName} search={search} setSearch={setSearch} statusFil={statusFil} setStatusFil={setStatusFil} setSelPatient={setSelPatient} setNav={setNav} />}
          {nav === "cash"            && <PatientListView data={cashPats}  exportFile={`cash_patients_${resolvedBranchKey}_${range}`} title="Cash Patients"  theme={theme} resolvedBranchName={resolvedBranchName} search={search} setSearch={setSearch} statusFil={statusFil} setStatusFil={setStatusFil} setSelPatient={setSelPatient} setNav={setNav} />}
          {nav === "records"         && <RecordsView selPatient={selPatient} setSelPatient={setSelPatient} patients={patients} nav={nav} setNav={setNav} recTab={recTab} setRecTab={setRecTab} editableRows={editableRows} setEditableRows={setEditableRows} updateEditableField={updateEditableField} addEditableRow={addEditableRow} removeEditableRow={removeEditableRow} persistedSvcRows={persistedSvcRows} persistedMedRows={persistedMedRows} setPersistedMedRows={setPersistedMedRows} billEdit={billEdit} setBillEdit={setBillEdit} canEditRecords={canEditRecords} savingRecords={savingRecords} setSavingRecords={setSavingRecords} isRecordDirty={isRecordDirty} setIsRecordDirty={setIsRecordDirty} isRecordDirtyRef={isRecordDirtyRef} medicineMaster={medicineMaster} doctors={doctors} theme={theme} resolvedBranchCode={resolvedBranchCode} apiService={apiService} />}
          {nav === "financials"      && <FinancialsView financials={financials} theme={theme} resolvedBranchKey={resolvedBranchKey} range={range} />}
          {nav === "print_approvals" && <PrintApprovalsView printRequests={printRequests} resolvedBranchCode={resolvedBranchCode} theme={theme} onApprovePrint={onApprovePrint} onViewBill={onViewBill} />}
          {nav === "employees"       && <EmployeesView employees={employees} theme={theme} resolvedBranchKey={resolvedBranchKey} resolvedBranchName={resolvedBranchName} onAddEmployee={() => setModal("emp")} onDeleteEmployee={deleteEmp} />}
          {nav === "doctors"         && <DoctorsView doctors={doctors} addDoctor={addDoctor} removeDoctor={removeDoctor} theme={theme} T={T} mkBtn={mkBtn} mkInput={mkInput} />}
        </div>
      </div>

      {modal === "emp" && <EmployeeModal empForm={empForm} empError={empError} updateEmpField={updateEmpField} onSubmit={addEmployee} onClose={() => setModal(null)} theme={theme} resolvedBranchName={resolvedBranchName} />}

      <style>{`
        *::-webkit-scrollbar{width:5px;height:5px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:${T.border};border-radius:10px}
        *::-webkit-scrollbar-thumb:hover{background:${T.borderLight}}
        tr:hover td{background:${T.surfaceRaised}22}
      `}</style>
    </div>
  );
}
