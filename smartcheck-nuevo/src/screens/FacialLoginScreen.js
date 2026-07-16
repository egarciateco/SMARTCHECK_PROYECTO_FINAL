import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Alert, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as tf from '@tensorflow/tfjs'; // Importamos tf para la gestión de memoria
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Ellipse } from 'react-native-svg';
import api from '../config/api';
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import * as tfService from '../services/tensorflowService';

const { width } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  
  const { tipoOperacion, datosRegistro } = route.params || { tipoOperacion: 'LOGIN', datosRegistro: {} };
  
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [ovalColor, setOvalColor] = useState('#FFD700'); // Amarillo: Buscando rostro
  
  const cameraRef = useRef(null);
  const soundRef = useRef(new Audio.Sound());
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      let archivo = (tipo === 'yaregistrado') ? (genero === 'mujer' ? audioFiles.femYaRegistrada : audioFiles.mascYaRegistrado) : audioFiles[tipo];
      if (archivo) {
        await soundRef.current.loadAsync(archivo);
        await soundRef.current.playAsync();
      }
    } catch (e) { console.log("Error de audio:", e); }
  };

  useEffect(() => {
    const init = async () => {
      await tfService.initializeTensorFlow();
      await tfService.loadModel();
      reproducirVoz('bienvenida');
    };
    init();

    // Animación de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // BUCLE DE DETECCIÓN INTELIGENTE
    const detectionInterval = setInterval(async () => {
      if (!isProcessing && cameraRef.current && tfService.model) {
        try {
          // 1. Captura rápida (baja calidad para no ralentizar)
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.1, skipProcessing: true });
          
          // 2. Convertir a Tensor y analizar
          const tensor = tfService.imageToTensor(photo); // Usamos tu función del servicio
          const predictions = await tfService.model.predict(tensor);
          
          // 3. Lógica de detección (si hay predicciones, hay rostro)
          if (predictions && predictions.length > 0) {
            setOvalColor('#00FF00'); // Verde: Rostro detectado
            clearInterval(detectionInterval); // Detenemos el bucle
            handleCapture(); // Disparamos la captura real
          } else {
            setOvalColor('#FFD700'); // Amarillo: buscando
          }

          // 4. Limpieza de memoria (CRUCIAL para no cerrar la app)
          tensor.dispose();
          predictions.dispose(); // Si aplica al modelo
        } catch (e) {
          console.log("Detección en segundo plano:", e);
        }
      }
    }, 1500);

    return () => { 
        soundRef.current.unloadAsync(); 
        clearInterval(detectionInterval);
    };
  }, [isProcessing]);

  const handleCapture = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setLoading(true);
    reproducirVoz('verificando');
    
    try {
        // Captura de alta calidad para el servidor
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
        
        const p = await ImageManipulator.manipulateAsync(
            photo.uri, 
            [{ resize: { width: 600 } }], 
            { compress: 0.7, format: 'jpeg' }
        );
        
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
            setIsProcessing(false);
            const genero = response.data.genero || 'masculino'; 
            if (response.data.codigo === 'YA_REGISTRADO') reproducirVoz('yaregistrado', genero);
            else reproducirVoz('error');
            Alert.alert("Error", response.data.mensaje || "Error en validación");
        }
    } catch (e) { 
        setIsProcessing(false);
        console.error("Error:", e);
        Alert.alert("Error", "No se pudo procesar la biometría.");
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>

      <Text style={styles.titleText}>{isProcessing ? "VERIFICANDO..." : "RECONOCIMIENTO FACIAL"}</Text>

      <View style={styles.goldenFrame}>
        {isProcessing ? (
          <View style={styles.standbyContainer}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.standbyText}>Procesando información...</Text>
          </View>
        ) : (
          <CameraView style={styles.camera} facing="front" ref={cameraRef}>
            <Svg style={StyleSheet.absoluteFill}>
              <Ellipse cx="50%" cy="50%" rx="130" ry="180" stroke={ovalColor} strokeWidth="5" fill="transparent" />
            </Svg>
          </CameraView>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Welcome')}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <View style={styles.navButton} /> 
        <TouchableOpacity style={styles.navButton} onPress={() => { reproducirVoz('despedida'); navigation.navigate('Goodbye'); }}>
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
  footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingBottom: 20 },
  navButton: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  navIcon: { width: 50, height: 50, tintColor: '#00E5FF' },
  standbyContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#00E5FF', opacity: 0.4 },
  standbyText: { color: '#fff', marginTop: 20, fontSize: 18, fontWeight: 'bold' }
});