import * as XLSX from "xlsx";
import MedDrawer from "../components/MedDrawer";
import { useState, useMemo, useEffect } from "react";
import { apiService } from "../services/apiService";
import { useTheme } from "../context/ThemeContext";
import ThemeModeDock from "../components/ui/ThemeModeDock";

const LOCATION_DB = {
  laxmi: [],
  raya: []
};


// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const BC = {
  laxmi: { label: "Laxmi Nagar", accent: "#34d399", dim: "#34d39918", border: "#34d39930" },
  raya:  { label: "Raya",        accent: "#818cf8", dim: "#818cf818", border: "#818cf830" },
};
const BRANCH_KEYS = ["laxmi", "raya"];
const BRANCH_KEY_TO_CODE = { laxmi: "LNM", raya: "RYM" };
const BRANCH_CODE_TO_KEY = { LNM: "laxmi", RYM: "raya" };
const DEPT_OPTIONS = ["HOD", "Billing", "Uploading", "Intimation", "Query", "OPD"];
const TASK_STATUS   = ["Pending", "In Progress", "Completed", "On Hold", "Overdue"];
const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];
const SUMMARY_TYPES = ["Normal", "LAMA", "Refer", "Death", "DAMA"];
const EMPLOYEE_ID_PREFIXES = { LNM: "LAK", RYM: "RAY", ALL: "OFF" };
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

const NAV = [
  { id: "home",        label: "Home",         icon: "🏠" },
  { id: "patients",    label: "Patients",      icon: "🧑‍⚕️" },
  { id: "discharge",   label: "Discharge",     icon: "🚪" },
  { id: "medicines",   label: "Medicines",     icon: "💊" },
  { id: "reports",     label: "Reports",       icon: "📋" },
  { id: "billing",     label: "Billing",       icon: "💳" },
  { id: "export",      label: "Export",        icon: "📥" },
  { id: "tasks",       label: "Task Manager",  icon: "✅" },
  { id: "taskreport",  label: "Task Report",   icon: "📊" },
  { id: "departments", label: "Departments",   icon: "🏢" },
  { id: "employees",   label: "Employees",     icon: "👥" },
  { id: "profile",     label: "My Profile",    icon: "👤" },
];

const SUMMARY_META = {
  Normal: { color: "#34d399", bg: "#34d39916" },
  LAMA:   { color: "#f59e0b", bg: "#f59e0b16" },
  Refer:  { color: "#34d399", bg: "#22d3ee16" },
  Death:  { color: "#f87171", bg: "#f8717116" },
  DAMA:   { color: "#c084fc", bg: "#c084fc16" },
};
const TASK_STATUS_META = {
  "Pending":     { color: "#f59e0b", bg: "#f59e0b18" },
  "In Progress": { color: "#38bdf8", bg: "#38bdf818" },
  "Completed":   { color: "#34d399", bg: "#34d39918" },
  "On Hold":     { color: "#f87171", bg: "#f8717118" },
  "Overdue":     { color: "#f87171", bg: "#f8717118" },
};
const TASK_PRIORITY_META = {
  "Low":    { color: "#6b7280", bg: "#6b728018" },
  "Medium": { color: "#f59e0b", bg: "#f59e0b18" },
  "High":   { color: "#f87171", bg: "#f8717118" },
  "Urgent": { color: "#c084fc", bg: "#c084fc18" },
};
const DEPT_ICONS = { HOD:"👔", Billing:"💳", Uploading:"☁️", Intimation:"📢", Query:"❓", OPD:"🏥" };
const DEPT_ACCENT_CYCLE = ["#34d399","#818cf8","#f59e0b","#38bdf8","#f87171","#c084fc","#22d3ee"];
const EMPLOYEE_ROLE_OPTIONS = [
  { value: "receptionist", label: "Receptionist" },
  { value: "hod", label: "HOD" },
  { value: "billing", label: "Billing" },
  { value: "opd", label: "OPD" },
  { value: "intimation", label: "Intimation" },
  { value: "query", label: "Query" },
  { value: "uploading", label: "Uploading" },
];
const DEPARTMENT_ROLE_MAP = {
  HOD: "hod",
  Billing: "billing",
  OPD: "opd",
  Intimation: "intimation",
  Query: "query",
  Uploading: "uploading",
  Receptionist: "receptionist",
};
const TASK_ASSIGNABLE_ROLES = new Set(["receptionist", "billing", "hod", "opd", "intimation", "query", "uploading", "admin", "office_admin"]);

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmt    = (n)   => "₹" + Number(n).toLocaleString("en-IN");
const fmtDt  = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const initials = (name = "") => name.trim().split(" ").filter(Boolean).map(w => w[0]).join("").slice(0,2).toUpperCase();

const safeLoad = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)||"null") || fb; } catch { return fb; } };
const safeSave = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const mapTaskFromApi = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  assignedToId: task.assigned_to,
  assignedTo: task.assigned_to_name || "—",
  department: task.department,
  priority: task.priority,
  status: task.status,
  dueDate: task.due_date ? task.due_date.slice(0, 10) : "",
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  completedAt: task.status === "Completed" ? task.updated_at : "",
  patientName: task.patient_name || task.patient_names?.[0] || "",
  patientUhid: task.patient_uhid || task.patient_uhids?.[0] || "",
  createdBy: task.assigned_by_name || "—",
});

// ── EXPORT UTILS ──────────────────────────────────────────────────────────────
function exportPatientHistoryXLSX(pts, filename = "patient_history.xlsx") {
  const wb = XLSX.utils.book_new();
  const ROW1="FFEBF5FB", ROW2="FFFFFFFF", CASH_GRN="FFD5F5E3", CASH_YLW="FFFEF9E7", TOTAL_BG="FFF0F3F4";
  const hStyle = (bg="FF1A3C5E") => ({ font:{bold:true,color:{rgb:"FFFFFFFF"},sz:10,name:"Arial"}, fill:{patternType:"solid",fgColor:{rgb:bg}}, alignment:{horizontal:"center",vertical:"center",wrapText:true}, border:{top:{style:"thin",color:{rgb:"FFB2BEC3"}},bottom:{style:"thin",color:{rgb:"FFB2BEC3"}},left:{style:"thin",color:{rgb:"FFB2BEC3"}},right:{style:"thin",color:{rgb:"FFB2BEC3"}}} });
  const cStyle = (bg=ROW1, bold=false, color="FF000000") => ({ font:{sz:9,name:"Arial",bold,color:{rgb:color}}, fill:{patternType:"solid",fgColor:{rgb:bg}}, alignment:{horizontal:"center",vertical:"center",wrapText:true}, border:{top:{style:"thin",color:{rgb:"FFB2BEC3"}},bottom:{style:"thin",color:{rgb:"FFB2BEC3"}},left:{style:"thin",color:{rgb:"FFB2BEC3"}},right:{style:"thin",color:{rgb:"FFB2BEC3"}}} });
  const headers = ["SR.NO","PATIENT NAME","AGE","GENDER","UHID","BRANCH","DEPT","DOA","DOD","STATUS","SUMMARY TYPE","DOCTOR","PHONE","ADDRESS","PAYMENT TYPE"];
  const aoa = [["SANGI HOSPITAL — IPD PATIENT HISTORY RECORD",...Array(14).fill("")],[`Generated: ${new Date().toLocaleDateString("en-IN")}  |  Confidential`,...Array(14).fill("")],Array(15).fill(""),headers];
  pts.forEach((p, i) => { const adm = p.admissions?.[0] || {}; aoa.push([i+1,p.patientName||p.name||"—",p.age||adm.age||"—",p.gender||adm.gender||"—",p.uhid||"—",p._branchLabel||p.branch||"—",p.dept||adm.dept||"—",p.doa||adm.doa||"—",p.dod||adm.dod||"—",p.status||"Discharged",p.dischargeSummary?.type||adm.dischargeSummary?.type||"Normal",p.doctor||adm.doctor||"—",p.phone||adm.phone||"—",p.address||adm.address||"—",p.paymentMode||adm.paymentMode||"Cash"]); });
  aoa.push(["TOTAL PATIENTS","",pts.length,...Array(12).fill("")]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [{s:{r:0,c:0},e:{r:0,c:14}},{s:{r:1,c:0},e:{r:1,c:14}},{s:{r:aoa.length-1,c:0},e:{r:aoa.length-1,c:1}}];
  const enc = (r,c) => XLSX.utils.encode_cell({r,c});
  ws[enc(0,0)] = {v:"SANGI HOSPITAL — IPD PATIENT HISTORY RECORD",t:"s",s:{font:{bold:true,sz:14,name:"Arial",color:{rgb:"FFFFFFFF"}},fill:{patternType:"solid",fgColor:{rgb:"FF1A3C5E"}},alignment:{horizontal:"center",vertical:"center"}}};
  ws[enc(1,0)] = {v:`Generated: ${new Date().toLocaleDateString("en-IN")}  |  Confidential`,t:"s",s:{font:{italic:true,sz:10,name:"Arial",color:{rgb:"FFFFFFFF"}},fill:{patternType:"solid",fgColor:{rgb:"FF2E6DA4"}},alignment:{horizontal:"center",vertical:"center"}}};
  headers.forEach((h,c) => { ws[enc(3,c)] = {v:h,t:"s",s:hStyle()}; });
  pts.forEach((p,i) => { const r=4+i; const bg=i%2===0?ROW1:ROW2; const payment=aoa[r][14]; const payBg=payment==="Cash"?CASH_GRN:CASH_YLW; const payColor=payment==="Cash"?"FF1E8449":"FF7D6608"; const summType=aoa[r][10]; const summColor=summType==="Critical"?"FFC0392B":"FF1E8449"; for(let c=0;c<15;c++){const val=aoa[r][c];if(c===14)ws[enc(r,c)]={v:val,t:"s",s:cStyle(payBg,true,payColor)};else if(c===0)ws[enc(r,c)]={v:val,t:"n",s:cStyle("FFD6E4F0",true,"FF1A3C5E")};else if(c===10)ws[enc(r,c)]={v:val,t:"s",s:cStyle(bg,true,summColor)};else ws[enc(r,c)]={v:val,t:typeof val==="number"?"n":"s",s:cStyle(bg)};} });
  const tr=4+pts.length;
  ws[enc(tr,0)]={v:"TOTAL PATIENTS",t:"s",s:cStyle(TOTAL_BG,true,"FF1A3C5E")}; ws[enc(tr,2)]={v:pts.length,t:"n",s:cStyle(TOTAL_BG,true,"FF1A3C5E")};
  for(let c=1;c<15;c++) if(c!==2) ws[enc(tr,c)]={v:"",t:"s",s:cStyle(TOTAL_BG)};
  ws["!cols"]=[6,20,6,8,13,14,10,11,11,12,14,13,12,32,13].map(w=>({wch:w}));
  ws["!rows"]=[{hpt:28},{hpt:18},{hpt:6},{hpt:36},...pts.map(()=>({hpt:20})),{hpt:20}];
  XLSX.utils.book_append_sheet(wb, ws, "Patient History");
  XLSX.writeFile(wb, filename, {bookType:"xlsx",cellStyles:true});
}

function exportTasksXLSX(tasks, filename = "task_report.xlsx") {
  const wb = XLSX.utils.book_new();
  const headers = ["Task ID","Title","Assigned To","Department","Priority","Status","Due Date","Created Date","Description","Completed Date","Patient Name","Patient UHID"];
  const rows = tasks.map((t,i) => [i+1,t.title,t.assignedTo,t.department,t.priority,t.status,t.dueDate||"—",t.createdAt?.split("T")[0]||"—",t.description||"—",t.completedAt?.split("T")[0]||"—",t.patientName||"—",t.patientUhid||"—"]);
  const aoa = [["SANGI HOSPITAL — TASK REPORT",...Array(11).fill("")],[`Generated: ${new Date().toLocaleDateString("en-IN")}`,...Array(11).fill("")],Array(12).fill(""),headers,...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [6,24,18,14,10,12,12,12,40,12,20,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws, "Task Report");
  XLSX.writeFile(wb, filename, {bookType:"xlsx"});
}

function exportCSV(filename, rows, headers) {
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r[h]??"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = filename; a.click();
}
function exportTxt(filename, content) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content],{type:"text/plain"})); a.download = filename; a.click();
}
function buildDischargeSummaryText(p, branchLabel, ds={}, mh={}, meds=[], reps=[]) {
  return `========================================\n  SANGI HOSPITAL — ${branchLabel.toUpperCase()}\n  DISCHARGE SUMMARY [${ds.type||"Normal"}]\n========================================\n\nPatient Name  : ${p.patientName||p.name||""}\nUHID          : ${p.uhid}\nAge / Gender  : ${p.ageYY||p.age||""}Y / ${p.gender||""}\nDepartment    : ${ds.wardName||p.dept||""}\nAdmit Date    : ${fmtDt(p.admissions?.[0]?.dateTime||p.admitDate)}\nDischarge Date: ${ds.dod||ds.date||"—"}\nExpected DOD  : ${ds.expectedDod||"—"}\nTreating Dr.  : ${ds.doctorName||mh.treatingDoctor||"—"}\n\n── CLINICAL ────────────────────────────\nDiagnosis     : ${ds.diagnosis||"—"}\nTreatment     : ${ds.treatment||"—"}\nFollow-up     : ${ds.followUp||"—"}\nNotes         : ${ds.notes||"—"}\n\n── MEDICAL HISTORY ─────────────────────\nPrevious Dx   : ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies     : ${mh.knownAllergies||"—"}\nChronic Cond. : ${mh.chronicConditions||"—"}\nCurrent Meds  : ${mh.currentMedications||"—"}\nSmoking       : ${mh.smokingStatus||"—"}\nAlcohol       : ${mh.alcoholUse||"—"}\n\n── MEDICINES PRESCRIBED ────────────────\n${meds.map(m=>`  - ${m.name} | Qty: ${m.qty} | Rate: ₹${m.rate}`).join("\n")||"  None"}\n\n── INVESTIGATIONS ──────────────────────\n${reps.map(r=>`  - ${r.name} (${r.date||""}): ${r.result||""}`).join("\n")||"  None"}\n\n========================================\n  Generated: ${new Date().toLocaleString("en-IN")}\n========================================`;
}

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const SEED_MEDS = {
  laxmi: [[{id:1,name:"Aspirin",qty:30,rate:5},{id:2,name:"Atorvastatin",qty:14,rate:12}],[{id:1,name:"Ibuprofen",qty:20,rate:8},{id:2,name:"Calcium",qty:30,rate:6}]],
  raya:  [[{id:1,name:"Metformin",qty:60,rate:4},{id:2,name:"Glimepiride",qty:30,rate:9}],[{id:1,name:"Azithromycin",qty:5,rate:25},{id:2,name:"Paracetamol",qty:15,rate:3}]],
};
const SEED_REPS = {
  laxmi: [[{id:1,name:"ECG",date:"2026-03-29",result:"Normal sinus rhythm"},{id:2,name:"Blood Panel",date:"2026-03-30",result:"Cholesterol elevated"}],[{id:1,name:"X-Ray Knee",date:"2026-03-21",result:"Mild arthritis"}]],
  raya:  [[{id:1,name:"HbA1c",date:"2026-04-04",result:"8.2%"},{id:2,name:"FBS",date:"2026-04-03",result:"210 mg/dL"}],[{id:1,name:"Chest X-Ray",date:"2026-03-26",result:"Consolidation RLL"}]],
};

