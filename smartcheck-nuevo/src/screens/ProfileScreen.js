import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../config/api';

export default function ProfileScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const infoLocal = await AsyncStorage.getItem('usuario_logueado');
        if (infoLocal) {
          const user = JSON.parse(infoLocal);
          setUsuario(user);
          
          // ID obtenido del usuario logueado
          const userId = user._id || user.id;
          
          if (userId) {
            console.log("APP: Enviando registro de visita para ID:", userId);
            const response = await userService.registrarVisita(userId);
            console.log("APP: Respuesta del servidor tras registrar visita:", response.data);
          } else {
            console.warn("APP: No se encontró ID en el usuario logueado.");
          }
        }
      } catch (error) {
        console.error("APP: Error al registrar visita:", error.message);
      } finally {
        setCargando(false);
      }
    };
    init();
  }, []);

  if (cargando) return <ActivityIndicator size="large" color="#00ffcc" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoPanel} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppPanel} />
      </View>
      <Text style={styles.title}>MI PERFIL DE USUARIO</Text>
      
      <View style={styles.profileCard}>
        {usuario?.fotoUrl ? (
            <Image source={{ uri: usuario.fotoUrl }} style={styles.avatar} />
        ) : (
            <View style={styles.avatarPlaceholder}><Text style={{color: '#fff'}}>Sin foto</Text></View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.label}>NOMBRE:</Text>
          <Text style={styles.value}>{usuario?.apellido?.toUpperCase()}, {usuario?.nombre}</Text>
          <Text style={styles.label}>EMAIL:</Text>
          <Text style={styles.value}>{usuario?.email}</Text>
          <Text style={styles.label}>UBICACIÓN:</Text>
          <Text style={styles.value}>{usuario?.localidad || 'N/A'}, {usuario?.provincia || 'N/A'}</Text>
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
  container: { flex: 1, backgroundColor: '#001f3f', paddingHorizontal: 20, paddingTop: 40 },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoPanel: { width: 50, height: 50, resizeMode: 'contain' },
  nombreAppPanel: { width: 140, height: 45, resizeMode: 'contain' },
  title: { color: '#ffcc00', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  profileCard: { backgroundColor: '#002a54', borderRadius: 15, padding: 25, alignItems: 'center', flex: 1, marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#00ffcc', marginBottom: 20 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#003b75', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  infoContainer: { width: '100%' },
  label: { color: '#00ffcc', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  value: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 15 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, paddingBottom: 20 },
  navIcon: { width: 48, height: 48, resizeMode: 'contain' }
});