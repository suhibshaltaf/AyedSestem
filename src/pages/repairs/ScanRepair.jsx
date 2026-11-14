
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
import useThemeStore from "../../store/useThemeStore.js";

import styles from "../../styles/Repairs/ScanRepair.module.css";

export default function ScanRepair() {
  const navigate = useNavigate();

  const mode = useThemeStore((state) => state.mode);
  const isDark = mode === "dark";

  const [cameraOpen, setCameraOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [resultOpen, setResultOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const scanMutation = useScanRepairOrder();
  const busy = scanMutation.isPending;

  const inputRef = useRef(null);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const timerRef = useRef(null);

  // تنفيذ المسح
  const performScan = async (value) => {
    const code = String(value || "").trim();

    if (!code || busy) return;

    setError("");
    setCameraOpen(false);

    try {
      const response = await scanMutation.mutateAsync({
        barcode: code,
      });

      const data = response?.data;

      if (!data) {
        setError(
          response?.message || "لم يتم إرجاع نتيجة من الخادم"
        );
        return;
      }

      // المسح الثاني للمشغل: فتح صفحة التعديل
      if (data.shouldOpenEdit) {
        setBarcode("");
        bufferRef.current = "";
        setScanResult(null);
        setResultOpen(false);

        navigate(`/repairs/${data.repairOrderId}/edit`);
        return;
      }

      // الحركات العادية: عرض نتيجة المسح
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

  // التقاط إدخال قارئ الباركود USB
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (cameraOpen || resultOpen) return;

      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;

      lastKeyTimeRef.current = now;

      if (diff > 100) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const code = bufferRef.current.trim();

        bufferRef.current = "";

        if (code.length >= 3) {
          e.preventDefault();
          performScan(code);
        }

        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 500);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [cameraOpen, resultOpen, busy]);

  // من الكاميرا
  const handleCameraScan = (decodedText) => {
    performScan(decodedText);
  };

  // من الإدخال اليدوي
  const handleManualSubmit = (event) => {
    event.preventDefault();
    performScan(barcode);
  };

  // إغلاق النتيجة
  const handleCloseResult = () => {
    setResultOpen(false);
    setScanResult(null);
    setError("");
    setBarcode("");
  };

  // مسح قطعة أخرى
  const handleScanAnother = () => {
    setResultOpen(false);
    setScanResult(null);
    setError("");
    setBarcode("");
  };

  return (
    <Box
      className={`${styles.scanRepairPage} ${
        isDark ? styles.darkMode : styles.lightMode
      }`}
      dir="rtl"
    >
      <Paper elevation={0} className={styles.scanRepairCard}>
        <Box className={styles.scanRepairHeader}>
          <Box className={styles.headerIcon}>
            <QrCodeScannerIcon />
          </Box>

          <Typography className={styles.scanRepairTitle}>
            مسح قطعة
          </Typography>

          <Typography className={styles.scanRepairSubtitle}>
            استخدم قارئ الباركود مباشرة، أو امسح بالكاميرا، أو أدخل الرقم يدويًا.
            <br />
            سيقوم النظام تلقائيًا بتنفيذ الحركة المناسبة.
          </Typography>
        </Box>

        {/* تنبيه القارئ */}
        <Box className={styles.scanReaderHint}>
          <ScannerIcon />

          <span>
            القارئ جاهز — وجّه القارئ نحو الباركود وسيتم المسح تلقائياً
          </span>
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
          className={styles.scanCameraButton}
        >
          مسح QR بالكاميرا
        </Button>

        <Box className={styles.scanDivider}>
          <span>أو أدخل الرقم يدويًا</span>
        </Box>

        {/* الإدخال اليدوي */}
        <Box
          component="form"
          onSubmit={handleManualSubmit}
          className={styles.scanForm}
        >
          <TextField
            fullWidth
            label="رقم الباركود"
            placeholder="مثال: AB-2026-000001"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={busy}
            inputRef={inputRef}
            inputProps={{ dir: "ltr" }}
            className={styles.scanInput}
            slotProps={{
              input: {
                startAdornment: (
                  <KeyboardIcon className={styles.keyboardIcon} />
                ),
              },
            }}
          />

          <Button
            fullWidth
            variant="outlined"
            type="submit"
            disabled={busy || !barcode.trim()}
            className={styles.scanSubmitButton}
          >
            {busy ? (
              <CircularProgress
                size={22}
                className={styles.loadingIcon}
              />
            ) : (
              "تنفيذ المسح"
            )}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className={styles.scanAlert}>
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
