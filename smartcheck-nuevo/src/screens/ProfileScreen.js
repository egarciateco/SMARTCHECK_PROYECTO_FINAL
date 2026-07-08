import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const LOGO = require('../../assets/logo.png');
const NOMBRE_APP = require('../../assets/nombreapp.png');
const VOLVER_ICON = require('../../assets/volver.png');
const SALIR_ICON = require('../../assets/salir.png');

// Iconos en formato PNG
const EMAIL_ICON = require('../../assets/email.png');
const FECHANAC_ICON = require('../../assets/fechanac.png');
const EDAD_ICON = require('../../assets/edad.png');
const PROVINCIA_ICON = require('../../assets/provincia.png');
const LOCALIDAD_ICON = require('../../assets/localidad.png');

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();

  let fechaFormateada = '';
  let edadCalculada = '';

  // ESTRATEGIA A: Si los datos vienen separados como en el AdminPanel
  const d = user?.dia;
  const m = user?.mes;
  const a = user?.anio;

  if (d && m && a) {
    fechaFormateada = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
    const hoy = new Date();
    let edad = hoy.getFullYear() - parseInt(a);
    const mesActual = hoy.getMonth() + 1;
    if (mesActual < parseInt(m) || (mesActual === parseInt(m) && hoy.getDate() < parseInt(d))) {
      edad--;
    }
    edadCalculada = `${edad} años`;
  } 
  // ESTRATEGIA B: Por si el servidor la envía completa (ej: "fechaNacimiento": "1995-04-12T00:00:00.000Z")
  else if (user?.fechaNacimiento || user?.birthdate) {
    const fechaISO = new Date(user.fechaNacimiento || user.birthdate);
    if (!isNaN(fechaISO.getTime())) {
      const diaISO = fechaISO.getDate();
      const mesISO = fechaISO.getMonth() + 1;
      const anioISO = fechaISO.getFullYear();
      
      fechaFormateada = `${String(diaISO).padStart(2, '0')}/${String(mesISO).padStart(2, '0')}/${anioISO}`;
      
      const hoy = new Date();
      let edad = hoy.getFullYear() - anioISO;
      const mesActual = hoy.getMonth() + 1;
      if (mesActual < mesISO || (mesActual === mesISO && hoy.getDate() < diaISO)) {
        edad--;
      }
      edadCalculada = `${edad} años`;
    }
  }

  const InfoBlock = ({ iconSource, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconGlowContainer}>
        <Image source={iconSource} style={styles.infoIcon} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.infoValue}>{value || 'Cargando...'}</Text>
      </View>
      <View style={styles.futureLed} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerApp}>
        <Image source={LOGO} style={styles.logo} />
        <Image source={NOMBRE_APP} style={styles.nombreApp} resizeMode="contain" />
      </View>

      {/* BARRA TÍTULO */}
      <View style={styles.hudBar}>
        <View style={styles.hudDot} />
        <Text style={styles.titleBar}>USUARIO // DATOS_PERFIL</Text>
        <View style={styles.hudDot} />
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.mainContent}>
        <View style={styles.cryptoCard}>
          <View style={styles.avatarRadarWrapper}>
            <Image source={{ uri: user?.foto || user?.image || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </View>
          
          <Text style={styles.userName}>{user?.nombre || 'Usuario'} {user?.apellido || ''}</Text>
          <Text style={styles.userStatus}>● USUARIO EN LÍNEA (SEXO: {user?.sexo || 'N/A'})</Text>
          
          <View style={styles.cyberLine} />

          {/* CONTENEDOR DE DATOS REALES */}
          <View style={styles.dataContainer}>
            <InfoBlock iconSource={EMAIL_ICON} label="Email" value={user?.email} />
            <InfoBlock iconSource={FECHANAC_ICON} label="Fecha de Nacimiento" value={fechaFormateada} />
            <InfoBlock iconSource={EDAD_ICON} label="Edad" value={edadCalculada} />
            <InfoBlock iconSource={PROVINCIA_ICON} label="Provincia" value={user?.provincia} />
            <InfoBlock iconSource={LOCALIDAD_ICON} label="Localidad" value={user?.localidad} />
          </View>
        </View>
      </View>

      {/* BOTONES INFERIORES */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.goBack()}>
          <Image source={VOLVER_ICON} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => console.log('Salir')}>
          <Image source={SALIR_ICON} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020813' }, 
  headerApp: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  logo: { width: 35, height: 35, marginRight: 10 },
  nombreApp: { width: 130, height: 35 },
  hudBar: { flexDirection: 'row', backgroundColor: '#FF8C00', paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  hudDot: { width: 4, height: 4, backgroundColor: '#000000', borderRadius: 2, marginHorizontal: 10 },
  titleBar: { color: '#000000', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  mainContent: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  cryptoCard: { borderWidth: 1, borderColor: 'rgba(0, 255, 204, 0.3)', borderRadius: 20, padding: 16, alignItems: 'center', backgroundColor: 'rgba(6, 18, 36, 0.75)' },
  avatarRadarWrapper: { padding: 3, borderRadius: 50, borderWidth: 1, borderColor: '#00ffcc', borderStyle: 'dashed' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#020813' },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 8, letterSpacing: 0.5 },
  userStatus: { color: '#00ffcc', fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  cyberLine: { height: 1, width: '100%', backgroundColor: 'rgba(255, 140, 0, 0.4)', marginVertical: 12 },
  dataContainer: { width: '100%' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, marginVertical: 3, borderWidth: 1, borderColor: 'rgba(255, 140, 0, 0.25)', borderRadius: 6, backgroundColor: 'rgba(255, 140, 0, 0.02)' },
  iconGlowContainer: { width: 40, height: 40, borderRadius: 6, backgroundColor: 'rgba(0, 255, 204, 0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoIcon: { width: 32, height: 32, resizeMode: 'contain' },
  textContainer: { flex: 1 },
  infoLabel: { fontSize: 8, color: '#FF8C00', fontWeight: 'bold', letterSpacing: 1 },
  infoValue: { fontSize: 12, color: '#e0e6ed', marginTop: 1, fontWeight: '500' },
  futureLed: { width: 3, height: 12, backgroundColor: '#00ffcc', borderRadius: 1.5, opacity: 0.7 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 20 },
  footerBtn: { backgroundColor: 'rgba(6, 18, 36, 0.5)', borderWidth: 1, borderColor: 'rgba(0, 255, 204, 0.2)', borderRadius: 12, padding: 6 },
  icon: { width: 32, height: 32 }
});