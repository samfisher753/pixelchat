import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/feed" element={null} />
          <Route path="/chat" element={null} />
          <Route path="/profile" element={null} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
