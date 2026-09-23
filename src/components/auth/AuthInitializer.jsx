import { useEffect } from "react";

import authService from "../../services/authService.js";
import useAuthStore from "../../store/useAuthStore.js";

export default function AuthInitializer({
  children,
}) {
  const token = useAuthStore(
    (state) => state.token
  );

  const setUser = useAuthStore(
    (state) => state.setUser
  );

  const logout = useAuthStore(
    (state) => state.logout
  );

  const setInitialized = useAuthStore(
    (state) => state.setInitialized
  );

  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setInitialized(true);
        return;
      }

      try {
        const result =
          await authService.getCurrentUser();

        if (!result?.success || !result?.data) {
          logout();
          return;
        }

        setUser(result.data);
      } catch (error) {
        console.error(
          "Authentication initialization error:",
          error
        );

        logout();
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [
    token,
    setUser,
    logout,
    setInitialized,
  ]);

  const initialized = useAuthStore((state) => state.initialized);
  return initialized ? children : null;
}
