// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, BackHandler, Dimensions, ScrollView } from 'react-native';
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

  // Formateador estricto de la foto Base64
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

  // Función auxiliar para formatear la fecha de nacimiento de forma legible
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return fecha; // Si ya es un string formateado, lo devuelve tal cual
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER DE LA APP */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoPanel} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppPanel} />
      </View>
      
      {/* TÍTULO EN FRANJA NEGRA CON LETRA BLANCA */}
      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>MI PERFIL DE USUARIO</Text>
      </View>
      
      {/* CONTENIDO CON SCROLL EN CASO DE PANTALLAS CHICAS */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TARJETA DE PERFIL CON BORDE NARANJA SUAVE FINO */}
        <View style={styles.profileCard}>
          
          {/* FOTO DE PERFIL */}
          {uriFoto ? (
              <Image source={{ uri: uriFoto }} style={styles.avatar} key={uriFoto} />
          ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>SIN FOTO</Text>
              </View>
          )}
          
          {/* TODOS LOS DATOS RECABADOS */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>NOMBRE Y APELLIDO:</Text>
            <Text style={styles.value}>{user?.nombre} {user?.apellido?.toUpperCase()}</Text>
            
            <Text style={styles.label}>EMAIL:</Text>
            <Text style={styles.value}>{user?.email}</Text>
            
            <Text style={styles.label}>LOCALIDAD:</Text>
            <Text style={styles.value}>{user?.localidad || 'N/A'}</Text>
            
            <Text style={styles.label}>PROVINCIA:</Text>
            <Text style={styles.value}>{user?.provincia || 'N/A'}</Text>
            
            <Text style={styles.label}>FECHA DE NACIMIENTO:</Text>
            <Text style={styles.value}>{formatearFecha(user?.fechaNacimiento || user?.fechanacimiento)}</Text>
            
            <Text style={styles.label}>EDAD:</Text>
            <Text style={styles.value}>{user?.edad || 'N/A'} AÑOS</Text>
            
            <Text style={styles.label}>SEXO:</Text>
            <Text style={styles.value}>{user?.sexo === 'M' ? 'MASCULINO' : user?.sexo === 'F' ? 'FEMENINO' : user?.sexo || 'N/A'}</Text>
          </View>

        </View>
      </ScrollView>
      
      {/* BOTONERA INFERIOR */}
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
  container: { flex: 1, backgroundColor: '#001f3f', paddingTop: height * 0.05 },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
  logoPanel: { width: 45, height: 45, resizeMode: 'contain' },
  nombreAppPanel: { width: 120, height: 40, resizeMode: 'contain' },
  
  // ESTILO DE LA FRANJA NEGRA DE TÍTULO
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 10, width: '100%', marginBottom: 15 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textAlign: 'center', letterSpacing: 1 },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  // TARJETA RECTANGULAR CON BORDE NARANJA FINO Y SUAVE
  profileCard: { 
    backgroundColor: '#002a54', 
    borderRadius: 15, 
    padding: 20, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#ff9933', // Naranja suave fino
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#00ffcc', marginBottom: 20 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#003b75', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  infoContainer: { width: '100%' },
  label: { color: '#00ffcc', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  value: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: height * 0.03, paddingTop: 10 },
  navIcon: { width: 42, height: 42, resizeMode: 'contain' }
});