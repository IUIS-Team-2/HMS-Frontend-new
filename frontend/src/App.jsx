import { useState, useEffect, createContext, useContext } from "react";
import { T, NAV_PAGES } from "./data/constants";
import { blankPatient, blankDischarge, blankBilling, blankSvc } from "./utils/helpers";
import { Ico, IC, PAGE_ICONS } from "./components/ui/Icons";

// 🌟 NEW: Toast notifications added by frontend dev
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Core Components
import LiveDate from "./components/layout/LiveDate";
import { apiService } from "./services/apiService"; // 🌟 Connected to Backend

// Pages
import SearchPage from "./pages/SearchPage";
import PatientFormPage from "./pages/PatientFormPage";
import DischargePage from "./pages/DischargePage";
import ServicesPage from "./pages/ServicesPage";
import SummaryPage from "./pages/SummaryPage";
import PatientsHistoryPage from "./pages/PatientsHistoryPage";
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ManagementAdminDashboard from './pages/Managementadmindashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import LoginPage from "./pages/LoginPage";
import { ThemeProvider } from "./context/ThemeContext";

// Modals
import UHIDScreen from "./modals/UHIDScreen";
import PrintModal from "./modals/PrintModal";
import PatientDetailModal from "./modals/PatientDetailModal";
// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => {
    try { return sessionStorage.getItem('hms_loggedIn') === 'true'; } catch { return false; }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try { const u = sessionStorage.getItem('hms_currentUser'); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [locId, setLocId] = useState("laxmi");
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem('hms_page') || 'patient'; } catch { return 'patient'; }
  });
  const [subPage, setSubPage] = useState("search");
  const [uhid, setUhid] = useState(null);
  const [admNo, setAdmNo] = useState(1);
  const [showUHID, setShowUHID] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [patientDone, setPatientDone] = useState(false);
  const [dischargeDone, setDischargeDone] = useState(false);
  const [servicesDone, setServicesDone] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(null);
  const [printRequests, setPrintRequests] = useState([]);

  const [patient, setPatient] = useState(blankPatient());
  const [medicalHistory, setMedicalHistory] = useState({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
  const [medicalDone, setMedicalDone] = useState(false);
  const [discharge, setDischarge] = useState(blankDischarge());
  const [svcs, setSvcs] = useState([]);
  const [billing, setBilling] = useState(blankBilling());
  const [errs, setErrs] = useState({});

  // 🌟 Database States
  const [db, setDb] = useState({ laxmi: [], raya: [] });
  const [masterServices, setMasterServices] = useState([]); 

  // 🌟 FIX: Restored missing Sidebar Navigation Helpers
  const isDone = (id) => {
    if (id === 'patient') return patientDone;
    if (id === 'medical') return medicalDone;
    if (id === 'discharge') return dischargeDone;
    if (id === 'services') return servicesDone;
    return true;
  };

  const canNav = (id) => {
    const steps = ["patient", "medical", "discharge", "services", "summary"];
    const idx = steps.indexOf(id);
    if (idx <= 0) return true;
    const prev = steps[idx - 1];
    return isDone(prev);
  };

  const navTo = (id) => { if (canNav(id)) setPage(id); };
  const endSession = () => { resetAll(); setSubPage("search"); };

  // ==========================================
  // 🌟 THE MASTER DATA LOADER
  // ==========================================
  const loadDashboardData = async (userRole) => {
    try {
      const livePatients = await apiService.getPatients();
      const liveServices = await apiService.getServiceMaster();
      
      setMasterServices(liveServices); 

      const laxmiPatients = livePatients.filter(p => p.branch_location === 'LNM' || !p.branch_location);
      const rayaPatients = livePatients.filter(p => p.branch_location === 'RYM');
      setDb({ laxmi: laxmiPatients, raya: rayaPatients });

      if (userRole === "superadmin") {
        const pendingPatients = await apiService.getPendingPrints();
        const formattedRequests = [];

        pendingPatients.forEach(p => {
          p.admissions.forEach(adm => {
            if (adm.billing && adm.billing.printStatus === 'PENDING') {
              formattedRequests.push({
                uhid: p.uhid,
                admNo: adm.admNo,
                locId: p.branch_location === 'LNM' ? 'laxmi' : 'raya',
                patient: p,
                adm: adm,
                svcs: adm.services || [],
                requestedAt: adm.billing.printRequestedAt || new Date().toISOString()
              });
            }
          });
        });
        setPrintRequests(formattedRequests);
      }
    } catch (error) {
      console.error("Failed to load live backend data:", error);
    }
  };

  useEffect(() => {
    if (loggedIn && currentUser) {
      loadDashboardData(currentUser.role);
    }
  }, [loggedIn, currentUser]);

  const currentDb = db[locId] || [];

  const resetAll = () => {
    setPage("patient");
    setSubPage("search");
    setUhid(null);
    setShowUHID(false);
    setPatientDone(false);
    setMedicalDone(false);
    setDischargeDone(false);
    setServicesDone(false);
    setPatient(blankPatient());
    setDischarge(blankDischarge());
    setSvcs([]);
    setBilling(blankBilling());
    setErrs({});
    setMedicalHistory({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
  };

  const switchLoc = id => { setLocId(id); resetAll(); setShowPatientDetail(null); };

  const handleLogin = (user, loc) => {
    setCurrentUser(user);
    setLocId(loc || "laxmi");
    setLoggedIn(true);
    try {
      sessionStorage.setItem('hms_loggedIn', 'true');
      sessionStorage.setItem('hms_currentUser', JSON.stringify(user));
      sessionStorage.setItem('hms_page', user.role === 'superadmin' ? 'superadmin' : user.role === 'managementadmin' ? 'managementadmin' : 'employee');
    } catch {}
    if (user.role === "superadmin") {
      setPage("superadmin");
    } else if (user.role === "managementadmin") {
      setPage("managementadmin");
    } else if (["opd","ipd","billing","pharmacy","doctor","nursing","lab","radiology","reception","employee"].includes(user.role)) {
      setPage("employee");
    } else {
      setPage("patient");
      setSubPage("search");
    }
  };

    useEffect(() => { setLoginCallback(handleLogin); });

    // useEffect(() => { setLoginCallback(handleLogin); });

    const syncDb = (currentUhid, currentAdmNo, dataKey, dataValue) => {
      setDb(prev => {
        const nextDb = JSON.parse(JSON.stringify(prev));
        const p = nextDb[locId].find(x => x.uhid === currentUhid);
        if (p) {
          const a = p.admissions.find(x => x.admNo === currentAdmNo);
          if (a) a[dataKey] = dataValue;
        }
        return nextDb;
      });
    };

    const handleNewAdmission = (existing) => {
      const { admissions, ...pd } = existing; 
      setDischarge(prev => ({ ...prev, doa: new Date().toISOString().slice(0, 16) }));
      setPatient(pd);   
      setUhid(existing.uhid);
      setIsReturning(true); 
      setSubPage("form");
    };

  const handleDischargeFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj; 
    setPatient(pd); 
    setUhid(patientObj.uhid); 
    setAdmNo(admObj.admNo); 
    setIsReturning(true);
    
    // 🌟 This ensures DOA never disappears, even if Discharge hasn't been saved yet!
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
    setPatient(pd); 
    setUhid(patientObj.uhid); 
    setAdmNo(admObj.admNo); 
    setIsReturning(true);

    // Load the existing history into the state so the page isn't blank
    setMedicalHistory(admObj.medicalHistory || { previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
    
    setPatientDone(true); 
    setMedicalDone(false); // Set to false so they can edit/save again
    setShowPatientDetail(null); 
    setPage("medical"); // 🚀 The Redirect!
  };

  const handleGenerateBillFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj; setPatient(pd); setUhid(patientObj.uhid); setAdmNo(admObj.admNo); setIsReturning(true);
    setDischarge({ ...blankDischarge(), ...(admObj.discharge || {}) }); setSvcs(admObj.services && admObj.services.length ? admObj.services : []); setBilling({ ...blankBilling(), ...(admObj.billing || {}) });
    setPatientDone(true); setDischargeDone(true); setServicesDone(false); setShowPatientDetail(null); setShowUHID(false); setPage("services");
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
    const e = {}; if (!patient.patientName.trim()) e.patientName = "Required"; if (!patient.guardianName.trim()) e.guardianName = "Required"; if (!patient.gender) e.gender = "Required"; if (!patient.phone || patient.phone.replace(/\D/g, "").length !== 10) e.phone = "Must be 10 digits"; if (!patient.email || !patient.email.includes("@")) e.email = "Valid email required"; if (!patient.nationalId.trim()) e.nationalId = "Required"; if (!patient.address.trim()) e.address = "Required"; setErrs(e); return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validatePatient()) return;

    // 🧹 THE SANITIZER
    const sanitizedPayload = { ...patient };
    if (sanitizedPayload.dob === "") sanitizedPayload.dob = null;
    if (sanitizedPayload.tpaValidity === "") sanitizedPayload.tpaValidity = null;
    if (sanitizedPayload.tpaPanelValidity === "") sanitizedPayload.tpaPanelValidity = null;

    try {
      if (isReturning && uhid) {
        // --- RETURNING PATIENT LOGIC ---
        await apiService.updatePatient(uhid, sanitizedPayload);
        const admResponse = await apiService.newAdmission(uhid);
        const livePatients = await apiService.getPatients();
        setDb(prev => ({ ...prev, [locId]: livePatients }));
        
        setAdmNo(admResponse.admNo);
        setShowUHID(true);
        setSubPage("search");
        
        // Pre-fill the UI Date of Admission for Returning Patients
        const localNow = new Date();
        localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
        setDischarge(prev => ({ ...prev, doa: localNow.toISOString().slice(0, 16) }));

      } else {
        // --- NEW PATIENT LOGIC ---
        // 🌟 Here are your missing variables safely inside the block!
        const savedPatient = await apiService.registerPatient({ ...sanitizedPayload, locId });
        const newUhid = savedPatient.uhid;
        
        setUhid(newUhid);
        setAdmNo(1);
        setIsReturning(false);
        setShowUHID(true);
        setDb(prev => ({ ...prev, [locId]: [savedPatient, ...prev[locId]] }));
        
        // Pre-fill the UI Date of Admission for New Patients
        const localNow = new Date();
        localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
        setDischarge(prev => ({ ...prev, doa: localNow.toISOString().slice(0, 16) }));
      }
      
      toast.success("Patient registered successfully!");
    } catch (error) {
      toast.error("Error registering patient. Check console.");
    }
  };

  const handleUHIDContinue   = () => { setPatientDone(true); setShowUHID(false); setPage("medical"); };
  const handleUHIDDashboard  = () => { setPatientDone(true); setShowUHID(false); setPage("patient"); setSubPage("search"); };
  const handleUHIDNewPatient = () => { endSession(); setSubPage("form"); };

  // ==========================================
  // 🌟 RESTORED: Backend Save Functions
  // ==========================================
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
      for (const svc of updatedSvcs) await apiService.addService(uhid, admNo, svc);
      await apiService.updateBilling(uhid, admNo, updatedBilling);
      setSvcs(updatedSvcs); setBilling(updatedBilling);
      syncDb(uhid, admNo, 'services', updatedSvcs); syncDb(uhid, admNo, 'billing', updatedBilling);
      setServicesDone(true); setPage("summary");
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

  if (!loggedIn) return <ThemeProvider><LoginPage onLogin={handleLogin} /></ThemeProvider>;
  const handleRequestPrint = async (req) => {
    try {
      await apiService.requestPrint(uhid, admNo);
      toast.success("Print request sent securely to Super Admin!");
    } catch (error) { toast.error("Failed to send print request."); }
  };

  const handleApprovePrint = async (req, action) => {
    try {
      const backendAction = action === "approve" ? "APPROVED" : "REJECTED";
      await apiService.resolvePrint(req.uhid, req.admNo, backendAction);
      setPrintRequests(prev => prev.filter(r => !(r.uhid === req.uhid && r.admNo === req.admNo && r.locId === req.locId)));
      
      if (action === "approve") {
        setShowPrint(true);
        setUhid(req.uhid);
        setPatient(req.patient || patient);
        setDischarge(req.adm?.discharge || discharge);
        setSvcs(req.svcs || svcs);
        setBilling(req.adm?.billing || billing);
        setLocId(req.locId);
        setAdmNo(req.admNo);
      }
      toast.success(`Bill ${backendAction.toLowerCase()} successfully!`);
    } catch (error) { toast.error("Failed to process approval."); }
  };

  // const canNav = id => ({ patient: true, medical: patientDone, discharge: patientDone && medicalDone, services: patientDone && medicalDone && dischargeDone, summary: patientDone && medicalDone && dischargeDone && servicesDone }[id] || false);
  // const isDone = id => ({ patient: patientDone, medical: medicalDone, discharge: dischargeDone, services: servicesDone }[id] || false);
  // const navTo  = id => { if (!canNav(id)) return; setShowUHID(false); setPage(id); };

  if (!loggedIn) {
    return (
      <AuthContext.Provider value={{
        user: null,
        logout: () => {},
        login: () => {} // The actual login API call is now safely handled inside LoginPage.jsx
      }}>
        <ThemeProvider>
          <LoginPage onLogin={handleLogin} />
        </ThemeProvider>
      </AuthContext.Provider>
    );
  }
  if (page === "superadmin") {
    return (
      <>
        {showPrint && (
          <PrintModal uhid={uhid} patient={patient} discharge={discharge}
            svcs={svcs} billing={billing} locId={locId} admNo={admNo}
            onClose={() => setShowPrint(false)} />
        )}
        <ThemeProvider><SuperAdminDashboard
          db={db}
          printRequests={printRequests}
          
          onApprovePrint={handleApprovePrint} 
          onViewBill={handleViewBill} 
          onLogout={() => { setLoggedIn(false); setCurrentUser(null); resetAll(); setPrintRequests([]); try { sessionStorage.removeItem('hms_loggedIn'); sessionStorage.removeItem('hms_currentUser'); sessionStorage.removeItem('hms_page');sessionStorage.removeItem('hms_token'); } catch {} }}
        />
        <ToastContainer position="bottom-right" />
      </ThemeProvider>
      </>
    );
  }

  if (page === "managementadmin") {
    return (
      <ThemeProvider><ManagementAdminDashboard
        currentUser={currentUser}
        db={db}
        onLogout={() => { setLoggedIn(false); setCurrentUser(null); resetAll(); try { sessionStorage.removeItem('hms_loggedIn'); sessionStorage.removeItem('hms_currentUser'); sessionStorage.removeItem('hms_page'); sessionStorage.removeItem('hms_token'); } catch {} }}
      /></ThemeProvider>
    );
  }

  if (page === "employee") {
    return (
      <ThemeProvider><EmployeeDashboard
        currentUser={currentUser}
        onLogout={() => { setLoggedIn(false); setCurrentUser(null); resetAll(); try { sessionStorage.removeItem('hms_loggedIn'); sessionStorage.removeItem('hms_currentUser'); sessionStorage.removeItem('hms_page');sessionStorage.removeItem('hms_token'); } catch {} }}
      /></ThemeProvider>
    );
  }

  // ── BRANCH STAFF: normal layout with header + sidebar ──
  return (
    <>
      {showPrint && (
        <PrintModal uhid={uhid} patient={patient} discharge={discharge}
          svcs={svcs} billing={billing} locId={locId} admNo={admNo}
          onClose={() => setShowPrint(false)} />
      )}
      {showPatientDetail && (
        <PatientDetailModal patient={showPatientDetail}
          onClose={() => setShowPatientDetail(null)}
          onDischarge={handleDischargeFromHistory} />
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
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
              <div style={{ fontSize: 12, lineHeight: 1.4, textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>{currentUser.name}</div>
                <div style={{ color: "rgba(255,255,255,.5)" }}>
                  {locId === "laxmi" ? "Laxmi Nagar Branch" : "Raya Branch"}
                </div>
              </div>
              <button
                onClick={() => { setLoggedIn(false); setCurrentUser(null); resetAll(); try { sessionStorage.removeItem('hms_loggedIn'); sessionStorage.removeItem('hms_currentUser'); sessionStorage.removeItem('hms_page');sessionStorage.removeItem('hms_token'); } catch {} }}
                style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
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
              const locked = !canNav(p.id); const active = page === p.id && !showUHID; const done = isDone(p.id);
              return (
                <div key={p.id} className={`nav-item${active ? " active" : ""}${done && !active ? " done" : ""}${locked ? " locked" : ""}`} onClick={() => navTo(p.id)}>
                  <div className="nav-icon">{locked ? <Ico d={IC.lock} size={15} sw={2} /> : <Ico d={PAGE_ICONS[p.icon]} size={15} sw={2} />}</div>
                  <span className="nav-label">{p.label}</span>
                  <span className="nav-step-num">
                    {p.id === "medical" && !medicalDone && patientDone
                      ? <span style={{ fontSize: 9, color: T.amber }}>!</span>
                      : done ? <Ico d={IC.check} size={10} sw={2.5} /> : i + 1}
                  </span>
                </div>
              );
            })}
            <div className="sidebar-divider" />
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Records</div>
            <div className={`sidebar-hist-item${page === "history" ? " active" : ""}`} onClick={() => { setShowUHID(false); setPage("history"); }}>
              <div className="sidebar-hist-icon"><Ico d={IC.users} size={15} sw={2} /></div>
              <span className="sidebar-hist-label">Patients History</span>
            </div>
          </div>
          {uhid && (
            <div className="sidebar-bottom">
              <div className="uhid-card" style={{ marginBottom: 12 }}>
                <div className="uhid-card-label">Current UHID</div>
                <div className="uhid-card-val">{uhid}</div>
                <div className="uhid-card-sub">{patient.patientName || "Patient"}{admNo > 1 ? ` · Adm #${admNo}` : ""}</div>
              </div>
              <button onClick={endSession} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: T.redTint, color: T.red, border: `1px solid ${T.red}`, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Ico d={IC.cross} size={14} sw={2.5} /> Close Patient
              </button>
            </div>
          )}
        </aside>

        <main className="main" key={page + showUHID + subPage + locId}>
          {page === "patient"  && !showUHID && subPage === "search" && <SearchPage db={currentDb} locId={locId} onNewAdmission={handleNewAdmission} onNewPatient={() => setSubPage("form")} />}
          {page === "patient"  && !showUHID && subPage === "form"   && <PatientFormPage data={patient} setData={setPatient} onSubmit={handleRegister} errs={errs} onBack={() => setSubPage("search")} />}
          {page === "patient"  && showUHID  && <UHIDScreen uhid={uhid} patient={patient} isReturning={isReturning} admNo={admNo} onContinue={handleUHIDContinue} onDashboard={handleUHIDDashboard} onNewPatient={handleUHIDNewPatient} />}
          {page === "medical"  && <MedicalHistoryPage data={medicalHistory} setData={setMedicalHistory} onSave={handleSaveMedical} onSkip={handleSaveMedical} patient={patient} discharge={discharge} locId={locId} />}
          {page === "discharge" && <DischargePage data={discharge} setData={setDischarge} onSave={handleSaveDischarge} uhid={uhid} admNo={admNo} />}
          {page === "services" && <ServicesPage svcs={svcs} setSvcs={setSvcs} billing={billing} setBilling={setBilling} onSave={handleSaveServices} />}
          {page === "summary"  && <SummaryPage uhid={uhid} patient={patient} discharge={discharge} svcs={svcs} billing={billing} locId={locId} admNo={admNo} onPrint={() => setShowPrint(true)} onRequestPrint={handleRequestPrint} />}
          {page === "history"  && <PatientsHistoryPage db={currentDb} locId={locId} onBack={() => setPage("patient")} onDischarge={handleDischargeFromHistory} onGenerateBill={handleGenerateBillFromHistory} onSetExpectedDod={handleSetExpectedDod} onViewPatient={p => setShowPatientDetail(p)} onSaveMedHistory={handleSaveMedHistoryFromHistory} onViewMedical={handleMedicalFromHistory} />}
        </main>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   AUTHENTICATION CONTEXT (Cleaned up for Backend)
══════════════════════════════════════════════════════════════ */
export const AuthContext = createContext(null);
let _loginCallback = null;
export function setLoginCallback(fn) { _loginCallback = fn; }

export function useAuth() {
  // Reads the real user payload we saved from the Django JWT token
  const user = (() => { 
    try { 
      return JSON.parse(sessionStorage.getItem("hms_currentUser")); 
    } catch { 
      return null; 
    } 
  })();
  
  const logout = () => { 
    sessionStorage.removeItem('hms_loggedIn'); 
    sessionStorage.removeItem('hms_currentUser'); 
    sessionStorage.removeItem('hms_page');
    sessionStorage.removeItem('hms_token'); // Wipes the Django secure token
    window.location.reload(); 
  };

  // We no longer need the fake login logic here, just pass the context
  return { user, logout };
}