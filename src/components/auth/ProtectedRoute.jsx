import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "../../store/useAuthStore.js";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const syncFromStorage = useAuthStore((state) => state.syncFromStorage);
  const logout = useAuthStore((state) => state.logout);

  // ✅ مزامنة مع localStorage عند كل تغيير في المسار
  useEffect(() => {
    syncFromStorage();
  }, [location.pathname, syncFromStorage]);

  // ✅ مراقبة لحظية: إذا حُذف التوكن يدوياً → اخرج
  useEffect(() => {
    const interval = setInterval(() => {
      const hasToken = !!localStorage.getItem("AccessToken");
      const storeToken = useAuthStore.getState().token;

      if (!hasToken && storeToken) {
        // تم حذف التوكن من localStorage
        logout();
        navigate("/login", { replace: true });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [logout, navigate]);

  // ✅ قراءة مباشرة من localStorage (للتحقق الفوري)
  const realToken = localStorage.getItem("AccessToken");

  // 1) لا يوجد Token → login
  if (!token || !realToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2) التحقق من الصلاحيات (إن وُجدت)
  if (allowedRoles.length > 0) {
    const userRole = user?.role || user?.Role || "";
    const roles = user?.roles?.map((r) => r.name) || [];
    const hasAccess =
      allowedRoles.includes(userRole) ||
      allowedRoles.some((r) => roles.includes(r));

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 3) مسموح
  return <Outlet />;
}