import authAxiosInstance from "../api/axios.js";
import axios from "axios";

// ===============================
// axios عام للـ public endpoints (بدون token)
// ===============================
const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ===============================
// 1. CREATE REPAIR ORDER
// POST /api/RepairOrders
// Roles: BranchManager, BranchAccountant
// ===============================
const createRepairOrder = async (data) => {
  const response = await authAxiosInstance.post("/RepairOrders", data);
  return response.data;
};

// ===============================
// 2. GET REPAIR ORDERS (List)
// GET /api/RepairOrders
// Query: fromDate, toDate, branchId, deliveryBranchId, status
// ===============================
const getRepairOrders = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.fromDate) query.append("fromDate", params.fromDate);
  if (params.toDate) query.append("toDate", params.toDate);
  if (params.branchId) query.append("branchId", params.branchId);
  if (params.deliveryBranchId)
    query.append("deliveryBranchId", params.deliveryBranchId);
  if (params.status) query.append("status", params.status);

  const queryString = query.toString();
  const url = queryString
    ? `/RepairOrders?${queryString}`
    : "/RepairOrders";

  const response = await authAxiosInstance.get(url);
  return response.data;
};

// ===============================
// 3. GET REPAIR BY ID
// GET /api/RepairOrders/{id}
// ===============================
const getRepairOrderById = async (id) => {
  const response = await authAxiosInstance.get(`/RepairOrders/${id}`);
  return response.data;
};

// ===============================
// 4. GET REPAIR BY BARCODE
// GET /api/RepairOrders/barcode/{barcode}
// ===============================
const getRepairOrderByBarcode = async (barcode) => {
  const response = await authAxiosInstance.get(
    `/RepairOrders/barcode/${barcode}`
  );
  return response.data;
};

// ===============================
// 5. ADD REPAIR MOVEMENT
// POST /api/RepairOrders/movement
// Body: { barcode, movementType, notes }
// ===============================
const addRepairMovement = async (data) => {
  const response = await authAxiosInstance.post(
    "/RepairOrders/movement",
    data
  );
  return response.data;
};

// ===============================
// 6. REPRESENTATIVE DASHBOARD
// GET /api/RepairOrders/representative/dashboard
// ===============================
const getRepresentativeDashboard = async () => {
  const response = await authAxiosInstance.get(
    "/RepairOrders/representative/dashboard"
  );
  return response.data;
};

// ===============================
// 7. REPRESENTATIVE ORDERS
// GET /api/RepairOrders/representative/orders
// ===============================
const getRepresentativeOrders = async () => {
  const response = await authAxiosInstance.get(
    "/RepairOrders/representative/orders"
  );
  return response.data;
};

// ===============================
// 8. ADMIN: REPRESENTATIVES SUMMARY
// GET /api/RepairOrders/representatives/summary
// Roles: SuperAdmin, Admin
// ===============================
const getRepresentativesSummary = async () => {
  const response = await authAxiosInstance.get(
    "/RepairOrders/representatives/summary"
  );
  return response.data;
};

// ===============================
// 9. PUBLIC CUSTOMER TRACKING
// GET /api/RepairOrders/track?barcode=X
// NO AUTH
// ===============================
const trackRepairOrder = async (barcode) => {
  const response = await publicAxios.get(
    `/RepairOrders/track?barcode=${encodeURIComponent(barcode)}`
  );
  return response.data;
};

const repairOrderService = {
  createRepairOrder,
  getRepairOrders,
  getRepairOrderById,
  getRepairOrderByBarcode,
  addRepairMovement,
  getRepresentativeDashboard,
  getRepresentativeOrders,
  getRepresentativesSummary,
  trackRepairOrder,
};

export default repairOrderService;