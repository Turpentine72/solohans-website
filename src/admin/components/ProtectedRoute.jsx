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
export default function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { isAuthenticated, session, isSuperAdmin, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isSuperAdmin) return children; // unrestricted, always, per spec

  const roleOk = !allowedRoles || allowedRoles.includes(session?.role);
  const permissionOk = !requiredPermission || hasPermission(requiredPermission.module, requiredPermission.action);

  // If neither restriction was specified at all, the route is open to any
  // logged-in staff member (matches previous behavior for pages that never
  // had an allowedRoles prop).
  const restricted = allowedRoles || requiredPermission;
  const allowed = !restricted || roleOk || permissionOk;

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