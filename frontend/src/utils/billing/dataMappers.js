import {
  isRadiologyType,
} from "../../constants/billing/reportTemplates";
import {
  normalizeServices,
  hasAnyValue,
  isPathologyCategory,
  isMedicineCategory,
} from "./billingUtils";

export function deriveInsuranceType(patient, billing) {
  if (billing?.insuranceType) return billing.insuranceType;
  const payMode = String(patient?.payMode || "").toLowerCase();
  if (payMode.includes("cashless"))
    return patient?.cashlessType || patient?.tpa || "TPA";
  return "Self Pay";
}

export function deriveSavedState(
  discharge, medicalHistory, labReports, pharmacyRecords, billing, services
) {
  return {
    discharge: hasAnyValue({
      diagnosis:    discharge?.diagnosis,
      doctor:       discharge?.doctor,
      ward:         discharge?.ward,
      bed:          discharge?.bed,
      doa:          discharge?.doa,
      dod:          discharge?.dod,
      expectedDod:  discharge?.expectedDod,
      condition:    discharge?.condition,
      instructions: discharge?.instructions,
      notes:        discharge?.notes,
    }),
    admission: hasAnyValue(medicalHistory),
    reports:   labReports.length > 0,
    medicines: pharmacyRecords.length > 0,
    billing:
      services.length > 0 ||
      hasAnyValue({
        discount:      billing?.discount,
        advance:       billing?.advance,
        paidNow:       billing?.paidNow,
        paymentMode:   billing?.paymentMode,
        remarks:       billing?.remarks,
        insuranceType: billing?.insuranceType,
        tpaInfo:       billing?.tpaInfo,
        tpaDocStatus:  billing?.tpaDocStatus,
      }),
  };
}

export function normalizeLabReports(reports = [], fallbackServices = []) {
  if (reports.length) {
    return reports.map((r, i) => ({
      id:              r.id             || `report-${i}`,
      reportName:      r.reportName     || r.report_name  || "",
      reportType:      r.reportType     || r.report_type  || "Haematology",
      billCategory:    isRadiologyType(r.reportType || r.report_type || "")
        ? "RADIOLOGY"
        : "PATHOLOGY",
      reportCategory:  r.reportCategory || r.report_category || "",
      date:            r.date           || r.report_date  || new Date().toISOString().slice(0, 10),
      orderedBy:       r.orderedBy      || r.ordered_by   || "",
      amount:          Number(r.amount  || 0),
      remarks:         r.remarks        || "",
      modalityDetails: r.modalityDetails || r.modality_details || {},
      findings:        r.findings       || "",
      impression:      r.impression     || "",
      tests: Array.isArray(r.tests)
        ? r.tests
        : Array.isArray(r.table_data)
          ? r.table_data
          : [{ id: Date.now() + i, name:"", value:"", unit:"", refRange:"", status:"Normal" }],
    }));
  }
  return fallbackServices
    .filter(s => isPathologyCategory(s.category))
    .map((s, i) => ({
      id:              s.id   || `legacy-report-${i}`,
      reportName:      s.name,
      reportType:      s.category || "Haematology",
      billCategory:    "PATHOLOGY",
      reportCategory:  "legacy",
      date:            s.date || new Date().toISOString().slice(0, 10),
      orderedBy:       "",
      amount:          Number(s.amount || 0),
      remarks:         "",
      modalityDetails: {},
      findings:        "",
      impression:      "",
      tests: [{ id: Date.now() + i, name: s.name, value:"", unit:"", refRange:"", status:"Normal" }],
    }));
}

export function mergeSuggestedReports(existing = [], suggested = []) {
  const normalizedExisting   = normalizeLabReports(existing,   []);
  const normalizedSuggested  = normalizeLabReports(suggested,  []);
  const existingKeys = new Set(
    normalizedExisting.map(r =>
      `${String(r.reportName||"").trim().toLowerCase()}::${String(r.reportType||"").trim().toLowerCase()}`
    )
  );
  const missingSuggestions = normalizedSuggested.filter(r => {
    const key = `${String(r.reportName||"").trim().toLowerCase()}::${String(r.reportType||"").trim().toLowerCase()}`;
    return !existingKeys.has(key);
  });
  return [...normalizedExisting, ...missingSuggestions];
}

