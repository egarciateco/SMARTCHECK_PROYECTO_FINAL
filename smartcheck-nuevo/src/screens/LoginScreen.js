import React, { useState, useLayoutEffect, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity, 
  Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator 
} from 'react-native';

import { auth } from '../services/firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSubscription.remove(); hideSubscription.remove(); };
  }, []);

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  const handlePasswordInput = (text) => {
    setPassword(text);
    setIsTyping(text.length > 0);
  };

  const handleCancel = () => {
    setPassword('');
    setConfirmPassword('');
    setIsTyping(false);
    Keyboard.dismiss();
  };

  const handleSalir = () => {
    navigation.navigate('Goodbye');
  };

  const handleLogin = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      const response = await fetch(`http://192.168.1.7:10000/api/users/profile/${email.trim().toLowerCase()}`);
      const data = await response.json();
      
      if (data.status === 'success') {
          await login(data.usuario);
      } else {
          Alert.alert("Error", "Usuario no encontrado en la base de datos.");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Alert.alert("Error", "No se pudo iniciar sesión. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => { navigation.navigate('Camera'); };

  return (
    <View style={styles.mainContainer}>
      {!isKeyboardVisible && (
        <TouchableOpacity style={styles.exitButton} onPress={handleSalir}>
          <Image source={require('../../assets/salir.png')} style={styles.exitIcon} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {!isKeyboardVisible && (
            <View style={styles.headerSection}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
              <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
              <View style={styles.fullWidthTitleStrip}><Text style={styles.titleStripText}>INICIO DE SESIÓN</Text></View>
            </View>
          )}

          <View style={styles.formSection}>
            <View style={styles.inputRow}>
              <Image source={require('../../assets/email.png')} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#555" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <View style={styles.inputRow}>
              <Image source={require('../../assets/candado.png')} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#555" secureTextEntry={!showPassword} value={password} onChangeText={handlePasswordInput} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Image source={showPassword ? require('../../assets/eyeoff.png') : require('../../assets/eye.png')} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>

            {isTyping ? (
              <>
                <View style={styles.inputRow}>
                  <Image source={require('../../assets/candado2.png')} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Confirmar" placeholderTextColor="#555" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Image source={showConfirmPassword ? require('../../assets/eyeoff.png') : require('../../assets/eye.png')} style={styles.eyeIcon} />
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 10 }} />
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={handleLogin} style={styles.sideButton}>
                      <Image source={require('../../assets/btningreso.png')} style={styles.sideImageButton} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancel} style={styles.sideButton}>
                      <Image source={require('../../assets/cancelar.png')} style={styles.sideImageButton} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity onPress={handleVerify} style={styles.buttonWrapper}>
                <Image source={require('../../assets/verificar.png')} style={styles.uniformImageButton} />
              </TouchableOpacity>
            )}
          </View>

          {!isKeyboardVisible && (
            <View style={styles.footerSection}>
              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Register')}>
                <Image source={require('../../assets/registrarse.png')} style={styles.footerRectButton} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('ForgotPassword')}>
                <Image source={require('../../assets/recucontra.png')} style={styles.footerRectButton} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#001f3f' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 15, justifyContent: 'center' },
  exitButton: { position: 'absolute', top: 35, right: 15, zIndex: 10 },
  exitIcon: { width: 40, height: 40, resizeMode: 'contain' },
  headerSection: { alignItems: 'center', marginTop: 45 },
  logo: { width: 110, height: 110, resizeMode: 'contain' },
  appName: { width: 200, height: 50, resizeMode: 'contain' },
  fullWidthTitleStrip: { backgroundColor: '#000', width: '120%', paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  titleStripText: { color: '#ffcc00', fontSize: 16, fontWeight: 'bold' },
  formSection: { marginVertical: 20, padding: 15, borderWidth: 1, borderColor: '#FFD700', borderRadius: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d3d3d3', borderRadius: 10, marginBottom: 12, paddingHorizontal: 10, height: 60 },
  inputIcon: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  eyeIcon: { width: 35, height: 35, resizeMode: 'contain' },
  input: { flex: 1, color: '#000', fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 5 },
  sideButton: { flex: 1, alignItems: 'center' },
  sideImageButton: { width: '100%', height: 70, resizeMode: 'contain' },
  buttonWrapper: { width: '100%', alignItems: 'center', marginTop: 5 },
  uniformImageButton: { width: '100%', height: 70, resizeMode: 'contain' },
  footerSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 },
  navButton: { flex: 1, alignItems: 'center' },
  footerRectButton: { width: '100%', height: 70, resizeMode: 'contain' } 
});