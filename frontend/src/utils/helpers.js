export const blankPatient=()=>({patientName:"",guardianName:"",gender:"",dob:"",ageYY:"",ageMM:"",ageDD:"",bloodGroup:"",maritalStatus:"",phone:"",altPhone:"",email:"",address:"",remarks:"",allergies:"",tpa:"",tpaCard:"",tpaValidity:"",tpaCardType:"",tpaPanelCardNo:"",tpaPanelValidity:"",nationalId:""});
export const blankDischarge=()=>({dischargeStatus:"",doa:"",dod:"",roomNo:"",bedNo:"",billDate:"",wardName:"",doctorName:"",diagnosis:"",department:""});
export const blankBilling=()=>({discount:"",advance:"",paidNow:"",paymentMode:""});
export const blankSvc=()=>({type:"",code:"",title:"",rate:"",qty:"1"});

export const initials=name=>name?name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase():"?";
export const fmtDT=dt=>{if(!dt)return "—";try{return new Date(dt).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});}catch{return dt;}};
export const fmtDate=dt=>{if(!dt)return "—";try{return new Date(dt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}catch{return dt;}};
export const admTotal=svcs=>svcs.reduce((a,s)=>a+(parseFloat(s.rate)||0)*(parseInt(s.qty)||0),0);