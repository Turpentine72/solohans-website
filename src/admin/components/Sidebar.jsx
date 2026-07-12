import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  UtensilsCrossed,
  FolderTree,
  Users,
  Truck,
  Star,
  Bell,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Gift,
  Image,
  X,
  UserCog,
  ShieldCheck,
  Package,
  ClipboardCheck,
  History,
  ChefHat,
  UserCircle,
  Receipt,
  Landmark,
  DatabaseBackup,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import defaultLogo from '../../assets/5e82d2b1-ebb5-4e77-8fa1-91fae5baab69.png';

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin', module: 'dashboard' },
  { label: 'Orders', icon: <ShoppingBag size={20} />, path: '/admin/orders', module: 'orders' },
  { label: 'Order History', icon: <History size={20} />, path: '/admin/order-history', module: 'orders' },
  { label: 'POS / New Sale', icon: <CreditCard size={20} />, path: '/admin/pos', module: 'pos' },
  { label: 'Payment Verification', icon: <CreditCard size={20} />, path: '/admin/payments', module: 'payment_verification' },
  { label: 'Menu Management', icon: <UtensilsCrossed size={20} />, path: '/admin/menu', module: 'menu' },
  { label: 'Categories', icon: <FolderTree size={20} />, path: '/admin/categories', module: 'categories' },
  { label: 'Customers', icon: <Users size={20} />, path: '/admin/customers', module: 'customers' },
  { label: 'Contact Messages', icon: <MessageSquare size={20} />, path: '/admin/contact-messages', module: 'contacts' },
  { label: 'Reviews & Testimonials', icon: <Star size={20} />, path: '/admin/reviews', module: 'reviews' },
  { label: 'Notifications', icon: <Bell size={20} />, path: '/admin/notifications' }, // personal/self-scoped — no module gate needed
  { label: 'Promotions', icon: <Gift size={20} />, path: '/admin/promotions', module: 'promotions' },
  { label: 'Gallery', icon: <Image size={20} />, path: '/admin/gallery', module: 'gallery' },
  { label: 'Delivery Zones', icon: <Truck size={20} />, path: '/admin/delivery-zones', module: 'delivery_zones' },
  { label: 'Daily Dish Stock', icon: <Package size={20} />, path: '/admin/stock', module: 'daily_stock' },
  { label: 'Meal Inventory (Rice/Spaghetti/Boxes)', icon: <Package size={20} />, path: '/admin/meal-inventory', module: 'meal_inventory' },
  { label: 'Ingredient Inventory (Shawarma/Hotdog)', icon: <Package size={20} />, path: '/admin/ingredients', module: 'ingredients' },
  { label: 'Day Reconciliation', icon: <ClipboardCheck size={20} />, path: '/admin/reconciliation', module: 'reconciliation' },
  { label: 'Payment Reconciliation', icon: <ClipboardCheck size={20} />, path: '/admin/payment-reconciliation', module: 'payment_reconciliation' },
  { label: 'Payouts', icon: <Landmark size={20} />, path: '/admin/payout', superAdminOnly: true },
  { label: 'Expenses', icon: <Receipt size={20} />, path: '/admin/expenses', module: 'expenses' },
  { label: 'Staff Management', icon: <UserCog size={20} />, path: '/admin/staff', module: 'staff' },
  { label: 'Roles & Permissions', icon: <ShieldCheck size={20} />, path: '/admin/roles-permissions', module: 'roles' },
  { label: 'Staff History', icon: <History size={20} />, path: '/admin/staff-history', module: 'staff_history' },
  { label: 'Kitchen', icon: <ChefHat size={20} />, path: '/admin/kitchen', module: 'kitchen' },
  { label: 'My Deliveries', icon: <Truck size={20} />, path: '/admin/deliveries', module: 'delivery' },
  { label: 'Audit Log', icon: <History size={20} />, path: '/admin/audit-log', module: 'audit_log' },
  { label: 'My Profile', icon: <UserCircle size={20} />, path: '/admin/profile' }, // universal — every logged-in staff member has their own profile
  { label: 'Legal Pages', path: '/admin/legal', icon: <FileText size={18} /> }, // universal
  { label: 'Reports & Analytics', icon: <BarChart3 size={20} />, path: '/admin/reports', module: 'reports' },
  { label: 'Backup & Restore', icon: <DatabaseBackup size={20} />, path: '/admin/backups', superAdminOnly: true },
  { label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings', module: 'settings' },
];

export default function Sidebar({ isOpen, toggle }) {
  const location = useLocation();
  const { settings } = useSettings(); // ✅ dynamic settings
  const { isSuperAdmin, hasPermission } = useAuth();

  // ✅ One clean rule per item — closes a real bug in the previous version,
  // where an item with ONLY a `roles` array (no `module`) was visible to
  // EVERY logged-in staff member regardless of role, because the missing
  // module check defaulted to "true" and got OR'd together with the role
  // check. Payouts, Kitchen, My Deliveries, Daily Dish Stock, and Expenses
  // were all affected. Now: Super Admin sees everything; a `module` entry
  // is gated by that exact permission; `superAdminOnly` is a hard lock
  // matching the same routes' backend enforcement; anything else (personal
  // pages like Profile/Notifications/Legal) is universal by design.
  const visibleNavItems = navItems.filter((item) => {
    if (isSuperAdmin) return true;
    if (item.superAdminOnly) return false;
    if (item.module) return hasPermission(item.module, 'view');
    return true;
  });

  // Use settings logo if available, otherwise fallback to default
  const logo = settings?.logo || defaultLogo;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen lg:h-auto lg:min-h-screen w-72 bg-[#1E1E2D] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-white">
                Solohans
              </h1>
              <p className="text-xs text-gray-400">
                Admin Dashboard
              </p>
            </div>
          </Link>

          <button
            onClick={toggle}
            className="lg:hidden text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item, index) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#C62828] text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="ml-3">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-white/10 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <Truck size={16} />
            Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
}