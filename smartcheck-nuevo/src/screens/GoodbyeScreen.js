import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, BackHandler, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../context/AuthContext';

export default function GoodbyeScreen({ navigation }) {
  const { user, logout } = useAuth();

  useEffect(() => {
    let soundObject = null;
    let timeoutId = null;

    const iniciarDespedida = async () => {
      if (user) {
        try {
          await logout();
        } catch (error) {
          console.log("Error al procesar el cierre de sesión:", error);
        }
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/despedida.mp3')
        );
        soundObject = sound;
        await soundObject.playAsync();

        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            cerrarAplicacion();
          }
        });
      } catch (audioError) {
        console.log("Error con el audio de despedida o ruta de archivo:", audioError);
        timeoutId = setTimeout(cerrarAplicacion, 2000);
      }
    };

    const cerrarAplicacion = () => {
      if (Platform.OS === 'android') {
        BackHandler.exitApp();
      } else {
        navigation.navigate('Welcome');
      }
    };

    iniciarDespedida();

    return () => {
      if (soundObject) {
        soundObject.unloadAsync().catch(() => {});
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  return (
    <View style={styles.container}>
      {/* Recuadro con línea fina dorada */}
      <View style={styles.goldBorderContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.exitLogo} />
        
        {/* Nueva imagen añadida abajo del logo */}
        <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
        
        <Text style={styles.exitTitle}>¡HASTA LUEGO!</Text>
        <Text style={styles.exitSubtitle}>¡Vuelva pronto!</Text>

        {/* Lema abajo a la derecha */}
        <Text style={styles.footerText}>Nuestro objetivo: Su ahorro</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#001f3f', 
    padding: 20 // Espacio para que el recuadro no toque los bordes de la pantalla
  },
  goldBorderContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ffd700', // Color Dorado
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' // Necesario para posicionar el texto abajo
  },
  exitLogo: { 
    width: 120, 
    height: 120, 
    marginBottom: 10, 
    resizeMode: 'contain' 
  },
  appName: {
    width: 180,
    height: 50,
    marginBottom: 30,
    resizeMode: 'contain'
  },
  exitTitle: { 
    color: '#00ffcc', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: 2, 
    marginBottom: 10 
  },
  exitSubtitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  footerText: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    color: '#ffd700',
    fontSize: 10,
    fontStyle: 'italic',
    opacity: 0.8
  }
});