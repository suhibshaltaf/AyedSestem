    import { create } from "zustand";

    // ===============================
    // قراءة القيم من localStorage
    // ===============================
    const getStoredToken = () => {
      try {
        return localStorage.getItem("AccessToken") || null;
      } catch {
        return null;
      }
    };

    const getStoredUser = () => {
      try {
        const raw = localStorage.getItem("UserData");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const useAuthStore = create((set, get) => ({
      token: getStoredToken(),
      user: getStoredUser(),
      initialized: false,
      setInitialized: (initialized) => set({ initialized }),

      // ===============================
      // Set Token
      // ===============================
      setToken: (newToken) => {
        set({ token: newToken });
        if (newToken) {
          localStorage.setItem("AccessToken", newToken);
        } else {
          localStorage.removeItem("AccessToken");
        }
      },

      // ===============================
      // Set User
      // ===============================
      setUser: (userData) => {
        set({ user: userData });
        if (userData) {
          localStorage.setItem("UserData", JSON.stringify(userData));
        } else {
          localStorage.removeItem("UserData");
        }
      },

      // ===============================
      // Logout
      // ===============================
      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem("AccessToken");
        localStorage.removeItem("UserData");
      },

      // ===============================
      // Sync from localStorage (يدوي)
      // ===============================
      syncFromStorage: () => {
        set({
          token: getStoredToken(),
          user: getStoredUser(),
        });
      },

      // ===============================
      // Check Auth (يقرأ من localStorage مباشرة)
      // ===============================
      isAuthenticated: () => {
        return !!getStoredToken();
      },
    }));

    // ===============================
    // مزامنة تلقائية عند تغيير localStorage من تاب آخر
    // ===============================
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === "AccessToken" || e.key === "UserData") {
          useAuthStore.getState().syncFromStorage();
        }
      });
    }

    export default useAuthStore;
