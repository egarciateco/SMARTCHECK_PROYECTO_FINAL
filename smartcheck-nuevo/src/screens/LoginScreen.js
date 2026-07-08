import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoData, setGeoData] = useState({ localidad: 'N/A', provincia: 'N/A' });

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (reverseGeocode && reverseGeocode.length > 0) {
          const resultado = reverseGeocode[0];
          setGeoData({
            localidad: resultado.city || resultado.subregion || 'Desconocida',
            provincia: resultado.region || 'Desconocida'
          });
        }
      } catch (err) { console.error(err); }
    })();
  }, []);

  const ejecutarLogout = () => {
    Alert.alert("Salir", "¿Está seguro que desea cerrar la aplicación?", [
      { text: "No", style: "cancel" },
      { text: "Sí", onPress: () => BackHandler.exitApp() }
    ]);
  };

  const handleLoginManual = async () => {
    if (!email || !password) {
      Alert.alert("Campos incompletos", "Por favor, ingresa tu email y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setLoading(false);
      
      if (response.ok && data.status === 'success') {
        const u = data.usuario || data;
        
        // PARSEO INTELIGENTE DE FECHA: Si viene como 'fechaNacimiento' (DD/MM/AAAA), la desestructuramos
        let extraDia = "";
        let extraMes = "";
        let extraAnio = "";

        if (u.fechaNacimiento && u.fechaNacimiento.includes('/')) {
          const partes = u.fechaNacimiento.split('/');
          if (partes.length === 3) {
            extraDia = partes[0];
            extraMes = partes[1];
            extraAnio = partes[2];
          }
        }

        const usuarioCompleto = { 
            ...u, 
            dia: u.dia || extraDia,
            mes: u.mes || extraMes,
            anio: u.anio || extraAnio,
            localidad: geoData.localidad, 
            provincia: geoData.provincia 
        };
        
        await AsyncStorage.setItem('usuario_logueado', JSON.stringify(usuarioCompleto));
        login(usuarioCompleto);
        
        if (usuarioCompleto.rol === 'admin' || usuarioCompleto.role === 'admin') {
            navigation.replace('AdminPanel');
        } else {
            navigation.replace('Home');
        }
      } else {
        Alert.alert("Acceso denegado", data.mensaje || "Credenciales incorrectas.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Sin conexión", "No pudimos conectar con el servidor.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.headerArea}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
      </View>
      
      <View style={styles.blackBar}><Text style={styles.titleText}>INICIAR SESIÓN</Text></View>
      
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.emoji}>📧</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.emoji}>🔒</Text>
          <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#001f3f" />
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="small" color="#ffcc00" /> : (
          <View>
            <TouchableOpacity style={styles.btn} onPress={handleLoginManual}><Text style={styles.btnText}>INGRESAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnFacial} onPress={() => navigation.navigate('Camera', { tipoOperacion: 'LOGIN', geoData })}>
              <Text style={styles.btnText}>LOGIN FACIAL</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={styles.link}>¿No tienes cuenta? Regístrate</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.footer} onPress={ejecutarLogout}>
        <Text style={styles.footerText}>Salir</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  headerArea: { alignItems: 'center', marginTop: 20 },
  logo: { width: 80, height: 80, resizeMode: 'contain' },
  nombreApp: { width: 150, height: 40, resizeMode: 'contain' },
  blackBar: { backgroundColor: '#000', padding: 8, alignItems: 'center', marginVertical: 10 },
  titleText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 5, marginBottom: 10 },
  input: { flex: 1, paddingHorizontal: 5, fontSize: 14 },
  btn: { backgroundColor: '#00ffcc', padding: 12, borderRadius: 5, alignItems: 'center', marginBottom: 8 },
  btnFacial: { backgroundColor: '#ffcc00', padding: 12, borderRadius: 5, alignItems: 'center', marginBottom: 8 },
  btnText: { fontWeight: 'bold', fontSize: 14 },
  link: { color: '#fff', textAlign: 'center', fontSize: 12, textDecorationLine: 'underline' },
  footer: { alignItems: 'center', paddingBottom: 15 },
  footerText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});