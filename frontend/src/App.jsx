import React, { useState } from "react";
import { useEffect, useCallback, Suspense } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { apiService } from "./services/apiService";
import { blankPatient, blankDischarge, blankBilling } from "./utils/helpers";
import { useAppData } from "./hooks/useAppData";
import AppRoutes from "./routes/AppRoutes";


export function useAuth() {
  const user = (() => { try { return JSON.parse(sessionStorage.getItem("hms_currentUser")); } catch { return null; } })();
  const logout = () => {
    ["hms_loggedIn","hms_currentUser","hms_page","hms_token","hms_locId"].forEach(k => sessionStorage.removeItem(k));
    window.location.reload();
  };
  return { user, logout };
}

function ToastBridge() {
  const { isDark } = useTheme();
  return <ToastContainer position="bottom-right" theme={isDark ? "dark" : "light"} />;
}

export default function App() {
const [doctors, setDoctors] = useState([]);
  const state = useAppData();
  const {
    loggedIn, setLoggedIn, setCurrentUser, currentUser, locId, setLocId,
    setPage, setSubPage, setUhid, setAdmNo, setShowUHID, setIsReturning,
    setSelectedAdmissionType, setPatientDone, setMedicalDone, setDischargeDone,
    setServicesDone, setShowPrint, setShowPatientDetail, setPrintRequests,
    setPatient, setDischarge, setSvcs, setBilling, setDb,
    uhid, admNo, patient, discharge, svcs, billing, isReturning,
    selectedAdmissionType, medicalHistory, setMedicalHistory, errs, setErrs,
    db, defaultBranch, getBranchByCode, getBranchBySlug, resolveUserBranchSlug,
    normalizePatientList, splitPatientsByBranch, loadBranches, loadDashboardData,
    resetAll, syncDb, findAdmissionRecord, branchSettings,
  } = state;

  // ── Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    loadBranches().then(() => loadDashboardData(currentUser.role));
  }, [loggedIn, currentUser, loadBranches, loadDashboardData]);
  useEffect(() => { try { sessionStorage.setItem("hms_locId", locId); } catch {} }, [locId]);
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    const slug = resolveUserBranchSlug(currentUser);
    if (slug && locId !== slug) setLocId(slug);
  }, [loggedIn, currentUser, locId, resolveUserBranchSlug, setLocId]);
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    if (state.page === "history" || (state.page === "patient" && state.subPage === "search")) loadDashboardData(currentUser.role);
  }, [loggedIn, currentUser, state.page, state.subPage, loadDashboardData]);
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    const onFocus = () => loadDashboardData(currentUser.role);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loggedIn, currentUser, loadDashboardData]);
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    const roles = new Set(["office_admin","managementadmin","admin","branchadmin"]);
    if (!roles.has(String(currentUser.role || "").toLowerCase())) return;
    const timer = setInterval(() => loadDashboardData(currentUser.role), 20000);
    return () => clearInterval(timer);
  }, [loggedIn, currentUser, loadDashboardData]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    setLoggedIn(false); setCurrentUser(null); resetAll(); setPrintRequests([]); setDb({});
    ["hms_loggedIn","hms_currentUser","hms_page","hms_token","hms_locId"].forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
  };

  const handleLogin = useCallback((user, loc) => {
    setCurrentUser(user);
    const slug = resolveUserBranchSlug(user);
    const nextLocId = slug || loc || user?.locations?.[0] || defaultBranch.slug;
    setLocId(nextLocId); setLoggedIn(true);
    const ROLE_MAP = { superadmin:"superadmin", admin:"branchadmin", branchadmin:"branchadmin", managementadmin:"managementadmin", office_admin:"managementadmin", hod:"hod", billing:"billing", opd:"opd", intimation:"intimation", query:"query", uploading:"uploading", doctor:"doctor", nursing:"nursing", notes:"notes" };
    const startingPage = ROLE_MAP[user.role] || (["ipd","pharmacy","lab","radiology","receptionist","employee"].includes(user.role) ? "employee" : "patient");
    try { sessionStorage.setItem('hms_loggedIn','true'); const { nationalId: _omit, phone: _p, alternatePhone: _ap, address: _addr, ...safeUser } = user; sessionStorage.setItem('hms_currentUser', JSON.stringify(safeUser)); sessionStorage.setItem('hms_page',startingPage); sessionStorage.setItem('hms_locId',nextLocId); } catch {}
    if (startingPage === "patient") { setPage("patient"); setSubPage("search"); } else setPage(startingPage);
  }, [defaultBranch.slug, resolveUserBranchSlug, setCurrentUser, setLocId, setLoggedIn, setPage, setSubPage]);


  const setPayload = (src) => ({
    payMode: src.payMode||"", cashlessType: src.cashlessType||"", tpa: src.tpa||"",
    tpaCard: src.tpaCard||"", tpaValidity: src.tpaValidity||"", tpaCardType: src.tpaCardType||"",
    tpaPanelCardNo: src.tpaPanelCardNo||"", tpaPanelValidity: src.tpaPanelValidity||"",
  });

  const handleNewAdmission = (existing, admissionType="IPD") => {
    const { admissions, ...pd } = existing;
    setSelectedAdmissionType(admissionType || admissions?.slice(-1)[0]?.admissionType || "IPD");
    setPatient({ ...pd, ...setPayload(existing) }); setUhid(existing.uhid);
    setAdmNo(admissions?.length ? admissions.length+1 : 2); setIsReturning(true);
    setDischarge(prev => ({ ...prev, doa: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })() })); setSubPage("form");
  };

  const applyFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj;
    setSelectedAdmissionType(admObj.admissionType || "IPD");
    setPatient({ ...pd, ...setPayload(patientObj) });
    setUhid(patientObj.uhid); setAdmNo(admObj.admNo); setIsReturning(true);
  };

  const handleDischargeFromHistory = (patientObj, admObj) => {
    applyFromHistory(patientObj, admObj);
    setDischarge({ ...blankDischarge(), ...(admObj.discharge||{}), doa: admObj.discharge?.doa||admObj.dateTime||"" });
    setSvcs(admObj.services?.length ? admObj.services : []); setBilling({ ...blankBilling(), ...(admObj.billing||{}) });
    setPatientDone(true); setDischargeDone(false); setServicesDone(false);
    setShowPatientDetail(null); setShowUHID(false); setPage("discharge");
  };

  const handleMedicalFromHistory = (patientObj, admObj) => {
    applyFromHistory(patientObj, admObj);
    setMedicalHistory(admObj.medicalHistory || { previousDiagnosis:"", pastSurgeries:"", currentMedications:"", treatingDoctor:"", knownAllergies:"", chronicConditions:"", familyHistory:"", smokingStatus:"", alcoholUse:"", notes:"", doctorQual:"" });
    setPatientDone(true); setMedicalDone(false); setShowPatientDetail(null); setPage("medical");
  };

  const handleGenerateBillFromHistory = (patientObj, admObj) => {
    applyFromHistory(patientObj, admObj);
    setDischarge({ ...blankDischarge(), ...(admObj.discharge||{}) });
    setSvcs(admObj.services?.length ? admObj.services : []); setBilling({ ...blankBilling(), ...(admObj.billing||{}) });
    setPatientDone(true); setDischargeDone(true); setServicesDone(false);
    setShowPatientDetail(null); setShowUHID(false); setPage("services");
  };

  const validatePatient = () => {
    const e = {};
    const aadhaar = String(patient.nationalId||"").replace(/\D/g,"");
    const email = String(patient.email||"").trim();
    if (!patient.patientName.trim()) e.patientName = "Required";
    if (!patient.guardianName.trim()) e.guardianName = "Required";
    if (!patient.gender) e.gender = "Required";
    if (!patient.phone || String(patient.phone).replace(/\D/g,"").length !== 10) e.phone = "Must be 10 digits";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email or leave blank";
    if (!/^\d{12}$/.test(aadhaar)) e.nationalId = "Aadhaar must be exactly 12 digits";
    if (!patient.address.trim()) e.address = "Required";
    setErrs(e); return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validatePatient()) return;
    const aadhaar = String(patient.nationalId||"").replace(/\D/g,"").replace(/(\d{4})(?=\d)/g,"$1 ").trim();
    const payload = { ...patient, nationalId: aadhaar };
    if (!String(payload.email||"").trim()) payload.email = "";
    if (!payload.dob) payload.dob = null;
    if (!payload.tpaValidity) payload.tpaValidity = null;
    if (!payload.tpaPanelValidity) payload.tpaPanelValidity = null;
    try {
      const doa = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })();
      const currentBranch = getBranchBySlug(locId) || defaultBranch;
      if (isReturning && uhid) {
        const { payMode, cashlessType, tpa, tpaCard, tpaValidity, tpaCardType, tpaPanelCardNo, tpaPanelValidity, ...safe } = payload;
        await apiService.updatePatient(uhid, safe);
        const adm = await apiService.newAdmission(uhid, selectedAdmissionType);
        if (adm?.uhid) {
          setDb(prev => { const next = structuredClone(prev); Object.keys(next).forEach(b => { next[b] = (next[b]||[]).filter(x => x.uhid !== adm.uhid); }); const meta = getBranchByCode(adm.branch_location)||currentBranch||defaultBranch; if (!next[meta.slug]) next[meta.slug]=[]; next[meta.slug].unshift(adm); return next; });
          setLocId(getBranchByCode(adm.branch_location)?.slug || locId);
          setAdmNo(adm.current_admission_no || admNo+1);
        } else {
          setDb(splitPatientsByBranch(normalizePatientList(await apiService.getPatients())));
          setAdmNo(admNo+1);
        }
        setDischarge(prev => ({ ...prev, doa })); setShowUHID(true); setSubPage("search");
      } else {
        const saved = await apiService.registerPatient({ ...payload, locId, admissionType: selectedAdmissionType });
        if (!saved?.uhid) throw new Error("No UHID returned");
        setUhid(saved.uhid); setAdmNo(1); setIsReturning(false);
        setDischarge(prev => ({ ...prev, doa }));
        const branch = getBranchByCode(saved.branch_location)||currentBranch||defaultBranch;
        setDb(prev => ({ ...prev, [branch.slug]: [saved, ...(prev[branch.slug]||[])] }));
        setShowUHID(true);
      }
      toast.success("Patient registered successfully!");
    } catch (error) {
      const errs = error?.response?.data;
      if (errs) toast.error(Object.entries(errs).map(([f,m]) => `${f}: ${Array.isArray(m)?m[0]:m}`).slice(0,2).join(" | "));
      else toast.error("Error registering patient.");
    }
  };

  const handleUHIDContinue   = () => { setPatientDone(true); setShowUHID(false); setPage("medical"); };
  const handleUHIDDashboard  = () => { setPatientDone(true); setShowUHID(false); setPage("patient"); setSubPage("search"); };
  const handleUHIDNewPatient = () => { resetAll(); setSubPage("form"); };

  const handleSaveMedical = async () => {
    try { await apiService.updateMedicalHistory(uhid, admNo, medicalHistory); syncDb(uhid, admNo, "medicalHistory", medicalHistory); setMedicalDone(true); setPage("discharge"); toast.success("Medical History saved!"); }
    catch { toast.error("Failed to save Medical History."); }
  };

  const handleSaveMedHistoryFromHistory = async (uhidVal, admNoVal, data) => {
    try {
      await apiService.updateMedicalHistory(uhidVal, admNoVal, data);
      setDb(prev => { const next = structuredClone(prev); const p = next[locId]?.find(x => x.uhid === uhidVal); if (p) { const a = p.admissions.find(x => x.admNo === admNoVal); if (a) a.medicalHistory = data; } return next; });
      toast.success("Medical History updated!");
    } catch { toast.error("Failed to update Medical History."); }
  };

  const handleSaveDischarge = async () => {
    try { await apiService.dischargePatient(uhid, admNo, discharge); syncDb(uhid, admNo, "discharge", discharge); setDischargeDone(true); setPage("services"); toast.success("Discharge details saved!"); }
    catch { toast.error("Failed to save Discharge."); }
  };

  const handleSaveServices = async (updatedSvcs, updatedBilling) => {
    try {
      const res = await apiService.saveServicesBulk(uhid, admNo, updatedSvcs);
      await apiService.updateBilling(uhid, admNo, updatedBilling);
      const saved = res?.services || updatedSvcs;
      setSvcs(saved); setBilling(updatedBilling);
      syncDb(uhid, admNo, "services", saved); syncDb(uhid, admNo, "billing", updatedBilling);
      setServicesDone(true); setPage("summary"); toast.success("Services and Billing saved!");
    } catch { toast.error("Failed to save Services/Billing."); }
  };

  const handleViewBill = (req) => {
    setShowPrint(true); setUhid(req.uhid); setPatient(req.patient||patient);
    setDischarge(req.adm?.discharge||discharge); setSvcs(req.svcs||svcs);
    setBilling(req.adm?.billing||billing); setLocId(req.locId); setAdmNo(req.admNo);
  };

  const handleRequestPrint = async () => {
    try {
      const safeUhid = uhid||patient?.uhid, safeAdmNo = admNo||findAdmissionRecord(uhid,admNo,locId)?.admNo;
      if (!safeUhid||!safeAdmNo) { toast.error("Admission details missing."); return; }
      await apiService.requestPrint(safeUhid, safeAdmNo);
      setBilling(prev => ({ ...prev, printStatus: "PENDING" })); toast.success("Print request sent!");
    } catch (e) { toast.error(e?.response?.data?.error||"Failed to send print request."); }
  };

  const handleApprovePrint = async (req, action) => {
    try {
      await apiService.resolvePrint(req.uhid, req.admNo, action==="approve"?"APPROVED":"REJECTED");
      setPrintRequests(prev => prev.filter(r => !(r.uhid===req.uhid&&r.admNo===req.admNo&&r.locId===req.locId)));
      if (action==="approve") {
        setShowPrint(true); setUhid(req.uhid); setPatient(req.patient||patient);
        setDischarge(req.adm?.discharge||discharge); setSvcs(req.svcs||svcs);
        setBilling({ ...(req.adm?.billing||billing), printStatus:"APPROVED" });
        setLocId(req.locId); setAdmNo(req.admNo);
      }
      toast.success(`Bill ${action==="approve"?"approved":"rejected"} successfully!`);
    } catch { toast.error("Failed to process approval."); }
  };

  const handlePatientSaved = (updated) => {
    if (!updated?.uhid) return;
    setDb(prev => { const next = structuredClone(prev); Object.keys(next).forEach(b => { next[b] = (next[b]||[]).map(x => x.uhid!==updated.uhid ? x : { ...x, ...updated, admissions: updated.admissions||x.admissions||[] }); }); return next; });
    if (uhid===updated.uhid) setPatient(prev => ({ ...prev, ...updated }));
    setShowPatientDetail(prev => (!prev||prev.uhid!==updated.uhid) ? prev : { ...prev, ...updated, admissions: updated.admissions||prev.admissions||[] });
  };

  const handleNewPatient = (type="IPD") => { setSelectedAdmissionType(type); setPatient(blankPatient()); setUhid(null); setIsReturning(false); setShowUHID(false); setSubPage("form"); };
  const handleBranchesChanged = async () => { await loadBranches(); if (currentUser) await loadDashboardData(currentUser.role); };
const endSession = () => { resetAll(); setDb({}); setDoctors([]); setCurrentUser(null); setSubPage("search"); };

  const handlers = {
    handleLogin, handleLogout, handleNewAdmission, handleNewPatient, handleRegister,
    handleUHIDContinue, handleUHIDDashboard, handleUHIDNewPatient,
    handleSaveMedical, handleSaveMedHistoryFromHistory, handleSaveDischarge,
    handleSaveServices, handleViewBill, handleRequestPrint, handleApprovePrint,
    handlePatientSaved, handleDischargeFromHistory, handleMedicalFromHistory,
    handleGenerateBillFromHistory, handleBranchesChanged, endSession,
  };

  return (
    <ThemeProvider>
      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:16,color:"#64748b"}}>Loading…</div>}>
        <AppRoutes state={state} handlers={handlers} ToastBridge={ToastBridge} />
      </Suspense>
    </ThemeProvider>
  );
}
