// src/services/api.js
import axios from "axios";

function getApiBase() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured && configured.trim()) {
    return configured.replace(/\/+$/, "");
  }
  // Prefer same-origin API for local Vite proxy and production deployments.
  return "/api/v4";
}

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("remo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("remo_token");
      localStorage.removeItem("remo_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// ── Triage ───────────────────────────────────────────────────
export const triageAPI = {
  runAssessment: (data) => api.post("/triage", data),
  getAssessment: (requestId) => api.get(`/triage/${requestId}`),
  getSymptoms: () => api.get("/triage/symptoms"),
  submitFeedback: (data) => api.post("/triage/feedback", data),
};

// ── Facilities ───────────────────────────────────────────────
export const facilityAPI = {
  getFacilities: (params) => api.get("/facilities", { params }),
  getEmergency: () => api.get("/facilities/emergency"),
};

export default api;