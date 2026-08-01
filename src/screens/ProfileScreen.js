import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Platform, BackHandler 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  
  const [userData, setUserData] = useState(user || {});
  const [ubicacionTexto, setUbicacionTexto] = useState('Cargando ubicación...');
  const [visitasLocales, setVisitasLocales] = useState(1);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const gestionarVisitas = async () => {
      try {
        const idUsuario = user?.id || user?.uid || user?._id || userData?.id;
        if (!idUsuario) return;

        const storageKey = `@app_visitas_${idUsuario}`;
        const sesionActivaKey = `@sesion_contabilizada_${idUsuario}`;
        
        const yaContabilizado = await AsyncStorage.getItem(sesionActivaKey);
        let visitasGuardadas = await AsyncStorage.getItem(storageKey);
        let baseVisitas = visitasGuardadas ? parseInt(visitasGuardadas, 10) : (user?.visitas || userData?.visitas || 1);

        if (!yaContabilizado) {
          baseVisitas += 1;
          await AsyncStorage.setItem(storageKey, baseVisitas.toString());
          await AsyncStorage.setItem(sesionActivaKey, 'true');

          try {
            await api.post(`/api/users/incrementar-visitas/${idUsuario}`, { visitas: baseVisitas });
          } catch (apiErr) {
            console.log("No se pudo actualizar visitas en la API, usando respaldo local:", apiErr.message);
          }
        }

        setVisitasLocales(baseVisitas);
      } catch (error) {
        console.log("Error actualizando visitas locales:", error.message);
      }
    };

    gestionarVisitas();
  }, [user, userData?.id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const idUsuario = user?.id || user?.uid || user?._id;
        if (idUsuario) {
          const response = await api.get(`/api/users/usuario/${idUsuario}`);
          if (response.data && response.data.usuario) {
            setUserData(response.data.usuario);
            await resolverUbicacion(response.data.usuario);
            return;
          }
        }
      } catch (error) {
        console.log("Aviso: No se pudo actualizar desde la API, usando datos locales:", error.message);
      }
      if (user) {
        await resolverUbicacion(user);
      }
    };

    fetchUserProfile();
  }, [user]);

  const resolverUbicacion = async (item) => {
    let city = "Paraná";
    let region = "Entre Ríos";

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const geoDefault = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        if (geoDefault.length > 0) {
          city = geoDefault[0].city || geoDefault[0].subregion || city;
          region = geoDefault[0].region || region;
        }
      }
    } catch (e) {
      console.log("Ubicación GPS por defecto:", e.message);
    }

    if (item?.provincia || item?.localidad) {
      const prov = item.provincia || region;
      const loc = item.localidad || city;
      setUbicacionTexto(`${prov} - ${loc}`);
      return;
    }

    const lat = parseFloat(item?.latitud || item?.lat);
    const lng = parseFloat(item?.longitud || item?.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      try {
        const direccion = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (direccion.length > 0) {
          const loc = direccion[0].city || direccion[0].subregion || city;
          const prov = direccion[0].region || region;
          setUbicacionTexto(`${prov} - ${loc}`);
          return;
        }
      } catch (err) {
        console.log("Error en reverseGeocodeAsync:", err);
      }
    }

    setUbicacionTexto(`${region} - ${city}`);
  };

  const calcularEdad = (nacimiento) => {
    if (!nacimiento) return "N/A";
    try {
      let nDate;
      if (nacimiento.includes('/')) {
        const partes = nacimiento.split('/');
        if (partes.length !== 3) return "N/A";
        nDate = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      } else {
        nDate = new Date(nacimiento);
      }
      const hoy = new Date();
      let edad = hoy.getFullYear() - nDate.getFullYear();
      const mDiff = hoy.getMonth() - nDate.getMonth();
      if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nDate.getDate())) edad--;
      return isNaN(edad) ? "N/A" : `${edad} años`;
    } catch (e) {
      return "N/A";
    }
  };

  const calcularAntiguedad = (fechaRegistro) => {
    if (!fechaRegistro) return "1 día";
    try {
      const regDate = new Date(fechaRegistro);
      const hoy = new Date();
      const diffTime = Math.abs(hoy - regDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        const anos = Math.floor(diffDays / 365);
        return `${anos} ${anos === 1 ? 'año' : 'años'}`;
      }
      if (diffDays > 30) {
        const meses = Math.floor(diffDays / 30);
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
      }
      return `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    } catch (e) {
      return "1 día";
    }
  };

  const obtenerIniciales = (nombre, apellido) => {
    const n = nombre ? nombre.charAt(0) : '';
    const a = apellido ? apellido.charAt(0) : '';
    return `${n}${a}`.toUpperCase() || 'US';
  };

  const handleVolver = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeScreen', { user: userData });
    }
  };

  const handleSalir = async () => {
    const idUsuario = user?.id || user?.uid || user?._id;
    if (idUsuario) {
      await AsyncStorage.removeItem(`@sesion_contabilizada_${idUsuario}`);
    }
    await logout();
    BackHandler.exitApp();
  };

  const nombreUsuario = userData?.nombre || user?.nombre || 'Usuario';
  const apellidoUsuario = userData?.apellido || user?.apellido || '';
  const emailUsuario = userData?.email || userData?.correo || user?.email || 'No registrado';
  const sexoUsuario = (userData?.sexo || user?.sexo || '').toLowerCase();
  const fechaNacimiento = userData?.fechaNacimiento || (userData?.dia ? `${userData.dia}/${userData.mes}/${userData.anio}` : (user?.fechaNacimiento || 'N/A'));
  const edadTexto = calcularEdad(fechaNacimiento);
  const fechaRegFormateada = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '01/01/2026';
  const antiguedadTexto = calcularAntiguedad(userData?.createdAt || user?.createdAt);
  const fotoUri = userData?.foto || userData?.image || user?.foto || user?.image || null;

  const visitasApp = Math.max(visitasLocales, userData?.visitas || userData?.cantidadVisitas || user?.visitas || 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
        </View>
      </View>

      <View style={styles.blackBanner}>
        <Text style={styles.bannerText}>MI PERFIL</Text>
      </View>
      <View style={styles.titleGoldLine} />

      <View style={styles.profileHeaderSection}>
        <View style={styles.nameContainer}>
          <Text style={styles.userNameText} numberOfLines={1}>
            {apellidoUsuario ? `${apellidoUsuario.toUpperCase()}, ${nombreUsuario}` : nombreUsuario}
          </Text>
        </View>
        <View style={styles.avatarContainer}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{obtenerIniciales(nombreUsuario, apellidoUsuario)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.titleGoldLine} />

      <View style={styles.detailsBox}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabelEmail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Email:</Text>
          <Text style={styles.dataValueEmail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{emailUsuario}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Edad:</Text>
          <Text style={styles.dataValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{edadTexto}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabelNacimiento} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Fecha de Nacimiento:</Text>
          <Text style={styles.dataValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{fechaNacimiento}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Sexo:</Text>
          <View style={styles.sexIconRow}>
            {sexoUsuario.includes('masculin') || sexoUsuario === 'm' ? (
              <FontAwesome5 name="mars" size={22} color="#00bfff" />
            ) : sexoUsuario.includes('feminin') || sexoUsuario === 'f' ? (
              <FontAwesome5 name="venus" size={22} color="#ff69b4" />
            ) : (
              <FontAwesome5 name="transgender" size={22} color="#dda0dd" />
            )}
          </View>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabelUbicacion} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Ubicación:</Text>
          <Text style={styles.dataValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{ubicacionTexto}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabelRegistro} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Fecha de Registro:</Text>
          <Text style={styles.dataValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{fechaRegFormateada}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabelAntiguedad} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Antigüedad en la App:</Text>
          <Text style={styles.dataValueAntiguedad} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{antiguedadTexto}</Text>
        </View>
      </View>

      <View style={styles.visitasContainer}>
        <View style={styles.visitasDataRow}>
          <Text style={styles.dataLabelVisitas} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Cantidad de Visitas a la Fecha:</Text>
          <Text style={styles.visitasNumero} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{visitasApp}</Text>
        </View>
      </View>

      <View style={styles.footerFixed}>
        <View style={styles.goldLineFull} />
        <View style={styles.footerButtonsRow}>
          <TouchableOpacity onPress={handleVolver} style={styles.footerButton}>
            <Image source={require('../../assets/volver.png')} style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSalir} style={styles.footerButton}>
            <Image source={require('../../assets/salir.png')} style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'space-between', paddingBottom: 15 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingTop: 10,
    paddingBottom: 4 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoGrande: { width: 50, height: 50, resizeMode: 'contain', marginRight: 10 },
  nombreAppGrande: { width: 190, height: 42, resizeMode: 'contain' },
  
  blackBanner: { width: '100%', backgroundColor: '#000000', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  bannerText: { color: '#FFD700', fontSize: 17, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  titleGoldLine: { height: 1, backgroundColor: '#FFD700', width: '100%', marginTop: 6, marginBottom: 6 },
  
  profileHeaderSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginVertical: 4 },
  nameContainer: { flex: 1, marginRight: 10 },
  userNameText: { color: '#00fa9a', fontSize: 17, fontWeight: 'bold' },
  
  avatarContainer: { marginLeft: 5 },
  avatarImage: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: '#FFD700', resizeMode: 'cover' },
  initialsCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#003366', borderWidth: 2, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: '#FFD700', fontSize: 19, fontWeight: 'bold' },
  
  detailsBox: { 
    backgroundColor: '#000', 
    marginHorizontal: 15, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#FFD700', 
    paddingHorizontal: 14, 
    paddingVertical: 14,
    justifyContent: 'space-around'
  },
  dataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 7 },
  dataLabel: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', width: '22%' },
  dataLabelEmail: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', width: '16%' },
  dataLabelNacimiento: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', width: '55%' },
  dataLabelUbicacion: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', width: '30%' },
  dataLabelRegistro: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', width: '48%' },
  dataLabelAntiguedad: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', width: '56%' },
  dataLabelVisitas: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', width: '74%' },
  dataValue: { color: '#fff', fontSize: 12, flex: 1, textAlign: 'right' },
  dataValueEmail: { color: '#fff', fontSize: 11.5, flex: 1, textAlign: 'right' },
  dataValueAntiguedad: { color: '#fff', fontSize: 12, width: '40%', textAlign: 'right' },
  sexIconRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  
  visitasContainer: { 
    marginHorizontal: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 10,
    backgroundColor: '#000'
  },
  visitasDataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visitasNumero: { color: '#00fa9a', fontSize: 13, width: '25%', textAlign: 'right', fontWeight: 'bold' },
  
  footerFixed: { marginHorizontal: 0 },
  goldLineFull: { height: 1, backgroundColor: '#FFD700', width: '100%', marginBottom: 12 },
  footerButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
  footerButton: { alignItems: 'center', justifyContent: 'center' },
  footerIcon: { width: 38, height: 38, resizeMode: 'contain', tintColor: '#00BFFF' },
  footerButtonText: { color: '#00BFFF', fontSize: 11, marginTop: 4, fontWeight: 'bold' }
});