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

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(false);
      try {
        const { sound } = await Audio.Sound.createAsync(require('../../assets/exito.mp3'));
        await sound.playAsync();
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
              style={styles.buttonContainer} 
              onPress={() => navigation.navigate('Login')}
            >
              <Image 
                source={require('../../assets/btningreso.png')} 
                style={styles.btnIngresoImage} 
              />
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
    paddingVertical: 30,
    // Marco dorado
    borderWidth: 1,
    borderColor: '#FFD700',
    margin: 10,
    borderRadius: 15
  },
  header: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  logo: { 
    width: 140, // Agrandado
    height: 140, // Agrandado
    resizeMode: 'contain' 
  },
  nombreApp: { 
    width: 260, // Agrandado
    height: 80, // Agrandado
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
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  readyText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 30 
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnIngresoImage: { 
    width: 280, 
    height: 70, 
    resizeMode: 'contain' 
  },
  footer: { 
    marginBottom: 20 
  },
  footerText: { 
    color: '#888', 
    fontSize: 12 
  }
});