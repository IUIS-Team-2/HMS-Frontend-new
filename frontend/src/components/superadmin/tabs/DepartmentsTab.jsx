import { useT, bColor, bName, cardStyle, inr } from "../shared/tokens";
import { Pill, StatCard, TH } from "../shared/MicroUI";
import { Building2, Hospital, Hotel } from "lucide-react";

export default function DepartmentsTab({ all }) {
  const T = useT();
  const map = {};
  all.forEach(p => {
    const key = p._branch + "__" + p.department;
    if (!map[key]) map[key] = { branch:p._branch, dept:p.department, patients:0, revenue:0, doctors:new Set() };
    map[key].patients++;
    map[key].revenue += p.grand;
    if (p.doctor && p.doctor !== "--") map[key].doctors.add(p.doctor);
  });
  const depts = Object.values(map).map(d => ({ ...d, doctors:[...d.doctors] }));
  const allDepts = new Set(all.map(p => p.department)).size;

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
        <StatCard icon={Building2} label="Total Departments" value={allDepts} color={T.laxmi} />
        <StatCard icon={Hospital} label="Active Branches" value={new Set(all.map(p=>p._branch)).size} color={T.amber} />
        <StatCard icon={Hotel} label="Mapped Records" value={all.length} color={T.raya} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {depts.map((d, i) => {
          const col = bColor(d.branch, T);
          return (
            <div key={i} style={{ ...cardStyle(T), borderTop:`3px solid ${col}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:T.white }}>{d.dept}</div>
                  <div style={{ marginTop:5 }}><Pill color={col}>{bName(d.branch)}</Pill></div>
                </div>
                <div style={{ fontSize:24 }}>🏢</div>
              </div>
              {[["Total Patients",d.patients],["Doctors",d.doctors.length],["Total Revenue",inr(d.revenue)]].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12, color:T.dim }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:T.white }}>{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}