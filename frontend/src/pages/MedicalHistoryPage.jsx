import { T } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";

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

function Txta({label,req,placeholder,value,onChange,rows=3}){
  return(
    <Field label={label} req={req}>
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

function Section({title, subtitle, icon, children}){
  return(
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,marginBottom:20,overflow:"hidden",boxShadow:"0 1px 4px rgba(11,37,69,.07)"}}>
      <div style={{display:"flex",alignItems:"center",gap:13,padding:"17px 22px",borderBottom:`1px solid ${T.border}`,background:T.offwhite}}>
        <div style={{width:36,height:36,borderRadius:10,background:T.bgTint,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.accentDeep}}>
          <Ico d={icon} size={16} sw={1.75}/>
        </div>
        <div>
          <p style={{fontFamily:"DM Serif Display,serif",fontSize:15,color:T.primary,margin:0}}>{title}</p>
          <p style={{fontSize:12,color:T.textMuted,margin:"2px 0 0"}}>{subtitle}</p>
        </div>
      </div>
      <div style={{padding:24}}>{children}</div>
    </div>
  );
}

export function AdmissionNotePrint({data, patient, discharge, locId}){
  const branchInfo = {
    "laxmi": {name:"Lakshmi Nagar Branch", address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1:"+91-9717444531", phone2:"+91-9717444532", email:"laxminagar@sangihospital.com"},
    "raya":  {name:"Raya Branch", address:"Raya, Mathura, Uttar Pradesh - 281204", phone1:"+91-9311212090", phone2:"+91-9311212091", email:"info@sangihospital.com"},
  };
  const branch = branchInfo[locId] || branchInfo["laxmi"];
  const today = new Date().toLocaleDateString("en-IN", {day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime = new Date().toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});

  return(
    <div id="admission-note-print" style={{fontFamily:"Arial,sans-serif",fontSize:12,color:"#000",padding:"24px 32px",background:"#fff",maxWidth:800,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"2px solid #000",paddingBottom:10,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/logo512.png" alt="Sangi Hospital" style={{width:64,height:64,objectFit:"contain",borderRadius:12}}/>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:"#1a5b8c",letterSpacing:2,lineHeight:1}}>SANGi</div>
            <div style={{fontSize:13,fontWeight:700,color:"#d93838",letterSpacing:4}}>HOSPITAL</div>
          </div>
        </div>
        <div style={{textAlign:"right",fontSize:11,color:"#444",lineHeight:1.8}}>
          <div>Add.: {branch.address}</div>
          <div>Ph.: {branch.phone1}, {branch.phone2}</div>
          <div>Email: {branch.email}</div>
          <div>Web.: www.sangihospital.com</div>
        </div>
      </div>

      {/* Title */}
      <div style={{textAlign:"center",fontSize:16,fontWeight:900,letterSpacing:2,borderBottom:"1px solid #000",paddingBottom:8,marginBottom:10}}>ADMISSION NOTE</div>

      {/* Patient Info Row */}
      <div style={{display:"flex",gap:24,marginBottom:10,flexWrap:"wrap"}}>
        <div><strong>Name of the Patient: </strong><u>{(patient?.patientName||"—").toUpperCase()}</u></div>
        <div><strong>Age/Sex: </strong><u>{patient?.ageYY||"—"}Y / {(patient?.gender||"—").toUpperCase()}</u></div>
        <div><strong>IPD NO: </strong><u>SH/{discharge?.department?.substring(0,4)?.toUpperCase()||"GEN"}/26/001</u></div>
      </div>
      <div style={{display:"flex",gap:24,marginBottom:14,flexWrap:"wrap"}}>
        <div><strong>Card No: </strong><u>{patient?.tpaCard||patient?.tpaPanelCardNo||"—"}</u></div>
        <div><strong>WARD/Bed NO: </strong><u>{discharge?.wardName||"—"}</u></div>
        <div><strong>Date: </strong><u>{today} AT {nowTime} HR</u></div>
      </div>

      {/* Main 2-col grid */}
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
        <tbody>
          <tr>
            <td style={{border:"1px solid #000",padding:"10px 12px",width:"50%",verticalAlign:"top"}}>
              <div style={{fontWeight:900,fontSize:12,marginBottom:6}}>PRESENT COMPLAINTS-</div>
              <div style={{fontSize:12,whiteSpace:"pre-wrap",minHeight:60}}>{data?.presentComplaints||"—"}</div>
              {data?.chiefComplaints && <><div style={{fontWeight:700,marginTop:8}}>C/O-</div><div style={{whiteSpace:"pre-wrap"}}>{data.chiefComplaints}</div></>}
            </td>
            <td style={{border:"1px solid #000",padding:"10px 12px",width:"50%",verticalAlign:"top"}}>
              <div style={{fontWeight:900,fontSize:12,marginBottom:6}}>INVESTIGATIONS-</div>
              <div style={{fontSize:12,whiteSpace:"pre-wrap",minHeight:60}}>{data?.investigations||"—"}</div>
            </td>
          </tr>
          <tr>
            <td style={{border:"1px solid #000",padding:"10px 12px",verticalAlign:"top"}}>
              <div style={{fontWeight:900,fontSize:12,marginBottom:6}}>PAST HISTORY-</div>
              <div style={{fontSize:12,whiteSpace:"pre-wrap",minHeight:40}}>{data?.previousDiagnosis||data?.pastSurgeries ? `${data?.previousDiagnosis||""}\n${data?.pastSurgeries||""}`.trim() : "—"}</div>
            </td>
            <td style={{border:"1px solid #000",padding:"10px 12px",verticalAlign:"top"}}>
              <div style={{fontWeight:900,fontSize:12,marginBottom:6}}>TREATMENT ADVISED- {data?.treatmentAdvised?.substring(0,20)||""}</div>
              <div style={{fontSize:12,whiteSpace:"pre-wrap",minHeight:40}}>{data?.treatmentAdvised||"—"}</div>
            </td>
          </tr>
          <tr>
            <td style={{border:"1px solid #000",padding:"10px 12px",verticalAlign:"top"}}>
              <div style={{fontWeight:900,fontSize:12,marginBottom:8}}>EXAMINATIONS-</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",fontSize:12}}>
                {[["BP",data?.bp],["PR",data?.pr],["SPO2",data?.spo2],["TEMP",data?.temp]].map(([k,v])=>(
                  <div key={k}><strong>{k}= </strong>{v||"—"}</div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px",fontSize:12,marginTop:6}}>
                {[["Chest",data?.chest],["CVS",data?.cvs],["CNS",data?.cns],["P/A",data?.pa]].map(([k,v])=>(
                  <div key={k}><strong>{k}: </strong>{v||"—"}</div>
                ))}
              </div>
            </td>
            <td style={{border:"1px solid #000",padding:"10px 12px",verticalAlign:"top"}}>
              <div style={{fontWeight:900,fontSize:12,marginBottom:6}}>PROVISIONAL DIAGNOSIS-</div>
              <div style={{fontSize:12,whiteSpace:"pre-wrap",minHeight:40}}>{data?.provisionalDiagnosis||discharge?.diagnosis||"—"}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:40,fontSize:12}}>
        <div style={{textAlign:"center",minWidth:160}}>
          <div style={{borderTop:"1px solid #000",paddingTop:6,fontWeight:700}}>Adv.</div>
          <div style={{color:"#555",marginTop:4}}>{data?.treatingDoctor||discharge?.doctorName||"—"}</div>
        </div>
        <div style={{textAlign:"center",minWidth:160}}>
          <div style={{borderTop:"1px solid #000",paddingTop:6,fontWeight:700}}>Consultant</div>
        </div>
        <div style={{textAlign:"center",minWidth:160}}>
          <div style={{borderTop:"1px solid #000",paddingTop:6,fontWeight:700}}>DOCTOR SIGNATURE</div>
        </div>
      </div>
    </div>
  );
}

export function downloadAdmissionNote(data, patient, discharge, locId){
  const printWindow = window.open("","_blank","width=900,height=700");
  const branchInfo = {
    "laxmi": {name:"Lakshmi Nagar Branch", address:"Lakshmi Nagar, Mathura, Uttar Pradesh - 281004", phone1:"+91-9717444531", phone2:"+91-9717444532", email:"laxminagar@sangihospital.com"},
    "raya":  {name:"Raya Branch", address:"Raya, Mathura, Uttar Pradesh - 281204", phone1:"+91-9311212090", phone2:"+91-9311212091", email:"info@sangihospital.com"},
  };
  const branch = branchInfo[locId] || branchInfo["laxmi"];
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const nowTime = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});

  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>Admission Note - ${patient?.patientName||""}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:24px 32px;margin:0}
      table{width:100%;border-collapse:collapse}
      td{border:1px solid #000;padding:10px 12px;vertical-align:top;width:50%}
      .pre{white-space:pre-wrap;min-height:50px}
      @media print{@page{size:A4;margin:10mm}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="/sangi-logo.png" onerror="this.src='/logo512.png'" alt="Sangi Hospital" style="width:64px;height:64px;object-fit:contain;border-radius:12px"/>
        <div>
          <div style="font-size:28px;font-weight:900;color:#1a5b8c;letter-spacing:2px;line-height:1">SANGi</div>
          <div style="font-size:13px;font-weight:700;color:#d93838;letter-spacing:4px">HOSPITAL</div>
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#444;line-height:1.8">
        <div>Add.: ${branch.address}</div>
        <div>Ph.: ${branch.phone1}, ${branch.phone2}</div>
        <div>Email: ${branch.email}</div>
        <div>Web.: www.sangihospital.com</div>
      </div>
    </div>
    <div style="text-align:center;font-size:16px;font-weight:900;letter-spacing:2px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px">ADMISSION NOTE</div>
    <div style="display:flex;gap:24px;margin-bottom:8px;flex-wrap:wrap">
      <div><strong>Name of the Patient: </strong><u>${(patient?.patientName||"—").toUpperCase()}</u></div>
      <div><strong>Age/Sex: </strong><u>${patient?.ageYY||"—"}Y / ${(patient?.gender||"—").toUpperCase()}</u></div>
      <div><strong>IPD NO: </strong><u>SH/${discharge?.department?.substring(0,4)?.toUpperCase()||"GEN"}/26/001</u></div>
    </div>
    <div style="display:flex;gap:24px;margin-bottom:14px;flex-wrap:wrap">
      <div><strong>Card No: </strong><u>${patient?.tpaCard||patient?.tpaPanelCardNo||"—"}</u></div>
      <div><strong>WARD/Bed NO: </strong><u>${discharge?.wardName||"—"}</u></div>
      <div><strong>Date: </strong><u>${today} AT ${nowTime} HR</u></div>
    </div>
    <table>
      <tr>
        <td><strong>PRESENT COMPLAINTS-</strong><div class="pre">${data?.presentComplaints||"—"}</div>${data?.chiefComplaints?`<strong>C/O-</strong><div class="pre">${data.chiefComplaints}</div>`:""}</td>
        <td><strong>INVESTIGATIONS-</strong><div class="pre">${data?.investigations||"—"}</div></td>
      </tr>
      <tr>
        <td><strong>PAST HISTORY-</strong><div class="pre">${[data?.previousDiagnosis,data?.pastSurgeries].filter(Boolean).join("\n")||"—"}</div></td>
        <td><strong>TREATMENT ADVISED-</strong><div class="pre">${data?.treatmentAdvised||"—"}</div></td>
      </tr>
      <tr>
        <td>
          <strong>EXAMINATIONS-</strong><br/>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px">
            <div><strong>BP= </strong>${data?.bp||"—"}</div>
            <div><strong>Chest: </strong>${data?.chest||"—"}</div>
            <div><strong>PR= </strong>${data?.pr||"—"}</div>
            <div><strong>CVS: </strong>${data?.cvs||"—"}</div>
            <div><strong>SPO2= </strong>${data?.spo2||"—"}</div>
            <div><strong>CNS: </strong>${data?.cns||"—"}</div>
            <div><strong>TEMP= </strong>${data?.temp||"—"}</div>
            <div><strong>P/A: </strong>${data?.pa||"—"}</div>
          </div>
        </td>
        <td><strong>PROVISIONAL DIAGNOSIS-</strong><div class="pre">${data?.provisionalDiagnosis||discharge?.diagnosis||"—"}</div></td>
      </tr>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:50px">
      <div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Adv.</div><div style="color:#555;margin-top:4px">${data?.treatingDoctor||discharge?.doctorName||"—"}</div></div>
      <div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">Consultant</div></div>
      <div style="text-align:center;min-width:160px"><div style="border-top:1px solid #000;padding-top:6px;font-weight:700">DOCTOR SIGNATURE</div></div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>
  `);
  printWindow.document.close();
}

export default function MedicalHistoryPage({data, setData, onSave, onSkip, patient, discharge, locId}){
  const set = k => e => setData(p=>({...p,[k]:e.target.value}));
  const isFilled = data.presentComplaints || data.previousDiagnosis || data.provisionalDiagnosis;

  return(
    <div style={{padding:"32px 44px 80px",animation:"fadeUp .3s ease both",fontFamily:"DM Sans,sans-serif"}}>
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontFamily:"DM Serif Display,serif",fontSize:26,color:T.primary,marginBottom:5}}>Medical History</h1>
            <p style={{fontSize:14,color:T.textMuted}}>Record admission note — complaints, examinations and treatment</p>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{padding:"6px 14px",borderRadius:20,background:isFilled?T.greenTint:T.amberTint,border:`1px solid ${isFilled?T.greenBorder:"#FDE68A"}`,fontSize:12,fontWeight:600,color:isFilled?T.green:T.amber}}>
              {isFilled?"✓ History Added":"⚠ Not Filled"}
            </div>
          </div>
        </div>
      </div>

      {/* Complaints */}
      <Section title="Present Complaints" subtitle="Chief complaints and presenting symptoms" icon={IC.pulse}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Txta label="Present Complaints" req placeholder="Patient presented in Department of Emergency Medicine..." value={data.presentComplaints||""} onChange={set("presentComplaints")} rows={4}/>
          <Txta label="C/O (Chief Complaints)" placeholder="Severe pain at Rt. Iliac fossa, fever with chills..." value={data.chiefComplaints||""} onChange={set("chiefComplaints")} rows={4}/>
        </div>
      </Section>

      {/* Examinations */}
      <Section title="Examinations" subtitle="Vitals and clinical examination findings" icon={IC.pulse}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:16}}>
          <Inp label="BP (mmHg)" placeholder="e.g. 120/80mmHg" value={data.bp||""} onChange={set("bp")}/>
          <Inp label="PR (/min)" placeholder="e.g. 82/min" value={data.pr||""} onChange={set("pr")}/>
          <Inp label="SPO2" placeholder="e.g. 98% On RA" value={data.spo2||""} onChange={set("spo2")}/>
          <Inp label="TEMP" placeholder="e.g. 98.6°F" value={data.temp||""} onChange={set("temp")}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          <Inp label="Chest" placeholder="e.g. B/L Crepts+" value={data.chest||""} onChange={set("chest")}/>
          <Inp label="CVS" placeholder="e.g. S1 S2 +" value={data.cvs||""} onChange={set("cvs")}/>
          <Inp label="CNS" placeholder="e.g. Conscious" value={data.cns||""} onChange={set("cns")}/>
          <Inp label="P/A" placeholder="e.g. Distended" value={data.pa||""} onChange={set("pa")}/>
        </div>
      </Section>

      {/* Investigations & Diagnosis */}
      <Section title="Investigations & Diagnosis" subtitle="Tests ordered and provisional diagnosis" icon={IC.file}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Txta label="Investigations" placeholder="CBC, LFT, KFT, CRP, RBS, Typhidot, MP Antigen..." value={data.investigations||""} onChange={set("investigations")} rows={4}/>
          <Txta label="Provisional Diagnosis" req placeholder="Acute Retention of Urine with ?UTI..." value={data.provisionalDiagnosis||""} onChange={set("provisionalDiagnosis")} rows={4}/>
        </div>
      </Section>

      {/* Treatment & History */}
      <Section title="Treatment & Past History" subtitle="Treatment advised and past medical history" icon={IC.wallet}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <Txta label="Treatment Advised" req placeholder="IV Fluids NS/RL @ 100ml/hr, Inj. Esomac 40mg IV BD..." value={data.treatmentAdvised||""} onChange={set("treatmentAdvised")} rows={5}/>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Txta label="Past History / Previous Diagnosis" placeholder="Diabetes, Hypertension, previous surgeries..." value={data.previousDiagnosis||""} onChange={set("previousDiagnosis")} rows={2}/>
            <Txta label="Past Surgeries" placeholder="e.g. Appendectomy 2018..." value={data.pastSurgeries||""} onChange={set("pastSurgeries")} rows={2}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Txta label="Current Medications" placeholder="e.g. Metformin 500mg, Amlodipine 5mg..." value={data.currentMedications||""} onChange={set("currentMedications")} rows={2}/>
          <Txta label="Known Allergies" placeholder="e.g. Penicillin, Sulfa drugs..." value={data.knownAllergies||""} onChange={set("knownAllergies")} rows={2}/>
        </div>
      </Section>

      {/* Doctor */}
      <Section title="Treating Doctor & Notes" subtitle="Doctor details and additional clinical notes" icon={IC.doctor}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Inp label="Treating Doctor" placeholder="Dr. Full Name & Speciality" value={data.treatingDoctor||""} onChange={set("treatingDoctor")}/>
          <Inp label="Qualification & Reg. No." placeholder="MBBS (Mp), DNB (Urology), No. 35942" value={data.doctorQual||""} onChange={set("doctorQual")}/>
          <div style={{gridColumn:"span 2"}}>
            <Txta label="Additional Notes / Remarks" placeholder="Any other relevant clinical information..." value={data.notes||""} onChange={set("notes")} rows={2}/>
          </div>
        </div>
      </Section>

      <div style={{display:"flex",alignItems:"center",gap:12,marginTop:8,justifyContent:"space-between"}}>
        <button onClick={onSkip} style={{padding:"11px 26px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.white,color:T.textMid,fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer"}}>
          Skip for now →
        </button>
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => downloadAdmissionNote(data, patient, discharge, locId)}
            style={{padding:"11px 26px",borderRadius:10,border:`1.5px solid ${T.accentDeep}`,background:T.white,color:T.accentDeep,fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            🖨 Preview Admission Note
          </button>
          <button onClick={onSave}
            style={{padding:"11px 26px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.accentDeep},${T.primary})`,color:"#fff",fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(14,165,233,.32)"}}>
            <Ico d={IC.check} size={15} sw={2.5}/> Save & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
