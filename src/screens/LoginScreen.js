import React, { useState, useLayoutEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Image, 
  Alert, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => navigation.setOptions({ headerShown: false }), [navigation]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert("Error", "Por favor ingresa tu email y contraseña.");
    }
    
    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      
      // 1. Autenticación con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 🛡️ 2. GUARDADO OBLIGATORIO EN ASYNCSTORAGE
      const userDataToStore = {
        uid: user.uid,
        email: user.email,
      };
      await AsyncStorage.setItem('@smartcheck_user', JSON.stringify(userDataToStore));
      await AsyncStorage.setItem('user_uid', user.uid); // Respaldo adicional

      Alert.alert("¡Éxito!", "Sesión iniciada correctamente.");
      navigation.replace('HomeScreen');
    } catch (error) {
      console.error("Error en login:", error);
      Alert.alert("Error", "Credenciales inválidas o usuario no encontrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImage} />
        </View>
        <View style={styles.blackBar}>
          <Text style={styles.titleText}>INICIO DE SESIÓN</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formFrame}>
            <View style={styles.inputContainer}>
              <Image source={require('../../assets/email.png')} style={styles.largeEmoji} />
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#999999"
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Image source={require('../../assets/candado.png')} style={styles.largeEmoji} />
              <TextInput 
                style={styles.input} 
                placeholder="Contraseña" 
                placeholderTextColor="#999999"
                secureTextEntry={!showPassword} 
                value={password} 
                onChangeText={setPassword} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Image source={showPassword ? require('../../assets/eye.png') : require('../../assets/eyeoff.png')} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.verificarBtn} onPress={() => navigation.navigate('FacialLogin')}>
              <Image source={require('../../assets/verificar.png')} style={styles.verificarImg} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.finalBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#001f3f" />
            ) : (
              <Image source={require('../../assets/btningreso.png')} style={styles.ingresoImg} />
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footerWrapper}>
          <View style={styles.footerLine} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require('../../assets/volver.png')} style={styles.navIconCeleste} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Image source={require('../../assets/registrarse.png')} style={styles.registrarseCenterIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Goodbye')}>
              <Image source={require('../../assets/salir.png')} style={styles.navIconCeleste} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 8, paddingHorizontal: 10 },
  logo: { width: 75, height: 75, resizeMode: 'contain' },
  appNameImage: { width: 190, height: 48, resizeMode: 'contain', marginLeft: 12 },
  blackBar: { backgroundColor: '#000', paddingVertical: 10, alignItems: 'center' },
  titleText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  scrollContent: { flexGrow: 1, padding: 12, justifyContent: 'flex-start' },
  formFrame: { borderWidth: 2, borderColor: '#FFD700', borderRadius: 15, padding: 15, backgroundColor: 'rgba(0,0,0,0.3)', marginTop: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 12, paddingHorizontal: 12, borderRadius: 10, height: 55 },
  largeEmoji: { width: 50, height: 50, marginRight: 10, resizeMode: 'contain' },
  input: { flex: 1, fontSize: 13, color: '#000' },
  eyeIcon: { width: 25, height: 25, resizeMode: 'contain' },
  verificarBtn: { alignItems: 'center', marginVertical: 8 },
  verificarImg: { width: 300, height: 85, resizeMode: 'contain' },
  finalBtn: { marginTop: 28, alignItems: 'center' },
  ingresoImg: { width: 300, height: 95, resizeMode: 'contain' },
  footerWrapper: { width: '100%', paddingHorizontal: 25, paddingBottom: 10 },
  footerLine: { width: '100%', height: 1, backgroundColor: '#FFD700', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navIconCeleste: { width: 45, height: 45, resizeMode: 'contain', tintColor: '#00BFFF' },
  registrarseCenterIcon: { width: 110, height: 80, resizeMode: 'contain' }
});