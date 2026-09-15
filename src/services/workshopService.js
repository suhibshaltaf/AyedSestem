import authAxiosInstance from "../api/axios.js";

// ===============================
// GET: جميع الورش
// ===============================
const getAllWorkshops = async () => {
  const response = await authAxiosInstance.get("/Workshop");
  return response.data;
};

// ===============================
// GET: ورشة بواسطة ID
// ===============================
const getWorkshopById = async (id) => {
  const response = await authAxiosInstance.get(`/Workshop/${id}`);
  return response.data;
};

// ===============================
// POST: إنشاء ورشة جديدة
// Body: { name, address, phoneNumber, isActive }
// ===============================
const createWorkshop = async (data) => {
  const response = await authAxiosInstance.post("/Workshop", data);
  return response.data;
};

// ===============================
// PUT: تعديل ورشة
// Body: { name, address, phoneNumber, isActive }
// ===============================
const updateWorkshop = async (id, data) => {
  const response = await authAxiosInstance.put(`/Workshop/${id}`, data);
  return response.data;
};

// ===============================
// DELETE: حذف ورشة
// ===============================
const deleteWorkshop = async (id) => {
  const response = await authAxiosInstance.delete(`/Workshop/${id}`);
  return response.data;
};

const workshopService = {
  getAllWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
};

export default workshopService;