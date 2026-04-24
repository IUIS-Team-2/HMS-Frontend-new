import * as XLSX from "xlsx";
import { useState, useEffect } from "react";
import { T, LOCATIONS } from "../data/constants";
import { fmtDT, fmtDate } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { statusBadge } from "../components/ui/SharedUI";
import { apiService } from '../services/apiService';
import { downloadAdmissionNote } from './MedicalHistoryPage';

export default function PatientsHistoryPage({ db, locId, onBack, onDischarge, onGenerateBill, onSetExpectedDod, onViewPatient, onSaveMedHistory, onViewMedical }) {
  const loc = LOCATIONS.find(l => l.id === locId);
  const LAB_TEMPLATES = {
    "Complete Blood Count (CBC)": {
      tests: [
        { name: "HAEMOGLOBIN", unit: "gm/dl", refRange: "12–16" },
        { name: "TLC (Total Leucocyte Count)", unit: "/cumm", refRange: "4000–11000" },
        { name: "POLYMORPHS", unit: "%", refRange: "40-75" },
        { name: "LYMPHOCYTE", unit: "%", refRange: "20-40" },
        { name: "EOSINOPHIL", unit: "%", refRange: "01-06" },
        { name: "MONOCYTE", unit: "%", refRange: "00-08" },
        { name: "BASOPHIL", unit: "%", refRange: "00-00" },
        { name: "PCV", unit: "%", refRange: "34-45" },
        { name: "M C V (Mean Corp Volume)", unit: "Fl/dl", refRange: "76-96" },
        { name: "M C H (Mean Corp Hb)", unit: "Pg/dl", refRange: "27-32" },
        { name: "M C H C (Mean Corp Hb Conc)", unit: "gm/dl", refRange: "31-38" },
        { name: "R B C (Red Blood Cell Count)", unit: "mill/cumm", refRange: "3.5-5.5" },
        { name: "PLATELET COUNT", unit: "Lacs/cumm", refRange: "1.5-4.5" },
        { name: "ESR (Wintrobe)", unit: "mm", refRange: "M(0-10), F(0-20)" },
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Kidney Function Test (KFT)": {
      tests: [
        { name: "BLOOD UREA", unit: "mg/dl", refRange: "13-45" },
        { name: "SERUM CREATININE", unit: "mg/dl", refRange: "0.7-1.4" },
        { name: "S.URIC ACID", unit: "mg/dl", refRange: "3.2-7.2" },
        { name: "SODIUM", unit: "mmol/L", refRange: "135-145" },
        { name: "POTASSIUM", unit: "mmol/L", refRange: "3.6-5.0" },
        { name: "CALCIUM", unit: "mg/dl", refRange: "8.2-10.5" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Liver Function Test (LFT)": {
      tests: [
        { name: "SERUM BILIRUBIN (TOTAL)", unit: "mg/dl", refRange: "0.2-1.3" },
        { name: "CONJUGATED (D BILIRUBIN)", unit: "mg/dl", refRange: "0.0-0.3" },
        { name: "UNCONJUGATED (I.D BILIRUBIN)", unit: "mg/dl", refRange: "0.2-1.1" },
        { name: "SGOT/AST", unit: "U/L", refRange: "00-55" },
        { name: "SGPT/ALT", unit: "U/L", refRange: "00-40" },
        { name: "TOTAL PROTEIN", unit: "gm/dl", refRange: "6.3-8.2" },
        { name: "ALBUMIN", unit: "gm/dl", refRange: "3.5-5.0" },
        { name: "GLOBULINE", unit: "gm/dl", refRange: "2.5-5.6" },
        { name: "ALKALINE PHOSPHATASE", unit: "IU/L", refRange: "20-130" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Lipid Profile": {
      tests: [
        { name: "CHOLESTEROL TOTAL", unit: "mg/dl", refRange: "125-200" },
        { name: "TRIGLYCERIDE", unit: "mg/dl", refRange: "25-200" },
        { name: "CHOLESTEROL HDL", unit: "mg/dl", refRange: "35-80" },
        { name: "CHOLESTEROL VLDL", unit: "mg/dl", refRange: "5-40" },
        { name: "CHOLESTEROL LDL", unit: "mg/dl", refRange: "85-130" },
        { name: "LDL. / HDL RATIO", unit: "mg/dl", refRange: "1.5-3.5" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Blood Gas Analysis": {
      tests: [
        { name: "pH", unit: "", refRange: "7.35-7.45" },
        { name: "pCO2", unit: "mmHg", refRange: "35-40" },
        { name: "pO2", unit: "mmHg", refRange: "80-95" },
        { name: "TCO2", unit: "mmol/L", refRange: "23-27" },
        { name: "HCO3", unit: "mmol/L", refRange: "22-26" },
        { name: "BE", unit: "mmol/L", refRange: "-2 to +2" },
        { name: "%SO2C", unit: "%", refRange: "96-97" },
        { name: "Na+", unit: "mmol/L", refRange: "134-146" },
        { name: "K+", unit: "mmol/L", refRange: "3.4-5.0" },
        { name: "Cl", unit: "mmol/L", refRange: "1.15-1.33" },
        { name: "GLU", unit: "mmol/L", refRange: "74-100" },
        { name: "THbc", unit: "%", refRange: "12-16" },
        { name: "HCT", unit: "mmol/L", refRange: "38-51" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "CRP (Qualitative)": {
      tests: [ { name: "CRP (Qualitative)", unit: "", refRange: "NON-REACTIVE" } ],
      defaultRemarks: "***End Of The Report***"
    },
    "Blood Glucose (Random)": {
      tests: [ { name: "BLOOD GLUCOSE RANDOM", unit: "mg/dl", refRange: "100-150" } ],
      defaultRemarks: "***End Of The Report***"
    },
    "Blood Glucose (Fasting)": {
      tests: [ { name: "BLOOD GLUCOSE FASTING", unit: "mg/dl", refRange: "70-110" } ],
      defaultRemarks: "***End Of The Report***"
    },
    "Widal Test (Slide Method)": {
      tests: [
        { name: "Antigen TO (1:20 to 1:320)", unit: "", refRange: "Negative" },
        { name: "Antigen TH (1:20 to 1:320)", unit: "", refRange: "Negative" },
        { name: "Antigen AH (1:20 to 1:320)", unit: "", refRange: "Negative" },
        { name: "Antigen BH (1:20 to 1:320)", unit: "", refRange: "Negative" },
        { name: "RESULT", unit: "", refRange: "POSITIVE / NEGATIVE" }
      ],
      defaultRemarks: "INTERPRETATION: Antibody titer of 1:80 or higher suggests infection. A marked rise in the titer of one serotype to above 1:80 or paired samples collected at 5 to 7 days interval is regarded as diagnostically significant. However persons who have received TAB vaccine may show high titer of antibodies to each of the salmonella."
    },
    "Malaria Antigen Test": {
      tests: [
        { name: "PLASMODIUM P. VIVAX", unit: "", refRange: "NEGATIVE" },
        { name: "PLASMODIUM FALCIPARUM", unit: "", refRange: "NEGATIVE" }
      ],
      defaultRemarks: "PRINCIPLE OF TEST: The test uses two antibodies. One antibody is specific for histidine-rich protein2 species P.falciparum (Pf HRP2). The other antibody is specific for a malaria antigen which is common to all the four species P.falciparum, P.vivax, P.ovale, P.malariae.\nLIMITATION: The test indicates the presence or absence of P.vivax in blood specimen. Diagnosis is made by this result with other finding. The test is not to be used in lieu of conventional smear diagnosis."
    },
    "Typhi Dot (IgG & IgM)": {
      tests: [
        { name: "THYPIDOT TEST FOR S.TYPHI IgM", unit: "", refRange: "POSITIVE / NEGATIVE" },
        { name: "THYPIDOT TEST FOR S.TYPHI IgG", unit: "", refRange: "POSITIVE / NEGATIVE" }
      ],
      defaultRemarks: "COMMENTS: The typhidot test is based on dot enzyme immunosorbant assay for the early detection of IgM antibodies to salmonella typhi. This test has the sensitivity of approximately 95% and does not any cross reaction. Limitation of this test is that high IgG concentration may give false negative for IgM because IgG will drastically reduce binding of specific IgM to the antigen, so clinical correlation is a must."
    },
    "Dengue (IgM & IgG)": {
      tests: [
        { name: "DENGUE IgM ANTIBODIES", unit: "", refRange: "NON-REACTIVE" },
        { name: "DENGUE IgG ANTIBODIES", unit: "", refRange: "NON-REACTIVE" }
      ],
      defaultRemarks: "REMARKS: Dengue viruses are mosquito-born viruses. Infected may lead to Dengue fever or dengue haemorrhagic fever and dengue shock syndrome. In the extreme cases, IgM antibodies appear around the 5th day of Dengue infection, rise for 1-3 weeks and last for 60-90days. IgG antibodies appear by the 14th day in primary infections and on the 2nd day in secondary infections and can usually be detected for life. Both Dengue fever IgM & IgG are useful in the early detection of primary and secondary Dengue infection."
    },
    "Dengue NS1 Antigen Test": {
      tests: [ { name: "DENGUE NS1 ANTIGEN", unit: "", refRange: "NON-REACTIVE" } ],
      defaultRemarks: "REMARKS: NS1 antigen is an non-structural protein recognized as a mark of acute phase of dengue infection, a period for which traditional serological antibodies based methods are of limited value. NS1 antigen was found circulating in sample of infected patient from the first day up to 9 days after onset fever. Dengue NS1 Ag Strip is an individual test for qualitative of Dengue virus NS1 antigen in human serum or plasma as an in the diagnosis of actual dengue infection."
    },
    "Viral Markers (HIV, HBsAg, HCV)": {
      tests: [
        { name: "HIV I & II", unit: "", refRange: "NEGATIVE" },
        { name: "HEPATITIS B (HbsAg)", unit: "", refRange: "NEGATIVE" },
        { name: "HCV", unit: "", refRange: "NEGATIVE" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "COVID-19 Rapid Antigen": {
      tests: [ { name: "COVID-19(Ag)", unit: "", refRange: "NON-REACTIVE" } ],
      defaultRemarks: "***End Of The Report***"
    },
    "Urine Examination (Routine)": {
      tests: [
        { name: "COLOUR", unit: "", refRange: "Pale Yellow" },
        { name: "VOLUME", unit: "ml", refRange: "" },
        { name: "SPECIFIC GRAVITY", unit: "", refRange: "1.005-1.030" },
        { name: "REACTION", unit: "", refRange: "ACIDIC" },
        { name: "ALBUMIN", unit: "", refRange: "NIL" },
        { name: "SUGAR", unit: "", refRange: "NIL" },
        { name: "PH", unit: "", refRange: "4.5-8.0" },
        { name: "PUS CELLS", unit: "/HPF", refRange: "0-5" },
        { name: "EPITHELIAL CELLS", unit: "/HPF", refRange: "0-5" },
        { name: "RBC'S", unit: "/HPF", refRange: "NIL" },
        { name: "CASTS", unit: "", refRange: "NIL" },
        { name: "CRYSTALS", unit: "", refRange: "NIL" },
        { name: "BACTERIA", unit: "", refRange: "NIL" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Urine Gram Stain": {
      tests: [ { name: "RESULT", unit: "", refRange: "" } ],
      defaultRemarks: "NATURE OF SAMPLE: URINE\nRESULT: GRAM NEGATIVE BACILLI SEEN. NO BUDDING YEAST CELLS SEEN."
    },
    "Aerobic Culture & Sensitivity": {
      tests: [
        { name: "SPECIMEN SOURCE", unit: "", refRange: "e.g. URINE C/S" },
        { name: "DATE RECEIVED", unit: "", refRange: "" },
        { name: "DATE REPORTED", unit: "", refRange: "" },
        { name: "CULTURE RESULT", unit: "", refRange: "e.g. E. COLI" },
        { name: "AMIKACIN", unit: "", refRange: "SENSITIVE/RESISTANT" },
        { name: "AMOXICILLIN+ CLAVULANATE", unit: "", refRange: "SENSITIVE/RESISTANT" },
        { name: "AMPICILLIN", unit: "", refRange: "SENSITIVE/RESISTANT" },
        { name: "CEFOTAXIME", unit: "", refRange: "SENSITIVE/RESISTANT" },
        { name: "CEFTRIAXONE", unit: "", refRange: "SENSITIVE/RESISTANT" },
        { name: "CIPROFLOXACIN", unit: "", refRange: "SENSITIVE/RESISTANT" },
        { name: "MEROPENEM", unit: "", refRange: "SENSITIVE/RESISTANT" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Serum Procalcitonin": {
      tests: [ { name: "SERUM PROCALCITONIN", unit: "pg/ml", refRange: "0.0 – 500" } ],
      defaultRemarks: "METHOD : ELFA. Pro calcitonin, the pro hormone of calcitonin is below limit of detection (0.05 ng/ml) in healthy individuals. It rises in response to an inflammatory stimulus especially of bacterial origin. It does not rise significantly with viral or non infectious inflammations.\nPROCALCITONIN LEVEL INFERENCE:-\n< 500.0: Minor local bacterial infection is possible.\n500 - 2000: Systemic infection is Possible. Suggest repeat after 6-24 hours.\n2000 - <10000: Systemic infection (sepsis) is likely.\n>10000: important systemic inflammatory response, almost exclusively due to severe bacterial sepsis or septic shock."
    },
    "Sputum for AFB": {
      tests: [ { name: "RESULT", unit: "", refRange: "" } ],
      defaultRemarks: "RESULT: NO ACID FAST BACILLI SEEN."
    },
    "Sputum Gram Stain": {
      tests: [ { name: "RESULT", unit: "", refRange: "" } ],
      defaultRemarks: "RESULT: NO PATHOGENIC BACTERIA SEEN. NO BUDDING YEAST CELLS SEEN."
    },
    "Cardiac Markers (Trop-T, Trop-I, CPK)": {
      tests: [
        { name: "TROPONIN-T", unit: "", refRange: "NEGATIVE" },
        { name: "TROPONIN-I", unit: "", refRange: "NEGATIVE" },
        { name: "CPK-MB", unit: "IU/L", refRange: "upto 24" },
        { name: "CPK", unit: "U/L", refRange: "22-198" },
        { name: "NT-proBNP", unit: "pg/ml", refRange: "10-157" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Total Thyroid Profile": {
      tests: [
        { name: "T3", unit: "pmol/l", refRange: "0.9-2.5" },
        { name: "Free Thyroxine (FT4)", unit: "pmol/l", refRange: "60-135" },
        { name: "Thyroid Stimulation Hormone (TSH)", unit: "pmol/l", refRange: "0.25-5.0" }
      ],
      defaultRemarks: "Method: Enzyme linked fluorescent assay."
    },
    "Vitamin B-12 (Cyanocobalamin)": {
      tests: [ { name: "VITAMIN B- 12", unit: "pg/ml", refRange: "211 – 911" } ],
      defaultRemarks: "Note: To differentiate vitamin B12 & folate deficiency, measurement of Methyl malonic acid & Homocysteine levels in serum is suggested. The diagnosis of B12 deficiency cannot be solely based on serum B12 levels. Vitamin B12 performs many important functions in the body, but the most significant function is to act as co-enzyme for reducing ribonucleotides to deoxyribonucleotides. Cobalamine deficiency leads to Megaloblastic anemia and demyelination of large nerve fibers of spine cord."
    },
    "25 OH Vitamin D3": {
      tests: [ { name: "25 OH VITAMIN D3", unit: "ng/ml", refRange: "30 – 100" } ],
      defaultRemarks: "Note: Vitamin D is a group of fat – soluble secosteroids responsible for enhancing intestinal absorption of calcium and phosphate. In human, the most important compound in this group are vitamin D3 (also known as cholecalciferol) and vitamin D2 (ergocalciferol). The body can also synthesize vitamin D in skin from cholesterol, when sun exposure is adequate."
    },
    "Stool Examination": {
      tests: [
        { name: "COLOUR", unit: "", refRange: "BROWNISH" },
        { name: "CONSISTANCY", unit: "", refRange: "SOFT" },
        { name: "MUCOUS", unit: "", refRange: "NIL" },
        { name: "PH", unit: "", refRange: "7.0 - 7.8" },
        { name: "REACTION", unit: "", refRange: "ACIDIC/ALKALINE" },
        { name: "PUS CELLS", unit: "/HPF", refRange: "0-1" },
        { name: "RED BLOOD CELLS", unit: "/HPF", refRange: "NIL" },
        { name: "OVA", unit: "", refRange: "NIL" },
        { name: "CYST", unit: "", refRange: "NIL" },
        { name: "BACTERIA", unit: "", refRange: "NIL" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Blood Group & Rh Factor": {
      tests: [
        { name: "Blood Group", unit: "", refRange: "" },
        { name: "Rh Factor", unit: "", refRange: "" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "HbA1c (Glycosylated Hemoglobin)": {
      tests: [
        { name: "HBA1C", unit: "%", refRange: "4.30-6.40" },
        { name: "MEAN PLASMA GLUCOSE", unit: "mg/dl", refRange: "70-140" }
      ],
      defaultRemarks: "METHOD : HIGH PERFORMANCE LIQUID CHROMATOGRAPHY (HPLC)\nInterpretation(s): GOOD CONTROL (6.4-7.0), FAIR CONTROL (7.0-8.0), ACTION SUGGESTED (>8.0)\nREMARKS : In vitro quantitative determination of HbA1C in whole blood is Utilized in Long term monitoring of glycaemia. It is recommended that the determination of HbA1C be performed at intervals 10-12 weeks during diabetes mellitus therapy."
    },
    "Urine Ketone": {
      tests: [ { name: "URINE KETONE", unit: "", refRange: "NEGATIVE" } ],
      defaultRemarks: "***End Of The Report***"
    },
    "D-Dimer": {
      tests: [ { name: "D-DIMER", unit: "µgFEU/mL", refRange: "<0.5" } ],
      defaultRemarks: "Physiological basis: D-dimer is one of the terminal fibrin degradation products. The presence of D-dimers indicates that a fibrin clot was formed and subsequently degraded by plasmin.\nInterpretation: Increased in: Deep vein thrombosis (DVT), venous thrombo-embolism (VTE), pulmonary embolism (PE), disseminated intravascular coagulation (DIC), pregnancy, malignancy, surgery.\nComments: D-dimer assay is a very sensitive test for DIC, DVT and VTE or PE."
    },
    "Serum Amylase & Lipase": {
      tests: [
        { name: "S. AMYLASE", unit: "U/L", refRange: "30.0 – 220.0" },
        { name: "S. LIPASE", unit: "U/L", refRange: "Upto 190.0" }
      ],
      defaultRemarks: "***End Of The Report***"
    },
    "Homocysteine (Quantitative)": {
      tests: [ { name: "Homocysteine", unit: "umol/L", refRange: "5.45 – 16.20" } ],
      defaultRemarks: "Comments: Homocysteine is a sulphur containing amino acid. There is an association between elevated levels of circulating homocysteine and various vascular and cardiovascular disorders. Clinically the measurement of homocysteine is considered important to diagnose homocystinuria. CVD patients with homocysteine levels > 15 umol/L belong to a high risk group."
    },
    "PSA (Prostate Specific Antigen)": {
      tests: [ { name: "TOTAL, SERUM ( CMIA)", unit: "ng/mL", refRange: "< 4.00" } ],
      defaultRemarks: "Note: False low/high results may be observed in patients receiving mouse monoclonal antibodies for diagnosis/therapy. Immediate PSA testing following digital rectal examination, ejaculation, prostatic massage, indwelling catheterization, and needle biopsy of prostate is not recommended as they falsely elevate levels. PSA values regardless of levels should not be interpreted as absolute evidence of the presence or absence of disease."
    },
    "Prothrombin Time (PT)": {
      tests: [
        { name: "Patient Time (PT)", unit: "Sec", refRange: "10.0 – 14.0" },
        { name: "Control Time (PT)", unit: "Sec", refRange: "" },
        { name: "International Normalized Ratio (INR)", unit: "", refRange: "0.8 - 1.2" }
      ],
      defaultRemarks: "Method: Viscosity Based Detection Assay"
    },
    "Activated Partial Thromboplastin Time (APTT)": {
      tests: [
        { name: "Patient Time (APTT)", unit: "Sec", refRange: "26.0 – 40.0" },
        { name: "Control Time (APTT)", unit: "Sec", refRange: "" },
        { name: "Ratio (APTT)", unit: "", refRange: "" }
      ],
      defaultRemarks: "Method: Viscosity Based Enhanced Coagulation"
    },
    "Adenosine Deaminase (ADA)": {
      tests: [ { name: "ADENOSINE DEAMINASE (ADA)", unit: "U/L", refRange: "Normal <30 U/L" } ],
      defaultRemarks: "Note :- Adenosine Deaminase (ADA) is an enzyme widely distributed in mammalian tissues, particularly in T lymphocytes. Increased levels of ADA are found in various forms of Tuberculosis, making it a marker for the same. ADA is also increased in various infections like infectious mononucleosis, Typhoid, Viral Hepatitis, initial stages of HIV, and in-cases of malignant tumours."
    },
    "Body Fluid For Cytology": {
      tests: [
        { name: "SPECIMEN", unit: "", refRange: "e.g. Ascitic fluid" },
        { name: "CLINICAL NOTE", unit: "", refRange: "" },
        { name: "MICROSCOPIC EXAMINATION", unit: "", refRange: "No granuloma or malignant cells seen." },
        { name: "IMPRESSION", unit: "", refRange: "Negative for malignant cells." },
        { name: "ADVICE", unit: "", refRange: "Clinicoradiological correlation" }
      ],
      defaultRemarks: "Disclaimer: The test result mentioned here should be interpreted in view of clinical condition of the patient."
    },
    "Body Fluid Routine Analysis": {
      tests: [
        { name: "Sample Type", unit: "", refRange: "e.g. ASCITIC FLUID" },
        { name: "Volume", unit: "mL", refRange: ">1.5 mL" },
        { name: "Colour", unit: "", refRange: "Light Yellow" },
        { name: "Appearance", unit: "", refRange: "Slightly Turbid" },
        { name: "Coagulum", unit: "", refRange: "Present/Absent" },
        { name: "Blood", unit: "", refRange: "Negative" },
        { name: "Glucose", unit: "mg/dL", refRange: "" },
        { name: "Total Protein", unit: "gm/dL", refRange: "" },
        { name: "TLC, Body Fluid", unit: "/cumm", refRange: "" },
        { name: "Neutrophil", unit: "%", refRange: "" },
        { name: "Lymphocyte", unit: "%", refRange: "" }
      ],
      defaultRemarks: "Disclaimer: The test result mentioned here should be interpreted in view of clinical condition of the patient."
    },
    "SAAG (Serum Ascites Albumin Gradient)": {
      tests: [
        { name: "Albumin, Serum", unit: "gm/dL", refRange: "3.50 – 5.50" },
        { name: "Albumin, Fluid", unit: "gm/dL", refRange: "" },
        { name: "SAAG", unit: "", refRange: "" }
      ],
      defaultRemarks: "Method: BCG. Disclaimer: The test result mentioned here should be interpreted in view of clinical condition of the patient."
    },
    "Iron Profile": {
      tests: [
        { name: "Iron, Serum", unit: "µg/dL", refRange: "49 – 181" },
        { name: "TIBC", unit: "µg/dL", refRange: "261 – 462" },
        { name: "Unsaturated Iron Binding Capacity", unit: "µg/dL", refRange: "110.0 – 370.0" },
        { name: "Transferrin Saturation", unit: "%", refRange: "14 – 50" }
      ],
      defaultRemarks: "COMMENT: Serum iron measures the amount of circulating iron that is bound to transferrin. Total iron-binding capacity measures the extent to which iron-binding sites in the serum can be saturated. Taken together clinicians usually perform this test when they are concerned about anemia, iron deficiency or iron deficiency anemia."
    },
    "Blood Picture (Peripheral Smear)": {
      tests: [ { name: "Impression", unit: "", refRange: "" } ],
      defaultRemarks: "Red cells are reduced, cells are microcytic hypochromic with anisocytosis. Total leucocyte count is increased with increased neutrophils. Platelets are adequate in number. No haemoparasites seen. \nAdvice: Iron Profile."
    },
    "Anti-TPO (Thyroid Peroxidase Antibody)": {
      tests: [ { name: "Anti-TPO", unit: "", refRange: "<0.9 not detected, 0.9-1.1 borderline" } ],
      defaultRemarks: "INTERPRETATION: Thyroperoxidase (TPO) is an enzyme involved in thyroid hormone synthesis. Disorders of the thyroid gland are frequently caused by autoimmune mechanisms with the production of autoantibodies. Anti-TPO antibodies activate complement and are thought to be significantly involved in thyroid dysfunction and the pathogenesis of hypothyroidism. Chronic Hashimoto's thyroiditis is the most frequent cause of hypothyroidism."
    },
    "Bleeding Time (BT) & Clotting Time (CT)": {
      tests: [
        { name: "B T (Bleeding Time)", unit: "Min/Sec", refRange: "02 – 07" },
        { name: "C T (Clotting Time)", unit: "Min/Sec", refRange: "04 – 09" }
      ],
      defaultRemarks: "***End Of The Report***"
    }
  };

  const handleLabTypeChange = (e) => {
    const type = e.target.value;
    const template = LAB_TEMPLATES[type] || { tests: [], defaultRemarks: "" };
    setLabData({ 
      ...labData, 
      reportType: type, 
      tests: template.tests.map(t => ({ name: t.name, result: "", unit: t.unit, refRange: t.refRange })),
      remarks: template.defaultRemarks || ""
    });
  };
  const [labModal, setLabModal] = useState(null);
  const [labData, setLabData] = useState({ reportType: "", date: new Date().toISOString().slice(0, 10), remarks: "", tests: [] });
  const [filterDate, setFilterDate] = useState(""); const [filterMonth, setFilterMonth] = useState(""); const [filterYear, setFilterYear] = useState("");
  const [expDodModal, setExpDodModal] = useState(null);
  const [medHistModal, setMedHistModal] = useState(null);
  const [fillMedModal, setFillMedModal] = useState(null);
  const [fillMedData, setFillMedData] = useState({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });

  const allRows = db.flatMap(p => p.admissions?.map(adm => ({ patientName: p.patientName, uhid: p.uhid, admNo: adm.admNo, doa: adm.discharge?.doa || adm.dateTime || "", dod: adm.discharge?.dod || "", status: adm.discharge?.dischargeStatus || "", billing: adm.billing || {}, patientObj: p, admObj: adm })) || []).sort((a, b) => new Date(b.doa) - new Date(a.doa));

  const years = [...new Set(allRows.map(r => r.doa ? new Date(r.doa).getFullYear() : "").filter(Boolean))].sort((a, b) => b - a);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filtered = allRows.filter(r => {
    if (!r.doa) return true;
    const d = new Date(r.doa);
    if (filterDate) { const fd = new Date(filterDate); if (d.toDateString() !== fd.toDateString()) return false; }
    if (filterMonth && String(d.getMonth()) !== filterMonth) return false;
    if (filterYear && String(d.getFullYear()) !== filterYear) return false;
    return true;
  });

  const totalAdm = filtered.length; const discharged = filtered.filter(r => r.dod && r.status).length; const pending = totalAdm - discharged; const billed = filtered.filter(r => r.billing && (r.billing.paidNow || r.billing.paymentMode)).length;
  const clearFilters = () => { setFilterDate(""); setFilterMonth(""); setFilterYear(""); };

  const downloadExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("IPD Records");
    const locName = loc?.name || "Hospital";

    // Title row
    ws.mergeCells("A1:P1");
    const title = ws.getCell("A1");
    title.value = `🏥  ${locName} — IPD RECORDS  |  ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;
    title.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14, name: "Arial" };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2B55" } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 32;

    // Header row
    const headers = ["SR.NO", "PATIENT NAME", "AGE/G", "IPD NO", "CARD NO", "ROOM", "DOA & TIME", "DOD & TIME", "STAY", "TYPE", "TYPE REF/EMERGENCY", "CONSULTANT NAME", "NUMBER", "ADDRESS", "DISCHARGE STATUS", "BILL STATUS"];
    const headerRow = ws.addRow(headers);
    headerRow.height = 36;
    const bs = (style = "thin") => ({ style, color: { argb: "FFBFCFDE" } });
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Arial" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3C6E" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { top: bs("medium"), bottom: bs("medium"), left: bs("medium"), right: bs("medium") };
    });

    // Data rows
    const ROW_COLORS = ["FFD6E4F7", "FFFFF8E7"];
    filtered.forEach((r, i) => {
      const bg = ROW_COLORS[i % 2];
      const row = ws.addRow([
        i + 1,
        r.patientName,
        (r.patientObj?.ageYY ? r.patientObj.ageYY + " Yrs" : "") + (r.patientObj?.gender ? " / " + r.patientObj.gender.charAt(0).toUpperCase() : ""),
        r.admObj?.ipdNo || "—",
        r.patientObj?.tpaCard || r.patientObj?.tpaPanelCardNo || "—",
        r.admObj?.discharge?.wardName || "—",
        r.doa ? fmtDT(r.doa) : "",
        r.dod ? fmtDT(r.dod) : "",
        r.doa && r.dod ? Math.ceil((new Date(r.dod) - new Date(r.doa)) / (1000 * 60 * 60 * 24)) + " Days" : "—",
        r.admObj?.admissionType || "IPD",
        r.admObj?.admissionType || "—",
        r.admObj?.discharge?.doctorName || "—",
        r.patientObj?.phone || "—",
        r.patientObj?.address || "—",
        r.status || "Pending",
        (r.billing && (r.billing.paidNow || r.billing.paymentMode)) ? "Generated" : "Pending",
      ]);
      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.border = { top: bs(), bottom: bs(), left: bs(), right: bs() };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.font = { size: 9, name: "Arial" };
        if (colNum === 15) {
          const ok = ["Recovered", "Discharged"].includes(cell.value);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ok ? "FFE6F4EA" : "FFFFF3CD" } };
          cell.font = { bold: true, color: { argb: ok ? "FF1E7E34" : "FF856404" }, size: 9, name: "Arial" };
        } else if (colNum === 16) {
          const ok = cell.value === "Generated";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ok ? "FFFFF3CD" : "FFFDE8E8" } };
          cell.font = { bold: true, color: { argb: ok ? "FF856404" : "FFC0392B" }, size: 9, name: "Arial" };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        }
        if (colNum === 2 || colNum === 14) cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      });
    });

    // Column widths & freeze
    [6, 18, 13, 14, 10, 14, 18, 18, 8, 6, 12, 18, 13, 22, 16, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    ws.views = [{ state: "frozen", ySplit: 2 }];

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${locName}_IPD_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
  };
  const hasFilter = filterDate || filterMonth || filterYear;

  return (
    <div className="hist-page">
      <div className="hist-page-hd"><div><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}><button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: "6px 14px", fontSize: 13 }}><Ico d={IC.dn} size={13} sw={2.5} style={{ transform: "rotate(90deg)" }} /> ← Back</button></div><h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: T.primary, marginBottom: 4 }}>Patients History</h1><p style={{ fontSize: 14, color: T.textMuted }}>{loc?.name} Branch · All admissions record</p></div><div style={{ marginLeft: "auto" }}><button onClick={downloadExcel} style={{ backgroundColor: T.primary, color: "#fff", padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>⬇ Download Excel</button></div></div>

      <div className="hist-filter-bar">
        <span className="hist-filter-label"><Ico d={IC.calendar} size={13} sw={2} /> Filter by</span><div className="hist-filter-sep" />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em" }}>Date</span><input type="date" className="hist-filter-ctrl" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 150 }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em" }}>Month</span><select className="hist-filter-ctrl" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 140 }}><option value="">All Months</option>{months.map((m, i) => <option key={i} value={String(i)}>{m}</option>)}</select></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em" }}>Year</span><select className="hist-filter-ctrl" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: 110 }}><option value="">All Years</option>{years.map(y => <option key={y} value={String(y)}>{y}</option>)}</select></div>
        {hasFilter && <button className="hist-clear-btn" onClick={clearFilters}>✕ Clear</button>}
        <span style={{ marginLeft: "auto", fontSize: 13, color: T.textMuted, fontWeight: 500 }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</span>
      </div>

      <div className="hist-summary-stats">{[{ l: "Total Admissions", v: totalAdm, c: T.primary }, { l: "Discharged", v: discharged, c: T.green }, { l: "Pending Discharge", v: pending, c: T.amber }, { l: "Bills Generated", v: billed, c: T.accentDeep }].map(s => (<div key={s.l} className="hist-stat"><span className="hist-stat-num" style={{ color: s.c }}>{s.v}</span><span className="hist-stat-lbl">{s.l}</span></div>))}</div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.textMuted, fontSize: 14, background: T.white, borderRadius: 16, border: `1px solid ${T.border}` }}>
          <Ico d={IC.search} size={32} sw={1.5} /><br /><br />
          No admissions found{hasFilter ? " for the selected filter." : "."}
          {hasFilter && <><br /><button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>Clear Filters</button></>}
        </div>
      ) : (
        <div className="hist-table-wrap"> 
          <table className="hist-table">
            <thead>
              <tr><th>#</th><th>Patient</th><th>Date of Admission</th><th>Expected Discharge</th><th>Medical History</th><th>Lab Reports</th><th>Discharge Status</th><th>Bill</th></tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isDischarge = r.dod && r.status;
                const hasBill = r.billing && r.billing.printStatus === 'APPROVED';
                const expDod = r.admObj.discharge?.expectedDod;

                // 🌟 FIX 1: Pass medHistory, dischargeStatus, and admNo to the main PatientDetailModal so it isn't blank
                return (<tr key={i} onClick={() => onViewPatient({ ...r.patientObj, admissions: [r.admObj], medHistory: r.admObj.medicalHistory, dischargeStatus: r.status, admNo: r.admNo })}>
                  <td style={{ color: T.textMuted, fontSize: 12, width: 40 }}>{i + 1}</td>
                  <td>
                    <div className="hist-pt-name">{r.patientName}</div>
                    <div className="hist-pt-uhid">{r.uhid} · Adm #{r.admNo}</div>
                  </td>
                  <td style={{ fontSize: 13, color: T.textMid, whiteSpace: "nowrap" }}>{fmtDT(r.doa)}</td>

                  {/* Expected Discharge Column */}
                  <td>
                    {expDod ? (
                      <div className="hist-dod-val" style={{ color: T.textMid }}><Ico d={IC.calendar} size={11} sw={2.5} /> {fmtDate(expDod)}</div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ padding: "5px 10px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setExpDodModal({ p: r.patientObj, a: r.admObj, date: '' }); }}>Set Date</button>
                    )}
                  </td>

                  {/* Medical History Column */}
                  <td onClick={e => e.stopPropagation()}>
                    {r.admObj.medicalHistory && (r.admObj.medicalHistory.previousDiagnosis || r.admObj.medicalHistory.currentMedications || r.admObj.medicalHistory.knownAllergies) ? (
                      <button
                        // 🌟 FIX 2: Trigger your local View Modal instead of the external page
                        onClick={e => {
                          e.stopPropagation();
                          setMedHistModal(r.admObj.medicalHistory); 
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", cursor: "pointer" }}
                      >
                        ✓ View History
                      </button>
                    ) : (
                      <button
                        // 🌟 FIX 3: Trigger your local Fill Modal instead of the external page
                        onClick={e => {
                          e.stopPropagation();
                          setFillMedModal({ patientObj: r.patientObj, admObj: r.admObj });
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", cursor: "pointer" }}
                      >
                        ⚠ Not Filled — Click to Fill
                      </button>
                    )}
                  </td>

                  {/* Lab Reports Column */}
                  <td onClick={e => e.stopPropagation()}>
                     <button
                        onClick={e => {
                          e.stopPropagation();
                          setLabModal({ patientObj: r.patientObj, admObj: r.admObj });
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: "#E0F2FE", color: "#0284C7", border: "1px solid #BAE6FD", cursor: "pointer" }}
                      >
                        🔬 Add Report
                      </button>
                  </td>

                  {/* Discharge Column */}
                  <td>
                    {isDischarge ? (
                      <div>
                        {statusBadge(r.status)}
                        <div className="hist-dod-val" style={{ marginTop: 4, fontSize: 11.5, color: T.textMid }}><Ico d={IC.check} size={10} sw={2.5} /> {fmtDT(r.dod)}</div>
                      </div>
                    ) : (
                      <button className="hist-discharge-btn" onClick={(e) => { e.stopPropagation(); onDischarge(r.patientObj, r.admObj); }}><Ico d={IC.bed} size={13} sw={2} /> Discharge</button>
                    )}
                  </td>

                  {/* Bill Column */}
                  <td>
                    {hasBill ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: T.greenTint, color: T.green, border: `1px solid ${T.greenBorder}` }}>
                        <Ico d={IC.check} size={10} sw={2.5} /> Generated
                      </span>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ borderColor: T.accentDeep, color: T.accentDeep, padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={(e) => { e.stopPropagation(); onGenerateBill(r.patientObj, r.admObj); }}>
                        <Ico d={IC.receipt} size={12} sw={2} /> Generate Bill
                      </button>
                    )}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fill Medical History Modal */}
      {fillMedModal && (
        <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) setFillMedModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 640 }}>
            <div className="pdm-hd" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="pdm-hd-name" style={{ fontSize: 17 }}>Fill Medical History</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{fillMedModal.patientObj.patientName} · {fillMedModal.patientObj.uhid}</div>
              </div>
              <button className="pdm-close" onClick={() => setFillMedModal(null)}><Ico d={IC.x} size={15} sw={2} /></button>
            </div>
            <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxHeight: "65vh", overflowY: "auto" }}>
              {[
                ["Previous Diagnosis", "previousDiagnosis", "e.g. Diabetes, Hypertension...", "textarea"],
                ["Past Surgeries", "pastSurgeries", "e.g. Appendectomy 2018...", "textarea"],
                ["Chronic Conditions", "chronicConditions", "e.g. Asthma, Heart disease...", "textarea"],
                ["Family History", "familyHistory", "e.g. Father - Diabetes...", "textarea"],
                ["Current Medications", "currentMedications", "e.g. Metformin 500mg...", "textarea"],
                ["Known Allergies", "knownAllergies", "e.g. Penicillin, Sulfa drugs...", "textarea"],
                ["Previous Treating Doctor", "treatingDoctor", "Dr. Name & Speciality", "input"],
                ["Smoking Status", "smokingStatus", "", "select-smoke"],
                ["Alcohol Use", "alcoholUse", "", "select-alcohol"],
                ["Additional Notes", "notes", "Any other relevant history...", "textarea"],
              ].map(([lbl, key, ph, type]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: "#4A7FA5", textTransform: "uppercase", letterSpacing: ".06em" }}>{lbl}</label>
                  {type === "textarea" ? (
                    <textarea rows={2} placeholder={ph} value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none", resize: "vertical" }} />
                  ) : type === "select-smoke" ? (
                    <select value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none", appearance: "none" }}>
                      <option value="">Select...</option>
                      <option>Non-smoker</option><option>Ex-smoker</option><option>Current smoker</option>
                    </select>
                  ) : type === "select-alcohol" ? (
                    <select value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none", appearance: "none" }}>
                      <option value="">Select...</option>
                      <option>None</option><option>Occasional</option><option>Regular</option>
                    </select>
                  ) : (
                    <input placeholder={ph} value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #BFDBEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-ghost" onClick={() => setFillMedModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                onSaveMedHistory(fillMedModal.patientObj.uhid, fillMedModal.admObj.admNo, fillMedData);
                setFillMedModal(null);
                setFillMedData({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
              }}>Save Medical History</button>
            </div>
          </div>
        </div>
      )}
      {/* Medical History View Modal */}
      {medHistModal && (
        <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) setMedHistModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 560 }}>
            <div className="pdm-hd" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="pdm-hd-name" style={{ fontSize: 17 }}>Medical History</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Past diagnoses, medications and allergies</div>
              </div>
              <button className="pdm-close" onClick={() => setMedHistModal(null)}><Ico d={IC.x} size={15} sw={2} /></button>
            </div>
            <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Previous Diagnosis", medHistModal.previousDiagnosis], ["Past Surgeries", medHistModal.pastSurgeries], ["Chronic Conditions", medHistModal.chronicConditions], ["Family History", medHistModal.familyHistory], ["Current Medications", medHistModal.currentMedications], ["Known Allergies", medHistModal.knownAllergies], ["Treating Doctor", medHistModal.treatingDoctor], ["Smoking Status", medHistModal.smokingStatus], ["Alcohol Use", medHistModal.alcoholUse], ["Notes", medHistModal.notes]].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#F0F9FF", border: "1px solid #BFDBEE", borderRadius: 10, padding: "11px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#88B4CC", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: val ? "#0B2040" : "#88B4CC" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #BFDBEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => downloadAdmissionNote(medHistModal, null, null, locId)} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #4A7FA5", background: "#F0F9FF", color: "#4A7FA5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🖨 Download Admission Note</button>
              <button className="btn btn-ghost" onClick={() => setMedHistModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Expected Discharge Modal Popup */}
      {expDodModal && (
        <div className="pdm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setExpDodModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 400 }}>
            <div className="pdm-hd" style={{ padding: "14px 20px" }}>
              <div className="pdm-hd-name" style={{ fontSize: 16 }}>Set Expected Discharge</div>
              <button className="pdm-close" style={{ width: 28, height: 28 }} onClick={() => setExpDodModal(null)}><Ico d={IC.x} size={14} sw={2} /></button>
            </div>
            <div className="pdm-body" style={{ padding: "20px" }}>
              <p style={{ marginBottom: 16, fontSize: 13.5, color: T.textMuted }}>
                Set the expected discharge date for <strong style={{ color: T.primary }}>{expDodModal.p.patientName}</strong> (Adm #{expDodModal.a.admNo}).
              </p>
              <div className="fld" style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7, display: "block" }}>Expected Date</label>
                <input type="date" className="ctrl" value={expDodModal.date} onChange={e => setExpDodModal({ ...expDodModal, date: e.target.value })} />
              </div>
              <div className="btn-row">
                <button className="btn btn-ghost" onClick={() => setExpDodModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { onSetExpectedDod(expDodModal.p.uhid, expDodModal.a.admNo, expDodModal.date); setExpDodModal(null); }}>Save Date</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ LAB REPORTS MODAL (Receptionist - Restricted) ══ */}
      {labModal && (
        <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) setLabModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 700 }}>
            <div className="pdm-hd" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="pdm-hd-name" style={{ fontSize: 17 }}>Add Investigation Report</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{labModal.patientObj.patientName} · Adm #{labModal.admObj.admNo}</div>
              </div>
              <button className="pdm-close" onClick={() => setLabModal(null)}><Ico d={IC.x} size={15} sw={2} /></button>
            </div>
            <div style={{ padding: "22px 24px", maxHeight: "65vh", overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#4A7FA5", textTransform: "uppercase" }}>Select Report Type</label>
                  <select value={labData.reportType} onChange={handleLabTypeChange} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #BFDBEE", outline: "none", marginTop: 6, fontSize: 13 }}>
                    <option value="">-- Choose Template --</option>
                    {Object.keys(LAB_TEMPLATES).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div style={{ width: 150 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#4A7FA5", textTransform: "uppercase" }}>Date</label>
                  <input type="date" value={labData.date} onChange={e => setLabData(p => ({...p, date: e.target.value}))} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid #BFDBEE", outline: "none", marginTop: 6, fontSize: 13 }} />
                </div>
              </div>

              {labData.tests.length > 0 && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                    <thead style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                      <tr>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Test Name (Locked)</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Result (Editable)</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Unit (Locked)</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Ref. Range (Locked)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labData.tests.map((test, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1E293B", background: "#F8FAFC" }}>{test.name}</td>
                          <td style={{ padding: "6px 10px" }}>
                            <input 
                              type="text" 
                              placeholder="Enter Result"
                              value={test.result} 
                              onChange={e => {
                                const newTests = [...labData.tests];
                                newTests[idx].result = e.target.value;
                                setLabData({...labData, tests: newTests});
                              }}
                              style={{ width: "100%", padding: "8px", border: "1px solid #CBD5E1", borderRadius: 6, outline: "none", fontWeight: 600, color: "#2563EB", background: "#EFF6FF" }}
                            />
                          </td>
                          <td style={{ padding: "10px 14px", color: "#64748b", background: "#F8FAFC" }}>{test.unit}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", background: "#F8FAFC", fontSize: 12 }}>{test.refRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#4A7FA5", textTransform: "uppercase" }}>Remarks / Notes (Editable)</label>
                <textarea rows={3} placeholder="Enter any additional doctor notes or summary here..." value={labData.remarks} onChange={e => setLabData(p => ({ ...p, remarks: e.target.value }))}
                  style={{ fontFamily: "inherit", fontSize: 13, color: "#0B2040", border: "1px solid #BFDBEE", borderRadius: 8, padding: "10px", width: "100%", outline: "none", resize: "vertical" }} />
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #BFDBEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-ghost" onClick={() => setLabModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                if(!labData.reportType) return alert("Select a report type!");
                try {
                  const cleanAdm = String(labModal.admObj.admNo).replace(/\D/g, "") || 1; // Strips text out
                  await apiService.saveLabReport(labModal.patientObj.uhid, cleanAdm, {
                    reportName: labData.reportType, reportType: "Pathology", date: labData.date, remarks: labData.remarks, tests: labData.tests
                  });
                  setLabModal(null);
                  setLabData({ reportType: "", date: fmtDate(new Date().toISOString()), remarks: "", tests: [] });
                  alert("Report Saved Successfully!");
                } catch(e) { alert("Failed to save report to server."); }
              }}>💾 Save Lab Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
