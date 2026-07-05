import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, Image, Dimensions, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function AdminPanelScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);

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
          renderItem={({ item }) => (
            <View style={styles.cardUsuario}>
              <Text style={styles.userTitle}>{item.apellido?.toUpperCase()}, {item.nombre}</Text>
              <Text style={styles.userSub}>{item.email}</Text>
              <Text style={styles.userSub}>Sexo: {item.sexo || 'N/A'} | Fecha: {item.dia ? `${item.dia}/${item.mes}/${item.anio}` : 'N/A'}</Text>
            </View>
          )}
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
  navIcon: { width: 38, height: 38, resizeMode: 'contain' }
});