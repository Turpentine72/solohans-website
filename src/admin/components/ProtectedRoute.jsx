import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session?.role)) {
    return (
      <div className="p-10 text-center text-gray-500">
        <h2 className="text-xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p>Your role ({session?.role || 'unknown'}) doesn't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}