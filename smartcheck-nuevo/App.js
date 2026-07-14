import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, LogBox, ActivityIndicator, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { loadBeepSound, unloadSounds } from './src/utils/share'; 
import api from './src/config/api'; 

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

LogBox.ignoreAllLogs(); 
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, isLoading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const init = async () => {
      try {
        await loadBeepSound(); 
        
        // Hacemos un "ping" inicial para despertar el servidor y esperamos respuesta
        try {
          await api.get('/'); 
          console.log("✅ Servidor despertado con éxito");
        } catch (err) {
          console.log("⚠️ El servidor tardó en despertar, pero la app está lista.");
        }
      } catch (e) {
        console.error("Error al cargar sonidos:", e);
      } finally {
        await ExpoSplashScreen.hideAsync().catch(() => {});
        setIsReady(true);
      }
    };
    init();
    return () => { unloadSounds().catch(() => {}); };
  }, []);

  if (!isReady || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ffcc" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      <Stack.Navigator 
        initialRouteName={user ? "HomeScreen" : "Welcome"}
        screenOptions={{ 
          headerShown: true, 
          headerStyle: { backgroundColor: '#003366' }, 
          headerTintColor: '#fff' 
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear Cuenta' }} />
            <Stack.Screen name="Camera" component={FacialLoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FaceLogin" component={FacialLoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Busqueda" component={ProductSearchScreen} options={{ title: 'Buscar Productos' }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Escanear' }} />
            <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Resultados' }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalle' }} />
            <Stack.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Mi Perfil', headerShown: true }} />
            <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Administración' }} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} options={{ headerShown: false }} />
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001f3f' }
});