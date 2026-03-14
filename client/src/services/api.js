import axios from "axios";

const API = axios.create({
 baseURL: "http://localhost:8000/api"
});

API.interceptors.request.use((config) => {
 const adminToken = localStorage.getItem("civictrackAdminToken");

 if (adminToken) {
  config.headers.Authorization = `Bearer ${adminToken}`;
 }

 return config;
});

export default API;
