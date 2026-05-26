import { lazy } from "react";
import PrintModal from "../modals/PrintModal";
import PatientDetailModal from "../modals/PatientDetailModal";
import UHIDScreen from "../modals/UHIDScreen";
import LiveDate from "../components/layout/LiveDate";
import ThemeModeDock from "../components/ui/ThemeModeDock";
import { Ico, IC, PAGE_ICONS } from "../components/ui/Icons";
import { NAV_PAGES } from "../data/constants";

const SearchPage           = lazy(() => import("../pages/SearchPage"));
const PatientFormPage      = lazy(() => import("../pages/PatientFormPage"));
const DischargePage        = lazy(() => import("../pages/DischargePage"));
const ServicesPage         = lazy(() => import("../pages/ServicesPage"));
const SummaryPage          = lazy(() => import("../pages/SummaryPage"));
const PatientsHistoryPage  = lazy(() => import("../pages/PatientsHistoryPage"));
const MedicalHistoryPage   = lazy(() => import("../pages/MedicalHistoryPage"));
const LoginPage            = lazy(() => import("../pages/LoginPage"));
const SuperAdminDashboard = lazy(() => import("../pages/superadmin/SuperAdminDashboard"));
const ManagementAdminDashboard = lazy(() => import("../pages/ManagementAdminDashboard"));
const HodDashboard         = lazy(() => import("../pages/HodDashboard"));
const BranchAdminDashboard = lazy(() => import("../components/branch-admin/BranchAdminDashboard"));
const BillingDashboard     = lazy(() => import("../components/billing/BillingDashboard"));
const DoctorDashboard      = lazy(() => import("../pages/DoctorDashboard"));
const NursingDashboard     = lazy(() => import("../pages/NursingDashboard"));
const NotesDashboard       = lazy(() => import("../pages/NotesDashboard"));
const OpdDashboard         = lazy(() => import("../pages/OpdDashboard"));
const IntimationDashboard  = lazy(() => import("../pages/IntimationDashboard"));
const QueryDashboard       = lazy(() => import("../pages/QueryDashboard"));
const UploadingDashboard   = lazy(() => import("../pages/UploadingDashboard"));

const DASHBOARD_ROUTES = {
  superadmin:      (p, h) => <SuperAdminDashboard db={p.db} branches={p.branchSettings} printRequests={p.printRequests} onApprovePrint={h.handleApprovePrint} onViewBill={h.handleViewBill} onBranchesChanged={h.handleBranchesChanged} onLogout={h.handleLogout} />,
  managementadmin: (p, h) => <ManagementAdminDashboard currentUser={p.currentUser} db={p.db} locId={p.locId} onLogout={h.handleLogout} />,
  hod:             (p, h) => <HodDashboard currentUser={p.currentUser} db={p.db} onLogout={h.handleLogout} />,
  uploading:       (p, h) => <UploadingDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
  query:           (p, h) => <QueryDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
  opd:             (p, h) => <OpdDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
  intimation:      (p, h) => <IntimationDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
  branchadmin:     (p, h) => <BranchAdminDashboard currentUser={p.currentUser} db={p.db} locId={p.locId} printRequests={p.printRequests} onApprovePrint={h.handleApprovePrint} onViewBill={h.handleViewBill} onLogout={h.handleLogout} />,
  billing:         (p, h) => <BillingDashboard currentUser={p.currentUser} db={p.db} locId={p.locId} onLogout={h.handleLogout} />,
  doctor:          (p, h) => <DoctorDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
  nursing:         (p, h) => <NursingDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
  notes:           (p, h) => <NotesDashboard currentUser={p.currentUser} onLogout={h.handleLogout} />,
};

