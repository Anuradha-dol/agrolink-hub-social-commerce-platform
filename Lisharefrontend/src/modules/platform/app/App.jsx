import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { AuthProvider } from "./store";
import { ToastProvider } from "/src/modules/platform/common/hooks/useToast";
import ToastHost from "/src/modules/platform/common/components/ToastHost";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastHost />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
