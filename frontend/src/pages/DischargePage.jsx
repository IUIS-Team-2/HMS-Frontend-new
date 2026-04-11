import { DISC_ST, DEPARTMENTS } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";
import { Card, Inp, Sel, Txta } from "../components/ui/SharedUI";

export default function DischargePage({data, setData, onSave}){
  const set = k => e => setData(p => ({...p, [k]: e.target.value}));
  
  return(
    <div className="form-page">
      <div className="page-hd">
        <h1>Discharge Details</h1>
        <p>Room allocation, dates, department and treating doctor</p>
      </div>
      
      <Card icon={IC.bed} title="Admission & Discharge" subtitle="Dates, status and room details" delay={0}>
        <div className="g2">
          <Sel label="Status on Discharge" req opts={DISC_ST} placeholder="Select status" value={data.dischargeStatus} onChange={set("dischargeStatus")}/>
          <Inp label="Bill Date & Time" type="datetime-local" value={data.billDate} onChange={set("billDate")}/>
          <Inp label="Date & Time of Admission (DOA)" req type="datetime-local" value={data.doa} onChange={set("doa")}/>
          <Inp label="Date & Time of Discharge (DOD)" type="datetime-local" value={data.dod} onChange={set("dod")}/>
          <Inp label="Room Number" placeholder="e.g. 204" value={data.roomNo} onChange={set("roomNo")}/>
          <Inp label="Bed Number" placeholder="e.g. B-12" value={data.bedNo} onChange={set("bedNo")}/>
        </div>
      </Card>
      
      <Card icon={IC.dept} title="Clinical Information" subtitle="Department, ward, doctor and diagnosis" delay={0.05}>
        <div className="g2">
          <Sel label="Department" req opts={DEPARTMENTS} placeholder="Select department" value={data.department} onChange={set("department")}/>
          <Inp label="Ward Name" placeholder="e.g. General Ward, ICU" value={data.wardName} onChange={set("wardName")}/>
          <Inp label="Treating Doctor" placeholder="Dr. Full Name" value={data.doctorName} onChange={set("doctorName")}/>
          <div className="s2">
            <Txta label="Diagnosis / Condition" placeholder="Primary diagnosis or condition…" value={data.diagnosis} onChange={set("diagnosis")} rows={2}/>
          </div>
        </div>
      </Card>
      
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:24, paddingBottom:40 }}>
        <button onClick={onSave} style={{ background:"#34D399", color:"#000", padding:"12px 24px", borderRadius:8, fontWeight:800, border:"none", cursor:"pointer", fontSize:14 }}>
          Save & Continue
        </button>
      </div>
    </div>
  );
}