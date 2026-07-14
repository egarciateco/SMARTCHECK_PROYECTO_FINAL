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
    const foto = user.foto || user.image || user.urlFoto || user.photoURL;
    return foto;
  };

  const photoUri = getPhotoUri();

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(() => {
      logout();
    }, 1000);
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

  const handleGoBack = () => {
    navigation.navigate('HomeScreen');
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
    <ScrollView style={styles.container}>
      <View style={styles.blackHeader}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>

      <View style={styles.titleBar}>
        <Text style={styles.titleText}>MI PERFIL</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.avatarContainer}>
          {photoUri ? (
            <Image 
              source={{ uri: photoUri }} 
              style={styles.avatar} 
              resizeMode="cover" 
              onError={(e) => setImageError(e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}><Text style={styles.placeholderText}>Sin foto</Text></View>
          )}
        </View>

        {imageError && <Text style={{color: 'red', fontSize: 10}}>Img Error: {imageError}</Text>}

        <Text style={styles.userName}>{user?.nombre || 'Usuario'} {user?.apellido || ''}</Text>
        
        <View style={styles.goldenLineFull} />

        <View style={styles.grid}>
          <View style={styles.item}><Text style={styles.label}>Email:</Text><Text style={styles.text}>{user?.email || 'N/A'}</Text></View>
          <View style={styles.item}><Text style={styles.label}>Edad:</Text><Text style={styles.text}>{calcularEdad()} años</Text></View>
          <View style={styles.item}><Text style={styles.label}>Sexo:</Text>{renderSexIcon()}</View>
          <View style={styles.item}><Text style={styles.label}>Ubicación:</Text><Text style={styles.text}>{loadingLocation ? "..." : `${localidad}, ${provincia}`}</Text></View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleGoBack}>
            <Image source={require('../../assets/volver.png')} style={styles.footerBtn}/>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogoutFlow}>
            <Image source={require('../../assets/salir.png')} style={styles.footerBtn}/>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  blackHeader: { width: '100%', backgroundColor: '#000', paddingTop: 40, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  logo: { width: 40, height: 40, resizeMode: 'contain' },
  appName: { flex: 1, height: 30, resizeMode: 'contain', marginHorizontal: 10 },
  titleBar: { backgroundColor: '#000', paddingVertical: 8, alignItems: 'center', width: '100%', marginVertical: 5 },
  titleText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  body: { flex: 1, alignItems: 'center', marginTop: 15 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', marginBottom: 10, borderWidth: 3, borderColor: '#ffcc00', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ccc' },
  placeholderText: { color: '#000', fontSize: 10 },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  goldenLineFull: { width: '100%', height: 2, backgroundColor: '#ffcc00', marginBottom: 15 },
  grid: { width: '90%', backgroundColor: '#000', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#ffcc00' },
  item: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  label: { color: '#ffcc00', fontWeight: 'bold', marginRight: 10, width: 100 },
  text: { color: '#fff', flex: 1 },
  sexIcon: { width: 25, height: 25, resizeMode: 'contain' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20 },
  footerBtn: { width: 55, height: 55, resizeMode: 'contain' }
});