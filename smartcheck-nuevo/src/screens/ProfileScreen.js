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

  // Formateador de Fecha de Nacimiento (DD/MM/AAAA)
  const fechaOriginal = user?.fechaNacimiento || user?.fechanacimiento;
  let fechaFormateada = 'N/A';
  let edadCalculada = 'N/A';

  if (fechaOriginal) {
    try {
      const d = new Date(fechaOriginal);
      if (!isNaN(d.getTime())) {
        fechaFormateada = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        
        // CÁLCULO DE EDAD: Fecha actual de 2026 menos fecha de nacimiento
        const hoy = new Date();
        let edad = hoy.getFullYear() - d.getFullYear();
        const mes = hoy.getMonth() - d.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < d.getDate())) {
          edad--;
        }
        edadCalculada = `${edad} AÑOS`;
      } else {
        fechaFormateada = fechaOriginal;
      }
    } catch {
      fechaFormateada = 'N/A';
    }
  }

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
      
      {/* TARJETA DE PERFIL CONTENIDA SIN SCROLL */}
      <View style={styles.profileCard}>
        
        {/* FOTO DE PERFIL */}
        {uriFoto ? (
            <Image source={{ uri: uriFoto }} style={styles.avatar} key={uriFoto} />
        ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{color: '#fff', fontSize: 11, fontWeight: 'bold'}}>SIN FOTO</Text>
            </View>
        )}
        
        {/* GRILLA DE DATOS COMPACTA */}
        <View style={styles.infoContainer}>
          <View style={styles.dataRow}>
            <Text style={styles.label}>NOMBRE Y APELLIDO:</Text>
            <Text style={styles.value}>{user?.nombre} {user?.apellido?.toUpperCase()}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>EMAIL:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          
          <View style={styles.dataRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>LOCALIDAD:</Text>
              <Text style={styles.value}>{user?.localidad || 'N/A'}</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={styles.label}>PROVINCIA:</Text>
              <Text style={styles.value}>{user?.provincia || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.dataRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>FECHA DE NACIMIENTO:</Text>
              <Text style={styles.value}>{fechaFormateada}</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={styles.label}>EDAD:</Text>
              <Text style={styles.value}>{user?.edad ? `${user.edad} AÑOS` : edadCalculada}</Text>
            </View>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.label}>SEXO:</Text>
            <Text style={styles.value}>
              {user?.sexo === 'M' ? 'MASCULINO' : user?.sexo === 'F' ? 'FEMENINO' : user?.sexo || 'N/A'}
            </Text>
          </View>
        </View>

      </View>
      
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
  container: { flex: 1, backgroundColor: '#001f3f', paddingTop: height * 0.04 },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 20 },
  logoPanel: { width: 42, height: 42, resizeMode: 'contain' },
  nombreAppPanel: { width: 110, height: 35, resizeMode: 'contain' },
  
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 8, width: '100%', marginBottom: 12 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center', letterSpacing: 0.5 },
  
  profileCard: { 
    backgroundColor: '#002a54', 
    borderRadius: 12, 
    paddingVertical: 12,
    paddingHorizontal: 18, 
    alignItems: 'center', 
    borderWidth: 1.2, 
    borderColor: '#ff9933', // Línea naranja suave y fina
    marginHorizontal: 20,
    flex: 1, // Se expande de forma controlada ocupando el espacio justo sin desbordar
    marginBottom: 10
  },
  
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#00ffcc', marginBottom: 12 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#003b75', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  infoContainer: { width: '100%', flex: 1, justifyContent: 'space-around' }, // Distribuye los campos verticalmente de forma compacta
  
  dataRow: { width: '100%', marginBottom: 4 },
  dataRowInline: { flexDirection: 'row', width: '100%', marginBottom: 4 },
  label: { color: '#00ffcc', fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 1 },
  value: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: height * 0.02, paddingTop: 5 },
  navIcon: { width: 38, height: 38, resizeMode: 'contain' }
});