import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Audio } from 'expo-av';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const soundInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const setupAudioAndPlay = async () => {
      try {
        // 1. Configuración obligatoria de audio para Android/iOS
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // 2. Cargar el archivo de sonido
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/exito.mp3'),
          { shouldPlay: false }
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundInstance.current = sound;

        // 3. Temporizador de 2 segundos para mostrar el GIF de carga y luego reproducir
        setTimeout(async () => {
          if (!isMounted) return;
          setLoading(false);
          
          try {
            if (soundInstance.current) {
              await soundInstance.current.playAsync();
            }
          } catch (playError) {
            console.log("Aviso: No se pudo reproducir el audio:", playError.message);
          }
        }, 2000);

      } catch (error) {
        console.log("Aviso: Error al configurar el audio:", error.message);
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 2000);
      }
    };

    setupAudioAndPlay();

    return () => {
      isMounted = false;
      if (soundInstance.current) {
        soundInstance.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Seguridad: Si hay usuario, retornamos una vista vacía en lugar de null para evitar que el navegador colapse
  if (user) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
      </View>

      <View style={styles.middleSection}>
        {loading ? (
          <View style={styles.containerCarga}>
            <Image source={require('../../assets/espera.gif')} style={styles.gifStyle} />
            <Text style={styles.loadingText}>Verificando conexión...</Text>
          </View>
        ) : (
          <View style={styles.containerListo}>
            <Text style={styles.readyText}>¡SISTEMA LISTO!</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Image source={require('../../assets/btningreso.png')} style={styles.btnIngresoImage} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SmartCheck v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 30, borderWidth: 1, borderColor: '#FFD700', margin: 10, borderRadius: 15 },
  header: { alignItems: 'center', marginTop: 40 },
  logo: { width: 140, height: 140, resizeMode: 'contain' },
  nombreApp: { width: 260, height: 80, resizeMode: 'contain' },
  middleSection: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  containerCarga: { alignItems: 'center' },
  gifStyle: { width: 150, height: 150, resizeMode: 'contain' },
  loadingText: { marginTop: 20, fontSize: 16, color: '#00ffcc', fontWeight: 'bold' },
  containerListo: { alignItems: 'center', width: '100%' },
  readyText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  btnIngresoImage: { width: 280, height: 70, resizeMode: 'contain' },
  footer: { marginBottom: 20 },
  footerText: { color: '#888', fontSize: 12 }
});