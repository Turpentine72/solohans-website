import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState(null);
  // ✅ RBAC — permissions and isSuperAdmin are NEVER stored in the JWT
  // itself (deliberately, so a change made by a Super Admin takes effect
  // immediately rather than only after the staff member's token expires).
  // They live here instead, refreshed on load and on every session poll.
  const [permissions, setPermissions] = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const applyMe = (me) => {
    setIsSuperAdmin(!!me.isSuperAdmin);
    setPermissions(me.permissions || {});
  };

  useEffect(() => {
    const existingSession = auth.getSession();
    setSession(existingSession);
    setIsAuthenticated(!!existingSession);
    // Page was refreshed / freshly loaded — the JWT alone doesn't carry
    // permissions, so fetch them once right away rather than waiting for
    // the first poll tick.
    if (existingSession) {
      auth.me().then(applyMe).catch(() => {});
    }
  }, []);

  // ✅ Staff Account Status Management — while a session is active, poll a
  // cheap endpoint periodically. If a Super Admin deactivates this account
  // while the staff member is sitting idle (not clicking anything), this
  // catches it within the poll interval instead of only on their next
  // deliberate action. request() in lib/api.js does the actual forced
  // redirect the instant this call comes back 401/403. It also doubles as
  // the mechanism that keeps `permissions` fresh if a Super Admin changes
  // a role's permissions while this staff member is actively using the app.
  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = setInterval(() => {
      auth.me().then(applyMe).catch(() => {}); // a failure here triggers the global redirect inside request()
    }, 20000);
    return () => clearInterval(poll);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    const data = await auth.login(email, password); // let the caller catch and show err.message directly
    const newSession = auth.getSession();
    setSession(newSession);
    setIsAuthenticated(true);
    if (data.user) applyMe(data.user); // avoid waiting on a separate /me round trip right after login
    return true;
  };

  const logout = () => {
    auth.logout();
    setSession(null);
    setIsAuthenticated(false);
    setPermissions({});
    setIsSuperAdmin(false);
  };

  const resetPassword = async (email) => {
    try {
      await auth.requestPasswordReset(email);
    } catch (err) {
      console.error('Reset error:', err.message);
    }
  };

  // ✅ Lets a page force an immediate isSuperAdmin/permissions refresh
  // instead of waiting for the 20s poll — used by Roles & Permissions so
  // a just-granted Super Admin status (e.g. from the one-time bootstrap
  // in GET /roles) is reflected right away rather than up to 20s later.
  const refreshMe = async () => {
    try { await auth.me().then(applyMe); } catch { /* ignore — poll will retry */ }
  };

  // ✅ The single source of truth every permission check in the app should
  // go through. Super Admin always passes, regardless of module/action.
  const hasPermission = useCallback(
    (moduleName, action) => isSuperAdmin || !!permissions?.[moduleName]?.[action],
    [isSuperAdmin, permissions]
  );

  return (
    <AuthContext.Provider value={{ isAuthenticated, session, isSuperAdmin, permissions, hasPermission, login, logout, resetPassword, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);