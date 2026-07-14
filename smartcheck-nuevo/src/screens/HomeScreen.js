import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [adminInput, setAdminInput] = useState('');

  // Sincronización silenciosa de ubicación
  useEffect(() => {
    const sincronizarUbicacion = async () => {
      if (!user?.email) return;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const direccion = await Location.reverseGeocodeAsync({ 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude 
        });

        if (direccion.length > 0) {
          const { city, region } = direccion[0];
          
          await fetch('https://smartcheck-proyecto-final.onrender.com/api/users/actualizar-ubicacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              provincia: region,
              localidad: city
            })
          });
        }
      } catch (error) {
        console.error("Error silencioso geo:", error);
      }
    };

    sincronizarUbicacion();
  }, []);

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(() => {
      logout();
    }, 1000);
  };

  const handleAdminAccess = async () => {
    const savedPass = await AsyncStorage.getItem('admin_pass') || '00192';
    if (adminInput === savedPass) {
      setAdminInput(''); 
      setModalVisible(false); 
      navigation.navigate('AdminPanel');
    } else {
      setAdminInput('');
      Alert.alert("Error", "Contraseña incorrecta");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logoHeader} />
          <View style={styles.nameContainer}>
            <Image source={require('../../assets/nombreapp.png')} style={styles.nameHeader} />
          </View>
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.titleText}>PANEL PRINCIPAL</Text>
        </View>

        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.buttonWrapper} onPress={() => setModalVisible(true)}>
            <Image source={require('../../assets/btnadmin.png')} style={styles.menuButton} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonWrapper} onPress={() => navigation.navigate('Busqueda')}>
            <Image source={require('../../assets/btnbuscaprod.png')} style={styles.menuButton} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonWrapper} onPress={() => navigation.navigate('Perfil')}>
            <Image source={require('../../assets/btnmiperfil.png')} style={styles.menuButton} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonWrapper} onPress={() => Alert.alert("Aviso", "Pantalla de Reportes en desarrollo")}>
            <Image source={require('../../assets/btnrepoahorro.png')} style={styles.menuButton} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerContainer}>
        <View style={styles.goldLine} />
        <View style={styles.footerArea}>
          <TouchableOpacity onPress={logout}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogoutFlow}>
            <Image source={require('../../assets/salir.png')} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Acceso Administrador</Text>
          <TextInput 
            style={styles.modalInput} 
            secureTextEntry 
            value={adminInput} 
            onChangeText={setAdminInput} 
            keyboardType="numeric" 
            placeholder="Contraseña"
          />
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#ff4444'}]} onPress={() => setModalVisible(false)}><Text style={{color: '#fff'}}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#00ffcc'}]} onPress={handleAdminAccess}><Text style={{color: '#000'}}>Ingresar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  mainContent: { flex: 1, paddingTop: 20 }, 
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
  logoHeader: { width: 60, height: 60, resizeMode: 'contain' },
  nameContainer: { flex: 1, alignItems: 'center' },
  nameHeader: { width: 160, height: 45, resizeMode: 'contain' },
  titleBar: { backgroundColor: '#000', paddingVertical: 8, alignItems: 'center', width: '100%', marginVertical: 10 },
  titleText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  buttonGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', padding: 10 },
  buttonWrapper: { width: '45%', aspectRatio: 1, margin: 5 },
  menuButton: { width: '100%', height: '100%', resizeMode: 'contain' },
  footerContainer: { paddingBottom: 30 },
  goldLine: { height: 1, backgroundColor: '#FFD700', width: '90%', alignSelf: 'center', marginBottom: 15 },
  footerArea: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
  navIcon: { width: 60, height: 60, resizeMode: 'contain' },
  modalView: { margin: 20, marginTop: 100, backgroundColor: '#002a54', borderRadius: 20, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: '#ffcc00' },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  modalInput: { backgroundColor: '#fff', width: '100%', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 18, textAlign: 'center' },
  btnAction: { padding: 10, borderRadius: 8, paddingHorizontal: 20 }
});