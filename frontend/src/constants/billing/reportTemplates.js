// ─── Report Templates — synced exactly with backend report_templates.py ───────

export const REPORT_TEMPLATES = {

  // 1. CBC
  "CBC": {
    key:"CBC", label:"Complete Blood Count (CBC)", dept:"HAEMATOLOGY",
    remarks:"",
    tests:[
      { id:1,  name:"HAEMOGLOBIN",                    value:"", unit:"gm/dl",     refRange:"12–16",            status:"Normal" },
      { id:2,  name:"TLC (Total Leucocyte Count)",    value:"", unit:"/cumm",     refRange:"4000–11000",       status:"Normal" },
      { id:3,  name:"POLYMORPHS",                     value:"", unit:"%",         refRange:"40–75",            status:"Normal" },
      { id:4,  name:"LYMPHOCYTE",                     value:"", unit:"%",         refRange:"20–40",            status:"Normal" },
      { id:5,  name:"EOSINOPHIL",                     value:"", unit:"%",         refRange:"01–06",            status:"Normal" },
      { id:6,  name:"MONOCYTE",                       value:"", unit:"%",         refRange:"00–08",            status:"Normal" },
      { id:7,  name:"BASOPHIL",                       value:"", unit:"%",         refRange:"00–00",            status:"Normal" },
      { id:8,  name:"PCV",                            value:"", unit:"%",         refRange:"34–45",            status:"Normal" },
      { id:9,  name:"MCV (Mean Corp Volume)",         value:"", unit:"Fl/dl",     refRange:"76–96",            status:"Normal" },
      { id:10, name:"MCH (Mean Corp Hb)",             value:"", unit:"Pg/dl",     refRange:"27–32",            status:"Normal" },
      { id:11, name:"MCHC (Mean Corp Hb Conc)",       value:"", unit:"gm/dl",     refRange:"31–38",            status:"Normal" },
      { id:12, name:"RBC (Red Blood Cell Count)",     value:"", unit:"mill/cumm", refRange:"3.5–5.5",          status:"Normal" },
      { id:13, name:"PLATELET COUNT",                 value:"", unit:"Lacs/cumm", refRange:"1.5–4.5",          status:"Normal" },
      { id:14, name:"ESR (Wintrobe)",                 value:"", unit:"mm",        refRange:"M: 0–10, F: 0–20", status:"Normal" },
    ]
  },

  // 2. KFT
  "KFT": {
    key:"KFT", label:"Kidney Function Test (KFT)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"BLOOD UREA",       value:"", unit:"mg/dl",  refRange:"13–45",   status:"Normal" },
      { id:2, name:"SERUM CREATININE", value:"", unit:"mg/dl",  refRange:"0.7–1.4", status:"Normal" },
      { id:3, name:"S.URIC ACID",      value:"", unit:"mg/dl",  refRange:"3.2–7.2", status:"Normal" },
      { id:4, name:"SODIUM",           value:"", unit:"mmol/L", refRange:"135–145", status:"Normal" },
      { id:5, name:"POTASSIUM",        value:"", unit:"mmol/L", refRange:"3.6–5.0", status:"Normal" },
      { id:6, name:"CALCIUM",          value:"", unit:"mg/dl",  refRange:"8.2–10.5",status:"Normal" },
    ]
  },

  // 3. LFT
  "LFT": {
    key:"LFT", label:"Liver Function Test (LFT)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"SERUM BILIRUBIN (TOTAL)",      value:"", unit:"mg/dl", refRange:"0.2–1.3",  status:"Normal" },
      { id:2, name:"CONJUGATED (D BILIRUBIN)",     value:"", unit:"mg/dl", refRange:"0.0–0.3",  status:"Normal" },
      { id:3, name:"UNCONJUGATED (I.D BILIRUBIN)", value:"", unit:"mg/dl", refRange:"0.2–1.1",  status:"Normal" },
      { id:4, name:"SGOT/AST",                     value:"", unit:"U/L",   refRange:"00–55",    status:"Normal" },
      { id:5, name:"SGPT/ALT",                     value:"", unit:"U/L",   refRange:"00–40",    status:"Normal" },
      { id:6, name:"TOTAL PROTEIN",                value:"", unit:"gm/dl", refRange:"6.3–8.2",  status:"Normal" },
      { id:7, name:"ALBUMIN",                      value:"", unit:"gm/dl", refRange:"3.5–5.0",  status:"Normal" },
      { id:8, name:"GLOBULINE",                    value:"", unit:"gm/dl", refRange:"2.5–5.6",  status:"Normal" },
      { id:9, name:"ALKALINE PHOSPHATASE",         value:"", unit:"IU/L",  refRange:"20–130",   status:"Normal" },
    ]
  },

  // 4. LIPID
  "LIPID": {
    key:"LIPID", label:"Lipid Profile", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"CHOLESTEROL TOTAL", value:"", unit:"mg/dl", refRange:"125–200", status:"Normal" },
      { id:2, name:"TRIGLYCERIDE",      value:"", unit:"mg/dl", refRange:"25–200",  status:"Normal" },
      { id:3, name:"CHOLESTEROL HDL",   value:"", unit:"mg/dl", refRange:"35–80",   status:"Normal" },
      { id:4, name:"CHOLESTEROL VLDL",  value:"", unit:"mg/dl", refRange:"5–40",    status:"Normal" },
      { id:5, name:"CHOLESTEROL LDL",   value:"", unit:"mg/dl", refRange:"85–130",  status:"Normal" },
      { id:6, name:"LDL / HDL RATIO",   value:"", unit:"",      refRange:"1.5–3.5", status:"Normal" },
    ]
  },

  // 5. BLOODGAS
  "BLOODGAS": {
    key:"BLOODGAS", label:"Blood Gas Analysis", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1,  name:"pH",    value:"", unit:"",       refRange:"7.35–7.45", status:"Normal" },
      { id:2,  name:"pCO2",  value:"", unit:"mmHg",   refRange:"35–40",     status:"Normal" },
      { id:3,  name:"pO2",   value:"", unit:"mmHg",   refRange:"80–95",     status:"Normal" },
      { id:4,  name:"TCO2",  value:"", unit:"mmol/L", refRange:"23–27",     status:"Normal" },
      { id:5,  name:"HCO3",  value:"", unit:"mmol/L", refRange:"22–26",     status:"Normal" },
      { id:6,  name:"BE",    value:"", unit:"mmol/L", refRange:"-2 to +2",  status:"Normal" },
      { id:7,  name:"%SO2C", value:"", unit:"%",      refRange:"96–97",     status:"Normal" },
      { id:8,  name:"Na+",   value:"", unit:"mmol/L", refRange:"134–146",   status:"Normal" },
      { id:9,  name:"K+",    value:"", unit:"mmol/L", refRange:"3.4–5.0",   status:"Normal" },
      { id:10, name:"Cl",    value:"", unit:"mmol/L", refRange:"1.15–1.33", status:"Normal" },
      { id:11, name:"GLU",   value:"", unit:"mg/dl",  refRange:"74–100",    status:"Normal" },
      { id:12, name:"THbc",  value:"", unit:"%",      refRange:"12–16",     status:"Normal" },
      { id:13, name:"HCT",   value:"", unit:"mmol/L", refRange:"38–51",     status:"Normal" },
    ]
  },

  // 6. CRP
  "CRP": {
    key:"CRP", label:"CRP (Qualitative)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"CRP (Qualitative)", value:"NON-REACTIVE", unit:"", refRange:"NON-REACTIVE", status:"Normal" },
    ]
  },

  // 7. RBS / GLUCOSE_RANDOM
  "RBS": {
    key:"RBS", label:"Blood Glucose (Random)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"BLOOD GLUCOSE RANDOM", value:"", unit:"mg/dl", refRange:"100–150", status:"Normal" },
    ]
  },

  // 8. FBS / GLUCOSE_FASTING
  "FBS": {
    key:"FBS", label:"Blood Glucose (Fasting)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"BLOOD GLUCOSE FASTING", value:"", unit:"mg/dl", refRange:"70–110", status:"Normal" },
    ]
  },

  // 9. WIDAL
  "WIDAL": {
    key:"WIDAL", label:"Widal Test (Slide Method)", dept:"IMMUNOLOGY – SEROLOGY",
    remarks:"Interpretation: Antibody titer of 1:80 or higher suggests infection. A marked rise in the titer of one serotype to above 1:80 or paired samples collected at 5 to 7 days interval is regarded as diagnostically significant. However persons who have received TAB vaccine may show high titer of antibodies to each of the salmonella. Clinical correlation advised.",
    tests:[
      { id:1, name:"TO (1:20 / 1:40 / 1:80 / 1:160 / 1:320)", value:"",         unit:"", refRange:"Titer Pattern",        status:"Normal" },
      { id:2, name:"TH (1:20 / 1:40 / 1:80 / 1:160 / 1:320)", value:"",         unit:"", refRange:"Titer Pattern",        status:"Normal" },
      { id:3, name:"AH (1:20 / 1:40 / 1:80 / 1:160 / 1:320)", value:"",         unit:"", refRange:"Titer Pattern",        status:"Normal" },
      { id:4, name:"BH (1:20 / 1:40 / 1:80 / 1:160 / 1:320)", value:"",         unit:"", refRange:"Titer Pattern",        status:"Normal" },
      { id:5, name:"RESULT",                                    value:"NEGATIVE", unit:"", refRange:"POSITIVE / NEGATIVE", status:"Normal" },
    ]
  },

  // 10. MALARIA
  "MALARIA": {
    key:"MALARIA", label:"Malaria Antigen Test", dept:"MICROBIOLOGY",
    remarks:"PRINCIPLE OF TEST: The test uses two antibodies. One antibody is specific for histidine-rich protein 2 of species P.falciparum (Pf HRP2). The other antibody is specific for a malaria antigen which is common to all four species: P.falciparum, P.vivax, P.ovale, P.malariae.\n\nLIMITATION OF PROCEDURE: The test indicates the presence or absence of P.vivax in blood specimen. The test will detect but not speciate mixed infections. Occasionally, residual Pf HRP2 antigen may be detected for several days following elimination of parasites by anti-malarial treatment. Diagnosis should be correlated with smear findings and clinical picture. The test is not to be used in lieu of conventional smear diagnosis.",
    tests:[
      { id:1, name:"PLASMODIUM P. VIVAX",   value:"NEGATIVE", unit:"", refRange:"NEGATIVE", status:"Normal" },
      { id:2, name:"PLASMODIUM FALCIPARUM", value:"NEGATIVE", unit:"", refRange:"NEGATIVE", status:"Normal" },
    ]
  },

  // 11. TYPHI_DOT / TYPHIDOT
  "TYPHI_DOT": {
    key:"TYPHI_DOT", label:"Typhi Dot (IgG & IgM)", dept:"MICROBIOLOGY",
    remarks:"The typhidot test is based on dot enzyme immunosorbent assay (ELISA) for early detection of IgM and IgG antibodies to Salmonella typhi. This test has a sensitivity of approximately 95% and does not show any cross-reaction. Limitation: High IgG concentration may give false negative for IgM because IgG will drastically reduce binding of specific IgM to the antigen. Clinical correlation is a must.",
    tests:[
      { id:1, name:"THYPIDOT TEST FOR S.TYPHI IgM", value:"NEGATIVE", unit:"", refRange:"POSITIVE / NEGATIVE", status:"Normal" },
      { id:2, name:"THYPIDOT TEST FOR S.TYPHI IgG", value:"NEGATIVE", unit:"", refRange:"POSITIVE / NEGATIVE", status:"Normal" },
      { id:3, name:"COMMENTS",                       value:"",         unit:"", refRange:"",                    status:"Normal" },
    ]
  },

  // 12. DENGUE
  "DENGUE": {
    key:"DENGUE", label:"Dengue (IgM & IgG)", dept:"MICROBIOLOGY",
    remarks:"Dengue viruses are mosquito-borne viruses. Infection may lead to Dengue fever, dengue haemorrhagic fever, and dengue shock syndrome. IgM antibodies appear around the 5th day of Dengue infection, rise for 1–3 weeks and last for 60–90 days. IgG antibodies appear by the 14th day in primary infections and on the 2nd day in secondary infections, and can usually be detected for life. Both Dengue fever IgM & IgG are useful in the early detection of primary and secondary Dengue infection.",
    tests:[
      { id:1, name:"DENGUE IgM ANTIBODIES", value:"NON-REACTIVE", unit:"", refRange:"NON-REACTIVE", status:"Normal" },
      { id:2, name:"DENGUE IgG ANTIBODIES", value:"NON-REACTIVE", unit:"", refRange:"NON-REACTIVE", status:"Normal" },
    ]
  },

  // 13. DENGUE_NS1
  "DENGUE_NS1": {
    key:"DENGUE_NS1", label:"Dengue NS1 Antigen Test", dept:"MICROBIOLOGY",
    remarks:"In tropical and subtropical regions, dengue is the most important arbovirosis in terms of mortality and morbidity. NS1 antigen is a non-structural protein recognized as a marker of the acute phase of dengue infection, a period for which traditional serological antibody-based methods are of limited value. NS1 antigen circulates in samples of infected patients from the first day up to 9 days after onset of fever. Dengue NS1 Ag Strip is an individual test for qualitative detection of Dengue virus NS1 antigen in human serum or plasma as an aid in the diagnosis of acute dengue infection.",
    tests:[
      { id:1, name:"DENGUE NS1 ANTIGEN", value:"NON-REACTIVE", unit:"", refRange:"NON-REACTIVE", status:"Normal" },
    ]
  },

  // 14. VIRAL_MARKERS
  "VIRAL_MARKERS": {
    key:"VIRAL_MARKERS", label:"Viral Markers (HIV, HBsAg, HCV)", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"HIV I & II",            value:"NEGATIVE", unit:"", refRange:"NEGATIVE", status:"Normal" },
      { id:2, name:"HEPATITIS 'B' (HBsAg)", value:"NEGATIVE", unit:"", refRange:"NEGATIVE", status:"Normal" },
      { id:3, name:"HCV",                   value:"NEGATIVE", unit:"", refRange:"NEGATIVE", status:"Normal" },
    ]
  },

  // 15. COVID
  "COVID": {
    key:"COVID", label:"COVID-19 Rapid Antigen", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"COVID-19 (Ag)", value:"NON-REACTIVE", unit:"", refRange:"NON-REACTIVE", status:"Normal" },
    ]
  },

  // 16. URINE_RM
  "URINE_RM": {
    key:"URINE_RM", label:"Urine Examination (Routine)", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1,  name:"— PHYSICAL EXAMINATION —",    value:"", unit:"",    refRange:"", status:"Normal" },
      { id:2,  name:"COLOUR",                      value:"", unit:"",    refRange:"", status:"Normal" },
      { id:3,  name:"VOLUME",                      value:"", unit:"ml",  refRange:"", status:"Normal" },
      { id:4,  name:"SPECIFIC GRAVITY",            value:"", unit:"",    refRange:"", status:"Normal" },
      { id:5,  name:"— CHEMICAL EXAMINATION —",    value:"", unit:"",    refRange:"", status:"Normal" },
      { id:6,  name:"REACTION",                    value:"", unit:"",    refRange:"", status:"Normal" },
      { id:7,  name:"ALBUMIN",                     value:"", unit:"",    refRange:"", status:"Normal" },
      { id:8,  name:"SUGAR",                       value:"", unit:"",    refRange:"", status:"Normal" },
      { id:9,  name:"PH",                          value:"", unit:"",    refRange:"", status:"Normal" },
      { id:10, name:"— MICROSCOPIC EXAMINATION —", value:"", unit:"",    refRange:"", status:"Normal" },
      { id:11, name:"PUS CELLS",                   value:"", unit:"/HPF",refRange:"", status:"Normal" },
      { id:12, name:"EPITHELIAL CELLS",            value:"", unit:"/HPF",refRange:"", status:"Normal" },
      { id:13, name:"RBC'S",                       value:"", unit:"/HPF",refRange:"", status:"Normal" },
      { id:14, name:"CASTS",                       value:"", unit:"",    refRange:"", status:"Normal" },
      { id:15, name:"CRYSTALS",                    value:"", unit:"",    refRange:"", status:"Normal" },
      { id:16, name:"BACTERIA",                    value:"", unit:"",    refRange:"", status:"Normal" },
      { id:17, name:"OTHERS",                      value:"", unit:"",    refRange:"", status:"Normal" },
    ]
  },

  // 17. URINE_GRAM
  "URINE_GRAM": {
    key:"URINE_GRAM", label:"Urine Gram Stain", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPECIMEN SOURCE",   value:"URINE", unit:"", refRange:"URINE", status:"Normal" },
      { id:2, name:"GRAM STAIN RESULT", value:"",      unit:"", refRange:"",      status:"Normal" },
    ]
  },

  // 18. CULTURE_CS
  "CULTURE_CS": {
    key:"CULTURE_CS", label:"Aerobic Culture & Sensitivity", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPECIMEN SOURCE",       value:"", unit:"", refRange:"",                     status:"Normal" },
      { id:2, name:"DATE RECEIVED",         value:"", unit:"", refRange:"",                     status:"Normal" },
      { id:3, name:"DATE REPORTED",         value:"", unit:"", refRange:"",                     status:"Normal" },
      { id:4, name:"CULTURE RESULT",        value:"", unit:"", refRange:"",                     status:"Normal" },
      { id:5, name:"ANTIBIOTIC SENSITIVITY",value:"", unit:"", refRange:"Sensitive / Resistant", status:"Normal" },
    ]
  },

  // 19. PROCALCITONIN
  "PROCALCITONIN": {
    key:"PROCALCITONIN", label:"Serum Procalcitonin", dept:"BIOCHEMISTRY",
    remarks:"< 500 pg/ml: Severe systemic infection not likely. 500–2000: Systemic infection possible. 2000–10000: Sepsis likely. > 10000: Severe sepsis / septic shock almost certain.",
    tests:[
      { id:1, name:"SERUM PROCALCITONIN", value:"", unit:"pg/ml", refRange:"0.0–500", status:"Normal" },
    ]
  },

  // 20. SPUTUM_AFB
  "SPUTUM_AFB": {
    key:"SPUTUM_AFB", label:"Sputum for AFB", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPUTUM FOR AFB", value:"NO ACID FAST BACILLI SEEN", unit:"", refRange:"NO ACID FAST BACILLI SEEN", status:"Normal" },
    ]
  },

  // 21. SPUTUM_GRAM
  "SPUTUM_GRAM": {
    key:"SPUTUM_GRAM", label:"Sputum Gram Stain", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPUTUM GRAM STAIN RESULT", value:"No pathogenic bacteria seen", unit:"", refRange:"No pathogenic bacteria seen", status:"Normal" },
    ]
  },

  // 22. SPUTUM_CS
  "SPUTUM_CS": {
    key:"SPUTUM_CS", label:"Sputum C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPECIMEN SOURCE",       value:"SPUTUM", unit:"", refRange:"",                     status:"Normal" },
      { id:2, name:"DATE RECEIVED",         value:"",        unit:"", refRange:"",                    status:"Normal" },
      { id:3, name:"DATE REPORTED",         value:"",        unit:"", refRange:"",                    status:"Normal" },
      { id:4, name:"CULTURE RESULT",        value:"",        unit:"", refRange:"",                    status:"Normal" },
      { id:5, name:"ANTIBIOTIC SENSITIVITY",value:"",        unit:"", refRange:"Sensitive / Resistant",status:"Normal" },
    ]
  },

  // 23. CARDIAC_MARKERS
  "CARDIAC_MARKERS": {
    key:"CARDIAC_MARKERS", label:"Cardiac Markers (Trop-T, Trop-I, CPK)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"TROPONIN-T", value:"NEGATIVE", unit:"",     refRange:"NEGATIVE", status:"Normal" },
      { id:2, name:"TROPONIN-I", value:"NEGATIVE", unit:"",     refRange:"NEGATIVE", status:"Normal" },
      { id:3, name:"CPK-MB",     value:"",          unit:"IU/L", refRange:"Upto 24",  status:"Normal" },
      { id:4, name:"CPK",        value:"",          unit:"U/L",  refRange:"22–198",   status:"Normal" },
    ]
  },

  // 24. THYROID / TOTAL_THYROID_PROFILE
  "THYROID": {
    key:"THYROID", label:"Total Thyroid Profile", dept:"ENDOCRINOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"T3 (Triiodothyronine)",             value:"", unit:"pmol/L", refRange:"0.9–2.5",  status:"Normal" },
      { id:2, name:"Free Thyroxine (FT4)",              value:"", unit:"pmol/L", refRange:"60–135",   status:"Normal" },
      { id:3, name:"Thyroid Stimulating Hormone (TSH)", value:"", unit:"pmol/L", refRange:"0.25–5.0", status:"Normal" },
    ]
  },

  // 25. VIT_B12
  "VIT_B12": {
    key:"VIT_B12", label:"Vitamin B-12 (Cyanocobalamin)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"VITAMIN B-12 (CYANOCOBALAMIN)", value:"", unit:"pg/ml", refRange:"211–911", status:"Normal" },
    ]
  },

  // 26. VIT_D3
  "VIT_D3": {
    key:"VIT_D3", label:"25 OH Vitamin D3", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"25 OH VITAMIN D3", value:"", unit:"ng/ml", refRange:"30–100", status:"Normal" },
    ]
  },

  // 27. STOOL
  "STOOL": {
    key:"STOOL", label:"Stool Examination", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1,  name:"COLOUR",           value:"", unit:"",     refRange:"",                   status:"Normal" },
      { id:2,  name:"CONSISTANCY",      value:"", unit:"",     refRange:"",                   status:"Normal" },
      { id:3,  name:"MUCOUS",           value:"", unit:"",     refRange:"NIL",                status:"Normal" },
      { id:4,  name:"PH",               value:"", unit:"",     refRange:"7.0–7.8",            status:"Normal" },
      { id:5,  name:"REACTION",         value:"", unit:"",     refRange:"ACIDIC / ALKALINE",  status:"Normal" },
      { id:6,  name:"PUS CELLS",        value:"", unit:"/HPF", refRange:"0–1",                status:"Normal" },
      { id:7,  name:"RED BLOOD CELLS",  value:"", unit:"/HPF", refRange:"NIL",                status:"Normal" },
      { id:8,  name:"OVA",              value:"", unit:"",     refRange:"NIL",                status:"Normal" },
      { id:9,  name:"CYST",             value:"", unit:"",     refRange:"NIL",                status:"Normal" },
      { id:10, name:"BACTERIA",         value:"", unit:"",     refRange:"NIL",                status:"Normal" },
    ]
  },

  // 28. STOOL_CS
  "STOOL_CS": {
    key:"STOOL_CS", label:"Stool C/S (Culture & Sensitivity)", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPECIMEN SOURCE", value:"STOOL", unit:"", refRange:"", status:"Normal" },
      { id:2, name:"DATE RECEIVED",   value:"",       unit:"", refRange:"", status:"Normal" },
      { id:3, name:"DATE REPORTED",   value:"",       unit:"", refRange:"", status:"Normal" },
      { id:4, name:"CULTURE RESULT",  value:"",       unit:"", refRange:"", status:"Normal" },
    ]
  },

  // 29. BLOODGROUP / BLOOD_GROUP
  "BLOODGROUP": {
    key:"BLOODGROUP", label:"Blood Group & Rh Factor", dept:"HAEMATOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"BLOOD GROUP", value:"", unit:"", refRange:"", status:"Normal" },
      { id:2, name:"Rh FACTOR",   value:"", unit:"", refRange:"", status:"Normal" },
    ]
  },

  // 30. HBA1C
  "HBA1C": {
    key:"HBA1C", label:"HbA1c (Glycosylated Hemoglobin)", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"HbA1c (GLYCOSYLATED HEMOGLOBIN)", value:"", unit:"%", refRange:"4.30–6.40", status:"Normal" },
    ]
  },

  // 31. URINE_KETONE
  "URINE_KETONE": {
    key:"URINE_KETONE", label:"Urine Ketone", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"URINE KETONE", value:"NEGATIVE", unit:"", refRange:"NEGATIVE", status:"Normal" },
    ]
  },

  // 32. DDIMER
  "DDIMER": {
    key:"DDIMER", label:"D-Dimer", dept:"HAEMATOLOGY",
    remarks:"D-dimer is elevated whenever the coagulation system has been activated. A negative test essentially rules out thrombosis. A positive test requires further workup. Interpret in clinical context for DVT/VTE/PE/DIC.",
    tests:[
      { id:1, name:"D-DIMER", value:"", unit:"µgFEU/mL", refRange:"<0.5", status:"Normal" },
    ]
  },

  // 33. AMYLASE_LIPASE
  "AMYLASE_LIPASE": {
    key:"AMYLASE_LIPASE", label:"Serum Amylase & Lipase", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"S. AMYLASE", value:"", unit:"U/L", refRange:"30.0–220.0", status:"Normal" },
      { id:2, name:"S. LIPASE",  value:"", unit:"U/L", refRange:"Upto 190.0", status:"Normal" },
    ]
  },

  // 34. HOMOCYSTEINE
  "HOMOCYSTEINE": {
    key:"HOMOCYSTEINE", label:"Homocysteine (Quantitative)", dept:"BIOCHEMISTRY",
    remarks:"CVD patients with homocysteine > 15 umol/L belong to a high risk group.",
    tests:[
      { id:1, name:"HOMOCYSTEINE", value:"", unit:"umol/L", refRange:"5.45–16.20", status:"Normal" },
    ]
  },

  // 35. PSA
  "PSA": {
    key:"PSA", label:"PSA (Prostate Specific Antigen)", dept:"BIOCHEMISTRY",
    remarks:"PSA values should be correlated with clinical findings and other investigations.",
    tests:[
      { id:1, name:"PSA TOTAL, SERUM", value:"", unit:"ng/mL", refRange:"<4.00", status:"Normal" },
    ]
  },

  // 36. PT
  "PT": {
    key:"PT", label:"Prothrombin Time (PT)", dept:"HAEMATOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"PATIENT TIME (PT)",                    value:"", unit:"Sec", refRange:"10.0–14.0", status:"Normal" },
      { id:2, name:"CONTROL TIME (PT)",                    value:"", unit:"Sec", refRange:"",          status:"Normal" },
      { id:3, name:"INR (International Normalized Ratio)", value:"", unit:"",    refRange:"0.8–1.2",   status:"Normal" },
    ]
  },

  // 37. APTT
  "APTT": {
    key:"APTT", label:"Activated Partial Thromboplastin Time (APTT)", dept:"HAEMATOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"PATIENT TIME (APTT)", value:"", unit:"Sec", refRange:"26.0–40.0", status:"Normal" },
      { id:2, name:"CONTROL TIME (APTT)", value:"", unit:"Sec", refRange:"",          status:"Normal" },
      { id:3, name:"RATIO (APTT)",        value:"", unit:"",    refRange:"",          status:"Normal" },
    ]
  },

  // 38. ADA
  "ADA": {
    key:"ADA", label:"Adenosine Deaminase (ADA)", dept:"BIOCHEMISTRY",
    remarks:"Normal <30 U/L | Suspect: 30–40 U/L | Strong Suspect: 41–60 U/L | Positive >60 U/L. Increased ADA is found in Tuberculosis and various other infections. Result should be read in adjunct with clinical findings.",
    tests:[
      { id:1, name:"ADENOSINE DEAMINASE (ADA)", value:"", unit:"U/L", refRange:"Normal <30", status:"Normal" },
    ]
  },

  // 39. BODY_FLUID_CYTO
  "BODY_FLUID_CYTO": {
    key:"BODY_FLUID_CYTO", label:"Body Fluid For Cytology", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"SPECIMEN TYPE",           value:"", unit:"", refRange:"", status:"Normal" },
      { id:2, name:"CLINICAL NOTE",           value:"", unit:"", refRange:"", status:"Normal" },
      { id:3, name:"MICROSCOPIC EXAMINATION", value:"", unit:"", refRange:"", status:"Normal" },
      { id:4, name:"IMPRESSION",              value:"", unit:"", refRange:"", status:"Normal" },
      { id:5, name:"ADVICE",                  value:"", unit:"", refRange:"", status:"Normal" },
    ]
  },

  // 40. BODY_FLUID
  "BODY_FLUID": {
    key:"BODY_FLUID", label:"Body Fluid Routine Analysis", dept:"MICROBIOLOGY",
    remarks:"",
    tests:[
      { id:1,  name:"SAMPLE TYPE",          value:"", unit:"",      refRange:">1.5 mL",  status:"Normal" },
      { id:2,  name:"VOLUME",               value:"", unit:"mL",    refRange:">1.5 mL",  status:"Normal" },
      { id:3,  name:"COLOUR",               value:"", unit:"",      refRange:"",          status:"Normal" },
      { id:4,  name:"APPEARANCE",           value:"", unit:"",      refRange:"",          status:"Normal" },
      { id:5,  name:"COAGULUM",             value:"", unit:"",      refRange:"",          status:"Normal" },
      { id:6,  name:"BLOOD",                value:"", unit:"",      refRange:"NEGATIVE",  status:"Normal" },
      { id:7,  name:"GLUCOSE",              value:"", unit:"mg/dL", refRange:"",          status:"Normal" },
      { id:8,  name:"TOTAL PROTEIN",        value:"", unit:"gm/dL", refRange:"",          status:"Normal" },
      { id:9,  name:"TLC, BODY FLUID",      value:"", unit:"/cumm", refRange:"",          status:"Normal" },
      { id:10, name:"DLC – NEUTROPHIL",     value:"", unit:"%",     refRange:"",          status:"Normal" },
      { id:11, name:"DLC – LYMPHOCYTE",     value:"", unit:"%",     refRange:"",          status:"Normal" },
    ]
  },

  // 41. SAAG
  "SAAG": {
    key:"SAAG", label:"SAAG (Serum Ascites Albumin Gradient)", dept:"BIOCHEMISTRY",
    remarks:"SAAG >= 1.1 g/dL indicates portal hypertension.",
    tests:[
      { id:1, name:"ALBUMIN, SERUM", value:"", unit:"gm/dL", refRange:"3.50–5.50", status:"Normal" },
      { id:2, name:"ALBUMIN, FLUID", value:"", unit:"gm/dL", refRange:"",           status:"Normal" },
      { id:3, name:"SAAG",           value:"", unit:"gm/dL", refRange:"",           status:"Normal" },
    ]
  },

  // 42. IRON_PROFILE
  "IRON_PROFILE": {
    key:"IRON_PROFILE", label:"Iron Profile", dept:"BIOCHEMISTRY",
    remarks:"",
    tests:[
      { id:1, name:"IRON, SERUM",                       value:"", unit:"µg/dL", refRange:"49–181",      status:"Normal" },
      { id:2, name:"TIBC",                              value:"", unit:"µg/dL", refRange:"261–462",     status:"Normal" },
      { id:3, name:"UNSATURATED IRON BINDING CAPACITY", value:"", unit:"µg/dL", refRange:"110.0–370.0", status:"Normal" },
      { id:4, name:"TRANSFERRIN SATURATION",            value:"", unit:"%",     refRange:"14–50",       status:"Normal" },
    ]
  },

  // 43. PERIPHERAL_SMEAR
  "PERIPHERAL_SMEAR": {
    key:"PERIPHERAL_SMEAR", label:"Blood Picture (Peripheral Smear)", dept:"HAEMATOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"RED CELL MORPHOLOGY", value:"", unit:"", refRange:"",          status:"Normal" },
      { id:2, name:"WBC MORPHOLOGY",      value:"", unit:"", refRange:"",          status:"Normal" },
      { id:3, name:"PLATELET ASSESSMENT", value:"", unit:"", refRange:"",          status:"Normal" },
      { id:4, name:"HAEMOPARASITES",      value:"", unit:"", refRange:"NONE SEEN", status:"Normal" },
      { id:5, name:"IMPRESSION",          value:"", unit:"", refRange:"",          status:"Normal" },
    ]
  },

  // 44. ANTI_TPO
  "ANTI_TPO": {
    key:"ANTI_TPO", label:"Anti-TPO (Thyroid Peroxidase Antibody)", dept:"ENDOCRINOLOGY",
    remarks:"<0.9: Not Detected | 0.9–1.1: Borderline | >1.1: Positive. Anti-TPO antibodies are indicative of Hashimoto's thyroiditis if present. Method: ELISA.",
    tests:[
      { id:1, name:"Anti-TPO (Thyroid Peroxidase Antibody)", value:"", unit:"", refRange:"<0.9 Not Detected", status:"Normal" },
    ]
  },

  // 45. BT_CT
  "BT_CT": {
    key:"BT_CT", label:"Bleeding Time (BT) & Clotting Time (CT)", dept:"HAEMATOLOGY",
    remarks:"",
    tests:[
      { id:1, name:"BT (Bleeding Time)", value:"", unit:"Min/Sec", refRange:"02–07", status:"Normal" },
      { id:2, name:"CT (Clotting Time)", value:"", unit:"Min/Sec", refRange:"04–09", status:"Normal" },
    ]
  },

  // 46. RAD_GENERIC (Radiology)
  "RAD_GENERIC": {
    key:"RAD_GENERIC", label:"Radiology Report", dept:"RADIOLOGY",
    findings:"", impression:"", remarks:"",
    tests:[]
  },

  // ── Aliases kept for backward compatibility ───────────────────────────────
  "BLOOD_GAS":           { key:"BLOOD_GAS",           label:"Blood Gas Analysis",                    dept:"BIOCHEMISTRY",          tests:[] },
  "COAGULATION":         { key:"COAGULATION",          label:"Coagulation Profile",                   dept:"HAEMATOLOGY",           tests:[] },
  "GLUCOSE":             { key:"GLUCOSE",              label:"Blood Glucose",                         dept:"BIOCHEMISTRY",          tests:[] },
  "CARDIAC":             { key:"CARDIAC",              label:"Cardiac Markers",                       dept:"BIOCHEMISTRY",          tests:[] },
  "PANCREATIC":          { key:"PANCREATIC",           label:"Pancreatic Enzymes",                    dept:"BIOCHEMISTRY",          tests:[] },
  "VITAMINS":            { key:"VITAMINS",             label:"Vitamins",                              dept:"BIOCHEMISTRY",          tests:[] },
  "IRON":                { key:"IRON",                 label:"Iron Profile",                          dept:"BIOCHEMISTRY",          tests:[] },
  "TYPHIDOT":            { key:"TYPHIDOT",             label:"Typhi Dot (IgG & IgM)",                 dept:"IMMUNOLOGY – SEROLOGY",  tests:[] },
  "VIRAL":               { key:"VIRAL",                label:"Viral Markers",                         dept:"MICROBIOLOGY",           tests:[] },
  "BLOOD_CS":            { key:"BLOOD_CS",             label:"Blood C/S (Culture & Sensitivity)",     dept:"MICROBIOLOGY",           tests:[] },
  "URINE_CS":            { key:"URINE_CS",             label:"Urine C/S (Culture & Sensitivity)",     dept:"MICROBIOLOGY",           tests:[] },
  "TOTAL_THYROID_PROFILE":{ key:"TOTAL_THYROID_PROFILE",label:"Total Thyroid Profile",               dept:"ENDOCRINOLOGY",          tests:[] },
  "CRP_PROCALCITONIN":   { key:"CRP_PROCALCITONIN",    label:"CRP / Procalcitonin",                   dept:"BIOCHEMISTRY",           tests:[] },
};

