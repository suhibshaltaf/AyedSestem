
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getStatusName } from "./repairConstants.js";

// ===============================
// تجهيز البيانات
// ===============================
const buildRows = (orders, canViewPhone = false) =>
  orders.map((order) => {
    const row = {
      "رقم الباركود": order.barcode || "—",

      "اسم العميل": order.customerName || "—",

      "الحالة":
        order.statusName ||
        getStatusName(order.status) ||
        "—",

      "الفرع": order.pickupBranchName || "—",

      "الوصف": order.description || "—",
    };

    if (canViewPhone) {
      row["رقم الهاتف"] = order.customerPhone || order.phoneNumber || order.phone || "—";
    }

    return row;
  });

// ===============================
// تصدير Excel
// ===============================
export function exportRepairsToExcel(
  orders,
  filename = "repairs",
  canViewPhone = false
) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return;
  }

  const rows = buildRows(orders, canViewPhone);

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // عرض الأعمدة
  worksheet["!cols"] = [
    { wch: 23 },
    { wch: 25 },
    { wch: 22 },
    { wch: 25 },
    { wch: 45 },
    ...(canViewPhone ? [{ wch: 20 }] : []),
  ];

  // اتجاه الورقة
  worksheet["!dir"] = "rtl";

  // تثبيت الصف الأول
  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "التصاليح"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(
    blob,
    `${filename}_${Date.now()}.xlsx`
  );
}
