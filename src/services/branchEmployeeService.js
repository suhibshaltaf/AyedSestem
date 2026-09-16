import authAxiosInstance from "../api/axios.js";

// ===============================
// GET: موظفو فرع معين
// ===============================
const getBranchEmployees = async (branchId) => {
  const response = await authAxiosInstance.get(
    `/BranchEmployees/branch/${branchId}`
  );
  return response.data;
};

// ===============================
// POST: إضافة موظف لفرع
// Body: { fullName }
// ===============================
const createBranchEmployee = async (branchId, data) => {
  const response = await authAxiosInstance.post(
    `/BranchEmployees/branch/${branchId}`,
    data
  );
  return response.data;
};

// ===============================
// PUT: تعديل موظف فرع
// Body: { fullName }
// ===============================
const updateBranchEmployee = async (branchId, employeeId, data) => {
  const response = await authAxiosInstance.put(
    `/BranchEmployees/branch/${branchId}/${employeeId}`,
    data
  );
  return response.data;
};

// ===============================
// DELETE: حذف موظف فرع
// ===============================
const deleteBranchEmployee = async (branchId, employeeId) => {
  const response = await authAxiosInstance.delete(
    `/BranchEmployees/branch/${branchId}/${employeeId}`
  );
  return response.data;
};

const branchEmployeeService = {
  getBranchEmployees,
  createBranchEmployee,
  updateBranchEmployee,
  deleteBranchEmployee,
};

export default branchEmployeeService;