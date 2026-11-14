
import authAxiosInstance from "../api/axios.js";

const getAll = async (params = {}) => {
  const response = await authAxiosInstance.get(
    "/OldMaintenanceOrders",
    { params }
  );

  return response.data;
};

const getById = async (id) => {
  const response = await authAxiosInstance.get(
    `/OldMaintenanceOrders/${id}`
  );

  return response.data;
};

const create = async (data) => {
  const response = await authAxiosInstance.post(
    "/OldMaintenanceOrders",
    data
  );

  return response.data;
};

const update = async (id, data) => {
  const response = await authAxiosInstance.put(
    `/OldMaintenanceOrders/${id}`,
    data
  );

  return response.data;
};

const remove = async (id) => {
  const response = await authAxiosInstance.delete(
    `/OldMaintenanceOrders/${id}`
  );

  return response.data;
};

const oldMaintenanceOrderService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};

export default oldMaintenanceOrderService;
