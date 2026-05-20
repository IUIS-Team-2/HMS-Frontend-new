import { useState, useEffect, useCallback, useMemo, createContext } from "react";
import { NAV_PAGES } from "./data/constants";
import { blankPatient, blankDischarge, blankBilling } from "./utils/helpers";
import { Ico, IC, PAGE_ICONS } from "./components/ui/Icons";
import './App.css';

// Toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Core Components
import LiveDate from "./components/layout/LiveDate";
import { apiService } from "./services/apiService";

// Pages
import SearchPage from "./pages/SearchPage";
import PatientFormPage from "./pages/PatientFormPage";
import DischargePage from "./pages/DischargePage";
import ServicesPage from "./pages/ServicesPage";
import SummaryPage from "./pages/SummaryPage";
import PatientsHistoryPage from "./pages/PatientsHistoryPage";
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ManagementAdminDashboard from './pages/Managementadmindashboard';
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import LoginPage from "./pages/LoginPage";
import HodDashboard from "./pages/HodDashboard";
import UploadingDashboard from "./pages/UploadingDashboard";
import QueryDashboard from "./pages/QueryDashboard";
import OpdDashboard from "./pages/OpdDashboard";
import IntimationDashboard from "./pages/IntimationDashboard";
import BranchAdminDashboard from "./pages/BranchAdminDashboard";
import BillingDashboard from "./pages/BillingDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import NursingDashboard from "./pages/NursingDashboard";
import NotesDashboard from "./pages/NotesDashboard";          // ← NEW
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import ThemeModeDock from "./components/ui/ThemeModeDock";

// Modals
import UHIDScreen from "./modals/UHIDScreen";
import PrintModal from "./modals/PrintModal";
import PatientDetailModal from "./modals/PatientDetailModal";

function ToastBridge() {
  const { isDark } = useTheme();
  return <ToastContainer position="bottom-right" theme={isDark ? "dark" : "light"} />;
}

