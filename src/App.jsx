import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/shared/Toast";
import { useAuth } from "./hooks/useAuth";
import Loader from "./components/shared/Loader";

// Pages
import HomePage from "./pages/customer/HomePage";
import ProductPage from "./pages/customer/ProductPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UploadPage from "./pages/admin/UploadPage";
import OrdersPage from "./pages/admin/OrdersPage";
import HeroSettingsPage from "./pages/admin/HeroSettingsPage";
import CartDrawer from "./components/customer/CartDrawer";
import TrackOrderPage from "./pages/customer/TrackOrderPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";

// Layout
import AdminLayout from "./components/admin/AdminLayout";

// Protected Route wrapper — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-earth-50">
        <Loader size="large" text="Loading..." />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Redirect to dashboard if already logged in
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-earth-50">
        <Loader size="large" text="Loading..." />
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
    <Routes>
      {/* Admin Login */}
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="inventory" element={<DashboardPage />} /> {/* Placeholder — Phase 2 */}
        <Route path="settings" element={<HeroSettingsPage />} />
      </Route>

      {/* Customer Frontend Routes */}
      <Route path="/">
        <Route index element={<HomePage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="track-order" element={<TrackOrderPage />} />
        <Route path="my-orders" element={<MyOrdersPage />} />
      </Route>

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CartDrawer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
