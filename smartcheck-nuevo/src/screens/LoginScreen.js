import React, { useState, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

import { auth } from '../services/firebaseConfig'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; 

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Manejador: Cuando escribes la contraseña, aparece "Confirmar" y el botón de Ingreso
  const handlePasswordInput = (text) => {
    setPassword(text);
    setIsTyping(text.length > 0);
  };

  const handleLogin = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Firebase y tu AuthContext (en App.js) detectarán esto y cambiarán a HomeScreen automáticamente
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar sesión. Verifique sus datos.");
    }
  };

  // Función conectada al botón verificar.png
  const handleVerify = () => {
    // ¡CORREGIDO! Ahora coincide con el nombre en tu App.js
    navigation.navigate('Camera'); 
  };

  const handleForgotPassword = async () => {
    if (email.trim() === '') {
      Alert.alert("Atención", "Por favor, escribe tu email en el campo superior para poder verificar si existe en la base de datos.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Éxito", "Se ha enviado un enlace a tu correo para restablecer la contraseña (revisa también la carpeta de Spam).");
    } catch (error) {
      Alert.alert("Error", "No se encontró el email en la base de datos o hubo un problema al enviar el correo.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* BOTÓN SALIR */}
      <TouchableOpacity style={styles.exitButton} onPress={() => navigation.navigate('Goodbye')}>
        <Image source={require('../../assets/salir.png')} style={styles.exitIcon} />
      </TouchableOpacity>

      {/* Evita que el teclado tape los botones */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.headerSection}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
            <View style={styles.fullWidthTitleStrip}>
              <Text style={styles.titleStripText}>INICIO DE SESIÓN</Text>
            </View>
          </View>

          {/* FORMULARIO */}
          <View style={styles.formSection}>
            <View style={styles.inputRow}>
              <Image source={require('../../assets/email.png')} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#555" 
                value={email} 
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputRow}>
              <Image source={require('../../assets/candado.png')} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Contraseña" 
                placeholderTextColor="#555" 
                secureTextEntry 
                value={password} 
                onChangeText={handlePasswordInput} 
              />
            </View>

            {/* LÓGICA DINÁMICA: Si escribes, muestra btningreso. Si no, muestra verificar. */}
            {isTyping ? (
              <>
                <View style={styles.inputRow}>
                  <Image source={require('../../assets/candado2.png')} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Confirmar Contraseña" 
                    placeholderTextColor="#555" 
                    secureTextEntry 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                </View>
                <TouchableOpacity onPress={handleLogin} style={styles.buttonWrapper}>
                  <Image source={require('../../assets/btningreso.png')} style={styles.uniformImageButton} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleVerify} style={styles.buttonWrapper}>
                <Image source={require('../../assets/verificar.png')} style={styles.uniformImageButton} />
              </TouchableOpacity>
            )}
          </View>

          {/* FOOTER */}
          <View style={styles.footerSection}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Register')}>
              <Image source={require('../../assets/registrarse.png')} style={styles.footerRectButton} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleForgotPassword}>
              <Image source={require('../../assets/recucontra.png')} style={styles.footerRectButton} />
            </TouchableOpacity>
          </View>
        
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#001f3f' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 15, justifyContent: 'space-between' },
  exitButton: { position: 'absolute', top: 35, right: 15, zIndex: 10 },
  exitIcon: { width: 40, height: 40, resizeMode: 'contain' },
  headerSection: { alignItems: 'center', marginTop: 45 },
  logo: { width: 110, height: 110, resizeMode: 'contain' },
  appName: { width: 200, height: 50, resizeMode: 'contain' },
  fullWidthTitleStrip: { backgroundColor: '#000', width: '120%', paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  titleStripText: { color: '#ffcc00', fontSize: 16, fontWeight: 'bold' },
  formSection: { marginVertical: 20, padding: 15, borderWidth: 1, borderColor: '#FFD700', borderRadius: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d3d3d3', borderRadius: 10, marginBottom: 12, paddingHorizontal: 10, height: 55 },
  inputIcon: { width: 35, height: 35, resizeMode: 'contain', marginRight: 10 },
  input: { flex: 1, color: '#000', fontSize: 15 },
  buttonWrapper: { width: '100%', alignItems: 'center', marginTop: 5 },
  uniformImageButton: { width: '100%', height: 70, resizeMode: 'contain' },
  footerSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 'auto' },
  navButton: { flex: 1 },
  footerRectButton: { width: '100%', height: 65, resizeMode: 'contain' } 
});