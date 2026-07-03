// src/screens/AdminPanelScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, Image, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const { height } = Dimensions.get('window');

export default function AdminPanelScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargarTelemetria = async () => {
    setCargando(true);
    try {
      const response = await axios.get('https://smartcheck-proyecto-final.onrender.com/api/users/admin');
      if (response.data && Array.isArray(response.data)) {
        setUsuarios(response.data);
      } else if (response.data && Array.isArray(response.data.usuarios)) {
        setUsuarios(response.data.usuarios);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error("Error cargando telemetría:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor de administración.");
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (autenticado) {
        cargarTelemetria();
      }
    }, [autenticado])
  );

  const presionarTecla = (num) => {
    if (pin.length < 5) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      
      if (nuevoPin === '00192') {
        setTimeout(() => {
          setAutenticado(true);
        }, 100);
      } else if (nuevoPin.length === 5) {
        setTimeout(() => {
          Alert.alert("Error", "Pin incorrecto");
          setPin('');
        }, 200);
      }
    }
  };

  const borrarTecla = () => {
    setPin(pin.slice(0, -1));
  };

  if (!autenticado) {
    return (
      <View style={styles.container}>
        <View style={styles.blackTitleBar}><Text style={styles.titleText}>INGRESO ADMINISTRADOR</Text></View>
        <View style={styles.pinDisplayContainer}>
          <Text style={styles.pinDisplay}>{"* ".repeat(pin.length)}</Text>
        </View>
        <View style={styles.teclado}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
            <TouchableOpacity key={num} style={styles.tecla} onPress={() => presionarTecla(num)}>
              <Text style={styles.teclaTexto}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.tecla, styles.teclaBorrar]} onPress={borrarTecla}>
            <Text style={styles.teclaTexto}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.blackTitleBar}><Text style={styles.titleText}>PANEL DE TELEMETRÍA GLOBAL</Text></View>
      {cargando ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00ffcc" /><Text style={{color:'#fff', marginTop: 10}}>Conectando con el servidor...</Text></View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron usuarios registrados.</Text>}
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
        <TouchableOpacity onPress={() => { setAutenticado(false); setPin(''); navigation.goBack(); }}><Image source={require('../../assets/volver.png')} style={styles.navIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  blackTitleBar: { backgroundColor: '#000', paddingVertical: 12, marginBottom: 15 },
  titleText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  pinDisplayContainer: { backgroundColor: '#002a54', padding: 20, marginHorizontal: 40, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  pinDisplay: { color: '#00ffcc', fontSize: 24, fontWeight: 'bold', height: 30 },
  teclado: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  tecla: { width: 75, height: 75, backgroundColor: '#002a54', borderRadius: 37.5, justifyContent: 'center', alignItems: 'center', margin: 10, borderWidth: 1, borderColor: '#ff9933' },
  teclaBorrar: { backgroundColor: '#a30000', borderColor: '#ff0000' },
  teclaTexto: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  cardUsuario: { backgroundColor: '#002a54', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ff9933' },
  userTitle: { color: '#00ffcc', fontWeight: 'bold', fontSize: 14 },
  userSub: { color: '#fff', fontSize: 12, marginTop: 2 },
  empty: { color: '#fff', textAlign: 'center', marginTop: 40 },
  footerArea: { alignItems: 'center', paddingBottom: 20 },
  navIcon: { width: 38, height: 38, resizeMode: 'contain' }
});