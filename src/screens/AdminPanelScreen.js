import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Image, 
  TouchableOpacity, Platform, Modal, TextInput, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function AdminPanelScreen({ navigation }) {
  const { logout } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [adminPass, setAdminPass] = useState('00192');
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ubicacionesUsuarios, setUbicacionesUsuarios] = useState({});
  
  // Referencia para precargar el sonido del teclado y evitar el retraso inicial
  const soundRef = useRef(null);
  
  // Modal de cambio de clave
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Precargar el sonido al montar la pantalla para que la primera tecla suene de inmediato
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/click.mp3'),
          { shouldPlay: false }
        );
        soundRef.current = sound;
      } catch (error) {
        // Ignorar si el archivo no existe
      }
    };
    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Sonido de teclado bancario instantáneo usando la instancia precargada
  const playKeySound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/click.mp3'),
          { shouldPlay: true }
        );
        soundRef.current = sound;
      }
    } catch (error) {
      // Ignorar error de reproducción
    }
  };

  // Cargar clave de admin desde AsyncStorage
  useEffect(() => {
    const cargarClaveAdmin = async () => {
      try {
        const passGuardada = await AsyncStorage.getItem('admin_pass');
        if (passGuardada) {
          setAdminPass(passGuardada);
        }
      } catch (e) {
        console.error("Error al cargar clave de admin:", e);
      }
    };
    cargarClaveAdmin();
  }, []);

  // Procesar/Geolocalizar ubicación por usuario
  const resolverUbicaciones = async (listaUsuarios) => {
    let ubicacionesMap = {};
    let defaultCity = "Paraná";
    let defaultRegion = "Entre Ríos";

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const geoDefault = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        if (geoDefault.length > 0) {
          defaultCity = geoDefault[0].city || geoDefault[0].subregion || defaultCity;
          defaultRegion = geoDefault[0].region || defaultRegion;
        }
      }
    } catch (e) {
      console.log("No se pudo obtener la geolocalización por defecto:", e.message);
    }

    for (let userItem of listaUsuarios) {
      const key = userItem.id || userItem.uid || userItem._id || userItem.email;

      if (userItem.localidad || userItem.provincia) {
        const loc = userItem.localidad || defaultCity;
        const prov = userItem.provincia || defaultRegion;
        ubicacionesMap[key] = `${loc} - ${prov}`;
        continue;
      }

      const lat = parseFloat(userItem.latitud || userItem.lat);
      const lng = parseFloat(userItem.longitud || userItem.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        try {
          const direccion = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (direccion.length > 0) {
            const loc = direccion[0].city || direccion[0].subregion || defaultCity;
            const prov = direccion[0].region || defaultRegion;
            ubicacionesMap[key] = `${loc} - ${prov}`;
            continue;
          }
        } catch (err) {
          console.log("Error en reverseGeocodeAsync:", err);
        }
      }

      ubicacionesMap[key] = `${defaultCity} - ${defaultRegion}`;
    }

    setUbicacionesUsuarios(ubicacionesMap);
  };

