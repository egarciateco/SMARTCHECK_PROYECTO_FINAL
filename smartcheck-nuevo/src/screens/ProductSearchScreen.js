import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Image, Text, StyleSheet, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

export default function ProductSearchScreen({ navigation, route }) {
  const params = route?.params || {};
  const { nombreUsuario = 'Usuario', fotoUrl, latitud, longitud } = params;
  
  const latNum = latitud ? parseFloat(latitud) : -31.7333;
  const lngNum = longitud ? parseFloat(longitud) : -60.5167;

  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const realizarBusqueda = async () => {
    if (!search.trim()) {
      Alert.alert("Atención", "Por favor, ingresa un nombre o código de producto.");
      return;
    }
    setLoading(true);
    try {
      // Llamada real al endpoint de búsqueda
      const response = await fetch(`${API_URL}/api/users/productos/buscar?q=${encodeURIComponent(search)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setProductos(result.data || []);
        if (result.data.length === 0) Alert.alert("Sin resultados", "No se encontraron productos.");
      } else {
        Alert.alert("Error", "No se pudo realizar la búsqueda.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSalirApp = () => {
    Alert.alert("Salir", "¿Está seguro que desea cerrar la aplicación?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, Salir", onPress: () => BackHandler.exitApp() }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.userAvatar} />
        ) : (
          <Ionicons name="person-circle" size={50} color="#fff" />
        )}
      </View>

      <View style={styles.franjaNegra}>
        <Text style={styles.tituloFranja}>¡BIENVENID@, {nombreUsuario.toUpperCase()}!</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput 
          placeholder="Buscar producto..." 
          placeholderTextColor="#ccc" 
          style={styles.input} 
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={realizarBusqueda}
        />
        <TouchableOpacity style={styles.btnBuscar} onPress={realizarBusqueda}>
          <Ionicons name="search" size={24} color="#001f3f" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnScanner} onPress={() => navigation.navigate('Scanner')}>
        <Image source={require('../../assets/scanner.png')} style={styles.scannerImg} />
      </TouchableOpacity>

      <View style={styles.mapSection}>
        <View style={styles.locationRow}>
          <Image source={require('../../assets/location.png')} style={styles.locationIcon} />
          <Text style={styles.locationText}>Tu última ubicación de escaneo</Text>
        </View>
        <View style={styles.mapCanvasWrapper}>
          <MapView 
            style={styles.mapCanvas} 
            region={{ latitude: latNum, longitude: lngNum, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          >
             <Marker coordinate={{ latitude: latNum, longitude: lngNum }} pinColor="#00ffcc" />
          </MapView>
        </View>
      </View>

      <View style={styles.listArea}>
        {loading ? (
          <ActivityIndicator size="large" color="#00ffcc" />
        ) : (
          <FlatList 
            data={productos} 
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => <View style={styles.itemRow}><Text style={styles.itemText}>{item.nombre}</Text></View>}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay resultados para mostrar.</Text>}
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Image source={require('../../assets/volver.png')} style={styles.iconosFooter} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSalirApp}>
           <Image source={require('../../assets/salir.png')} style={styles.iconosFooter} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' },
  logoGrande: { width: 70, height: 70, resizeMode: 'contain' },
  nombreAppGrande: { width: 140, height: 50, resizeMode: 'contain' },
  userAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#00ffcc' },
  franjaNegra: { backgroundColor: '#000', padding: 10, alignItems: 'center' },
  tituloFranja: { color: '#ffcc00', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15 },
  input: { flex: 1, backgroundColor: '#002a54', padding: 12, borderRadius: 10, color: '#fff', borderWidth: 1, borderColor: '#004a91' },
  btnBuscar: { backgroundColor: '#00ffcc', padding: 12, borderRadius: 10, marginLeft: 10 },
  btnScanner: { alignItems: 'center', marginVertical: 10 },
  scannerImg: { width: 180, height: 50, resizeMode: 'contain' },
  mapSection: { marginHorizontal: 20, marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  locationIcon: { width: 16, height: 16, resizeMode: 'contain', marginRight: 5 },
  locationText: { color: '#aaa', fontSize: 12 },
  mapCanvasWrapper: { width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#004a91' },
  mapCanvas: { width: '100%', height: 100 },
  listArea: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  itemRow: { backgroundColor: '#002a54', padding: 15, borderRadius: 10, marginBottom: 5 },
  itemText: { color: '#fff' },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 10, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 25 },
  iconosFooter: { width: 45, height: 45, resizeMode: 'contain' }
});