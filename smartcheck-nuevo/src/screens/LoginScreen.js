import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const ejecutarLogout = async () => {
    await AsyncStorage.removeItem('usuario_logueado');
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
      const response = await fetch(`${API_URL}/api/users/biometria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (response.ok && data.status === 'success') {
        await AsyncStorage.setItem('usuario_logueado', JSON.stringify(data));
        navigation.replace('Home', data);
      } else {
        Alert.alert("Acceso denegado", data.mensaje || "Credenciales incorrectas.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Sin conexión", "No pudimos conectar con el servidor. Revisa tu internet.");
      console.error("DETALLE ERROR LOGIN:", error);
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
            <Ionicons name={showPass ? "eye-off" : "eye"} size={24} color="#001f3f" />
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator size="large" color="#ffcc00" style={{ marginVertical: 20 }} /> : (
            <View>
                <TouchableOpacity style={styles.btn} onPress={handleLoginManual}><Text style={styles.btnText}>INGRESAR</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnFacial} onPress={() => navigation.navigate('Camera', { tipoOperacion: 'LOGIN' })}><Text style={styles.btnText}>LOGIN FACIAL</Text></TouchableOpacity>
            </View>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={styles.link}>¿No tienes cuenta? Regístrate</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.footer} onPress={ejecutarLogout}><Text style={styles.footerText}>Salir</Text></TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  headerArea: { alignItems: 'center', marginTop: 30 },
  logo: { width: 120, height: 120, resizeMode: 'contain' },
  nombreApp: { width: 200, height: 50, resizeMode: 'contain', marginTop: -10 },
  blackBar: { backgroundColor: '#000', padding: 10, alignItems: 'center' },
  titleText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 },
  input: { flex: 1, paddingHorizontal: 10 },
  emoji: { fontSize: 20 },
  btn: { backgroundColor: '#00ffcc', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  btnFacial: { backgroundColor: '#ffcc00', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 20 },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  link: { color: '#fff', textAlign: 'center', fontSize: 14, textDecorationLine: 'underline' },
  footer: { alignItems: 'center', paddingBottom: 20 },
  footerText: { color: '#fff', fontSize: 16 }
});