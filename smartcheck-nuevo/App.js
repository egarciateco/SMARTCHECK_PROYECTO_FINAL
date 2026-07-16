import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, LogBox, ActivityIndicator, View, Text, Image } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { loadBeepSound, unloadSounds } from './src/utils/share';
import api from './src/config/api';
import { initializeTensorFlow } from './src/services/tensorflowService';

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
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'; // <-- IMPORTANTE

LogBox.ignoreAllLogs();
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function AppNavigator() {
  const { user, isLoading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const init = async () => {
      try {
        setProgress(20);
        await delay(800);
        await loadBeepSound();
        setProgress(50);
        await delay(500);
        await initializeTensorFlow();
        setProgress(80);
        await delay(500);
        api.get('/').catch(() => {});
        setProgress(100);
        await delay(500);
      } catch (e) {
        console.error("Error al cargar:", e);
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
      <View style={styles.splashContainer}>
        <Image source={require('./assets/splash.png')} style={styles.splashImage} resizeMode="cover" />
        <View style={styles.progressWrapper}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      <Stack.Navigator initialRouteName={user ? "HomeScreen" : "Welcome"} screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Camera" component={FacialLoginScreen} />
            <Stack.Screen name="FaceLogin" component={FacialLoginScreen} />
            <Stack.Screen name="Goodbye" component={GoodbyeScreen} />
          </>
        ) : (
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
  splashContainer: { flex: 1, backgroundColor: '#001f3f' },
  splashImage: { width: '100%', height: '100%' },
  progressWrapper: { position: 'absolute', bottom: 60, width: '100%', paddingHorizontal: 40 },
  progressContainer: { width: '100%', height: 25, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00ffcc' },
  progressBar: { height: '100%', backgroundColor: '#00ffcc', position: 'absolute', left: 0, top: 0 },
  progressText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, zIndex: 1, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }
});