export function normalizePharmacyRecords(records = [], fallbackServices = []) {
  if (records.length) {
    return records.map((r, i) => ({
      id:          r.id          || `pharmacy-${i}`,
      item:        r.item        || r.medicine_name || "",
      date:        r.date        || r.date_given    || new Date().toISOString().slice(0, 10),
      amount:      Number(r.amount ?? (Number(r.quantity || 1) * Number(r.rate || 0))),
      quantity:    Number(r.quantity   || 1),
      rate:        Number(r.rate       || 0),
      batchNo:     r.batchNo     || r.batch_no      || "",
      expiryDate:  r.expiryDate  || r.expiry_date   || "",
    }));
  }
  return fallbackServices
    .filter(s => isMedicineCategory(s.category))
    .map((s, i) => ({
      id:         s.id   || `legacy-pharmacy-${i}`,
      item:       s.name,
      date:       s.date || new Date().toISOString().slice(0, 10),
      amount:     Number(s.amount || 0),
      quantity:   Number(s.qty   || 1),
      rate:       Number(s.rate  || 0),
      batchNo:    "",
      expiryDate: "",
    }));
}

export function branchKeyFromLocation(branchLocation, fallback = "laxmi") {
  const code = String(branchLocation || "").toUpperCase();
  if (code === "RYM") return "raya";
  if (code === "LNM") return "laxmi";
  return fallback;
}

