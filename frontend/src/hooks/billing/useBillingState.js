import { useState, useEffect } from "react";
import { toast as toastLib } from "react-toastify";
import { apiService } from "../../services/apiService";
import { SANGI_MEDICINE_MASTER } from "../../constants/billing/medicationGroups";
import { normalizeDischType } from "../../constants/billing/dischargeTypes";
import {
  normalizeServices,
  isPathologyCategory,
  isMedicineCategory,
  buildDischargePayload,
  buildServicePayload,
  buildLabReportPayload,
  buildPharmacyPayload,
  normalizeMedicineKey,
} from "../../utils/billing/billingUtils";
import {
  normalizeLabReports,
  normalizePharmacyRecords,
  mergeSuggestedReports,
  mapLivePatients,
  branchKeyFromLocation,
} from "../../utils/billing/dataMappers";
import {
  pickPreferredPatientRecord,
  mapTaskPatientDetail,
  buildFallbackTaskPatient,
} from "../../utils/billing/patientUtils";

// ── Map backend template catalog → frontend report shape ──────────────────────
function mapBackendTemplate(t) {
  return {
    id:              `template-${t.key || t.name}`,
    reportName:      t.name       || t.reportName     || "",
    reportType:      t.report_type|| t.reportType      || "Haematology",
    billCategory:    t.bill_category==="RADIOLOGY" ? "RADIOLOGY" : "PATHOLOGY",
    reportCategory:  t.report_category || t.reportCategory || "",
    date:            new Date().toISOString().slice(0,10),
    orderedBy:       t.orderedBy  || "",
    amount:          0,
    remarks:         t.remarks    || "",
    findings:        t.findings   || "",
    impression:      t.impression || "",
    tests: Array.isArray(t.tests)
      ? t.tests.map((row, idx) => ({
          id:       row.id    || idx + 1,
          name:     row.name  || "",
          value:    row.value || "",
          unit:     row.unit  || "",
          refRange: row.refRange || "",
          status:   row.status   || "Normal",
        }))
      : [],
  };
}

