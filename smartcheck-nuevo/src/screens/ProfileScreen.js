// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, BackHandler, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext'; 
import { userService } from '../config/api';

const { height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth(); 
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (user) {
          const userId = user._id || user.id;
          if (userId && userService && typeof userService.registrarVisita === 'function') {
            await userService.registrarVisita(userId);
          }
        }
      } catch (error) {
        console.warn("APP: Error silencioso al registrar visita:", error.message);
      } finally {
        setCargando(false);
      }
    };
    init();
  }, [user]);

  if (cargando) return <ActivityIndicator size="large" color="#00ffcc" style={styles.loader} />;

  // FORMATEADOR CRÍTICO: Limpia duplicados y asegura la lectura del string base64 de MongoDB Atlas
  const fotoBase64 = user?.foto || user?.image;
  let uriFoto = null;

  if (fotoBase64 && fotoBase64 !== 'null' && typeof fotoBase64 === 'string') {
    let base64Puro = fotoBase64;
    if (base64Puro.includes('base64,')) {
      base64Puro = base64Puro.split('base64,').pop();
    }
    base64Puro = base64Puro.replace(/\s/g, '');
    uriFoto = `data:image/jpeg;base64,${base64Puro}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoPanel} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppPanel} />
      </View>
      
      <Text style={styles.title}>MI PERFIL DE USUARIO</Text>
      
      <View style={styles.profileCard}>
        {uriFoto ? (
            <Image source={{ uri: uriFoto }} style={styles.avatar} key={uriFoto} />
        ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>SIN FOTO</Text>
            </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.label}>NOMBRE:</Text>
          <Text style={styles.value}>{user?.apellido?.toUpperCase()}, {user?.nombre}</Text>
          <Text style={styles.label}>EMAIL:</Text>
          <Text style={styles.value}>{user?.email}</Text>
          <Text style={styles.label}>UBICACIÓN:</Text>
          <Text style={styles.value}>{user?.localidad || 'N/A'}, {user?.provincia || 'N/A'}</Text>
        </View>
      </View>
      
      <View style={styles.footerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert("Salir", "¿Está seguro que desea cerrar la aplicación?", [
            { text: "No", style: "cancel" }, 
            { text: "Sí", onPress: () => BackHandler.exitApp() }
        ])}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', paddingHorizontal: 20, paddingTop: height * 0.05 },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  logoPanel: { width: 45, height: 45, resizeMode: 'contain' },
  nombreAppPanel: { width: 120, height: 40, resizeMode: 'contain' },
  title: { color: '#ffcc00', fontWeight: 'bold', fontSize: 15, textAlign: 'center', marginBottom: 15 },
  profileCard: { backgroundColor: '#002a54', borderRadius: 15, padding: 20, alignItems: 'center', flex: 1, marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#00ffcc', marginBottom: 15 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#003b75', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  infoContainer: { width: '100%' },
  label: { color: '#00ffcc', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  value: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: height * 0.03 },
  navIcon: { width: 42, height: 42, resizeMode: 'contain' }
});