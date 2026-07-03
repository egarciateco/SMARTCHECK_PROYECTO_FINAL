import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, BackHandler, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Speech from 'expo-speech'; 
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api'; 
import { useAuth } from '../context/AuthContext';
import storage from '../utils/storage'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [statusVerificacion, setStatusVerificacion] = useState('IDLE'); // 'IDLE', 'SUCCESS', 'ERROR'
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const { login } = useAuth();

  const { tipoOperacion, datosRegistro, geoData } = route.params || { 
    tipoOperacion: 'LOGIN', 
    datosRegistro: {}, 
    geoData: { localidad: 'N/A', provincia: 'N/A' } 
  };

  const hablarText = (texto) => {
    Speech.speak(texto, { language: 'es-ES', pitch: 1.0, rate: 1.0 });
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
              
              // 🔍 DETECTOR DE CAMPOS BACKEND: Imprime el objeto exacto recibido en la terminal de Node
              console.log("==================================================");
              console.log("🕵️‍♂️ OBJETO RECIBIDO DESDE EL BACKEND:", JSON.stringify(sesionUsuario, null, 2));
              console.log("==================================================");

              // Intentamos mapear de forma flexible según los nombres comunes que suelen venir del backend
              const usuarioConUbicacion = {
                ...sesionUsuario,
                // Si el backend usa dia/mes/anio los toma, sino busca alternativas comunes
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
        hablarText(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
        </View>
      </View>

      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>
          {tipoOperacion === 'REGISTER' ? "REGISTRO BIOMÉTRICO" : "AUTENTICACIÓN FACIAL"}
        </Text>
      </View>
      
      <View style={styles.centerSection}>
        <View style={styles.cameraContainer}>
          {statusVerificacion === 'SUCCESS' ? (
            <View style={[styles.camera, styles.overlaySuccessContainer]}>
              <View style={[styles.faceOval, styles.faceOvalSuccess]}>
                <Ionicons name="checkmark-circle" size={80} color="#fff" />
              </View>
            </View>
          ) : (
            <CameraView style={styles.camera} facing="front" ref={cameraRef}>
              <View style={styles.overlay}>
                  {countdown > 0 && <Text style={styles.timerText}>{countdown}</Text>}
                  <View style={styles.faceOval} />
              </View>
            </CameraView>
          )}
        </View>

        <View style={styles.feedbackContainer}>
          {statusVerificacion === 'SUCCESS' && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>¡Listo!</Text>
              <Text style={styles.feedbackSub}>{mensajeFeedback}</Text>
            </View>
          )}
          {statusVerificacion === 'ERROR' && (
            <View style={styles.feedbackBox}>
              <Text style={[styles.feedbackTitle, { color: '#ff4d4d' }]}>Intente de nuevo</Text>
              <Text style={styles.feedbackSub}>{mensajeFeedback}</Text>
            </View>
          )}
          {statusVerificacion === 'IDLE' && !loading && (
            <Text style={styles.instruccion}>Alineá tu rostro mirando fijo al óvalo</Text>
          )}
        </View>

        <View style={styles.statusArea}>
          {loading ? (
            <ActivityIndicator size="large" color="#00ffcc" />
          ) : (
            statusVerificacion !== 'SUCCESS' && (
              <TouchableOpacity style={styles.btnCaptura} onPress={validarRostro}>
                <Text style={styles.btnText}>{tipoOperacion === 'REGISTER' ? "REGISTRAR ROSTRO" : "ESCANEAR E INGRESAR"}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.footerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Image source={require('../../assets/volver.png')} style={styles.navIcon} /></TouchableOpacity>
        <TouchableOpacity onPress={() => BackHandler.exitApp()}><Image source={require('../../assets/salir.png')} style={styles.navIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  topSection: { marginTop: SCREEN_HEIGHT * 0.04, marginBottom: 5 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logo: { width: 45, height: 45, resizeMode: 'contain' },
  nombreApp: { width: 130, height: 40, resizeMode: 'contain', marginLeft: 10 },
  
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 8, width: '100%', marginBottom: 15 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center', letterSpacing: 0.5 },

  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  cameraContainer: { height: 380, width: '92%', borderRadius: 25, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlaySuccessContainer: { backgroundColor: '#002a54', justifyContent: 'center', alignItems: 'center' }, 
  
  faceOval: { 
    width: 270, 
    height: 350, 
    borderRadius: 135, 
    borderWidth: 3, 
    borderColor: '#00ffcc', 
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  faceOvalSuccess: { borderColor: '#00ffcc', borderStyle: 'solid', backgroundColor: 'rgba(0, 255, 204, 0.25)' },
  
  timerText: { fontSize: 90, color: '#fff', fontWeight: 'bold', position: 'absolute' },
  
  feedbackContainer: { height: 70, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  feedbackBox: { alignItems: 'center' },
  feedbackTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  feedbackSub: { color: '#00ffcc', fontSize: 15, fontWeight: '500', textAlign: 'center' },
  instruccion: { color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: '500' },
  
  statusArea: { marginTop: 5, marginBottom: 10, height: 50, justifyContent: 'center' },
  btnCaptura: { backgroundColor: '#00ffcc', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 25 },
  btnText: { fontWeight: 'bold', fontSize: 13, color: '#001f3f', letterSpacing: 0.5 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginBottom: 20 },
  navIcon: { width: 40, height: 40, resizeMode: 'contain' }
});