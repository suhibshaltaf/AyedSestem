import api from "../api/axios.js";

const getSettings = async () => (await api.get("/organization-settings")).data;
const updateSettings = async (settings) =>
  (await api.put("/organization-settings", settings)).data;

export default { getSettings, updateSettings };
