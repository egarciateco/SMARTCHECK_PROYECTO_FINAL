import './shim'; 
import 'react-native-get-random-values'; 
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { unloadSounds } from './src/utils/share';

// Imports de pantallas
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FacialLoginScreen from './src/screens/FacialLoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductSearchScreen from './src/screens/ProductSearchScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import GoodbyeScreen from './src/screens/GoodbyeScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Prevenimos que el splash nativo desaparezca solo
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading]);

  useEffect(() => {
    return () => {
      unloadSounds().catch(() => {});
    };
  }, []);

  if (authLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('./assets/splash.png')} style={styles.splashImage} resizeMode="contain" />
      </View>
    );
  }

  // Navegación principal unificada para evitar errores de pantallas no encontradas
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="Busqueda" component={ProductSearchScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Perfil" component={ProfileScreen} />
            <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            {/* Soportamos ambos nombres para evitar fallos de navegación */}
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="FacialLogin" component={FacialLoginScreen} />
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="Busqueda" component={ProductSearchScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Perfil" component={ProfileScreen} />
            <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center' },
  splashImage: { width: '80%', height: '80%' }
});