export function mapLivePatients(records = [], branchKey = "laxmi") {
  const branchName = branchKey === "raya" ? "Raya Branch" : "Laxmi Nagar Branch";
  if (!Array.isArray(records) || records.length === 0) return [];
  const result = [];

  for (const record of records) {
    if (!record) continue;
    const hasNestedAdmissions =
      Array.isArray(record.admissions) && record.admissions.length > 0;
    const admissions = hasNestedAdmissions ? record.admissions : [record];

    for (const adm of admissions) {
      if (!adm) continue;
      const patient        = hasNestedAdmissions ? record : adm;
      const allServices    = normalizeServices(adm.services        || []);
      const labReports     = normalizeLabReports(adm.labReports    || [], allServices);
      const medicalBill    = normalizePharmacyRecords(adm.pharmacyRecords || [], allServices);
      const directServices = allServices.filter(
        s => !isPathologyCategory(s.category) && !isMedicineCategory(s.category)
      );
      const discharge      = adm.discharge      || {};
      const medicalHistory = adm.medicalHistory  || {};

      const billingInfo = {
        id:                adm.billing?.id,
        discount:          Number(adm.billing?.discount  || 0),
        advance:           Number(adm.billing?.advance   || 0),
        paidNow:           Number(adm.billing?.paidNow   || 0),
        paymentMode:       adm.billing?.paymentMode      || "",
        remarks:           adm.billing?.remarks          || "",
        insuranceType:     deriveInsuranceType(patient, adm.billing),
        tpaInfo:           adm.billing?.tpaInfo          || { tpaName: patient?.tpa||"", policyNo: patient?.tpaCard||"", claimNo: patient?.tpaPanelCardNo||"", authNo:"" },
        tpaDocStatus:      adm.billing?.tpaDocStatus     || {},
        printStatus:       adm.billing?.printStatus      || "DRAFT",
        guardianName:      adm.billing?.guardianName     || patient?.guardianName || "",
        cardNo:            adm.billing?.cardNo           || patient?.cardNo       || "",
        claimId:           adm.billing?.claimId          || patient?.claimId      || "",
        panel:             adm.billing?.panel            || patient?.panel        || "CASH",
        statusOnDischarge: adm.billing?.statusOnDischarge|| discharge?.dischargeStatus || "",
        billNo:            adm.billing?.billNo           || adm.admNo             || "",
      };

      const dischargeObj = {
        doa:                  discharge.doa              || adm.dateTime || adm.doa || "",
        dod:                  discharge.dod              || adm.dod      || "",
        expectedDod:          discharge.expectedDod      || adm.expectedDod || "",
        ward:                 discharge.wardName         || adm.wardName || adm.ward || "",
        bed:                  discharge.bedNo            || discharge.roomNo || adm.bedNo || adm.bed || "",
        doctor:               discharge.doctorName       || adm.doctorName || "",
        diagnosis:            discharge.diagnosis        || "",
        condition:            discharge.dischargeStatus  || "",
        dischargeStatus:      discharge.dischargeStatus  || "",
        instructions:         discharge.instructions     || "",
        notes:                discharge.notes            || "",
        chiefComplaints:      discharge.chiefComplaints  || medicalHistory.chiefComplaints  || "",
        historyOfIllness:     discharge.historyOfIllness || "",
        investigations:       discharge.investigations   || medicalHistory.investigations   || "",
        treatmentGiven:       discharge.treatmentGiven   || medicalHistory.treatmentAdvised || "",
        conditionAtDischarge: discharge.conditionAtDischarge || discharge.dischargeStatus   || "",
        adviceOnDischarge:    discharge.adviceOnDischarge|| discharge.instructions          || "",
        followUp:             discharge.followUp         || "",
        reasonForLama:        discharge.reasonForLama    || "",
        lamaDeclaration:      discharge.lamaDeclaration  || "",
        reasonForDopr:        discharge.reasonForDopr    || "",
        referredTo:           discharge.referredTo       || "",
        bp:    discharge.bp    || medicalHistory.bp    || "",
        pr:    discharge.pr    || medicalHistory.pr    || "",
        spo2:  discharge.spo2  || medicalHistory.spo2  || "",
        temp:  discharge.temp  || medicalHistory.temp  || "",
        chest: discharge.chest || medicalHistory.chest || "",
        cvs:   discharge.cvs   || medicalHistory.cvs   || "",
        cns:   discharge.cns   || medicalHistory.cns   || "",
        pa:    discharge.pa    || medicalHistory.pa    || "",
      };

      const savedState = deriveSavedState(
        dischargeObj, medicalHistory, labReports, medicalBill, billingInfo, directServices
      );

      result.push({
        uhid:           patient.uhid        || adm.uhid        || "",
        admNo:          adm.admNo           || adm.id          || "",
        assignedTo:     adm.assigned_to     || null,
        assignedToName: adm.assigned_to_name|| "",
        department:     adm.department      || "Billing",
        branch:         branchName,
        patientName:    patient.patientName || patient.name    || adm.patientName || "Unknown Patient",
        age:            patient.ageYY       || patient.age     || adm.age         || "—",
        gender:         patient.gender      || adm.gender      || "",
        phone:          patient.phone       || adm.phone       || "",
        address:        patient.address     || adm.address     || "",
        doa:            dischargeObj.doa,
        dod:            dischargeObj.dod,
        expectedDod:    dischargeObj.expectedDod,
        ward:           dischargeObj.ward,
        bed:            dischargeObj.bed,
        doctor:         dischargeObj.doctor || medicalHistory.treatingDoctor || "",
        diagnosis:      dischargeObj.diagnosis || medicalHistory.previousDiagnosis || "",
        status:         dischargeObj.dod ? "discharged" : "admitted",
        taskStatus:     billingInfo.printStatus === "APPROVED"
          ? "completed"
          : billingInfo.printStatus === "PENDING"
            ? "submitted"
            : "pending",
        saved:          savedState,
        discharge:      dischargeObj,
        medicalHistory: {
          previousDiagnosis:    medicalHistory.previousDiagnosis   || "",
          pastSurgeries:        medicalHistory.pastSurgeries        || "",
          currentMedications:   medicalHistory.currentMedications   || "",
          treatingDoctor:       medicalHistory.treatingDoctor        || "",
          knownAllergies:       medicalHistory.knownAllergies        || "",
          chronicConditions:    medicalHistory.chronicConditions     || "",
          familyHistory:        medicalHistory.familyHistory         || "",
          smokingStatus:        medicalHistory.smokingStatus         || "",
          alcoholUse:           medicalHistory.alcoholUse            || "",
          notes:                medicalHistory.notes                 || "",
          presentComplaints:    medicalHistory.presentComplaints     || "",
          chiefComplaints:      medicalHistory.chiefComplaints       || "",
          bp:                   medicalHistory.bp                    || "",
          pr:                   medicalHistory.pr                    || "",
          spo2:                 medicalHistory.spo2                  || "",
          temp:                 medicalHistory.temp                  || "",
          chest:                medicalHistory.chest                 || "",
          cvs:                  medicalHistory.cvs                   || "",
          cns:                  medicalHistory.cns                   || "",
          pa:                   medicalHistory.pa                    || "",
          investigations:       medicalHistory.investigations        || "",
          investigationsCustom: medicalHistory.investigationsCustom  || "",
          provisionalDiagnosis: medicalHistory.provisionalDiagnosis  || "",
          treatmentAdvised:     medicalHistory.treatmentAdvised       || "",
          doctorQual:           medicalHistory.doctorQual             || "",
        },
        services:    directServices,
        labReports,
        medicalBill,
        billing:     billingInfo,
      });
    }
  }
  return result;
}