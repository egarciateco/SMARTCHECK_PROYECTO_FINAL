// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, BackHandler, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import storage from '../utils/storage'; // <-- Usamos tu storage unificado
import { useAuth } from '../context/AuthContext';

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
          if (!user || (user.id !== datos.id && user._id !== datos._id)) {
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

  // Manejo del renderizado de la imagen Base64 del avatar
  const renderAvatar = () => {
    const fotoBase64 = user?.foto || user?.image;
    
    if (!fotoBase64) {
      return <Ionicons name="person-circle" size={50} color="#fff" />;
    }

    const cleanUri = fotoBase64.startsWith('data:image') 
      ? fotoBase64 
      : `data:image/jpeg;base64,${fotoBase64}`;

    return <Image source={{ uri: cleanUri }} style={styles.userAvatar} />;
  };

  // Función segura para el botón de cerrar sesión
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

  // 🔍 PRUEBA DE TELEMETRÍA/DEBUGGER: Esto imprimirá los datos exactos del usuario en tu terminal
  console.log("========================================");
  console.log("🔍 DATOS DEL USUARIO ACTUAL EN HOME:", JSON.stringify(user, null, 2));
  console.log("========================================");

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
            <Image source={require('../../assets/perfil.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Mi Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Busqueda')}>
            <Image source={require('../../assets/lupa.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Buscar Productos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('AdminPanel')}>
            <Image source={require('../../assets/admin.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Panel Admin</Text>
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