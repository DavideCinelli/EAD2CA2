import React, { createContext, useContext, useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { UserLoginDTO, UserRegisterDTO, UserResponseDTO } from '../types/api';

type AuthContextType = {
  user: UserResponseDTO | null;
  isLoading: boolean;
  login: (credentials: UserLoginDTO) => Promise<void>;
  register: (userData: UserRegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuthState = async () => {
      setIsLoading(true);
      try {
        const userData = await usersApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to get user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const login = async (credentials: UserLoginDTO) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      const userData = await usersApi.login(credentials);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const register = async (userData: UserRegisterDTO) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      console.log('AuthContext: Registering user...');
      
      // First try to register the user
      const newUser = await usersApi.register(userData);
      console.log('AuthContext: Registration successful, user registered:', newUser);
      
      // Set the user immediately if registration is successful
      setUser(newUser);
      
    } catch (registerError: any) {
      // If the error message indicates the username is already taken
      if (registerError.message && registerError.message.includes('already taken')) {
        console.log('AuthContext: Username appears to already exist, cannot proceed with registration');
        // Just pass the error up instead of trying to login automatically
        throw registerError;
      } else {
        // For other registration errors, throw the error
        throw registerError;
      }
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await usersApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 