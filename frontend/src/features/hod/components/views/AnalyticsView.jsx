import React from "react";
import { Star } from "lucide-react";

export default function AnalyticsView({ analytics, activeDept, deptColor, employees, filterRange, setFilterRange, filterEmployee, setFilterEmployee, openReview }) {
  return (
    <div>
      <div className="hod-filter-bar">
        <select className="hod-sel" style={{ width:"auto" }} value={filterRange} onChange={e => setFilterRange(e.target.value)}>
          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
        </select>
        <select className="hod-sel" style={{ width:"auto" }} value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
          <option value="">All Employees</option>
          {employees.filter(e => (e.department||e.dept) === activeDept).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      {!analytics
        ? <div className="hod-empty"><div className="hod-empty-ico">📊</div><div>Loading analytics...</div></div>
        : <>
            <div className="hod-stat-grid">
              {(analytics.stats||[]).map((stat,i) => {
                const cols = [deptColor,"#34d399","#f59e0b","#a78bfa"];
                return <div key={i} className="hod-stat-card"><div style={{ fontSize:24, fontWeight:800, color:cols[i%4] }}>{stat.value}</div><div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>{stat.label}</div></div>;
              })}
            </div>
            <div className="hod-section">
              <div className="hod-section-head"><div className="hod-section-title">👥 Employee Performance — {activeDept}</div></div>
              <div className="hod-table-wrap" style={{ margin:0, borderRadius:0, border:"none" }}>
                <table className="hod-table">
                  <thead><tr>{["Employee","Assigned","Completed","Pending","Overdue","Completion %","Action"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(analytics.employee_stats||analytics.employeeStats||[]).map(emp => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight:600, color:"var(--text)" }}>{emp.name}</td>
                        <td>{emp.assigned}</td>
                        <td style={{ color:"#10b981" }}>{emp.completed}</td>
                        <td style={{ color:"#f59e0b" }}>{emp.pending}</td>
                        <td style={{ color:"#ef4444" }}>{emp.overdue}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1 }} className="hod-progress-track">
                              <div className="hod-progress-fill" style={{ width:`${emp.completion_pct||emp.completionPct||0}%`, background:(emp.completion_pct||emp.completionPct||0)>=80?"#10b981":(emp.completion_pct||emp.completionPct||0)>=50?"#f59e0b":"#ef4444" }}/>
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:"var(--text)", minWidth:32 }}>{emp.completion_pct||emp.completionPct||0}%</span>
                          </div>
                        </td>
                        <td><button className="hod-btn hod-btn-ghost" style={{ padding:"3px 9px", fontSize:"10px" }} onClick={() => openReview(null,emp)}><Star size={10}/> Review</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
      }
    </div>
  );
}
