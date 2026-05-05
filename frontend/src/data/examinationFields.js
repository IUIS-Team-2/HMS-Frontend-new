/**
 * Examination Fields Configuration
 * Auto-fill units and normal ranges for medical examination fields
 */

export const EXAMINATION_FIELDS = {
  bp: {
    label: 'BP (mmHg)',
    unit: 'mmHg',
    normal: '120/80',
    placeholder: 'e.g. 120/80 mmHg',
  },
  pr: {
    label: 'PR (/min)',
    unit: '/min',
    normal: '60-100',
    placeholder: 'e.g. 72 /min',
  },
  spo2: {
    label: 'SPO2 (%)',
    unit: '%',
    normal: '95-100',
    placeholder: 'e.g. 98% On RA',
  },
  temp: {
    label: 'TEMP (°F)',
    unit: '°F',
    normal: '98.6',
    placeholder: 'e.g. 98.6°F',
  },
  chest: {
    label: 'Chest',
    unit: '',
    normal: 'Clear',
    placeholder: 'e.g. B/L Crepts+',
  },
  cvs: {
    label: 'CVS',
    unit: '',
    normal: 'Normal',
    placeholder: 'e.g. S1 S2 +',
  },
  cns: {
    label: 'CNS',
    unit: '',
    normal: 'Conscious',
    placeholder: 'e.g. Conscious',
  },
  pa: {
    label: 'P/A (Abdomen)',
    unit: '',
    normal: 'Soft',
    placeholder: 'e.g. Distended',
  },
};

/**
 * Get unit for a field - returns empty string if no unit
 */
export function getFieldUnit(fieldName) {
  return EXAMINATION_FIELDS[fieldName]?.unit || '';
}

/**
 * Get all examination fields with their properties
 */
export function getExaminationFields() {
  return Object.entries(EXAMINATION_FIELDS).map(([key, value]) => ({
    key,
    ...value,
  }));
}

/**
 * Format a value with its unit
 */
export function formatWithUnit(fieldName, value) {
  if (!value) return '';
  const unit = getFieldUnit(fieldName);
  if (!unit) return value;
  // Check if value already has unit
  if (value.includes(unit)) return value;
  return `${value} ${unit}`;
}