// Cargar lista de usuarios desde la API (flexible para múltiples formatos de respuesta)
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const response = await api.get('/api/users/usuarios');
        const data = response.data || {};
        let usuariosObtenidos = [];

        if (Array.isArray(data)) {
          usuariosObtenidos = data;
        } else if (data && Array.isArray(data.usuarios)) {
          usuariosObtenidos = data.usuarios;
        } else if (data && Array.isArray(data.data)) {
          usuariosObtenidos = data.data;
        } else if (data && data.success === true && Array.isArray(data.usuarios)) {
          usuariosObtenidos = data.usuarios;
        }

        if (usuariosObtenidos.length > 0) {
          setUsuarios(usuariosObtenidos);
          if (typeof resolverUbicaciones === 'function') {
            await resolverUbicaciones(usuariosObtenidos);
          }
        } else {
          Alert.alert("Aviso", data?.mensaje || "No se obtuvieron usuarios.");
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error.message);
        Alert.alert("Error", "No se pudieron cargar los usuarios.");
      } finally {
        setLoading(false);
      }
    };
    obtenerUsuarios();
  }, []);

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(() => {
      logout();
    }, 1000);
  };

  // Acciones Teclado Cajero con Sonido y Lógica de Intentos
  const handleKeyPress = (num) => {
    playKeySound();
    if (pin.length < 8) setPin(prev => prev + num);
  };

  const handleCancelPin = () => {
    playKeySound();
    setPin('');
  };

  const handleClearPin = () => {
    playKeySound();
    setPin(prev => prev.slice(0, -1));
  };

  const handleEnterPin = () => {
    playKeySound();
    if (pin === adminPass) {
      setIsAuthorized(true);
      setPin('');
      setIntentosFallidos(0);
    } else {
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);
      setPin('');

      if (nuevosIntentos === 1) {
        Alert.alert("Acceso Denegado", "Clave incorrecta. Le quedan 2 oportunidades más.");
      } else if (nuevosIntentos === 2) {
        Alert.alert("Acceso Denegado", "Clave incorrecta. Le queda 1 oportunidad más.");
      } else {
        Alert.alert(
          "Acceso Bloqueado", 
          "Ha superado el número máximo de intentos permitidos.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }
  };

  // Guardar nueva clave de administrador
  const handleSavePassword = async () => {
    if (currentPassInput !== adminPass) {
      Alert.alert("Error", "La contraseña actual no es correcta.");
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 4 caracteres.");
      return;
    }
    try {
      await AsyncStorage.setItem('admin_pass', newPassword);
      setAdminPass(newPassword);
      Alert.alert("Éxito", "Contraseña de administrador actualizada correctamente.");
      setCurrentPassInput('');
      setNewPassword('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la contraseña.");
    }
  };

  const calcularEdad = (nacimiento) => {
    if (!nacimiento || nacimiento === "N/A") return "N/A";
    try {
      const partes = nacimiento.split('/');
      if (partes.length !== 3) return "N/A";
      const nDate = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      const hoy = new Date();
      let edad = hoy.getFullYear() - nDate.getFullYear();
      const mDiff = hoy.getMonth() - nDate.getMonth();
      if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nDate.getDate())) edad--;
      return isNaN(edad) ? "N/A" : edad.toString();
    } catch (e) { 
      return "N/A"; 
    }
  };

  const renderUserItem = ({ item }) => {
    const key = item.id || item.uid || item._id || item.email;
    let nacimiento = item.fechaNacimiento || (item.dia ? `${item.dia}/${item.mes}/${item.anio}` : "N/A");
    const edad = calcularEdad(nacimiento);
    const imagenUri = item.foto || item.image || null;
    const textoUbicacion = ubicacionesUsuarios[key] || "Cargando ubicación...";

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {item.apellido ? `${item.apellido.toUpperCase()}, ${item.nombre}` : item.nombre}
          </Text>
          <Text style={styles.cardText}>Sexo: {item.sexo || 'N/A'} | Edad: {edad}</Text>
          <Text style={styles.cardText}>Fecha Nac.: {nacimiento}</Text>
          <Text style={styles.cardText} numberOfLines={1}>Ubicación: {textoUbicacion}</Text>
          <Text style={styles.cardText} numberOfLines={1}>Email: {item.email || item.correo || "No registrado"}</Text>
        </View>
        <View style={styles.imageContainer}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={35} color="#666" />
          )}
        </View>
      </View>
    );
  };

  // 1. PANTALLA TECLADO CAJERO
  if (!isAuthorized) {
    return (
      <View style={styles.container}>
        {/* Encabezado Superior */}
        <View style={styles.topHeader}>
          <Image source={require('../../assets/logo.png')} style={styles.headerLogo} />
          <View style={styles.appNameContainer}>
            <Image source={require('../../assets/nombreapp.png')} style={styles.headerAppName} />
          </View>
        </View>

        {/* Franja Negra De Lado a Lado con Título Amarillo */}
        <View style={styles.blackBanner}>
          <Text style={styles.blackBannerText}>CLAVE DE ADMINISTRADOR</Text>
        </View>

        {/* Teclado */}
        <View style={styles.centerContainer}>
          <View style={styles.atmBox}>
            <View style={styles.atmDisplay}>
              <Text style={styles.atmDisplayText}>
                {pin ? '•'.repeat(pin.length) : 'INGRESE CLAVE'}
              </Text>
            </View>

            <View style={styles.keypadGrid}>
              {/* Fila 1 */}
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('1')}>
                <Text style={styles.keyNum}>1</Text>
                <Text style={styles.keySub}>QZ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('2')}>
                <Text style={styles.keyNum}>2</Text>
                <Text style={styles.keySub}>ABC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('3')}>
                <Text style={styles.keyNum}>3</Text>
                <Text style={styles.keySub}>DEF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnKey, styles.bgCancel]} onPress={handleCancelPin}>
                <Text style={styles.actionBtnText}>CANCEL</Text>
              </TouchableOpacity>

              {/* Fila 2 */}
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('4')}>
                <Text style={styles.keyNum}>4</Text>
                <Text style={styles.keySub}>GHI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('5')}>
                <Text style={styles.keyNum}>5</Text>
                <Text style={styles.keySub}>JKL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('6')}>
                <Text style={styles.keyNum}>6</Text>
                <Text style={styles.keySub}>MNO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnKey, styles.bgClear]} onPress={handleClearPin}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>CLEAR</Text>
              </TouchableOpacity>

              {/* Fila 3 */}
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('7')}>
                <Text style={styles.keyNum}>7</Text>
                <Text style={styles.keySub}>PRS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('8')}>
                <Text style={styles.keyNum}>8</Text>
                <Text style={styles.keySub}>TUV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('9')}>
                <Text style={styles.keyNum}>9</Text>
                <Text style={styles.keySub}>WXY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnKey, styles.bgEnter]} onPress={handleEnterPin}>
                <Text style={styles.actionBtnText}>ENTER</Text>
              </TouchableOpacity>

              {/* Fila 4 */}
              <View style={styles.blankKey} />
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('0')}>
                <Text style={styles.keyNum}>0</Text>
              </TouchableOpacity>
              <View style={styles.blankKey} />
              <View style={styles.blankKey} />
            </View>
          </View>
        </View>

        {/* Línea Dorada y Navegación Inferior */}
        <View style={styles.lineaDorada} />
        
        <View style={styles.footerDual}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerBtn} onPress={handleLogoutFlow}>
            <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. PANEL DE ADMINISTRACIÓN
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Image source={require('../../assets/logo.png')} style={styles.headerLogo} />
        <View style={styles.appNameContainer}>
          <Image source={require('../../assets/nombreapp.png')} style={styles.headerAppName} />
        </View>
      </View>

      <View style={styles.blackBanner}>
        <Text style={styles.blackBannerText}>PANEL DE ADMINISTRACIÓN</Text>
      </View>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id || item.uid || item._id || item.email}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listPadding}
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Cambiar Clave de Admin</Text>
            
            <TextInput 
              style={styles.modalInput} 
              placeholder="Contraseña Actual"
              placeholderTextColor="#888"
              keyboardType="numeric" 
              secureTextEntry 
              value={currentPassInput} 
              onChangeText={setCurrentPassInput} 
              maxLength={10}
            />

            <TextInput 
              style={styles.modalInput} 
              placeholder="Nueva Contraseña"
              placeholderTextColor="#888"
              keyboardType="numeric" 
              secureTextEntry 
              value={newPassword} 
              onChangeText={setNewPassword} 
              maxLength={10}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#555' }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#fff' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ff8c00' }]} onPress={handleSavePassword}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.lineaDorada} />
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('HomeScreen')}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="key-outline" size={40} color="#ff8c00" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn} onPress={handleLogoutFlow}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001a33' },
  center: { justifyContent: 'center', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  
  topHeader: { height: 75, backgroundColor: '#001a33', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, width: '100%', paddingTop: Platform.OS === 'ios' ? 10 : 0 },
  headerLogo: { width: 65, height: 65, resizeMode: 'contain' },
  appNameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginRight: 65 },
  headerAppName: { height: 35, width: 180, resizeMode: 'contain' },
  
  blackBanner: { backgroundColor: '#000', paddingVertical: 12, alignItems: 'center', width: '100%' },
  blackBannerText: { color: '#ffcc00', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  
  listPadding: { paddingBottom: 100, paddingTop: 8 },
  card: { backgroundColor: '#0c2340', borderRadius: 10, padding: 12, marginVertical: 6, marginHorizontal: 16, borderWidth: 1, borderColor: '#1a4a6e', flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardName: { color: '#00fa9a', fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  cardText: { color: '#fff', fontSize: 12, marginBottom: 2 },
  imageContainer: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#16355a', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#ff8c00', marginLeft: 10 },
  avatarImage: { width: '100%', height: '100%' },
  
  lineaDorada: { position: 'absolute', bottom: 80, left: 0, right: 0, height: 2, backgroundColor: '#ffcc00' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#001a33', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 15 : 0 },
  footerDual: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#001a33', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40, paddingBottom: Platform.OS === 'ios' ? 15 : 0 },
  footerBtn: { padding: 5 },
  navIcon: { width: 45, height: 45, resizeMode: 'contain', tintColor: '#00BFFF' },
  
  // ATM KEYPAD
  atmBox: { backgroundColor: '#3a3f44', borderRadius: 15, padding: 20, width: 340, alignItems: 'center', borderWidth: 2, borderColor: '#555' },
  atmDisplay: { backgroundColor: '#8fa392', borderRadius: 8, borderWidth: 2, borderColor: '#555', width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  atmDisplayText: { fontSize: 20, fontWeight: 'bold', letterSpacing: 3, color: '#111' },
  
  keypadGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', backgroundColor: '#b0b5b9', padding: 10, borderRadius: 10 },
  keyBtn: { width: '22%', height: 50, backgroundColor: '#e0e4e8', borderRadius: 6, borderWidth: 1, borderColor: '#666', justifyContent: 'center', alignItems: 'center', marginBottom: 8, flexDirection: 'row' },
  keyNum: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  keySub: { fontSize: 8, fontWeight: 'bold', color: '#555', marginLeft: 2 },
  
  actionBtnKey: { width: '22%', height: 50, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionBtnText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  bgCancel: { backgroundColor: '#d32f2f', borderWidth: 1, borderColor: '#9a0007' },
  bgClear: { backgroundColor: '#fbc02d', borderWidth: 1, borderColor: '#c49000' },
  bgEnter: { backgroundColor: '#2e7d32', borderWidth: 1, borderColor: '#005005' },
  blankKey: { width: '22%', height: 50, backgroundColor: '#c4c8cc', borderRadius: 6, marginBottom: 8 },

  // MODAL
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalView: { margin: 20, backgroundColor: '#0c2340', borderRadius: 15, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#1a4a6e' },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  modalInput: { width: '100%', backgroundColor: '#fff', padding: 10, borderRadius: 8, fontSize: 16, color: '#000', marginBottom: 12 },
  modalBtnRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }
});