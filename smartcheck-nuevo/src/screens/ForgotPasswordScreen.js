import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { auth } from '../services/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) { 
      Alert.alert("Atención", "Por favor ingresa tu email"); 
      return; 
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      Alert.alert("Éxito", "Si el correo está registrado, recibirás un mensaje para restablecer tu contraseña.");
      navigation.goBack();
    } catch (error) {
      // Manejo de errores específicos
      let message = "No se pudo procesar la solicitud.";
      if (error.code === 'auth/invalid-email') message = "El formato del email no es válido.";
      else if (error.code === 'auth/user-not-found') message = "No existe una cuenta con este correo.";
      
      Alert.alert("Error", message);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo y Nombre */}
          <View style={styles.headerSection}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Image source={require('../../assets/nombreapp.png')} style={styles.appName} />
            
            {/* Franja amarilla */}
            <View style={styles.fullWidthTitleStrip}>
              <Text style={styles.titleStripText}>RECUPERAR CONTRASEÑA</Text>
            </View>
          </View>

          {/* Recuadro de línea fina dorada */}
          <View style={styles.formSection}>
            <View style={styles.inputRow}>
              <Image source={require('../../assets/email.png')} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Ingresa tu email" 
                placeholderTextColor="#555"
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Botones */}
            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
              <Text style={styles.buttonText}>Enviar Correo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#001f3f' },
  scrollContent: { flexGrow: 1, padding: 15, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 120, height: 120, resizeMode: 'contain' },
  appName: { width: 220, height: 60, resizeMode: 'contain' },
  fullWidthTitleStrip: { backgroundColor: '#000', width: '120%', paddingVertical: 10, alignItems: 'center', marginVertical: 15 },
  titleStripText: { color: '#ffcc00', fontSize: 18, fontWeight: 'bold' },
  formSection: { padding: 20, borderWidth: 1, borderColor: '#FFD700', borderRadius: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d3d3d3', borderRadius: 10, marginBottom: 20, paddingHorizontal: 10, height: 60 },
  inputIcon: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  input: { flex: 1, color: '#000', fontSize: 16 },
  actionButton: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#001f3f' },
  cancelButton: { padding: 10, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' }
});