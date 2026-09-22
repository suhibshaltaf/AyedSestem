import { Component } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("=== Error Boundary ===");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            backgroundColor: "var(--bg-default)",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid var(--border-gold-strong)",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Cairo', sans-serif",
                fontWeight: 700,
                color: "#d32f2f",
                mb: 2,
              }}
            >
              ⚠️ حدث خطأ في التطبيق
            </Typography>

            <Typography
              sx={{
                fontFamily: "'Cairo', sans-serif",
                color: "var(--text-secondary)",
                mb: 2,
                direction: "ltr",
                textAlign: "left",
                fontSize: "0.85rem",
                backgroundColor: "rgba(0,0,0,0.05)",
                p: 2,
                borderRadius: 1,
                overflow: "auto",
              }}
            >
              {this.state.error?.message}
            </Typography>

            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                fontFamily: "'Cairo', sans-serif",
                background:
                  "linear-gradient(90deg, #c79a4b, #a67c2e)",
                color: "#fff",
              }}
            >
              إعادة تحميل الصفحة
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}