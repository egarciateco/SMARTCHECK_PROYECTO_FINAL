// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, BackHandler, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import storage from '../utils/storage'; 
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const { user, login, logout } = useAuth();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const inicializarHome = async () => {
      try {
        let datos = route.params?.usuario || route.params;

        if (!datos || (!datos.id && !datos._id)) {
          datos = await storage.getUser();
        }

        if (datos && (datos.id || datos._id)) {
          if (!user || (user.id !== datos.id && user._id !== datos._id) || !user.foto) {
            // Forzamos actualización por si la foto vino nueva desde el backend
            login(datos);
          }
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (error) {
        console.error("Error al inicializar Home:", error);
      } finally {
        setCargando(false);
      }
    };
    inicializarHome();
  }, [route.params]);

  const renderAvatar = () => {
    const fotoBase64 = user?.foto || user?.image;
    
    if (!fotoBase64 || fotoBase64 === 'null' || typeof fotoBase64 !== 'string') {
      return <Ionicons name="person-circle" size={45} color="#00ffcc" />;
    }

    let base64Puro = fotoBase64;
    if (base64Puro.includes('base64,')) {
      base64Puro = base64Puro.split('base64,').pop();
    }
    base64Puro = base64Puro.replace(/\s/g, '');

    const cleanUri = `data:image/jpeg;base64,${base64Puro}`;

    return <Image source={{ uri: cleanUri }} style={styles.userAvatar} key={cleanUri} />;
  };

  const handleVolverCerrarSesion = () => {
    Alert.alert(
      "Cerrar Sesión", 
      "¿Estás seguro de que deseas salir al menú de login?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          onPress: async () => {
            await logout(); 
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } 
        }
      ]
    );
  };

  if (cargando) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#00ffcc" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
        {renderAvatar()}
      </View>

      <View style={styles.blackBar}>
        <Text style={styles.welcomeText}>¡BIENVENID@, {user?.nombre?.toUpperCase() || 'USUARIO'}!</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Perfil')}>
            <Image source={require('../../assets/perfil.png')} style={styles.btnImg} />
            <Text style={styles.btnLabel}>Mi Perfil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Busqueda')}>
            <Image source={require('../../assets/lupa.png')} style={styles.btnImg} />
            <Text style={styles.btnLabel}>Buscar Productos</Text>
        </TouchableOpacity>
        
        {/* PANEL ADMIN REDISEÑADO: Más estilizado y compacto para que no sature la pantalla */}
        <TouchableOpacity style={[styles.menuBox, styles.adminBox]} onPress={() => navigation.navigate('AdminPanel')}>
            <Image source={require('../../assets/admin.png')} style={styles.btnImgAdmin} />
            <Text style={styles.btnLabel}>Panel Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerArea}>
        <TouchableOpacity onPress={handleVolverCerrarSesion}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => BackHandler.exitApp()}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: height * 0.05, alignItems: 'center', marginBottom: 10 },
  logoGrande: { width: 60, height: 60, resizeMode: 'contain' },
  nombreAppGrande: { width: 130, height: 50, resizeMode: 'contain' },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: '#00ffcc' },
  blackBar: { backgroundColor: '#000', paddingVertical: 8, marginBottom: 15 },
  welcomeText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  menuGrid: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25, gap: 15 },
  menuBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#002a54', width: '100%', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#003b75', elevation: 2 },
  adminBox: { borderColor: '#ffcc00', backgroundColor: '#001b3a' }, 
  btnImg: { width: 38, height: 38, resizeMode: 'contain' },
  btnImgAdmin: { width: 38, height: 38, resizeMode: 'contain' }, 
  btnLabel: { color: '#fff', marginLeft: 15, fontWeight: '600', fontSize: 14 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: height * 0.03, paddingTop: 10 },
  navIcon: { width: 42, height: 42, resizeMode: 'contain' }
});