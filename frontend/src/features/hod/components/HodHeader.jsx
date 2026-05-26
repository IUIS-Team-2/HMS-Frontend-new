import React from "react";
import { LogOut, RefreshCw } from "lucide-react";
import ThemeModeDock from "../../../components/ui/ThemeModeDock";
import { VIEWS } from "../constants/hodConstants";

export default function HodHeader({
  loading, activeDept, activeView,
  myWorkView, myWorkSel,
  onRefresh, onLogout,
}) {
  return (
    <header className="hod-hdr">
      <div>
        <div style={{ fontSize:9, letterSpacing:".1em", color:"var(--text-muted)", textTransform:"uppercase" }}>
          HOD Dashboard / {activeDept}
          {activeView==="my-work" && myWorkView==="patient" && myWorkSel &&
            <span style={{ color:"#6366f1" }}> / {myWorkSel.patientName||myWorkSel.name}</span>
          }
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>
          {activeView==="my-work" && myWorkView==="patient"
            ? `Working on: ${myWorkSel?.patientName||myWorkSel?.name||""}`
            : VIEWS.find(v => v.id === activeView)?.label || activeDept + " Department"
          }
        </div>
      </div>
      <div className="hod-hdr-right">
        {loading && (
          <div className="hod-sync-pill">
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#06b6d4", animation:"pulse 1s infinite" }}/>SYNCING
          </div>
        )}
        <button className="hod-btn hod-btn-ghost" onClick={onRefresh}><RefreshCw size={13} strokeWidth={1.8}/></button>
        <ThemeModeDock variant="inline"/>
        <button className="hod-hdr-logout" onClick={onLogout}><LogOut size={13} strokeWidth={1.8}/>Logout</button>
      </div>
    </header>
  );
}