export default function App() {
  const normalizeBranches = useCallback((response) => {
    const rows = Array.isArray(response) ? response : (response?.results || response?.data || []);
    return rows.map((row, index) => ({
      id: row.id ?? row.branch ?? index,
      code: String(row.branch || "").toUpperCase(),
      slug: String(row.slug || row.branch || `branch-${index + 1}`).toLowerCase(),
      name: row.branch_name || row.branch || `Branch ${index + 1}`,
      hospitalName: row.hospital_name || "Sangi Hospital",
      color: ["#3b82f6", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][index % 6],
      address: row.address || "",
      phone: row.phone || "",
      email: row.email || "",
      uhidPrefix: row.uhid_prefix || "",
    }));
  }, []);

  const [loggedIn, setLoggedIn] = useState(() => {
    try { return sessionStorage.getItem('hms_loggedIn') === 'true'; } catch { return false; }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try { const u = sessionStorage.getItem('hms_currentUser'); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [locId, setLocId] = useState(() => {
    try { return sessionStorage.getItem("hms_locId") || "laxmi"; } catch { return "laxmi"; }
  });
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem('hms_page') || 'patient'; } catch { return 'patient'; }
  });
  const [subPage, setSubPage] = useState("search");
  const [uhid, setUhid] = useState(null);
  const [admNo, setAdmNo] = useState(1);
  const [showUHID, setShowUHID] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [selectedAdmissionType, setSelectedAdmissionType] = useState("IPD");
  const [patientDone, setPatientDone] = useState(false);
  const [dischargeDone, setDischargeDone] = useState(false);
  const [servicesDone, setServicesDone] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(null);
  const [printRequests, setPrintRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [branchSettings, setBranchSettings] = useState(() => {
    try {
      const raw = sessionStorage.getItem("hms_branches");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [patient, setPatient] = useState(blankPatient());
  const [medicalHistory, setMedicalHistory] = useState({
    previousDiagnosis: "", pastSurgeries: "", currentMedications: "",
    treatingDoctor: "", knownAllergies: "", chronicConditions: "",
    familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "", doctorQual: ""
  });
  const [medicalDone, setMedicalDone] = useState(false);
  const [discharge, setDischarge] = useState(blankDischarge());
  const [svcs, setSvcs] = useState([]);
  const [billing, setBilling] = useState(blankBilling());
  const [errs, setErrs] = useState({});

  const [db, setDb] = useState({});
  const [masterServices, setMasterServices] = useState([]); // eslint-disable-line no-unused-vars

  const getBranchBySlug = useCallback((slug) => {
    const normalized = String(slug || "").toLowerCase();
    return branchSettings.find((branch) => branch.slug === normalized) || null;
  }, [branchSettings]);

  const getBranchByCode = useCallback((code) => {
    const normalized = String(code || "").toUpperCase();
    return branchSettings.find((branch) => branch.code === normalized) || null;
  }, [branchSettings]);

  const defaultBranch = useMemo(
    () => branchSettings[0] || { slug: "laxmi", code: "LNM", name: "Lakshmi Nagar", color: "#3b82f6" },
    [branchSettings]
  );

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

  const loadBranches = useCallback(async () => {
    try {
      const branchesResponse = await apiService.getHospitalBranches();
      const rawBranches = normalizeBranches(branchesResponse);
      if (!rawBranches.length) return;
      // Deduplicate: keep only one entry per base slug (strips suffixes like -branch)
      const seenSlugs = new Set();
      const normalizedBranches = rawBranches.filter(b => {
        const slug = (b.slug || b.branch || b.code || "").replace(/-branch$/, "");
        if (seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
      });

      setBranchSettings((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(normalizedBranches);
        if (prevSerialized === nextSerialized) return prev;
        try { sessionStorage.setItem("hms_branches", nextSerialized); } catch {}
        return normalizedBranches;
      });
    } catch (error) {
      console.error("Failed to load hospital branches:", error);
    }
  }, [normalizeBranches]);

  const splitPatientsByBranch = useCallback((patients) => {
    const branches = branchSettings.length ? branchSettings : [defaultBranch];
    const grouped = Object.fromEntries(branches.map((branch) => [branch.slug, []]));
    patients.forEach((patient) => {
      const branchMeta = getBranchByCode(patient.branch_location) || defaultBranch;
      const targetSlug = branchMeta?.slug || defaultBranch.slug;
      if (!grouped[targetSlug]) grouped[targetSlug] = [];
      grouped[targetSlug].push(patient);
    });
    return grouped;
  }, [branchSettings, defaultBranch, getBranchByCode]);

  const findAdmissionRecord = (lookupUhid, lookupAdmNo, lookupLocId = null) => {
    const buckets = lookupLocId ? [lookupLocId] : Object.keys(db);
    for (const bucket of buckets) {
      const patientRecord = (db[bucket] || []).find(p => p.uhid === lookupUhid);
      if (!patientRecord) continue;
      const admissionRecord = (patientRecord.admissions || []).find(a => a.admNo === lookupAdmNo);
      if (admissionRecord) return admissionRecord;
    }
    return null;
  };

  const isDone = (id) => {
    if (id === 'patient')   return patientDone;
    if (id === 'medical')   return medicalDone;
    if (id === 'discharge') return dischargeDone;
    if (id === 'services')  return servicesDone;
    return true;
  };

  const canNav = (id) => {
    const steps = ["patient", "medical", "discharge", "services", "summary"];
    const idx = steps.indexOf(id);
    if (idx <= 0) return true;
    return isDone(steps[idx - 1]);
  };

  const navTo      = (id) => { if (canNav(id)) setPage(id); };
  const endSession = ()   => { resetAll(); setSubPage("search"); };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
    resetAll();
    setPrintRequests([]);
    try {
      sessionStorage.removeItem('hms_loggedIn');
      sessionStorage.removeItem('hms_currentUser');
      sessionStorage.removeItem('hms_page');
      sessionStorage.removeItem('hms_token');
      sessionStorage.removeItem('hms_locId');
    } catch {}
  };

  const loadDashboardData = useCallback(async (userRole) => {
    try {
      const [patientsResult, servicesResult, doctorsResult] = await Promise.allSettled([
        apiService.getPatients(),
        apiService.getServiceMaster(),
        apiService.getDoctors(),
      ]);

      const livePatients = normalizePatientList(patientsResult.status === "fulfilled" ? patientsResult.value : []);
      if (servicesResult.status === "fulfilled") {
        setMasterServices(Array.isArray(servicesResult.value) ? servicesResult.value : (servicesResult.value?.results || []));
      } else {
        setMasterServices([]);
      }
      

if (servicesResult.status === "fulfilled") {
  setMasterServices(
    Array.isArray(servicesResult.value)
      ? servicesResult.value
      : (servicesResult.value?.results || [])
  );
} else {
  setMasterServices([]);
}

if (doctorsResult.status === "fulfilled") {

  const apiDoctors = Array.isArray(doctorsResult.value)
    ? doctorsResult.value
    : [];

  const branchDoctors = [];

  Object.keys(localStorage).forEach((key) => {

    if (key.startsWith("medcore_doctors_")) {

      try {

        const parsed = JSON.parse(localStorage.getItem(key) || "[]");

        if (Array.isArray(parsed)) {
          branchDoctors.push(...parsed);
        }

      } catch (e) {
        console.error("Doctor parse error:", e);
      }
    }
  });

  const mergedDoctors = [
    ...apiDoctors,
    ...branchDoctors
  ];

  console.log("MERGED DOCTORS:", mergedDoctors);

  setDoctors(mergedDoctors);

} else {
  setDoctors([]);
}

      const scopedPatients = livePatients;

      setDb(splitPatientsByBranch(scopedPatients));

      if (["superadmin", "admin", "branchadmin"].includes(String(userRole || "").toLowerCase())) {
        try {
          const pendingPatients = await apiService.getPendingPrints();
          const formattedRequests = [];
          pendingPatients.forEach(p => {
            p.admissions.forEach(adm => {
              if (adm.billing && adm.billing.printStatus === 'PENDING') {
                formattedRequests.push({
                  uhid: p.uhid, admNo: adm.admNo,
                  locId: (getBranchByCode(p.branch_location)?.slug) || defaultBranch.slug,
                  patient: p, adm: adm, svcs: adm.services || [],
                  requestedAt: adm.billing.printRequestedAt || new Date().toISOString()
                });
              }
            });
          });
          setPrintRequests(formattedRequests);
        } catch (printError) {
          console.error("Failed to load pending print requests:", printError);
        }
      }
    } catch (error) {
      console.error("Failed to load live backend data:", error);
    }
  }, [defaultBranch.slug, getBranchByCode, splitPatientsByBranch]);

  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    loadBranches();
  }, [loggedIn, currentUser, loadBranches]);

  useEffect(() => {
    if (loggedIn && currentUser) {
      loadDashboardData(currentUser.role);
    }
  }, [loggedIn, currentUser, loadDashboardData]);

  useEffect(() => {
    try { sessionStorage.setItem("hms_locId", locId); } catch {}
  }, [locId]);

  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    const userBranchSlug = resolveUserBranchSlug(currentUser);
    if (userBranchSlug && locId !== userBranchSlug) {
      setLocId(userBranchSlug);
    }
  }, [loggedIn, currentUser, locId, resolveUserBranchSlug]);

  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    if (page === "history" || (page === "patient" && subPage === "search")) {
      loadDashboardData(currentUser.role);
    }
  }, [loggedIn, currentUser, page, subPage, loadDashboardData]);

  useEffect(() => {
    if (!loggedIn || !currentUser) return undefined;
    const onFocus = () => loadDashboardData(currentUser.role);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loggedIn, currentUser, loadDashboardData]);

  useEffect(() => {
    if (!loggedIn || !currentUser) return undefined;
    const refreshRoles = new Set(["office_admin", "managementadmin", "admin", "branchadmin"]);
    if (!refreshRoles.has(String(currentUser.role || "").toLowerCase())) return undefined;

    const timer = window.setInterval(() => {
      loadDashboardData(currentUser.role);
    }, 20000);

    return () => window.clearInterval(timer);
  }, [loggedIn, currentUser, loadDashboardData]);

  const currentDb = db[locId] || [];
  const currentBranch = getBranchBySlug(locId) || defaultBranch;

  const resetAll = () => {
    setPage("patient");
    setSubPage("search");
    setUhid(null);
    setShowUHID(false);
    setPatientDone(false);
    setMedicalDone(false);
    setDischargeDone(false);
    setServicesDone(false);
    setIsReturning(false);
    setSelectedAdmissionType("IPD");
    setPatient(blankPatient());
    setDischarge(blankDischarge());
    setSvcs([]);
    setBilling(blankBilling());
    setErrs({});
    setMedicalHistory({
      previousDiagnosis: "", pastSurgeries: "", currentMedications: "",
      treatingDoctor: "", knownAllergies: "", chronicConditions: "",
      familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "", doctorQual: ""
    });
  };

  const handleLogin = useCallback((user, loc) => {
    setCurrentUser(user);
    const userBranchSlug = resolveUserBranchSlug(user);
    const nextLocId = userBranchSlug || loc || user?.locations?.[0] || defaultBranch.slug;
    setLocId(nextLocId);
    setLoggedIn(true);

    let startingPage = "patient";
    if      (user.role === "superadmin")                                    startingPage = "superadmin";
    else if (user.role === "admin" || user.role === "branchadmin")          startingPage = "branchadmin";
    else if (user.role === "managementadmin" || user.role === "office_admin") startingPage = "managementadmin";
    else if (user.role === "hod")                                           startingPage = "hod";
    else if (user.role === "billing")                                       startingPage = "billing";
    else if (user.role === "opd")                                           startingPage = "opd";
    else if (user.role === "intimation")                                    startingPage = "intimation";
    else if (user.role === "query")                                         startingPage = "query";
    else if (user.role === "uploading")                                     startingPage = "uploading";
    else if (user.role === "doctor")                                        startingPage = "doctor";
    else if (user.role === "nursing")                                       startingPage = "nursing";
    else if (user.role === "notes")                                         startingPage = "notes";   // ← NEW
    else if (["ipd", "pharmacy", "lab", "radiology", "receptionist", "employee"].includes(user.role))
                                                                            startingPage = "employee";

    try {
      sessionStorage.setItem('hms_loggedIn', 'true');
      sessionStorage.setItem('hms_currentUser', JSON.stringify(user));
      sessionStorage.setItem('hms_page', startingPage);
      sessionStorage.setItem('hms_locId', nextLocId);
    } catch {}

    if (startingPage === "patient") { setPage("patient"); setSubPage("search"); }
    else setPage(startingPage);
  }, [defaultBranch.slug, resolveUserBranchSlug]);

  useEffect(() => { setLoginCallback(handleLogin); }, [handleLogin]);

  const syncDb = (currentUhid, currentAdmNo, dataKey, dataValue) => {
    setDb(prev => {
      const nextDb = JSON.parse(JSON.stringify(prev));
      Object.keys(nextDb).forEach((bucket) => {
        const p = (nextDb[bucket] || []).find(x => x.uhid === currentUhid);
        if (!p) return;
        const a = p.admissions.find(x => x.admNo === currentAdmNo);
        if (a) a[dataKey] = dataValue;
      });
      return nextDb;
    });
  };

  const handleNewAdmission = (existing, admissionType = "IPD") => {
    const { admissions, ...pd } = existing;
    const resolvedType = admissionType || admissions?.[admissions.length - 1]?.admissionType || "IPD";
    setSelectedAdmissionType(resolvedType);
    setPatient({
      ...pd,
      payMode: existing.payMode || "",
      cashlessType: existing.cashlessType || "",
      tpa: existing.tpa || "",
      tpaCard: existing.tpaCard || "",
      tpaValidity: existing.tpaValidity || "",
      tpaCardType: existing.tpaCardType || "",
      tpaPanelCardNo: existing.tpaPanelCardNo || "",
      tpaPanelValidity: existing.tpaPanelValidity || "",
    });
    setUhid(existing.uhid);
    setAdmNo(admissions?.length ? admissions.length + 1 : 2);
    setIsReturning(true);
    setDischarge(prev => ({ ...prev, doa: new Date().toISOString().slice(0, 16) }));
    setSubPage("form");
  };

  const handleDischargeFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj;
    setSelectedAdmissionType(admObj.admissionType || "IPD");
    setPatient({
      ...pd,
      payMode: patientObj.payMode || "",
      cashlessType: patientObj.cashlessType || "",
      tpa: patientObj.tpa || "",
      tpaCard: patientObj.tpaCard || "",
      tpaValidity: patientObj.tpaValidity || "",
      tpaCardType: patientObj.tpaCardType || "",
      tpaPanelCardNo: patientObj.tpaPanelCardNo || "",
      tpaPanelValidity: patientObj.tpaPanelValidity || "",
    });
    setUhid(patientObj.uhid);
    setAdmNo(admObj.admNo);
    setIsReturning(true);
    const doaValue = admObj.discharge?.doa || admObj.dateTime || "";
    setDischarge({ ...blankDischarge(), ...(admObj.discharge || {}), doa: doaValue });
    setSvcs(admObj.services && admObj.services.length ? admObj.services : []);
    setBilling({ ...blankBilling(), ...(admObj.billing || {}) });
    setPatientDone(true);
    setDischargeDone(false);
    setServicesDone(false);
    setShowPatientDetail(null);
    setShowUHID(false);
    setPage("discharge");
  };

  const handleMedicalFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj;
    setSelectedAdmissionType(admObj.admissionType || "IPD");
    setPatient({
      ...pd,
      payMode: patientObj.payMode || "",
      cashlessType: patientObj.cashlessType || "",
      tpa: patientObj.tpa || "",
      tpaCard: patientObj.tpaCard || "",
      tpaValidity: patientObj.tpaValidity || "",
      tpaCardType: patientObj.tpaCardType || "",
      tpaPanelCardNo: patientObj.tpaPanelCardNo || "",
      tpaPanelValidity: patientObj.tpaPanelValidity || "",
    });
    setUhid(patientObj.uhid);
    setAdmNo(admObj.admNo);
    setIsReturning(true);
    setMedicalHistory(admObj.medicalHistory || {
      previousDiagnosis: "", pastSurgeries: "", currentMedications: "",
      treatingDoctor: "", knownAllergies: "", chronicConditions: "",
      familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "", doctorQual: ""
    });
    setPatientDone(true);
    setMedicalDone(false);
    setShowPatientDetail(null);
    setPage("medical");
  };

  const handleGenerateBillFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj;
    setSelectedAdmissionType(admObj.admissionType || "IPD");
    setPatient({
      ...pd,
      payMode: patientObj.payMode || "",
      cashlessType: patientObj.cashlessType || "",
      tpa: patientObj.tpa || "",
      tpaCard: patientObj.tpaCard || "",
      tpaValidity: patientObj.tpaValidity || "",
      tpaCardType: patientObj.tpaCardType || "",
      tpaPanelCardNo: patientObj.tpaPanelCardNo || "",
      tpaPanelValidity: patientObj.tpaPanelValidity || "",
    });
    setUhid(patientObj.uhid);
    setAdmNo(admObj.admNo);
    setIsReturning(true);
    setDischarge({ ...blankDischarge(), ...(admObj.discharge || {}) });
    setSvcs(admObj.services && admObj.services.length ? admObj.services : []);
    setBilling({ ...blankBilling(), ...(admObj.billing || {}) });
    setPatientDone(true);
    setDischargeDone(true);
    setServicesDone(false);
    setShowPatientDetail(null);
    setShowUHID(false);
    setPage("services");
  };

  const handleSetExpectedDod = async (uhidToUpdate, admNoToUpdate, date) => {
    try {
      await apiService.setExpectedDod(uhidToUpdate, admNoToUpdate, date);
      setDb(prev => {
        const nextDb = JSON.parse(JSON.stringify(prev));
        nextDb[locId].forEach(p => {
          if (p.uhid === uhidToUpdate) {
            p.admissions.forEach(a => {
              if (a.admNo === admNoToUpdate) {
                if (!a.discharge) a.discharge = {};
                a.discharge.expectedDod = date;
              }
            });
          }
        });
        return nextDb;
      });
      toast.success("Expected Discharge Date saved!");
    } catch (error) {
      toast.error("Failed to set Expected Discharge Date on server.");
    }
  };

  const validatePatient = () => {
    const e = {};
    const nationalIdRaw = String(patient.nationalId || "");
    const nationalIdDigits = nationalIdRaw.replace(/\D/g, "");
    const emailRaw = String(patient.email || "").trim();
    if (!patient.patientName.trim())  e.patientName  = "Required";
    if (!patient.guardianName.trim()) e.guardianName = "Required";
    if (!patient.gender) e.gender = "Required";
    if (!patient.phone || String(patient.phone).replace(/\D/g, "").length !== 10) e.phone = "Must be 10 digits";
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) e.email = "Enter a valid email or leave it blank";
    if (!/^\d{12}$/.test(nationalIdDigits)) e.nationalId = "Aadhaar must be exactly 12 digits";
    if (!patient.address.trim()) e.address = "Required";
    setErrs(e); return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validatePatient()) return;

    const normalizedAadhaar = String(patient.nationalId || "").replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    const sanitizedPayload = { ...patient, nationalId: normalizedAadhaar };
    if (!String(sanitizedPayload.email || "").trim()) sanitizedPayload.email = "";
    if (!sanitizedPayload.dob)              sanitizedPayload.dob              = null;
    if (!sanitizedPayload.tpaValidity)      sanitizedPayload.tpaValidity      = null;
    if (!sanitizedPayload.tpaPanelValidity) sanitizedPayload.tpaPanelValidity = null;

    try {
      const localNow = new Date();
      localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
      const doaValue = localNow.toISOString().slice(0, 16);

      if (isReturning && uhid) {
        // ⚠️ CRITICAL: Strip payMode and all cashless fields from the update payload.
        // For a new admission the receptionist picks admission type only — the original
        // patient's payMode must NEVER be overwritten by whatever the form currently shows.
        const {
          payMode, cashlessType, tpa, tpaCard, tpaValidity,
          tpaCardType, tpaPanelCardNo, tpaPanelValidity,
          ...safeUpdatePayload
        } = sanitizedPayload;
        await apiService.updatePatient(uhid, safeUpdatePayload);
        const admResponse = await apiService.newAdmission(uhid, selectedAdmissionType);
        if (admResponse?.uhid) {
          setDb((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            Object.keys(next).forEach((bucket) => {
              next[bucket] = (next[bucket] || []).filter((existing) => existing.uhid !== admResponse.uhid);
            });
            const branchMeta = getBranchByCode(admResponse.branch_location) || currentBranch || defaultBranch;
            if (!next[branchMeta.slug]) next[branchMeta.slug] = [];
            next[branchMeta.slug].unshift(admResponse);
            return next;
          });
          setLocId((getBranchByCode(admResponse.branch_location)?.slug) || locId);
          setAdmNo(admResponse.current_admission_no || admNo + 1);
        } else {
          const livePatients = normalizePatientList(await apiService.getPatients());
          setDb(splitPatientsByBranch(livePatients));
          setAdmNo(admNo + 1);
        }
        setDischarge(prev => ({ ...prev, doa: doaValue }));
        setShowUHID(true);
        setSubPage("search");
      } else {
        const registrationPayload = {
          ...sanitizedPayload,
          locId,
          admissionType: selectedAdmissionType,
        };

        console.log("Registering new patient with payload:", registrationPayload);

        const savedPatient = await apiService.registerPatient(registrationPayload);

        if (!savedPatient?.uhid) {
          throw new Error("Backend did not return a UHID after registration.");
        }

        const newUhid = savedPatient.uhid;
        setUhid(newUhid);
        setAdmNo(1);
        setIsReturning(false);
        setDischarge(prev => ({ ...prev, doa: doaValue }));
        const savedBranch = getBranchByCode(savedPatient.branch_location) || currentBranch || defaultBranch;
        setDb(prev => ({ ...prev, [savedBranch.slug]: [savedPatient, ...(prev[savedBranch.slug] || [])] }));
        setShowUHID(true);
      }

      toast.success("Patient registered successfully!");

    } catch (error) {
      const djangoErrors = error?.response?.data;
      if (djangoErrors) {
        const firstError = Object.entries(djangoErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
          .slice(0, 2)
          .join(" | ");
        toast.error(`Registration failed — ${firstError}`);
        console.error("Django validation errors:", djangoErrors);
      } else {
        toast.error("Error registering patient. Check console.");
        console.error("Registration error:", error);
      }
    }
  };

  const handleUHIDContinue   = () => { setPatientDone(true); setShowUHID(false); setPage("medical"); };
  const handleUHIDDashboard  = () => { setPatientDone(true); setShowUHID(false); setPage("patient"); setSubPage("search"); };
  const handleUHIDNewPatient = () => { endSession(); setSubPage("form"); };

  const handleSaveMedical = async () => {
    try {
      await apiService.updateMedicalHistory(uhid, admNo, medicalHistory);
      syncDb(uhid, admNo, "medicalHistory", medicalHistory);
      setMedicalDone(true);
      setPage("discharge");
      toast.success("Medical History saved!");
    } catch (error) { toast.error("Failed to save Medical History."); }
  };

  const handleSaveMedHistoryFromHistory = async (uhidVal, admNoVal, data) => {
    try {
      await apiService.updateMedicalHistory(uhidVal, admNoVal, data);
      setDb(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const p = next[locId].find(x => x.uhid === uhidVal);
        if (p) { const a = p.admissions.find(x => x.admNo === admNoVal); if (a) a.medicalHistory = data; }
        return next;
      });
      toast.success("Medical History updated!");
    } catch (error) { toast.error("Failed to update Medical History."); }
  };

  const handleSaveDischarge = async () => {
    try {
      await apiService.dischargePatient(uhid, admNo, discharge);
      syncDb(uhid, admNo, 'discharge', discharge);
      setDischargeDone(true);
      setPage("services");
      toast.success("Discharge details saved!");
    } catch (error) { toast.error("Failed to save Discharge."); }
  };

  const handleSaveServices = async (updatedSvcs, updatedBilling) => {
    try {
      const serviceResponse = await apiService.saveServicesBulk(uhid, admNo, updatedSvcs);
      await apiService.updateBilling(uhid, admNo, updatedBilling);
      const savedServices = serviceResponse?.services || updatedSvcs;
      setSvcs(savedServices);
      setBilling(updatedBilling);
      syncDb(uhid, admNo, 'services', savedServices);
      syncDb(uhid, admNo, 'billing', updatedBilling);
      setServicesDone(true);
      setPage("summary");
      toast.success("Services and Billing saved!");
    } catch (error) { toast.error("Failed to save Services/Billing."); }
  };

  const handleViewBill = (req) => {
    setShowPrint(true);
    setUhid(req.uhid);
    setPatient(req.patient || patient);
    setDischarge(req.adm?.discharge || discharge);
    setSvcs(req.svcs || svcs);
    setBilling(req.adm?.billing || billing);
    setLocId(req.locId);
    setAdmNo(req.admNo);
  };

  const handleRequestPrint = async () => {
    try {
      const safeUhid = uhid || patient?.uhid;
      const safeAdmNo = admNo || activeAdmission?.admNo || activeAdmission?.id;
      if (!safeUhid || !safeAdmNo) {
        toast.error("Admission details missing. Please reopen the patient bill and try again.");
        return;
      }
      await apiService.requestPrint(safeUhid, safeAdmNo);
      setBilling(prev => ({ ...prev, printStatus: "PENDING" }));
      toast.success("Print request sent to Branch Admin!");
    } catch (error) {
      const msg = error?.response?.data?.error || "Failed to send print request.";
      toast.error(msg);
    }
  };

  const handleApprovePrint = async (req, action) => {
    try {
      const backendAction = action === "approve" ? "APPROVED" : "REJECTED";
      await apiService.resolvePrint(req.uhid, req.admNo, backendAction);
      setPrintRequests(prev => prev.filter(r => !(r.uhid === req.uhid && r.admNo === req.admNo && r.locId === req.locId)));
      if (action === "approve") {
        // The req.adm.billing snapshot was captured when the queue loaded (still
        // PENDING). Override printStatus so SummaryPage's printApproved check
        // sees APPROVED and unlocks the Print button immediately.
        const approvedBilling = { ...(req.adm?.billing || billing), printStatus: "APPROVED" };
        setShowPrint(true);
        setUhid(req.uhid);
        setPatient(req.patient || patient);
        setDischarge(req.adm?.discharge || discharge);
        setSvcs(req.svcs || svcs);
        setBilling(approvedBilling);
        setLocId(req.locId);
        setAdmNo(req.admNo);
      }
      toast.success(`Bill ${backendAction.toLowerCase()} successfully!`);
    } catch (error) { toast.error("Failed to process approval."); }
  };

  const handlePatientSaved = (updatedPatient) => {
    if (!updatedPatient?.uhid) return;
    setDb(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      Object.keys(next).forEach(bucket => {
        next[bucket] = (next[bucket] || []).map(existing => {
          if (existing.uhid !== updatedPatient.uhid) return existing;
          return {
            ...existing,
            ...updatedPatient,
            admissions: updatedPatient.admissions || existing.admissions || [],
          };
        });
      });
      return next;
    });

    if (uhid === updatedPatient.uhid) {
      setPatient(prev => ({ ...prev, ...updatedPatient }));
    }

    setShowPatientDetail(prev => {
      if (!prev || prev.uhid !== updatedPatient.uhid) return prev;
      return {
        ...prev,
        ...updatedPatient,
        admissions: updatedPatient.admissions || prev.admissions || [],
      };
    });
  };

  const activeAdmission = findAdmissionRecord(uhid, admNo, locId);

  const handleNewPatient = (type = "IPD") => {
    setSelectedAdmissionType(type);
    setPatient(blankPatient());
    setUhid(null);
    setIsReturning(false);
    setShowUHID(false);
    setSubPage("form");
  };

  const renderRoute = () => {
    if (!loggedIn) {
      return (
        <>
          <LoginPage onLogin={handleLogin} />
          <ToastBridge />
        </>
      );
    }

    if (page === "superadmin") {
      return (
        <>
          {showPrint && (
            <PrintModal uhid={uhid} patient={patient} discharge={discharge}
              svcs={svcs} billing={billing} locId={locId} admNo={admNo}
              admission={activeAdmission} branch={currentBranch}
              onClose={() => setShowPrint(false)} />
          )}
          <SuperAdminDashboard
            db={db} branches={branchSettings} printRequests={printRequests}
            onApprovePrint={handleApprovePrint} onViewBill={handleViewBill}
            onBranchesChanged={async () => {
              await loadBranches();
              if (currentUser) await loadDashboardData(currentUser.role);
            }}
            onLogout={handleLogout}
          />
          <ToastBridge />
        </>
      );
    }

    if (page === "managementadmin") {
      return (
        <>
          <ManagementAdminDashboard currentUser={currentUser} db={db} locId={locId} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "hod") {
      return (
        <>
          <HodDashboard currentUser={currentUser} db={db} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "uploading") {
      return (
        <>
          <UploadingDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "query") {
      return (
        <>
          <QueryDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "opd") {
      return (
        <>
          <OpdDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "intimation") {
      return (
        <>
          <IntimationDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "branchadmin") {
      return (
        <>
          <BranchAdminDashboard
            currentUser={currentUser}
            db={db}
            locId={locId}
            printRequests={printRequests}
            onApprovePrint={handleApprovePrint}
            onViewBill={handleViewBill}
            onLogout={handleLogout}
          />
          <ToastBridge />
        </>
      );
    }

    if (page === "billing") {
      return (
        <>
          <BillingDashboard currentUser={currentUser} db={db} locId={locId} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "doctor") {
      return (
        <>
          <DoctorDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    if (page === "nursing") {
      return (
        <>
          <NursingDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    // ── Notes Dashboard ── (NEW)
    if (page === "notes") {
      return (
        <>
          <NotesDashboard currentUser={currentUser} onLogout={handleLogout} />
          <ToastBridge />
        </>
      );
    }

    return (
      <>
        {showPrint && (
          <PrintModal uhid={uhid} patient={patient} discharge={discharge}
            svcs={svcs} billing={billing} locId={locId} admNo={admNo} admission={activeAdmission} branch={currentBranch}
            onClose={() => setShowPrint(false)} />
        )}
        {showPatientDetail && (
          <PatientDetailModal patient={showPatientDetail}
            onClose={() => setShowPatientDetail(null)}
            onDischarge={handleDischargeFromHistory}
            onSaved={handlePatientSaved}
            currentUser={currentUser} />
        )}

        <header className="hdr">
          <div className="hdr-left">
            <div className="hdr-logo">
              <img src="/logo192.png" alt="logo" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover" }} />
            </div>
            <div>
              <p className="hdr-name">Sangi Hospital</p>
              <p className="hdr-sub">IPD Portal</p>
            </div>
          </div>

          <div className="hdr-right">
            {uhid && <div className="hdr-uhid"><span className="hdr-uhid-label">UHID</span>{uhid}</div>}
            <LiveDate />
            <ThemeModeDock variant="inline" />
            {currentUser && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
                <div style={{ fontSize: 12, lineHeight: 1.4, textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--hdr-text)" }}>{currentUser.name}</div>
                  <div style={{ color: "var(--hdr-sub)" }}>
                    {currentUser?.accessScope === "all_hospitals" ? "All hospitals" : `${currentBranch?.name || "Branch"} Branch`}
                  </div>
                </div>
                <button onClick={handleLogout}
                  style={{ padding: "6px 14px", borderRadius: 8, background: "var(--hdr-chip-bg)", border: "1px solid var(--hdr-chip-border)", color: "var(--hdr-text)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="sidebar-section-label">Registration Steps</div>
              {NAV_PAGES.map((p, i) => {
                const locked = !canNav(p.id);
                const active = page === p.id && !showUHID;
                const done   = isDone(p.id);
                return (
                  <div key={p.id}
                    className={`nav-item${active ? " active" : ""}${done && !active ? " done" : ""}${locked ? " locked" : ""}`}
                    onClick={() => navTo(p.id)}>
                    <div className="nav-icon">
                      {locked
                        ? <Ico d={IC.lock} size={15} sw={2} />
                        : <Ico d={PAGE_ICONS[p.icon]} size={15} sw={2} />}
                    </div>
                    <span className="nav-label">{p.label}</span>
                    <span className="nav-step-num">
                      {p.id === "medical" && !medicalDone && patientDone
                        ? <span style={{ fontSize: 9, color: "var(--warning)" }}>!</span>
                        : done
                          ? <Ico d={IC.check} size={10} sw={2.5} />
                          : i + 1}
                    </span>
                  </div>
                );
              })}
              <div className="sidebar-divider" />
              <div className="sidebar-section-label" style={{ marginTop: 8 }}>Records</div>
              <div
                className={`sidebar-hist-item${page === "history" ? " active" : ""}`}
                onClick={() => { setShowUHID(false); setPage("history"); }}>
                <div className="sidebar-hist-icon"><Ico d={IC.users} size={15} sw={2} /></div>
                <span className="sidebar-hist-label">Patients History</span>
              </div>
            </div>

            {uhid && (
              <div className="sidebar-bottom">
                <div className="uhid-card" style={{ marginBottom: 12 }}>
                  <div className="uhid-card-label">Current UHID</div>
                  <div className="uhid-card-val">{uhid}</div>
                  <div className="uhid-card-sub">
                    {patient.patientName || "Patient"}{admNo > 1 ? ` · Adm #${admNo}` : ""}
                  </div>
                </div>
                <button onClick={endSession}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger-border)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Ico d={IC.cross} size={14} sw={2.5} /> Close Patient
                </button>
              </div>
            )}
          </aside>

          <main className="main" key={page + showUHID + subPage + locId}>
            {page === "patient" && !showUHID && subPage === "search" && (
              <SearchPage
                db={currentDb}
                locId={locId}
                branch={currentBranch}
                onNewAdmission={handleNewAdmission}
                onNewPatient={handleNewPatient}
              />
            )}
            {page === "patient" && !showUHID && subPage === "form" && (
              <PatientFormPage
                data={patient}
                setData={setPatient}
                onSubmit={handleRegister}
                errs={errs}
                onBack={() => setSubPage("search")}
                isReturning={isReturning}
              />
            )}
            {page === "patient" && showUHID && (
              <UHIDScreen
                uhid={uhid} patient={patient} isReturning={isReturning} admNo={admNo}
                onContinue={handleUHIDContinue}
                onDashboard={handleUHIDDashboard}
                onNewPatient={handleUHIDNewPatient}
              />
            )}
            {page === "medical" && (
              <MedicalHistoryPage
                data={medicalHistory} setData={setMedicalHistory}
                onSave={handleSaveMedical} onSkip={handleSaveMedical}
                patient={patient} discharge={discharge} locId={locId} doctors={doctors}
              />
            )}
            {page === "discharge" && (
              <DischargePage
                data={discharge}
                setData={setDischarge}
                onSave={handleSaveDischarge}
                uhid={uhid}
                admNo={admNo}
                admissionRecord={findAdmissionRecord(uhid, admNo, locId)}
                doctors={doctors}
              />
            )}
            {page === "services" && (
              <ServicesPage svcs={svcs} setSvcs={setSvcs} billing={billing} setBilling={setBilling} onSave={handleSaveServices} patientPayMode={patient?.payMode} />
            )}
            {page === "summary" && (
              <SummaryPage uhid={uhid} patient={patient} discharge={discharge} svcs={svcs} billing={billing} locId={locId} admNo={admNo} branch={currentBranch} onPrint={() => setShowPrint(true)} onRequestPrint={handleRequestPrint} />
            )}
            {page === "history" && (
              <PatientsHistoryPage
                db={currentDb} locId={locId} branch={currentBranch}
                onBack={() => setPage("patient")}
                onDischarge={handleDischargeFromHistory}
                onGenerateBill={handleGenerateBillFromHistory}
                onSetExpectedDod={handleSetExpectedDod}
                onViewPatient={p => setShowPatientDetail(p)}
                onSaveMedHistory={handleSaveMedHistoryFromHistory}
                onViewMedical={handleMedicalFromHistory}
              />
            )}
          </main>
        </div>
        <ToastBridge />
      </>
    );
  };

  return (
    <ThemeProvider>
      {renderRoute()}
    </ThemeProvider>
  );
}

export const AuthContext = createContext(null);
let _loginCallback = null; // eslint-disable-line no-unused-vars
export function setLoginCallback(fn) { _loginCallback = fn; }

export function useAuth() {
  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem("hms_currentUser")); } catch { return null; }
  })();

  const logout = () => {
    sessionStorage.removeItem('hms_loggedIn');
    sessionStorage.removeItem('hms_currentUser');
    sessionStorage.removeItem('hms_page');
    sessionStorage.removeItem('hms_token');
    sessionStorage.removeItem('hms_locId');
    window.location.reload();
  };

  return { user, logout };
}