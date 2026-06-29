import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos permiso para la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={{color: '#001f3f', fontWeight: 'bold'}}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/productos/buscar?ean=${data}`);
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        navigation.replace('ProductDetail', { product: result.data });
      } else {
        Alert.alert("No encontrado", "Producto no existe.", [{ text: "Reintentar", onPress: () => setScanned(false) }]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "code128"] }} />
      {loading && <View style={styles.overlay}><ActivityIndicator size="large" color="#00ffcc" /></View>}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Ionicons name="close" size={30} color="#fff" /></TouchableOpacity>
        <View style={styles.box} />
        <Text style={styles.text}>Centra el código de barras</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001f3f' },
  text: { color: '#fff', fontSize: 18, marginTop: 20, fontWeight: 'bold' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  box: { width: 280, height: 120, borderWidth: 3, borderColor: '#00ffcc', borderRadius: 10 },
  btn: { padding: 15, backgroundColor: '#00ffcc', borderRadius: 10, marginTop: 20 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 }
});