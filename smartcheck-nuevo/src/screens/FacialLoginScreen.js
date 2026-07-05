import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, BackHandler } from 'react-native';
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

  const reproducirVoz = async (tipo, onFinish = null) => {
    try {
      await soundRef.current.unloadAsync();
      const audios = {
        bienvenida: require('../../assets/vozmasculina.mp3'),
        verificando: require('../../assets/vozverificando.mp3'),
        error: require('../../assets/vozerror.mp3'),
        reconocida: require('../../assets/vozreconocida.mp3')
      };
      if (audios[tipo]) {
        await soundRef.current.loadAsync(audios[tipo]);
        if (onFinish) soundRef.current.setOnPlaybackStatusUpdate((s) => { if (s.didJustFinish) onFinish(); });
        await soundRef.current.playAsync();
      }
    } catch (e) { console.log("Audio error:", e); }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          let rev = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (rev.length > 0) setGeoData({ localidad: rev[0].city || 'N/A', provincia: rev[0].region || 'N/A' });
        }
      } catch (e) { console.log(e); }
    })();
    reproducirVoz('bienvenida');
    return () => { soundRef.current.unloadAsync(); };
  }, []);

  const validarRostro = async () => {
    if (countdown > 0 || loading) return;
    setStatusVerificacion('IDLE');
    if (!permission?.granted) { const s = await requestPermission(); if (!s.granted) return; }
    for (let i = 3; i > 0; i--) { setCountdown(i); await new Promise(r => setTimeout(r, 1000)); }
    setCountdown(0); 
    if (cameraRef.current) {
      setLoading(true);
      reproducirVoz('verificando');
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3 });
        const p = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 450 } }], { compress: 0.15, format: 'jpeg' });
        const fd = new FormData();
        if (tipoOperacion === 'REGISTER') Object.entries(datosRegistro || {}).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append('imageFile', { uri: p.uri, name: 'face.jpg', type: 'image/jpeg' });
        
        const res = await fetch(`${(api.defaults.baseURL || 'https://smartcheck-proyecto-final.onrender.com').replace(/\/$/, '')}${tipoOperacion === 'REGISTER' ? '/api/users/register' : '/api/users/biometria'}`, { method: 'POST', body: fd });
        const data = await res.json();

        if (data.status === 'success') {
          setStatusVerificacion('SUCCESS');
          const usuarioConUbicacion = { ...data.usuario || data, localidad: geoData.localidad, provincia: geoData.provincia };
          if (tipoOperacion === 'REGISTER') {
            reproducirVoz('reconocida', () => navigation.navigate('Login'));
          } else {
            await storage.saveUser(usuarioConUbicacion);
            login(usuarioConUbicacion);
            reproducirVoz('reconocida', () => navigation.reset({ index: 0, routes: [{ name: 'Home', params: usuarioConUbicacion }] }));
          }
        } else throw new Error(data.mensaje || "Error");
      } catch (e) { setStatusVerificacion('ERROR'); setMensajeFeedback(e.message); reproducirVoz('error'); } finally { setLoading(false); }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>
      
      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>{tipoOperacion === 'REGISTER' ? 'REGISTRO FACIAL' : 'AUTENTICACIÓN FACIAL'}</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        {statusVerificacion === 'SUCCESS' ? (
          <View style={[styles.camera, styles.overlaySuccessContainer]}>
            <View style={styles.faceOvalSuccess}>
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
        {loading ? <Text style={styles.waitingText}>Verificando...</Text> : (
          <>
            {statusVerificacion === 'SUCCESS' && <Text style={[styles.feedbackText, { color: '#00ffcc' }]}>¡Rostro reconocido!</Text>}
            {statusVerificacion === 'ERROR' && <Text style={[styles.feedbackText, { color: '#ff3333' }]}>{mensajeFeedback}</Text>}
            {statusVerificacion === 'IDLE' && <Text style={styles.instructions}>Encuadrá tu rostro y presioná el botón.</Text>}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}><Image source={require('../../assets/volver.png')} style={styles.navIcon} /></TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={validarRostro} disabled={loading}><Image source={require('../../assets/verificar.png')} style={styles.verifyIcon} /></TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => BackHandler.exitApp()}><Image source={require('../../assets/salir.png')} style={styles.navIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', alignItems: 'center', justifyContent: 'space-between', paddingVertical: height * 0.04 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  appName: { width: 120, height: 40, resizeMode: 'contain' },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 10, width: '100%' },
  titleText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  cameraContainer: { width: width * 0.85, height: width * 0.85, borderRadius: (width * 0.85) / 2, overflow: 'hidden', borderWidth: 4, borderColor: '#00ffcc', backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlayCircle: { width: '96%', height: '96%', borderRadius: 999, borderWidth: 3, borderColor: '#00ffcc', borderStyle: 'dashed' },
  overlaySuccessContainer: { backgroundColor: '#002a54', justifyContent: 'center', alignItems: 'center' },
  faceOvalSuccess: { width: '96%', height: '96%', borderRadius: 999, borderWidth: 3, borderColor: '#00ffcc', backgroundColor: 'rgba(0, 255, 204, 0.25)', justifyContent: 'center', alignItems: 'center' },
  countdownContainer: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#00ffcc', fontSize: 72, fontWeight: 'bold' },
  feedbackContainer: { width: '85%', height: 70, justifyContent: 'center', alignItems: 'center' },
  feedbackText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  waitingText: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold' },
  instructions: { color: '#aaa', fontSize: 15, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  captureButton: { width: 200, height: 2000, justifyContent: 'center', alignItems: 'center' },
  verifyIcon: { width: 200, height: 200, resizeMode: 'contain' },
  navButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  navIcon: { width: 42, height: 42, resizeMode: 'contain', tintColor: '#00ffcc' }
});