export function useBillingState({ db, currentUser, locId }) {
  const resolvedBranchKey =
    locId ||
    (String(currentUser?.branch || "").toUpperCase() === "RYM" ? "raya" : "laxmi");

  const resolveAdmNo = (p) => {
    const raw   = p?.admissions?.[0]?.admNo || p?.admNo || 1;
    const clean = String(raw).replace(/\D/g, "");
    return clean || "1";
  };

  // ── Core state ────────────────────────────────────────────────────────────
  const [patients,       setPatients]       = useState([]);
  const [assignedTasks,  setAssignedTasks]  = useState([]);
  const [medicineMaster, setMedicineMaster] = useState([]);
  const [view,           setView]           = useState("tasks");
  const [sel,            setSel]            = useState(null);
  const [activeTab,      setActiveTab]      = useState("discharge");
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [toasts,         setToasts]         = useState([]);
  const [repFilter,      setRepFilter]      = useState("All");
  const [reportSearch,   setReportSearch]   = useState({});

  // ── Editable form state ───────────────────────────────────────────────────
  const [eDis,     setEDis]     = useState({});
  const [eMed,     setEMed]     = useState({});
  const [eSvc,     setESvc]     = useState([]);
  const [eLabRep,  setELabRep]  = useState([]);
  const [eMedBill, setEMedBill] = useState([]);
  const [eBilling, setEBilling] = useState({});
  const [eSaved,   setESaved]   = useState({});

  // ── Backend report template catalog ──────────────────────────────────────
  const [backendTemplates, setBackendTemplates] = useState([]);

  // ── Load backend template catalog once ───────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/report-templates/`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("hms_token") || ""}`,
      },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results || []);
        setBackendTemplates(list.map(mapBackendTemplate));
      })
      .catch(() => {});
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  let _tid = 0;
  const toast = (msg, type = "s") => {
    const id = _tid++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  // ── Load assigned tasks ───────────────────────────────────────────────────
  useEffect(() => {
    apiService.getMyTasks()
      .then(tasks => setAssignedTasks(Array.isArray(tasks) ? tasks : []))
      .catch(() => { toastLib.error("Failed to load tasks"); setAssignedTasks([]); });
  }, []);

  // ── Load medicine master ──────────────────────────────────────────────────
  useEffect(() => {
    apiService.getMedicineMaster()
      .then(list => {
        const backendList = Array.isArray(list) ? list : [];
        const merged = [
          ...SANGI_MEDICINE_MASTER,
          ...backendList.filter(b =>
            !SANGI_MEDICINE_MASTER.some(
              s => s.name.toLowerCase() === (b.name || b.medicine_name || "").toLowerCase()
            )
          ),
        ];
        setMedicineMaster(merged);
      })
      .catch(() => setMedicineMaster(SANGI_MEDICINE_MASTER));
  }, []);

  // ── Map patients from db + tasks ──────────────────────────────────────────
  useEffect(() => {
    let rawRecords = [];
    let mapped     = [];

    if (!db) {
      rawRecords = [];
    } else if (Array.isArray(db)) {
      rawRecords = db;
    } else if (typeof db === "object") {
      const branchData = db[resolvedBranchKey];
      if      (Array.isArray(branchData))    rawRecords = branchData;
      else if (Array.isArray(db.patients))   rawRecords = db.patients;
      else if (Array.isArray(db.data))       rawRecords = db.data;
      else if (db.uhid || db.patientName)    rawRecords = [db];
      else {
        const arrayValues = Object.values(db).filter(v => Array.isArray(v));
        if (arrayValues.length > 0) rawRecords = arrayValues.flat();
      }
    }

    const shouldMergeAll =
      String(currentUser?.branch || "").toUpperCase() === "ALL" &&
      db && typeof db === "object";

    if (shouldMergeAll && (Array.isArray(db.laxmi) || Array.isArray(db.raya))) {
      mapped = [
        ...mapLivePatients(Array.isArray(db.laxmi) ? db.laxmi : [], "laxmi"),
        ...mapLivePatients(Array.isArray(db.raya)  ? db.raya  : [], "raya"),
      ];
    } else {
      mapped = mapLivePatients(rawRecords, resolvedBranchKey);
    }

    if (assignedTasks.length > 0) {
      const mappedByUhid = mapped.reduce((acc, patient) => {
        const key = String(patient.uhid || "");
        if (!key) return acc;
        const existing = acc.get(key) || [];
        existing.push(patient);
        acc.set(key, existing);
        return acc;
      }, new Map());

      const nextPatients = [];
      for (const task of assignedTasks) {
        const taskUhid      = String(task.patient_uhid || "");
        const taskCandidates = mappedByUhid.get(taskUhid) || [];
        const taskPatient   =
          pickPreferredPatientRecord(taskCandidates, task) ||
          mapTaskPatientDetail(task, resolvedBranchKey);

        const taskStatusRaw = String(task.status || "").toLowerCase();
        const normalizedTaskStatus = taskStatusRaw.includes("complete")
          ? "completed"
          : taskStatusRaw.includes("progress")
            ? "submitted"
            : "pending";

        if (taskPatient) {
          nextPatients.push({
            ...taskPatient,
            taskId:         task.id,
            assignedTo:     task.assigned_to     || taskPatient.assignedTo     || null,
            assignedToName: task.assigned_to_name || taskPatient.assignedToName || "",
            department:     task.department       || taskPatient.department      || "Billing",
            taskStatus:     normalizedTaskStatus,
          });
        } else {
          nextPatients.push(buildFallbackTaskPatient(task, resolvedBranchKey));
        }
      }
      setPatients(nextPatients);
    } else {
      setPatients(mapped);
    }

    setView("tasks");
    setSel(null);
  }, [db, resolvedBranchKey, currentUser?.branch, assignedTasks]);

  // ── Sync selected patient back into list ──────────────────────────────────
  const syncSelectedPatient = (overrides = {}) => {
    const nS  = overrides.saved          || eSaved;
    const nD  = overrides.discharge      || eDis;
    const nM  = overrides.medicalHistory || eMed;
    const nSv = overrides.services       || eSvc;
    const nR  = overrides.labReports     || eLabRep;
    const nMb = overrides.medicalBill    || eMedBill;
    const nB  = overrides.billing        || eBilling;
    const nTs = overrides.taskStatus     || sel?.taskStatus;

    setPatients(prev => prev.map(p =>
      p.uhid === sel.uhid && p.admNo === sel.admNo
        ? { ...p, taskStatus:nTs, saved:{...nS}, discharge:{...nD}, medicalHistory:{...nM}, services:[...nSv], labReports:JSON.parse(JSON.stringify(nR)), medicalBill:[...nMb], billing:{...nB} }
        : p
    ));
    setSel(prev => prev ? ({
      ...prev, taskStatus:nTs, saved:{...nS}, discharge:{...nD}, medicalHistory:{...nM},
      services:[...nSv], labReports:JSON.parse(JSON.stringify(nR)), medicalBill:[...nMb], billing:{...nB},
    }) : prev);
  };

  // ── Medicine master lookup ────────────────────────────────────────────────
  const findMedicineMasterMatch = (medName) => {
    const needle = normalizeMedicineKey(medName);
    if (!needle) return null;
    return medicineMaster.find(e =>
      normalizeMedicineKey(e?.name || e?.medicine_name) === needle
    ) || null;
  };

  // ── Open patient ──────────────────────────────────────────────────────────
  const openPatient = async (p) => {
    setSel(p);
    setEDis({ ...p.discharge });
    setEMed({ ...p.medicalHistory });
    setESvc(structuredClone(p.services));
    setEMedBill(structuredClone(p.medicalBill || []));
    setEBilling({ tpaInfo:{}, tpaDocStatus:{}, ...p.billing });
    setESaved({ ...p.saved });
    setRepFilter("All");
    setActiveTab("discharge");
    setView("patient");

    if (!p.uhid || !p.admNo) return;
    const admNo = resolveAdmNo(p);

    try {

  const dischargeType =
  normalizeDischType(p?.discharge?.dischargeStatus || p?.discharge?.dischargeType || "NORMAL");

  const [reports, templatePayload, pharRecords, serviceMaster, dynamicSummary] =
    await Promise.all([
      apiService.getLabReports(p.uhid, admNo).catch(() => []),

      apiService.getLabReportTemplates(p.uhid, admNo)
        .catch(() => ({ suggested_reports: [] })),

      apiService.getPharmacyRecords(p.uhid, admNo)
        .catch(() => []),

      fetch(`${process.env.REACT_APP_API_URL}/service-master/`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("hms_token") || ""}`
        },
      }).then(r => r.json()).catch(() => []),

      fetch(
        `${process.env.REACT_APP_API_URL}/patients/${p.uhid}/admissions/${admNo}/dynamic-summary/?type=${dischargeType}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("hms_token") || ""}`
          },
        }
      ).then(r => r.ok ? r.json() : null).catch(() => null),

    ]);

  // ── Apply discharge type from dynamic summary ──
  if (dynamicSummary?.is_existing && dynamicSummary?.summary_type) {
    const norm = dynamicSummary.summary_type.toUpperCase();
    const mapped = norm === "REFERRED" ? "REFER" : norm;

    setEDis(prev => ({
      ...prev,
      dischargeType: mapped
    }));

    setSel(prev =>
      prev
        ? ({
            ...prev,
            discharge: {
              ...(prev.discharge || {}),
              dischargeType: mapped
            }
          })
        : prev
    );
  }

      // ── Merge lab reports + suggested ──
      const mergedReports = mergeSuggestedReports(
        Array.isArray(reports) ? reports : [],
        Array.isArray(templatePayload?.suggested_reports) ? templatePayload.suggested_reports : []
      );
      if (mergedReports.length) {
        setELabRep(mergedReports);
        setSel(prev => prev ? { ...prev, labReports: mergedReports } : prev);
        setPatients(prev => prev.map(patient =>
          patient.uhid === p.uhid && Number(patient.admNo) === Number(p.admNo)
            ? { ...patient, labReports: mergedReports }
            : patient
        ));
      }

      // ── Pharmacy records ──
      if (Array.isArray(pharRecords) && pharRecords.length > 0) {
        let freshMaster = medicineMaster;
        if (!freshMaster?.length) {
          try { freshMaster = await apiService.getMedicineMaster(); } catch { freshMaster = []; }
        }
        setEMedBill(pharRecords.map(r => {
          const name        = r.name || r.medicine_name || "";
          const backendRate = Number(r.rate || 0);
          const master      = freshMaster.find(m =>
            (m.name||m.medicine_name||"").toLowerCase() === name.toLowerCase()
          ) || freshMaster.find(m =>
            (m.name||m.medicine_name||"").toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes((m.name||m.medicine_name||"").toLowerCase())
          );
          const rate = backendRate > 0 ? backendRate : Number(master?.rate || 0);
          const qty  = Number(r.quantity || 1);
          return {
            id:         r.id || crypto.randomUUID(),
            item:       name,
            date:       r.date || r.date_given || new Date().toISOString().slice(0,10),
            quantity:   qty,
            rate,
            amount:     Number((rate * qty).toFixed(2)),
            batchNo:    r.batch || r.batch_no  || master?.batch_no    || "",
            expiryDate: r.expiry|| r.expiry_date|| master?.expiry_date || "",
          };
        }));
      }

      // ── Services ──
      const matchSvcRate = (name, category) => {
        if (!Array.isArray(serviceMaster)) return 0;
        const n = (name||"").toLowerCase();
        const match = serviceMaster.find(s =>
          (s.description||"").toLowerCase() === n ||
          (s.description||"").toLowerCase().includes(n) ||
          n.includes((s.description||"").toLowerCase())
        );
        return Number(match?.rate || 0);
      };

      if (p.services?.length > 0) {
        setESvc(p.services.map(s => {
          const rate = s.rate > 0 ? s.rate : matchSvcRate(s.name, s.category);
          return { ...s, rate, amount: rate * (s.qty || 1) };
        }));
      }

    } catch {
      toast("Failed to load patient data", "e");
    }
  };

  // ── Save section ──────────────────────────────────────────────────────────
  const saveSection = async (sectionKey, label = sectionKey) => {
    if (!sel) return;
    try {
      if (activeTab === "discharge")
        await apiService.dischargePatient(sel.uhid, sel.admNo, buildDischargePayload(eDis));
      else if (activeTab === "medical")
        await apiService.updateMedicalHistory(sel.uhid, sel.admNo, eMed);
      else if (activeTab === "finalbill") {
        const serviceRows = eSvc.filter(r => r.name);
        await apiService.saveServicesBulk(
          sel.uhid, sel.admNo,
          serviceRows.map(s => buildServicePayload(
            { ...s, pricing_type: eBilling?.insuranceType && eBilling.insuranceType !== "Self Pay" ? "CASHLESS" : "CASH" },
            s.category || "GENERAL SERVICES"
          ))
        );
        await apiService.updateBilling(sel.uhid, sel.admNo, eBilling);
      } else if (activeTab === "reports") {
        await apiService.saveLabReportsBulk(
          sel.uhid, sel.admNo,
          eLabRep
            .filter(r => (r.reportName||r.reportType||r.findings||r.impression||"").trim() || (Array.isArray(r.tests)&&r.tests.length))
            .map(buildLabReportPayload)
        );
      } else if (activeTab === "med_bill") {
        await apiService.savePharmacyRecordsBulk(
          sel.uhid, sel.admNo,
          eMedBill.filter(i => (i.item||i.medicine_name||i.name||"").trim()).map(buildPharmacyPayload)
        );
      }

      const nextSaved = { ...eSaved, [sectionKey]: true };
      setESaved(nextSaved);
      syncSelectedPatient({ saved: nextSaved });
      toast(`${label} saved ✓`);
    } catch {
      toast(`Failed to save ${label}`, "e");
    }
  };

  // ── Build submission notes ────────────────────────────────────────────────
  const buildSubmissionNotes = (patient) => {
    const discharge      = patient?.discharge      || {};
    const medicalHistory = patient?.medicalHistory || {};
    const services       = Array.isArray(patient?.services)    ? patient.services    : [];
    const labReports     = Array.isArray(patient?.labReports)  ? patient.labReports  : [];
    const medicines      = Array.isArray(patient?.medicalBill) ? patient.medicalBill : [];
    const billing        = patient?.billing || {};
    const reportLines    = labReports.map(r => {
      const testNames = Array.isArray(r.tests) ? r.tests.map(t => t.name||t.testName).filter(Boolean) : [];
      const label     = r.reportName||r.name||r.reportType||"Report";
      const detail    = r.result||r.remarks||testNames.join(", ")||"Completed";
      return `- ${label}${r.date ? ` (${r.date})` : ""}: ${detail}`;
    });
    return [
      `UHID: ${patient?.uhid || ""}`,
      `Admission No: ${patient?.admNo || ""}`,
      `Patient: ${patient?.patientName || ""}`,
      `Discharge Type: ${discharge.dischargeType || "NORMAL"}`,
      `Diagnosis: ${discharge.diagnosis||medicalHistory.previousDiagnosis||""}`,
      `Services: ${services.map(s=>s.name||s.serviceName||s.title).filter(Boolean).join(" | ")||"None"}`,
      `Lab Reports:\n${reportLines.length ? reportLines.join("\n") : "- None"}`,
      `Medicine Bill: ${medicines.length}`,
      `Billing: discount=${billing.discount||0}, advance=${billing.advance||0}, paidNow=${billing.paidNow||0}`,
    ].join("\n");
  };

  // ── Submit task ───────────────────────────────────────────────────────────
  const submitTask = async () => {
    if (saving || !sel) return;
    setSaving(true);
    try {
      const reportRows = eLabRep
        .filter(r => (r.reportName||r.reportType||r.findings||r.impression||"").trim() || (Array.isArray(r.tests)&&r.tests.length))
        .map(buildLabReportPayload);
      const medRows = eMedBill
        .filter(i => (i.item||i.medicine_name||i.name||"").trim())
        .map(buildPharmacyPayload);

      await apiService.saveLabReportsBulk(sel.uhid, sel.admNo, reportRows);
      await apiService.savePharmacyRecordsBulk(sel.uhid, sel.admNo, medRows);

      const nextSaved = { ...eSaved, reports:true, medicines:true };
      setESaved(nextSaved);
      syncSelectedPatient({ saved:nextSaved, labReports:eLabRep, medicalBill:eMedBill });

      if (sel.taskId) {
        try { await apiService.updateTask(sel.taskId, { status:"Completed", description: buildSubmissionNotes(sel) }); } catch {}
        try { await apiService.requestPrint(sel.uhid, sel.admNo); } catch {}

        setPatients(prev => prev.map(p =>
          p.uhid === sel.uhid && p.admNo === sel.admNo
            ? { ...p, taskStatus:"completed", billing:{ ...p.billing, printStatus:"PENDING" } }
            : p
        ));
        setSel(prev => prev
          ? { ...prev, taskStatus:"completed", billing:{ ...prev.billing, printStatus:"PENDING" } }
          : prev
        );
        setShowConfirm(false);
        toast("Submitted to HOD and Admin ✓");
      }
    } catch {
      toastLib.error("Task submission failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Report / test updaters ────────────────────────────────────────────────
  const updRep  = (ri, k, v) => setELabRep(p => { const n=JSON.parse(JSON.stringify(p)); n[ri][k]=v; return n; });
  const updTest = (ri, ti, k, v) => setELabRep(p => { const n=JSON.parse(JSON.stringify(p)); n[ri].tests[ti][k]=v; return n; });
  const addTest = ri => setELabRep(p => { const n=JSON.parse(JSON.stringify(p)); n[ri].tests.push({id:Date.now(),name:"",value:"",unit:"",refRange:"",status:"Normal"}); return n; });
  const delTest = (ri, ti) => setELabRep(p => { const n=JSON.parse(JSON.stringify(p)); n[ri].tests.splice(ti,1); return n; });

  // ── Service updaters ──────────────────────────────────────────────────────
  const updSvc = (i, k, v) => setESvc(prev => {
    const n = [...prev];
    n[i] = { ...n[i], [k]: v };
    if (k === "qty" || k === "rate")
      n[i].amount = parseFloat(n[i].qty||0) * parseFloat(n[i].rate||0);
    return n;
  });
  const updSvcAmount = (i, value) => setESvc(prev => {
    const n = [...prev]; n[i] = { ...n[i], amount: value }; return n;
  });

  return {
    // state
    patients, setPatients,
    medicineMaster,
    view, setView,
    sel, setSel,
    activeTab, setActiveTab,
    showConfirm, setShowConfirm,
    saving,
    toasts,
    repFilter, setRepFilter,
    reportSearch, setReportSearch,
    eDis, setEDis,
    eMed, setEMed,
    eSvc, setESvc,
    eLabRep, setELabRep,
    eMedBill, setEMedBill,
    eBilling, setEBilling,
    eSaved, setESaved,
    backendTemplates,
    // actions
    toast,
    openPatient,
    saveSection,
    submitTask,
    syncSelectedPatient,
    findMedicineMasterMatch,
    updRep, updTest, addTest, delTest,
    updSvc, updSvcAmount,
  };
}