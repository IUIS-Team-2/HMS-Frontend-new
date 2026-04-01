import axios from 'axios';

// This is the base URL where your Django server is running locally.
// Adjust the port (8000) or URL path if yours is different!
const BASE_URL = 'http://localhost:8000/api'; 

export const apiService = {
    // 1. Fetch all patients (Replacing mockDb fetch)
    getPatients: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/patients/`);
            return response.data;
        } catch (error) {
            console.error("Error fetching patient records:", error);
            throw error; 
        }
    },

// 2. Register a new patient
    registerPatient: async (patientData) => {
        try {
            const response = await axios.post(`${BASE_URL}/patients/`, patientData);
            return response.data;
        } catch (error) {
            // 👇 THIS IS THE NEW CONSOLE LOG 👇
            if (error.response && error.response.data) {
                console.error("Django rejected the data because:", error.response.data);
            } else {
                console.error("Error registering new patient:", error);
            }
            throw error;
        }
    }
};