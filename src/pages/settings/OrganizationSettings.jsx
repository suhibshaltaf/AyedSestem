import { Box, Paper, Typography, Alert } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

export default function OrganizationSettings() {
  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 1000,
        mx: "auto",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 1,
        }}
      >
        <SettingsIcon color="primary" sx={{ fontSize: 32 }} />

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "var(--gold-dark)",
          }}
        >
          إعدادات المؤسسة
        </Typography>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        معلومات المؤسسة وإعدادات عرض رموز التصليحات.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          border: "1px solid var(--border-gold-strong)",
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          جاري العمل على API الخاص بإعدادات المؤسسة
        </Alert>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          إعدادات المؤسسة قيد التطوير
        </Typography>

        <Typography color="text.secondary">
          سيتم تفعيل هذه الصفحة بعد الانتهاء من تطوير وربط API الخاص
          بإعدادات المؤسسة.
        </Typography>
      </Paper>
    </Box>
  );
}