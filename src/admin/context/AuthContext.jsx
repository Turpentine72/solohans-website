import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const session = auth.getSession();
    setSession(session);
    setIsAuthenticated(!!session);
  }, []);

  // ✅ Staff Account Status Management — while a session is active, poll a
  // cheap endpoint periodically. If a Super Admin deactivates this account
  // while the staff member is sitting idle (not clicking anything), this
  // catches it within the poll interval instead of only on their next
  // deliberate action. request() in lib/api.js does the actual forced
  // redirect the instant this call comes back 401/403.
  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = setInterval(() => {
      auth.me().catch(() => {}); // a failure here triggers the global redirect inside request()
    }, 20000);
    return () => clearInterval(poll);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    const data = await auth.login(email, password); // let the caller catch and show err.message directly
    const session = auth.getSession();
    setSession(session);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    auth.logout();
    setSession(null);
    setIsAuthenticated(false);
  };

  const resetPassword = async (email) => {
    try {
      await auth.requestPasswordReset(email);
    } catch (err) {
      console.error('Reset error:', err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, session, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);