function seedPatients(dbBranch, branchKey) {
  return (dbBranch||[]).map((p,idx) => ({
    ...p,
    medicines: p.medicines || (SEED_MEDS[branchKey]?.[idx]||[]),
    reports:   p.reports   || (SEED_REPS[branchKey]?.[idx] ||[]),
    dischargeSummary: p.dischargeSummary || {type:"Normal",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""},
  }));
}

// ── DYNAMIC CSS (theme-dependent only) ────────────────────────────────────────
const DYNAMIC_CSS = (accent, isDark) => `
  option { background: ${isDark ? "#040710" : "#ffffff"}; }

  /* ── THEME: GLOBAL ── */
  body { background: ${isDark ? "#05080f" : "#f0f4ff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }

  ::-webkit-scrollbar-thumb { background: ${isDark ? "#1a2540" : "#c7d5eb"}; }

  /* ── HEADER ── */
  .hms-hdr        { background: ${isDark ? "#05080f" : "#f0f4ff"}; }
  .hms-logo-text  { color: ${isDark ? "#f1f5f9" : "#0f172a"}; }
  .hms-logo-sub   { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-role-badge { background: ${accent}18; border: 1px solid ${accent}30; color: ${accent}; }
  .hms-avatar     { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-big-avatar { background: linear-gradient(135deg, ${accent}, #818cf8); }
  .hms-avatar-pill {
    background: ${isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"};
    border: 1px solid ${isDark ? "#1e2a3a" : "#dde8f5"};
  }
  .hms-avatar-name { color: ${isDark ? "#94a3b8" : "#475569"}; }
  .hms-logout-btn {
    border: 1px solid ${isDark ? "#1e2a3a" : "#dde8f5"};
    color: ${isDark ? "#64748b" : "#64748b"};
  }

  /* ── LAYOUT ── */
  .hms-wrap { background: ${isDark ? "#05080f" : "#f0f4ff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }

  /* ── SIDEBAR ── */
  .hms-sb { background: ${isDark ? "#080c18" : "#ffffff"}; }
  .hms-nav-section { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-nav-item { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-nav-item:hover { color: ${isDark ? "#f1f5f9" : "#0f172a"}; background: ${isDark ? "rgba(0,0,0,.05)" : "rgba(0,0,0,.05)"}; }
  .hms-nav-item.active {
    color: ${isDark ? "#f1f5f9" : "#0f172a"};
    background: ${isDark ? "rgba(0,0,0,.05)" : "rgba(0,0,0,.05)"};
    border-left: 2px solid ${accent};
    font-weight: 600;
  }
  .hms-signed-in   { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-signed-name { color: ${isDark ? "#94a3b8" : "#475569"}; }
  .hms-signed-role { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── BRANCH SELECT ── */
  .hms-branch-label  { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-branch-select {
    border: 1px solid ${isDark ? "#1a2540" : "#c7d5eb"};
    background-color: ${isDark ? "#0b1120" : "#ffffff"};
    color: ${isDark ? "#e2e8f0" : "#1e293b"};
  }

  /* ── PAGE HEADERS ── */
  .hms-pg-label { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-pg-sub   { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── CARDS ── */
  .hms-card       { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-card-title { color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-prof-card  { background: ${isDark ? "#080c18" : "#ffffff"}; }

  /* ── STAT ── */
  .hms-stat-card  { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-stat-label { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── TABLE ── */
  .hms-th     { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-td     { color: ${isDark ? "#94a3b8" : "#475569"}; }
  .hms-td-hi  { color: ${isDark ? "#f1f5f9" : "#0f172a"}; }
  .hms-td-mono { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-td-sm  { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── BUTTONS ── */
  .hms-add-btn     { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-add-btn-lg  { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-cancel-btn  { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-save-btn    { background: linear-gradient(135deg, ${accent}, ${accent}cc); }
  .hms-export-main-btn { background: linear-gradient(135deg, ${accent}, ${accent}cc); }

  /* ── FORMS ── */
  .hms-lbl      { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-inp      { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-inp-sm   { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-sel      { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-textarea { background: ${isDark ? "#080c18" : "#ffffff"}; color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-pass-toggle { color: ${isDark ? "#64748b" : "#64748b"}; }

  /* ── MODAL ── */
  .hms-modal-overlay { background: ${isDark ? "rgba(0,0,0,.7)" : "rgba(5,15,40,.6)"}; }
  .hms-modal-box     { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-modal-title   { color: ${isDark ? "#f1f5f9" : "#0f172a"}; }

  /* ── MISC ── */
  .hms-empty       { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-view-key    { color: ${isDark ? "#64748b" : "#64748b"}; }
  .hms-view-val    { color: ${isDark ? "#e2e8f0" : "#1e293b"}; }
  .hms-section-label { color: ${isDark ? "#2d3a50" : "#94a3b8"}; }
  .hms-dept-card   { background: ${isDark ? "#0b1120" : "#ffffff"}; }
  .hms-progress-bar    { background: ${isDark ? "#1e2a3a" : "#dde8f5"}; }
  .hms-progress-bar-sm { background: ${isDark ? "#1e2a3a" : "#dde8f5"}; }

  /* ── PATIENT SELECT IN TASK MODAL ── */
  .hms-patient-select-box {
    background: ${isDark ? "#080c18" : "#f8faff"};
    border: 1px solid ${isDark ? "#1a2540" : "#c7d5eb"};
    border-radius: 8px;
    max-height: 150px;
    overflow-y: auto;
    margin-top: 4px;
  }
  .hms-patient-select-item {
    padding: 7px 12px;
    cursor: pointer;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${isDark ? "#1a2540" : "#e8eef8"};
    transition: background 0.15s;
  }
  .hms-patient-select-item:last-child { border-bottom: none; }
  .hms-patient-select-item:hover { background: ${accent}18; }
  .hms-patient-select-item.selected { background: ${accent}22; border-left: 3px solid ${accent}; }
  .hms-patient-selected-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${accent}18;
    border: 1px solid ${accent}40;
    color: ${accent};
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 6px;
  }
  .hms-patient-clear-btn {
    background: none;
    border: none;
    color: ${accent};
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    padding: 0;
    opacity: 0.7;
  }
  .hms-patient-clear-btn:hover { opacity: 1; }
  .hms-patient-search {
    background: ${isDark ? "#080c18" : "#ffffff"};
    color: ${isDark ? "#e2e8f0" : "#1e293b"};
    border: 1px solid ${isDark ? "#1a2540" : "#c7d5eb"};
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 11px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 4px;
    outline: none;
  }
  .hms-patient-search:focus { border-color: ${accent}; }
`;

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ManagementAdminDashboard({ currentUser, db, locId, onLogout }) {
  const { isDark } = useTheme();
  const userBranchKey = BRANCH_CODE_TO_KEY[String(currentUser?.branch || "").toUpperCase()];
  const locBranchKey = BRANCH_KEYS.includes(locId) ? locId : null;
  const homeBranch = userBranchKey || locBranchKey || (currentUser?.locations?.find(location => BRANCH_KEYS.includes(location)) || "laxmi");
  const isOfficeAdmin = String(currentUser?.role || "").toLowerCase() === "office_admin";
  const isSuperAdmin = String(currentUser?.role || "").toLowerCase() === "superadmin";
  const allowedBranchKeys = BRANCH_KEYS;
  const [viewBranch,  setViewBranch]  = useState(homeBranch);
  const activeBranchCode = BRANCH_KEY_TO_CODE[viewBranch] || "LNM";
  const bc     = BC[viewBranch] || BC.laxmi;
  const accent = bc.accent;

  useEffect(() => {
    if (!allowedBranchKeys.includes(viewBranch)) {
      setViewBranch(homeBranch);
    }
  }, [allowedBranchKeys, viewBranch, homeBranch]);

  const [activeTab,  setActiveTab]  = useState("home");
  const [collapsed,  setCollapsed]  = useState(false);
  const [notif,      setNotif]      = useState(null);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", email: "", phone_number: "", emp_id: "" });

  // 1. Keep the state so your edit buttons still work
  const [allPatients, setAllPatients] = useState({ laxmi: [], raya: [] });

  // Employees State (🌟 Added Edit ID tracker)
  const [employees,      setEmployees]      = useState([]);
  const [showEmpModal,   setShowEmpModal]   = useState(false);
  const [editEmpId,      setEditEmpId]      = useState(null); 
  const [empForm,        setEmpForm]        = useState({ fullName:"", username:"", empId:"", dept:"HOD", email:"", phone:"", role:"hod", password:"", confirmPassword:"" });

  // 2. Automatically load the real, secure data!
  useEffect(() => {
    if (db) setAllPatients(db);

    // 🌟 THE FIX: Fetch real employees from Django so we have their real integer IDs!
    const loadEmployees = async () => {
        try {
            const users = await apiService.getUsers();
            const mapped = users.map(u => ({
                id: u.id, // REAL DB INTEGER ID!
                empId: u.emp_id || "—",
                username: u.username,
                fullName: `${u.first_name} ${u.last_name}`.trim(),
                email: u.email,
                phone: u.phone_number,
                role: u.role,
                branch: u.branch,
                dept: u.role.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
                status: u.is_active ? "Active" : "Inactive"
            }));
            setEmployees(mapped);
        } catch (err) { console.error("Failed to fetch employees", err); }
    };
    const loadProfile = async () => {
      try {
        const profile = await apiService.getMyProfile();
        setProfileForm({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone_number: profile.phone_number || "",
          emp_id: profile.emp_id || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    const loadTasks = async () => {
      try {
        const taskData = await apiService.getTasks();
        setTasks((taskData || []).map(mapTaskFromApi));
      } catch (err) {
        console.error("Failed to fetch tasks", err);
        setTasks([]);
      }
    };
    loadEmployees();
    loadTasks();
    loadProfile();
  }, [db]);

  // Departments
  const [departments,    setDepartments]    = useState(() => safeLoad("hms_mgmt_departments", []));
  const [showDeptModal,  setShowDeptModal]  = useState(false);
  const [deptForm,       setDeptForm]       = useState({ name:"", description:"", head:"" });
  const [empShowPass,    setEmpShowPass]    = useState(false);
  const [empShowConfirm, setEmpShowConfirm] = useState(false);
  const [empPassErr,     setEmpPassErr]     = useState("");

  // Tasks
  const [tasks,           setTasks]           = useState([]);
  const [showTaskModal,   setShowTaskModal]   = useState(false);
  const [editTask,        setEditTask]        = useState(null);
  const [taskForm,        setTaskForm]        = useState({ title:"", description:"", assignedToId:"", department:"HOD", priority:"Medium", status:"Pending", dueDate:"", patientUhid:"", patientName:"" });
  const [taskPatientSearch, setTaskPatientSearch] = useState("");
  const [taskReportFilter,setTaskReportFilter]= useState({ period:"all", dept:"All", status:"All", empName:"" });

  // Patient modals
  const [showMedModal,      setShowMedModal]      = useState(false);
  const [showSummaryModal,  setShowSummaryModal]  = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [showViewModal,     setShowViewModal]      = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMedPt,         setEditMedPt]         = useState(null);
  const [editSumPt,         setEditSumPt]         = useState(null);
  const [editRepPt,         setEditRepPt]         = useState(null);
  const [viewPt,            setViewPt]            = useState(null);
  const [deletePt,          setDeletePt]          = useState(null);
  const [summaryForm,       setSummaryForm]       = useState({});
  const [newReport,         setNewReport]         = useState({ name:"", date:"", result:"" });
  const [dischSumFilter,    setDischSumFilter]    = useState("All");
  const [exportBranchFilter,setExportBranchFilter]= useState("All");
  const [exportType,        setExportType]        = useState("discharge");
  const [exportSumType,     setExportSumType]     = useState("All");

  const toast = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null), 3200); };

  useEffect(() => safeSave("hms_mgmt_departments", departments), [departments]);
  useEffect(() => safeSave("hms_mgmt_employees",   employees),   [employees]);

  const allPatientsFlat   = useMemo(() => BRANCH_KEYS.flatMap(bk => (allPatients[bk]||[]).map(p=>({...p,_branch:bk,_branchLabel:BC[bk].label}))), [allPatients]);
  const allDeptOptions    = [...DEPT_OPTIONS, ...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>d.name)];
  const locationPatients  = isOfficeAdmin ? allPatientsFlat : (allPatients[viewBranch] || []);
  const allAdmissions     = useMemo(() => locationPatients.flatMap(p => (p.admissions||[]).map(a => ({...a, patientName:p.patientName||p.name, uhid:p.uhid, gender:p.gender, bloodGroup:p.bloodGroup, phone:p.phone}))), [locationPatients]);
  const currentlyAdmitted = allAdmissions.filter(a => !a.discharge?.dod).length;
  const discharged        = allAdmissions.filter(a =>  a.discharge?.dod).length;

  // Office admin can assign from all hospitals.
  const allPatientsForTask = useMemo(() => allPatientsFlat.map(p => ({
    id: p.id,
    uhid: p.uhid,
    name: p.patientName || p.name,
    branch: p._branchLabel,
    status: (p.admissions?.[p.admissions.length-1]?.discharge?.dod) ? "Discharged" : "Admitted",
  })), [allPatientsFlat]);

  const filteredTaskPatients = useMemo(() => {
    if (!taskPatientSearch.trim()) return allPatientsForTask;
    const q = taskPatientSearch.toLowerCase();
    return allPatientsForTask.filter(p => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q));
  }, [allPatientsForTask, taskPatientSearch]);

  const taskAssignableEmployees = useMemo(
    () => employees.filter((employee) => TASK_ASSIGNABLE_ROLES.has(String(employee.role || "").toLowerCase())),
    [employees]
  );

  const getEmployeeBranchCode = () => {
    if (isOfficeAdmin) return "ALL";
    if (isSuperAdmin) return activeBranchCode;
    return String(currentUser?.branch || activeBranchCode || "LNM").toUpperCase();
  };

  const buildEmployeeId = (branchCode) => {
    const prefix = EMPLOYEE_ID_PREFIXES[branchCode] || "EMP";
    const highestSuffix = employees.reduce((max, employee) => {
      const candidate = String(employee.empId || "").trim().toUpperCase();
      if (!candidate.startsWith(prefix)) return max;
      const suffix = candidate.slice(prefix.length);
      const numericSuffix = Number(suffix);
      return Number.isInteger(numericSuffix) ? Math.max(max, numericSuffix) : max;
    }, 0);
    return `${prefix}${String(highestSuffix + 1).padStart(4, "0")}`;
  };

  const currentDisplayName = `${profileForm.first_name || ""} ${profileForm.last_name || ""}`.trim() || currentUser?.name;

  const saveMyProfile = async () => {
    try {
      const payload = {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        emp_id: profileForm.emp_id,
      };
      const updated = await apiService.updateMyProfile(payload);
      setProfileForm({
        first_name: updated.first_name || "",
        last_name: updated.last_name || "",
        email: updated.email || "",
        phone_number: updated.phone_number || "",
        emp_id: updated.emp_id || "",
      });
      try {
        const raw = sessionStorage.getItem("hms_currentUser");
        if (raw) {
          const parsed = JSON.parse(raw);
          const merged = {
            ...parsed,
            name: `${updated.first_name || ""} ${updated.last_name || ""}`.trim() || parsed.name,
            email: updated.email || parsed.email,
            emp_id: updated.emp_id || parsed.emp_id,
            phone_number: updated.phone_number || parsed.phone_number,
          };
          sessionStorage.setItem("hms_currentUser", JSON.stringify(merged));
        }
      } catch (e) {
        console.error("Failed to sync session profile", e);
      }
      toast("Profile updated");
    } catch (error) {
      const apiError = error.response?.data || {};
      const message = apiError.email?.[0] || apiError.phone_number?.[0] || apiError.emp_id?.[0] || apiError.detail || "Failed to update profile";
      toast(message, "err");
    }
  };

  const updatePatient = (branchKey, uhid, updater) => setAllPatients(prev => ({...prev,[branchKey]:prev[branchKey].map(p=>p.uhid===uhid?updater(p):p)}));

  // ── PATIENT HELPERS ───────────────────────────────────────────────────────
  const openMedEditor = (p) => { setEditMedPt(JSON.parse(JSON.stringify(p))); setShowMedModal(true); };
  const updateMed = (idx, field, val) => setEditMedPt(prev => { const m=[...prev.medicines]; m[idx]={...m[idx],[field]:field==="name"?val:(+val||0)}; return {...prev,medicines:m}; });
  const addMedRow = () => setEditMedPt(prev => ({...prev,medicines:[...(prev.medicines||[]),{id:Date.now(),name:"",qty:1,rate:0}]}));
  const delMedRow = (idx) => setEditMedPt(prev => ({...prev,medicines:prev.medicines.filter((_,i)=>i!==idx)}));
  const saveMeds  = () => { updatePatient(viewBranch, editMedPt.uhid, p=>({...p,medicines:editMedPt.medicines})); toast("Medicines saved"); setShowMedModal(false); setEditMedPt(null); };

  const openSummaryEditor = (p) => { setEditSumPt(p); setSummaryForm({...(p.dischargeSummary||{type:"Normal",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""})}); setShowSummaryModal(true); };
  const saveSummary = () => { updatePatient(viewBranch, editSumPt.uhid, p=>({...p,dischargeSummary:{...summaryForm}})); toast("Summary saved"); setShowSummaryModal(false); setEditSumPt(null); };
  const openViewModal = (p) => { setViewPt(p); setShowViewModal(true); };
  const confirmDelete = (p) => { setDeletePt(p); setShowDeleteConfirm(true); };
  const doDeleteSummary = () => { updatePatient(viewBranch, deletePt.uhid, p=>({...p,dischargeSummary:{type:"Normal",diagnosis:"",treatment:"",followUp:"",notes:"",doctorName:"",date:"",expectedDod:""}})); toast("Summary cleared"); setShowDeleteConfirm(false); setDeletePt(null); };

  const openReportEditor = (p) => { setEditRepPt(JSON.parse(JSON.stringify(p))); setNewReport({name:"",date:"",result:""}); setShowReportModal(true); };
  const addReport    = () => { if (!newReport.name) return; setEditRepPt(prev=>({...prev,reports:[...(prev.reports||[]),{id:Date.now(),...newReport}]})); setNewReport({name:"",date:"",result:""}); };
  const delReport    = (idx) => setEditRepPt(prev=>({...prev,reports:prev.reports.filter((_,i)=>i!==idx)}));
  const updateReport = (idx, field, val) => setEditRepPt(prev=>{ const r=[...prev.reports]; r[idx]={...r[idx],[field]:val}; return {...prev,reports:r}; });
  const saveReports  = async () => { 
    try {
      const cleanAdm = String(editRepPt.admissions?.[0]?.admNo || 1).replace(/\D/g, "");
      for (const rep of editRepPt.reports) {
        await apiService.saveLabReport(editRepPt.uhid, cleanAdm, {
           reportName: rep.reportName || rep.name,
           reportType: rep.reportType || "Pathology",
           date: rep.date,
           remarks: rep.remarks || "",
           tests: rep.tests || []
        });
      }
      updatePatient(viewBranch, editRepPt.uhid, p=>({...p,reports:editRepPt.reports})); 
      toast("Reports synced to Backend!"); 
      setShowReportModal(false); 
      setEditRepPt(null); 
    } catch(e) { toast("Failed to sync reports.", "err"); }
  };

  // ── TASK HELPERS ──────────────────────────────────────────────────────────
  const openNewTask  = () => {
    setEditTask(null);
    setTaskForm({title:"",description:"",assignedToId:"",department:"HOD",priority:"Medium",status:"Pending",dueDate:"",patientUhid:"",patientName:""});
    setTaskPatientSearch("");
    setShowTaskModal(true);
  };
  const openEditTask = (t) => {
    setEditTask(t);
    setTaskForm({title:t.title,description:t.description||"",assignedToId:t.assignedToId ? String(t.assignedToId) : "",department:t.department,priority:t.priority,status:t.status,dueDate:t.dueDate||"",patientUhid:t.patientUhid||"",patientName:t.patientName||""});
    setTaskPatientSearch("");
    setShowTaskModal(true);
  };
  const saveTask = async () => {
    if (!taskForm.title || !taskForm.assignedToId) { toast("Title and Assigned To are required","err"); return; }

    const assignedEmployee = taskAssignableEmployees.find((employee) => String(employee.id) === String(taskForm.assignedToId));
    if (!assignedEmployee) { toast("Select a valid employee from the live employee list","err"); return; }

    const linkedPatient = allPatientsForTask.find(patient => patient.uhid === taskForm.patientUhid);
    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      assigned_to: Number(taskForm.assignedToId),
      department: taskForm.department,
      priority: taskForm.priority,
      status: taskForm.status,
      due_date: taskForm.dueDate ? `${taskForm.dueDate}T23:59:00Z` : null,
      patient: linkedPatient?.id || null,
    };

    try {
      if (editTask) {
        const updatedTask = await apiService.updateTask(editTask.id, payload);
        setTasks(prev => prev.map(task => task.id === editTask.id ? mapTaskFromApi(updatedTask) : task));
        toast("Task updated");
      } else {
        const createdTask = await apiService.createTask(payload);
        setTasks(prev => [mapTaskFromApi(createdTask), ...prev]);
        toast("Task assigned");
      }
      setShowTaskModal(false);
      setEditTask(null);
    } catch (error) {
      const apiError = error.response?.data;
      const message = apiError?.patient?.[0] || apiError?.assigned_to?.[0] || apiError?.detail || apiError?.error || "Failed to save task";
      toast(message,"err");
    }
  };
  const deleteTask = async (id) => {
    try {
      await apiService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      toast("Task deleted");
    } catch (error) {
      toast("Failed to delete task","err");
    }
  };
  const updateTaskStatus = async (id,status) => {
    try {
      const updatedTask = await apiService.updateTask(id, { status });
      setTasks(prev => prev.map(task => task.id === id ? mapTaskFromApi(updatedTask) : task));
      toast(`Task marked ${status}`);
    } catch (error) {
      toast("Failed to update task status","err");
    }
  };

  const filteredTaskReport = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      const created = new Date(t.createdAt);
      if (taskReportFilter.period==="today" && created.toDateString()!==now.toDateString()) return false;
      if (taskReportFilter.period==="week") { const w=new Date(now); w.setDate(w.getDate()-7); if(created<w) return false; }
      if (taskReportFilter.period==="month" && (created.getMonth()!==now.getMonth()||created.getFullYear()!==now.getFullYear())) return false;
      if (taskReportFilter.dept!=="All" && t.department!==taskReportFilter.dept) return false;
      if (taskReportFilter.status!=="All" && t.status!==taskReportFilter.status) return false;
      if (taskReportFilter.empName && !t.assignedTo.toLowerCase().includes(taskReportFilter.empName.toLowerCase())) return false;
      return true;
    });
  }, [tasks, taskReportFilter]);

  // ── DEPT / EMP HELPERS ────────────────────────────────────────────────────
  const saveDepartment = () => {
    if (!deptForm.name) { toast("Department name required","err"); return; }
    setDepartments(prev=>[...prev,{id:`DEPT-${Date.now()}`,...deptForm,createdAt:new Date().toISOString(),memberCount:0}]);
    setShowDeptModal(false); setDeptForm({name:"",description:"",head:""}); toast("Department created");
  };
  const openEditEmployee = (emp) => {
    setEditEmpId(emp.id); // Save real DB ID
    setEmpForm({
      fullName: emp.fullName || emp.name, username: emp.username, empId: emp.empId,
      dept: emp.dept || "HOD", email: emp.email, phone: emp.phone, role: emp.role,
      password: "", confirmPassword: "" // Keep blank so we don't accidentally overwrite it
    });
    setEmpPassErr(""); setShowEmpModal(true);
  };

  const saveEmployee = async () => {
    if (!empForm.fullName||!empForm.username||!empForm.email||!empForm.phone||!empForm.dept) { 
      setEmpPassErr("Please fill all required fields"); return; 
    }
    if (empForm.password !== empForm.confirmPassword) { 
      setEmpPassErr("Passwords do not match"); return; 
    }
    if (!editEmpId && !empForm.password) {
      setEmpPassErr("Password is required for new employees"); return;
    }

    try {
      const [firstName, ...lastNameArr] = empForm.fullName.split(' ');
      const mappedRole = empForm.role || DEPARTMENT_ROLE_MAP[empForm.dept] || 'receptionist';
      const branchCode = getEmployeeBranchCode();

      const payload = {
        username: empForm.username, email: empForm.email, first_name: firstName,
        last_name: lastNameArr.join(' ') || "", emp_id: empForm.empId || buildEmployeeId(branchCode),
        phone_number: empForm.phone, role: mappedRole, 
        branch: branchCode 
      };

      // Only send password to Django if they typed a new one!
      if (empForm.password) {
        payload.password = empForm.password; payload.confirm_password = empForm.confirmPassword;
      }

      if (editEmpId) {
        await apiService.updateUser(editEmpId, payload);
        toast("Employee updated successfully!");
      } else {
        await apiService.createUser(payload);
        toast("Employee securely created!");
      }

      // Instantly refresh table with Django data
      const users = await apiService.getUsers();
      setEmployees(users.map(u => ({
          id: u.id, empId: u.emp_id || "—", username: u.username,
          fullName: `${u.first_name} ${u.last_name}`.trim(), email: u.email,
          phone: u.phone_number, role: u.role,
          dept: u.role.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
          status: u.is_active ? "Active" : "Inactive"
      })));

      setShowEmpModal(false); setEditEmpId(null);
      setEmpForm({fullName:"",username:"",empId:"",dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""}); 
    } catch (error) {
      const apiError = error.response?.data || {};
      setEmpPassErr(
        apiError.detail ||
        apiError.error ||
        apiError.username?.[0] ||
        apiError.emp_id?.[0] ||
        apiError.branch?.[0] ||
        apiError.role?.[0] ||
        "Failed to save user. Username or Emp ID might exist."
      );
    }
  };

  const handleToggleActive = async (emp, index) => {
    const isCurrentlyActive = emp.status !== "Inactive";
    const newStatusLabel = isCurrentlyActive ? "Inactive" : "Active";
    try {
      await apiService.updateUser(emp.id, { is_active: !isCurrentlyActive });
      setEmployees(prev => prev.map((e, ei) => ei === index ? { ...e, status: newStatusLabel } : e));
      toast(`Employee ${newStatusLabel === "Active" ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      toast("Failed to update employee status in the database.", "err");
    }
  };

  // ── EXPORT HELPERS ────────────────────────────────────────────────────────
  const getExportPatients = () => {
    let pts = exportBranchFilter==="All" ? allPatientsFlat : allPatientsFlat.filter(p=>p._branchLabel===exportBranchFilter);
    if (exportSumType!=="All") pts = pts.filter(p=>p.dischargeSummary?.type===exportSumType);
    return pts;
  };
  const doExport = () => {
    const pts = getExportPatients(); if (!pts.length) { toast("No records match","err"); return; }
    if (exportType==="discharge")      { pts.forEach(p=>{ const adm=p.admissions?.[0]||{}; exportTxt(`discharge_${p.uhid}.txt`,buildDischargeSummaryText(p,p._branchLabel,{...adm.discharge,...(p.dischargeSummary||{})},adm.medicalHistory||p.medicalHistory||{},p.medicines||[],p.reports||[])); }); toast(`Exported ${pts.length} discharge summary(s)`); }
    else if (exportType==="medical")   { pts.forEach(p=>{ const mh=(p.admissions?.[0]||{}).medicalHistory||p.medicalHistory||{}; exportTxt(`medhistory_${p.uhid}.txt`,`SANGI HOSPITAL — ${p._branchLabel}\nMEDICAL HISTORY\n\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}\n\nPrevious Dx: ${mh.previousDiagnosis||"—"}\nPast Surgeries: ${mh.pastSurgeries||"—"}\nAllergies: ${mh.knownAllergies||"—"}\nChronic: ${mh.chronicConditions||"—"}\nCurrent Meds: ${mh.currentMedications||"—"}\nSmoking: ${mh.smokingStatus||"—"}\nAlcohol: ${mh.alcoholUse||"—"}\nNotes: ${mh.notes||"—"}`); }); toast(`Exported ${pts.length} file(s)`); }
    else if (exportType==="medicines") { exportCSV("medicines_export.csv",pts.flatMap(p=>(p.medicines||[]).map(m=>({Branch:p._branchLabel,Patient:p.patientName||p.name,UHID:p.uhid,Medicine:m.name,Qty:m.qty,Rate:m.rate,Total:m.qty*m.rate}))),["Branch","Patient","UHID","Medicine","Qty","Rate","Total"]); toast("Medicines CSV exported"); }
    else if (exportType==="reports")   { exportCSV("reports_export.csv",pts.flatMap(p=>(p.reports||[]).map(r=>({Branch:p._branchLabel,Patient:p.patientName||p.name,UHID:p.uhid,Report:r.name,Date:r.date,Result:r.result}))),["Branch","Patient","UHID","Report","Date","Result"]); toast("Reports CSV exported"); }
    else if (exportType==="patientHistory") { exportPatientHistoryXLSX(pts,"patient_history.xlsx"); toast("Patient history Excel exported ✓"); }
  };

  // ── SMALL RENDER HELPERS ──────────────────────────────────────────────────
  const Badge = ({ col, children }) => (
    <span className="hms-badge" style={{ background:`${col}20`, color:col, borderColor:`${col}40` }}>{children}</span>
  );
  const Pill = ({ col, bg, children, small }) => (
    <span className={small?"hms-pill-sm":"hms-pill"} style={{ background:bg||`${col}20`, color:col, borderColor:`${col}40` }}>{children}</span>
  );
  const SummaryPill = ({ type }) => { const m=SUMMARY_META[type]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}><span className="hms-pill-dot" style={{ background:m.color }}/>{type||"Normal"}</Pill>; };
  const StatusPill  = ({ s }) => { const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return <Pill col={m.color} bg={m.bg}>{s}</Pill>; };
  const PriorityPill= ({ p }) => { const m=TASK_PRIORITY_META[p]||{color:"#6b7280",bg:"#6b728018"}; return <Pill small col={m.color} bg={m.bg}>{p}</Pill>; };
  const ActionBtn   = ({ col, onClick, children }) => <button className="hms-action-btn" style={{ borderColor:`${col}40`, color:col }} onClick={onClick}>{children}</button>;
  const Th = ({ children }) => <th className="hms-th">{children}</th>;
  const Td = ({ children, hi, mono, sm, style:s }) => <td className={`hms-td${hi?" hms-td-hi":""}${mono?" hms-td-mono":""}${sm?" hms-td-sm":""}`} style={s}>{children}</td>;

  const ProgressBar = ({ pct, col }) => (
    <div className="hms-progress-bar">
      <div className="hms-progress-fill" style={{ width:`${pct}%`, background:col }}/>
    </div>
  );

  const BranchHeader = ({ title }) => (
    <div style={{ marginBottom:18 }}>
      <div className="hms-pg-label">{title}</div>
      <span className="hms-branch-pill" style={{ background:bc.dim, border:`1px solid ${bc.border}`, color:accent }}>
        <span className="hms-branch-dot" style={{ width:7,height:7,borderRadius:"50%",background:accent,display:"inline-block" }}/> {isOfficeAdmin ? "All Hospitals" : bc.label}
      </span>
    </div>
  );
  const PageHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom:20 }}>
      <div className="hms-pg-label">{title}</div>
      {subtitle && <div className="hms-pg-sub">{subtitle}</div>}
    </div>
  );
  const CardRow = ({ title, action }) => (
    <div className="hms-card-row"><div className="hms-card-title">{title}</div>{action}</div>
  );
  const TableWrap = ({ heads, children }) => (
    <div style={{ overflowX:"auto" }}>
      <table className="hms-tbl">
        <thead><tr>{heads.map(h=><Th key={h}>{h}</Th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
  const EmptyState = ({ icon, label, sub }) => (
    <div style={{ textAlign:"center", padding:"3rem", color:"#64748b" }}>
      {icon && <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>}
      <div style={{ fontSize:14, fontWeight:600, color:"#94a3b8", marginBottom:6 }}>{label}</div>
      {sub && <div style={{ fontSize:12 }}>{sub}</div>}
    </div>
  );
  const StatCard = ({ col, icon, label, val, sub, topBorder }) => (
    <div className="hms-stat-card" style={{ borderTop:topBorder?`3px solid ${col}`:undefined, border:`1px solid ${col}15` }}>
      {icon && <div className="hms-stat-icon">{icon}</div>}
      {topBorder && <div style={{ fontSize:10, color:col, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>{label}</div>}
      <div className="hms-stat-num" style={{ fontSize:topBorder?26:22, color:col }}>{val}</div>
      {topBorder ? <div className="hms-stat-label">{sub}</div> : <div className="hms-stat-label">{label}</div>}
    </div>
  );

  const downloadDischarge = (p, branchLabel) => {
    const adm=p.admissions?.[0]||{}; const ds=p.dischargeSummary||{}; const mh=adm.medicalHistory||p.medicalHistory||{};
    exportTxt(`discharge_${p.uhid}.txt`, buildDischargeSummaryText(p, branchLabel, {...adm.discharge,...ds}, mh, p.medicines||[], p.reports||[]));
    toast("Downloaded");
  };

  // ── PAGE: HOME ────────────────────────────────────────────────────────────
  const renderHome = () => {
    const pendingTasks = tasks.filter(t=>t.status==="Pending").length;
    const urgentTasks  = tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length;
    const stats = [
      { label:"Branch Patients",    val:locationPatients.length, col:accent,    icon:"🧑‍⚕️", sub:"All records" },
      { label:"Total Admissions",   val:allAdmissions.length,    col:"#22d3ee", icon:"📋", sub:"All time" },
      { label:"Currently Admitted", val:currentlyAdmitted,       col:"#34d399", icon:"🏥", sub:"Active" },
      { label:"Discharged",         val:discharged,              col:"#8b949e", icon:"🚪", sub:"Completed" },
      { label:"Total Tasks",        val:tasks.length,            col:"#818cf8", icon:"✅", sub:"All tasks" },
      { label:"Pending Tasks",      val:pendingTasks,            col:"#f59e0b", icon:"⏳", sub:"Awaiting action" },
      { label:"Urgent Tasks",       val:urgentTasks,             col:"#f87171", icon:"🚨", sub:"Need attention" },
      { label:"Departments",        val:departments.length,      col:"#34d399", icon:"🏢", sub:"Active depts" },
    ];
    return (
      <div>
        <BranchHeader title="Home"/>
        <div className="hms-prof-card" style={{ display:"flex", alignItems:"flex-start", gap:18, border:`1px solid ${accent}30` }}>
          <div className="hms-big-avatar">{initials(currentUser?.name)}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>{currentUser?.name}</div>
            <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:2 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
            <div style={{ fontSize:10, color:"#64748b" }}>{bc.label} Branch</div>
            <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
              {currentUser?.dept && <Badge col={accent}>{currentUser.dept}</Badge>}
              <Badge col={currentUser?.status==="Inactive"?"#f87171":"#34d399"}>{currentUser?.status||"Active"}</Badge>
              <Badge col="#6b7280">{currentUser?.id}</Badge>
            </div>
          </div>
        </div>
        <div className="hms-stat-grid">
          {stats.map((s,i) => <StatCard key={i} topBorder {...s}/>)}
        </div>
        {tasks.length>0 && (
          <div className="hms-card">
            <CardRow title="Recent Tasks" action={<button className="hms-add-btn" onClick={()=>setActiveTab("tasks")}>View All</button>}/>
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due","Patient"]}>
              {tasks.slice(0,5).map((t,i)=>(
                <tr key={i}>
                  <Td hi>{t.title}</Td>
                  <Td>{t.assignedTo}</Td>
                  <Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td><StatusPill s={t.status}/></Td>
                  <Td sm>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{t.patientName ? <span style={{ color:"#38bdf8" }}>{t.patientName}</span> : "—"}</Td>
                </tr>
              ))}
            </TableWrap>
          </div>
        )}
        <div className="hms-card">
          <CardRow title={`Recent Patients — ${bc.label}`} action={<button className="hms-add-btn" onClick={()=>setActiveTab("patients")}>View All</button>}/>
          {locationPatients.length===0 ? <div className="hms-empty">No patients yet.</div> : (
            <TableWrap heads={["Patient","UHID","Ward","Doctor","Summary","Status","Admit Date"]}>
              {locationPatients.slice(0,5).map((p,i)=>{
                const last=p.admissions?.[p.admissions.length-1]; const d=last?.discharge||{}; const status=d.dod?"Discharged":"Admitted";
                return (
                  <tr key={i}>
                    <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono" style={{ marginTop:2 }}>{p.gender} · {p.ageYY||p.age}y</div></Td>
                    <Td mono>{p.uhid}</Td>
                    <Td>{d.wardName||"—"}</Td>
                    <Td sm>{d.doctorName||"—"}</Td>
                    <Td><span style={{ cursor:"pointer" }} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type}/></span></Td>
                    <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                    <Td sm>{fmtDt(last?.dateTime)}</Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: PATIENTS ────────────────────────────────────────────────────────
  const renderPatients = () => (
    <div>
      <BranchHeader title="Patients"/>
      <div className="hms-ro-banner">◎ View + Edit Qty/Rates/Summaries · {currentUser?.dept||currentUser?.role} · {bc.label}</div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {[{label:"Total",val:allAdmissions.length,col:accent},{label:"Admitted",val:currentlyAdmitted,col:"#34d399"},{label:"Discharged",val:discharged,col:"#8b949e"}].map((s,i)=>(
          <div key={i} className="hms-stat-card" style={{ padding:"10px 14px", border:`1px solid ${s.col}18` }}>
            <div className="hms-stat-num" style={{ fontSize:16, color:s.col }}>{s.val}</div>
            <div className="hms-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="hms-card">
        {locationPatients.length===0 ? <div className="hms-empty">No patients for {bc.label}.</div> : (
          <TableWrap heads={["Patient/UHID","Contact","Ward/Bed","Doctor","Summary","DOA","DOD","Status","Actions"]}>
            {locationPatients.flatMap((p,pi)=>(p.admissions||[]).map((adm,ai)=>{
              const d=adm.discharge||{}; const status=d.dod?"Discharged":"Admitted";
              return (
                <tr key={`${pi}-${ai}`}>
                  <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.uhid}</div></Td>
                  <Td sm><div>{p.phone}</div><div style={{ color:"#64748b", fontSize:9 }}>{p.email}</div></Td>
                  <Td>{d.wardName||"—"}<div className="hms-td-mono">{d.bedNo}</div></Td>
                  <Td sm>{d.doctorName||"—"}</Td>
                  <Td><span style={{ cursor:"pointer" }} onClick={()=>openSummaryEditor(p)}><SummaryPill type={p.dischargeSummary?.type}/></span></Td>
                  <Td sm>{fmtDt(d.doa)}</Td>
                  <Td sm>{fmtDt(d.dod)}</Td>
                  <Td><Badge col={status==="Admitted"?"#34d399":"#8b949e"}>{status}</Badge></Td>
                  <Td>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      <ActionBtn col="#34d399" onClick={()=>openMedEditor(p)}>Meds</ActionBtn>
                      <ActionBtn col="#34d399" onClick={()=>openReportEditor(p)}>Reports</ActionBtn>
                      <ActionBtn col="#f59e0b" onClick={()=>downloadDischarge(p,bc.label)}>↓</ActionBtn>
                    </div>
                  </Td>
                </tr>
              );
            }))}
          </TableWrap>
        )}
      </div>
    </div>
  );

  // ── PAGE: DISCHARGE ───────────────────────────────────────────────────────
  const renderDischarge = () => {
    const summaryStats = SUMMARY_TYPES.reduce((acc,t)=>{acc[t]=locationPatients.filter(p=>p.dischargeSummary?.type===t).length; return acc;},{});
    const unset = locationPatients.filter(p=>!p.dischargeSummary?.diagnosis).length;
    const filtered = dischSumFilter==="All" ? locationPatients : locationPatients.filter(p=>p.dischargeSummary?.type===dischSumFilter);
    return (
      <div>
        <BranchHeader title="Discharge Summaries"/>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
          {[{label:"Total",val:locationPatients.length,col:accent},...SUMMARY_TYPES.map(t=>({label:t,val:summaryStats[t]||0,col:SUMMARY_META[t].color})),{label:"Pending",val:unset,col:"#64748b"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{ padding:"10px 14px", minWidth:90, border:`1px solid ${s.col}15` }}>
              <div className="hms-stat-num" style={{ fontSize:18, color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <select className="hms-branch-select" style={{ width:"auto", padding:"7px 28px 7px 12px" }} value={dischSumFilter} onChange={e=>setDischSumFilter(e.target.value)}>
            <option value="All">All Types</option>
            {SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="hms-card">
          <CardRow title={`${filtered.length} Record${filtered.length!==1?"s":""} — ${bc.label}`}
            action={<ActionBtn col="#f59e0b" onClick={()=>{ filtered.forEach(p=>{ downloadDischarge(p,bc.label); }); toast(`Downloaded ${filtered.length} summaries`); }}>↓ Export All</ActionBtn>}/>
          {filtered.length===0 ? <div className="hms-empty">No summaries match this filter.</div> : (
            <TableWrap heads={["Patient","UHID","Type","Diagnosis","Doctor","Discharge Date","Exp. DOD","Meds","Reports","Actions"]}>
              {filtered.map((p,i)=>{
                const ds=p.dischargeSummary||{}; const adm=p.admissions?.[0]||{}; const d=adm.discharge||{};
                return (
                  <tr key={i} className="hms-tr-alt">
                    <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.gender} · {p.ageYY||p.age}y</div></Td>
                    <Td mono>{p.uhid}</Td>
                    <Td><SummaryPill type={ds.type}/></Td>
                    <Td>{ds.diagnosis?<span>{ds.diagnosis}</span>:<span style={{ color:"#64748b", fontStyle:"italic", fontSize:10 }}>Not set</span>}</Td>
                    <Td sm>{ds.doctorName||d.doctorName||"—"}</Td>
                    <Td sm>{fmtDt(ds.date||d.dod)}</Td>
                    <Td>{(ds.expectedDod||d.expectedDod)?<span className="hms-exp-dod-pill">⏱ {fmtDt(ds.expectedDod||d.expectedDod)}</span>:<span style={{ color:"#64748b", fontSize:10 }}>—</span>}</Td>
                    <Td><Badge col="#34d399">{(p.medicines||[]).length}</Badge></Td>
                    <Td><Badge col="#34d399">{(p.reports||[]).length}</Badge></Td>
                    <Td>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        <ActionBtn col="#34d399" onClick={()=>openViewModal(p)}>View</ActionBtn>
                        <ActionBtn col={accent} onClick={()=>openSummaryEditor(p)}>Edit</ActionBtn>
                        <ActionBtn col="#f59e0b" onClick={()=>downloadDischarge(p,bc.label)}>↓</ActionBtn>
                        <ActionBtn col="#f87171" onClick={()=>confirmDelete(p)}>✕</ActionBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: MEDICINES ───────────────────────────────────────────────────────
  const renderMedicines = () => (
    <div>
      <BranchHeader title="Medicines"/>
      {locationPatients.map(p=>{
        const medTotal=(p.medicines||[]).reduce((s,m)=>s+(m.qty*m.rate),0);
        return (
          <div key={p.uhid} className="hms-card">
            <CardRow title={<><span className="hms-td-hi">{p.patientName||p.name}</span> <span className="hms-td-mono">{p.uhid}</span> <span style={{ color:"#f59e0b" }}>· {fmt(medTotal)}</span></>}
              action={<button className="hms-add-btn" onClick={()=>openMedEditor(p)}>Edit Medicines</button>}/>
            {!(p.medicines||[]).length ? <div className="hms-empty">No medicines.</div> : (
              <TableWrap heads={["Medicine","Qty","Rate/unit","Total"]}>
                {(p.medicines||[]).map((m,i)=>(
                  <tr key={i}>
                    <Td hi>{m.name}</Td>
                    <Td><Badge col={accent}>{m.qty}</Badge></Td>
                    <Td>{fmt(m.rate)}</Td>
                    <Td><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></Td>
                  </tr>
                ))}
              </TableWrap>
            )}
          </div>
        );
      })}
      {!locationPatients.length && <div className="hms-card hms-empty">No patients for {bc.label}.</div>}
    </div>
  );

  // ── PAGE: REPORTS ─────────────────────────────────────────────────────────
  const renderReports = () => (
    <div>
      <BranchHeader title="Reports"/>
      {locationPatients.map(p=>(
        <div key={p.uhid} className="hms-card">
          <CardRow title={<><span className="hms-td-hi">{p.patientName||p.name}</span> <span className="hms-td-mono">{p.uhid} · {(p.reports||[]).length} report(s)</span></>}
            action={
              <div style={{ display:"flex", gap:8 }}>
                <ActionBtn col="#f59e0b" onClick={()=>{exportCSV(`reports_${p.uhid}.csv`,(p.reports||[]).map(r=>({Report:r.name,Date:r.date,Result:r.result})),["Report","Date","Result"]);toast("Downloaded");}}>↓ CSV</ActionBtn>
                <button className="hms-add-btn" onClick={()=>openReportEditor(p)}>Edit</button>
              </div>
            }/>
          {!(p.reports||[]).length ? <div className="hms-empty">No reports.</div> : (
            <TableWrap heads={["Report","Date","Result"]}>
              {(p.reports||[]).map((r,i)=>(
                <tr key={i}><Td hi>{r.name}</Td><Td sm>{r.date}</Td><Td>{r.result}</Td></tr>
              ))}
            </TableWrap>
          )}
        </div>
      ))}
      {!locationPatients.length && <div className="hms-card hms-empty">No patients.</div>}
    </div>
  );

  // ── PAGE: BILLING ─────────────────────────────────────────────────────────
  const renderBilling = () => {
    const billRows = locationPatients.flatMap(p=>(p.admissions||[]).filter(a=>a.billing&&(parseFloat(a.billing.paidNow)||0)+(parseFloat(a.billing.advance)||0)>0).map(a=>({patient:p.patientName||p.name,uhid:p.uhid,admNo:a.admNo,advance:parseFloat(a.billing.advance)||0,paidNow:parseFloat(a.billing.paidNow)||0,discount:parseFloat(a.billing.discount)||0,mode:a.billing.paymentMode||"—",total:(parseFloat(a.billing.advance)||0)+(parseFloat(a.billing.paidNow)||0)})));
    const grandTotal=billRows.reduce((s,r)=>s+r.total,0); const totalAdv=billRows.reduce((s,r)=>s+r.advance,0);
    return (
      <div>
        <BranchHeader title="Billing"/>
        <div className="hms-stat-grid">
          {[{label:"Total Collected",val:fmt(grandTotal),col:"#f59e0b"},{label:"Advance",val:fmt(totalAdv),col:"#34d399"},{label:"Records",val:billRows.length,col:"#34d399"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{ border:`1px solid ${s.col}18` }}>
              <div className="hms-stat-num" style={{ color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="hms-card">
          {!billRows.length ? <div className="hms-empty">No billing records.</div> : (
            <TableWrap heads={["Patient","UHID","Adm#","Advance","Paid","Discount","Mode","Total"]}>
              {billRows.map((r,i)=>(
                <tr key={i}>
                  <Td hi>{r.patient}</Td>
                  <Td mono>{r.uhid}</Td>
                  <Td><Badge col={accent}>#{r.admNo}</Badge></Td>
                  <Td><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(r.advance)}</span></Td>
                  <Td><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(r.paidNow)}</span></Td>
                  <Td>{r.discount>0?<span style={{ color:"#c084fc" }}>{fmt(r.discount)}</span>:"—"}</Td>
                  <Td sm>{r.mode}</Td>
                  <Td><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(r.total)}</span></Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: EXPORT ──────────────────────────────────────────────────────────
  const renderExport = () => {
    const exportOptions = [
      {id:"discharge",     label:"Discharge Summary",   desc:"Full clinical summary .txt per patient", icon:"📋"},
      {id:"medical",       label:"Medical History",      desc:"Medical history .txt per patient",       icon:"🏥"},
      {id:"medicines",     label:"Medicines",            desc:"Medicines with qty & rates as .csv",     icon:"💊"},
      {id:"reports",       label:"Investigation Reports",desc:"Lab/radiology results as .csv",          icon:"🔬"},
      {id:"patientHistory",label:"Patient History",      desc:"Full patient list as .xlsx",             icon:"📊"},
    ];
    const previewPts = getExportPatients();
    return (
      <div>
        <PageHeader title="Export" subtitle="Download summaries and data for any branch"/>
        <div className="hms-g2" style={{ marginBottom:20 }}>
          <div className="hms-card">
            <div className="hms-section-label">Filters</div>
            <label className="hms-lbl">Branch</label>
            <select className="hms-sel" value={exportBranchFilter} onChange={e=>setExportBranchFilter(e.target.value)}>
              <option value="All">All Hospitals</option><option value="Laxmi Nagar">Laxmi Nagar</option><option value="Raya">Raya</option>
            </select>
            <label className="hms-lbl">Summary Type</label>
            <select className="hms-sel" value={exportSumType} onChange={e=>setExportSumType(e.target.value)}>
              <option value="All">All Types</option>{SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{ fontSize:10, color:"#64748b" }}>{previewPts.length} patient(s) match</div>
          </div>
          <div className="hms-card">
            <div className="hms-section-label">Export Type</div>
            {exportOptions.map(o=>(
              <div key={o.id} className="hms-export-type-row"
                style={{ background:exportType===o.id?`${accent}18`:"transparent", borderColor:exportType===o.id?`${accent}50`:"#1a2540" }}
                onClick={()=>setExportType(o.id)}>
                <span style={{ fontSize:15 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:exportType===o.id?accent:"inherit" }}>{o.label}</div>
                  <div style={{ fontSize:9, color:"#64748b" }}>{o.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="hms-export-main-btn" onClick={doExport}>
          ↓ Download {exportOptions.find(o=>o.id===exportType)?.label} — {previewPts.length} record(s)
        </button>
        <div className="hms-card" style={{ marginTop:16 }}>
          <div className="hms-section-label" style={{ marginBottom:10 }}>Quick Download per Patient</div>
          <TableWrap heads={["Patient","Branch","Summary","Discharge","Med Hist","Meds","Reports"]}>
            {allPatientsFlat.map(p=>(
              <tr key={p.uhid+p._branch}>
                <Td><span className="hms-td-hi">{p.patientName||p.name}</span><div className="hms-td-mono">{p.uhid}</div></Td>
                <Td><Badge col={BC[p._branch]?.accent||"#6b7280"}>{p._branchLabel}</Badge></Td>
                <Td><Badge col={SUMMARY_META[p.dischargeSummary?.type]?.color||"#6b7280"}>{p.dischargeSummary?.type||"—"}</Badge></Td>
                <Td><ActionBtn col="#f59e0b" onClick={()=>downloadDischarge(p,p._branchLabel)}>↓</ActionBtn></Td>
                <Td><ActionBtn col="#34d399" onClick={()=>{exportTxt(`medhistory_${p.uhid}.txt`,`Medical History\nPatient: ${p.patientName||p.name}\nUHID: ${p.uhid}`);toast("Downloaded");}}>↓</ActionBtn></Td>
                <Td><ActionBtn col="#34d399" onClick={()=>{exportCSV(`meds_${p.uhid}.csv`,(p.medicines||[]).map(m=>({Medicine:m.name,Qty:m.qty,Rate:m.rate,Total:m.qty*m.rate})),["Medicine","Qty","Rate","Total"]);toast("Downloaded");}}>↓</ActionBtn></Td>
                <Td><ActionBtn col="#c084fc" onClick={()=>{exportCSV(`reports_${p.uhid}.csv`,(p.reports||[]).map(r=>({Report:r.name,Date:r.date,Result:r.result})),["Report","Date","Result"]);toast("Downloaded");}}>↓</ActionBtn></Td>
              </tr>
            ))}
          </TableWrap>
        </div>
      </div>
    );
  };

  // ── PAGE: TASKS ───────────────────────────────────────────────────────────
  const renderTasks = () => {
    const ts = { total:tasks.length, pending:tasks.filter(t=>t.status==="Pending").length, inprogress:tasks.filter(t=>t.status==="In Progress").length, completed:tasks.filter(t=>t.status==="Completed").length, urgent:tasks.filter(t=>t.priority==="Urgent"&&t.status!=="Completed").length };
    return (
      <div>
        <PageHeader title="Task Manager" subtitle="Assign and track tasks across all departments"/>
        <div className="hms-stat-grid">
          {[{label:"Total",val:ts.total,col:accent},{label:"Pending",val:ts.pending,col:"#f59e0b"},{label:"In Progress",val:ts.inprogress,col:"#38bdf8"},{label:"Completed",val:ts.completed,col:"#34d399"},{label:"Urgent",val:ts.urgent,col:"#f87171"}].map((s,i)=>(
            <div key={i} className="hms-stat-card" style={{ padding:"12px 14px", border:`1px solid ${s.col}18` }}>
              <div className="hms-stat-num" style={{ fontSize:20, color:s.col }}>{s.val}</div>
              <div className="hms-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="hms-card">
          <CardRow title="All Tasks" action={<button className="hms-add-btn" onClick={openNewTask}>+ Assign Task</button>}/>
          {!tasks.length ? <EmptyState icon="✅" label="No tasks yet" sub='Click "Assign Task" to create the first task'/> : (
            <TableWrap heads={["Task","Assigned To","Dept","Priority","Status","Due Date","Patient","Created By","Actions"]}>
              {tasks.map((t,i)=>(
                <tr key={t.id} className="hms-tr-alt">
                  <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{ fontSize:9, color:"#64748b", marginTop:2, maxWidth:180 }}>{t.description.slice(0,60)}{t.description.length>60?"…":""}</div>}</Td>
                  <Td>{t.assignedTo}</Td>
                  <Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td>
                    <select className="hms-task-status-sel"
                      style={{ background:TASK_STATUS_META[t.status]?.bg||"transparent", borderColor:`${TASK_STATUS_META[t.status]?.color||"#6b7280"}40`, color:TASK_STATUS_META[t.status]?.color||"inherit" }}
                      value={t.status} onChange={e=>updateTaskStatus(t.id,e.target.value)}>
                      {TASK_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </Td>
                  <Td sm style={{ color:t.dueDate&&new Date(t.dueDate)<new Date()&&t.status!=="Completed"?"#f87171":"#64748b" }}>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{t.patientName ? <span style={{ color:"#38bdf8" }}>{t.patientName}<div style={{ fontSize:9, color:"#64748b" }}>{t.patientUhid}</div></span> : "—"}</Td>
                  <Td sm>{t.createdBy||"—"}</Td>
                  <Td>
                    <div style={{ display:"flex", gap:4 }}>
                      <ActionBtn col={accent} onClick={()=>openEditTask(t)}>✎ Edit</ActionBtn>
                      <ActionBtn col="#f87171" onClick={()=>deleteTask(t.id)}>✕</ActionBtn>
                    </div>
                  </Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: TASK REPORT ─────────────────────────────────────────────────────
  const renderTaskReport = () => {
    const periodLabel = { all:"All Time", today:"Today", week:"This Week", month:"This Month" };
    const empMap = {};
    filteredTaskReport.forEach(t => {
      if (!empMap[t.assignedTo]) empMap[t.assignedTo]={name:t.assignedTo,dept:t.department,total:0,completed:0,pending:0,inprogress:0,onhold:0};
      empMap[t.assignedTo].total++;
      if(t.status==="Completed")empMap[t.assignedTo].completed++;
      else if(t.status==="Pending")empMap[t.assignedTo].pending++;
      else if(t.status==="In Progress")empMap[t.assignedTo].inprogress++;
      else if(t.status==="On Hold")empMap[t.assignedTo].onhold++;
    });
    const empList = Object.values(empMap);
    return (
      <div>
        <PageHeader title="Task Report" subtitle="Filter and download task reports by time period, department, or employee"/>
        <div className="hms-card">
          <div className="hms-section-label">Filters</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:8 }}>
            <div><label className="hms-lbl">Time Period</label>
              <select className="hms-sel" value={taskReportFilter.period} onChange={e=>setTaskReportFilter(f=>({...f,period:e.target.value}))}>
                <option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option>
              </select>
            </div>
            <div><label className="hms-lbl">Department</label>
              <select className="hms-sel" value={taskReportFilter.dept} onChange={e=>setTaskReportFilter(f=>({...f,dept:e.target.value}))}>
                <option value="All">All Departments</option>
                {allDeptOptions.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="hms-lbl">Status</label>
              <select className="hms-sel" value={taskReportFilter.status} onChange={e=>setTaskReportFilter(f=>({...f,status:e.target.value}))}>
                <option value="All">All Status</option>{TASK_STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="hms-lbl">Employee Name</label>
              <input className="hms-inp" style={{ marginBottom:0 }} placeholder="Search by name…" value={taskReportFilter.empName} onChange={e=>setTaskReportFilter(f=>({...f,empName:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
            <ActionBtn col="#34d399" onClick={()=>{exportTasksXLSX(filteredTaskReport,`task_report_${taskReportFilter.period}_${taskReportFilter.dept}.xlsx`);toast("Task report exported as XLSX");}}>↓ XLSX</ActionBtn>
            <ActionBtn col="#38bdf8" onClick={()=>{exportCSV(`task_report_${taskReportFilter.period}.csv`,filteredTaskReport.map(t=>({TaskID:t.id,Title:t.title,AssignedTo:t.assignedTo,Department:t.department,Priority:t.priority,Status:t.status,DueDate:t.dueDate||"—",CreatedDate:t.createdAt?.split("T")[0]||"—",Description:t.description||"—",CompletedDate:t.completedAt?.split("T")[0]||"—",PatientName:t.patientName||"—",PatientUHID:t.patientUhid||"—"})),["TaskID","Title","AssignedTo","Department","Priority","Status","DueDate","CreatedDate","Description","CompletedDate","PatientName","PatientUHID"]);toast("Task report exported as CSV");}}>↓ CSV</ActionBtn>
            <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b" }}><strong>{filteredTaskReport.length}</strong> record{filteredTaskReport.length!==1?"s":""} · <span style={{ color:accent }}>{periodLabel[taskReportFilter.period]}</span></span>
          </div>
        </div>
        <div className="hms-g4" style={{ marginBottom:18 }}>
          {TASK_STATUS.map(s=>{ const m=TASK_STATUS_META[s]||{color:"#6b7280",bg:"#6b728018"}; return (
            <div key={s} className="hms-stat-card" style={{ padding:"10px 14px", textAlign:"center", border:`1px solid ${m.color}18` }}>
              <div className="hms-stat-num" style={{ fontSize:20, color:m.color }}>{filteredTaskReport.filter(t=>t.status===s).length}</div>
              <div className="hms-stat-label">{s}</div>
            </div>
          );})}
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{ marginBottom:14 }}>Employee Task Summary — {periodLabel[taskReportFilter.period]}</div>
          {!empList.length ? <div className="hms-empty">No tasks match current filters.</div> : (
            <TableWrap heads={["Employee","Department","Total","Pending","In Progress","Completed","On Hold","Completion %"]}>
              {empList.map((e,i)=>{
                const pct=e.total?Math.round((e.completed/e.total)*100):0;
                return (
                  <tr key={i}>
                    <Td hi>{e.name}</Td>
                    <Td><Badge col={accent}>{e.dept}</Badge></Td>
                    <Td><strong>{e.total}</strong></Td>
                    <Td><span style={{ color:"#f59e0b" }}>{e.pending}</span></Td>
                    <Td><span style={{ color:"#38bdf8" }}>{e.inprogress}</span></Td>
                    <Td><span style={{ color:"#34d399" }}>{e.completed}</span></Td>
                    <Td><span style={{ color:"#f87171" }}>{e.onhold}</span></Td>
                    <Td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="hms-progress-bar-sm"><div className="hms-progress-fill" style={{ width:`${pct}%`, background:"#34d399" }}/></div>
                        <span style={{ fontSize:10, fontWeight:700, color:pct>=75?"#34d399":pct>=50?"#f59e0b":"#f87171", minWidth:32 }}>{pct}%</span>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}
        </div>
        <div className="hms-card">
          <div className="hms-card-title" style={{ marginBottom:14 }}>Detailed Task List ({filteredTaskReport.length})</div>
          {!filteredTaskReport.length ? <div className="hms-empty">No tasks match the selected filters.</div> : (
            <TableWrap heads={["Task ID","Title","Assigned To","Dept","Priority","Status","Due Date","Created","Patient","Completed"]}>
              {filteredTaskReport.map((t,i)=>(
                <tr key={t.id} className="hms-tr-alt">
                  <Td mono>{t.id}</Td>
                  <Td><span className="hms-td-hi">{t.title}</span>{t.description&&<div style={{ fontSize:9, color:"#64748b", marginTop:1 }}>{t.description.slice(0,50)}{t.description.length>50?"…":""}</div>}</Td>
                  <Td>{t.assignedTo}</Td>
                  <Td><Badge col={accent}>{t.department}</Badge></Td>
                  <Td><PriorityPill p={t.priority}/></Td>
                  <Td><StatusPill s={t.status}/></Td>
                  <Td sm>{fmtDt(t.dueDate)}</Td>
                  <Td sm>{t.createdAt?.split("T")[0]||"—"}</Td>
                  <Td sm>{t.patientName ? <span style={{ color:"#38bdf8" }}>{t.patientName}</span> : "—"}</Td>
                  <Td><span style={{ fontSize:10, color:"#34d399" }}>{t.completedAt?.split("T")[0]||"—"}</span></Td>
                </tr>
              ))}
            </TableWrap>
          )}
        </div>
      </div>
    );
  };

  // ── PAGE: DEPARTMENTS ─────────────────────────────────────────────────────
  const renderDepartments = () => {
    const deptList = [...DEPT_OPTIONS.map(name=>({id:`default-${name}`,name,description:`${name} Department`,isDefault:true,memberCount:employees.filter(e=>e.dept===name).length})),...departments.filter(d=>!DEPT_OPTIONS.includes(d.name)).map(d=>({...d,isDefault:false,memberCount:employees.filter(e=>e.dept===d.name).length}))];
    return (
      <div>
        <PageHeader title="Departments" subtitle="Manage hospital departments"/>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
          <button className="hms-add-btn-lg" onClick={()=>setShowDeptModal(true)}>+ Create Department</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:20 }}>
          {deptList.map((dept,i)=>{
            const dA=DEPT_ACCENT_CYCLE[i%DEPT_ACCENT_CYCLE.length];
            const deptTasks=tasks.filter(t=>t.department===dept.name);
            const completedTasks=deptTasks.filter(t=>t.status==="Completed").length;
            const pct=deptTasks.length?Math.round((completedTasks/deptTasks.length)*100):0;
            return (
              <div key={dept.id} className="hms-dept-card" style={{ borderColor:`${dA}30`, borderTopColor:dA }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${dA}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{DEPT_ICONS[dept.name]||"🏢"}</div>
                  {dept.isDefault ? <Badge col={accent}>DEFAULT</Badge> : <button onClick={()=>setDepartments(prev=>prev.filter(d=>d.id!==dept.id))} style={{ background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:12,padding:"2px 6px" }}>✕</button>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{dept.name}</div>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:12, lineHeight:1.5 }}>{dept.description}</div>
                <div style={{ display:"flex", gap:10, marginBottom:deptTasks.length?10:0 }}>
                  {[{label:"Members",val:dept.memberCount,col:dA},{label:"Tasks",val:deptTasks.length,col:"#38bdf8"},{label:"Done",val:completedTasks,col:"#34d399"}].map((s,j)=>(
                    <div key={j} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18,fontWeight:800,color:s.col }}>{s.val}</div>
                      <div style={{ fontSize:9,color:"#64748b" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {deptTasks.length>0 && (
                  <div>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginBottom:4 }}><span>Progress</span><span>{pct}%</span></div>
                    <ProgressBar pct={pct} col={dA}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── PAGE: EMPLOYEES ───────────────────────────────────────────────────────
  const renderEmployees = () => (
    <div>
      <PageHeader title="Employee Management" subtitle="Manage staff accounts and credentials"/>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <button
          className="hms-add-btn-lg"
          onClick={() => {
            setEditEmpId(null);
            setEmpPassErr("");
            const branchCode = getEmployeeBranchCode();
            setEmpForm({fullName:"",username:"",empId:buildEmployeeId(branchCode),dept:"HOD",email:"",phone:"",role:"hod",password:"",confirmPassword:""});
            setShowEmpModal(true);
          }}
        >
          + Create Employee
        </button>
      </div>
      {!employees.length ? <EmptyState icon="👤" label="No employees yet" sub='Click "Create Employee" to add your first employee'/> : (
        <div className="hms-card" style={{ padding:0, overflow:"hidden" }}>
          <TableWrap heads={["Emp ID","Full Name","Username","Role","Department","Email","Phone","Status","Actions"]}>
            {employees.map((emp,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid #1e2a3a" }}>
                <Td mono style={{ color:accent }}>{emp.empId||emp.id}</Td>
                <Td hi>{emp.fullName||emp.name}</Td>
                <Td sm>{emp.username}</Td>
                <Td><Badge col="#818cf8">{emp.role||"Staff"}</Badge></Td>
                <Td><Badge col={accent}>{emp.dept}</Badge></Td>
                <Td sm>{emp.email}</Td>
                <Td sm>{emp.phone}</Td>
                <Td><Badge col={emp.status==="Inactive"?"#f87171":"#34d399"}>{emp.status||"Active"}</Badge></Td>
                <Td>
                  <div style={{ display:"flex", gap:6 }}>
                    <ActionBtn col={accent} onClick={() => openEditEmployee(emp)}>✎ Edit / Reset</ActionBtn>
                    <ActionBtn col={emp.status==="Inactive"?"#34d399":"#f87171"} onClick={() => handleToggleActive(emp, i)}>
                      {emp.status==="Inactive"?"✓ Activate":"⊘ Deactivate"}
                    </ActionBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </TableWrap>
        </div>
      )}
    </div>
  );

  // ── PAGE: PROFILE ─────────────────────────────────────────────────────────
  const renderProfile = () => (
    <div>
      <BranchHeader title="My Profile"/>
      <div className="hms-prof-card" style={{ display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center", border:`1px solid ${accent}30` }}>
        <div style={{ width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${accent},#818cf8)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff",marginBottom:12 }}>{initials(currentDisplayName)}</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>{currentDisplayName}</div>
        <div style={{ fontSize:11, color:accent, fontWeight:600, marginBottom:4 }}>{currentUser?.dept||currentUser?.role?.toUpperCase()}</div>
        <div style={{ fontSize:10, color:"#64748b", marginBottom:10 }}>{bc.label} Branch</div>
        <Badge col="#34d399">Active</Badge>
      </div>
      <div className="hms-card">
        <div className="hms-card-title" style={{ marginBottom:14 }}>Account Details</div>
        <div className="hms-g2">
          <div>
            <label className="hms-lbl">First Name</label>
            <input className="hms-inp" value={profileForm.first_name} onChange={(e)=>setProfileForm((f)=>({...f, first_name: e.target.value}))} />
          </div>
          <div>
            <label className="hms-lbl">Last Name</label>
            <input className="hms-inp" value={profileForm.last_name} onChange={(e)=>setProfileForm((f)=>({...f, last_name: e.target.value}))} />
          </div>
        </div>
        <div className="hms-g2">
          <div>
            <label className="hms-lbl">Email</label>
            <input className="hms-inp" type="email" value={profileForm.email} onChange={(e)=>setProfileForm((f)=>({...f, email: e.target.value}))} />
          </div>
          <div>
            <label className="hms-lbl">Phone</label>
            <input className="hms-inp" value={profileForm.phone_number} onChange={(e)=>setProfileForm((f)=>({...f, phone_number: e.target.value}))} />
          </div>
        </div>
        <div className="hms-g2">
          <div>
            <label className="hms-lbl">Employee Code</label>
            <input className="hms-inp" value={profileForm.emp_id} onChange={(e)=>setProfileForm((f)=>({...f, emp_id: e.target.value}))} />
          </div>
          <div>
            <label className="hms-lbl">Role</label>
            <input className="hms-inp" value={currentUser?.role || ""} readOnly />
          </div>
        </div>
        <div className="hms-modal-foot" style={{ justifyContent:"flex-end" }}>
          <button className="hms-save-btn" onClick={saveMyProfile}>Save Profile</button>
        </div>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch(activeTab) {
      case "home":        return renderHome();
      case "patients":    return renderPatients();
      case "discharge":   return renderDischarge();
      case "medicines":   return renderMedicines();
      case "reports":     return renderReports();
      case "billing":     return renderBilling();
      case "export":      return renderExport();
      case "tasks":       return renderTasks();
      case "taskreport":  return renderTaskReport();
      case "departments": return renderDepartments();
      case "employees":   return renderEmployees();
      case "profile":     return renderProfile();
      default:            return renderHome();
    }
  };

  const sbWidth = collapsed ? 52 : 220;

  return (
    <div className="hms-wrap">
      <style>{DYNAMIC_CSS(accent, isDark)}</style>

      {/* NOTIFICATION */}
      {notif && (
        <div className="hms-notif" style={{ background:notif.type==="ok"?(isDark?"#052e1c":"#f0fdf4"):(isDark?"#3b0f05":"#fef2f2"), borderColor:notif.type==="ok"?"#34d399":"#f87171", color:notif.type==="ok"?"#86efac":"#fca5a5" }}>
          {notif.type==="ok"?"✓ ":"⚠ "}{notif.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="hms-hdr">
        <div className="hms-logo-row">
          <img src="/app_icon.png" alt="logo" style={{ width:30,height:30,borderRadius:8,objectFit:"cover" }}/>
          <div><div className="hms-logo-text">Sangi Hospital</div><div className="hms-logo-sub">{currentUser?.dept||currentUser?.role} · Management</div></div>
        </div>
        <div className="hms-hdr-right">
          <span className="hms-role-badge">{currentUser?.role?.toUpperCase()}</span>
          <ThemeModeDock variant="inline" />
          <div className="hms-avatar-pill">
            <span className="hms-avatar-name">{currentDisplayName}</span>
            <div className="hms-avatar">{initials(currentDisplayName)}</div>
          </div>
          <button className="hms-logout-btn" onClick={onLogout}>↪ Logout</button>
        </div>
      </header>

      <div className="hms-body">
        {/* SIDEBAR */}
        <aside className="hms-sb" style={{ width:sbWidth }}>
          <div className="hms-sb-top" style={{ padding:collapsed?"14px 8px":"14px 12px" }}>
            {!collapsed && <div className="hms-branch-label">Branch</div>}
            {collapsed ? (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {allowedBranchKeys.map(bk=>(
                  <button key={bk} className="hms-branch-dot-btn" onClick={()=>setViewBranch(bk)} style={{ background:viewBranch===bk?BC[bk].dim:"transparent" }}>
                    <div className="hms-branch-dot" style={{ background:BC[bk].accent }}/>
                  </button>
                ))}
              </div>
            ) : (
              <select className="hms-branch-select" value={viewBranch} onChange={e=>setViewBranch(e.target.value)}>
                {allowedBranchKeys.map(bk=><option key={bk} value={bk}>{BC[bk].label}</option>)}
              </select>
            )}
          </div>

          <nav className="hms-nav-wrap">
            {!collapsed && <div className="hms-nav-section" style={{ padding:"0 14px" }}>Menu</div>}
            {NAV.map(item=>(
              <div key={item.id} className={`hms-nav-item${activeTab===item.id?" active":""}`}
                style={{ padding:collapsed?"10px 0":"10px 14px", justifyContent:collapsed?"center":"flex-start" }}
                onClick={()=>setActiveTab(item.id)} title={item.label}>
                <span className="hms-nav-icon">{item.icon}</span>
                {!collapsed && item.label}
              </div>
            ))}
          </nav>

          {!collapsed && (
            <div style={{ padding:"10px 12px", borderTop:"1px solid #1e2030", borderBottom:"1px solid #1e2030" }}>
              <div className="hms-signed-in">Signed in as</div>
              <div className="hms-signed-name">{currentDisplayName}</div>
              <div className="hms-signed-role">{currentUser?.dept||currentUser?.role}</div>
            </div>
          )}

          <div className="hms-sb-bot" style={{ padding:collapsed?"10px 8px":"10px 12px" }}>
            <button className="hms-col-btn" onClick={()=>setCollapsed(x=>!x)}>{collapsed?"▶":"◀"}</button>
          </div>
        </aside>

        <main className="hms-main">{renderContent()}</main>
      </div>

      {/* ══ TASK MODAL ══ */}
      {showTaskModal && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowTaskModal(false),setEditTask(null))}>
          <div className="hms-modal-box" style={{ width:520 }}>
            <div className="hms-modal-title">{editTask?"Edit Task":"Assign New Task"}</div>

            <label className="hms-lbl">Task Title *</label>
            <input className="hms-inp" placeholder="E.g. Prepare daily billing report" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}/>

            <label className="hms-lbl">Description</label>
            <textarea className="hms-textarea" placeholder="Task details…" value={taskForm.description} onChange={e=>setTaskForm(f=>({...f,description:e.target.value}))}/>

            <div className="hms-g2">
              <div>
                <label className="hms-lbl">Assigned To *</label>
                <select className="hms-sel" value={taskForm.assignedToId} onChange={e=>setTaskForm(f=>({...f,assignedToId:e.target.value}))}>
                  <option value="">Select employee</option>
                  {taskAssignableEmployees.map((employee) => {
                    const fullName = employee.fullName || employee.name || employee.username;
                    const identity = employee.empId || employee.username || `ID-${employee.id}`;
                    return (
                      <option key={employee.id} value={String(employee.id)}>
                        {`${fullName} (${identity})`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="hms-lbl">Department</label>
                <select className="hms-sel" value={taskForm.department} onChange={e=>setTaskForm(f=>({...f,department:e.target.value}))}>
                  {allDeptOptions.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="hms-g2">
              <div>
                <label className="hms-lbl">Priority</label>
                <select className="hms-sel" value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))}>
                  {TASK_PRIORITY.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="hms-lbl">Due Date</label>
                <input className="hms-inp" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))}/>
              </div>
            </div>

            {/* ── PATIENT SELECTION ── */}
            <label className="hms-lbl">Link to Patient <span style={{ color:"#64748b", fontWeight:400 }}>(optional)</span></label>
            {taskForm.patientUhid ? (
              <div className="hms-patient-selected-pill">
                🧑‍⚕️ {taskForm.patientName}
                <span style={{ color:"#64748b", fontSize:10, fontWeight:400 }}> · {taskForm.patientUhid}</span>
                <button className="hms-patient-clear-btn" onClick={()=>setTaskForm(f=>({...f,patientUhid:"",patientName:""}))}>✕</button>
              </div>
            ) : (
              <>
                <input
                  className="hms-patient-search"
                  placeholder="Search by patient name or UHID…"
                  value={taskPatientSearch}
                  onChange={e=>setTaskPatientSearch(e.target.value)}
                />
                <div className="hms-patient-select-box">
                  {filteredTaskPatients.length === 0 ? (
                    <div style={{ padding:"10px 12px", fontSize:11, color:"#64748b", textAlign:"center" }}>No patients found</div>
                  ) : filteredTaskPatients.map(p=>(
                    <div
                      key={p.uhid}
                      className={`hms-patient-select-item${taskForm.patientUhid===p.uhid?" selected":""}`}
                      onClick={()=>{ setTaskForm(f=>({...f,patientUhid:p.uhid,patientName:p.name})); setTaskPatientSearch(""); }}
                    >
                      <div>
                        <span style={{ fontWeight:600, color: isDark?"#e2e8f0":"#1e293b" }}>{p.name}</span>
                        <span style={{ marginLeft:8, color:"#64748b", fontSize:10 }}>{p.uhid}</span>
                      </div>
                      <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                        <span style={{ fontSize:9, padding:"2px 6px", borderRadius:10, background:p.status==="Admitted"?"#34d39918":"#6b728018", color:p.status==="Admitted"?"#34d399":"#6b7280", border:`1px solid ${p.status==="Admitted"?"#34d39940":"#6b728040"}` }}>{p.status}</span>
                        <span style={{ fontSize:9, color:"#64748b" }}>{p.branch}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowTaskModal(false);setEditTask(null);}}>Cancel</button>
              <button className="hms-save-btn" onClick={saveTask}>{editTask?"Update Task":"Assign Task"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DEPARTMENT MODAL ══ */}
      {showDeptModal && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeptModal(false)}>
          <div className="hms-modal-box" style={{ width:420 }}>
            <div className="hms-modal-title">Create New Department</div>
            <label className="hms-lbl">Department Name *</label>
            <input className="hms-inp" placeholder="E.g. Radiology" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))}/>
            <label className="hms-lbl">Description</label>
            <input className="hms-inp" placeholder="Brief description" value={deptForm.description} onChange={e=>setDeptForm(f=>({...f,description:e.target.value}))}/>
            <label className="hms-lbl">Department Head (optional)</label>
            <input className="hms-inp" placeholder="Name of HOD" value={deptForm.head} onChange={e=>setDeptForm(f=>({...f,head:e.target.value}))}/>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>setShowDeptModal(false)}>Cancel</button>
              <button className="hms-save-btn" onClick={saveDepartment}>Create Department</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EMPLOYEE MODAL ══ */}
      {showEmpModal && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowEmpModal(false),setEmpPassErr(""),setEditEmpId(null))}>
          <div className="hms-modal-box" style={{ width:520 }}>
            <div className="hms-modal-title">{editEmpId ? "Edit Employee Details" : "Create New Employee"}</div>
            <div className="hms-g2">
              {[["Full Name","fullName","text","Jane Doe"],["Username","username","text","jane.doe"],["Employee ID","empId","text","EMP-001"],["Email","email","email","jane@hospital.com"],["Phone","phone","tel","+91 98765 43210"]].map(([lbl,k,type,ph])=>(
                <div key={k}>
                  <label className="hms-lbl">{lbl}</label>
                  <input type={type} placeholder={ph} value={empForm[k]} className="hms-inp" onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}} disabled={k==="username" && editEmpId || (k==="empId" && !editEmpId)}/>
                </div>
              ))}
            </div>
            <label className="hms-lbl">Access Role</label>
            <select
              className="hms-sel"
              value={empForm.role}
              onChange={e => {
                const nextRole = e.target.value;
                const nextDept = EMPLOYEE_ROLE_OPTIONS.find(option => option.value === nextRole)?.label || empForm.dept;
                setEmpForm(f => ({ ...f, role: nextRole, dept: nextDept, empId: editEmpId ? f.empId : buildEmployeeId(getEmployeeBranchCode()) }));
              }}
            >
              {EMPLOYEE_ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <label className="hms-lbl">Department</label>
            <select className="hms-sel" value={empForm.dept} onChange={e=>setEmpForm(f=>({...f,dept:e.target.value}))}>
              {allDeptOptions.map(d=><option key={d}>{d}</option>)}
            </select>
            <div className="hms-g2">
              {[["Password","password",empShowPass,setEmpShowPass],["Confirm Password","confirmPassword",empShowConfirm,setEmpShowConfirm]].map(([lbl,k,show,setShow])=>(
                <div key={k}>
                  <label className="hms-lbl">{lbl} {editEmpId && <span style={{fontSize:9}}>(Leave blank to keep current)</span>}</label>
                  <div className="hms-pass-wrap">
                    <input type={show?"text":"password"} placeholder={editEmpId ? "Leave blank to keep current" : "••••••••"} value={empForm[k]} className="hms-inp" style={{ paddingRight:50 }} onChange={e=>{setEmpForm(f=>({...f,[k]:e.target.value}));setEmpPassErr("");}}/>
                    <button type="button" className="hms-pass-toggle" onClick={()=>setShow(p=>!p)}>{show?"HIDE":"SHOW"}</button>
                  </div>
                </div>
              ))}
            </div>
            {empPassErr && <div className="hms-err-text">{empPassErr}</div>}
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowEmpModal(false);setEmpPassErr("");setEditEmpId(null);}}>Cancel</button>
              <button className="hms-save-btn" onClick={saveEmployee}>{editEmpId ? "Save Changes" : "Create Employee"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MED DRAWER ══ */}
      {showMedModal && editMedPt && (
        <MedDrawer editMedPt={editMedPt} onClose={()=>{setShowMedModal(false);setEditMedPt(null);}} updateMed={updateMed} addMedRow={addMedRow} delMedRow={delMedRow} saveMeds={saveMeds} fmt={fmt} canEditRate={true}/>
      )}

      {/* ══ VIEW SUMMARY MODAL ══ */}
      {showViewModal && viewPt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowViewModal(false),setViewPt(null))}>
          <div className="hms-modal-box" style={{ width:640 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div className="hms-modal-title">Discharge Summary</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <SummaryPill type={viewPt.dischargeSummary?.type}/>
                  <span className="hms-td-mono">{viewPt.uhid}</span>
                </div>
              </div>
              <button className="hms-logout-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>✕</button>
            </div>
            <div className="hms-stat-card" style={{ padding:"12px 14px", marginBottom:14, border:"1px solid #f59e0b18" }}>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                {[["Patient",viewPt.patientName||viewPt.name],["Age/Gender",`${viewPt.ageYY||viewPt.age}Y / ${viewPt.gender}`],["Blood Group",viewPt.bloodGroup||"—"],["Phone",viewPt.phone||"—"],["Admit Date",fmtDt(viewPt.admissions?.[0]?.dateTime)]].map(([k,v])=>(
                  <div key={k}><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{ fontWeight:700 }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div className="hms-section-label">Clinical Details</div>
            {[["Diagnosis",viewPt.dischargeSummary?.diagnosis],["Treatment",viewPt.dischargeSummary?.treatment],["Treating Doctor",viewPt.dischargeSummary?.doctorName],["Discharge Date",fmtDt(viewPt.dischargeSummary?.date)],["Expected DOD",fmtDt(viewPt.dischargeSummary?.expectedDod)],["Follow-up",viewPt.dischargeSummary?.followUp],["Notes",viewPt.dischargeSummary?.notes]].map(([k,v])=>(
              <div key={k} className="hms-view-row"><div className="hms-view-key">{k}</div><div className="hms-view-val" style={{ color:v&&v!=="—"?"inherit":"#64748b", fontStyle:v&&v!=="—"?"normal":"italic" }}>{v||"Not set"}</div></div>
            ))}
            {(viewPt.medicines||[]).length>0 && <>
              <div className="hms-section-label" style={{ marginTop:14 }}>Medicines</div>
              <TableWrap heads={["Medicine","Qty","Rate","Total"]}>
                {(viewPt.medicines||[]).map((m,i)=>(
                  <tr key={i}><Td hi>{m.name}</Td><Td><Badge col={accent}>{m.qty}</Badge></Td><Td>{fmt(m.rate)}</Td><Td><span style={{ color:"#f59e0b", fontWeight:700 }}>{fmt(m.qty*m.rate)}</span></Td></tr>
                ))}
              </TableWrap>
            </>}
            {(viewPt.reports||[]).length>0 && <>
              <div className="hms-section-label" style={{ marginTop:14 }}>Investigations</div>
              <TableWrap heads={["Report","Date","Result"]}>
                {(viewPt.reports||[]).map((r,i)=>(
                  <tr key={i}><Td hi>{r.name}</Td><Td sm>{r.date}</Td><Td>{r.result}</Td></tr>
                ))}
              </TableWrap>
            </>}
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowViewModal(false);setViewPt(null);}}>Close</button>
              <ActionBtn col={accent} onClick={()=>{setShowViewModal(false);openSummaryEditor(viewPt);}}>✎ Edit</ActionBtn>
              <button className="hms-save-btn" onClick={()=>downloadDischarge(viewPt,bc.label)}>↓ Download</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT SUMMARY MODAL ══ */}
      {showSummaryModal && editSumPt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowSummaryModal(false),setEditSumPt(null))}>
          <div className="hms-modal-box" style={{ width:520 }}>
            <div className="hms-modal-title">Edit Discharge Summary — {editSumPt.patientName||editSumPt.name}</div>
            <label className="hms-lbl">Summary Type</label>
            <select className="hms-sel" value={summaryForm.type||"Normal"} onChange={e=>setSummaryForm(f=>({...f,type:e.target.value}))}>
              {SUMMARY_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div className="hms-g2">
              <div><label className="hms-lbl">Doctor Name</label><input className="hms-inp" value={summaryForm.doctorName||""} onChange={e=>setSummaryForm(f=>({...f,doctorName:e.target.value}))}/></div>
              <div><label className="hms-lbl">Discharge Date</label><input className="hms-inp" type="date" value={summaryForm.date||""} onChange={e=>setSummaryForm(f=>({...f,date:e.target.value}))}/></div>
            </div>
            <div className="hms-g2">
              <div><label className="hms-lbl">Expected DOD</label><input className="hms-inp" type="date" value={summaryForm.expectedDod||""} onChange={e=>setSummaryForm(f=>({...f,expectedDod:e.target.value}))}/></div>
              <div/>
            </div>
            <label className="hms-lbl">Diagnosis</label><input className="hms-inp" value={summaryForm.diagnosis||""} onChange={e=>setSummaryForm(f=>({...f,diagnosis:e.target.value}))}/>
            <label className="hms-lbl">Treatment</label><input className="hms-inp" value={summaryForm.treatment||""} onChange={e=>setSummaryForm(f=>({...f,treatment:e.target.value}))}/>
            <label className="hms-lbl">Follow-up Instructions</label><input className="hms-inp" value={summaryForm.followUp||""} onChange={e=>setSummaryForm(f=>({...f,followUp:e.target.value}))}/>
            <label className="hms-lbl">Notes</label><input className="hms-inp" value={summaryForm.notes||""} onChange={e=>setSummaryForm(f=>({...f,notes:e.target.value}))}/>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowSummaryModal(false);setEditSumPt(null);}}>Cancel</button>
              <button style={{ background:"transparent", border:`1px solid ${accent}40`, color:accent, padding:"8px 14px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700 }} onClick={()=>{ exportTxt(`discharge_${editSumPt.uhid}.txt`,buildDischargeSummaryText(editSumPt,bc.label,summaryForm,{},editSumPt.medicines||[],editSumPt.reports||[])); toast("Downloaded"); }}>↓ Download</button>
              <button className="hms-save-btn" onClick={saveSummary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {showDeleteConfirm && deletePt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowDeleteConfirm(false),setDeletePt(null))}>
          <div className="hms-modal-box" style={{ width:380 }}>
            <div className="hms-modal-title" style={{ color:"#f87171" }}>Clear Discharge Summary?</div>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:18, lineHeight:1.6 }}>
              This will reset the discharge summary for <strong>{deletePt.patientName||deletePt.name}</strong> ({deletePt.uhid}). This action cannot be undone.
            </div>
            <div className="hms-modal-foot">
              <button className="hms-cancel-btn" onClick={()=>{setShowDeleteConfirm(false);setDeletePt(null);}}>Cancel</button>
              <button className="hms-danger-btn" onClick={doDeleteSummary}>Yes, Clear Summary</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTS MODAL (Admin Full Edit) ══ */}
      {showReportModal && editRepPt && (
        <div className="hms-modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowReportModal(false),setEditRepPt(null))}>
          <div className="hms-modal-box" style={{ width:750, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="hms-modal-title" style={{ marginBottom: 16 }}>Lab Reports (Full Admin Access) — {editRepPt.patientName||editRepPt.name}</div>
            
            {!(editRepPt.reports||[]).length && <div className="hms-empty" style={{ padding:"1rem" }}>No reports found for this patient.</div>}
            
            {(editRepPt.reports||[]).map((rep, rIdx) => (
              <div key={rIdx} style={{ background: isDark?"#080c18":"#f8fafc", border: `1px solid ${isDark?"#1a2540":"#e2e8f0"}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 12 }}>
                  <input className="hms-inp" style={{ fontWeight: 700, fontSize: 15, width: "50%" }} value={rep.reportName || rep.name} onChange={e => { const r=[...editRepPt.reports]; r[rIdx].reportName=e.target.value; setEditRepPt({...editRepPt,reports:r}); }} placeholder="Report Name"/>
                  <div style={{ display:"flex", gap: 10 }}>
                    <input className="hms-inp" type="date" value={rep.date} onChange={e => { const r=[...editRepPt.reports]; r[rIdx].date=e.target.value; setEditRepPt({...editRepPt,reports:r}); }}/>
                    <ActionBtn col="#f87171" onClick={()=>delReport(rIdx)}>✕ Delete Report</ActionBtn>
                  </div>
                </div>

                <div style={{ overflowX: "auto", marginBottom: 10 }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ color: "#64748b", borderBottom: `1px solid ${isDark?"#1a2540":"#e2e8f0"}` }}>
                        <th style={{ padding: 6, textAlign:"left" }}>Test Name</th>
                        <th style={{ padding: 6, textAlign:"left" }}>Result</th>
                        <th style={{ padding: 6, textAlign:"left" }}>Unit</th>
                        <th style={{ padding: 6, textAlign:"left" }}>Ref Range</th>
                        <th style={{ padding: 6 }}>✕</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rep.tests || []).map((test, tIdx) => (
                        <tr key={tIdx} style={{ borderBottom: `1px solid ${isDark?"#0f172a":"#f1f5f9"}` }}>
                          <td style={{ padding: 4 }}><input className="hms-inp-sm" style={{ width:"100%" }} value={test.name} onChange={e=>{ const r=[...editRepPt.reports]; r[rIdx].tests[tIdx].name=e.target.value; setEditRepPt({...editRepPt,reports:r}); }}/></td>
                          <td style={{ padding: 4 }}><input className="hms-inp-sm" style={{ width:"100%", color:"#38bdf8", fontWeight:600 }} value={test.result||test.value} onChange={e=>{ const r=[...editRepPt.reports]; r[rIdx].tests[tIdx].result=e.target.value; setEditRepPt({...editRepPt,reports:r}); }}/></td>
                          <td style={{ padding: 4 }}><input className="hms-inp-sm" style={{ width:"100%" }} value={test.unit} onChange={e=>{ const r=[...editRepPt.reports]; r[rIdx].tests[tIdx].unit=e.target.value; setEditRepPt({...editRepPt,reports:r}); }}/></td>
                          <td style={{ padding: 4 }}><input className="hms-inp-sm" style={{ width:"100%" }} value={test.refRange} onChange={e=>{ const r=[...editRepPt.reports]; r[rIdx].tests[tIdx].refRange=e.target.value; setEditRepPt({...editRepPt,reports:r}); }}/></td>
                          <td style={{ padding: 4, textAlign:"center" }}><button style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer" }} onClick={()=>{ const r=[...editRepPt.reports]; r[rIdx].tests.splice(tIdx,1); setEditRepPt({...editRepPt,reports:r}); }}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button style={{ fontSize: 11, color: accent, background: "none", border: "none", marginTop: 8, cursor: "pointer", fontWeight: 600 }} onClick={()=>{ const r=[...editRepPt.reports]; if(!r[rIdx].tests) r[rIdx].tests=[]; r[rIdx].tests.push({name:"",result:"",unit:"",refRange:""}); setEditRepPt({...editRepPt,reports:r}); }}>+ Add Custom Test Row</button>
                </div>
                
                <textarea className="hms-textarea" rows={2} placeholder="Remarks / Notes" value={rep.remarks} onChange={e=>{ const r=[...editRepPt.reports]; r[rIdx].remarks=e.target.value; setEditRepPt({...editRepPt,reports:r}); }} style={{ width: "100%", marginTop: 8 }}/>
              </div>
            ))}

            <div className="hms-section-label" style={{ marginTop:16 }}>Create New Blank Report</div>
            <div className="hms-g3" style={{ alignItems: "center" }}>
               <select className="hms-sel" value={newReport.type} onChange={e => {
                  const type = e.target.value;
                  const template = LAB_TEMPLATES[type] || { tests: [], defaultRemarks: "" };
                  setNewReport({ 
                    ...newReport, 
                    type, 
                    name: type, 
                    tests: template.tests.map(t => ({ name: t.name, result: "", unit: t.unit, refRange: t.refRange })),
                    remarks: template.defaultRemarks 
                  });
               }}>
                 <option value="">-- Pre-fill Template --</option>
                 {Object.keys(LAB_TEMPLATES).map(k=><option key={k} value={k}>{k}</option>)}
               </select>
               <input className="hms-inp" placeholder="Or type custom name..." value={newReport.name} onChange={e=>setNewReport(f=>({...f,name:e.target.value}))}/>
               <ActionBtn col={accent} onClick={() => {
                  if(!newReport.name) return;
                  const newRep = { id: Date.now(), reportName: newReport.name, date: new Date().toISOString().slice(0,10), remarks: "", tests: newReport.tests || [] };
                  setEditRepPt(prev=>({...prev, reports: [...(prev.reports||[]), newRep]}));
                  setNewReport({ name:"", type:"", tests: [] });
               }}>+ Add Custom Report</ActionBtn>
            </div>

            <div className="hms-modal-foot" style={{ marginTop:24 }}>
              <button className="hms-cancel-btn" onClick={()=>{setShowReportModal(false);setEditRepPt(null);}}>Cancel</button>
              <button className="hms-save-btn" onClick={saveReports}>💾 Save All Reports</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
