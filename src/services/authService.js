import authAxiosInstance from "../api/axios.js";

// ===============================
// تسجيل الدخول
// ===============================
const login = async (data) => {
  const response = await authAxiosInstance.post("/Account/login", data);
  return response.data;
};

// ===============================
// المستخدم الحالي
// ===============================
const getCurrentUser = async () => {
  const response = await authAxiosInstance.get("/Account/currentuser");
  return response.data;
};

// ===============================
// تغيير كلمة المرور (للمستخدم الحالي)
// ===============================
const changePassword = async (data) => {
  const response = await authAxiosInstance.post(
    "/Account/changepassword",
    data
  );
  return response.data;
};

// ===============================
// الصلاحيات المتاحة
// ===============================
const getAvailableRoles = async () => {
  const response = await authAxiosInstance.get("/Account/availableroles");
  return response.data;
};

// ===============================
// جميع المستخدمين
// ===============================
const getUsers = async ({
  pageNumber = 1,
  pageSize = 20,
} = {}) => {
  const response = await authAxiosInstance.get("/Account/users", {
    params: {
      pageNumber,
      pageSize,
    },
  });

  return response.data;
};
// ===============================
// مستخدم بواسطة ID
// ===============================
const getUserById = async (id) => {
  const response = await authAxiosInstance.get(`/Account/users/${id}`);
  return response.data;
};

// ===============================
// إضافة موظف
// ===============================
const createEmployee = async (data) => {
  const response = await authAxiosInstance.post(
    "/Account/createemployee",
    data
  );
  return response.data;
};

// ===============================
// تعديل مستخدم
// ===============================
const updateUser = async (id, data) => {
  const response = await authAxiosInstance.put(
    `/Account/users/${id}`,
    data
  );
  return response.data;
};

// ===============================
// حذف مستخدم
// ===============================
const deleteUser = async (id) => {
  const response = await authAxiosInstance.delete(`/Account/users/${id}`);
  return response.data;
};

// ===============================
// ✅ إعادة تعيين كلمة مرور مستخدم (بواسطة Admin/SuperAdmin)
// المسار: POST /Account/resetpassword/{id}
// Body: { newPassword, confirmNewPassword }
// ===============================
const resetUserPassword = async (id, data) => {
  const response = await authAxiosInstance.post(
    `/Account/resetpassword/${id}`,
    data
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
  resetUserPassword,
};

export default authService;