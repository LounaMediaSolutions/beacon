import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import type { ReactElement } from "react";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <FullScreenSpinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/contact/:slug" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
