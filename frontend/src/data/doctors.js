const DOCTORS = [
  { name: "Dr. Priya Sharma", qualification: "MBBS, MD – General Medicine" },
  { name: "Dr. Rajesh Kumar", qualification: "MBBS, MS – General Surgery" },
  { name: "Dr. Anita Singh", qualification: "MBBS, DNB – Orthopaedics" },
  { name: "Dr. Suresh Verma", qualification: "MBBS, MD – Cardiology" },
  { name: "Dr. Meena Agarwal", qualification: "MBBS, MD – Gynaecology" },
  { name: "Dr. Deepak Rawat", qualification: "MBBS, DNB – Urology" },
  { name: "Dr. Kavita Joshi", qualification: "MBBS, MD – Paediatrics" },
  { name: "Dr. Amit Bhatnagar", qualification: "MBBS, MS – ENT" },
  { name: "Dr. Ritu Kapoor", qualification: "MBBS, MD – Dermatology" },
  { name: "Dr. Sanjay Yadav", qualification: "MBBS, MD – Neurology" },
  { name: "Dr. Neha Gupta", qualification: "MBBS, MD – Pulmonology" },
  { name: "Dr. Vikas Sharma", qualification: "MBBS, MS – Ophthalmology" },
];

const GENERIC_QUALIFICATIONS = [
  "MBBS",
  "MBBS, MD",
  "MBBS, MS",
  "MBBS, DNB",
  "MBBS, DM",
  "MBBS, MCh",
  "BDS, MDS",
  "BAMS",
  "BHMS",
];

export const DOCTOR_LIST = DOCTORS.map(
  ({ name, qualification }) => `${name} (${qualification})`
);

export const QUALIFICATION_LIST = Array.from(
  new Set([
    ...GENERIC_QUALIFICATIONS,
    ...DOCTORS.map(({ qualification }) => qualification),
  ])
);

export function getDoctorQualification(doctorValue = "") {
  const trimmed = String(doctorValue || "").trim();
  if (!trimmed) return "";

  const exactDoctor = DOCTORS.find(
    ({ name, qualification }) =>
      trimmed === `${name} (${qualification})` || trimmed === name
  );
  if (exactDoctor) return exactDoctor.qualification;

  const parenMatch = trimmed.match(/\(([^()]+)\)\s*$/);
  return parenMatch ? parenMatch[1].trim() : "";
}
