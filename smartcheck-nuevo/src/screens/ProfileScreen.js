import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ProfileAvatar from '../components/ProfileAvatar'; // <-- COMPONENTE IMPORTADO

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [localidad, setLocalidad] = useState('...');

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(logout, 1000);
  };

  const calcularEdad = () => {
    if (!user) return "N/A";
    let fecha = user.fechaNacimiento;
    if (!fecha && user.dia && user.mes && user.anio) fecha = `${user.dia}/${user.mes}/${user.anio}`;
    if (!fecha || fecha === "N/A") return "N/A";
    try {
      const partes = fecha.split('/');
      const hoy = new Date();
      let edad = hoy.getFullYear() - parseInt(partes[2], 10);
      const mesActual = hoy.getMonth();
      const mes = parseInt(partes[1], 10) - 1;
      if (mesActual < mes || (mesActual === mes && hoy.getDate() < parseInt(partes[0], 10))) edad--;
      return edad.toString();
    } catch (e) { return "N/A"; }
  };

  const renderSexIcon = () => {
    const s = (user?.sexo || "").toUpperCase();
    if (s.includes('F')) return <Image source={require('../../assets/sexfeme.png')} style={styles.sexIcon} />;
    if (s.includes('M')) return <Image source={require('../../assets/sexmascu.png')} style={styles.sexIcon} />;
    return <Image source={require('../../assets/sexindef.png')} style={styles.sexIcon} />;
  };

  useEffect(() => {
    if (user?.ubicacion) {
      setLocalidad(user.ubicacion);
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.titleText}>MI PERFIL</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.userHeaderRow}>
              {/* AQUÍ SE USA EL COMPONENTE REUTILIZABLE */}
              <ProfileAvatar user={user} size={80} />
              
              <Text style={styles.userName} numberOfLines={2}>
                {user?.nombre || 'Usuario'} {user?.apellido || ''}
              </Text>
          </View>
          
          <View style={styles.goldenLineFull} />

          <View style={styles.grid}>
            <View style={styles.item}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.text} numberOfLines={1}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Edad:</Text>
              <Text style={styles.text}>{calcularEdad()} años</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Sexo:</Text>
              {renderSexIcon()}
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Ubicación:</Text>
              <Text style={styles.text} numberOfLines={1}>{user?.ubicacion || 'No disponible'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerWrapper}>
        <View style={styles.footerLine} />
        <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require('../../assets/volver.png')} style={[styles.navIcon, {tintColor: '#00E5FF'}]}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogoutFlow}>
              <Image source={require('../../assets/salir.png')} style={[styles.navIcon, {tintColor: '#00E5FF'}]}/>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { alignItems: 'center', paddingVertical: 10 },
  logo: { width: 80, height: 80, resizeMode: 'contain' },
  titleBar: { backgroundColor: '#000', paddingVertical: 10, alignItems: 'center' },
  titleText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  body: { paddingHorizontal: 20, marginTop: 20 },
  userHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15, flex: 1 },
  goldenLineFull: { width: '100%', height: 2, backgroundColor: '#ffcc00', marginBottom: 20 },
  grid: { backgroundColor: '#000', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#ffcc00' },
  item: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  label: { color: '#ffcc00', fontWeight: 'bold', marginRight: 10, width: 85, fontSize: 14 },
  text: { color: '#fff', flex: 1, fontSize: 14 },
  sexIcon: { width: 30, height: 30, resizeMode: 'contain' },
  footerWrapper: { width: '100%', paddingHorizontal: 30, paddingBottom: 10 },
  footerLine: { width: '100%', height: 1, backgroundColor: '#FFD700', marginBottom: 15 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navIcon: { width: 50, height: 50, resizeMode: 'contain' }
});