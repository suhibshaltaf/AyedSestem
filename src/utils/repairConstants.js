// ===============================
// حالات التصليحة (Repair Statuses)
// ===============================
export const REPAIR_STATUSES = {
  1: { name: "جديدة", color: "new" },
  2: { name: "مع المندوب", color: "with-rep" },
  3: { name: "في الورشة", color: "at-workshop" },
  4: { name: "قيد التصليح", color: "in-repair" },
  5: { name: "تم التصليح", color: "completed" },
  6: { name: "مع المندوب بعد التصليح", color: "with-rep-after" },
  7: { name: "جاهزة للاستلام", color: "ready" },
  8: { name: "تم التسليم للعميل", color: "delivered" },
};

// ===============================
// أنواع الحركات (Movement Types)
// ===============================
export const MOVEMENT_TYPES = {
  1: {
    name: "تسليم القطعة للمندوب",
    shortName: "تسليم للمندوب",
    role: "BranchManager",
  },
  2: {
    name: "استلام القطعة من الفرع",
    shortName: "استلام من الفرع",
    role: "Representative",
  },
  3: {
    name: "تسليم القطعة للمشغل",
    shortName: "تسليم للمشغل",
    role: "Representative",
  },
  4: {
    name: "استلام القطعة في المشغل",
    shortName: "استلام في المشغل",
    role: "OperatorManager",
  },
  5: {
    name: "بدء التصليح",
    shortName: "بدء التصليح",
    role: "OperatorManager",
  },
  6: {
    name: "اكتمال التصليح",
    shortName: "اكتمال التصليح",
    role: "OperatorManager",
  },
  7: {
    name: "تسليم القطعة للمندوب بعد التصليح",
    shortName: "تسليم للمندوب",
    role: "OperatorManager",
  },
  8: {
    name: "استلام القطعة من المشغل",
    shortName: "استلام من المشغل",
    role: "Representative",
  },
  9: {
    name: "تسليم القطعة للفرع",
    shortName: "تسليم للفرع",
    role: "Representative",
  },
  10: {
    name: "استلام القطعة في الفرع",
    shortName: "استلام في الفرع",
    role: "BranchManager",
  },
  11: {
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
// الحصول على الحركات المتاحة حسب الحالة والدور
// ===============================
export const getAvailableMovements = (status, userRoles = []) => {
  const available = [];

  switch (status) {
    case 1: // جديدة
      if (
        userRoles.includes("BranchManager") ||
        userRoles.includes("BranchAccountant")
      ) {
        available.push(1); // DeliveredToRepresentative
      }
      break;

    case 2: // مع المندوب
      if (userRoles.includes("Representative")) {
        available.push(3); // DeliveredToWorkshop
      }
      break;

    case 3: // في المشغل
      if (userRoles.includes("OperatorManager")) {
        available.push(4); // ReceivedByWorkshop
      }
      break;

    case 4: // قيد التصليح
      if (userRoles.includes("OperatorManager")) {
        available.push(5); // StartedRepair (اختياري)
        available.push(6); // RepairCompleted
      }
      break;

    case 5: // تم التصليح
      if (userRoles.includes("OperatorManager")) {
        available.push(7); // DeliveredToRepresentativeFromWorkshop
      }
      break;

    case 6: // مع المندوب بعد التصليح
      if (userRoles.includes("Representative")) {
        available.push(9); // DeliveredToBranch
      }
      break;

    case 7: // جاهزة للاستلام
      if (
        userRoles.includes("BranchManager") ||
        userRoles.includes("BranchAccountant")
      ) {
        available.push(11); // DeliveredToCustomer
      }
      break;

    default:
      break;
  }

  return available;
};

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
// هل يمكن عرض كل الفروع؟
// ===============================
export const canViewAllBranches = (userRoles = []) => {
  return userRoles.includes("SuperAdmin") || userRoles.includes("Admin");
};