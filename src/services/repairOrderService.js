import authAxiosInstance from "../api/axios.js";

// ===============================
// ✅ Helper: ضبط الهيدر المناسب حسب نوع الـ payload
// - FormData → multipart/form-data (Axios يضيف boundary تلقائياً)
// - JSON → application/json
// ===============================
const getRequestConfig = (payload) => {
  if (payload instanceof FormData) {
    return {
      headers: { "Content-Type": "multipart/form-data" },
    };
  }
  return {};
};

// ===============================
// ✅ Helper: بناء base URL للـ static files (الصور)
// - يحذف /api من النهاية لأن الصور في الجذر
// - مثال: https://localhost:7082/api → https://localhost:7082
// ===============================
const getStaticBaseUrl = () => {
  const base = authAxiosInstance.defaults.baseURL || "";
  // ✅ احذف /api أو /api/v1 من النهاية
  return base
    .replace(/\/api(\/v\d+)?\/?$/i, "")
    .replace(/\/$/, "");
};

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
  // ✅ يدعم JSON و FormData (لرفع الصورة)
  // ===============================
  createRepairOrder: async (payload) => {
    const response = await authAxiosInstance.post(
      "/RepairOrders",
      payload,
      getRequestConfig(payload)
    );
    return response.data;
  },

  // ===============================
  // PUT: تعديل تصليحة
  // ✅ يدعم JSON و FormData (لرفع الصورة)
  // ===============================
  updateRepairOrder: async (id, payload) => {
    const response = await authAxiosInstance.put(
      `/RepairOrders/${id}`,
      payload,
      getRequestConfig(payload)
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
  // ✅ GET: رابط الصورة الرئيسية (Static URL)
  // - mainImageName: اسم الملف فقط (مثل "abc123.jpg")
  //   أو مسار كامل
  // ===============================
  getMainImageUrl: (mainImageName) => {
    if (!mainImageName || typeof mainImageName !== "string") return null;

    const trimmed = mainImageName.trim();
    if (!trimmed) return null;

    // ✅ URL كامل
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    // ✅ استخدم الـ base URL بدون /api
    const base = getStaticBaseUrl();

    // ✅ مسار كامل من الجذر
    if (trimmed.startsWith("/")) {
      return `${base}${trimmed}`;
    }

    // ✅ اسم ملف فقط — المسار الفعلي: /uploads/{fileName}
    // ⚠️ تم التأكد أن Backend يحفظ في wwwroot/uploads/ مباشرة
    return `${base}/uploads/${trimmed}`;
  },

  // ===============================
  // ✅ GET: الصورة الرئيسية كـ Blob (fallback)
  // يستخدم فقط إذا فشل الـ Static URL
  // ===============================
  getMainImage: async (mainImageName) => {
    if (!mainImageName) return null;

    // ✅ جرب المسار المباشر عبر static files
    const staticUrl = repairOrderService.getMainImageUrl(mainImageName);
    if (staticUrl) {
      try {
        // ✅ نستخدم fetch بدل axios لأن الصور قد لا تحتاج Authorization
        const res = await fetch(staticUrl);
        if (res.ok) {
          return await res.blob();
        }
      } catch {
        // fallthrough → جرب axios
      }
    }

    // ✅ fallback → axios مع endpoint مخصص (إذا كان موجوداً في Backend)
    const response = await authAxiosInstance.get(
      `/RepairOrders/main-image/${encodeURIComponent(mainImageName)}`,
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