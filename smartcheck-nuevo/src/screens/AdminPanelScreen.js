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
      // Usamos la ruta limpia estándar de administración. 
      // Si tu backend no expone /admin, podés cambiarlo aquí a `${API_URL}/api/users`
      const URL_LIMPIA = `${API_URL}/api/users/admin`;
      console.log(`📡 Solicitando usuarios de administración a: ${URL_LIMPIA}`);
      
      const respuesta = await fetch(URL_LIMPIA, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!respuesta.ok) {
        throw new Error(`Error del servidor: código ${respuesta.status}`);
      }

      const textoRespuesta = await respuesta.text();
      let datos = {};
      
      try {
        datos = JSON.parse(textoRespuesta);
      } catch (jsonErr) {
        throw new Error("La respuesta del servidor no tiene un formato JSON válido.");
      }

      if (datos && datos.status !== 'error') {
        // Si el backend responde directamente con un Array de usuarios en vez de un objeto complejo
        if (Array.isArray(datos)) {
          setDataAdmin({ totalUsuarios: datos.length, totalVisitas: 0, usuarios: datos });
        } else if (datos.usuarios) {
          setDataAdmin(datos);
        } else {
          setDataAdmin({ totalUsuarios: 0, totalVisitas: 0, usuarios: [] });
        }
      } else {
        Alert.alert("Error", datos.mensaje || "No se pudieron obtener datos");
      }
    } catch (e) { 
      console.error("❌ Falló la conexión con el panel:", e);
      Alert.alert(
        "Error de Conexión", 
        "Hubo un problema al comunicarse con el panel de administración. Por favor, verificá que la ruta coincida con tu backend."
      ); 
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => { 
      if (autenticado) {
        cargarTelemetriaMovil(); 
      }
    }, [autenticado])
  );

  const presionarTecla = (v) => {
    if (pinIngresado.length >= 5 || loading) return;
    const nuevoPin = pinIngresado + v;
    setPinIngresado(nuevoPin);
    
    if (nuevoPin === '00192') { 
      setAutenticado(true); 
      setPinIngresado(''); 
    } else if (nuevoPin.length === 5) { 
      Alert.alert("Denegado", "PIN incorrecto"); 
      setPinIngresado(''); 
    }
  };

  // VISTA 1: FORMULARIO DE ACCESO CON PIN DE SEGURIDAD
  if (!autenticado) {
    return (
      <View style={styles.atmContainer}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
          </View>
        </View>

        <View style={styles.blackTitleBar}>
          <Text style={styles.titleText}>ACCESO ADMINISTRADOR</Text>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.atmCard}>
            <Text style={styles.atmTitle}>CLAVE ADMINISTRADOR</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#00ffcc" style={{ marginVertical: 20 }} />
            ) : (
              <Text style={styles.atmDisplay}>{ '• '.repeat(pinIngresado.length) + '_ '.repeat(5 - pinIngresado.length) }</Text>
            )}
            
            <View style={styles.keyboardGrid}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <TouchableOpacity key={n} disabled={loading} style={styles.keyButton} onPress={() => presionarTecla(n.toString())}>
                  <Text style={styles.keyText}>{n}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.emptySpace} />
              <TouchableOpacity disabled={loading} style={styles.keyButton} onPress={() => presionarTecla('0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={loading} style={styles.clearKey} onPress={() => setPinIngresado(pinIngresado.slice(0, -1))}>
                <Text style={styles.keyTextBtn}>⌫</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00ffcc" />
            <Text style={styles.loadingText}>Conectando con el servidor...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollTable} showsVerticalScrollIndicator={false}>
            {dataAdmin.usuarios && dataAdmin.usuarios.length > 0 ? (
              dataAdmin.usuarios.map((item, index) => (
                <View key={index} style={styles.userRow}>
                  <View style={styles.userDataArea}>
                    <Text style={styles.userName}>{item.apellido}, {item.nombre}</Text>
                    <Text style={styles.userEmail}>{item.email || 'Sin correo'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No se encontraron usuarios registrados.</Text>
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.footerAreaCenter}>
        <TouchableOpacity style={styles.btnVolver} onPress={() => { setAutenticado(false); navigation.goBack(); }}>
          <Text style={styles.btnVolverText}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  atmContainer: { flex: 1, backgroundColor: '#001f3f' },
  topSection: { marginTop: SCREEN_HEIGHT * 0.04, marginBottom: 5 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  logo: { width: 45, height: 45, resizeMode: 'contain' },
  nombreApp: { width: 130, height: 40, resizeMode: 'contain', marginLeft: 10 },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 8, width: '100%', marginBottom: 15 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center', letterSpacing: 0.5 },
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  centerSectionPanel: { flex: 1, width: '100%', paddingHorizontal: 20 },
  atmCard: { backgroundColor: '#002a54', borderRadius: 25, padding: 20, width: '100%', alignItems: 'center', elevation: 4 },
  atmTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  atmDisplay: { backgroundColor: '#000', color: '#00ffcc', fontSize: 26, paddingVertical: 12, paddingHorizontal: 25, marginBottom: 20, borderRadius: 10, textAlign: 'center', width: '80%', letterSpacing: 4 },
  keyboardGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center', gap: 12 },
  keyButton: { backgroundColor: '#001f3f', width: 70, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keyText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  keyTextBtn: { color: '#001f3f', fontSize: 22, fontWeight: 'bold' },
  clearKey: { backgroundColor: '#ffb703', width: 70, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptySpace: { width: 70, height: 55 },
  scrollTable: { flex: 1, marginTop: 5 },
  userRow: { backgroundColor: '#002a54', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#003366' },
  userDataArea: { justifyContent: 'center' },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  userEmail: { color: '#00ffcc', fontSize: 12, marginTop: 2 },
  noDataText: { color: '#fff', textAlign: 'center', marginTop: 30, fontSize: 14 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 14 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginBottom: 20 },
  footerAreaCenter: { alignItems: 'center', marginBottom: 25 },
  navIcon: { width: 40, height: 40, resizeMode: 'contain' },
  btnVolver: { backgroundColor: '#00ffcc', paddingVertical: 12, paddingHorizontal: 45, borderRadius: 25 },
  btnVolverText: { fontWeight: 'bold', fontSize: 13, color: '#001f3f' }
});