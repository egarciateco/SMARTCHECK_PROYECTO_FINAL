import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Image, 
  Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Modal, FlatList, Keyboard 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { 
    registerPhotoUri, 
    setRegisterPhotoUri, 
    registerFormData, 
    setRegisterFormData, 
    clearRegisterData 
  } = useAuth();

  // Inicializar con los datos guardados en el contexto global
  const [nombre, setNombre] = useState(registerFormData.nombre);
  const [apellido, setApellido] = useState(registerFormData.apellido);
  const [email, setEmail] = useState(registerFormData.email);
  const [dia, setDia] = useState(registerFormData.dia);
  const [mes, setMes] = useState(registerFormData.mes);
  const [anio, setAnio] = useState(registerFormData.anio);
  const [sexo, setSexo] = useState(registerFormData.sexo);
  const [password, setPassword] = useState(registerFormData.password);
  const [confirmPassword, setConfirmPassword] = useState(registerFormData.confirmPassword);
  const [authMode, setAuthMode] = useState(registerFormData.authMode);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(Boolean(registerPhotoUri));
  const [photoUri, setPhotoUri] = useState(registerPhotoUri);
  const [loading, setLoading] = useState(false);
  const [sexoModalVisible, setSexoModalVisible] = useState(false);

  const mesRef = useRef(null);
  const anioRef = useRef(null);

  const sexoOptions = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'];

  useLayoutEffect(() => navigation.setOptions({ headerShown: false }), [navigation]);

  // Actualizar el contexto cada vez que el usuario escriba en el formulario
  useEffect(() => {
    setRegisterFormData({
      nombre,
      apellido,
      email,
      dia,
      mes,
      anio,
      sexo,
      password,
      confirmPassword,
      authMode,
    });
  }, [nombre, apellido, email, dia, mes, anio, sexo, password, confirmPassword, authMode]);

  // Capturar la foto que viene de FacialLoginScreen
  useEffect(() => {
    if (registerPhotoUri) {
      setHasPhoto(true);
      setPhotoUri(registerPhotoUri);
    }
  }, [registerPhotoUri]);

  const areStandardFieldsComplete = Boolean(
    nombre.trim() && apellido.trim() && email.trim() && dia && mes && anio && sexo
  );

  const isPasswordValid = Boolean(password && /^\d{4,}$/.test(password) && password === confirmPassword);
  
  const isFormComplete = areStandardFieldsComplete && (
    (authMode === 'password' && isPasswordValid) ||
    (authMode === 'photo' && hasPhoto)
  );

  const isFaceLoginActive = areStandardFieldsComplete && authMode === 'photo';

  // Función de validación de fecha estricta en el frontend
  const validarFechaFrontend = (dStr, mStr, aStr) => {
    const d = parseInt(dStr, 10);
    const m = parseInt(mStr, 10);
    const a = parseInt(aStr, 10);

    if (isNaN(d) || isNaN(m) || isNaN(a)) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    
    const currentYear = new Date().getFullYear();
    if (a < 1900 || a > currentYear) return false;

    // Verificar si el día existe realmente en el mes/año dado (ej: 31/02 no existe, bisiestos, etc.)
    const dateObj = new Date(a, m - 1, d);
    if (
      dateObj.getFullYear() !== a ||
      dateObj.getMonth() !== m - 1 ||
      dateObj.getDate() !== d
    ) {
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!areStandardFieldsComplete) {
      return Alert.alert("Error", "Por favor completa todos los campos obligatorios.");
    }

    // Validación estricta de la fecha antes de proceder con cualquier método
    if (!validarFechaFrontend(dia, mes, anio)) {
      return Alert.alert(
        "Atención",
        "La fecha de nacimiento ingresada es errónea. Por favor, vuelva a ingresarla correctamente."
      );
    }

    if (authMode === null) {
      return Alert.alert("Error", "Por favor selecciona un método de registro (con contraseña o con foto).");
    }

    if (authMode === 'password') {
      if (!password) {
        return Alert.alert("Error", "Por favor ingresa una contraseña.");
      }
      const isNumeric = /^\d+$/.test(password);
      if (!isNumeric || password.length < 4) {
        return Alert.alert("Error", "La contraseña debe ser de al menos 4 dígitos numéricos y no contener letras.");
      }
      if (!confirmPassword) {
        return Alert.alert("Error", "Por favor confirma tu contraseña.");
      }
      if (password !== confirmPassword) {
        return Alert.alert("Error", "Las contraseñas no coinciden.");
      }
    }

    if (authMode === 'photo') {
      if (!hasPhoto || !photoUri) {
        return Alert.alert("Error", "Por favor tómate la foto de perfil con reconocimiento facial.");
      }
    }

    try {
      setLoading(true);
      const emailFinal = email.trim().toLowerCase();
      const fechaNacimientoFinal = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;

      if (authMode === 'password') {
        await createUserWithEmailAndPassword(auth, emailFinal, password);
        clearRegisterData();
        Alert.alert("¡Éxito!", "Registro completado correctamente.");
        navigation.replace('HomeScreen');
      } else if (authMode === 'photo') {
        const formData = new FormData();
        formData.append('nombre', nombre.trim());
        formData.append('apellido', apellido.trim());
        formData.append('email', emailFinal);
        formData.append('sexo', sexo);
        formData.append('fechaNacimiento', fechaNacimientoFinal);
        
        if (photoUri) {
          const filename = photoUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('imageFile', {
            uri: photoUri,
            name: filename || 'photo.jpg',
            type,
          });
        }

        const response = await fetch('https://smartcheck-proyecto.onrender.com/api/users/register-facial', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.mensaje || 'Error en el registro facial');
        }

        clearRegisterData();
        Alert.alert("¡Éxito!", "Registro facial completado correctamente.");
        navigation.replace('HomeScreen');
      }
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Atención", error.message || "No se pudo completar el registro.");
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
          <Text style={styles.titleText}>FORMULARIO DE REGISTRO</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.formFrame}>
            <View style={styles.inputContainer}>
              <Image source={require('../../assets/perfil.png')} style={styles.smallEmoji} />
              <TextInput 
                style={styles.input} 
                placeholder="Nombre" 
                placeholderTextColor="#AAAAAA"
                value={nombre} 
                onChangeText={setNombre} 
              />
              {nombre ? (
                <TouchableOpacity onPress={() => setNombre('')} style={styles.clearBtn}>
                  <Text style={styles.clearText}>🗑️</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Image source={require('../../assets/perfil.png')} style={styles.smallEmoji} />
              <TextInput 
                style={styles.input} 
                placeholder="Apellido" 
                placeholderTextColor="#AAAAAA"
                value={apellido} 
                onChangeText={setApellido} 
              />
              {apellido ? (
                <TouchableOpacity onPress={() => setApellido('')} style={styles.clearBtn}>
                  <Text style={styles.clearText}>🗑️</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Image source={require('../../assets/email.png')} style={styles.largeEmoji} />
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#AAAAAA"
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
              />
              {email ? (
                <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                  <Text style={styles.clearText}>🗑️</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Image source={require('../../assets/fechanac.png')} style={styles.largeEmoji} />
              <View style={styles.dateContainer}>
                <TextInput 
                  style={styles.dateInput} 
                  placeholder="DD" 
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric" 
                  maxLength={2}
                  value={dia} 
                  onChangeText={(text) => {
                    setDia(text);
                    if (text.length === 2) {
                      mesRef.current?.focus();
                    }
                  }} 
                />
                <Text style={styles.dateSlash}>/</Text>
                <TextInput 
                  ref={mesRef}
                  style={styles.dateInput} 
                  placeholder="MM" 
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric" 
                  maxLength={2}
                  value={mes} 
                  onChangeText={(text) => {
                    setMes(text);
                    if (text.length === 2) {
                      anioRef.current?.focus();
                    }
                  }} 
                />
                <Text style={styles.dateSlash}>/</Text>
                <TextInput 
                  ref={anioRef}
                  style={styles.dateInputYear} 
                  placeholder="AAAA" 
                  placeholderTextColor="#AAAAAA"
                  keyboardType="numeric" 
                  maxLength={4}
                  value={anio} 
                  onChangeText={(text) => {
                    setAnio(text);
                    if (text.length === 4) {
                      Keyboard.dismiss();
                      setSexoModalVisible(true);
                    }
                  }} 
                />
              </View>
              {(dia || mes || anio) ? (
                <TouchableOpacity onPress={() => { setDia(''); setMes(''); setAnio(''); }} style={styles.clearBtn}>
                  <Text style={styles.clearText}>🗑️</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Image source={require('../../assets/sexo.png')} style={styles.largeEmoji} />
              <TouchableOpacity 
                style={{ flex: 1, justifyContent: 'center' }} 
                onPress={() => {
                  Keyboard.dismiss();
                  setSexoModalVisible(true);
                }}
              >
                <Text style={[styles.input, { color: sexo ? '#000' : '#AAAAAA', textAlignVertical: 'center', lineHeight: 46 }]}>
                  {sexo || 'Sexo'}
                </Text>
              </TouchableOpacity>
              {sexo ? (
                <TouchableOpacity onPress={() => setSexo('')} style={styles.clearBtn}>
                  <Text style={styles.clearText}>🗑️</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {authMode === 'password' ? (
              <>
                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/candado.png')} style={styles.largeEmoji} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Contraseña" 
                    placeholderTextColor="#AAAAAA"
                    secureTextEntry={!showPassword} 
                    value={password} 
                    onChangeText={setPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginRight: 6 }}>
                    <Image source={showPassword ? require('../../assets/eye.png') : require('../../assets/eyeoff.png')} style={styles.eyeIcon} />
                  </TouchableOpacity>
                  {password ? (
                    <TouchableOpacity onPress={() => setPassword('')} style={styles.clearBtn}>
                      <Text style={styles.clearText}>🗑️</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Image source={require('../../assets/candado.png')} style={styles.largeEmoji} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Confirmar Contraseña" 
                    placeholderTextColor="#AAAAAA"
                    secureTextEntry={!showConfirmPassword} 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ marginRight: 6 }}>
                    <Image source={showConfirmPassword ? require('../../assets/eye.png') : require('../../assets/eyeoff.png')} style={styles.eyeIcon} />
                  </TouchableOpacity>
                  {confirmPassword ? (
                    <TouchableOpacity onPress={() => setConfirmPassword('')} style={styles.clearBtn}>
                      <Text style={styles.clearText}>🗑️</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={styles.authModeRow}>
                <TouchableOpacity 
                  onPress={() => setAuthMode('password')} 
                  style={[
                    styles.authModeBtn, 
                    { backgroundColor: authMode === 'password' ? '#28a745' : '#fff' }
                  ]}
                >
                  <Text style={[
                    styles.authModeText, 
                    { color: authMode === 'password' ? '#fff' : '#00BFFF' }
                  ]}>
                    Registrarse con contraseña
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => { setAuthMode('photo'); setPassword(''); setConfirmPassword(''); }} 
                  style={[
                    styles.authModeBtn, 
                    { backgroundColor: authMode === 'photo' ? '#28a745' : '#fff' }
                  ]}
                >
                  <Text style={[
                    styles.authModeText, 
                    { color: authMode === 'photo' ? '#fff' : '#00BFFF' }
                  ]}>
                    {hasPhoto ? "Foto capturada ✓" : "Registrarse con foto"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, !isFormComplete && { opacity: 0.5 }]} 
              onPress={handleRegister} 
              disabled={!isFormComplete || loading}
            >
              {loading ? (
                <ActivityIndicator color="#001f3f" />
              ) : (
                <Image source={require('../../assets/registrarse.png')} style={styles.actionImg} />
              )}
            </TouchableOpacity>

            {authMode === 'password' ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setAuthMode(null); setPassword(''); setConfirmPassword(''); }}>
                <Image source={require('../../assets/cancelar.png')} style={styles.cancelImg} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, !isFaceLoginActive && { opacity: 0.5 }]} 
                onPress={() => navigation.navigate('FacialLogin', { returnScreen: 'RegisterScreen' })}
                disabled={!isFaceLoginActive}
              >
                <Image source={require('../../assets/facelogin.png')} style={styles.actionImg} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footerWrapper}>
          <View style={styles.footerLine} />
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => { clearRegisterData(); navigation.goBack(); }}>
              <Image source={require('../../assets/volver.png')} style={styles.navIconCeleste} />
            </TouchableOpacity>

            {!isFormComplete && (
              <Text style={styles.mandatoryNoticeFooter}>Todos los datos son obligatorios</Text>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Goodbye')}>
              <Image source={require('../../assets/salir.png')} style={styles.navIconCeleste} />
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={sexoModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSexoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccione Sexo</Text>
              <FlatList
                data={sexoOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalOption} 
                    onPress={() => {
                      Keyboard.dismiss();
                      setSexo(item);
                      setSexoModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => {
                  Keyboard.dismiss();
                  setSexoModalVisible(false);
                }}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 6, paddingHorizontal: 10 },
  logo: { width: 75, height: 75, resizeMode: 'contain' },
  appNameImage: { width: 190, height: 48, resizeMode: 'contain', marginLeft: 12 },
  blackBar: { backgroundColor: '#000', paddingVertical: 8, alignItems: 'center' },
  titleText: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  contentContainer: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'space-between' },
  formFrame: { borderWidth: 2, borderColor: '#FFD700', borderRadius: 12, paddingTop: 12, paddingBottom: 4, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 11, paddingLeft: 6, paddingRight: 10, borderRadius: 8, height: 46 },
  smallEmoji: { width: 24, height: 24, marginRight: 8, resizeMode: 'contain' },
  largeEmoji: { width: 42, height: 42, marginRight: 8, resizeMode: 'contain' },
  input: { flex: 1, fontSize: 12, color: '#000', height: '100%', textAlignVertical: 'center' },
  dateContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dateInput: { width: 32, fontSize: 12, color: '#000', textAlign: 'center', height: '100%', textAlignVertical: 'center' },
  dateInputYear: { width: 50, fontSize: 12, color: '#000', textAlign: 'center', height: '100%', textAlignVertical: 'center' },
  dateSlash: { fontSize: 13, color: '#AAAAAA', marginHorizontal: 2 },
  eyeIcon: { width: 20, height: 20, resizeMode: 'contain' },
  clearBtn: { padding: 4, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  clearText: { fontSize: 14 },
  authModeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  authModeBtn: { flex: 1, height: 46, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, paddingHorizontal: 4 },
  authModeText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  mandatoryNoticeFooter: { color: '#FFD700', fontSize: 10, textAlign: 'center', flex: 1, marginHorizontal: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  actionBtn: { flex: 1, alignItems: 'center', marginHorizontal: 6, height: 82, justifyContent: 'center' },
  actionImg: { width: '100%', height: 82, resizeMode: 'contain' },
  cancelImg: { width: '68%', height: 82, resizeMode: 'contain' },
  footerWrapper: { width: '100%', paddingHorizontal: 25, paddingBottom: 8 },
  footerLine: { width: '100%', height: 1, backgroundColor: '#FFD700', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navIconCeleste: { width: 40, height: 40, resizeMode: 'contain', tintColor: '#00BFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#001f3f', marginBottom: 15 },
  modalOption: { paddingVertical: 12, width: '100%', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  modalCloseBtn: { marginTop: 15, backgroundColor: '#001f3f', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: '#fff', fontSize: 13, fontWeight: 'bold' }
});