import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, Image, Dimensions, TextInput, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
const AUDIO_DESPEDIDA = require('../../assets/despedida.mp3');

export default function AdminPanelScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Función de carga mejorada para capturar cualquier estructura de respuesta
  const cargarTelemetria = async () => {
    setCargando(true);
    try {
      const response = await axios.get('https://smartcheck-proyecto-final.onrender.com/api/users/admin');
      // Verificamos si los datos vienen directamente en data o bajo la propiedad 'usuarios'
      const data = response.data.usuarios || (Array.isArray(response.data) ? response.data : []);
      setUsuarios(data);
    } catch (error) {
      console.error("Error cargando telemetría:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Se activa al entrar en la pantalla si ya está autenticado
  useFocusEffect(
    React.useCallback(() => {
      if (autenticado) {
        cargarTelemetria();
      }
    }, [autenticado])
  );

  const handleIngresar = () => {
    if (pin === '00192') {
      setAutenticado(true);
      cargarTelemetria(); // Carga inmediata al autenticar
    } else {
      Alert.alert("Error", "PIN incorrecto");
      setPin('');
    }
  };

  // Función de salida controlada por el estado de reproducción del audio
  const ejecutarSalidaSegura = () => {
    Alert.alert(
      "Cerrar Aplicación",
      "¿Estás seguro de que deseas salir de la aplicación?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí", 
          onPress: async () => {
            try {
              setIsExiting(true);

              const { sound } = await Audio.Sound.createAsync(
                AUDIO_DESPEDIDA,
                { shouldPlay: false }
              );

              sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                  await sound.unloadAsync();
                  BackHandler.exitApp();
                }
              });

              await sound.playAsync();

            } catch (error) {
              console.error("Error en la automatización del cierre:", error);
              BackHandler.exitApp();
            }
          } 
        }
      ]
    );
  };

  // Render de contingencia para la pantalla de despedida
  if (isExiting) {
    return (
      <View style={styles.exitContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.exitLogo} />
        <Text style={styles.exitTitle}>¡HASTA LUEGO!</Text>
        <Text style={styles.exitSubtitle}>¡Vuelva pronto!</Text>
      </View>
    );
  }

  // VISTA DE LOGIN
  if (!autenticado) {
    return (
      <View style={styles.container}>
        <View style={styles.blackTitleBar}>
          <Text style={styles.titleText}>INGRESO ADMINISTRADOR</Text>
        </View>
        
        <View style={styles.loginBox}>
          <TextInput
            style={styles.input}
            placeholder="Ingrese PIN"
            placeholderTextColor="#888"
            secureTextEntry={true}
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            maxLength={5}
            autoFocus={true}
          />
          <TouchableOpacity style={styles.botonIngresar} onPress={handleIngresar}>
            <Text style={styles.botonTexto}>INGRESAR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerArea}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // VISTA DE PANEL
  return (
    <View style={styles.container}>
      <View style={styles.blackTitleBar}>
        <Text style={styles.titleText}>PANEL DE TELEMETRÍA GLOBAL</Text>
      </View>
      
      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00ffcc" />
          <Text style={{color:'#fff', marginTop: 10}}>Cargando datos...</Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={styles.empty}>No hay usuarios registrados.</Text>}
          renderItem={({ item }) => {
            let edadCalculada = 'N/A';
            if (item.dia && item.mes && item.anio) {
              const hoy = new Date();
              let edad = hoy.getFullYear() - parseInt(item.anio);
              const mesActual = hoy.getMonth() + 1;
              if (mesActual < parseInt(item.mes) || (mesActual === parseInt(item.mes) && hoy.getDate() < parseInt(item.dia))) {
                edad--;
              }
              edadCalculada = `${edad} años`;
            }

            return (
              <View style={styles.cardUsuario}>
                <Text style={styles.userTitle}>{item.apellido?.toUpperCase()}, {item.nombre}</Text>
                <Text style={styles.userSub}>{item.email}</Text>
                <Text style={styles.userSub}>Sexo: {item.sexo || 'N/A'}</Text>
                <Text style={styles.userSub}>
                  Nacimiento: {item.dia ? `${item.dia}/${item.mes}/${item.anio}` : 'N/A'} | Edad: {edadCalculada}
                </Text>
              </View>
            );
          }}
        />
      )}
      
      <View style={styles.footerArea}>
        <TouchableOpacity onPress={() => { setAutenticado(false); setPin(''); navigation.goBack(); }}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 12, marginBottom: 15 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  loginBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  input: { backgroundColor: '#002a54', color: '#fff', fontSize: 18, width: '100%', height: 50, borderRadius: 8, paddingHorizontal: 15, textAlign: 'center', borderWidth: 1, borderColor: '#ff9933', marginBottom: 20, letterSpacing: 5 },
  botonIngresar: { backgroundColor: '#ff9933', width: '100%', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  botonTexto: { color: '#001f3f', fontSize: 16, fontWeight: 'bold' },
  cardUsuario: { backgroundColor: '#002a54', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ff9933' },
  userTitle: { color: '#00ffcc', fontWeight: 'bold', fontSize: 14 },
  userSub: { color: '#fff', fontSize: 12, marginTop: 2 },
  empty: { color: '#fff', textAlign: 'center', marginTop: 40 },
  footerArea: { alignItems: 'center', paddingBottom: 20 },
  navIcon: { width: 38, height: 38, resizeMode: 'contain' },
  
  exitContainer: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center' },
  exitLogo: { width: 100, height: 100, marginBottom: 20, resizeMode: 'contain' },
  exitTitle: { color: '#ff9933', fontSize: 24, fontWeight: '900', letterSpacing: 3, marginBottom: 5 },
  exitSubtitle: { color: '#00ffcc', fontSize: 16, fontWeight: '600', letterSpacing: 1 }
});