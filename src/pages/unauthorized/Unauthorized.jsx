import {
  Box,
  Typography,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Typography variant="h4">
        غير مصرح لك
      </Typography>

      <Typography color="text.secondary">
        ليس لديك صلاحية للوصول إلى هذه الصفحة
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate("/dashboard")}
      >
        العودة للوحة التحكم
      </Button>
    </Box>
  );
}