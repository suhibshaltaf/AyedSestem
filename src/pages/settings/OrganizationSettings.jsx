import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Paper, Typography, Grid, TextField, Button, Switch, FormControlLabel, Alert, CircularProgress } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";
import organizationService from "../../services/organizationService.js";
import useAuthStore from "../../store/useAuthStore.js";

const defaults = {
  organizationName: "", englishName: "", phoneNumber: "", address: "", email: "",
  logoUrl: "", repairTerms: "", showBarcode: true, showQrCode: true,
};

export default function OrganizationSettings() {
  const user = useAuthStore((state) => state.user);
  const canEdit = useMemo(() => user?.roles?.some((role) => ["SuperAdmin", "Admin"].includes(role.name)), [user]);
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["organization-settings"], queryFn: organizationService.getSettings });
  const [form, setForm] = useState(defaults);
  const [feedback, setFeedback] = useState(null);
  useEffect(() => { if (data) setForm({ ...defaults, ...data }); }, [data]);
  const mutation = useMutation({
    mutationFn: organizationService.updateSettings,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["organization-settings"] }); setFeedback({ type: "success", text: "تم حفظ الإعدادات بنجاح" }); },
    onError: (error) => setFeedback({ type: "error", text: error?.response?.data?.message || "تعذر حفظ الإعدادات" }),
  });
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const fields = [
    ["organizationName", "اسم المؤسسة *"], ["englishName", "الاسم بالإنجليزية"],
    ["phoneNumber", "رقم الهاتف"], ["email", "البريد الإلكتروني"],
    ["address", "العنوان"], ["logoUrl", "رابط الشعار"],
  ];

  return (
    <Box dir="rtl" sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--gold-dark)" }}>إعدادات المؤسسة</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>معلومات المؤسسة التي تظهر في النظام وإعدادات عرض رموز التصليحات.</Typography>
      {isError && <Alert severity="error" sx={{ mb: 2 }}>تعذر تحميل الإعدادات. حاول تحديث الصفحة.</Alert>}
      {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>{feedback.text}</Alert>}
      {isLoading ? <CircularProgress /> : <Paper component="form" elevation={0} onSubmit={(event) => {
        event.preventDefault(); if (canEdit && form.organizationName.trim()) mutation.mutate(form);
      }} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid var(--border-gold-strong)", borderRadius: 3 }}>
        <Grid container spacing={2.5}>
          {fields.map(([name, label]) => <Grid item xs={12} sm={6} key={name}>
            <TextField fullWidth label={label} type={name === "email" ? "email" : "text"}
              value={form[name] ?? ""} onChange={(event) => set(name, event.target.value)}
              inputProps={{ maxLength: name === "logoUrl" ? 500 : name === "address" ? 200 : 150 }}
              required={name === "organizationName"} disabled={!canEdit} />
          </Grid>)}
          <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="شروط التصليح" value={form.repairTerms ?? ""}
            onChange={(event) => set("repairTerms", event.target.value)} inputProps={{ maxLength: 2000 }} disabled={!canEdit} /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel label="إظهار الباركود" control={<Switch checked={!!form.showBarcode}
            onChange={(event) => set("showBarcode", event.target.checked)} disabled={!canEdit} />} /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel label="إظهار QR" control={<Switch checked={!!form.showQrCode}
            onChange={(event) => set("showQrCode", event.target.checked)} disabled={!canEdit} />} /></Grid>
        </Grid>
        {canEdit ? <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={mutation.isPending}
          sx={{ mt: 3, px: 4, py: 1.2 }}>{mutation.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</Button>
          : <Typography color="text.secondary" sx={{ mt: 3 }}>هذه الإعدادات للعرض فقط. التعديل متاح لإدارة النظام.</Typography>}
      </Paper>}
    </Box>
  );
}
