import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, BackHandler, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
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

  // VISTA 1: FORMULARIO DE ACCESO CON PIN DE SEGURIDAD
  if (!autenticado) {
    return (
      <View style={styles.atmContainer}>
        {/* SECCIÓN SUPERIOR UNIFICADA (Logo normalizado + Nombre de App) */}
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
          </View>
        </View>

        {/* BARRA DE TÍTULO INSTITUCIONAL */}
        <View style={styles.blackTitleBar}>
          <Text style={styles.titleText}>ACCESO ADMINISTRADOR</Text>
        </View>

        {/* CONTENEDOR CENTRAL DEL PIN PAD */}
        <View style={styles.centerSection}>
          <View style={styles.atmCard}>
            <Text style={styles.atmTitle}>CLAVE ADMINISTRADOR</Text>
            <Text style={styles.atmDisplay}>{ '• '.repeat(pinIngresado.length) + '_ '.repeat(5 - pinIngresado.length) }</Text>
            
            <View style={styles.keyboardGrid}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <TouchableOpacity key={n} style={styles.keyButton} onPress={() => presionarTecla(n.toString())}>
                  <Text style={styles.keyText}>{n}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.emptySpace} />
              <TouchableOpacity style={styles.keyButton} onPress={() => presionarTecla('0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearKey} onPress={() => setPinIngresado(pinIngresado.slice(0, -1))}>
                <Text style={styles.keyTextBtn}>⌫</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTONERA INFERIOR */}
        <View style={styles.footerArea}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => BackHandler.exitApp()}>
            <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // VISTA 2: PANEL DE TELEMETRÍA (UNA VEZ AUTENTICADO)
  return (
    <View style={styles.atmContainer}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
        </View>
      </View>

      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>PANEL ADMINISTRADOR</Text>
      </View>

      <View style={styles.centerSectionPanel}>
        {loading ? <ActivityIndicator size="large" color="#00ffcc" /> : (
          <ScrollView style={styles.scrollTable} showsVerticalScrollIndicator={false}>
            {dataAdmin.usuarios.map((item, index) => (
              <View key={index} style={styles.userRow}>
                <View style={styles.userDataArea}>
                  <Text style={styles.userName}>{item.apellido}, {item.nombre}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.footerAreaCenter}>
        <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
          <Text style={styles.btnVolverText}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  atmContainer: { flex: 1, backgroundColor: '#001f3f' },
  
  // Header y Branding normalizados
  topSection: { marginTop: SCREEN_HEIGHT * 0.04, marginBottom: 5 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  logo: { width: 45, height: 45, resizeMode: 'contain' },
  nombreApp: { width: 130, height: 40, resizeMode: 'contain', marginLeft: 10 },
  
  // Franja institucional
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 8, width: '100%', marginBottom: 15 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center', letterSpacing: 0.5 },

  // Estructura de pantallas
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  centerSectionPanel: { flex: 1, width: '100%', paddingHorizontal: 20 },
  
  // Card ATM y teclado numérico
  atmCard: { backgroundColor: '#002a54', borderRadius: 25, padding: 20, width: '100%', alignItems: 'center', elevation: 4 },
  atmTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  atmDisplay: { backgroundColor: '#000', color: '#00ffcc', fontSize: 26, paddingVertical: 12, paddingHorizontal: 25, marginBottom: 20, borderRadius: 10, textAlign: 'center', width: '80%', letterSpacing: 4 },
  keyboardGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center', gap: 12 },
  keyButton: { backgroundColor: '#001f3f', width: 70, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keyText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  keyTextBtn: { color: '#001f3f', fontSize: 22, fontWeight: 'bold' },
  clearKey: { backgroundColor: '#ffb703', width: 70, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptySpace: { width: 70, height: 55 },

  // Panel de datos
  scrollTable: { flex: 1, marginTop: 5 },
  userRow: { backgroundColor: '#002a54', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#003366' },
  userDataArea: { justifyContent: 'center' },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  // Footer e íconos de navegación
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginBottom: 20 },
  footerAreaCenter: { alignItems: 'center', marginBottom: 25 },
  navIcon: { width: 40, height: 40, resizeMode: 'contain' },
  btnVolver: { backgroundColor: '#00ffcc', paddingVertical: 12, paddingHorizontal: 45, borderRadius: 25 },
  btnVolverText: { fontWeight: 'bold', fontSize: 13, color: '#001f3f' }
});