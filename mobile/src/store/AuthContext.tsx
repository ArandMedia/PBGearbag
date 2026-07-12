import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService, User, LoginData, RegisterData } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  verificationToken: string | null;
  verifyEmail:(token:string)=>Promise<void>;
  resendVerification:()=>Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationToken,setVerificationToken]=useState<string|null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Paint an optimistic UI from the token's own claims immediately —
    // don't make every app load wait on a network round trip (which can
    // take 20+ seconds if the backend free-tier instance is cold). The
    // full profile fills in from /auth/me in the background below.
    const optimistic = await authService.decodeStoredToken();
    if (optimistic) {
      setUser({
        ...optimistic,
        isVerified: true,
        isActive: true,
        ageConfirmed: true,
        createdAt: '',
        updatedAt: '',
      } as any);
      setLoading(false);
    } else {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Token is genuinely invalid/revoked, not just a slow/offline backend.
        await authService.logout();
        setUser(null);
      } else {
        console.error('Background auth refresh failed:', error);
      }
    }
  };

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(data);
      setUser(response.user);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Login failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(data);
      setUser(response.user);
      setVerificationToken(response.verificationToken||null);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Registration failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };
  const verifyEmail=async(token:string)=>{await authService.verifyEmail(token);await refreshUser();setVerificationToken(null)};
  const resendVerification=async()=>{if(!user)return;const result=await authService.resendVerification(user.email);if(result.verificationToken)setVerificationToken(result.verificationToken)};

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    isAuthenticated: !!user,
    verificationToken,
    verifyEmail,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
