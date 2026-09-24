import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import KeyboardIcon from "@mui/icons-material/Keyboard";

import QrScannerDialog from "../../components/scanner/QrScannerDialog.jsx";
import ScanResultDialog from "../../components/scanner/ScanResultDialog.jsx";
import { useScanRepairOrder } from "../../hooks/useRepairOrders.js";
import "../../styles/scan.css";

export default function ScanRepair() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [resultOpen, setResultOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const scanMutation = useScanRepairOrder();
  const busy = scanMutation.isPending;

  // ===============================
  // تنفيذ المسح (يُستخدم من الكاميرا أو الإدخال اليدوي)
  // ===============================
  const performScan = async (value) => {
    const code = String(value || "").trim();
    if (!code || busy) return;

    setError("");
    setCameraOpen(false);

    try {
      const response = await scanMutation.mutateAsync({ barcode: code });
      const data = response?.data;

      if (!data) {
        setError(response?.message || "لم يتم إرجاع نتيجة من الخادم");
        return;
      }

      setScanResult(data);
      setResultOpen(true);
      setBarcode("");
    } catch (err) {
      const resData = err?.response?.data;
      const msg =
        resData?.errors?.[0] ||
        resData?.message ||
        "تعذر معالجة الباركود";
      setError(msg);
    }
  };

  // ===============================
  // من الكاميرا
  // ===============================
  const handleCameraScan = (decodedText) => {
    performScan(decodedText);
  };

  // ===============================
  // من الإدخال اليدوي
  // ===============================
  const handleManualSubmit = (event) => {
    event.preventDefault();
    performScan(barcode);
  };

  // ===============================
  // إغلاق نافذة النتيجة والاستعداد لمسح آخر
  // ===============================
  const handleCloseResult = () => {
    setResultOpen(false);
    setScanResult(null);
  };

  const handleScanAnother = () => {
    setResultOpen(false);
    setScanResult(null);
    setCameraOpen(true);
  };

  return (
    <Box className="scan-repair-page" dir="rtl">
      <Paper elevation={0} className="scan-repair-card">
        <Box className="scan-repair-header">
          <QrCodeScannerIcon sx={{ fontSize: 56 }} />
          <Typography className="scan-repair-title">مسح قطعة</Typography>
          <Typography className="scan-repair-subtitle">
            امسح رمز QR أو الباركود باستخدام الكاميرا، أو أدخل الرقم يدويًا.
            <br />
            سيقوم النظام تلقائيًا بتنفيذ الحركة المناسبة.
          </Typography>
        </Box>

        {/* زر الكاميرا */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => {
            setError("");
            setCameraOpen(true);
          }}
          disabled={busy}
          className="scan-repair-camera-btn"
        >
          مسح QR بالكاميرا
        </Button>

        <Box className="scan-repair-divider">
          <span>أو</span>
        </Box>

        {/* الإدخال اليدوي */}
        <Box component="form" onSubmit={handleManualSubmit}>
          <TextField
            fullWidth
            label="رقم الباركود"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={busy}
            inputProps={{ dir: "ltr" }}
            className="scan-repair-input"
            slotProps={{
              input: {
                startAdornment: (
                  <KeyboardIcon
                    sx={{ color: "#c9a44c", mr: 1, fontSize: 20 }}
                  />
                ),
              },
            }}
          />

          <Button
            fullWidth
            variant="outlined"
            type="submit"
            disabled={busy || !barcode.trim()}
            className="scan-repair-submit-btn"
            sx={{ mt: 2 }}
          >
            {busy ? (
              <CircularProgress size={22} sx={{ color: "#b8860b" }} />
            ) : (
              "تنفيذ المسح"
            )}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className="scan-repair-alert">
            {error}
          </Alert>
        )}
      </Paper>

      {/* نافذة الكاميرا */}
      <QrScannerDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={handleCameraScan}
      />

      {/* نافذة النتيجة */}
      <ScanResultDialog
        open={resultOpen}
        data={scanResult}
        onClose={handleCloseResult}
        onScanAnother={handleScanAnother}
      />
    </Box>
  );
}