export const INVESTIGATION_GROUPS = [
  { group:"🩸 Haematology",           color:"#dc2626", items:["CBC","BLOODGROUP","PERIPHERAL_SMEAR","PT","APTT","BT_CT","DDIMER"] },
  { group:"🧪 Biochemistry",          color:"#2563eb", items:["KFT","LFT","LIPID","BLOODGAS","RBS","FBS","CRP","PROCALCITONIN","AMYLASE_LIPASE","IRON_PROFILE","HBA1C","URINE_KETONE","HOMOCYSTEINE","PSA","SAAG","VIT_B12","VIT_D3"] },
  { group:"⚗️ Endocrinology",         color:"#7c3aed", items:["THYROID","ANTI_TPO"] },
  { group:"🔬 Immunology – Serology", color:"#b45309", items:["WIDAL","TYPHI_DOT","DENGUE","DENGUE_NS1"] },
  { group:"🦠 Microbiology",          color:"#065f46", items:["MALARIA","VIRAL_MARKERS","COVID","URINE_RM","URINE_GRAM","URINE_CS","CULTURE_CS","STOOL","STOOL_CS","SPUTUM_AFB","SPUTUM_GRAM","SPUTUM_CS","BODY_FLUID","BODY_FLUID_CYTO","ADA"] },
];

