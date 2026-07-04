// src/screens/FacialLoginScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Image, Dimensions, BackHandler 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
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
  const [puntos, setPuntos] = useState('');
  
  const cameraRef = useRef(null);
  const soundRef = useRef(new Audio.Sound());

  // Función para reproducir tu archivo local masculino
  const reproducirVoz = async () => {
    try {
      await soundRef.current.unloadAsync();
      await soundRef.current.loadAsync(require('../../assets/vozmasculina.mp3'));
      await soundRef.current.playAsync();
    } catch (error) {
      console.log("Error al reproducir voz local:", error);
    }
  };

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
      } catch (err) { console.log(err); }
    })();

    // Saludo inicial con voz masculina local
    reproducirVoz();

    return () => { soundRef.current.unloadAsync(); };
  }, []);

  // Animación de puntos suspensivos
  useEffect(() => {
    let intervalo;
    if (loading) {
      intervalo = setInterval(() => {
        setPuntos((prev) => prev === '...' ? '' : prev + '.');
      }, 400);
    } else { setPuntos(''); }
    return () => clearInterval(intervalo);
  }, [loading]);

  const validarRostro = async () => {
    if (countdown > 0 || loading) return;
    setStatusVerificacion('IDLE');
    setMensajeFeedback('');

    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        Alert.alert("Error", "Permiso de cámara denegado");
        return;
      }
    }

    // Cuenta regresiva visual (sin audio para no pisar el archivo)
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(0); 

    if (cameraRef.current) {
      setLoading(true);
      reproducirVoz(); // Reproduce la voz al iniciar validación

      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3 });
        const fotoProcesada = await ImageManipulator.manipulateAsync(
          photo.uri, [{ resize: { width: 450 } }], { compress: 0.15, format: ImageManipulator.SaveFormat.JPEG }
        );

        const formData = new FormData();
        const filename = fotoProcesada.uri.split('/').pop() || 'face.jpg';
        formData.append('imageFile', { uri: fotoProcesada.uri, name: filename, type: 'image/jpeg' });

        const endpoint = tipoOperacion === 'REGISTER' ? '/api/users/register' : '/api/users/login';
        const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/$/, '') : 'https://smartcheck-proyecto-final.onrender.com';
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.status === 'success') {
          setStatusVerificacion('SUCCESS');
          if (tipoOperacion !== 'REGISTER') {
            await storage.saveUser(data.usuario || data);
            login(data.usuario || data);
            setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }), 1800);
          }
        } else {
          throw new Error(data.mensaje || "Error en autenticación");
        }
      } catch (error) {
        setStatusVerificacion('ERROR');
        setMensajeFeedback(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

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
        {loading ? (
          <Text style={styles.waitingText}>Verificando su rostro, espere por favor{puntos}</Text>
        ) : (
          <Text style={styles.instructions}>Encuadrá tu rostro en el círculo y presioná el botón de Biometría Facial</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()} disabled={loading}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={validarRostro} disabled={loading}>
          <Image source={require('../../assets/verificar.png')} style={styles.verifyIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => BackHandler.exitApp()} disabled={loading}>
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
  cameraContainer: { width: width * 0.85, height: width * 0.85, borderRadius: (width * 0.85) / 2, overflow: 'hidden', borderWidth: 4, borderColor: '#00ffcc', backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayCircle: { width: '96%', height: '96%', borderRadius: 999, borderWidth: 3, borderColor: '#00ffcc', borderStyle: 'dashed' },
  countdownContainer: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#00ffcc', fontSize: 72, fontWeight: 'bold' },
  feedbackContainer: { width: '85%', minHeight: 65, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  instructions: { color: '#aaa', fontSize: 15, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  captureButton: { width: 200, height: 200 },
  verifyIcon: { width: 200, height: 200, resizeMode: 'contain' },
  navButton: { width: 50, height: 50 },
  navIcon: { width: 42, height: 42, tintColor: '#00ffcc' }
});