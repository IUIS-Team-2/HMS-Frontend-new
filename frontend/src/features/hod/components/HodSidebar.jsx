import React from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { DEPARTMENTS, DEPT_META, VIEWS } from "../constants/hodConstants";
import { initials } from "../utils/hodUtils";

export default function HodSidebar({
  collapsed, setCollapsed,
  activeDept, setActiveDept,
  activeView, setActiveView,
  setMyWorkView,
  currentUser,
  pendingCount, overdueCount, completedCount,
  deptColor,
  onLogout,
}) {
  return (
    <aside className={`hod-sb${collapsed ? " col" : ""}`}>
      <div className="hod-sb-head">
        {!collapsed && (
          <div style={{ flex:1, overflow:"hidden" }}>
            <div style={{ fontSize:8, letterSpacing:".12em", color:deptColor, textTransform:"uppercase", marginBottom:2 }}>HOD Panel</div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentUser?.name||"Head of Dept"}</div>
          </div>
        )}
        {collapsed && <div className="hod-logo">H</div>}
        <button className="hod-col-btn" onClick={() => setCollapsed(c => !c)}>{collapsed ? "»" : "«"}</button>
      </div>

      <div className="hod-sb-scroll">
        {!collapsed && (
          <div className="hod-sb-mini-stats">
            {[{val:pendingCount,col:"#f59e0b",lbl:"Pend"},{val:overdueCount,col:"#ef4444",lbl:"Over"},{val:completedCount,col:"#10b981",lbl:"Done"}].map((s,i) => (
              <div key={i} className="hod-mini-stat" style={{ background:`${s.col}10`, borderColor:`${s.col}25` }}>
                <div style={{ fontSize:15, fontWeight:800, color:s.col }}>{s.val}</div>
                <div style={{ fontSize:8, color:"var(--text-muted)", letterSpacing:".08em", textTransform:"uppercase", marginTop:1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        <div className="hod-slbl">{collapsed ? "DEPT" : "Departments"}</div>
        {DEPARTMENTS.map(dept => {
          const meta = DEPT_META[dept] || {};
          const Icon = meta.icon;
          return (
            <button key={dept}
              className={`hod-nav-item${activeDept === dept && activeView === "dept-tasks" ? " act" : ""}`}
              style={{ borderLeftColor: activeDept === dept && activeView === "dept-tasks" ? meta.color : "transparent" }}
              onClick={() => { setActiveDept(dept); setActiveView("dept-tasks"); setMyWorkView("list"); }}>
              <div className="hod-nav-icon" style={{ background:`${meta.color||"#64748b"}18`, color:meta.color||"#64748b" }}>
                {Icon && <Icon size={15} strokeWidth={1.8} style={{ display:"block", color:meta.color||"#64748b" }}/>}
              </div>
              {!collapsed && <span style={{ flex:1 }}>{dept}</span>}
            </button>
          );
        })}

        <div className="hod-slbl">{collapsed ? "NAV" : "Navigation"}</div>
        {VIEWS.map(v => {
          const Icon = v.icon;
          return (
            <button key={v.id}
              className={`hod-nav-item${activeView === v.id ? " act" : ""}`}
              onClick={() => { setActiveView(v.id); if (v.id !== "my-work") setMyWorkView("list"); }}>
              <div className="hod-nav-icon" style={{ background:activeView===v.id?"rgba(16,185,129,0.15)":"var(--surface-2)", color:activeView===v.id?"#10b981":"var(--text-muted)" }}>
                {Icon && <Icon size={15} strokeWidth={1.8} style={{ display:"block" }}/>}
              </div>
              {!collapsed && v.label}
            </button>
          );
        })}
      </div>

      <div className="hod-sb-footer">
        {!collapsed && currentUser && (
          <div className="hod-user-card">
            <div className="hod-avatar">{initials(currentUser.name)}</div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentUser.name}</div>
              <div style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:".06em", textTransform:"uppercase" }}>HOD · {currentUser.department||"Dept"}</div>
            </div>
          </div>
        )}
        <button className="hod-logout" onClick={onLogout}>
          <LogOut size={13} strokeWidth={1.8}/>{!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
