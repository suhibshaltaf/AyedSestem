// ===============================
// ✅ بناء رابط الصورة من MainImage
// MainImage قد تكون:
// - null / undefined → null
// - اسم ملف فقط: "abc123.jpg"
// - مسار: "/uploads/abc123.jpg"
// - URL كامل: "https://..."
// ===============================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/**
 * بناء رابط الصورة الكامل
 * @param {string|null} mainImage - قيمة MainImage من الـ API
 * @returns {string|null} رابط الصورة الكامل أو null
 */
export const buildImageUrl = (mainImage) => {
  if (!mainImage || typeof mainImage !== "string") return null;

  const trimmed = mainImage.trim();
  if (!trimmed) return null;

  // ✅ إذا كان URL كامل
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // ✅ إذا كان المسار يبدأ بـ /
  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  // ✅ اسم ملف فقط — نضيف المسار الافتراضي
  // حسب إعدادات Backend — عدّل هنا إذا كان المسار مختلفاً
  return `${API_BASE_URL}/uploads/repairs/${trimmed}`;
};

/**
 * التحقق من وجود صورة صالحة
 * @param {string|null} mainImage
 * @returns {boolean}
 */
export const hasValidImage = (mainImage) => {
  return !!buildImageUrl(mainImage);
};