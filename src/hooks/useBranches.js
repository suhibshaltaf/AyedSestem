import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import branchService from "../services/branchService.js";

// ===============================
// Query Keys
// ===============================
export const branchKeys = {
  all: ["branches"],
  lookup: ["branches", "lookup"],
  detail: (id) => ["branches", id],
};

// ===============================
// GET: جميع الفروع
// ===============================
export const useBranches = (options = {}) => {
  return useQuery({
    queryKey: branchKeys.all,
    queryFn: branchService.getAllBranches,
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
// GET: فرع بواسطة ID
// ===============================
export const useBranchById = (id, options = {}) => {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => branchService.getBranchById(id),
    enabled: !!id && options.enabled !== false,
    select: (result) => result?.data || null,
  });
};

// ===============================
// POST: إنشاء فرع
// ===============================
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: branchService.createBranch,
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم إضافة الفرع بنجاح");
        queryClient.invalidateQueries({ queryKey: branchKeys.all });
      } else {
        toast.error(result?.message || "فشل إضافة الفرع");
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء إضافة الفرع";
      toast.error(msg);
    },
  });
};

// ===============================
// PUT: تعديل فرع
// ===============================
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => branchService.updateBranch(id, data),
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم تعديل الفرع بنجاح");
        queryClient.invalidateQueries({ queryKey: branchKeys.all });
      } else {
        toast.error(result?.message || "فشل تعديل الفرع");
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء تعديل الفرع";
      toast.error(msg);
    },
  });
};

// ===============================
// DELETE: حذف فرع
// ===============================
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: branchService.deleteBranch,
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم حذف الفرع بنجاح");
        queryClient.invalidateQueries({ queryKey: branchKeys.all });
      } else {
        toast.error(result?.message || "فشل حذف الفرع");
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء حذف الفرع";
      toast.error(msg);
    },
  });
};

export const useBranchLookup = () => useQuery({
  queryKey: branchKeys.lookup,
  queryFn: branchService.getBranchLookup,
  select: (result) => Array.isArray(result?.data) ? result.data : [],
  staleTime: 1000 * 60 * 5,
});
