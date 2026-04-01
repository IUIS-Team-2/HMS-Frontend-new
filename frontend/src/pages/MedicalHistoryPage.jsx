import { useState } from "react";
import { T } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";

const blankMedHistory = () => ({
  previousDiagnosis: "",
  pastSurgeries: "",
  currentMedications: "",
  treatingDoctor: "",
  knownAllergies: "",
  chronicConditions: "",
  familyHistory: "",
  smokingStatus: "",
  alcoholUse: "",
  notes: "",
});

function Field({label,req,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:".06em"}}>
        {label}{req&&<span style={{color:T.red}}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Inp({label,req,placeholder,value,onChange,type="text"}){
  return(
    <Field label={label} req={req}>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{fontFamily:"DM Sans,sans-serif",fontSize:14,color:T.text,background:T.white,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"11px 14px",width:"100%",outline:"none"}}
      />
    </Field>
  );
}

function Txta({label,placeholder,value,onChange,rows=3}){
  return(
    <Field label={label}>
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
        style={{fontFamily:"DM Sans,sans-serif",fontSize:14,color:T.text,background:T.white,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"11px 14px",width:"100%",outline:"none",resize:"vertical"}}
      />
    </Field>
  );
}

function Sel({label,value,onChange,opts}){
  return(
    <Field label={label}>
      <div style={{position:"relative"}}>
        <select value={value} onChange={onChange}
          style={{fontFamily:"DM Sans,sans-serif",fontSize:14,color:value?T.text:T.textLight,background:T.white,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"11px 14px",width:"100%",outline:"none",appearance:"none"}}>
          <option value="">Select...</option>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:T.textLight}}>▾</span>
      </div>
    </Field>
  );
}

export default function MedicalHistoryPage({data, setData, onSave, onSkip}){
  const set = k => e => setData(p=>({...p,[k]:e.target.value}));

  const isFilled = data.previousDiagnosis || data.currentMedications || data.treatingDoctor || data.knownAllergies || data.chronicConditions;

  return(
    <div style={{padding:"32px 44px 80px",animation:"fadeUp .3s ease both",fontFamily:"DM Sans,sans-serif"}}>
      
      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontFamily:"DM Serif Display,serif",fontSize:26,color:T.primary,marginBottom:5}}>Medical History</h1>
            <p style={{fontSize:14,color:T.textMuted}}>Record past diagnoses, medications, allergies and clinical background</p>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{padding:"6px 14px",borderRadius:20,background:isFilled?T.greenTint:T.amberTint,border:`1px solid ${isFilled?T.greenBorder:"#FDE68A"}`,fontSize:12,fontWeight:600,color:isFilled?T.green:T.amber,display:"flex",alignItems:"center",gap:6}}>
              <span>{isFilled?"✓ History Added":"⚠ Not Filled"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Diagnoses & Conditions */}
      <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 1px 4px rgba(11,37,69,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:13,padding:"17px 22px",borderBottom:`1px solid ${T.border}`,background:T.offwhite}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.bgTint,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentDeep}}>
            <Ico d={IC.pulse} size={16} sw={1.75}/>
          </div>
          <div>
            <p style={{fontFamily:"DM Serif Display,serif",fontSize:15,color:T.primary,margin:0}}>Previous Diagnoses & Conditions</p>
            <p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>Past illnesses, chronic conditions and family history</p>
          </div>
        </div>
        <div style={{padding:24,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Txta label="Previous Diagnosis / Illness" placeholder="e.g. Diabetes, Hypertension, TB..." value={data.previousDiagnosis} onChange={set("previousDiagnosis")} rows={3}/>
          <Txta label="Past Surgeries / Procedures" placeholder="e.g. Appendectomy 2018, Knee surgery..." value={data.pastSurgeries} onChange={set("pastSurgeries")} rows={3}/>
          <Txta label="Chronic Conditions" placeholder="e.g. Asthma, Heart disease..." value={data.chronicConditions} onChange={set("chronicConditions")} rows={2}/>
          <Txta label="Family Medical History" placeholder="e.g. Father - Diabetes, Mother - BP..." value={data.familyHistory} onChange={set("familyHistory")} rows={2}/>
        </div>
      </div>

      {/* Current Medications & Allergies */}
      <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 1px 4px rgba(11,37,69,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:13,padding:"17px 22px",borderBottom:`1px solid ${T.border}`,background:T.offwhite}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.bgTint,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentDeep}}>
            <Ico d={IC.wallet} size={16} sw={1.75}/>
          </div>
          <div>
            <p style={{fontFamily:"DM Serif Display,serif",fontSize:15,color:T.primary,margin:0}}>Medications & Allergies</p>
            <p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>Current medications and known allergic reactions</p>
          </div>
        </div>
        <div style={{padding:24,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Txta label="Current Medications" placeholder="e.g. Metformin 500mg, Amlodipine 5mg..." value={data.currentMedications} onChange={set("currentMedications")} rows={3}/>
          <Txta label="Known Allergies" placeholder="e.g. Penicillin, Sulfa drugs, Aspirin..." value={data.knownAllergies} onChange={set("knownAllergies")} rows={3}/>
        </div>
      </div>

      {/* Treating Doctor & Lifestyle */}
      <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 1px 4px rgba(11,37,69,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:13,padding:"17px 22px",borderBottom:`1px solid ${T.border}`,background:T.offwhite}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.bgTint,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentDeep}}>
            <Ico d={IC.doctor} size={16} sw={1.75}/>
          </div>
          <div>
            <p style={{fontFamily:"DM Serif Display,serif",fontSize:15,color:T.primary,margin:0}}>Treating Doctor & Lifestyle</p>
            <p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>Previous treating doctor and patient lifestyle habits</p>
          </div>
        </div>
        <div style={{padding:24,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Inp label="Previous Treating Doctor" placeholder="Dr. Full Name & Speciality" value={data.treatingDoctor} onChange={set("treatingDoctor")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Smoking Status" value={data.smokingStatus} onChange={set("smokingStatus")} opts={["Non-smoker","Ex-smoker","Current smoker"]}/>
            <Sel label="Alcohol Use" value={data.alcoholUse} onChange={set("alcoholUse")} opts={["None","Occasional","Regular"]}/>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <Txta label="Additional Notes / Remarks" placeholder="Any other relevant medical history..." value={data.notes} onChange={set("notes")} rows={3}/>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginTop:8,justifyContent:"space-between"}}>
        <button onClick={onSkip} style={{padding:"11px 26px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.white,color:T.textMid,fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          Skip for now →
        </button>
        <button onClick={onSave} style={{padding:"11px 26px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.accentDeep},${T.primary})`,color:"#fff",fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(14,165,233,.32)"}}>
          <Ico d={IC.check} size={15} sw={2.5}/> Save & Continue to Discharge →
        </button>
      </div>
    </div>
  );
}
