import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api'; 
import { playBeep, loadBeepSound, unloadSounds } from '../utils/share';

export default function ScannerScreen({ navigation }) {
  const { logout } = useAuth();
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    loadBeepSound().catch(() => {});
    return () => { unloadSounds().catch(() => {}); };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setLoading(false);
    }, [])
  );

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(logout, 1000);
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);
    
    await playBeep().catch(() => {});

    try {
      const response = await api.get('/api/users/productos/buscar', { params: { q: data } });

      if (response.data?.status === 'success' && response.data.data?.length > 0) {
        navigation.navigate('Busqueda', { 
          latitud: response.data.data[0].latitud, 
          longitud: response.data.data[0].longitud,
          productoEncontrado: response.data.data[0] 
        });
      } else {
        Alert.alert("Atención", "Producto no encontrado.", [
          { text: "OK", onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Fallo de conexión.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.textError}>Se requiere acceso a la cámara.</Text>
        <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
          <Text style={{color: '#fff'}}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>
      
      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>ESCÁNER DE CÓDIGOS SMARTCHECK</Text>
      </View>

      <View style={styles.cameraWrapper}>
        {isFocused && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128'] }}
          />
        )}
        <View style={styles.overlayFrame}><View style={styles.scannerTarget} /></View>
      </View>

      <View style={styles.feedbackContainer}>
        {loading ? <ActivityIndicator size="large" color="#00ffcc" /> : <Text style={styles.instructions}>Apuntá al código de barras</Text>}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogoutFlow}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'space-between', alignItems: 'center' },
  center: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', marginTop: 40 },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  appName: { width: 120, height: 40, resizeMode: 'contain' },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 12, width: '100%', marginVertical: 10 },
  titleText: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  cameraWrapper: { width: '85%', height: '45%', borderRadius: 15, overflow: 'hidden', borderWidth: 3, borderColor: '#00ffcc' },
  overlayFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
  scannerTarget: { width: '75%', height: '50%', borderWidth: 2, borderColor: '#ffcc00', borderRadius: 8, borderStyle: 'dashed' },
  feedbackContainer: { height: 60, justifyContent: 'center' },
  instructions: { color: '#aaa', fontSize: 14 },
  navIcon: { width: 45, height: 45, resizeMode: 'contain' },
  footer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 30 },
  btnPermiso: { backgroundColor: '#00ffcc', padding: 15, borderRadius: 10, marginTop: 10 },
  textError: { color: '#fff', marginBottom: 10 }
});