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

  const login = async (email, password) => {
    try {
      const data = await auth.login(email, password);
      const session = auth.getSession();
      setSession(session);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Login error:', err.message);
      return false;
    }
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
