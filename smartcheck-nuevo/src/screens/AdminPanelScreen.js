import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Image, 
  TouchableOpacity, Platform, BackHandler, Modal, TextInput, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Importante para la función logout

export default function AdminPanelScreen({ navigation }) {
  const { logout } = useAuth(); // Obtenemos la función logout del contexto
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el cambio de contraseña
  const [modalVisible, setModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const obtenerUsuariosTelemetry = async () => {
      try {
        const respuesta = await fetch('https://smartcheck-proyecto-final.onrender.com/api/users/admin');
        const json = await respuesta.json();
        if (json.status === 'success') {
          setUsuarios(json.usuarios);
        }
      } catch (error) {
        console.error("Error cargando telemetría de administración:", error);
      } finally {
        setLoading(false);
      }
    };
    obtenerUsuariosTelemetry();
  }, []);

  // Función para guardar la nueva contraseña
  const handleSavePassword = async () => {
    if (newPassword.length < 4) {
      Alert.alert("Error", "La contraseña debe tener al menos 4 dígitos");
      return;
    }
    await AsyncStorage.setItem('admin_pass', newPassword);
    Alert.alert("Éxito", "Contraseña de administrador actualizada correctamente");
    setNewPassword('');
    setModalVisible(false);
  };

  const calcularDatosItem = (item) => {
    let nacimiento = "12/02/1968";
    let edadCalculada = "58 años";

    if (item.fechaNacimiento) {
      nacimiento = item.fechaNacimiento;
    } else if (item.dia && item.mes && item.anio) {
      nacimiento = `${String(item.dia).padStart(2, '0')}/${String(item.mes).padStart(2, '0')}/${item.anio}`;
    }

    try {
      const partes = nacimiento.split('/');
      if (partes.length === 3) {
        const nDate = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        const hoy = new Date();
        let edad = hoy.getFullYear() - nDate.getFullYear();
        const mDiff = hoy.getMonth() - nDate.getMonth();
        if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nDate.getDate())) {
          edad--;
        }
        edadCalculada = `${edad} años`;
      }
    } catch (e) {
      if (item.anio) edadCalculada = `${2026 - parseInt(item.anio)} años`;
    }

    return { nacimiento, edadCalculada };
  };

  const renderUserItem = ({ item }) => {
    const { nacimiento, edadCalculada } = calcularDatosItem(item);
    const imagenUri = item.foto || item.image || null;

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {item.apellido ? `${item.apellido.toUpperCase()}, ${item.nombre}` : item.nombre}
          </Text>
          <Text style={styles.cardText}>Email: {item.email || item.correo}</Text>
          <Text style={styles.cardText}>Sexo: {item.sexo || 'M'}</Text>
          <Text style={styles.cardTextHighlight}>
            Nac.: {nacimiento} | Edad: {edadCalculada}
          </Text>
        </View>
        <View style={styles.imageContainer}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={28} color="#666" />
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
      {/* Header de navegación */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administración</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.blackBanner}>
        <Text style={styles.blackBannerText}>PANEL DEL ADMINISTRADOR</Text>
      </View>
      <View style={styles.lineaNaranja} />

      {/* Botón de Cambio de Contraseña */}
      <TouchableOpacity style={styles.btnChangePass} onPress={() => setModalVisible(true)}>
        <Ionicons name="key-outline" size={18} color="#fff" />
        <Text style={styles.btnChangeText}>Cambiar Contraseña Admin</Text>
      </TouchableOpacity>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item._id || item.email}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      {/* MODAL PARA CAMBIO DE CONTRASEÑA */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Nueva Contraseña Admin</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ej: 9999" 
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/volver.png')} style={styles.footerIcon} resizeMode="contain" />
        </TouchableOpacity>
        
        {/* BOTÓN SALIR: Ahora llama directamente a logout() */}
        <TouchableOpacity style={styles.footerBtn} onPress={logout}>
          <Image source={require('../../assets/salir.png')} style={styles.footerIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001a33' },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerNav: { height: 60, backgroundColor: '#0c2340', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  blackBanner: { backgroundColor: '#000', paddingVertical: 12, alignItems: 'center', width: '100%' },
  blackBannerText: { color: '#ff8c00', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  lineaNaranja: { width: '100%', height: 2, backgroundColor: '#ff8c00' },
  
  // Botón cambio contraseña
  btnChangePass: { flexDirection: 'row', backgroundColor: '#1a4a6e', padding: 10, margin: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 5 },
  btnChangeText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  listPadding: { paddingBottom: 95, paddingTop: 8 },
  card: { backgroundColor: '#0c2340', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginVertical: 5, marginHorizontal: 16, borderWidth: 1, borderColor: '#1a4a6e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, paddingRight: 10 },
  cardName: { color: '#00fa9a', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  cardText: { color: '#fff', fontSize: 12, marginBottom: 1 },
  cardTextHighlight: { color: '#e0e0e0', fontSize: 12, fontWeight: '500', marginTop: 1 },
  imageContainer: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#16355a', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#ff8c00' },
  avatarImage: { width: '100%', height: '100%' },
  
  // Modal Estilos
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalView: { margin: 20, backgroundColor: '#0c2340', borderRadius: 15, padding: 25, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  modalInput: { width: '100%', backgroundColor: '#fff', padding: 10, borderRadius: 8, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 15 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#001a33', borderTopWidth: 1, borderColor: '#1a4a6e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingBottom: Platform.OS === 'ios' ? 15 : 0 },
  footerBtn: { padding: 5 },
  footerIcon: { width: 36, height: 36 }
});