export const PATHOLOGY_REPORT_TYPES = [
  "Haematology","Biochemistry","Microbiology","Immunology – Serology",
  "Histopathology","Cytology","Blood Bank","Clinical Pathology","Endocrinology",
];

export const RADIOLOGY_REPORT_TYPES = [
  "X-Ray","USG","CT Scan","MRI","Echo","ECG","PET Scan",
  "Mammography","Fluoroscopy","Nuclear Medicine",
];

export function isRadiologyType(reportType = "") {
  return RADIOLOGY_REPORT_TYPES.includes(reportType);
}

export const emptyPathReport = () => ({
  id: crypto.randomUUID(),
  reportName: "",
  reportType: "Haematology",
  billCategory: "PATHOLOGY",
  date: new Date().toISOString().slice(0,10),
  orderedBy: "",
  amount: 0,
  remarks: "",
  tests: [{ id: Date.now(), name:"", value:"", unit:"", refRange:"", status:"Normal" }],
});

export const emptyRadReport = () => ({
  id: crypto.randomUUID(),
  reportName: "",
  reportType: "X-Ray",
  billCategory: "RADIOLOGY",
  date: new Date().toISOString().slice(0,10),
  orderedBy: "",
  amount: 0,
  remarks: "",
  findings: "",
  impression: "",
  tests: [],
});
