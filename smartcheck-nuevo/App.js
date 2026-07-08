// App.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView, StatusBar, StyleSheet, LogBox, Alert, View, Text, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Importamos el Contexto Global
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Importación de Pantallas
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

import { playSound, loadSounds, unloadSounds } from './src/utils/share';

// Desactiva alertas molestas en desarrollo
LogBox.ignoreLogs([
  'ExpoFaceDetector has been deprecated',
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Setting a timer',
  /Require cycle:/,
]);

ExpoSplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef();
  const soundLoaded = useRef(false);

  // Control del Audio Global (beepscanner)
  useEffect(() => {
    const loadAudio = async () => {
      try {
        await loadSounds();
        soundLoaded.current = true;
      } catch (e) { 
        console.warn('⚠️ Audio no cargado:', e.message); 
      }
    };
    loadAudio();
    return () => unloadSounds();
  }, []);

  // Inicialización de la sesión y Splash Screen
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (authLoading) return;
        await ExpoSplashScreen.hideAsync();
        setIsReady(true);
      } catch (error) {
        console.error('❌ Error inicializando:', error);
      }
    };
    initializeApp();
  }, [authLoading]);

  const handleLogoutWithSound = useCallback(async () => {
    if (soundLoaded.current) await playSound('logout');
    await logout();
    navigationRef.current?.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  }, [logout]);

  // Pantalla de carga mientras verifica si el usuario está logueado
  if (!isReady || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#003366" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ffcc" />
          <Text style={styles.loadingText}>Iniciando SmartCheck...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      <Stack.Navigator 
        initialRouteName={user ? 'Home' : 'Welcome'} 
        screenOptions={{ 
          headerShown: true, 
          headerStyle: { backgroundColor: '#003366' }, 
          headerTintColor: '#fff' 
        }}
      >
        {/* Flujo de navegación condicional inteligente */}
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear Cuenta' }} />
            <Stack.Screen name="Camera" component={FacialLoginScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ 
                title: 'SmartCheck', 
                headerRight: () => (
                  <TouchableOpacity onPress={handleLogoutWithSound} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salir</Text>
                  </TouchableOpacity>
                ) 
              }} 
            />
            <Stack.Screen name="Busqueda" component={ProductSearchScreen} options={{ title: 'Buscar Productos' }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Escanear' }} />
            <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Resultados' }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalle' }} />
            <Stack.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
            <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Administración' }} />
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
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001f3f' },
  loadingText: { color: '#00ffcc', marginTop: 15, fontSize: 14, fontWeight: '500' }
});