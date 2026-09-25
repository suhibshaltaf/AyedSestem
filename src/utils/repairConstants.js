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
// ثوابت الحالات (للاستخدام البرمجي)
// ===============================
export const STATUS_NEW = 1;
export const STATUS_WITH_REP = 2;
export const STATUS_AT_WORKSHOP = 3;
export const STATUS_COMPLETED = 4;
export const STATUS_WITH_REP_AFTER = 5;
export const STATUS_READY = 6;
export const STATUS_DELIVERED = 7;

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
// ✅ هل يمكن التعديل كـ Branch؟
// BranchManager / BranchAccountant
// ===============================
export const canEditAsBranch = (userRoles = []) => {
  return (
    userRoles.includes("BranchManager") ||
    userRoles.includes("BranchAccountant")
  );
};

// ===============================
// ✅ هل يمكن التعديل كـ Operator؟
// OperatorManager + Status = AtWorkshop (3)
// ===============================
export const canEditAsOperator = (userRoles = [], status) => {
  const isOperator = userRoles.includes("OperatorManager");
  const isAtWorkshop = Number(status) === STATUS_AT_WORKSHOP;
  return isOperator && isAtWorkshop;
};

// ===============================
// ✅ قائمة الحقول المسموح بتعديلها حسب الدور والحالة
// ===============================
export const getEditableFields = (userRoles = [], status) => {
  // Branch: بيانات الفرع فقط (بدون price و operatorNotes)
  if (canEditAsBranch(userRoles)) {
    return [
      "customerName",
      "customerPhone",
      "description",
      "weight",
      "karat",
      "quantity",
      "requiredWork",
      "notes",
      "deliveryBranchId",
      "customerReceiverEmployeeId",
    ];
  }

  // Operator (AtWorkshop فقط): price و operatorNotes فقط
  if (canEditAsOperator(userRoles, status)) {
    return ["price", "operatorNotes"];
  }

  return [];
};

// ===============================
// ✅ هل يمكن تعديل التصليحة؟ (شامل لكل الأدوار)
// - Branch: فقط عندما Status = New ولا توجد حركات
// - Operator: فقط عندما Status = AtWorkshop
// - Representative: لا
// ===============================
export const canEditRepair = (userRoles = [], status, movements = []) => {
  // Branch: New + لا حركات
  if (canEditAsBranch(userRoles)) {
    return (
      Number(status) === STATUS_NEW &&
      (!movements || movements.length === 0)
    );
  }

  // Operator: AtWorkshop
  if (canEditAsOperator(userRoles, status)) {
    return true;
  }

  return false;
};

// ===============================
// هل يمكن حذف التصليحة؟
// فقط Admin/SuperAdmin وعندما Status = New ولا توجد حركات
// ===============================
export const canDeleteRepair = (userRoles = [], status, movements = []) => {
  const hasRole =
    userRoles.includes("SuperAdmin") || userRoles.includes("Admin");

  return (
    hasRole &&
    Number(status) === STATUS_NEW &&
    (!movements || movements.length === 0)
  );
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