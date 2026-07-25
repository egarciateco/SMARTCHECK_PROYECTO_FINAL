import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Image, 
  TouchableOpacity, Platform, Modal, TextInput, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function AdminPanelScreen({ navigation }) {
  const { logout } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(() => {
      logout();
    }, 1000);
  };

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const response = await api.get('/api/users/usuarios');
        if (response.data && response.data.status === 'success') {
          setUsuarios(response.data.usuarios);
        } else {
          console.error("Error en respuesta del servidor:", response.data?.mensaje || "Respuesta vacía");
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error.message);
        Alert.alert("Error", "No se pudieron cargar los usuarios.");
      } finally {
        setLoading(false);
      }
    };
    obtenerUsuarios();
  }, []);

  const handleSavePassword = async () => {
    if (newPassword.length < 4) {
      Alert.alert("Error", "La contraseña debe tener al menos 4 dígitos");
      return;
    }
    await AsyncStorage.setItem('admin_pass', newPassword);
    Alert.alert("Éxito", "Contraseña actualizada");
    setNewPassword('');
    setModalVisible(false);
  };

  const calcularEdad = (nacimiento) => {
    try {
      const partes = nacimiento.split('/');
      const nDate = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      const hoy = new Date();
      let edad = hoy.getFullYear() - nDate.getFullYear();
      const mDiff = hoy.getMonth() - nDate.getMonth();
      if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nDate.getDate())) edad--;
      return edad.toString();
    } catch (e) { return "N/A"; }
  };

  const renderUserItem = ({ item }) => {
    let nacimiento = item.fechaNacimiento || (item.dia ? `${item.dia}/${item.mes}/${item.anio}` : "N/A");
    const edad = calcularEdad(nacimiento);
    const imagenUri = item.foto || item.image || null;
    const partesUbicacion = [item.localidad, item.provincia].filter(Boolean);
    const textoUbicacion = partesUbicacion.length > 0 ? partesUbicacion.join(' - ') : "Ubicación no especificada";

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {item.apellido ? `${item.apellido.toUpperCase()}, ${item.nombre}` : item.nombre}
          </Text>
          <Text style={styles.cardText}>Sexo: {item.sexo || 'N/A'} | Edad: {edad}</Text>
          <Text style={styles.cardText}>Fecha Nac.: {nacimiento}</Text>
          <Text style={styles.cardText} numberOfLines={1}>Lugar: {textoUbicacion}</Text>
          <Text style={styles.cardText} numberOfLines={1}>Email: {item.email || item.correo || "No registrado"}</Text>
        </View>
        <View style={styles.imageContainer}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={35} color="#666" />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Image source={require('../../assets/logo.png')} style={styles.headerLogo} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.headerAppName} />
      </View>

      <View style={styles.blackBanner}>
        <Text style={styles.blackBannerText}>PANEL DE ADMINISTRACIÓN</Text>
      </View>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item._id || item.email}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listPadding}
      />

      {/* Modal para Admin Pass */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Nueva Contraseña Admin</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="numeric" 
              secureTextEntry 
              value={newPassword} 
              onChangeText={setNewPassword} 
              maxLength={10}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#555'}]} onPress={() => setModalVisible(false)}>
                <Text style={{color: '#fff'}}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#ff8c00'}]} onPress={handleSavePassword}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.lineaDorada} />
      
      {/* Footer con Navegación Verificada */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('HomeScreen')}>
          <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="key-outline" size={40} color="#ff8c00" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn} onPress={handleLogoutFlow}>
          <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tus estilos se mantienen intactos
  container: { flex: 1, backgroundColor: '#001a33' },
  center: { justifyContent: 'center', alignItems: 'center' },
  topHeader: { height: 70, backgroundColor: '#001a33', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerLogo: { width: 45, height: 45, resizeMode: 'contain' },
  headerAppName: { flex: 1, height: 35, resizeMode: 'contain', marginRight: 45 },
  blackBanner: { backgroundColor: '#000', paddingVertical: 12, alignItems: 'center', width: '100%' },
  blackBannerText: { color: '#ffcc00', fontSize: 16, fontWeight: 'bold' },
  listPadding: { paddingBottom: 100, paddingTop: 8 },
  card: { backgroundColor: '#0c2340', borderRadius: 10, padding: 12, marginVertical: 6, marginHorizontal: 16, borderWidth: 1, borderColor: '#1a4a6e', flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardName: { color: '#00fa9a', fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  cardText: { color: '#fff', fontSize: 12, marginBottom: 2 },
  imageContainer: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#16355a', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#ff8c00', marginLeft: 10 },
  avatarImage: { width: '100%', height: '100%' },
  lineaDorada: { position: 'absolute', bottom: 80, left: 0, right: 0, height: 2, backgroundColor: '#ffcc00' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#001a33', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 15 : 0 },
  footerBtn: { padding: 5 },
  navIcon: { width: 45, height: 45, resizeMode: 'contain' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalView: { margin: 20, backgroundColor: '#0c2340', borderRadius: 15, padding: 25, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  modalInput: { width: '100%', backgroundColor: '#fff', padding: 10, borderRadius: 8, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 15 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }
});