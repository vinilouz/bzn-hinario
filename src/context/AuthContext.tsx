import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  isFirebaseConfigured,
  isUserAdmin,
  loginWithGoogle,
  logoutUser,
  subscribeToAuthState,
  getAdminEmails
} from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isFirebaseConfigured: boolean;
  adminEmails: string[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setDemoAdmin: (enabled: boolean) => void;
  isDemoAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN_STORAGE_KEY = 'hinario_demo_admin';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoAdmin, setIsDemoAdmin] = useState<boolean>(() => {
    return localStorage.getItem(DEMO_ADMIN_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await logoutUser();
    }
    setDemoAdmin(false);
    setCurrentUser(null);
  };

  const setDemoAdmin = (enabled: boolean) => {
    setIsDemoAdmin(enabled);
    if (enabled) {
      localStorage.setItem(DEMO_ADMIN_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_ADMIN_STORAGE_KEY);
    }
  };

  const effectiveIsAdmin = isDemoAdmin || (currentUser ? isUserAdmin(currentUser.email) : false);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: effectiveIsAdmin,
        isLoading,
        isFirebaseConfigured,
        adminEmails: getAdminEmails(),
        login,
        logout,
        setDemoAdmin,
        isDemoAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
