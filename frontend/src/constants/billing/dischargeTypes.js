export const normalizeDischType = (u = "") => {
  u = String(u).toUpperCase().trim();
  if (u.startsWith("REFER") || u === "REFERRED") return "REFER";
  if (u.startsWith("LAMA")) return "LAMA";
  if (u === "DEATH" || u === "EXPIRED") return "DEATH";
  if (u === "DOPR" || u === "DAMA" || u === "DOR") return "DOPR";
  if (u === "RECOVERED") return "RECOVERED";
  return "NORMAL";
};

export const DISCHARGE_TYPES = {
  NORMAL:    { key:"NORMAL",    label:"Normal Discharge", color:"#059669", bg:"#d1fae5", border:"#6ee7b7", icon:"✅" },
  RECOVERED: { key:"RECOVERED", label:"Recovered",        color:"#2563eb", bg:"#dbeafe", border:"#93c5fd", icon:"💚" },
  LAMA:      { key:"LAMA",      label:"LAMA",             color:"#d97706", bg:"#fef3c7", border:"#fcd34d", icon:"⚠️" },
  DISCHARGE: { key:"DISCHARGE", label:"Discharge",        color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd", icon:"🏥" },
  REFER:     { key:"REFER",     label:"Refer",            color:"#2563eb", bg:"#dbeafe", border:"#93c5fd", icon:"🏥" },
  DEATH:     { key:"DEATH",     label:"Death",            color:"#dc2626", bg:"#fee2e2", border:"#fca5a5", icon:"💀" },
  DOPR:      { key:"DOPR",      label:"DAMA / DOPR",      color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd", icon:"🚨" },
};

export const DISCHARGE_SECTIONS = {
  NORMAL: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"historyOfIllness",     label:"History of Present Illness",    rows:3 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"investigations",       label:"Investigations",                rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:4 },
    { key:"adviceOnDischarge",    label:"Advice on Discharge",           rows:3 },
    { key:"followUp",             label:"Follow Up",                     rows:2 },
  ],
  RECOVERED: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"historyOfIllness",     label:"History of Present Illness",    rows:3 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"investigations",       label:"Investigations",                rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:4 },
    { key:"conditionAtDischarge", label:"Condition at Discharge",        rows:2 },
    { key:"adviceOnDischarge",    label:"Advice on Discharge",           rows:3 },
    { key:"followUp",             label:"Follow Up",                     rows:2 },
  ],
  LAMA: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Provisional Diagnosis",         rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given During Stay",   rows:3 },
    { key:"reasonForLama",        label:"Reason for LAMA",               rows:2 },
    { key:"adviceOnDischarge",    label:"Advice Given Before Leaving",   rows:2 },
    { key:"lamaDeclaration",      label:"Declaration / Remarks",         rows:2 },
  ],
  DISCHARGE: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"historyOfIllness",     label:"History of Present Illness",    rows:3 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"investigations",       label:"Investigations",                rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:4 },
    { key:"conditionAtDischarge", label:"Condition at Discharge",        rows:2 },
    { key:"adviceOnDischarge",    label:"Advice on Discharge",           rows:3 },
    { key:"followUp",             label:"Follow Up",                     rows:2 },
    { key:"notes",                label:"Additional Notes",              rows:2 },
  ],
  REFER: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:3 },
    { key:"referredTo",           label:"Referred To",                   rows:1 },
    { key:"reasonForDopr",        label:"Reason for Referral",           rows:2 },
    { key:"adviceOnDischarge",    label:"Advice Given",                  rows:2 },
  ],
  DEATH: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Diagnosis",                     rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:3 },
    { key:"adviceOnDischarge",    label:"Remarks / Declaration",         rows:3 },
  ],
  DOPR: [
    { key:"chiefComplaints",      label:"Chief Complaints",              rows:3 },
    { key:"diagnosis",            label:"Diagnosis / Provisional",       rows:2 },
    { key:"onExamination",        label:"On Examination",                rows:2, type:"vitals_grid" },
    { key:"treatmentGiven",       label:"Treatment Given",               rows:3 },
    { key:"reasonForDopr",        label:"Reason for DAMA / DOPR",        rows:2 },
    { key:"referredTo",           label:"Referred To (if any)",          rows:1 },
    { key:"adviceOnDischarge",    label:"Advice Given",                  rows:2 },
  ],
};

export function buildDischargeSections(dischargeType, eDis) {
  const secs = DISCHARGE_SECTIONS[dischargeType] || DISCHARGE_SECTIONS.NORMAL;
  return secs.map(sec => ({
    label: sec.label,
    type:  sec.type || "text",
    value: sec.type === "vitals_grid"
      ? { bp:eDis.bp||"", pulse:eDis.pr||"", spo2:eDis.spo2||"", temp:eDis.temp||"", chest:eDis.chest||"", cvs:eDis.cvs||"", cns:eDis.cns||"", abd:eDis.pa||"" }
      : (eDis[sec.key] || ""),
  }));
}