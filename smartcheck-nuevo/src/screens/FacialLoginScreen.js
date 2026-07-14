import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Ellipse } from 'react-native-svg';
import api from '../config/api';
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  
  const { tipoOperacion, datosRegistro } = route.params || { tipoOperacion: 'LOGIN', datosRegistro: {} };
  
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const cameraRef = useRef(null);
  const soundRef = useRef(new Audio.Sound());

  const audioFiles = {
    bienvenida: require('../../assets/vozmasculina.mp3'),
    verificando: require('../../assets/vozverificando.mp3'),
    reconocida: require('../../assets/vozreconocida.mp3'),
    mascYaRegistrado: require('../../assets/mascyaregistrado.mp3'),
    femYaRegistrada: require('../../assets/femyaregistrada.mp3'),
    despedida: require('../../assets/despedida.mp3'),
    error: require('../../assets/vozerror.mp3')
  };

  const reproducirVoz = async (tipo, genero = 'masculino') => {
    try {
      await soundRef.current.unloadAsync();
      let archivo;
      if (tipo === 'yaregistrado') {
        archivo = genero === 'mujer' ? audioFiles.femYaRegistrada : audioFiles.mascYaRegistrado;
      } else {
        archivo = audioFiles[tipo];
      }
      if (archivo) {
        await soundRef.current.loadAsync(archivo);
        await soundRef.current.playAsync();
      }
    } catch (e) { console.log("Error de audio:", e); }
  };

  useEffect(() => {
    reproducirVoz('bienvenida');
    return () => { soundRef.current.unloadAsync(); };
  }, []);

  // Modificado: Ahora redirige a Goodbye para despedida formal
  const handleSalir = async () => {
    await reproducirVoz('despedida');
    navigation.navigate('Goodbye');
  };

  const validarRostro = async () => {
    if (countdown > 0 || loading) return;
    if (!permission?.granted) { 
      const s = await requestPermission(); 
      if (!s.granted) return; 
    }
    
    for (let i = 3; i > 0; i--) { 
      setCountdown(i); 
      await new Promise(r => setTimeout(r, 1000)); 
    }
    setCountdown(0); 
    
    if (cameraRef.current) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.2, skipProcessing: true });
        reproducirVoz('verificando');
        const p = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 300 } }], { compress: 0.15, format: 'jpeg' });
        const fd = new FormData();
        fd.append('imageFile', { uri: p.uri, name: 'face.jpg', type: 'image/jpeg' });
        
        if (tipoOperacion === 'REGISTER' && datosRegistro) {
            Object.keys(datosRegistro).forEach(k => datosRegistro[k] !== null && fd.append(k, String(datosRegistro[k])));
        }
        
        const endpoint = tipoOperacion === 'REGISTER' ? '/api/users/register' : '/api/users/biometria';
        const response = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        if (response.data.status === 'success') {
          reproducirVoz('reconocida');
          if (tipoOperacion === 'REGISTER') {
            Alert.alert("Éxito", "Usuario registrado.");
            navigation.navigate('Login');
          } else {
            await storage.saveUser(response.data.usuario);
            if (typeof login === 'function') login(response.data.usuario);
          }
        } else {
            const genero = response.data.genero || 'masculino'; 
            if (response.data.codigo === 'YA_REGISTRADO') {
              reproducirVoz('yaregistrado', genero);
            } else {
              reproducirVoz('error');
            }
            Alert.alert("Error", response.data.mensaje || "Error en validación");
        }
      } catch (e) { 
        reproducirVoz('error'); 
        Alert.alert("Error", "No se pudo procesar la biometría.");
      } finally { setLoading(false); }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>

      <Text style={styles.titleText}>RECONOCIMIENTO FACIAL</Text>

      <View style={styles.goldenFrame}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <Svg style={StyleSheet.absoluteFill}>
            <Ellipse cx="50%" cy="50%" rx="130" ry="180" stroke="#00E5FF" strokeWidth="5" fill="transparent" />
          </Svg>
          {countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Welcome')}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.captureButton} onPress={validarRostro} disabled={loading}>
          <Image source={require('../../assets/verificar.png')} style={styles.verifyIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handleSalir}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  appName: { width: 150, height: 40, resizeMode: 'contain' },
  titleText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  goldenFrame: { width: '90%', aspectRatio: 3/4, borderColor: '#FFD700', borderWidth: 2, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  countdownContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#00E5FF', fontSize: 72, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingBottom: 20 },
  captureButton: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center' },
  verifyIcon: { width: 150, height: 150, resizeMode: 'contain' },
  navButton: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  navIcon: { width: 50, height: 50, tintColor: '#00E5FF' }
});