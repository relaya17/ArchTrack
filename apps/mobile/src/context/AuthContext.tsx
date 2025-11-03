/**
 * Authentication Context
 * Construction Master App - Mobile Authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  company?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would call your API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        setUser(data.user);
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה בהתחברות');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('שגיאה', 'שגיאה בהתחברות');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'החשבון נוצר בהצלחה. אנא בדוק את האימייל שלך לאימות.');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה בהרשמה');
        return false;
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('שגיאה', 'שגיאה בהרשמה');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
        Alert.alert('הצלחה', 'הפרופיל עודכן בהצלחה');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה בעדכון הפרופיל');
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('שגיאה', 'שגיאה בעדכון הפרופיל');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'הסיסמה שונתה בהצלחה');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה בשינוי הסיסמה');
        return false;
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('שגיאה', 'שגיאה בשינוי הסיסמה');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'נשלח אימייל לאיפוס הסיסמה');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה בשליחת אימייל איפוס');
        return false;
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('שגיאה', 'שגיאה בשליחת אימייל איפוס');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'האימייל אומת בהצלחה');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה באימות האימייל');
        return false;
      }
    } catch (error) {
      console.error('Verify email error:', error);
      Alert.alert('שגיאה', 'שגיאה באימות האימייל');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('הצלחה', 'נשלח אימייל אימות חדש');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('שגיאה', error.message || 'שגיאה בשליחת אימייל אימות');
        return false;
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert('שגיאה', 'שגיאה בשליחת אימייל אימות');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    verifyEmail,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
