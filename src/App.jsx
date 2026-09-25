import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppRouter from "./routes/AppRouter.jsx";

function App() {
  return (
    <>
      <AppRouter />

      {/* ✅ حاوية للتوستات العادية (تختفي تلقائياً) */}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
      />

      {/* ✅ حاوية للتوستات المهمة (تبقى حتى يسكّرها المستخدم) */}
      <ToastContainer
        containerId="persistent"
        position="top-center"
        autoClose={false}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={true}
        rtl
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
        theme="light"
        limit={3}
      />
    </>
  );
}

export default App;