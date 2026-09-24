import { Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "../../store/useAuthStore.js";

export default function ProtectedRoute({
  allowedRoles = [],
  checkBranch = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

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

  const roles = user?.roles?.map((r) => r.name) || [];
  const userRole = user?.role || user?.Role || "";

  // 2) التحقق من الصلاحيات العامة (إن وُجدت)
  if (allowedRoles.length > 0) {
    const hasAccess =
      allowedRoles.includes(userRole) ||
      allowedRoles.some((r) => roles.includes(r));

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 3) ✅ التحقق من صلاحية الفرع (لمدير/محاسب الفرع)
  if (checkBranch && id) {
    const isAdmin = roles.some((r) => ["SuperAdmin", "Admin"].includes(r));

    if (!isAdmin) {
      const userBranchId = user?.branchId;
      if (Number(userBranchId) !== Number(id)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // 4) مسموح
  return <Outlet />;
}