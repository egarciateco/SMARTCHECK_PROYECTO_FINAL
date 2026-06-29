import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, BackHandler, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen() {
  const navigation = useNavigation();
  
  const diaRef = useRef(null);
  const mesRef = useRef(null);
  const anioRef = useRef(null);
  
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmPassword: '', sexo: '', dia: '', mes: '', anio: '' });
  const [metodo, setMetodo] = useState(null); 

  const handleInputChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDateChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, [field]: numericValue }));
    
    if (field === 'dia' && numericValue.length === 2 && mesRef.current) mesRef.current.focus();
    if (field === 'mes' && numericValue.length === 2 && anioRef.current) anioRef.current.focus();
  };

  const validarYRegistrar = () => {
    if (!form.nombre || !form.apellido || !form.email || !form.sexo) return Alert.alert("Error", "Faltan completar datos.");
    if (form.dia.length !== 2 || form.mes.length !== 2 || form.anio.length !== 4) return Alert.alert("Error", "La fecha debe ser DD-MM-AAAA completa.");
    
    if (metodo === 'password') {
        if (form.password !== form.confirmPassword) return Alert.alert("Error", "Las contraseñas no coinciden.");
        Alert.alert("Registro", "Registro exitoso.");
    } else {
        // Navegación corregida hacia 'Camera' (como está definido en tu App.js)
        navigation.navigate('Camera', { 
            tipoOperacion: 'REGISTER', 
            datosRegistro: { ...form, fechaNacimiento: `${form.dia}/${form.mes}/${form.anio}` } 
        });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
      </View>
      <View style={styles.blackBar}><Text style={styles.titleText}>REGISTRO DE USUARIO</Text></View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formFrame}>
          <View style={styles.inputContainer}><Text style={styles.emoji}>👤</Text><TextInput style={styles.input} placeholder="Nombre" onChangeText={(v) => handleInputChange('nombre', v)} /></View>
          <View style={styles.inputContainer}><Text style={styles.emoji}>👤</Text><TextInput style={styles.input} placeholder="Apellido" onChangeText={(v) => handleInputChange('apellido', v)} /></View>
          <View style={styles.inputContainer}><Text style={styles.emoji}>📧</Text><TextInput style={styles.input} placeholder="Email" keyboardType="email-address" onChangeText={(v) => handleInputChange('email', v)} /></View>

          <View style={styles.dateRow}>
            <Text style={styles.emoji}>📅</Text>
            <TextInput ref={diaRef} style={styles.dateBox} placeholder="DD" maxLength={2} keyboardType="numeric" onChangeText={(v) => handleDateChange('dia', v)} />
            <Text style={styles.slash}>/</Text>
            <TextInput ref={mesRef} style={styles.dateBox} placeholder="MM" maxLength={2} keyboardType="numeric" onChangeText={(v) => handleDateChange('mes', v)} />
            <Text style={styles.slash}>/</Text>
            <TextInput ref={anioRef} style={styles.dateBoxYear} placeholder="AAAA" maxLength={4} keyboardType="numeric" onChangeText={(v) => handleDateChange('anio', v)} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.emoji}>🚻</Text>
            <Picker selectedValue={form.sexo} onValueChange={(v) => handleInputChange('sexo', v)} style={{flex: 1}}>
                <Picker.Item label="Seleccionar sexo..." value="" />
                <Picker.Item label="Masculino" value="M" />
                <Picker.Item label="Femenino" value="F" />
                <Picker.Item label="Otro" value="O" />
            </Picker>
          </View>

          {!metodo && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.metalBtn} onPress={() => setMetodo('password')}><Text style={styles.metalBtnTxt}>POR{"\n"}CONTRASEÑA</Text></TouchableOpacity>
              <TouchableOpacity style={styles.metalBtn} onPress={() => setMetodo('facial')}><Text style={styles.metalBtnTxt}>RECONOCIMIENTO{"\n"}FACIAL</Text></TouchableOpacity>
            </View>
          )}

          {metodo === 'password' && (
            <View>
              <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Contraseña" secureTextEntry onChangeText={(v) => handleInputChange('password', v)} /></View>
              <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Confirmar" secureTextEntry onChangeText={(v) => handleInputChange('confirmPassword', v)} /></View>
              <TouchableOpacity style={styles.finalBtn} onPress={validarYRegistrar}><Text style={styles.btnTxt}>FINALIZAR</Text></TouchableOpacity>
            </View>
          )}

          {metodo === 'facial' && (
            <View style={{alignItems: 'center'}}>
              <Text style={styles.aviso}>⚠️ No uses anteojos. Ubica tu cara en el óvalo.</Text>
              <TouchableOpacity onPress={validarYRegistrar}><Image source={require('../../assets/btn_biometria_facial.png')} style={styles.btnBio} /></TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Image source={require('../../assets/volver.png')} style={styles.navIcon} /></TouchableOpacity>
        <TouchableOpacity onPress={() => BackHandler.exitApp()}><Image source={require('../../assets/salir.png')} style={styles.navIcon} /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 60, height: 60, resizeMode: 'contain' },
  nombreApp: { width: 140, height: 40, resizeMode: 'contain', marginLeft: 10 },
  blackBar: { backgroundColor: '#000', padding: 10, alignItems: 'center' },
  titleText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  formFrame: { borderWidth: 1, borderColor: '#ffa500', borderRadius: 10, padding: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 10, paddingHorizontal: 10, borderRadius: 5 },
  input: { flex: 1, padding: 12 },
  emoji: { marginRight: 10, fontSize: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 10, padding: 10, borderRadius: 5, justifyContent: 'space-between' },
  dateBox: { flex: 1, textAlign: 'center', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, fontSize: 16 },
  dateBoxYear: { flex: 1.5, textAlign: 'center', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, fontSize: 16 },
  slash: { fontSize: 20, fontWeight: 'bold', color: '#888', marginHorizontal: 5 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metalBtn: { backgroundColor: '#c0c0c0', padding: 8, borderRadius: 5, width: '48%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#808080', elevation: 5 },
  metalBtnTxt: { fontWeight: '900', color: '#000', fontSize: 10, textAlign: 'center', lineHeight: 12 },
  finalBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  btnTxt: { fontWeight: '800', color: '#001f3f', textAlign: 'center' },
  btnBio: { width: 200, height: 80, resizeMode: 'contain' },
  aviso: { color: '#ffa500', textAlign: 'center', marginBottom: 10, fontSize: 12 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 20 },
  navIcon: { width: 45, height: 45, resizeMode: 'contain' }
});