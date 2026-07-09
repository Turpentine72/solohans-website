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
                            <Route path="payments" element={<ProtectedRoute requiredPermission={{ module: 'payment_verification', action: 'view' }}><PaymentVerification /></ProtectedRoute>} />
                            <Route path="payout" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayout /></ProtectedRoute>} />   {/* 🆕 Payout route — admin only, moves real money */}
                            <Route path="menu" element={<ProtectedRoute requiredPermission={{ module: 'menu', action: 'view' }}><MenuManagement /></ProtectedRoute>} />
                            <Route path="categories" element={<Categories />} />
                            <Route path="customers" element={<Customers />} />
                            <Route path="reviews" element={<Reviews />} />
                            <Route path="contact-messages" element={<ContactMessages />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="promotions" element={<Promotions />} />
                            <Route path="gallery" element={<GalleryManagement />} />
                            <Route path="delivery-zones" element={<DeliveryZones />} />
                            <Route path="stock" element={<ProtectedRoute allowedRoles={['admin', 'storekeeper']}><StockManagement /></ProtectedRoute>} />
                            <Route path="reconciliation" element={<ProtectedRoute allowedRoles={['admin', 'closing_staff']} requiredPermission={{ module: 'reconciliation', action: 'view' }}><Reconciliation /></ProtectedRoute>} />
                            <Route path="meal-inventory" element={<ProtectedRoute allowedRoles={['admin', 'storekeeper', 'cashier']} requiredPermission={{ module: 'meal_inventory', action: 'view' }}><MealInventory /></ProtectedRoute>} />
                            <Route path="ingredients" element={<ProtectedRoute allowedRoles={['admin', 'storekeeper', 'cashier']} requiredPermission={{ module: 'ingredients', action: 'view' }}><Ingredients /></ProtectedRoute>} />
                            <Route path="payment-reconciliation" element={<ProtectedRoute allowedRoles={['admin', 'storekeeper', 'cashier', 'closing_staff']} requiredPermission={{ module: 'reconciliation', action: 'view' }}><PaymentReconciliation /></ProtectedRoute>} />
                            <Route path="pos" element={<ProtectedRoute allowedRoles={['admin', 'storekeeper', 'cashier']} requiredPermission={{ module: 'pos', action: 'view' }}><POS /></ProtectedRoute>} />
                            <Route path="staff" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission={{ module: 'staff', action: 'view' }}><StaffManagement /></ProtectedRoute>} />
                            <Route path="audit-log" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission={{ module: 'audit_log', action: 'view' }}><AuditLog /></ProtectedRoute>} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="staff-history" element={<ProtectedRoute allowedRoles={['admin']} requiredPermission={{ module: 'reports', action: 'view' }}><StaffHistory /></ProtectedRoute>} />
                            <Route path="roles-permissions" element={<ProtectedRoute allowedRoles={['admin']}><RolesPermissions /></ProtectedRoute>} />
                            <Route path="kitchen" element={<ProtectedRoute allowedRoles={['admin', 'chef']}><ChefDashboard /></ProtectedRoute>} />
                            <Route path="deliveries" element={<ProtectedRoute allowedRoles={['admin', 'delivery_staff']}><DeliveryDashboard /></ProtectedRoute>} />
                            <Route path="expenses" element={<ProtectedRoute allowedRoles={['admin', 'closing_staff']}><Expenses /></ProtectedRoute>} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="backups" element={<ProtectedRoute allowedRoles={['admin']}><Backups /></ProtectedRoute>} />
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