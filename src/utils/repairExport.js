import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getStatusName } from "./repairConstants.js";

// ===============================
// ✅ أدوات مساعدة
// ===============================
const formatDate = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("ar-JO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
};

const buildRows = (orders) =>
  orders.map((order, index) => ({
    "#": index + 1,
    "الباركود": order.barcode || "—",
    "العميل": order.customerName || "—",
    "الهاتف": order.customerPhone || "—",
    "الوصف": order.description || "—",
    "الفرع": order.pickupBranchName || "—",
    "الحالة": getStatusName(order.status),
    "الموقع الحالي": order.currentLocationName || "—",
    "المسؤول": order.currentHolderName || "—",
    "تاريخ الإنشاء": formatDate(order.createdAt),
  }));

// ===============================
// ✅ تصدير Excel
// ===============================
export function exportRepairsToExcel(orders, filename = "repairs") {
  if (!orders || orders.length === 0) return;

  const rows = buildRows(orders);
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: Object.keys(rows[0]),
  });

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 35 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
  ];

  worksheet["!dir"] = "rtl";
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "التصاليح");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${filename}_${Date.now()}.xlsx`);
}