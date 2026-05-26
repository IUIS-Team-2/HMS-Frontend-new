import React from "react";
import { T, mkBtn, mkInput, UI_MONO_STACK } from "./branchAdminConstants";

export default function EmployeeModal({ empForm, empError, updateEmpField, onSubmit, onClose, theme, resolvedBranchName }) {
  const fi = { ...mkInput(), width: "100%" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,18,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: "18px", padding: "32px", width: "520px", maxHeight: "88vh", overflowY: "auto", boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px ${theme.primary}24` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "0.18em", color: theme.primary, textTransform: "uppercase", marginBottom: "6px", fontWeight: "700" }}>{resolvedBranchName}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: T.text, lineHeight: 1.1 }}>Add Employee</div>
            <div style={{ fontSize: "13px", color: T.textSub, marginTop: "6px" }}>Create a receptionist account for this branch.</div>
          </div>
          <button type="button" style={{ ...mkBtn("ghost", theme), padding: "8px 11px" }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 18px" }}>
            {[
              { label: "Full Name",     field: "name",            type: "text",     placeholder: "Aman Kumar",               required: true  },
              { label: "Username",      field: "username",        type: "text",     placeholder: "aman.kumar",               required: true  },
              { label: "Email",         field: "email",           type: "email",    placeholder: "aman@sangihospital.com",   required: true  },
              { label: "Phone",         field: "phone",           type: "text",     placeholder: "+91 98765 43210",          required: false },
              { label: "Password",      field: "password",        type: "password", placeholder: "Create a password",        required: true  },
              { label: "Confirm Password", field: "confirmPassword", type: "password", placeholder: "Repeat the password",   required: true  },
            ].map(({ label, field, type, placeholder, required }) => (
              <div key={field}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: T.textSub, marginBottom: "7px" }}>{label}</label>
                <input type={type} style={fi} value={empForm[field]} onChange={e => updateEmpField(field, e.target.value)} placeholder={placeholder} required={required} />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: T.textSub, marginBottom: "7px" }}>Employee ID</label>
              <input style={{ ...fi, fontFamily: UI_MONO_STACK }} value={empForm.employeeId} onChange={e => updateEmpField("employeeId", e.target.value)} placeholder="Auto-generated" readOnly />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: T.textSub, marginBottom: "7px" }}>Role</label>
              <div style={{ ...fi, display: "flex", alignItems: "center", gap: "8px", cursor: "default", userSelect: "none" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: theme.primary, flexShrink: 0 }} />
                <span style={{ color: T.text, fontWeight: "600" }}>Receptionist</span>
              </div>
            </div>
          </div>
          {empError && <div style={{ color: T.danger, fontSize: "12px", marginTop: "12px" }}>{empError}</div>}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px", paddingTop: "18px", borderTop: `1px solid ${T.border}` }}>
            <button type="button" style={mkBtn("ghost", theme)} onClick={onClose}>Cancel</button>
            <button type="submit" style={mkBtn("primary", theme)}>Create Employee</button>
          </div>
        </form>
      </div>
    </div>
  );
}
