import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, BackHandler, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

export default function AdminPanelScreen({ navigation }) {
  const [autenticado, setAutenticado] = useState(false);
  const [pinIngresado, setPinIngresado] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataAdmin, setDataAdmin] = useState({ totalUsuarios: 0, totalVisitas: 0, usuarios: [] });

  const cargarTelemetriaMovil = async () => {
    setLoading(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/users/admin/usuarios`);
      const datos = await respuesta.json();
      if (datos.status !== 'error') setDataAdmin(datos);
      else Alert.alert("Error", "No se pudieron obtener datos");
    } catch (e) { Alert.alert("Error", "Sin conexión"); }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { if (autenticado) cargarTelemetriaMovil(); }, [autenticado]));

  const presionarTecla = (v) => {
    if (pinIngresado.length >= 5) return;
    const nuevoPin = pinIngresado + v;
    setPinIngresado(nuevoPin);
    if (nuevoPin === '00192') { setAutenticado(true); setPinIngresado(''); }
    else if (nuevoPin.length === 5) { Alert.alert("Denegado", "PIN incorrecto"); setPinIngresado(''); }
  };

  if (!autenticado) {
    return (
      <View style={styles.atmContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <View style={styles.atmCard}>
          <Text style={styles.atmTitle}>CLAVE ADMINISTRADOR</Text>
          <Text style={styles.atmDisplay}>{ '• '.repeat(pinIngresado.length) + '_ '.repeat(5 - pinIngresado.length) }</Text>
          <View style={styles.keyboardGrid}>
            {[1,2,3,4,5,6,7,8,9].map(n => <TouchableOpacity key={n} style={styles.keyButton} onPress={() => presionarTecla(n.toString())}><Text style={styles.keyText}>{n}</Text></TouchableOpacity>)}
            <TouchableOpacity style={styles.keyButton} onPress={() => presionarTecla('0')}><Text style={styles.keyText}>0</Text></TouchableOpacity>
            <TouchableOpacity style={styles.clearKey} onPress={() => setPinIngresado(pinIngresado.slice(0, -1))}><Text style={styles.keyTextBtn}>⌫</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.panelTitle}>PANEL ADMINISTRADOR</Text>
      {loading ? <ActivityIndicator size="large" color="#00ffcc" /> : (
        <ScrollView style={styles.scrollTable}>
          {dataAdmin.usuarios.map((item, index) => (
            <View key={index} style={styles.userRow}>
              <View style={styles.userDataArea}>
                <Text style={styles.userName}>{item.apellido}, {item.nombre}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.footerText}>Volver</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  atmContainer: { flex: 1, backgroundColor: '#001f3f', alignItems: 'center', justifyContent: 'center' },
  atmCard: { backgroundColor: '#002a54', borderRadius: 20, padding: 20, width: '90%', alignItems: 'center' },
  keyboardGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center', gap: 12 },
  keyButton: { backgroundColor: '#001f3f', width: 70, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keyText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  clearKey: { backgroundColor: '#ffb703', width: 70, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  atmDisplay: { backgroundColor: '#000', color: '#00ffcc', fontSize: 28, padding: 20, marginBottom: 20 },
  mainContainer: { flex: 1, backgroundColor: '#001f3f', padding: 20 },
  panelTitle: { color: '#ffcc00', fontSize: 20, textAlign: 'center', marginBottom: 20 },
  userRow: { backgroundColor: '#002a54', padding: 15, borderRadius: 10, marginBottom: 10 },
  userName: { color: '#fff', fontWeight: 'bold' },
  footerText: { color: '#fff', textAlign: 'center', marginTop: 20 }
});