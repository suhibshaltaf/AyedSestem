import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { Html5Qrcode } from "html5-qrcode";

const READER_ID = "qr-scanner-reader";

export default function QrScannerDialog({ open, onClose, onScan }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  // ===============================
  // تشغيل الكاميرا عند فتح الـ Dialog
  // ===============================
  useEffect(() => {
    if (!open) return undefined;

    setError("");
    setStarting(true);
    setReady(false);
    hasScannedRef.current = false;

    const scanner = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = scanner;

    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (cancelled || hasScannedRef.current) return;
          hasScannedRef.current = true;

          // نوقف الكاميرا ثم نرجع النتيجة
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              if (typeof onScan === "function") {
                onScan(decodedText);
              }
            });
        },
        () => {
          // أخطاء القراءة الفردية — نتجاهلها
        }
      )
      .then(() => {
        if (cancelled) return;
        setStarting(false);
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setStarting(false);
        setReady(false);
        const msg = String(err?.message || err || "");
        if (msg.toLowerCase().includes("permission")) {
          setError("تم رفض إذن الكاميرا. الرجاء السماح بالوصول للكاميرا.");
        } else if (msg.toLowerCase().includes("notfound")) {
          setError("لم يتم العثور على كاميرا على هذا الجهاز.");
        } else {
          setError("تعذر تشغيل الكاميرا. تأكد من صلاحيات المتصفح.");
        }
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        try {
          s.stop()
            .catch(() => {})
            .finally(() => {
              try {
                s.clear();
              } catch {
                /* ignore */
              }
            });
        } catch {
          /* ignore */
        }
      }
    };
  }, [open, onScan]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      dir="rtl"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Cairo', sans-serif",
          fontWeight: 700,
          color: "var(--gold-primary)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <QrCodeScannerIcon />
          <span>مسح QR / الباركود</span>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="إغلاق">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: "'Cairo', sans-serif" }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            backgroundColor: "#000",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            id={READER_ID}
            style={{ width: "100%", height: "100%" }}
          />

          {starting && !error && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            >
              <CircularProgress sx={{ color: "var(--gold-primary)" }} />
              <Typography sx={{ fontFamily: "'Cairo', sans-serif" }}>
                جاري تشغيل الكاميرا...
              </Typography>
            </Box>
          )}
        </Box>

        {ready && !error && (
          <Typography
            sx={{
              mt: 2,
              textAlign: "center",
              fontFamily: "'Cairo', sans-serif",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            وجّه الكاميرا نحو رمز QR أو الباركود
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            fontFamily: "'Cairo', sans-serif",
            textTransform: "none",
            borderColor: "var(--border-gold-strong)",
            color: "var(--text-secondary)",
          }}
        >
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}