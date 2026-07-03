// src/screens/FacialLoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech'; // Importación requerida
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();

  const { tipoOperacion, datosRegistro } = route.params || { tipoOperacion: 'LOGIN' };

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [statusVerificacion, setStatusVerificacion] = useState('IDLE'); // 'IDLE' | 'SUCCESS' | 'ERROR'
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [geoData, setGeoData] = useState(null);

  const cameraRef = useRef(null);

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
        console.log("No se pudo obtener la geo-localización pasiva:", err);
      }
    })();
  }, []);

  const hablarText = (texto) => {
    Speech.speak(texto, { language: 'es-ES', pitch: 1.0, rate: 0.95 });
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

    // 1️⃣ Conteo inicial interactivo por voz
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      hablarText(String(i));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(0); 

    if (cameraRef.current) {
      setLoading(true);
      try {
        // 2️⃣ Feedback de procesamiento local de imagen
        hablarText("Procesando imagen, por favor espere"); 

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
        
        // 3️⃣ Mensaje preventivo para servidores en reposo (Render)
        hablarText("Conectando con el servidor");

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
              
              // 4️⃣ Éxito en flujo de registro
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
              
              // 5️⃣ Éxito en flujo de login
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
        
        // 6️⃣ Feedback hablado ante excepciones o caídas del servicio
        hablarText(`Atención: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#00ffcc" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos tu permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.buttonPermission} onPress={requestPermission}>
          <Text style={styles.buttonText}>Otorgar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>

      <Text style={styles.title}>
        {tipoOperacion === 'REGISTER' ? 'REGISTRO FACIAL' : 'LOGIN FACIAL'}
      </Text>

      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <View style={styles.overlayCircle} />
          {countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.feedbackContainer}>
        {loading && <ActivityIndicator size="small" color="#00ffcc" style={{ marginBottom: 5 }} />}
        
        {statusVerificacion === 'SUCCESS' && (
          <Text style={[styles.feedbackText, { color: '#00ffcc' }]}>{mensajeFeedback}</Text>
        )}
        {statusVerificacion === 'ERROR' && (
          <Text style={[styles.feedbackText, { color: '#ff3333' }]}>{mensajeFeedback}</Text>
        )}
        {statusVerificacion === 'IDLE' && !loading && (
          <Text style={styles.instructions}>Encuadrá tu rostro en el círculo y presioná el botón azul</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.captureButton, (loading || countdown > 0) && styles.disabledButton]} 
          onPress={validarRostro}
          disabled={loading || countdown > 0}
        >
          <Image source={require('../../assets/verificar.png')} style={styles.btnIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Image source={require('../../assets/volver.png')} style={styles.btnIcon} />
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
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', trackingSpacing: 1, marginVertical: 5 },
  cameraContainer: { width: width * 0.82, height: width * 0.82, borderRadius: (width * 0.82) / 2, overflow: 'hidden', borderWidth: 4, borderColor: '#00ffcc', backgroundColor: '#000', elevation: 5 },
  camera: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayCircle: { width: '90%', height: '90%', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(0, 255, 204, 0.4)', borderStyle: 'dashed' },
  countdownContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#00ffcc', fontSize: 72, fontWeight: 'bold' },
  feedbackContainer: { width: '85%', minHeight: 65, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, marginVertical: 10 },
  feedbackText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  instructions: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, width: '100%', paddingBottom: 10 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#002a54', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00ffcc', elevation: 3 },
  backButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#001b3a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#003b75' },
  disabledButton: { opacity: 0.5, borderColor: '#666' },
  btnIcon: { width: 35, height: 35, resizeMode: 'contain' },
  message: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  buttonPermission: { backgroundColor: '#00ffcc', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  buttonText: { color: '#001f3f', fontWeight: 'bold', fontSize: 15 }
});