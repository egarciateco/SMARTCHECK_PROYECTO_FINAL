import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, BackHandler, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

  useEffect(() => {
    const inicializarHome = async () => {
      try {
        let datos = route.params;

        // Recuperar si viene vacío
        if (!datos || !datos._id) {
          const guardado = await AsyncStorage.getItem('usuario_logueado');
          if (guardado) datos = JSON.parse(guardado);
        }

        if (datos && datos._id) {
          setUsuario(datos);
          // Telemetría
          await fetch(`${API_URL}/api/users/usuarios/registrar-visita`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: datos._id })
          }).catch(e => console.log('Error telemetría:', e.message));
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error("Error al inicializar:", error);
      } finally {
        setCargando(false);
      }
    };
    inicializarHome();
  }, [route.params]);

  if (cargando) return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
        {usuario?.fotoUrl ? <Image source={{ uri: usuario.fotoUrl }} style={styles.userAvatar} /> : <Ionicons name="person-circle" size={50} color="#fff" />}
      </View>

      <View style={styles.blackBar}><Text style={styles.welcomeText}>¡BIENVENID@, {usuario?.nombre?.toUpperCase() || 'USUARIO'}!</Text></View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Perfil', usuario)}>
            <Image source={require('../../assets/perfil.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Mi Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Busqueda', { ...usuario })}>
            <Image source={require('../../assets/lupa.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Buscar Productos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('AdminPanel')}>
            <Image source={require('../../assets/admin.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Panel Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Image source={require('../../assets/volver.png')} style={styles.navIcon} /></TouchableOpacity>
        <TouchableOpacity onPress={() => BackHandler.exitApp()}><Image source={require('../../assets/salir.png')} style={styles.navIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' },
  logoGrande: { width: 80, height: 80, resizeMode: 'contain' },
  nombreAppGrande: { width: 150, height: 60, resizeMode: 'contain' },
  userAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#00ffcc' },
  blackBar: { backgroundColor: '#000', padding: 10, marginBottom: 20 },
  welcomeText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  menuGrid: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, gap: 20 },
  menuBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#002a54', width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#003b75', elevation: 3 },
  btnImg: { width: 45, height: 45, resizeMode: 'contain' },
  btnLabel: { color: '#fff', marginLeft: 15, fontWeight: '600', fontSize: 15 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 30 },
  navIcon: { width: 50, height: 50, resizeMode: 'contain' }
});