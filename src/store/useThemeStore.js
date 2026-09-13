import { create } from "zustand";

// ===============================
// قراءة الوضع من localStorage
// ===============================
const getInitialMode = () => {
  try {
    const saved = localStorage.getItem("ThemeMode");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  } catch {
    return "light";
  }
};

// ===============================
// تطبيق الثيم على DOM
// ===============================
const applyThemeToDOM = (mode) => {
  try {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("ThemeMode", mode);
  } catch (err) {
    console.warn("Failed to apply theme:", err);
  }
};

const initialMode = getInitialMode();
applyThemeToDOM(initialMode);

// ===============================
// Zustand Store
// ===============================
const useThemeStore = create((set) => ({
  mode: initialMode,

  toggleMode: () =>
    set((state) => {
      const newMode = state.mode === "light" ? "dark" : "light";
      applyThemeToDOM(newMode);
      return { mode: newMode };
    }),

  setMode: (mode) => {
    applyThemeToDOM(mode);
    set({ mode });
  },
}));

// ✅ هذا السطر كان ناقصاً
export default useThemeStore;