import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppRouter from "./routes/AppRouter.jsx";

function App() {
  return (
    <>
      <AppRouter />

      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        rtl
      />
    </>
  );
}

export default App;