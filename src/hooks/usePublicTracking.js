import { useQuery } from "@tanstack/react-query";
import repairOrderService from "../services/repairOrderService.js";

// ===============================
// GET: تتبع تصليحة (بدون auth)
// GET /api/RepairOrders/track?barcode=X
// ===============================
export const useTrackRepairOrder = (barcode, enabled = false) => {
  return useQuery({
    queryKey: ["public", "track", barcode],
    queryFn: () => repairOrderService.trackRepairOrder(barcode),
    enabled: enabled && !!barcode && barcode.trim().length > 0,
    select: (result) => result?.data || null,
    retry: false,
    staleTime: 0,
  });
};