// ===============================
// حالات التصليحة (7 حالات)
// ===============================
export const REPAIR_STATUSES = {
  1: { name: "جديدة", color: "new", location: "الفرع" },
  2: { name: "مع المندوب", color: "with-rep", location: "المندوب" },
  3: { name: "في المشغل", color: "at-workshop", location: "المشغل" },
  4: { name: "تم التصليح", color: "completed", location: "المشغل" },
  5: {
    name: "مع المندوب بعد التصليح",
    color: "with-rep-after",
    location: "المندوب",
  },
  6: { name: "جاهزة للاستلام", color: "ready", location: "فرع التسليم" },
  7: { name: "تم التسليم للعميل", color: "delivered", location: "الزبون" },
};

// ===============================
// أنواع الحركات (6 أنواع)
// ===============================
export const MOVEMENT_TYPES = {
  1: {
    name: "استلام المندوب للقطعة من الفرع",
    shortName: "استلام من الفرع",
    role: "Representative",
  },
  2: {
    name: "استلام المشغل للقطعة من المندوب",
    shortName: "استلام في المشغل",
    role: "OperatorManager",
  },
  3: {
    name: "إكمال التصليح في المشغل",
    shortName: "إكمال التصليح",
    role: "OperatorManager",
  },
  4: {
    name: "استلام المندوب للقطعة من المشغل",
    shortName: "استلام من المشغل",
    role: "Representative",
  },
  5: {
    name: "استلام الفرع للقطعة من المندوب",
    shortName: "استلام في الفرع",
    role: "BranchManager",
  },
  6: {
    name: "تسليم القطعة للزبون",
    shortName: "تسليم للزبون",
    role: "BranchManager",
  },
};

// ===============================
// الحصول على اسم الحالة
// ===============================
export const getStatusName = (status) =>
  REPAIR_STATUSES[status]?.name || "غير معروفة";

// ===============================
// الحصول على class الـ Chip
// ===============================
export const getStatusColor = (status) =>
  REPAIR_STATUSES[status]?.color || "new";

// ===============================
// الحصول على موقع الحالة
// ===============================
export const getStatusLocation = (status) =>
  REPAIR_STATUSES[status]?.location || "—";

// ===============================
// هل يمكن إنشاء تصليحة؟
// ===============================
export const canCreateRepair = (userRoles = []) => {
  return (
    userRoles.includes("BranchManager") ||
    userRoles.includes("BranchAccountant")
  );
};

// ===============================
// هل يمكن تعديل التصليحة؟
// فقط عندما Status = New ولا توجد حركات
// ===============================
export const canEditRepair = (userRoles = [], status, movements = []) => {
  const hasRole =
    userRoles.includes("BranchManager") ||
    userRoles.includes("BranchAccountant");

  return hasRole && Number(status) === 1 && (!movements || movements.length === 0);
};

// ===============================
// هل يمكن حذف التصليحة؟
// فقط Admin/SuperAdmin وعندما Status = New ولا توجد حركات
// ===============================
export const canDeleteRepair = (userRoles = [], status, movements = []) => {
  const hasRole =
    userRoles.includes("SuperAdmin") || userRoles.includes("Admin");

  return hasRole && Number(status) === 1 && (!movements || movements.length === 0);
};

// ===============================
// هل يمكن عرض كل الفروع؟
// ===============================
export const canViewAllBranches = (userRoles = []) => {
  return userRoles.includes("SuperAdmin") || userRoles.includes("Admin");
};

// ===============================
// هل يمكن استخدام شاشة المسح؟
// ===============================
export const canScanRepair = (userRoles = []) => {
  return (
    userRoles.includes("Representative") ||
    userRoles.includes("OperatorManager") ||
    userRoles.includes("BranchManager") ||
    userRoles.includes("BranchAccountant")
  );
};