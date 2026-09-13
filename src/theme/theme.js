import { createTheme } from "@mui/material/styles";

export const getTheme = (mode = "light") =>
  createTheme({
    direction: "rtl",

    palette: {
      mode,

      primary: {
        main: mode === "light" ? "#b8860b" : "#d4af6a",
      },

      secondary: {
        main: "#d4af6a",
      },

      background: {
        default: mode === "light" ? "#faf6ee" : "#1a1510",
        paper: mode === "light" ? "#ffffff" : "#2b2113",
      },

      text: {
        primary: mode === "light" ? "#2b2b2b" : "#f1f1f1",
        secondary: mode === "light" ? "#6b6b6b" : "#b0b0b0",
      },

      error: {
        main: mode === "light" ? "#d32f2f" : "#ef5350",
      },

      success: {
        main: mode === "light" ? "#2e7d32" : "#66bb6a",
      },
    },

    typography: {
      fontFamily: ["Cairo", "Arial", "sans-serif"].join(","),
      button: {
        textTransform: "none",
      },
    },

    shape: {
      borderRadius: 8,
    },

    components: {
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });

export default getTheme("light");