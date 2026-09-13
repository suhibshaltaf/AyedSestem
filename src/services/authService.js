import authAxiosInstance from "../api/axios.js";

const login = async (data) => {
  const response = await authAxiosInstance.post(
    "/Account/login",
    data
  );

  return response.data;
};

const getCurrentUser = async () => {
  const response = await authAxiosInstance.get(
    "/Account/currentuser"
  );

  return response.data;
};

const changePassword = async (data) => {
  const response = await authAxiosInstance.post(
    "/Account/changepassword",
    data
  );

  return response.data;
};

const getAvailableRoles = async () => {
  const response = await authAxiosInstance.get(
    "/Account/availableroles"
  );

  return response.data;
};

const getUsers = async () => {
  const response = await authAxiosInstance.get(
    "/Account/users"
  );

  return response.data;
};

const getUserById = async (id) => {
  const response = await authAxiosInstance.get(
    `/Account/users/${id}`
  );

  return response.data;
};

const createEmployee = async (data) => {
  const response = await authAxiosInstance.post(
    "/Account/createemployee",
    data
  );

  return response.data;
};

const updateUser = async (id, data) => {
  const response = await authAxiosInstance.put(
    `/Account/users/${id}`,
    data
  );

  return response.data;
};

const deleteUser = async (id) => {
  const response = await authAxiosInstance.delete(
    `/Account/users/${id}`
  );

  return response.data;
};

const authService = {
  login,
  getCurrentUser,
  changePassword,
  getAvailableRoles,
  getUsers,
  getUserById,
  createEmployee,
  updateUser,
  deleteUser,
};

export default authService;