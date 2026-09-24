import { useState, useEffect, useRef } from "react";
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
import ScannerIcon from "@mui/icons-material/DocumentScanner";

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

  // ✅ للقارئ
  const inputRef = useRef(null);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const timerRef = useRef(null);

  // ===============================
  // تنفيذ المسح
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
  // ✅ التقاط إدخال القارئ (USB Barcode Scanner)
  // القارئ يكتب بسرعة + Enter
  // ===============================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // نتجاهل لو الـ Dialog مفتوح أو الـ input مفعّل يدوياً
      if (cameraOpen || resultOpen) return;

      // نتجاهل لو ضغط على TextField (المستخدم بيكتب يدوياً)
      if (document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // ✅ إذا الفرق بين الأحرف كبير → بداية barcode جديد
      if (diff > 100) {
        bufferRef.current = "";
      }

      // ✅ Enter → تنفيذ
      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";

        if (code.length >= 3) {
          e.preventDefault();
          performScan(code);
        }
        return;
      }

      // ✅ حرف عادي (حرف واحد)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // ✅ timer: إذا مرت 500ms بدون Enter → نصفّر
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 500);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cameraOpen, resultOpen, busy]);

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
  // إغلاق النتيجة
  // ===============================
  const handleCloseResult = () => {
    setResultOpen(false);
    setScanResult(null);
    setError("");
    setBarcode("");
  };

  const handleScanAnother = () => {
    setResultOpen(false);
    setScanResult(null);
    setError("");
    setBarcode("");
  };

  return (
    <Box className="scan-repair-page" dir="rtl">
      <Paper elevation={0} className="scan-repair-card">
        <Box className="scan-repair-header">
          <QrCodeScannerIcon sx={{ fontSize: 56 }} />
          <Typography className="scan-repair-title">مسح قطعة</Typography>
          <Typography className="scan-repair-subtitle">
            استخدم قارئ الباركود مباشرة، أو امسح بالكاميرا، أو أدخل الرقم يدويًا.
            <br />
            سيقوم النظام تلقائيًا بتنفيذ الحركة المناسبة.
          </Typography>
        </Box>

        {/* ✅ تنبيه القارئ */}
        <Box className="scan-repair-reader-hint">
          <ScannerIcon sx={{ fontSize: 20 }} />
          <span>القارئ جاهز — وجّه القارئ نحو الباركود وسيتم المسح تلقائياً</span>
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
          <span>أو أدخل الرقم يدويًا</span>
        </Box>

        {/* الإدخال اليدوي */}
        <Box component="form" onSubmit={handleManualSubmit}>
          <TextField
            fullWidth
            label="رقم الباركود"
            placeholder="مثال: AB-2026-000001"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={busy}
            inputRef={inputRef}
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