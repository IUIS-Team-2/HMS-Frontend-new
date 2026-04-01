import { T } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";

export default function UHIDScreen({uhid,patient,isReturning,admNo,onContinue,onDashboard,onNewPatient}){
  return(<div className="uhid-gen">
    <div className="uhid-ring"><Ico d={IC.check} size={36} sw={2.5}/></div>
    <div style={{fontSize:12,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{isReturning?`Admission #${admNo} Created`:"UHID Generated"}</div>
    <div className="uhid-big">{uhid}</div>
    <p className="uhid-gen-sub">{isReturning?"Returning patient — same UHID retained, new admission entry added.":"Patient registered successfully. You can now fill discharge and billing details."}</p>
    <div className="uhid-info-grid">{[["Patient Name",patient.patientName],["Gender",patient.gender],["Phone",patient.phone],["Blood Group",patient.bloodGroup]].map(([l,v])=>(<div className="uhid-info-item" key={l}><div className="uhid-info-lbl">{l}</div><div className="uhid-info-val">{v||"—"}</div></div>))}</div>
    <div className="btn-row" style={{justifyContent:"center",gap:12}}>
      <button className="btn btn-ghost" onClick={onDashboard}><Ico d={IC.search} size={15} sw={2}/> Back to Dashboard</button>
      <button className="btn btn-ghost" onClick={onNewPatient}><Ico d={IC.plus} size={15} sw={2.5}/> Add New Patient</button>
      <button className="btn btn-primary" onClick={onContinue}><Ico d={IC.bed} size={15} sw={2}/> Continue to Medical History →</button>
    </div>
  </div>);
}