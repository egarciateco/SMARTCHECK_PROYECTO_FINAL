import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, BackHandler, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system'; // Añadido para manejo seguro de archivos
import api from '../config/api'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { tipoOperacion, datosRegistro } = route.params || { tipoOperacion: 'LOGIN', datosRegistro: {} };

  const subirImagenACloudinary = async (base64) => {
    const data = new FormData();
    data.append('file', `data:image/jpg;base64,${base64}`);
    data.append('upload_preset', 'smartcheck_preset');
    data.append('cloud_name', 'dkdvhes2i');

    const res = await fetch('https://api.cloudinary.com/v1_1/dkdvhes2i/image/upload', {
      method: 'POST',
      body: data
    });
    const file = await res.json();
    return file.secure_url;
  };

  const validarRostro = async () => {
    if (countdown > 0 || loading) return;

    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) return Alert.alert("Error", "Permiso de cámara denegado");
    }

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(0);

    if (cameraRef.current) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.7,
          skipProcessing: false 
        });

        // Redimensionamos a un tamaño amigable para face-api
        const fotoProcesada = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 400 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        let fotoUrl = "";
        if (tipoOperacion === 'REGISTER') {
            fotoUrl = await subirImagenACloudinary(fotoProcesada.base64);
        }

        // Creamos un FormData en lugar de enviar JSON crudo
        const formData = new FormData();
        
        // Adjuntamos los datos del usuario uno a uno
        if (tipoOperacion === 'REGISTER') {
          const { dia, mes, anio, nombre, apellido, email, sexo, localidad, provincia } = datosRegistro;
          formData.append('nombre', nombre || '');
          formData.append('apellido', apellido || '');
          formData.append('email', email || '');
          formData.append('sexo', sexo || '');
          formData.append('dia', dia || '');
          formData.append('mes', mes || '');
          formData.append('anio', anio || '');
          formData.append('localidad', localidad || '');
          formData.append('provincia', provincia || '');
          formData.append('fotoUrl', fotoUrl);
        }

        // Adjuntamos la foto como un archivo real adjunto
        const filename = fotoProcesada.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('imageFile', {
          uri: fotoProcesada.uri,
          name: filename || 'face.jpg',
          type
        });

        console.log("🚀 ENVIANDO FORM DATA COMPUESTO A REGISTER...");

        // Configuración de cabeceras para envío de archivos (Multipart)
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };

        const response = tipoOperacion === 'REGISTER' 
            ? await api.post('/api/users/register', formData, config)
            : await api.post('/api/users/biometria', formData, config);

        if (tipoOperacion === 'REGISTER') {
            Alert.alert("Éxito", "Registrado correctamente", [{ text: "OK", onPress: () => navigation.navigate('Login') }]);
        } else {
            const data = response.data;
            if (data && data.status === 'success') {
                await AsyncStorage.setItem('usuario_logueado', JSON.stringify(data));
                navigation.reset({ index: 0, routes: [{ name: 'Home', params: data }] });
            } else {
                Alert.alert("Error", data.mensaje || "No se pudo reconocer el rostro.");
            }
        }
      } catch (error) {
        console.error("❌ ERROR DETECTADO:", error);
        if (error.response) {
          console.log("Detalles del error del servidor:", JSON.stringify(error.response.data));
        }
        Alert.alert("Error", "Fallo al procesar la solicitud biométrica.");
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
        <Text style={styles.instruccion}>{tipoOperacion === 'REGISTER' ? "Captura inicial" : "Esfuérzate en mirar al óvalo"}</Text>
      </View>
      
      <View style={styles.centerSection}>
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="front" ref={cameraRef}>
            <View style={styles.overlay}>
                {countdown > 0 && <Text style={styles.timerText}>{countdown}</Text>}
                <View style={styles.faceOval} />
            </View>
          </CameraView>
        </View>

        <View style={styles.statusArea}>
          {loading ? (
            <ActivityIndicator size="large" color="#00ffcc" />
          ) : (
            <TouchableOpacity style={styles.btnCaptura} onPress={validarRostro}>
              <Text style={styles.btnText}>{tipoOperacion === 'REGISTER' ? "REGISTRAR ROSTRO" : "ESCANEAR E INGRESAR"}</Text>
            </TouchableOpacity>
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
  topSection: { marginTop: SCREEN_HEIGHT * 0.04 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 70, height: 70, resizeMode: 'contain' },
  nombreApp: { width: 180, height: 50, resizeMode: 'contain', marginLeft: 10 },
  instruccion: { color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: 'bold', marginTop: 10 },
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { height: 340, width: '90%', borderRadius: 20, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  faceOval: { width: 240, height: 310, borderRadius: 120, borderWidth: 3, borderColor: '#00ffcc', borderStyle: 'dashed' },
  timerText: { fontSize: 80, color: '#fff', fontWeight: 'bold', position: 'absolute' },
  btnCaptura: { backgroundColor: '#00ffcc', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, marginTop: 20 },
  btnText: { fontWeight: 'bold', fontSize: 14, color: '#001f3f' },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginBottom: 25 },
  navIcon: { width: 45, height: 45, resizeMode: 'contain' }
});