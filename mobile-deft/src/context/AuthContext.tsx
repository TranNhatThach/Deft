import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginDto, RegisterDto, API_PATHS } from '../../../shared/types';
import { apiClient, USE_MOCK } from '../api/apiClient';
import { MockServer } from '../api/mockServer';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('access_token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (dto: LoginDto) => {
    setIsLoading(true);
    try {
      if (USE_MOCK) {
        const res = await MockServer.login(dto.email);
        await AsyncStorage.setItem('access_token', res.access_token);
        await AsyncStorage.setItem('refresh_token', res.refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
      } else {
        const res = await apiClient.post(API_PATHS.AUTH.LOGIN, dto);
        const { access_token, refresh_token, user: userData } = res.data;
        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('refresh_token', refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (dto: RegisterDto) => {
    setIsLoading(true);
    try {
      if (USE_MOCK) {
        const res = await MockServer.login(dto.email);
        res.user.display_name = dto.display_name;
        await AsyncStorage.setItem('access_token', res.access_token);
        await AsyncStorage.setItem('refresh_token', res.refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
      } else {
        const res = await apiClient.post(API_PATHS.AUTH.REGISTER, dto);
        const { access_token, refresh_token, user: userData } = res.data;
        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('refresh_token', refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken && !USE_MOCK) {
        await apiClient.post(API_PATHS.AUTH.LOGOUT, { refresh_token: refreshToken }).catch(() => {});
      }
    } finally {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      AsyncStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
