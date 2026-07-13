import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { SettingsProvider } from "./context/SettingsContext";
import { PromoProvider } from "./context/PromoContext";
import PublicLayout from "./component/PublicLayout";
import ScrollToTop from "./component/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Review from "./pages/Review";
import Contact from "./pages/Contact";
import Menu from "./pages/Menu";
import Gallery from "./pages/Gallery";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PaymentPolicy from "./pages/PaymentPolicy";
import TrackOrder from "./pages/TrackOrder";
import CompletePayment from "./pages/CompletePayment";
import ReceiptPage from "./pages/ReceiptPage";

// Admin imports
import AdminLayout from "./admin/layouts/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Orders from "./admin/pages/Orders";
import OrderHistory from "./admin/pages/OrderHistory";
import PaymentVerification from "./admin/pages/PaymentVerification";
import MenuManagement from "./admin/pages/MenuManagement";
import Categories from "./admin/pages/Categories";
import Customers from "./admin/pages/Customers";
import ContactMessages from "./admin/pages/ContactMessages";
import Reviews from "./admin/pages/Reviews";
import Notifications from "./admin/pages/Notifications";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";
import Backups from "./admin/pages/Backups";
import Legal from "./admin/pages/Legal";
import Promotions from "./admin/pages/Promotions";
import GalleryManagement from "./admin/pages/GalleryManagement";
import DeliveryZones from "./admin/pages/DeliveryZones";
import StaffManagement from "./admin/pages/StaffManagement";
import StockManagement from "./admin/pages/StockManagement";
import Reconciliation from "./admin/pages/Reconciliation";
import MealInventory from "./admin/pages/MealInventory";
import Ingredients from "./admin/pages/Ingredients";
import PaymentReconciliation from "./admin/pages/PaymentReconciliation";
import POS from "./admin/pages/POS";
import OrderMeals from "./pages/OrderMeals";
import AuditLog from "./admin/pages/AuditLog";
import Profile from "./admin/pages/Profile";
import StaffHistory from "./admin/pages/StaffHistory";
import StaffActivity from "./admin/pages/StaffActivity";
import RolesPermissions from "./admin/pages/RolesPermissions";
import ChefDashboard from "./admin/pages/ChefDashboard";
import DeliveryDashboard from "./admin/pages/DeliveryDashboard";
import Expenses from "./admin/pages/Expenses";
import AdminPayout from "./admin/pages/AdminPayout"; // 🆕 Payout page
import Login from "./admin/pages/Login";
import ForgotPassword from "./admin/pages/ForgotPassword";
import ResetPassword from "./admin/pages/ResetPassword";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import { AuthProvider } from "./admin/context/AuthContext";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <SettingsProvider>
          <CartProvider>
            <AuthProvider>
              <PromoProvider>
                <Routes>
                  {/* Standalone pages – no nav/footer */}
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/payment-policy" element={<PaymentPolicy />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/track/:orderId" element={<TrackOrder />} />
                  <Route path="/receipt/:id" element={<ReceiptPage />} />
                  <Route path="/complete-payment" element={<CompletePayment />} />
                  <Route path="/order-meal" element={<OrderMeals />} />

                  {/* Public routes with navbar & footer */}
                  <Route
                    path="/*"
                    element={
                      <PublicLayout>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/reviews" element={<Review />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/menu" element={<Menu />} />
                          <Route path="/gallery" element={<Gallery />} />
                          <Route path="*" element={<Home />} />
                        </Routes>
                      </PublicLayout>
                    }
                  />

                  {/* Admin routes */}
                  <Route path="/admin/login" element={<Login />} />
                  <Route path="/admin/forgot-password" element={<ForgotPassword />} />
                  <Route path="/admin/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <Routes>
                            <Route index element={<ProtectedRoute requiredPermission={{ module: 'dashboard', action: 'view' }}><Dashboard /></ProtectedRoute>} />
                            <Route path="orders" element={<ProtectedRoute requiredPermission={{ module: 'orders', action: 'view' }}><Orders /></ProtectedRoute>} />
                            <Route path="order-history" element={<ProtectedRoute requiredPermission={{ module: 'orders', action: 'view' }}><OrderHistory /></ProtectedRoute>} />
                            <Route path="payments" element={<ProtectedRoute requiredPermission={{ module: 'payment_verification', action: 'view' }}><PaymentVerification /></ProtectedRoute>} />
                            <Route path="payout" element={<ProtectedRoute requireSuperAdmin><AdminPayout /></ProtectedRoute>} />   {/* Super Admin only — moves real money */}
                            <Route path="menu" element={<ProtectedRoute requiredPermission={{ module: 'menu', action: 'view' }}><MenuManagement /></ProtectedRoute>} />
                            <Route path="categories" element={<ProtectedRoute requiredPermission={{ module: 'categories', action: 'view' }}><Categories /></ProtectedRoute>} />
                            <Route path="customers" element={<ProtectedRoute requiredPermission={{ module: 'customers', action: 'view' }}><Customers /></ProtectedRoute>} />
                            <Route path="reviews" element={<ProtectedRoute requiredPermission={{ module: 'reviews', action: 'view' }}><Reviews /></ProtectedRoute>} />
                            <Route path="contact-messages" element={<ProtectedRoute requiredPermission={{ module: 'contacts', action: 'view' }}><ContactMessages /></ProtectedRoute>} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="promotions" element={<ProtectedRoute requiredPermission={{ module: 'promotions', action: 'view' }}><Promotions /></ProtectedRoute>} />
                            <Route path="gallery" element={<ProtectedRoute requiredPermission={{ module: 'gallery', action: 'view' }}><GalleryManagement /></ProtectedRoute>} />
                            <Route path="delivery-zones" element={<ProtectedRoute requiredPermission={{ module: 'delivery_zones', action: 'view' }}><DeliveryZones /></ProtectedRoute>} />
                            <Route path="stock" element={<ProtectedRoute requiredPermission={{ module: 'daily_stock', action: 'view' }}><StockManagement /></ProtectedRoute>} />
                            <Route path="reconciliation" element={<ProtectedRoute requiredPermission={{ module: 'reconciliation', action: 'view' }}><Reconciliation /></ProtectedRoute>} />
                            <Route path="meal-inventory" element={<ProtectedRoute requiredPermission={{ module: 'meal_inventory', action: 'view' }}><MealInventory /></ProtectedRoute>} />
                            <Route path="ingredients" element={<ProtectedRoute requiredPermission={{ module: 'ingredients', action: 'view' }}><Ingredients /></ProtectedRoute>} />
                            <Route path="payment-reconciliation" element={<ProtectedRoute requiredPermission={{ module: 'payment_reconciliation', action: 'view' }}><PaymentReconciliation /></ProtectedRoute>} />
                            <Route path="pos" element={<ProtectedRoute requiredPermission={{ module: 'pos', action: 'view' }}><POS /></ProtectedRoute>} />
                            <Route path="staff" element={<ProtectedRoute requiredPermission={{ module: 'staff', action: 'view' }}><StaffManagement /></ProtectedRoute>} />
                            <Route path="audit-log" element={<ProtectedRoute requiredPermission={{ module: 'audit_log', action: 'view' }}><AuditLog /></ProtectedRoute>} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="staff-history" element={<ProtectedRoute requiredPermission={{ module: 'staff_history', action: 'view' }}><StaffHistory /></ProtectedRoute>} />
                            <Route path="staff-activity" element={<ProtectedRoute allowedRoles={['admin']}><StaffActivity /></ProtectedRoute>} />
                            <Route path="roles-permissions" element={<ProtectedRoute requiredPermission={{ module: 'roles', action: 'view' }}><RolesPermissions /></ProtectedRoute>} />
                            <Route path="kitchen" element={<ProtectedRoute requiredPermission={{ module: 'kitchen', action: 'view' }}><ChefDashboard /></ProtectedRoute>} />
                            <Route path="deliveries" element={<ProtectedRoute requiredPermission={{ module: 'delivery', action: 'view' }}><DeliveryDashboard /></ProtectedRoute>} />
                            <Route path="expenses" element={<ProtectedRoute requiredPermission={{ module: 'expenses', action: 'view' }}><Expenses /></ProtectedRoute>} />
                            <Route path="reports" element={<ProtectedRoute requiredPermission={{ module: 'reports', action: 'view' }}><Reports /></ProtectedRoute>} />
                            <Route path="settings" element={<ProtectedRoute requiredPermission={{ module: 'settings', action: 'view' }}><Settings /></ProtectedRoute>} />
                            <Route path="backups" element={<ProtectedRoute requireSuperAdmin><Backups /></ProtectedRoute>} />
                            <Route path="legal" element={<Legal />} />
                          </Routes>
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </PromoProvider>
            </AuthProvider>
          </CartProvider>
        </SettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;