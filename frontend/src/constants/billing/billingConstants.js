export const INSURANCE_TYPES = [
  "Self Pay","TPA","ECHS","ECI","FCI","Ayushman Bharat","Northern Railways"
];

export const TPA_DOCS = [
  { key:"final_bill",        label:"Final Bill" },
  { key:"pharmacy_bill",     label:"Pharmacy Bill" },
  { key:"pathology_bill",    label:"Pathology Bill" },
  { key:"radiology_bill",    label:"Radiology Bill" },
  { key:"discharge_summary", label:"Discharge Summary" },
  { key:"reports",           label:"Reports" },
  { key:"admission_note",    label:"Admission Note" },
];

export const SECTION_KEYS = [
  "discharge","admission","reports","medicines","billing"
];

export const SECTION_LABELS = {
  discharge: "Discharge Summary",
  admission: "Admission Note",
  reports:   "Reports",
  medicines: "Medicine Bill",
  billing:   "Final Bill",
};

export const SECTION_ICONS = {
  discharge: "P",
  admission: "A",
  reports:   "R",
  medicines: "M",
  billing:   "B",
};

export const TAB_MAP = {
  discharge: "discharge",
  admission: "medical",
  reports:   "reports",
  medicines: "med_bill",
  billing:   "finalbill",
};