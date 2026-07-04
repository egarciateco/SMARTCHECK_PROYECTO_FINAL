// src/screens/FacialLoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, BackHandler 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api'; 
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();

  const { tipoOperacion, datosRegistro, geoData: initialGeoData } = route.params || { 
    tipoOperacion: 'LOGIN', 
    datosRegistro: {}, 
    geoData: { localidad: 'N/A', provincia: 'N/A' } 
  };

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [statusVerificacion, setStatusVerificacion] = useState('IDLE'); 
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [geoData, setGeoData] = useState(initialGeoData);
  
  // Estado para almacenar el identificador de la voz masculina
  const [idVozMasculina, setIdVozMasculina] = useState(null);

  const cameraRef = useRef(null);

  // Efecto para geolocalización
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          let reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (reverseGeocode.length > 0) {
            const result = reverseGeocode[0];
            setGeoData({
              localidad: result.city || result.subregion || 'N/A',
              provincia: result.region || 'N/A'
            });
          }
        }
      } catch (err) {
        console.log("No se pudo obtener la geo-localización:", err);
      }
    })();
  }, []);

  // Efecto para buscar y setear una voz masculina en el dispositivo
  useEffect(() => {
    async function detectarVozMasculina() {
      try {
        const voces = await Speech.getAvailableVoicesAsync();
        const vozMasc = voces.find(v => 
          v.language.startsWith('es') && 
          (v.name.toLowerCase().includes('male') || 
           v.identifier.toLowerCase().includes('male') || 
           v.name.toLowerCase().includes('masc') ||
           v.name.toLowerCase().includes('mexico-1') || 
           v.name.toLowerCase().includes('es-es-x-ana-local')) 
        );
        if (vozMasc) {
          setIdVozMasculina(vozMasc.identifier);
        }
      } catch (e) {
        console.log("Error al recuperar voces del sistema:", e);
      }
    }
    detectarVozMasculina();
  }, []);

  const hablarText = (texto) => {
    const opciones = { language: 'es-ES', pitch: 1.0, rate: 0.95 };
    if (idVozMasculina) {
      opciones.voice = idVozMasculina;
    }
    Speech.speak(texto, opciones);
  };

  const validarRostro = async () => {
    if (countdown > 0 || loading) return;
    setStatusVerificacion('IDLE');
    setMensajeFeedback('');

    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        hablarText("Permiso de cámara denegado");
        return Alert.alert("Error", "Permiso de cámara denegado");
      }
    }

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      hablarText(String(i));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(0); 

    if (cameraRef.current) {
      setLoading(true);
      try {
        hablarText("Verificando su rostro, espere por favor"); 

        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3 });

        const fotoProcesada = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 450 } }], 
          { compress: 0.15, format: ImageManipulator.SaveFormat.JPEG }
        );

        const formData = new FormData();
        
        if (tipoOperacion === 'REGISTER') {
          const { dia, mes, anio, nombre, apellido, email, sexo, localidad, provincia } = datosRegistro || {};
          formData.append('nombre', String(nombre || ''));
          formData.append('apellido', String(apellido || ''));
          formData.append('email', String(email || '').toLowerCase().trim());
          formData.append('sexo', String(sexo || ''));
          formData.append('dia', String(dia || ''));
          formData.append('mes', String(mes || ''));
          formData.append('anio', String(anio || ''));
          formData.append('localidad', String(localidad || ''));
          formData.append('provincia', String(provincia || ''));
        }

        const filename = fotoProcesada.uri.split('/').pop() || 'face.jpg';
        formData.append('imageFile', {
          uri: fotoProcesada.uri,
          name: filename,
          type: 'image/jpeg'
        });

        const endpoint = tipoOperacion === 'REGISTER' ? '/api/users/register' : '/api/users/login';
        const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/$/, '') : 'https://smartcheck-proyecto-final.onrender.com';
        const urlCompleta = `${baseUrl}${endpoint}`;

        console.log(`🚀 ENVIANDO CON FETCH NATIVO A: ${urlCompleta}`);

        const response = await fetch(urlCompleta, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' },
        });

        const textoRespuesta = await response.text();
        let data = {};
        try {
          data = JSON.parse(textoRespuesta);
        } catch (e) {
          if (!response.ok) {
            throw new Error("El servidor se está despertando de su inactividad. Por favor, reintenta en 15 segundos.");
          }
        }

        if (data && data.status === 'success') {
          if (tipoOperacion === 'REGISTER') {
              setStatusVerificacion('SUCCESS');
              setMensajeFeedback('¡Tu foto salió perfecta!');
              hablarText("Registro completado con éxito");
              
              setTimeout(() => {
                Alert.alert("Éxito", "Registrado correctamente", [{ text: "OK", onPress: () => navigation.navigate('Login') }]);
              }, 1500);
          } else {
              const sesionUsuario = data.usuario || data; 
              
              const usuarioConUbicacion = {
                ...sesionUsuario,
                dia: sesionUsuario.dia || sesionUsuario.dia_nacimiento || '',
                mes: sesionUsuario.mes || sesionUsuario.mes_nacimiento || '',
                anio: sesionUsuario.anio || sesionUsuario.anio_nacimiento || '',
                edad: sesionUsuario.edad || '',
                localidad: geoData?.localidad || 'N/A',
                provincia: geoData?.provincia || 'N/A'
              };
              
              setStatusVerificacion('SUCCESS');
              setMensajeFeedback('¡Tu foto salió perfecta!');
              hablarText(`Bienvenido de vuelta, ${usuarioConUbicacion.nombre || 'Usuario'}`);

              await storage.saveUser(usuarioConUbicacion);
              login(usuarioConUbicacion);
              
              setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'Home', params: usuarioConUbicacion }] });
              }, 1800);
          }
        } else {
          throw new Error(data.mensaje || `Error en la autenticación con estatus ${response.status}`);
        }

      } catch (error) {
        console.error("❌ ERROR DETECTADO EN FLOW:", error);
        setStatusVerificacion('ERROR');
        setMensajeFeedback(error.message);
        hablarText(`Atención: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#00ffcc" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>

      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>
          {tipoOperacion === 'REGISTER' ? 'REGISTRO FACIAL' : 'AUTENTICACIÓN FACIAL'}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        {statusVerificacion === 'SUCCESS' ? (
          <View style={[styles.camera, styles.overlaySuccessContainer]}>
            <View style={[styles.faceOvalSuccess]}>
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
            </View>
          </View>
        ) : (
          <CameraView style={styles.camera} facing="front" ref={cameraRef}>
            <View style={styles.overlayCircle} />
            {countdown > 0 && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </CameraView>
        )}
      </View>

      <View style={styles.feedbackContainer}>
        {loading ? (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#00ffcc" style={{ marginBottom: 8 }} />
            <Text style={styles.waitingText}>Verificando su rostro, espere por favor.</Text>
          </View>
        ) : (
          <>
            {statusVerificacion === 'SUCCESS' && (
              <Text style={[styles.feedbackText, { color: '#00ffcc' }]}>{mensajeFeedback}</Text>
            )}
            {statusVerificacion === 'ERROR' && (
              <Text style={[styles.feedbackText, { color: '#ff3333' }]}>{mensajeFeedback}</Text>
            )}
            {statusVerificacion === 'IDLE' && (
              /* Modificado: Texto exacto y estilo adaptado */
              <Text style={styles.instructions}>Encuadrá tu rostro en el círculo y presioná el botón de Biometría Facial</Text>
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.captureButton, (loading || countdown > 0 || statusVerificacion === 'SUCCESS') && styles.disabledButton]} 
          onPress={validarRostro}
          disabled={loading || countdown > 0 || statusVerificacion === 'SUCCESS'}
        >
          <Image source={require('../../assets/verificar.png')} style={styles.verifyIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => BackHandler.exitApp()}
          disabled={loading}
        >
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', alignItems: 'center', justifyContent: 'space-between', paddingVertical: height * 0.04 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', paddingHorizontal: 20 },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  appName: { width: 120, height: 40, resizeMode: 'contain' },
  
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 10, width: '100%', marginVertical: 5 },
  titleText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.8 },
  
  cameraContainer: { width: width * 0.85, height: width * 0.85, borderRadius: (width * 0.85) / 2, overflow: 'hidden', borderWidth: 4, borderColor: '#00ffcc', backgroundColor: '#000', elevation: 5 },
  camera: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  overlayCircle: { width: '96%', height: '96%', borderRadius: 999, borderWidth: 3, borderColor: '#00ffcc', borderStyle: 'dashed' },
  overlaySuccessContainer: { backgroundColor: '#002a54', justifyContent: 'center', alignItems: 'center' }, 
  faceOvalSuccess: { width: '96%', height: '96%', borderRadius: 999, borderWidth: 3, borderColor: '#00ffcc', backgroundColor: 'rgba(0, 255, 204, 0.25)', justifyContent: 'center', alignItems: 'center' },
  
  countdownContainer: { 
    position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' 
  },
  countdownText: { color: '#00ffcc', fontSize: 72, fontWeight: 'bold' },
  
  feedbackContainer: { width: '85%', minHeight: 65, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, marginVertical: 5 },
  feedbackText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  waitingText: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  
  // Modificado: El tamaño de la fuente subió a 15 y el interlineado a 20 para mejorar lectura
  instructions: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 20 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 35, paddingBottom: 10 },
  captureButton: { width: 130, height: 130, justifyContent: 'center', alignItems: 'center' },
  verifyIcon: { width: 130, height: 130, resizeMode: 'contain' },
  navButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { opacity: 0.4 },
  navIcon: { width: 42, height: 42, resizeMode: 'contain', tintColor: '#00ffcc' }
});