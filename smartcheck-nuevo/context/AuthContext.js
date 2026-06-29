import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const saveFaceData = async (userId, faceData) => {
    try {
      const filePath = `${FileSystem.documentDirectory}face_${userId}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(faceData));
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Error saving face data:', error);
      return { success: false, error: error.message };
    }
  };

  const loadFaceData = async (userId) => {
    try {
      const filePath = `${FileSystem.documentDirectory}face_${userId}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        const faceData = await FileSystem.readAsStringAsync(filePath);
        return { success: true, data: JSON.parse(faceData) };
      }
      return { success: false, error: 'Face data not found' };
    } catch (error) {
      console.error('Error loading face data:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, saveFaceData, loadFaceData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);