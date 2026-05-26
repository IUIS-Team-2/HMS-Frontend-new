import { useEffect, useMemo } from "react";

import { DISC_ST, DEPARTMENTS } from "../data/constants";
import { IC } from "../components/ui/Icons";
import { Card, Inp, Sel, Txta } from "../components/ui/SharedUI";
import { SearchableSelect } from "../components/SearchableSelect";

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function nowLocalDateTimeInput() {
  return toLocalDateTimeInput(new Date());
}

export default function DischargePage({ data, setData, onSave, admissionRecord, doctors = [] }){
  const set = k => e => setData(p => ({...p, [k]: e.target.value}));

  const doctorOptions = useMemo(() => {
    return doctors
      .map((doctor) => {
        const name = String(doctor?.name || "").trim();
        const qualification = String(doctor?.qualification || "").trim();
        if (!name) return null;
        return qualification ? `${name} (${qualification})` : name;
      })
      .filter(Boolean);
  }, [doctors]);

  useEffect(() => {
    const admissionDate = admissionRecord?.discharge?.doa || admissionRecord?.dateTime || "";
    const billDate = data?.billDate || nowLocalDateTimeInput();
    const dischargeDate = data?.dod || nowLocalDateTimeInput();
    const doctorName =
      data?.doctorName ||
      admissionRecord?.discharge?.doctorName ||
      admissionRecord?.medicalHistory?.treatingDoctor ||
      "";

    setData(prev => ({
      ...prev,
      billDate: prev.billDate || billDate,
      dod: prev.dod || dischargeDate,
      doa: prev.doa || toLocalDateTimeInput(admissionDate),
      doctorName: prev.doctorName || doctorName,
    }));
  }, [admissionRecord, data?.billDate, data?.doa, data?.dod, data?.doctorName, setData]);
  
  return(
   <div
  className="form-page"
  style={{
    height: "calc(100vh - 80px)",
    overflowY: "auto",
    paddingBottom: "120px"
  }}
>
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
          <div className="fld">
            <label>Treating Doctor</label>
            <SearchableSelect
              value={data.doctorName || ""}
              onChange={(value) => setData(prev => ({ ...prev, doctorName: value }))}
              options={doctorOptions}
              placeholder={doctorOptions.length ? "Select treating doctor..." : "No doctors added yet"}
              searchPlaceholder="Search doctor or qualification..."
              allowCustom
            />
          </div>
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
