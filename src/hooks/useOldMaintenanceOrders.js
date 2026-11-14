
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "react-toastify";
import oldMaintenanceOrderService from "../services/oldMaintenanceOrderService.js";

export const oldMaintenanceOrderKeys = {
  all: ["old-maintenance-orders"],

  list: (params) => [
    "old-maintenance-orders",
    "list",
    params,
  ],

  detail: (id) => [
    "old-maintenance-orders",
    "detail",
    id,
  ],
};

export const useOldMaintenanceOrders = (params = {}) => {
  return useQuery({
    queryKey: oldMaintenanceOrderKeys.list(params),
    queryFn: () => oldMaintenanceOrderService.getAll(params),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });
};

export const useOldMaintenanceOrderById = (id) => {
  return useQuery({
    queryKey: oldMaintenanceOrderKeys.detail(id),
    queryFn: () => oldMaintenanceOrderService.getById(id),
    enabled: Boolean(id),
  });
};

export const useCreateOldMaintenanceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oldMaintenanceOrderService.create,

    onSuccess: (result) => {
      toast.success(
        result?.message || "تمت إضافة التصليح القديم بنجاح"
      );

      queryClient.invalidateQueries({
        queryKey: oldMaintenanceOrderKeys.all,
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        "حدث خطأ أثناء إضافة التصليح القديم"
      );
    },
  });
};

export const useUpdateOldMaintenanceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      oldMaintenanceOrderService.update(id, data),

    onSuccess: (result) => {
      toast.success(
        result?.message || "تم تعديل التصليح القديم بنجاح"
      );

      queryClient.invalidateQueries({
        queryKey: oldMaintenanceOrderKeys.all,
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        "حدث خطأ أثناء تعديل التصليح القديم"
      );
    },
  });
};

export const useDeleteOldMaintenanceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oldMaintenanceOrderService.delete,

    onSuccess: (result) => {
      toast.success(
        result?.message || "تم حذف السجل بنجاح"
      );

      queryClient.invalidateQueries({
        queryKey: oldMaintenanceOrderKeys.all,
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        "حدث خطأ أثناء حذف السجل"
      );
    },
  });
};
