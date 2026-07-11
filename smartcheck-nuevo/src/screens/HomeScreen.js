import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Modal, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '../utils/storage'; 
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const { user, login, logout } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [adminInput, setAdminInput] = useState('');

  useEffect(() => {
    fetch('https://smartcheck-proyecto-final.onrender.com/api/ping').catch(() => {});

    const inicializarHome = async () => {
      try {
        let datos = route.params || await storage.getUser();
        if (datos && (datos.id || datos._id)) {
          login(datos);
        } else if (!user) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (error) { 
        console.error("Error al inicializar Home:", error); 
      } finally { 
        setCargando(false); 
      }
    };
    inicializarHome();
  }, []);

  const handleAdminAccess = async () => {
    const savedPass = await AsyncStorage.getItem('admin_pass') || '00192';
    
    if (adminInput === savedPass) {
      setAdminInput('');
      setModalVisible(false);
      navigation.navigate('AdminPanel');
    } else {
      Alert.alert("Error", "Contraseña incorrecta.");
      setAdminInput('');
    }
  };

  const renderAvatar = () => {
    const fotoBase64 = user?.foto || user?.image;
    if (!fotoBase64 || typeof fotoBase64 !== 'string') return <Ionicons name="person-circle" size={45} color="#00ffcc" />;
    const cleanUri = `data:image/jpeg;base64,${fotoBase64.replace('data:image/jpeg;base64,', '').replace(/\s/g, '')}`;
    return <Image source={{ uri: cleanUri }} style={styles.userAvatar} />;
  };

  const handleVolverCerrarSesion = () => {
    Alert.alert("Cerrar Sesión", "¿Salir al login?", [
      { text: "Cancelar" },
      { text: "Salir", onPress: async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }
    ]);
  };

  const ejecutarSalidaSegura = () => {
    Alert.alert("Cerrar Aplicación", "¿Estás seguro de que deseas salir?", [
      { text: "No", style: "cancel" },
      { text: "Sí", onPress: () => { setIsExiting(true); navigation.navigate('Goodbye'); } }
    ]);
  };

  if (cargando) return <View style={styles.container}><ActivityIndicator size="large" color="#00ffcc" /></View>;
  if (isExiting) return null; 

  return (
    <View style={styles.container}>
      <View style={styles.header}><View style={{ flex: 1 }} />{renderAvatar()}</View>
      <View style={styles.blackBar}><Text style={styles.welcomeText}>¡BIENVENID@, {user?.nombre?.toUpperCase() || 'USUARIO'}!</Text></View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Perfil')}><Image source={require('../../assets/perfil.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Mi Perfil</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('Busqueda')}><Image source={require('../../assets/lupa.png')} style={styles.btnImg} /><Text style={styles.btnLabel}>Buscar Productos</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuBox} onPress={() => navigation.navigate('FaceLogin')}><Ionicons name="scan-outline" size={38} color="#fff" /><Text style={styles.btnLabel}>Verificar (Biometría)</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuBox, styles.adminBox]} onPress={() => setModalVisible(true)}><Image source={require('../../assets/admin.png')} style={styles.btnImgAdmin} /><Text style={styles.btnLabel}>Panel Admin</Text></TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Acceso Administrador</Text>
          <TextInput 
            style={styles.modalInput} 
            placeholder="Contraseña" 
            secureTextEntry 
            value={adminInput} 
            onChangeText={setAdminInput} 
            keyboardType="numeric"
          />
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#ff4444'}]} onPress={() => setModalVisible(false)}><Text style={{color: '#fff'}}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#00ffcc'}]} onPress={handleAdminAccess}><Text style={{color: '#000'}}>Ingresar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footerArea}>
        <TouchableOpacity onPress={handleVolverCerrarSesion}><Image source={require('../../assets/volver.png')} style={styles.navIcon} /></TouchableOpacity>
        <TouchableOpacity onPress={ejecutarSalidaSegura}><Image source={require('../../assets/salir.png')} style={styles.navIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 15, paddingTop: height * 0.05, alignItems: 'center', marginBottom: 10 },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: '#00ffcc' },
  blackBar: { backgroundColor: '#000', paddingVertical: 8, marginBottom: 15 },
  welcomeText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  menuGrid: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25, gap: 15 },
  menuBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#002a54', width: '100%', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#003b75' },
  adminBox: { borderColor: '#ffcc00', backgroundColor: '#001b3a' }, 
  btnImg: { width: 38, height: 38, resizeMode: 'contain' },
  btnImgAdmin: { width: 38, height: 38, resizeMode: 'contain' }, 
  btnLabel: { color: '#fff', marginLeft: 15, fontWeight: '600', fontSize: 14 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: height * 0.03, paddingTop: 10 },
  navIcon: { width: 42, height: 42, resizeMode: 'contain' },
  modalView: { margin: 20, marginTop: 100, backgroundColor: '#002a54', borderRadius: 20, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: '#ffcc00' },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  modalInput: { backgroundColor: '#fff', width: '100%', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 18, textAlign: 'center' },
  btnAction: { padding: 10, borderRadius: 8, paddingHorizontal: 20 }
});