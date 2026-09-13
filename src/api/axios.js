import axios from "axios";
import useAuthStore from "../store/useAuthStore.js";

const authAxiosInstance = axios.create({
  baseURL: "https://localhost:7082/api",
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor
authAxiosInstance.interceptors.request.use(
  (config) => {
    // ✅ قراءة مباشرة من localStorage (أحدث قيمة)
    const token = localStorage.getItem("AccessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
authAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ إذا رجع 401 → امسح كل شيء وارجع للوجين
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      useAuthStore.getState().logout();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default authAxiosInstance;