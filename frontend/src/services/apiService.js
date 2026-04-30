import axios from 'axios';
import { mockApiService } from "./mockApiService";

// ─── MOCK TOGGLE ─────────────────────────────────────────────
// Set USE_MOCK = true  → runs entire app with mock data, no backend needed
// Set USE_MOCK = false → restores all live API calls
// ─────────────────────────────────────────────────────────────
const USE_MOCK = false; // <--- toggle this to switch between mock and real API

export const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || 'http://127.0.0.1:8000';
export const BASE_URL = `${API_ORIGIN}/api`;

// 🌟 Automatically attach the JWT token to EVERY request
axios.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('hms_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const realApiService = {

    login: async (username, password) => {
        const response = await axios.post(`${BASE_URL}/users/login/`, { username, password });
        return response.data;
    },

    getUsers: async (params = {}) => {
        const response = await axios.get(`${BASE_URL}/users/manage/`, { params });
        return Array.isArray(response.data) ? response.data : (response.data?.results || response.data || []);
    },

    createUser: async (userData) => {
        const response = await axios.post(`${BASE_URL}/users/manage/`, userData);
        return response.data;
    },

    updateUser: async (userId, updateData) => {
        const response = await axios.patch(`${BASE_URL}/users/manage/${userId}/`, updateData);
        return response.data;
    },

    deactivateUser: async (userId) => {
        const response = await axios.patch(`${BASE_URL}/users/manage/${userId}/`, { is_active: false });
        return response.data;
    },

    reactivateUser: async (userId) => {
        const response = await axios.patch(`${BASE_URL}/users/manage/${userId}/`, { is_active: true });
        return response.data;
    },

    getMyProfile: async () => {
        const response = await axios.get(`${BASE_URL}/users/me/`);
        return response.data;
    },

    updateMyProfile: async (profileData) => {
        const response = await axios.patch(`${BASE_URL}/users/me/`, profileData);
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await axios.delete(`${BASE_URL}/users/manage/${userId}/`);
        return response.data;
    },

    getPatients: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/patients/`);
            return response.data;
        } catch (error) {
            console.error("Error fetching patient records:", error);
            throw error;
        }
    },

    registerPatient: async (patientData) => {
        try {
            const response = await axios.post(`${BASE_URL}/patients/`, patientData);
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                console.error("Django rejected the data because:", error.response.data);
            } else {
                console.error("Error registering new patient:", error);
            }
            throw error;
        }
    },

    newAdmission: async (uhid, admissionType = 'IPD') => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/new_admission/`, { admissionType });
        return response.data;
    },

    getServiceMaster: async () => {
        const response = await axios.get(`${BASE_URL}/service-master/`);
        return response.data;
    },

    updateMedicalHistory: async (uhid, admNo, medicalData) => {
        const response = await axios.patch(`${BASE_URL}/patients/${uhid}/update_medical/`, { admNo, medicalData });
        return response.data;
    },

    addService: async (uhid, admNo, serviceData) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/add_service/`, { admNo, serviceData });
        return response.data;
    },

    saveServicesBulk: async (uhid, admNo, services) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/services/bulk-save/`, { services });
        return response.data;
    },

    dischargePatient: async (uhid, admNo, dischargeData) => {
        const response = await axios.patch(`${BASE_URL}/patients/${uhid}/discharge/`, { admNo, dischargeData });
        return response.data;
    },

    updateBilling: async (uhid, admNo, billingData) => {
        const response = await axios.patch(`${BASE_URL}/patients/${uhid}/update_billing/`, { admNo, billingData });
        return response.data;
    },

    setExpectedDod: async (uhid, admNo, expectedDod) => {
        const response = await axios.patch(`${BASE_URL}/patients/${uhid}/set_expected_dod/`, { admNo, expectedDod });
        return response.data;
    },

    requestPrint: async (uhid, admNo) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/request_print/`, { admNo });
        return response.data;
    },

    resolvePrint: async (uhid, admNo, action) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/resolve_print/`, { admNo, action });
        return response.data;
    },

    updatePatient: async (uhid, patientData) => {
        const response = await axios.patch(`${BASE_URL}/patients/${uhid}/`, patientData);
        return response.data;
    },

    getDynamicSummary: async (uhid, admNo, type = 'LAMA') => {
        const response = await axios.get(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/dynamic-summary/?type=${type}`);
        return response.data;
    },

    saveDynamicSummary: async (uhid, admNo, summaryData) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/dynamic-summary/`, summaryData);
        return response.data;
    },

    getPendingPrints: async () => {
        const response = await axios.get(`${BASE_URL}/patients/pending_prints/`);
        return response.data;
    },

    getCashlessPatients: async () => {
        const response = await axios.get(`${BASE_URL}/patients/cashless-records/`);
        return response.data;
    },

    getTasks: async (params = {}) => {
        const response = await axios.get(`${BASE_URL}/tasks/`, { params });
        return response.data;
    },

    createTask: async (taskData) => {
        const response = await axios.post(`${BASE_URL}/tasks/`, taskData);
        return response.data;
    },

    updateTask: async (taskId, updateData) => {
        const response = await axios.patch(`${BASE_URL}/tasks/${taskId}/`, updateData);
        return response.data;
    },

    deleteTask: async (taskId) => {
        const response = await axios.delete(`${BASE_URL}/tasks/${taskId}/`);
        return response.data;
    },

    getPerformanceRatings: async () => {
        const response = await axios.get(`${BASE_URL}/hod/performance-ratings/`);
        return response.data;
    },

    getDepartmentLogs: async (department) => {
        const response = await axios.get(`${BASE_URL}/department-logs/`, { params: { department } });
        return response.data;
    },

    saveDepartmentLogs: async (department, entries) => {
        const response = await axios.post(`${BASE_URL}/department-logs/bulk-save/`, { department, entries });
        return response.data;
    },

    getLabReports: async (uhid, admNo) => {
        const response = await axios.get(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/lab-reports/`);
        return response.data;
    },

    saveLabReport: async (uhid, admNo, reportData) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/lab-reports/`, reportData);
        return response.data;
    },

    saveLabReportsBulk: async (uhid, admNo, reports) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/lab-reports/bulk-save/`, { reports });
        return response.data;
    },

    getPharmacyRecords: async (uhid, admNo) => {
        const response = await axios.get(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/pharmacy-records/`);
        return response.data;
    },

    savePharmacyRecord: async (uhid, admNo, recordData) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/pharmacy-records/`, recordData);
        return response.data;
    },

    savePharmacyRecordsBulk: async (uhid, admNo, records) => {
        const response = await axios.post(`${BASE_URL}/patients/${uhid}/admissions/${admNo}/pharmacy-records/bulk-save/`, { records });
        return response.data;
    },
};

// ─── Single export — swap between mock and real with USE_MOCK above ───────────
export const apiService = USE_MOCK ? mockApiService : realApiService;