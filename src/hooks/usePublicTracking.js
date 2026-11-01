import { useQuery } from "@tanstack/react-query";
import repairOrderService from "../services/repairOrderService.js";

// ======================================
// تتبع قطعة واحدة باستخدام الباركود
// GET /api/RepairOrders/track?barcode=X
// ======================================

export const useTrackRepairOrder = (barcode, enabled = false) => {
  return useQuery({
    queryKey: ["public", "track", "barcode", barcode],

    queryFn: () => repairOrderService.trackRepairOrder(barcode),

    enabled: enabled && !!barcode?.trim(),

    select: (result) => result?.data || null,

    retry: false,

    staleTime: 0,
  });
};

// ======================================
// تتبع جميع القطع باستخدام رقم الهاتف
// GET /api/RepairOrders/track-by-phone?phone=X
// ======================================

export const useTrackRepairOrdersByPhone = (
  phone,
  enabled = false
) => {
  return useQuery({
    queryKey: ["public", "track", "phone", phone],

    queryFn: () => repairOrderService.trackRepairOrdersByPhone(phone),

    enabled: enabled && !!phone?.trim(),

    select: (result) => result?.data || [],

    retry: false,

    staleTime: 0,
  });
};