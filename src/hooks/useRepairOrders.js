import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import repairOrderService from "../services/repairOrderService.js";

// ===============================
// Query Keys
// ===============================
export const repairOrderKeys = {
  all: ["repair-orders"],
  list: (params) => ["repair-orders", "list", params],
  detail: (id) => ["repair-orders", "detail", id],
  byBarcode: (barcode) => ["repair-orders", "barcode", barcode],
  representativesSummary: ["repair-orders", "representatives-summary"],
};

// ===============================
// GET: قائمة التصاليح
// ===============================
export const useRepairOrders = (params = {}, options = {}) => {
  return useQuery({
    queryKey: repairOrderKeys.list(params),
    queryFn: () => repairOrderService.getRepairOrders(params),
    enabled: options.enabled !== false,
    select: (result) => {
      if (result?.success && Array.isArray(result.data)) return result.data;
      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      return [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// ===============================
// GET: تفاصيل تصليحة
// ===============================
export const useRepairOrderById = (id, options = {}) => {
  return useQuery({
    queryKey: repairOrderKeys.detail(id),
    queryFn: () => repairOrderService.getRepairOrderById(id),
    enabled: !!id && options.enabled !== false,
    select: (result) => result?.data || null,
  });
};

// ===============================
// GET: بواسطة Barcode
// ===============================
export const useRepairOrderByBarcode = (barcode, options = {}) => {
  return useQuery({
    queryKey: repairOrderKeys.byBarcode(barcode),
    queryFn: () => repairOrderService.getRepairOrderByBarcode(barcode),
    enabled: !!barcode && options.enabled !== false,
    select: (result) => result?.data || null,
    retry: false,
  });
};

// ===============================
// POST: إنشاء تصليحة
// ===============================
export const useCreateRepairOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: repairOrderService.createRepairOrder,
    onSuccess: (result) => {
      // ✅ الـ API يرجّع { message, data } بدون success
      if (result?.data) {
        toast.success(result?.message || "تم إنشاء التصليحة بنجاح");
        queryClient.invalidateQueries({ queryKey: repairOrderKeys.all });
      }
    },
    onError: (error) => {
      const resData = error?.response?.data;
      let msg = "حدث خطأ أثناء إنشاء التصليحة";

      if (
        resData?.errors &&
        Array.isArray(resData.errors) &&
        resData.errors.length > 0
      ) {
        msg = resData.errors.join(" | ");
      } else if (resData?.message) {
        msg = resData.message;
      }

      toast.error(msg, { autoClose: 8000 });
    },
  });
};

// ===============================
// POST: إضافة حركة
// ===============================
export const useAddRepairMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: repairOrderService.addRepairMovement,
    onSuccess: (result) => {
      if (result?.data || result?.success) {
        toast.success(result?.message || "تمت إضافة الحركة بنجاح");
        queryClient.invalidateQueries({ queryKey: repairOrderKeys.all });
      }
    },
    onError: (error) => {
      const resData = error?.response?.data;
      let msg = "حدث خطأ أثناء إضافة الحركة";

      if (
        resData?.errors &&
        Array.isArray(resData.errors) &&
        resData.errors.length > 0
      ) {
        msg = resData.errors.join(" | ");
      } else if (resData?.message) {
        msg = resData.message;
      }

      toast.error(msg, { autoClose: 8000 });
    },
  });
};

// ===============================
// GET: ملخص المندوبين (Admin)
// ===============================
export const useRepresentativesSummary = (options = {}) => {
  return useQuery({
    queryKey: repairOrderKeys.representativesSummary,
    queryFn: repairOrderService.getRepresentativesSummary,
    enabled: options.enabled !== false,
    select: (result) => {
      if (result?.success && Array.isArray(result.data)) return result.data;
      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      return [];
    },
    staleTime: 1000 * 60 * 2,
  });
};