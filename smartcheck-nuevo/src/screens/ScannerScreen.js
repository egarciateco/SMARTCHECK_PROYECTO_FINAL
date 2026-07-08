import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';
const AUDIO_BEEP = require('../../assets/beepscanner.mp3'); // Actualizado a .mp3

export default function ScannerScreen({ navigation }) {
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasPermission?.granted) {
      requestPermission();
    }
  }, [hasPermission]);

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(AUDIO_BEEP);
      await sound.playAsync();
      // Opcional: Descargar el archivo de memoria tras sonar (en 1 segundo)
      setTimeout(() => {
        sound.unloadAsync().catch(() => {});
      }, 1000);
    } catch (error) {
      console.log("Error reproduciendo el beep:", error);
    }
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    // Ejecuta el sonido de confirmación de escaneo exitoso (.mp3)
    await playBeep();

    try {
      const response = await fetch(`${API_URL}/api/users/productos/buscar?q=${encodeURIComponent(data)}`);
      const result = await response.json();

      if (result.status === 'success' && result.data && result.data.length > 0) {
        // Si encuentra el producto, vuelve mandándolo como parámetro para que impacte el mapa/lista
        navigation.navigate('Busqueda', { 
          latitud: result.data[0].latitud, 
          longitud: result.data[0].longitud,
          productoEncontrado: result.data[0] 
        });
      } else {
        Alert.alert(
          "Código detectado",
          `Código: ${data}\nNo se encontró este producto en la base de datos de SmartCheck.`,
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor para verificar el código.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00ffcc" /></View>;
  }

  if (!hasPermission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.textError}>Se requiere acceso a la cámara para usar el escáner.</Text>
        <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
          <Text style={styles.btnTexto}>Conceder Permiso</Text>
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
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'qr', 'code128'],
          }}
        />
        {/* Guía visual cuadrada para el código */}
        <View style={styles.overlayFrame}>
          <View style={styles.scannerTarget} />
        </View>
      </View>

      <View style={styles.feedbackContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#00ffcc" />
        ) : (
          <Text style={styles.instructions}>Apuntá con la cámara al código de barras del producto</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'space-between', alignItems: 'center' },
  center: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', marginTop: 40 },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  appName: { width: 120, height: 40, resizeMode: 'contain' },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 12, width: '100%', marginVertical: 10 },
  titleText: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },
  cameraWrapper: { width: '85%', height: '45%', borderRadius: 15, overflow: 'hidden', borderWidth: 3, borderColor: '#00ffcc', position: 'relative' },
  overlayFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  scannerTarget: { width: '75%', height: '50%', borderWidth: 2, borderColor: '#ffcc00', borderRadius: 8, borderStyle: 'dashed' },
  feedbackContainer: { height: 60, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  instructions: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  textError: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  btnPermiso: { backgroundColor: '#00ffcc', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  btnTexto: { color: '#001f3f', fontWeight: 'bold' },
  footer: { width: '100%', alignItems: 'center', paddingBottom: 30 },
  navIcon: { width: 45, height: 45, resizeMode: 'contain' }
});