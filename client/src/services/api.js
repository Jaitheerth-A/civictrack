import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

const API = axios.create({
 baseURL: apiBaseUrl
});

API.interceptors.request.use((config) => {
 const adminToken = localStorage.getItem("civictrackAdminToken");

 if (adminToken) {
  config.headers.Authorization = `Bearer ${adminToken}`;
 }

 return config;
});

export default API;
