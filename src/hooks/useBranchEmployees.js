import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import branchEmployeeService from "../services/branchEmployeeService.js";

// ===============================
// Query Keys
// ===============================
export const branchEmployeeKeys = {
  all: ["branch-employees"],
  byBranch: (branchId) => ["branch-employees", "branch", branchId],
};

// ===============================
// GET: موظفو فرع
// ===============================
export const useBranchEmployees = (branchId, options = {}) => {
  return useQuery({
    queryKey: branchEmployeeKeys.byBranch(branchId),
    queryFn: () => branchEmployeeService.getBranchEmployees(branchId),
    enabled: !!branchId && options.enabled !== false,
    select: (result) => {
      if (result?.success && Array.isArray(result.data)) {
        return result.data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// ===============================
// POST: إضافة موظف
// ===============================
export const useCreateBranchEmployee = (branchId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      branchEmployeeService.createBranchEmployee(branchId, data),
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم إضافة الموظف بنجاح");
        queryClient.invalidateQueries({
          queryKey: branchEmployeeKeys.byBranch(branchId),
        });
      } else {
        toast.error(result?.message || "فشل إضافة الموظف");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء إضافة الموظف"
      );
    },
  });
};

// ===============================
// PUT: تعديل موظف
// ===============================
export const useUpdateBranchEmployee = (branchId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }) =>
      branchEmployeeService.updateBranchEmployee(branchId, employeeId, data),
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم تعديل الموظف بنجاح");
        queryClient.invalidateQueries({
          queryKey: branchEmployeeKeys.byBranch(branchId),
        });
      } else {
        toast.error(result?.message || "فشل تعديل الموظف");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء تعديل الموظف"
      );
    },
  });
};

// ===============================
// DELETE: حذف موظف
// ===============================
export const useDeleteBranchEmployee = (branchId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId) =>
      branchEmployeeService.deleteBranchEmployee(branchId, employeeId),
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result?.message || "تم حذف الموظف بنجاح");
        queryClient.invalidateQueries({
          queryKey: branchEmployeeKeys.byBranch(branchId),
        });
      } else {
        toast.error(result?.message || "فشل حذف الموظف");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء حذف الموظف"
      );
    },
  });
};