import React, { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Context'ler ve Provider'ları import ediyoruz
import { AuthProvider, AuthContext } from "./context/AuthContext";
import LoadingScreen from "./components/LoadingScreen";
import { CartProvider, CartContext } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Rota Koruyucuları
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import SalesRepRoute from "./components/salesrep/SalesRepRoute";
import SupplierRoute from "./components/SupplierRoute";
import SupplierLayout from "./components/supplier/SupplierLayout";

// Layout ve Genel Bileşenler
import Navbar from "./components/Navbar";
import SidebarCart from "./components/SidebarCart";
import BackToTopButton from "./components/ui/BackToTopButton";
import AdminLayout from "./components/admin/AdminLayout";
import SalesRepLayout from "./components/salesrep/SalesRepLayout";
import ProfileLayout from "./pages/profile/ProfileLayout";

// Genel Sayfalar
import AuthPage from "./pages/AuthPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import MaintenancePage from "./pages/MaintenancePage"; // Bakım sayfası
import { API_BASE_URL } from "./config/api"; // API URL
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Kampanya from "./pages/Kampanya";

// Profil Sayfaları
import MyOrdersPage from "./pages/profile/MyOrdersPage";
import UserInfoPage from "./pages/profile/UserInfoPage";
import WishlistPage from "./pages/profile/WishlistPage";
import MyQuotesPage from "./pages/profile/MyQuotesPage";
import AccountStatementPage from "./pages/profile/AccountStatementPage";
import CreateReturnPage from "./pages/customer/CreateReturnPage";

// Admin Sayfaları
import DashboardPage from "./pages/admin/DashboardPage";
import UserListPage from "./pages/admin/UserListPage";
import UserEditPage from "./pages/admin/UserEditPage";

import ProductEditPage from "./pages/admin/ProductEditPage";
import OrderListPage from "./pages/admin/OrderListPage";
import PaymentTrackingPage from "./pages/admin/PaymentTrackingPage";
import OrderDetailPage from "./pages/admin/OrderDetailPage";
import CategoryListPage from "./pages/admin/CategoryListPage";
import CategoryEditPage from "./pages/admin/CategoryEditPage";
import SettingsPage from "./pages/admin/SettingsPage";
import InventoryPage from "./pages/admin/InventoryPage";
import ProductListPage from "./pages/admin/ProductListPage";
import ProductTreeListPage from "./pages/admin/ProductTreeListPage";
import ProductTreeEditPage from "./pages/admin/ProductTreeEditPage";
import QuoteListPage from "./pages/admin/QuoteListPage";
import QuoteEditPage from "./pages/admin/QuoteEditPage";
import BackordersPage from "./pages/admin/BackordersPage";
import PriceListPage from "./pages/admin/PriceListPage";
import PriceListEditPage from "./pages/admin/PriceListEditPage";
import ReturnListPage from "./pages/admin/ReturnListPage";
import ReturnDetailPage from "./pages/admin/ReturnDetailPage"; // Bunu bir sonraki adımda oluşturacağız

// Satış Temsilcisi Sayfaları
import SalesRepDashboardPage from "./pages/salesrep/SalesRepDashboardPage";
import MyCustomersPage from "./pages/salesrep/MyCustomersPage";
import NewOrderPage from "./pages/salesrep/NewOrderPage";
import NewQuotePage from "./pages/shared/NewQuotePage";
import CashboxPage from "./pages/salesrep/CashboxPage";
import QuotesPage from "./pages/salesrep/QuotesPage";
import OrdersPage from "./pages/supplier/OrdersPage";
import ProductAddPage from "./pages/supplier/ProductAddPage";
import AccountPage from "./pages/supplier/AccountPage";
import SalesRepOrderDetailPage from "./pages/salesrep/OrderDetailPage";
import PendingOrdersPage from "./pages/salesrep/PendingOrdersPage";
import CustomerStatementPage from "./pages/salesrep/CustomerStatementPage";
import CreateReturnForCustomerPage from "./pages/salesrep/CreateReturnForCustomerPage";
import CreateProductionOrderPage from "./pages/admin/CreateProductionOrderPage";
import ManufacturingModule from "./components/admin/ManufacturingModule";

// Genel Stil Dosyası
import "./App.css";

// Müşteri Arayüzü İçin Ana Layout Bileşeni
const MainLayout = () => {
  const { isCartOpen } = useContext(CartContext);
  return (
    <div className={`app-wrapper ${isCartOpen ? "sidebar-active" : ""}`}>
      <div className="main-content">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
      <SidebarCart />
      <BackToTopButton />
    </div>
  );
};

// Ana Rotaları İçeren İçerik Bileşeni
const AppContent = () => {
  const location = useLocation();
  const { user, loading, authToken } = useContext(AuthContext);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    isActive: false,
    message: "",
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/status`);
        const data = await res.json();
        if (res.ok) {
          setMaintenanceStatus({
            isActive: data.maintenanceMode,
            message: data.maintenanceMessage,
          });
        } else {
          // Hata durumunda siteyi normal çalışır varsayalım ki kimse mağdur olmasın
          setMaintenanceStatus({ isActive: false, message: "" });
        }
      } catch (error) {
        console.error("Bakım modu durumu kontrol edilemedi:", error);
        setMaintenanceStatus({ isActive: false, message: "" });
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkMaintenanceStatus();
  }, []);

  // AuthContext'ten gelen yükleme durumu veya bakım modu kontrolü devam ediyorsa
  if (loading || isCheckingStatus) {
    return <LoadingScreen />;
  }

  // Bakım modu aktifse ve kullanıcı admin değilse bakım sayfasını göster
  if (maintenanceStatus.isActive && (!user || user.role !== "admin")) {
    // Allow access to login and authentication routes during maintenance
    if (
      location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/admin/login")
    ) {
      // continue to regular routing to let user log in
    } else if (location.pathname.startsWith("/admin")) {
      // Redirect any admin path to login so that admin can authenticate
      return <Navigate to="/login" replace />;
    } else {
      return <MaintenancePage message={maintenanceStatus.message} />;
    }
  }

  return (
    <Routes>
      {/* Authentication routes without layout */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/kampanya" element={<Kampanya />} />

      {/* Admin Routes with AdminLayout */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="orders" element={<OrderListPage />} />
        <Route
          path="create-production-order"
          element={<CreateProductionOrderPage />}
        />
        <Route path="manufacturing-module" element={<ManufacturingModule />} />
        <Route path="orders/page/:pageNumber" element={<OrderListPage />} />
        <Route path="order/:id" element={<OrderDetailPage />} />
        <Route path="payments" element={<PaymentTrackingPage />} />
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UserListPage />} />
        <Route path="users/page/:pageNumber" element={<UserListPage />} />
        <Route path="user/:id/edit" element={<UserEditPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/page/:pageNumber" element={<ProductListPage />} />
        <Route path="product/new" element={<ProductEditPage />} />
        <Route path="product/:id" element={<ProductEditPage />} />
        <Route path="categories" element={<CategoryListPage />} />
        <Route path="category/new" element={<CategoryEditPage />} />
        <Route path="category/:id" element={<CategoryEditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Orders Routes */}
        <Route path="orders" element={<OrderListPage />} />
        <Route path="orders/page/:pageNumber" element={<OrderListPage />} />
        <Route path="order/:id" element={<OrderDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="product-trees" element={<ProductTreeListPage />} />
        <Route path="product-tree/new" element={<ProductTreeEditPage />} />
        <Route path="product-tree/:id" element={<ProductTreeEditPage />} />
        <Route path="backorders" element={<BackordersPage />} />
        <Route path="quotes" element={<QuoteListPage />} />
        <Route path="quote/:id" element={<QuoteEditPage />} />
        <Route path="pricelists" element={<PriceListPage />} />
        <Route path="pricelists/:id" element={<PriceListEditPage />} />
        <Route path="returns" element={<ReturnListPage />} />
        <Route path="return/:id" element={<ReturnDetailPage />} />
      </Route>

      {/* Supplier Routes with SupplierLayout */}
      <Route
        path="/supplier"
        element={
          <SupplierRoute>
            <SupplierLayout />
          </SupplierRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="product/new" element={<ProductAddPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>

      {/* SalesRep Routes with SalesRepLayout */}
      <Route
        path="/portal"
        element={
          <SalesRepRoute>
            <SalesRepLayout />
          </SalesRepRoute>
        }
      >
        <Route path="dashboard" element={<SalesRepDashboardPage />} />
        <Route path="pending-orders" element={<PendingOrdersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<SalesRepOrderDetailPage />} />
        <Route path="customers" element={<MyCustomersPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route
          path="customers/:customerId/statement"
          element={<CustomerStatementPage />}
        />
        <Route path="new-order" element={<NewOrderPage />} />
        <Route path="new-order/:customerId" element={<NewOrderPage />} />
        <Route path="new-quote" element={<NewQuotePage />} />
        <Route path="cashbox" element={<CashboxPage />} />
        <Route path="create-return" element={<CreateReturnForCustomerPage />} />
      </Route>

      {/* Main application routes with MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Profile pages with ProfileLayout */}
        <Route path="profile" element={<ProfileLayout />}>
          <Route path="info" element={<UserInfoPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="quotes" element={<MyQuotesPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="statement" element={<AccountStatementPage />} />
          <Route path="create-return" element={<CreateReturnPage />} />
        </Route>

        {/* Other main pages */}
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/page/:pageNumber" element={<ProductsPage />} />
        <Route path="search/:keyword" element={<ProductsPage />} />
        <Route
          path="search/:keyword/page/:pageNumber"
          element={<ProductsPage />}
        />
        <Route path="category/:categoryId" element={<ProductsPage />} />
        <Route
          path="category/:categoryId/page/:pageNumber"
          element={<ProductsPage />}
        />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="new-quote" element={<NewQuotePage />} />
      </Route>

      {/* A catch-all for any other path, maybe redirect to products or a 404 page */}
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
};

// Ana Uygulama Bileşeni
function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
            />
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
