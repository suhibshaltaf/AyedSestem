import authAxiosInstance from "../api/axios.js";
const repairOrderService = {
  // ===============================
  // GET: قائمة التصاليح
  // ===============================
  getRepairOrders: async (params = {}) => {
    const response = await authAxiosInstance.get("/RepairOrders", {
      params,
    });
    return response.data;
  },

  // ===============================
  // GET: تفاصيل تصليحة
  // ===============================
  getRepairOrderById: async (id) => {
    const response = await authAxiosInstance.get(`/RepairOrders/${id}`);
    return response.data;
  },

  // ===============================
  // GET: بواسطة Barcode
  // ===============================
  getRepairOrderByBarcode: async (barcode) => {
    const response = await authAxiosInstance.get(
      `/RepairOrders/barcode/${barcode}`
    );
    return response.data;
  },

  // ===============================
  // POST: إنشاء تصليحة
  // ===============================
  createRepairOrder: async (payload) => {
    const response = await authAxiosInstance.post("/RepairOrders", payload);
    return response.data;
  },

  // ===============================
  // PUT: تعديل تصليحة
  // ===============================
  updateRepairOrder: async (id, payload) => {
    const response = await authAxiosInstance.put(
      `/RepairOrders/${id}`,
      payload
    );
    return response.data;
  },

  // ===============================
  // DELETE: حذف تصليحة
  // ===============================
  deleteRepairOrder: async (id) => {
    const response = await authAxiosInstance.delete(`/RepairOrders/${id}`);
    return response.data;
  },

  // ===============================
  // POST: مسح الباركود/QR — Backend يقرر
  // ===============================
  scanRepairOrder: async (payload) => {
    // payload = { barcode: "..." } فقط
    const response = await authAxiosInstance.post(
      "/RepairOrders/scan",
      payload
    );
    return response.data;
  },

  // ===============================
  // GET: ملخص المندوبين
  // ===============================
  getRepresentativesSummary: async () => {
    const response = await authAxiosInstance.get(
      "/RepairOrders/representatives-summary"
    );
    return response.data;
  },

  // ===============================
  // GET: لوحة المندوب
  // ===============================
  getRepresentativeDashboard: async () => {
    const response = await authAxiosInstance.get(
      "/RepairOrders/representative/dashboard"
    );
    return response.data;
  },

  // ===============================
  // GET: طلبات المندوب
  // ===============================
  getRepresentativeOrders: async () => {
    const response = await authAxiosInstance.get(
      "/RepairOrders/representative/orders"
    );
    return response.data;
  },

  // ===============================
  // GET: صورة الباركود (Blob)
  // ===============================
  getBarcodeImage: async (barcode) => {
    const response = await authAxiosInstance.get(
      `/RepairOrders/barcode/${barcode}/image`,
      { responseType: "blob" }
    );
    return response.data;
  },

  // ===============================
  // GET: صورة QR (Blob)
  // ===============================
  getQrImage: async (barcode) => {
    const response = await authAxiosInstance.get(
      `/RepairOrders/barcode/${barcode}/qr`,
      { responseType: "blob" }
    );
    return response.data;
  },

  // =============================== 
  // GET: تتبع عام (للزبون)
  // ===============================
  trackRepairOrder: async (barcode) => {
    const response = await authAxiosInstance.get("/RepairOrders/track", {
      params: { barcode },
    });
    return response.data;
  },
};

export default repairOrderService;