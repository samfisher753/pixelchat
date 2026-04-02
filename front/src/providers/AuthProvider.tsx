import { createContext, useContext, useState, ReactNode } from 'react';
import type { AuthUser } from '@/types/AuthUser';
import type { LoginData } from '@/types/LoginData';
import apiService from '@/services/apiService';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (data: LoginData) => void;
  logout: () => void;
  refresh: () => Promise<boolean>;
  updateUser: (user: AuthUser) => void;
}

// ---------------------------------------------------------------------------
// Helpers de persistencia
// ---------------------------------------------------------------------------

const KEYS = {
  accessToken:  'access_token',
  refreshToken: 'refresh_token',
  user:         'auth_user',
} as const;

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(KEYS.accessToken)
  );
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = (data: LoginData) => {
    localStorage.setItem(KEYS.accessToken,  data.accessToken);
    localStorage.setItem(KEYS.refreshToken, data.refreshToken);
    localStorage.setItem(KEYS.user, JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    apiService.post('/auth/logout').catch(() => {});
    localStorage.removeItem(KEYS.accessToken);
    localStorage.removeItem(KEYS.refreshToken);
    localStorage.removeItem(KEYS.user);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: AuthUser) => {
    localStorage.setItem(KEYS.user, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refresh = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(KEYS.refreshToken);
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;

      const data: RefreshTokenResponse = await response.json();
      localStorage.setItem(KEYS.accessToken, data.accessToken);
      localStorage.setItem(KEYS.refreshToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refresh, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
