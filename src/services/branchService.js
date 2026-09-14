import authAxiosInstance from "../api/axios.js";

// ===============================
// GET: جميع الفروع
// ===============================
const getAllBranches = async () => {
  const response = await authAxiosInstance.get("/Branches");
  return response.data;
};

// ===============================
// GET: فرع بواسطة ID
// ===============================
const getBranchById = async (id) => {
  const response = await authAxiosInstance.get(`/Branches/${id}`);
  return response.data;
};

// ===============================
// POST: إنشاء فرع جديد
// Body: { name, code, address, phoneNumber }
// ===============================
const createBranch = async (data) => {
  const response = await authAxiosInstance.post("/Branches", data);
  return response.data;
};

// ===============================
// PUT: تعديل فرع
// Body: { name, code, address, phoneNumber, isActive }
// ===============================
const updateBranch = async (id, data) => {
  const response = await authAxiosInstance.put(`/Branches/${id}`, data);
  return response.data;
};

// ===============================
// DELETE: حذف فرع
// ===============================
const deleteBranch = async (id) => {
  const response = await authAxiosInstance.delete(`/Branches/${id}`);
  return response.data;
};

const branchService = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};

export default branchService;