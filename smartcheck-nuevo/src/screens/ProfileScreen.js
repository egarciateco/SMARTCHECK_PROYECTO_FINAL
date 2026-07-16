import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [localidad, setLocalidad] = useState('Obteniendo...');
  const [provincia, setProvincia] = useState('...');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [imageError, setImageError] = useState(null);

  const getPhotoUri = () => {
    if (!user) return null;
    return user.foto || user.image || user.urlFoto || user.photoURL;
  };

  const photoUri = getPhotoUri();

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(() => { logout(); }, 1000);
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
    const obtenerUbicacion = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLoadingLocation(false); return; }
        let { coords } = await Location.getCurrentPositionAsync({});
        let dir = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
        if (dir.length > 0) {
          setLocalidad(dir[0].city || dir[0].subregion || 'Ciudad');
          setProvincia(dir[0].region || 'Provincia');
        }
      } catch (error) { console.error(error); } finally { setLoadingLocation(false); }
    };
    obtenerUbicacion();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header optimizado */}
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.titleText}>MI PERFIL</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.userHeaderRow}>
              <View style={styles.avatarContainer}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatar} resizeMode="cover" onError={(e) => setImageError(e.nativeEvent.error)} />
                ) : (
                  <View style={styles.avatarPlaceholder}><Text style={styles.placeholderText}>Sin foto</Text></View>
                )}
              </View>
              <Text style={styles.userName} numberOfLines={2}>{user?.nombre || 'Usuario'} {user?.apellido || ''}</Text>
          </View>
          
          <View style={styles.goldenLineFull} />

          <View style={styles.grid}>
            <View style={styles.item}><Text style={styles.label}>Email:</Text><Text style={styles.text} numberOfLines={1}>{user?.email || 'N/A'}</Text></View>
            <View style={styles.item}><Text style={styles.label}>Edad:</Text><Text style={styles.text}>{calcularEdad()} años</Text></View>
            <View style={styles.item}><Text style={styles.label}>Sexo:</Text>{renderSexIcon()}</View>
            <View style={styles.item}>
              <Text style={styles.label}>Ubicación:</Text>
              {loadingLocation ? 
                <Text style={styles.loadingText}>Verificando geolocalización...</Text> : 
                <Text style={styles.text} numberOfLines={1}>{localidad}, {provincia}</Text>
              }
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerWrapper}>
        <View style={styles.footerLine} />
        <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
                <Image source={require('../../assets/volver.png')} style={styles.navIcon}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogoutFlow}>
                <Image source={require('../../assets/salir.png')} style={styles.navIcon}/>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  scrollContent: { flexGrow: 1 },
  // Padding superior reducido para subir todo el header
  header: { width: '100%', backgroundColor: '#001f3f', paddingTop: 10, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  // Logo más grande y ajustado
  logo: { width: 100, height: 100, resizeMode: 'contain' },
  // Nombre de app agrandado (height: 65)
  appName: { flex: 1, height: 65, resizeMode: 'contain', marginHorizontal: 5 },
  titleBar: { backgroundColor: '#000', paddingVertical: 8, alignItems: 'center', width: '100%' },
  titleText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  // Margen superior reducido para subir el contenido
  body: { paddingHorizontal: 20, marginTop: 5 },
  userHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 2, borderColor: '#ffcc00', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ccc' },
  placeholderText: { color: '#000', fontSize: 10 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15, flex: 1 },
  goldenLineFull: { width: '100%', height: 2, backgroundColor: '#ffcc00', marginBottom: 15 },
  grid: { backgroundColor: '#000', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#ffcc00' },
  item: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  label: { color: '#ffcc00', fontWeight: 'bold', marginRight: 10, width: 80, fontSize: 13 },
  text: { color: '#fff', flex: 1, fontSize: 13 },
  loadingText: { color: '#00E5FF', flex: 1, fontSize: 13, fontStyle: 'italic' },
  sexIcon: { width: 35, height: 35, resizeMode: 'contain' },
  footerWrapper: { width: '100%', paddingHorizontal: 20, paddingBottom: 20 },
  footerLine: { width: '100%', height: 1, backgroundColor: '#FFD700', marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navIcon: { width: 50, height: 50, tintColor: '#00E5FF' }
});