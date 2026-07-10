import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * allowedRoles: legacy coarse check, e.g. ['admin', 'storekeeper'] — still
 *   supported so existing routes keep working unchanged.
 * requiredPermission: { module, action } — the new granular RBAC check.
 *   Super Admin always passes regardless of which prop is used.
 * If BOTH are given, either one passing is enough (keeps old role-based
 * pages working for staff who haven't been migrated to a custom role yet,
 * while still honoring the new grant if given).
 */
export default function ProtectedRoute({ children, allowedRoles, requiredPermission, requireSuperAdmin }) {
  const { isAuthenticated, session, isSuperAdmin, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isSuperAdmin) return children; // unrestricted, always, per spec

  // 🔒 A small number of routes (Backup & Restore, Payouts) move real money
  // or can destroy/replace the entire database. Those are Super-Admin-only
  // full stop — never delegatable through the normal permission system,
  // matching the same hardcoded isSuperAdmin gate on their backend routes.
  if (requireSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldAlert size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Super Admin Only</h2>
        <p className="text-gray-500 max-w-sm">This page can only be accessed by a Super Admin.</p>
      </div>
    );
  }

  // ✅ Only OR the checks that were actually specified. Previously, giving
  // only ONE of allowedRoles/requiredPermission still passed automatically
  // regardless of that one check's result, because the unspecified check
  // defaulted to "true" and got OR'd in — silently opening the route to
  // every logged-in user. Now: if only one is specified, only that one is
  // evaluated; if both are specified, either passing is sufficient
  // (useful while migrating a page from role-based to permission-based);
  // if neither is specified, the route is intentionally open to any
  // logged-in staff member.
  let allowed;
  if (allowedRoles && requiredPermission) {
    allowed = allowedRoles.includes(session?.role) || hasPermission(requiredPermission.module, requiredPermission.action);
  } else if (allowedRoles) {
    allowed = allowedRoles.includes(session?.role);
  } else if (requiredPermission) {
    allowed = hasPermission(requiredPermission.module, requiredPermission.action);
  } else {
    allowed = true;
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldAlert size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 max-w-sm">
          You don't have permission to view this page. Contact your Super Admin if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return children;
}