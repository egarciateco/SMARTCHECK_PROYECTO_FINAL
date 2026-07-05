import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

const WelcomeScreen = ({ navigation }) => {
  const [progreso, setProgreso] = useState(0);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificarServidor = async () => {
      try {
        await fetch(`${API_URL}/api/users/usuarios`, { method: 'HEAD' });
      } catch (error) {
        console.log("Error de conexión:", error.message);
      } finally {
        setVerificando(false);
      }
    };

    verificarServidor();

    const intervalo = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 100) {
          clearInterval(intervalo);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(intervalo);
  }, []);

  const handleComenzar = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <Image source={require('../../assets/splash.png')} style={styles.backgroundImage} resizeMode="contain" />
        </View>
        <View style={styles.progressWrapper}>
          <View style={[styles.progressBar, { width: `${progreso}%` }]} />
        </View>
        <Text style={styles.loadingText}>{verificando ? "Verificando conexión..." : "Sistema Listo"}</Text>
        <View style={styles.footerContainer}>
          <Text style={styles.title}>SmartCheck</Text>
          <TouchableOpacity 
            style={[styles.button, progreso < 100 && { opacity: 0.5 }]} 
            onPress={handleComenzar}
            disabled={progreso < 100}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>COMENZAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  contentContainer: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40 },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  backgroundImage: { width: '80%', height: '80%' },
  progressWrapper: { width: '80%', height: 6, backgroundColor: '#002a54', borderRadius: 3, marginBottom: 5 },
  progressBar: { height: '100%', backgroundColor: '#00ffcc', borderRadius: 3 },
  loadingText: { color: '#fff', fontSize: 12, marginBottom: 20 },
  footerContainer: { alignItems: 'center', width: '100%' },
  title: { fontSize: 40, fontWeight: 'bold', color: '#ffcc00', marginBottom: 40 },
  button: { backgroundColor: '#00ffcc', paddingHorizontal: 70, paddingVertical: 18, borderRadius: 30, elevation: 8 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#001f3f' },
});

export default WelcomeScreen;