
import authAxiosInstance from "../api/axios.js";

// إعداد الطلب حسب نوع البيانات
const getRequestConfig = (payload) => {
  if (payload instanceof FormData) {
    return {
      headers: { "Content-Type": "multipart/form-data" },
    };
  }

  return {};
};

// رابط الصور بدون /api
const getStaticBaseUrl = () => {
  const base = authAxiosInstance.defaults.baseURL || "";

  return base
    .replace(/\/api(\/v\d+)?\/?$/i, "")
    .replace(/\/$/, "");
};

const repairOrderService = {
  // قائمة التصاليح مع البحث والفلاتر وتقسيم الصفحات من السيرفر
  getRepairOrders: async (params = {}) => {
    const response = await authAxiosInstance.get("/RepairOrders", {
      params: {
        ...params,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });

    return response.data;
  },

  // تفاصيل تصليحة
  getRepairOrderById: async (id) => {
    const response = await authAxiosInstance.get(`/RepairOrders/${id}`);
    return response.data;
  },

  // البحث بالباركود
  getRepairOrderByBarcode: async (barcode) => {
    const response = await authAxiosInstance.get(
      `/RepairOrders/barcode/${encodeURIComponent(barcode)}`
    );

    return response.data;
  },

  // إنشاء تصليحة
  createRepairOrder: async (payload) => {
    const response = await authAxiosInstance.post(
      "/RepairOrders",
      payload,
      getRequestConfig(payload)
    );

    return response.data;
  },

  // تعديل تصليحة
  updateRepairOrder: async (id, payload) => {
    const response = await authAxiosInstance.put(
      `/RepairOrders/${id}`,
      payload,
      getRequestConfig(payload)
    );

    return response.data;
  },

  // حذف تصليحة
  deleteRepairOrder: async (id) => {
    const response = await authAxiosInstance.delete(`/RepairOrders/${id}`);
    return response.data;
  },

  // مسح الباركود
  scanRepairOrder: async (payload) => {
    const response = await authAxiosInstance.post(
      "/RepairOrders/scan",
      payload
    );

    return response.data;
  },

  // ملخص المندوبين - المسار المطابق للـ Controller
  getRepresentativesSummary: async () => {
    const response = await authAxiosInstance.get(
      "/RepairOrders/representatives/summary"
    );

    return response.data;
  },

  // لوحة المندوب
  getRepresentativeDashboard: async () => {
    const response = await authAxiosInstance.get(
      "/RepairOrders/representative/dashboard"
    );

    return response.data;
  },

  // طلبات المندوب
  getRepresentativeOrders: async () => {
    const response = await authAxiosInstance.get(
      "/RepairOrders/representative/orders"
    );

    return response.data;
  },

  // صورة الباركود
  getBarcodeImage: async (barcode) => {
    const response = await authAxiosInstance.get(
      `/RepairOrders/barcode/${encodeURIComponent(barcode)}/image`,
      { responseType: "blob" }
    );

    return response.data;
  },

  // صورة QR
  getQrImage: async (barcode) => {
    const response = await authAxiosInstance.get(
      `/RepairOrders/barcode/${encodeURIComponent(barcode)}/qr`,
      { responseType: "blob" }
    );

    return response.data;
  },

  // رابط صورة التصليحة
  getRepairImageUrl: (fileName) => {
    if (!fileName || typeof fileName !== "string") return null;

    const trimmed = fileName.trim();

    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const base = getStaticBaseUrl();

    if (trimmed.startsWith("/")) {
      return `${base}${trimmed}`;
    }

    return `${base}/uploads/${trimmed}`;
  },

  // تتبع التصليحة للزبون
  trackRepairOrder: async (barcode) => {
    const response = await authAxiosInstance.get("/RepairOrders/track", {
      params: { barcode },
    });

    return response.data;
  },
};

export default repairOrderService;
