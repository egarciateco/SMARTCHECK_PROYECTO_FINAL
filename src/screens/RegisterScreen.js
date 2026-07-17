import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Keyboard,
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import api from '../config/api'; 

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  const diaRef = useRef(null);
  const mesRef = useRef(null);
  const anioRef = useRef(null);
  
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmPassword: '', sexo: '', dia: '', mes: '', anio: '' });
  const [metodo, setMetodo] = useState(null); 
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirm, setVerConfirm] = useState(false);

  const handleInputChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDateChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, [field]: numericValue }));
    if (field === 'dia' && numericValue.length === 2 && mesRef.current) mesRef.current.focus();
    if (field === 'mes' && numericValue.length === 2 && anioRef.current) anioRef.current.focus();
  };

  const handleSalir = () => {
    navigation.navigate('Goodbye');
  };

  const validarYRegistrar = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.sexo) return Alert.alert("Error", "Faltan completar datos.");
    if (form.dia.length !== 2 || form.mes.length !== 2 || form.anio.length !== 4) return Alert.alert("Error", "La fecha debe ser DD-MM-AAAA completa.");
    
    const stringFecha = `${form.dia}/${form.mes}/${form.anio}`;

    if (metodo === 'password') {
        if (form.password !== form.confirmPassword) return Alert.alert("Error", "Las contraseñas no coinciden.");
        
        try {
            await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
            
            const formData = new FormData();
            formData.append('nombre', form.nombre);
            formData.append('apellido', form.apellido);
            formData.append('email', form.email.trim().toLowerCase());
            formData.append('sexo', form.sexo);
            formData.append('fechaNacimiento', stringFecha);
            
            await api.post('/api/users/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert("Éxito", "Usuario registrado correctamente.");
            navigation.navigate('Login');
        } catch (error) {
            console.error("Error al registrar:", error);
            if (error.response && error.response.status === 429) {
                Alert.alert("Servidor Ocupado", error.response.data.mensaje || "El servidor está saturado. Intenta de nuevo en unos segundos.");
            } else {
                const errorMsg = error.response?.data?.mensaje || error.message || "Ocurrió un error al registrar.";
                Alert.alert("Error", errorMsg);
            }
        }
    } else {
        navigation.navigate('Camera', { 
            tipoOperacion: 'REGISTER', 
            datosRegistro: { ...form, fechaNacimiento: stringFecha } 
        });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {!isKeyboardVisible && (
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
        </View>
      )}
      
      {!isKeyboardVisible && (
        <View style={styles.blackBar}>
          <Text style={styles.titleText}>REGISTRO DE USUARIO</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formFrame}>
          <View style={styles.inputContainer}>
            <Text style={styles.emoji}>👤</Text>
            <TextInput style={styles.input} placeholder="Nombre" onChangeText={(v) => handleInputChange('nombre', v)} />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.emoji}>👤</Text>
            <TextInput style={styles.input} placeholder="Apellido" onChangeText={(v) => handleInputChange('apellido', v)} />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.emoji}>📧</Text>
            <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" onChangeText={(v) => handleInputChange('email', v)} />
          </View>

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
            <Picker selectedValue={form.sexo} onValueChange={(v) => handleInputChange('sexo', v)} style={{flex: 1, height: 40}}>
                <Picker.Item label="Seleccionar sexo..." value="" />
                <Picker.Item label="Masculino" value="M" />
                <Picker.Item label="Femenino" value="F" />
                <Picker.Item label="Otro" value="O" />
            </Picker>
          </View>

          {!metodo && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.metalBtn} onPress={() => setMetodo('password')}>
                <Text style={styles.metalBtnTxt}>POR{"\n"}CONTRASEÑA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.metalBtn} onPress={() => { Keyboard.dismiss(); setMetodo('facial'); }}>
                <Text style={styles.metalBtnTxt}>RECONOCIMIENTO{"\n"}FACIAL</Text>
              </TouchableOpacity>
            </View>
          )}

          {metodo === 'password' && (
            <View>
              <View style={styles.inputContainer}>
                <Text style={styles.emoji}>🔒</Text>
                <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={!verPassword} onChangeText={(v) => handleInputChange('password', v)} />
                <TouchableOpacity onPress={() => setVerPassword(!verPassword)}><Text style={styles.emojiOjo}>{verPassword ? '🙈' : '👁️'}</Text></TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.emoji}>🔒</Text>
                <TextInput style={styles.input} placeholder="Confirmar" secureTextEntry={!verConfirm} onChangeText={(v) => handleInputChange('confirmPassword', v)} />
                <TouchableOpacity onPress={() => setVerConfirm(!verConfirm)}><Text style={styles.emojiOjo}>{verConfirm ? '🙈' : '👁️'}</Text></TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.finalBtn} onPress={validarYRegistrar}>
                <Text style={styles.btnTxt}>FINALIZAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {metodo === 'facial' && (
            <View style={{alignItems: 'center'}}>
              <Text style={styles.avisoFacialActivo}>Para continuar con su registro oprima el botón de Biometría Facial por favor</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer condicional: desaparece cuando el teclado aparece */}
      {!isKeyboardVisible && (
        <View style={styles.footerArea}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
              <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
            </TouchableOpacity>
            
            {metodo === 'facial' ? (
              <TouchableOpacity style={styles.captureButton} onPress={validarYRegistrar}>
                  <Image source={require('../../assets/verificar.png')} style={styles.verifyIcon} />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholderButton} />
            )}
            
            <TouchableOpacity style={styles.navButton} onPress={handleSalir}>
              <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
            </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 50, height: 50, resizeMode: 'contain' },
  nombreApp: { width: 140, height: 35, resizeMode: 'contain', marginLeft: 10 },
  blackBar: { backgroundColor: '#000', paddingVertical: 8, width: '100%', marginVertical: 5 },
  titleText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.8 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 15, justifyContent: 'center' },
  formFrame: { borderWidth: 1, borderColor: '#ffa500', borderRadius: 10, padding: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 8, paddingHorizontal: 10, borderRadius: 5, height: 45 },
  input: { flex: 1, padding: 10 },
  emoji: { marginRight: 10, fontSize: 16 },
  emojiOjo: { marginLeft: 10, fontSize: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 8, paddingHorizontal: 10, borderRadius: 5, justifyContent: 'space-between', height: 45 },
  dateBox: { flex: 1, textAlign: 'center', padding: 5, backgroundColor: '#f0f0f0', borderRadius: 5, fontSize: 15 },
  dateBoxYear: { flex: 1.5, textAlign: 'center', padding: 5, backgroundColor: '#f0f0f0', borderRadius: 5, fontSize: 15 },
  slash: { fontSize: 20, fontWeight: 'bold', color: '#888', marginHorizontal: 5 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metalBtn: { backgroundColor: '#c0c0c0', padding: 8, borderRadius: 5, width: '48%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#808080', elevation: 5 },
  metalBtnTxt: { fontWeight: '900', color: '#000', fontSize: 10, textAlign: 'center', lineHeight: 12 },
  finalBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  btnTxt: { fontWeight: '800', color: '#001f3f', textAlign: 'center' },
  avisoFacialActivo: { color: '#00ffcc', textAlign: 'center', fontWeight: 'bold', marginTop: 10, fontSize: 13 },
  footerArea: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 20, 
    paddingBottom: 15, 
    height: 140 
  },
  navButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  captureButton: { justifyContent: 'center', alignItems: 'center' },
  verifyIcon: { width: 120, height: 120, resizeMode: 'contain' },
  placeholderButton: { width: 120, height: 120 }, 
  navIcon: { width: 42, height: 42, resizeMode: 'contain', tintColor: '#00ffcc' }
});