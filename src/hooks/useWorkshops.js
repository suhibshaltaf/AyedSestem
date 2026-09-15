import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import workshopService from "../services/workshopService.js";

// ===============================
// Query Keys
// ===============================
export const workshopKeys = {
  all: ["workshops"],
  detail: (id) => ["workshops", id],
};

// ===============================
// GET: جميع الورش
// ===============================
export const useWorkshops = (options = {}) => {
  return useQuery({
    queryKey: workshopKeys.all,
    queryFn: workshopService.getAllWorkshops,
    enabled: options.enabled !== false,
    select: (result) => {
      if (result?.success && Array.isArray(result.data)) {
        return result.data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// ===============================
// GET: ورشة بواسطة ID
// ===============================
export const useWorkshopById = (id, options = {}) => {
  return useQuery({
    queryKey: workshopKeys.detail(id),
    queryFn: () => workshopService.getWorkshopById(id),
    enabled: !!id && options.enabled !== false,
    select: (result) => result?.data || null,
  });
};

// ===============================
// POST: إنشاء ورشة
// ===============================
export const useCreateWorkshop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workshopService.createWorkshop,
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم إضافة الورشة بنجاح");
        queryClient.invalidateQueries({ queryKey: workshopKeys.all });
      } else {
        toast.error(result?.message || "فشل إضافة الورشة");
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء إضافة الورشة";
      toast.error(msg);
    },
  });
};

// ===============================
// PUT: تعديل ورشة
// ===============================
export const useUpdateWorkshop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => workshopService.updateWorkshop(id, data),
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم تعديل الورشة بنجاح");
        queryClient.invalidateQueries({ queryKey: workshopKeys.all });
      } else {
        toast.error(result?.message || "فشل تعديل الورشة");
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء تعديل الورشة";
      toast.error(msg);
    },
  });
};

// ===============================
// DELETE: حذف ورشة
// ===============================
export const useDeleteWorkshop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workshopService.deleteWorkshop,
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم حذف الورشة بنجاح");
        queryClient.invalidateQueries({ queryKey: workshopKeys.all });
      } else {
        toast.error(result?.message || "فشل حذف الورشة");
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء حذف الورشة";
      toast.error(msg);
    },
  });
};