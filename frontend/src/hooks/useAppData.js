import { useState, useCallback, useMemo } from "react";
import { blankPatient, blankDischarge, blankBilling } from "../utils/helpers";
import { apiService } from "../services/apiService";

export function useAppData() {
  const normalizeBranches = useCallback((response) => {
    const rows = Array.isArray(response) ? response : (response?.results || response?.data || []);
    return rows.map((row, index) => ({
      id: row.id ?? row.branch ?? index,
      code: String(row.branch || "").toUpperCase(),
      slug: String(row.slug || row.branch || `branch-${index + 1}`).toLowerCase(),
      name: row.branch_name || row.branch || `Branch ${index + 1}`,
      hospitalName: row.hospital_name || "Sangi Hospital",
      color: ["#3b82f6", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][index % 6],
      address: row.address || "", phone: row.phone || "", email: row.email || "",
      uhidPrefix: row.uhid_prefix || "",
    }));
  }, []);

  const [loggedIn, setLoggedIn] = useState(() => { try { return sessionStorage.getItem('hms_loggedIn') === 'true'; } catch { return false; } });
  const [currentUser, setCurrentUser] = useState(() => { try { const u = sessionStorage.getItem('hms_currentUser'); return u ? JSON.parse(u) : null; } catch { return null; } });
  const [locId, setLocId] = useState(() => { try { return sessionStorage.getItem("hms_locId") || "laxmi"; } catch { return "laxmi"; } });
  const [page, setPage] = useState(() => { try { return sessionStorage.getItem('hms_page') || 'patient'; } catch { return 'patient'; } });
  const [subPage, setSubPage] = useState("search");
  const [uhid, setUhid] = useState(null);
  const [admNo, setAdmNo] = useState(1);
  const [showUHID, setShowUHID] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [selectedAdmissionType, setSelectedAdmissionType] = useState("IPD");
  const [patientDone, setPatientDone] = useState(false);
  const [medicalDone, setMedicalDone] = useState(false);
  const [dischargeDone, setDischargeDone] = useState(false);
  const [servicesDone, setServicesDone] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(null);
  const [printRequests, setPrintRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [branchSettings, setBranchSettings] = useState(() => { try { const raw = sessionStorage.getItem("hms_branches"); return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const [patient, setPatient] = useState(blankPatient());
  const [medicalHistory, setMedicalHistory] = useState({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "", doctorQual: "" });
  const [discharge, setDischarge] = useState(blankDischarge());
  const [svcs, setSvcs] = useState([]);
  const [billing, setBilling] = useState(blankBilling());
  const [errs, setErrs] = useState({});
  const [db, setDb] = useState({});
  const [masterServices, setMasterServices] = useState([]); // eslint-disable-line no-unused-vars

  const getBranchBySlug = useCallback((slug) => { const n = String(slug || "").toLowerCase(); return branchSettings.find(b => b.slug === n) || null; }, [branchSettings]);
  const getBranchByCode = useCallback((code) => { const n = String(code || "").toUpperCase(); return branchSettings.find(b => b.code === n) || null; }, [branchSettings]);
  const defaultBranch = useMemo(() => branchSettings[0] || { slug: "laxmi", code: "LNM", name: "Lakshmi Nagar", color: "#3b82f6" }, [branchSettings]);

  const resolveUserBranchSlug = useCallback((user) => {
    const role = String(user?.role || "").toLowerCase();
    if (!["admin", "branchadmin"].includes(role)) return null;
    const byCode = getBranchByCode(user?.branch);
    if (byCode?.slug) return byCode.slug;
    const normalizedBranch = String(user?.branch || "").toLowerCase();
    const bySlug = getBranchBySlug(normalizedBranch);
    if (bySlug?.slug) return bySlug.slug;
    return normalizedBranch || null;
  }, [getBranchByCode, getBranchBySlug]);

  const normalizePatientList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return Object.values(response || {}).flat().filter(Array.isArray).flat();
  };

  const splitPatientsByBranch = useCallback((patients) => {
    const branches = branchSettings.length ? branchSettings : [defaultBranch];
    const grouped = Object.fromEntries(branches.map(b => [b.slug, []]));
    patients.forEach(p => {
      const meta = getBranchByCode(p.branch_location) || defaultBranch;
      const slug = meta?.slug || defaultBranch.slug;
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push(p);
    });
    return grouped;
  }, [branchSettings, defaultBranch, getBranchByCode]);

  const loadBranches = useCallback(async () => {
    try {
      const raw = normalizeBranches(await apiService.getHospitalBranches());
      if (!raw.length) return;
      const seen = new Set();
      const deduped = raw.filter(b => { const s = (b.slug || b.branch || b.code || "").replace(/-branch$/, ""); if (seen.has(s)) return false; seen.add(s); return true; });
      setBranchSettings(prev => { const ps = JSON.stringify(prev), ns = JSON.stringify(deduped); if (ps === ns) return prev; try { sessionStorage.setItem("hms_branches", ns); } catch {} return deduped; });
    } catch { /* branch load failed silently */ }
  }, [normalizeBranches]);

  const loadDashboardData = useCallback(async (userRole) => {
    try {
      const [patientsResult, servicesResult, doctorsResult] = await Promise.allSettled([
        apiService.getPatients(), apiService.getServiceMaster(), apiService.getDoctors(),
      ]);
      const livePatients = normalizePatientList(patientsResult.status === "fulfilled" ? patientsResult.value : []);
      setMasterServices(servicesResult.status === "fulfilled" ? (Array.isArray(servicesResult.value) ? servicesResult.value : (servicesResult.value?.results || [])) : []);
      if (doctorsResult.status === "fulfilled") {
        const apiDoctors = Array.isArray(doctorsResult.value) ? doctorsResult.value : [];
        const branchDoctors = [];
        setDoctors([...apiDoctors, ...branchDoctors]);
      } else { setDoctors([]); }
      setDb(splitPatientsByBranch(livePatients));
      if (["superadmin", "admin", "branchadmin"].includes(String(userRole || "").toLowerCase())) {
        try {
          const pending = await apiService.getPendingPrints();
          const reqs = [];
          pending.forEach(p => { p.admissions.forEach(adm => { if (adm.billing?.printStatus === 'PENDING') reqs.push({ uhid: p.uhid, admNo: adm.admNo, locId: getBranchByCode(p.branch_location)?.slug || defaultBranch.slug, patient: p, adm, svcs: adm.services || [], requestedAt: adm.billing.printRequestedAt || new Date().toISOString() }); }); });
          setPrintRequests(reqs);
        } catch { /* print requests load failed silently */ }
      }
    } catch { /* dashboard load failed silently */ }
  }, [defaultBranch.slug, getBranchByCode, splitPatientsByBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAll = () => {
    setPage("patient"); setSubPage("search"); setUhid(null); setShowUHID(false);
    setPatientDone(false); setMedicalDone(false); setDischargeDone(false); setServicesDone(false);
    setIsReturning(false); setSelectedAdmissionType("IPD");
    setPatient(blankPatient()); setDischarge(blankDischarge()); setSvcs([]); setBilling(blankBilling());
    setErrs({});
    setMedicalHistory({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "", doctorQual: "" });
  };

  const syncDb = (currentUhid, currentAdmNo, dataKey, dataValue) => {
    setDb(prev => { const next = JSON.parse(JSON.stringify(prev)); Object.keys(next).forEach(bucket => { const p = (next[bucket] || []).find(x => x.uhid === currentUhid); if (!p) return; const a = p.admissions.find(x => x.admNo === currentAdmNo); if (a) a[dataKey] = dataValue; }); return next; });
  };

  const findAdmissionRecord = (lookupUhid, lookupAdmNo, lookupLocId = null) => {
    const buckets = lookupLocId ? [lookupLocId] : Object.keys(db);
    for (const bucket of buckets) { const p = (db[bucket] || []).find(p => p.uhid === lookupUhid); if (!p) continue; const a = (p.admissions || []).find(a => a.admNo === lookupAdmNo); if (a) return a; }
    return null;
  };

  return {
    loggedIn, setLoggedIn, currentUser, setCurrentUser, locId, setLocId,
    page, setPage, subPage, setSubPage, uhid, setUhid, admNo, setAdmNo,
    showUHID, setShowUHID, isReturning, setIsReturning,
    selectedAdmissionType, setSelectedAdmissionType,
    patientDone, setPatientDone, medicalDone, setMedicalDone,
    dischargeDone, setDischargeDone, servicesDone, setServicesDone,
    showPrint, setShowPrint, showPatientDetail, setShowPatientDetail,
    printRequests, setPrintRequests, doctors, branchSettings,
    patient, setPatient, medicalHistory, setMedicalHistory,
    discharge, setDischarge, svcs, setSvcs, billing, setBilling,
    errs, setErrs, db, setDb,
    getBranchBySlug, getBranchByCode, defaultBranch,
    resolveUserBranchSlug, normalizePatientList, splitPatientsByBranch,
    loadBranches, loadDashboardData, resetAll, syncDb, findAdmissionRecord,
  };
}
