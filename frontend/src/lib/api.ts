import axios, { AxiosInstance } from "axios";

const env: any = (import.meta as any).env || {};
const BASE_URL =
  env.REACT_APP_BACKEND_URL || env.VITE_BACKEND_URL || "";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sentinel_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("sentinel_token");
      localStorage.removeItem("sentinel_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function formatApiError(err: any): string {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e: any) => (typeof e?.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (d?.msg) return d.msg;
  return String(d);
}

export const API_ORIGIN = BASE_URL;
