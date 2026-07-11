import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState('.');

  // Efecto para la animación de los puntos suspensivos
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '.';
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Efecto para simular la carga y disparar el sonido
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(false);
      
      // Reproducir sonido de éxito
      try {
        const { sound } = await Audio.Sound.createAsync(require('../../assets/exito.mp3'));
        await sound.playAsync();
        // Liberar memoria al terminar
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) sound.unloadAsync();
        });
      } catch (error) {
        console.log("Error al reproducir audio:", error);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Encabezado fijo */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
      </View>

      {/* Sección central dinámica */}
      <View style={styles.middleSection}>
        {loading ? (
          <View style={styles.containerCarga}>
            <Image source={require('../../assets/espera.gif')} style={styles.gifStyle} />
            <Text style={styles.loadingText}>
              Verificando conexión{dots} Espere por favor...
            </Text>
          </View>
        ) : (
          <View style={styles.containerListo}>
            <Text style={styles.readyText}>¡SISTEMA LISTO!</Text>
            <TouchableOpacity 
              style={styles.accessButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.btnText}>ACCEDER</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Pie de página */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SmartCheck v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#001f3f', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 30 
  },
  header: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  logo: { 
    width: 100, 
    height: 100, 
    resizeMode: 'contain' 
  },
  nombreApp: { 
    width: 200, 
    height: 60, 
    resizeMode: 'contain', 
    marginTop: 10 
  },
  middleSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%' 
  },
  containerCarga: { 
    alignItems: 'center',
    justifyContent: 'center' 
  },
  gifStyle: { 
    width: 150, 
    height: 150, 
    resizeMode: 'contain' 
  },
  loadingText: { 
    marginTop: 20, 
    fontSize: 16, 
    color: '#00ffcc', 
    fontWeight: 'bold',
    textAlign: 'center' 
  },
  containerListo: { 
    alignItems: 'center' 
  },
  readyText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 30 
  },
  accessButton: { 
    backgroundColor: '#00ffcc', 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    borderRadius: 25 
  },
  btnText: { 
    color: '#001f3f', 
    fontWeight: '900', 
    fontSize: 18 
  },
  footer: { 
    marginBottom: 20 
  },
  footerText: { 
    color: '#888', 
    fontSize: 12 
  }
});