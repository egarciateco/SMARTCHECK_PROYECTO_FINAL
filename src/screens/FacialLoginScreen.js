import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ActivityIndicator, InteractionManager } from 'react-native';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Ellipse } from 'react-native-svg';
import api from '../config/api';
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

// Importamos el modelo pero manejaremos su carga con cuidado
import { model, imageToTensor } from '../services/tensorflowService';

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  
  const { tipoOperacion, datosRegistro } = route.params || { tipoOperacion: 'LOGIN', datosRegistro: {} };
  
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [ovalColor, setOvalColor] = useState('#FFD700'); 
  const [countdown, setCountdown] = useState(null); 
  
  const cameraRef = useRef(null);
  const soundRef = useRef(new Audio.Sound());

  // Función de captura optimizada
  const handleCapture = useCallback(async () => {
    if (isProcessing) return;
    
    console.log("DEBUG: Iniciando captura...");
    setIsProcessing(true);
    
    try {
        await soundRef.current.unloadAsync();
        await soundRef.current.loadAsync(require('../../assets/vozverificando.mp3'));
        await soundRef.current.playAsync();
        
        if (!cameraRef.current) throw new Error("La cámara no está lista");

        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
        const p = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 600 } }], { compress: 0.7, format: 'jpeg' });
        
        const fd = new FormData();
        fd.append('imageFile', { uri: p.uri, name: 'face.jpg', type: 'image/jpeg' });
        
        const uidParaEnviar = datosRegistro.uid || datosRegistro.email;
        if (uidParaEnviar) fd.append('uid', String(uidParaEnviar));

        Object.keys(datosRegistro).forEach(k => {
            if (k !== 'uid' && datosRegistro[k] !== null) fd.append(k, String(datosRegistro[k]));
        });
        
        const endpoint = tipoOperacion === 'REGISTER' ? '/api/users/register' : '/api/users/biometria';
        console.log("DEBUG: Enviando al endpoint:", endpoint);
        
        const response = await api.post(endpoint, fd);
        
        if (response.data.status === 'success') {
          await soundRef.current.unloadAsync();
          await soundRef.current.loadAsync(require('../../assets/vozreconocida.mp3'));
          await soundRef.current.playAsync();
          
          if (tipoOperacion === 'REGISTER') {
            navigation.navigate('Login');
          } else { 
            await storage.saveUser(response.data.usuario); 
            if (login) login(response.data.usuario); 
          }
        } else {
            throw new Error(response.data.message || "Error en la validación");
        }
    } catch (e) { 
        console.error("Error en captura:", e);
        await soundRef.current.unloadAsync();
        await soundRef.current.loadAsync(require('../../assets/vozerror.mp3'));
        await soundRef.current.playAsync();
        Alert.alert("Error", "No se pudo verificar. Intenta de nuevo."); 
    } finally {
        setIsProcessing(false); 
        console.log("DEBUG: Captura finalizada, botón liberado.");
    }
  }, [isProcessing, tipoOperacion, datosRegistro, navigation, login]);

  // Carga inicial usando InteractionManager para no bloquear la UI
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
        if (model) {
            setModelLoaded(true);
        }
    });

    return () => { 
        task.cancel();
        soundRef.current.unloadAsync(); 
    };
  }, []);

  // Contador regresivo
  const startCountdown = () => {
    if (countdown !== null) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdown(null);
          handleCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Loop de detección
  useEffect(() => {
    if (!modelLoaded || isProcessing || countdown !== null) return;
    
    let isMounted = true;
    const runDetection = async () => {
      if (!isMounted || !cameraRef.current || !model || isProcessing) return;
      
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, skipProcessing: true });
        if (photo) {
          const tensor = await imageToTensor(photo);
          const predictions = await model.estimateFaces(tensor, false);
          
          if (predictions.length > 0) {
            setOvalColor('#00FF00');
            startCountdown();
          } else {
            setOvalColor('#FFD700');
          }
          tensor.dispose();
        }
      } catch (e) { console.log("Detección fallida"); }
      
      if (isMounted) setTimeout(runDetection, 1500); 
    };
    
    runDetection();
    return () => { isMounted = false; };
  }, [modelLoaded, isProcessing, countdown]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
      </View>
      <View style={styles.blackBar}>
        <Text style={styles.titleText}>{isProcessing ? "VERIFICANDO..." : "RECONOCIMIENTO FACIAL"}</Text>
      </View>
      <View style={styles.cameraContainer}>
        <View style={styles.goldenFrame}>
          {!modelLoaded ? (
             <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00E5FF" />
                <Text style={styles.loadingText}>Preparando cámara...</Text>
             </View>
          ) : (
            <CameraView style={styles.camera} facing="front" ref={cameraRef}>
              <Svg style={StyleSheet.absoluteFill}>
                <Ellipse cx="50%" cy="50%" rx="130" ry="180" stroke={ovalColor} strokeWidth="5" fill="transparent" />
              </Svg>
            </CameraView>
          )}
        </View>
      </View>
      <View style={styles.footer}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
         </TouchableOpacity>
         
         <TouchableOpacity onPress={handleCapture} disabled={isProcessing}>
             {countdown !== null ? (
               <Text style={styles.countdownText}>{countdown}</Text>
             ) : (
               <Image source={require('../../assets/verificara.png')} style={styles.verifyIcon} />
             )}
         </TouchableOpacity>
         
         <TouchableOpacity onPress={() => navigation.navigate('Goodbye')}>
            <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  logo: { width: 90, height: 90, resizeMode: 'contain' },
  appName: { width: 250, height: 70, resizeMode: 'contain', marginLeft: 15 },
  blackBar: { backgroundColor: '#000', width: '100%', height: 35, justifyContent: 'center', alignItems: 'center' },
  titleText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  cameraContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  goldenFrame: { width: '85%', aspectRatio: 3/4, borderColor: '#FFD700', borderWidth: 2, borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  loadingContainer: { alignItems: 'center' },
  loadingText: { color: '#00E5FF', marginTop: 10 },
  footer: { height: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  verifyIcon: { width: 80, height: 80, resizeMode: 'contain' },
  navIcon: { width: 50, height: 50, tintColor: '#00E5FF' },
  countdownText: { fontSize: 50, color: '#00FF00', fontWeight: 'bold' }
});