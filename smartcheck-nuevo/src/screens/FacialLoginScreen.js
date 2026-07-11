import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../config/api'; 
import storage from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();
  
  const { tipoOperacion, datosRegistro } = route.params || { 
    tipoOperacion: 'LOGIN', 
    datosRegistro: {} 
  };
  
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const cameraRef = useRef(null);
  const soundRef = useRef(new Audio.Sound());

  const reproducirVoz = async (tipo) => {
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
        await soundRef.current.playAsync();
      }
    } catch (e) { console.log("Audio error:", e); }
  };

  useEffect(() => {
    reproducirVoz('bienvenida');
    return () => { soundRef.current.unloadAsync(); };
  }, []);

  const validarRostro = async () => {
    if (countdown > 0 || loading) return;
    if (!permission?.granted) { 
      const s = await requestPermission(); 
      if (!s.granted) return; 
    }
    
    // Contador de 3 segundos (UX intacta)
    for (let i = 3; i > 0; i--) { 
      setCountdown(i); 
      await new Promise(r => setTimeout(r, 1000)); 
    }
    setCountdown(0); 
    
    if (cameraRef.current) {
      setLoading(true);
      
      try {
        // Captura rápida: skipProcessing = true elimina esperas de la cámara
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.2,
          skipProcessing: true
        });

        // Feedback de audio inmediato post-captura
        reproducirVoz('verificando');

        // Manipulación eficiente: imagen ligera para subida rápida
        const p = await ImageManipulator.manipulateAsync(
            photo.uri, 
            [{ resize: { width: 300 } }], 
            { compress: 0.15, format: 'jpeg' }
        );
        
        const fd = new FormData();
        fd.append('imageFile', { uri: p.uri, name: 'face.jpg', type: 'image/jpeg' });
        
        if (datosRegistro) {
            Object.keys(datosRegistro).forEach((key) => {
                const valor = datosRegistro[key];
                if (valor !== null && valor !== undefined) {
                    fd.append(key, String(valor));
                }
            });
        }
        
        const endpoint = tipoOperacion === 'REGISTER' ? '/api/users/register' : '/api/users/biometria';
        const baseUrl = (api.defaults.baseURL || 'https://smartcheck-proyecto-final.onrender.com').replace(/\/$/, '');
        
        const res = await fetch(`${baseUrl}${endpoint}`, { 
            method: 'POST', 
            body: fd
        });
        
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
          reproducirVoz('reconocida');
          if (tipoOperacion === 'REGISTER') {
            navigation.navigate('Login');
          } else {
            await storage.saveUser(data.usuario);
            if (typeof login === 'function') login(data.usuario);
            navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
          }
        } else {
            Alert.alert("Error", data.mensaje || "Ocurrió un error en la validación");
            throw new Error(data.mensaje || "Error en validación");
        }
      } catch (e) { 
        console.error("Error en proceso:", e.message);
        reproducirVoz('error'); 
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
        <Text style={styles.titleText}>AUTENTICACIÓN FACIAL</Text>
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.captureButton} onPress={validarRostro} disabled={loading}>
          <Image source={require('../../assets/verificar.png')} style={styles.verifyIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Goodbye')}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', marginTop: 20 },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  appName: { width: 120, height: 40, resizeMode: 'contain' },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 10, width: '100%' },
  titleText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  cameraContainer: { width: width * 0.75, height: width * 0.75, borderRadius: (width * 0.75) / 2, overflow: 'hidden', borderWidth: 4, borderColor: '#00ffcc', backgroundColor: '#000' },
  camera: { flex: 1 },
  overlayCircle: { width: '100%', height: '100%', borderRadius: 999, borderWidth: 3, borderColor: '#00ffcc', borderStyle: 'dashed' },
  countdownContainer: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#00ffcc', fontSize: 72, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingBottom: 20 },
  captureButton: { width: 120, height: 120 },
  verifyIcon: { width: 120, height: 120, resizeMode: 'contain' },
  navButton: { width: 50, height: 50 },
  navIcon: { width: 42, height: 42, tintColor: '#00ffcc' }
});