export default function AppRoutes({ state, handlers, ToastBridge }) {
  const { loggedIn, page, subPage, showUHID, showPrint, showPatientDetail,
    uhid, admNo, patient, discharge, svcs, billing, locId, db, branchSettings,
    printRequests, currentUser, isReturning, medicalHistory, setMedicalHistory,
    errs, doctors, patientDone, medicalDone, dischargeDone, findAdmissionRecord,
    getBranchBySlug, defaultBranch, setShowPrint, setShowPatientDetail,
    setPatient, setSubPage, setPage, setShowUHID } = state;

  const currentDb     = db[locId] || [];
  const currentBranch = getBranchBySlug(locId) || defaultBranch;
  const activeAdmission = findAdmissionRecord(uhid, admNo, locId);

  if (!loggedIn) return <><LoginPage onLogin={handlers.handleLogin} /><ToastBridge /></>;

  const dashboardRender = DASHBOARD_ROUTES[page];
  if (dashboardRender) {
    const needsPrint = ["superadmin", "branchadmin"].includes(page);
    return (
      <>
        {needsPrint && showPrint && (
          <PrintModal uhid={uhid} patient={patient} discharge={discharge} svcs={svcs}
            billing={billing} locId={locId} admNo={admNo} admission={activeAdmission}
            branch={currentBranch} onClose={() => setShowPrint(false)} />
        )}
        {dashboardRender(state, handlers)}
        <ToastBridge />
      </>
    );
  }

  const isDone = (id) => ({ patient: state.patientDone, medical: state.medicalDone, discharge: state.dischargeDone, services: state.servicesDone })[id] ?? true;
  const canNav = (id) => { const steps = ["patient","medical","discharge","services","summary"]; const idx = steps.indexOf(id); return idx <= 0 || isDone(steps[idx - 1]); };

  return (
    <>
      {showPrint && <PrintModal uhid={uhid} patient={patient} discharge={discharge} svcs={svcs} billing={billing} locId={locId} admNo={admNo} admission={activeAdmission} branch={currentBranch} onClose={() => setShowPrint(false)} />}
      {showPatientDetail && <PatientDetailModal patient={showPatientDetail} onClose={() => setShowPatientDetail(null)} onDischarge={handlers.handleDischargeFromHistory} onSaved={handlers.handlePatientSaved} currentUser={currentUser} />}

      <header className="hdr">
        <div className="hdr-left">
          <div className="hdr-logo"><img src="/logo192.png" alt="logo" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover" }} /></div>
          <div><p className="hdr-name">Sangi Hospital</p><p className="hdr-sub">IPD Portal</p></div>
        </div>
        <div className="hdr-right">
          {uhid && <div className="hdr-uhid"><span className="hdr-uhid-label">UHID</span>{uhid}</div>}
          <LiveDate />
          <ThemeModeDock variant="inline" />
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
              <div style={{ fontSize: 12, lineHeight: 1.4, textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--hdr-text)" }}>{currentUser.name}</div>
                <div style={{ color: "var(--hdr-sub)" }}>{currentUser?.accessScope === "all_hospitals" ? "All hospitals" : `${currentBranch?.name || "Branch"} Branch`}</div>
              </div>
              <button onClick={handlers.handleLogout} style={{ padding: "6px 14px", borderRadius: 8, background: "var(--hdr-chip-bg)", border: "1px solid var(--hdr-chip-border)", color: "var(--hdr-text)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="sidebar-section-label">Registration Steps</div>
            {NAV_PAGES.map((p, i) => {
              const locked = !canNav(p.id), active = page === p.id && !showUHID, done = isDone(p.id);
              return (
                <div key={p.id} className={`nav-item${active?" active":""}${done&&!active?" done":""}${locked?" locked":""}`} onClick={() => canNav(p.id) && setPage(p.id)}>
                  <div className="nav-icon">{locked ? <Ico d={IC.lock} size={15} sw={2} /> : <Ico d={PAGE_ICONS[p.icon]} size={15} sw={2} />}</div>
                  <span className="nav-label">{p.label}</span>
                  <span className="nav-step-num">
                    {p.id==="medical"&&!medicalDone&&patientDone ? <span style={{fontSize:9,color:"var(--warning)"}}>!</span> : done ? <Ico d={IC.check} size={10} sw={2.5} /> : i+1}
                  </span>
                </div>
              );
            })}
            <div className="sidebar-divider" />
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Records</div>
            <div className={`sidebar-hist-item${page==="history"?" active":""}`} onClick={() => { setShowUHID(false); setPage("history"); }}>
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
              <button onClick={handlers.endSession} style={{ width:"100%", padding:"10px", borderRadius:"10px", background:"var(--danger-soft)", color:"var(--danger)", border:"1px solid var(--danger-border)", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                <Ico d={IC.cross} size={14} sw={2.5} /> Close Patient
              </button>
            </div>
          )}
        </aside>

        <main className="main" key={page+showUHID+subPage+locId}>
          {page==="patient" && !showUHID && subPage==="search" && <SearchPage db={currentDb} locId={locId} branch={currentBranch} onNewAdmission={handlers.handleNewAdmission} onNewPatient={handlers.handleNewPatient} />}
          {page==="patient" && !showUHID && subPage==="form"   && <PatientFormPage data={patient} setData={setPatient} onSubmit={handlers.handleRegister} errs={errs} onBack={() => setSubPage("search")} isReturning={isReturning} />}
          {page==="patient" && showUHID                        && <UHIDScreen uhid={uhid} patient={patient} isReturning={isReturning} admNo={admNo} onContinue={handlers.handleUHIDContinue} onDashboard={handlers.handleUHIDDashboard} onNewPatient={handlers.handleUHIDNewPatient} />}
          {page==="medical"   && <MedicalHistoryPage data={medicalHistory} setData={setMedicalHistory} onSave={handlers.handleSaveMedical} onSkip={handlers.handleSaveMedical} patient={patient} discharge={discharge} locId={locId} doctors={doctors} />}
          {page==="discharge" && <DischargePage data={discharge} setData={state.setDischarge} onSave={handlers.handleSaveDischarge} uhid={uhid} admNo={admNo} admissionRecord={findAdmissionRecord(uhid, admNo, locId)} doctors={doctors} />}
          {page==="services"  && <ServicesPage svcs={svcs} setSvcs={state.setSvcs} billing={billing} setBilling={state.setBilling} onSave={handlers.handleSaveServices} patientPayMode={patient?.payMode} />}
          {page==="summary"   && <SummaryPage uhid={uhid} patient={patient} discharge={discharge} svcs={svcs} billing={billing} locId={locId} admNo={admNo} branch={currentBranch} onPrint={() => setShowPrint(true)} onRequestPrint={handlers.handleRequestPrint} />}
          {page==="history"   && <PatientsHistoryPage db={currentDb} locId={locId} branch={currentBranch} onBack={() => setPage("patient")} onDischarge={handlers.handleDischargeFromHistory} onGenerateBill={handlers.handleGenerateBillFromHistory} onSetExpectedDod={handlers.handleSetExpectedDod} onViewPatient={p => setShowPatientDetail(p)} onSaveMedHistory={handlers.handleSaveMedHistoryFromHistory} onViewMedical={handlers.handleMedicalFromHistory} />}
        </main>
      </div>
      <ToastBridge />
    </>
  );
}
