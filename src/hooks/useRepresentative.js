import { useQuery } from "@tanstack/react-query";
import repairOrderService from "../services/repairOrderService.js";

// ===============================
// GET: لوحة المندوب
// ===============================
export const useRepresentativeDashboard = (options = {}) => {
  return useQuery({
    queryKey: ["representative", "dashboard"],
    queryFn: repairOrderService.getRepresentativeDashboard,
    enabled: options.enabled !== false,
    select: (result) => result?.data || null,
    staleTime: 1000 * 60 * 2,
  });
};

// ===============================
// GET: طلبات المندوب
// ===============================
export const useRepresentativeOrders = (options = {}) => {
  return useQuery({
    queryKey: ["representative", "orders"],
    queryFn: repairOrderService.getRepresentativeOrders,
    enabled: options.enabled !== false,
    select: (result) => {
      if (result?.success && Array.isArray(result.data)) return result.data;
      if (Array.isArray(result)) return result;
      return [];
    },
    staleTime: 1000 * 60 * 2,
  });
};