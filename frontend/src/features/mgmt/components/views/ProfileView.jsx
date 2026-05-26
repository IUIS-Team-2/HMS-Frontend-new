import React from "react";

export default function ProfileView({ accent, currentUser, currentDisplayName, profileForm, setProfileForm, saveMyProfile, initials, Badge }) {
  return (
    <div>
      <div className="hms-prof-card" style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",border:`1px solid ${accent}30`,marginBottom:20}}>
        <div style={{width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${accent},#818cf8)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff",marginBottom:12}}>{initials(currentDisplayName)}</div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{currentDisplayName}</div>
        <div style={{fontSize:11,color:accent,fontWeight:600,marginBottom:4}}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
        <Badge col="#34d399">Active</Badge>
      </div>
      <div className="hms-card">
        <div className="hms-card-title" style={{marginBottom:14}}>Account Details</div>
        <div className="hms-g2">
          <div><label className="hms-lbl">First Name</label><input className="hms-inp" value={profileForm.first_name} onChange={e=>setProfileForm(f=>({...f,first_name:e.target.value}))}/></div>
          <div><label className="hms-lbl">Last Name</label><input className="hms-inp" value={profileForm.last_name} onChange={e=>setProfileForm(f=>({...f,last_name:e.target.value}))}/></div>
        </div>
        <div className="hms-g2">
          <div><label className="hms-lbl">Email</label><input className="hms-inp" type="email" value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))}/></div>
          <div><label className="hms-lbl">Phone</label><input className="hms-inp" value={profileForm.phone_number} onChange={e=>setProfileForm(f=>({...f,phone_number:e.target.value}))}/></div>
        </div>
        <div className="hms-g2">
          <div><label className="hms-lbl">Employee Code</label><input className="hms-inp" value={profileForm.emp_id} onChange={e=>setProfileForm(f=>({...f,emp_id:e.target.value}))}/></div>
          <div><label className="hms-lbl">Role</label><input className="hms-inp" value={currentUser?.role||""} readOnly/></div>
        </div>
        <div className="hms-modal-foot" style={{justifyContent:"flex-end"}}><button className="hms-save-btn" onClick={saveMyProfile}>Save Profile</button></div>
      </div>
    </div>
  );
}
