// ProductSearchScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Image, Text, StyleSheet, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location'; 
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://smartcheck-proyecto-final.onrender.com';

export default function ProductSearchScreen({ navigation, route }) {
  const { user, updateLocation } = useAuth();
  const params = route?.params || {};
  
  // Referencia nativa para controlar el mapa sin bloquear el renderizado
  const mapRef = useRef(null);
  
  // Coordenadas de partida por defecto (Paraná)
  const initialLat = params.latitud ? parseFloat(params.latitud) : -31.7333;
  const initialLng = params.longitud ? parseFloat(params.longitud) : -60.5167;

  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Mantenemos la región en un estado para el marcador en vivo
  const [region, setRegion] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012
  });
  const [localidadTexto, setLocalidadTexto] = useState('Localizando...');
  const [provinciaTexto, setProvinciaTexto] = useState('...');

  // Geolocalización limpia mediante animación por Referencia
  useEffect(() => {
    const activarGeolocalizacionEnVivo = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Permiso denegado",
            "SmartCheck mostrará la ubicación por defecto al no tener acceso al GPS."
          );
          setLocalidadTexto("Paraná");
          setProvinciaTexto("Entre Ríos");
          return;
        }

        // Captura de posición con alta precisión
        const posicionActual = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = posicionActual.coords;
        const nuevaRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.012
        };

        // 1. Actualizamos el estado del marcador
        setRegion(nuevaRegion);

        // 2. MOVE DESPLAZAMIENTO SUAVE: Viaja a la ubicación real sin congelar la pantalla
        if (mapRef.current) {
          mapRef.current.animateToRegion(nuevaRegion, 1200);
        }

        // Traducir coordenadas a texto
        const direccionTraduccion = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (direccionTraduccion.length > 0) {
          const datosDireccion = direccionTraduccion[0];
          const loc = datosDireccion.city || datosDireccion.subregion || "Ubicación Desconocida";
          const prov = datosDireccion.region || "Provincia";
          
          setLocalidadTexto(loc);
          setProvinciaTexto(prov);
          
          // Actualizamos de forma reactiva el perfil del usuario logueado en el Contexto global
          if (updateLocation) {
            updateLocation(loc, prov);
          }
        }
      } catch (error) {
        console.error("❌ Error de telemetría GPS:", error);
        setLocalidadTexto("Paraná");
        setProvinciaTexto("Entre Ríos");
      }
    };

    activarGeolocalizacionEnVivo();
  }, []);

  const realizarBusqueda = async () => {
    if (!search.trim()) { 
      Alert.alert("Atención", "Por favor, ingresa un nombre o código de producto."); 
      return; 
    }
    
    // CORRECCIÓN: Se utiliza la función modificadora de estado correcta
    setLoading(true);
    
    try {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
        {user?.foto ? <Image source={{ uri: user.foto }} style={styles.userAvatar} /> : <Ionicons name="person-circle" size={50} color="#fff" />}
      </View>
      <View style={styles.franjaNegra}>
        <Text style={styles.tituloFranja}>¡BIENVENID@, {user?.nombre?.toUpperCase() || 'USUARIO'}!</Text>
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
          <Text style={styles.locationText}>{localidadTexto} - {provinciaTexto}</Text>
        </View>
        <View style={styles.mapCanvasWrapper}>
          <MapView 
            ref={mapRef}
            style={styles.mapCanvas} 
            initialRegion={{
              latitude: initialLat,
              longitude: initialLng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.012
            }}
            showsUserLocation={true}
          >
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} pinColor="#00ffcc" />
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
            renderItem={({item}) => (
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>{item.nombre}</Text>
              </View>
            )} 
            ListEmptyComponent={<Text style={styles.emptyText}>No hay resultados.</Text>} 
          />
        )}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/volver.png')} style={styles.iconosFooter} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => BackHandler.exitApp()}>
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
  scannerImg: { width: 220, height: 60, resizeMode: 'contain' },
  mapSection: { marginHorizontal: 20, height: 250, marginTop: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  locationIcon: { width: 16, height: 16, resizeMode: 'contain', marginRight: 5 },
  locationText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  mapCanvasWrapper: { flex: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: '#00ffcc' },
  mapCanvas: { ...StyleSheet.absoluteFillObject },
  listArea: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  itemRow: { backgroundColor: '#002a54', padding: 15, borderRadius: 10, marginBottom: 5 },
  itemText: { color: '#fff' },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 10, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 25 },
  iconosFooter: { width: 45, height: 45, resizeMode: 'contain' }
});