import './shim'; 
import 'react-native-get-random-values'; 
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { unloadSounds } from './src/utils/share';

// Imports de pantallas existentes
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
import SupermercadosCercaScreen from './src/screens/SupermercadosCercaScreen';
import HistorialScreen from './src/screens/HistorialScreen';

// 🔍 IMPORT DE LA PANTALLA DE DETALLE DE HISTORIAL
import DetalleHistorialScreen from './src/screens/DetalleHistorialScreen';

// 🚀 IMPORT DE LA NUEVA PANTALLA DE NUEVO CHANGO
import NuevoChangoScreen from './src/screens/NuevoChangoScreen';

// 🚀 IMPORTS DEL FLUJO DE CHANGO INTELIGENTE Y HISTORIAL
import SelectorInteligenteScreen from './src/screens/SelectorInteligenteScreen';
import ChangoComparativoScreen from './src/screens/ChangoComparativoScreen';
import MisChangosScreen from './src/screens/MisChangosScreen';
import CategorySelectionScreen from './src/screens/CategorySelectionScreen';
import BrandSelectionScreen from './src/screens/BrandSelectionScreen';
import ProductSelectionScreen from './src/screens/ProductSelectionScreen';
import CartScreen from './src/screens/CartScreen';

// 🏆 IMPORT DE LA NUEVA PANTALLA DE COMPARATIVA DE LOS 8 SUPERMERCADOS
import ComparativaScreen from './src/screens/ComparativaScreen';

// Prevenimos que el splash nativo desaparezca solo
try {
  ExpoSplashScreen.preventAutoHideAsync();
} catch (e) {}

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, isLoading: authLoading } = useAuth();
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const isLoadingFinal = authLoading && !isTimedOut;

  useEffect(() => {
    if (!isLoadingFinal) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoadingFinal]);

  useEffect(() => {
    return () => {
      unloadSounds().catch(() => {});
    };
  }, []);

  if (isLoadingFinal) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('./assets/splash.png')} style={styles.splashImage} resizeMode="contain" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // ==========================================
          // RUTAS PRIVADAS (Usuario Autenticado)
          // ==========================================
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="DetalleHistorialScreen" component={DetalleHistorialScreen} options={{ headerShown: false }} />
            
            {/* 🚀 NUEVA PANTALLA DE NUEVO CHANGO */}
            <Stack.Screen name="NuevoChangoScreen" component={NuevoChangoScreen} />

            {/* ALIAS SEGUROS PARA BÚSQUEDA MANUAL */}
            <Stack.Screen name="Busqueda" component={ProductSearchScreen} />
            <Stack.Screen name="ProductSearch" component={ProductSearchScreen} />
            <Stack.Screen name="ProductSearchScreen" component={ProductSearchScreen} />

            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="SupermercadosCerca" component={SupermercadosCercaScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            
            {/* 🛒 RUTAS DEL CHANGO INTELIGENTE Y GUARDADO */}
            <Stack.Screen name="CategorySelection" component={CategorySelectionScreen} />
            <Stack.Screen name="BrandSelection" component={BrandSelectionScreen} />
            <Stack.Screen name="BrandSelectionScreen" component={BrandSelectionScreen} />
            <Stack.Screen name="ProductSelection" component={ProductSelectionScreen} />
            <Stack.Screen name="ProductSelectionScreen" component={ProductSelectionScreen} />
            <Stack.Screen name="SelectorInteligente" component={SelectorInteligenteScreen} />
            <Stack.Screen name="ChangoComparativo" component={ChangoComparativoScreen} />
            <Stack.Screen name="ChangoComparativoScreen" component={ChangoComparativoScreen} />
            <Stack.Screen name="MisChangos" component={MisChangosScreen} />
            <Stack.Screen name="MisChangosScreen" component={MisChangosScreen} />
            <Stack.Screen name="CartScreen" component={CartScreen} />

            {/* 🕒 PANTALLA DE HISTORIAL */}
            <Stack.Screen name="HistorialScreen" component={HistorialScreen} />

            {/* 🏆 PANTALLA DE COMPARATIVA DE LOS 8 SUPERMERCADOS */}
            <Stack.Screen name="ComparativaScreen" component={ComparativaScreen} />

            <Stack.Screen name="Perfil" component={ProfileScreen} />
            <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} />
          </>
        ) : (
          // ==========================================
          // RUTAS PÚBLICAS (Sin Sesión / Invitado)
          // ==========================================
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="FacialLogin" component={FacialLoginScreen} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function App() {
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

export default App;

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center' },
  splashImage: { width: '80%', height: '80%' }
});