import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, 
  Alert, SafeAreaView, BackHandler, ActivityIndicator 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import { authService } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function FacialLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { login, registerFormData, clearRegisterData } = useAuth();
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Control de foco para liberar y reiniciar la cámara correctamente al navegar
  const isFocused = useIsFocused();

  const isFromRegister = route.params?.returnScreen === 'RegisterScreen';

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound: playbackObject } = await Audio.Sound.createAsync(
          require('../../assets/vozoprimir.mp3')
        );
        if (isMounted) {
          await playbackObject.playAsync();
        }
      } catch (error) {
        console.warn("Aviso de audio inicial:", error.message);
      }
    }, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // AUDIOS
  const reproducirAudioVerificando = async () => {
    try {
      const { sound: playbackObject } = await Audio.Sound.createAsync(
        require('../../assets/vozverificando.mp3')
      );
      await playbackObject.playAsync();
    } catch (error) {
      console.warn("Aviso de audio verificando:", error.message);
    }
  };

  const reproducirAudioError = async () => {
    try {
      const { sound: playbackObject } = await Audio.Sound.createAsync(
        require('../../assets/vozerror.mp3')
      );
      await playbackObject.playAsync();
    } catch (error) {
      console.warn("Aviso de audio error:", error.message);
    }
  };

  const reproducirAudioReconocida = async () => {
    try {
      const { sound: playbackObject } = await Audio.Sound.createAsync(
        require('../../assets/vozreconocida.mp3')
      );
      await playbackObject.playAsync();
    } catch (error) {
      console.warn("Aviso de audio reconocida:", error.message);
    }
  };

  // NAVEGACIÓN INTELIGENTE A LA PANTALLA DE LOGIN
  const navegarALogin = () => {
    const routeNames = navigation.getState()?.routeNames || [];
    const targetLogin = routeNames.find(name => 
      name === 'Login' || name === 'LoginScreen' || name === 'Inicio'
    ) || 'Login';

    navigation.reset({
      index: 0,
      routes: [{ name: targetLogin }],
    });
  };

  // NAVEGACIÓN INTELIGENTE A HOMESCREEN
  const navegarAHome = () => {
    const routeNames = navigation.getState()?.routeNames || [];
    const targetHome = routeNames.find(name => 
      name === 'HomeScreen' || name === 'Home' || name === 'Principal'
    ) || 'HomeScreen';

    navigation.reset({
      index: 0,
      routes: [{ name: targetHome }],
    });
  };

  const tomarFotoYValidar = async () => {
    console.log(">>> Botón presionado. Validando estado de la cámara...");

    if (!cameraRef.current) {
      console.log(">>> Error: cameraRef.current es nulo.");
      Alert.alert("Aviso", "La cámara aún no está lista. Intenta de nuevo en un segundo.");
      return;
    }

    if (isCapturing) {
      console.log(">>> Ya hay una captura en proceso.");
      return;
    }

    try {
      setIsCapturing(true);
      reproducirAudioVerificando().catch(() => {});

      await new Promise(resolve => setTimeout(resolve, 200));

      console.log(">>> Ejecutando takePictureAsync...");
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true, 
      });

      if (!photo || !photo.uri) {
        throw new Error("No se pudo obtener la URI de la foto tomada.");
      }

      console.log(">>> Foto tomada. Comprimiendo imagen en el celular...");

      const photoComprimida = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 500 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log(">>> Imagen optimizada con éxito:", photoComprimida.uri);

      setLoading(true);

      const formData = new FormData();
      const filename = photoComprimida.uri.split('/').pop() || 'facial.jpg';

      formData.append('imageFile', {
        uri: photoComprimida.uri,
        name: filename,
        type: 'image/jpeg',
      });

      // FLUJO 1: REGISTRO FACIAL
      if (isFromRegister) {
        console.log(">>> Enviando datos de registro facial a la API...");
        const emailFinal = (registerFormData.email || '').trim().toLowerCase();
        const fechaNacimientoFinal = `${(registerFormData.dia || '').padStart(2, '0')}/${(registerFormData.mes || '').padStart(2, '0')}/${registerFormData.anio || ''}`;

        formData.append('nombre', (registerFormData.nombre || '').trim());
        formData.append('apellido', (registerFormData.apellido || '').trim());
        formData.append('email', emailFinal);
        formData.append('sexo', registerFormData.sexo || '');
        formData.append('fechaNacimiento', fechaNacimientoFinal);
        formData.append('localidad', (registerFormData.localidad || '').trim());
        formData.append('provincia', (registerFormData.provincia || '').trim());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        let response;
        try {
          response = await fetch('https://smartcheck-proyecto.onrender.com/api/users/register-facial', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error("El servidor tardó demasiado en responder. Por favor, intenta de nuevo.");
          }
          throw fetchError;
        }
        clearTimeout(timeoutId);

        const data = await response.json();
        console.log(">>> Respuesta del servidor de registro:", data);

        if (!response.ok) {
          throw new Error(data.mensaje || 'Error en el registro facial');
        }

        await reproducirAudioReconocida().catch(() => {});

        const usuarioNuevo = data.usuario || {
          uid: data.uid || data.userId,
          nombre: (registerFormData.nombre || '').trim(),
          apellido: (registerFormData.apellido || '').trim(),
          email: emailFinal,
          sexo: registerFormData.sexo || '',
          fechaNacimiento: fechaNacimientoFinal,
          localidad: (registerFormData.localidad || '').trim(),
          provincia: (registerFormData.provincia || '').trim(),
        };

        await login(usuarioNuevo);
        clearRegisterData();
        setLoading(false);

        Alert.alert(
          "¡Registro Exitoso!", 
          `Bienvenid@, ${usuarioNuevo.nombre || ''}. Tu cuenta ha sido creada con éxito.`,
          [
            { 
              text: "Ingresar", 
              onPress: () => navegarAHome()
            }
          ],
          { cancelable: false }
        );
        return;
      }

      // FLUJO 2: INICIO DE SESIÓN BIOMÉTRICO
      console.log(">>> Enviando datos de inicio de sesión biométrico...");
      const response = await authService.loginBiometric(formData);

      if (response && response.data && response.data.status === 'success') {
        // CAMBIO AQUÍ: Usamos response.data.user (o response.data directamente)
        const usuarioLogueado = response.data.user || response.data; 
        
        await reproducirAudioReconocida().catch(() => {});

        await login(usuarioLogueado);
        setLoading(false);

        Alert.alert(
          "¡Éxito!", 
          `Bienvenid@ de nuevo, ${usuarioLogueado.nombre || 'Usuario'}`,
          [
            {
              text: "Continuar",
              onPress: () => navegarAHome()
            }
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(response?.data?.mensaje || "No se reconoció el rostro.");
      }

    } catch (error) {
      console.log(">>> Error capturado en reconocimiento facial:", error.message || error);
      reproducirAudioError().catch(() => {});

      let mensajeError = error.response?.data?.mensaje || error.message || "Error desconocido";
      if (mensajeError.includes("Network Error") || error.code === 'ECONNABORTED' || mensajeError.includes("Aborted")) {
        mensajeError = "El servidor en la nube está despertando. Por favor, espera unos segundos y vuelve a presionar el botón de verificar.";
      }

      Alert.alert("Aviso", mensajeError);
      setLoading(false); 
    } finally {
      setIsCapturing(false);
    }
  };

  const handleVolver = () => {
    navegarALogin();
  };

  const handleSalir = () => {
    BackHandler.exitApp();
  };

  // Manejo de permisos con verificación segura
  if (!permission) {
    return (
      <View style={[styles.container, styles.centerMessage]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerMessage]}>
        <Text style={styles.errorText}>No hay acceso a la cámara. Habilítalo en los ajustes.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CABECERA */}
      <View style={styles.headerRow}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImage} />
        <View style={styles.logoPlaceholder} />
      </View>

      {/* BANNER DE TÍTULO */}
      <View style={styles.blackBanner}>
        <Text style={styles.bannerTitle}>
          {isFromRegister ? "REGISTRO FACIAL" : "RECONOCIMIENTO FACIAL"}
        </Text>
      </View>

      {/* CÁMARA */}
      <View style={styles.cameraContainer}>
        {/* Usamos isFocused para garantizar que la cámara se desmonte y monte correctamente */}
        {isFocused && (
          <CameraView 
            ref={cameraRef} 
            style={styles.camera} 
            facing="front"
          >
            <View style={styles.overlayOval} />
          </CameraView>
        )}

        {loading && (
          <Image source={require('../../assets/standby.gif')} style={styles.standbyFullBoxAbsolute} />
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {!loading && (
          <TouchableOpacity 
            style={[styles.captureButtonOnly, isCapturing && { opacity: 0.5 }]} 
            onPress={tomarFotoYValidar} 
            activeOpacity={0.7}
            disabled={isCapturing}
          >
            <Image source={require('../../assets/verificar.png')} style={styles.verifyIconOnly} />
          </TouchableOpacity>
        )}

        <View style={styles.goldenDivider} />

        <View style={styles.bottomNavContainer}>
          <TouchableOpacity onPress={handleVolver} style={styles.navButton}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSalir} style={styles.navButton}>
            <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#001f3f', 
    justifyContent: 'space-between' 
  },
  centerMessage: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 5,
    marginBottom: 2
  },
  logo: { 
    width: 70, 
    height: 70, 
    resizeMode: 'contain' 
  },
  appNameImage: { 
    width: 200, 
    height: 55, 
    resizeMode: 'contain' 
  },
  logoPlaceholder: {
    width: 70, 
  },
  blackBanner: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2
  },
  bannerTitle: { 
    color: '#FFD700', 
    fontSize: 16, 
    fontWeight: 'bold', 
    letterSpacing: 1.5 
  },
  cameraContainer: { 
    flex: 1, 
    width: '96%', 
    borderRadius: 20, 
    overflow: 'hidden', 
    borderWidth: 2, 
    borderColor: '#FFD700', 
    alignSelf: 'center',
    marginVertical: 4,
    position: 'relative',
    backgroundColor: '#000'
  },
  camera: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  overlayOval: { 
    width: '82%', 
    height: '96%', 
    borderWidth: 3, 
    borderColor: 'rgba(255, 215, 0, 0.9)', 
    borderRadius: 1000, 
    backgroundColor: 'transparent'
  },
  standbyFullBoxAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    zIndex: 10
  },
  footer: { 
    alignItems: 'center', 
    paddingHorizontal: 15,
    paddingBottom: 10 
  },
  captureButtonOnly: { 
    alignItems: 'center', 
    justifyContent: 'center',
    marginVertical: 2
  },
  verifyIconOnly: {
    width: 220, 
    height: 135,
    resizeMode: 'contain'
  },
  goldenDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#FFD700',
    marginVertical: 6
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20
  },
  navButton: { 
    padding: 5 
  },
  navIcon: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
    tintColor: '#00BFFF' 
  },
  errorText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 16,
    marginBottom: 15
  },
  permissionButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  permissionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  }
});