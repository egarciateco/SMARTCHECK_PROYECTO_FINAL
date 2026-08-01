import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Image, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import * as Location from 'expo-location'; 
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import ProfileAvatar from '../components/ProfileAvatar'; // Importación correcta

export default function ProductSearchScreen({ navigation, route }) {
  const { user, logout } = useAuth(); 
  const params = route?.params || {};
  const mapRef = useRef(null);
  
  const initialLat = params.latitud ? parseFloat(params.latitud) : -31.7333;
  const initialLng = params.longitud ? parseFloat(params.longitud) : -60.5167;

  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012
  });
  
  const [localidadTexto, setLocalidadTexto] = useState('Localizando...');
  const [provinciaTexto, setProvinciaTexto] = useState('...');

  // EFECTO 1: Geolocalización inicial
  useEffect(() => {
    let isMounted = true;
    const activarGeolocalizacion = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setLocalidadTexto("Paraná");
            setProvinciaTexto("Entre Ríos");
          }
          return;
        }

        const posicionActual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = posicionActual.coords;
        const nuevaRegion = { latitude, longitude, latitudeDelta: 0.015, longitudeDelta: 0.012 };

        if (isMounted) {
          setRegion(nuevaRegion);
          if (mapRef.current) mapRef.current.animateToRegion(nuevaRegion, 1200);
          
          const direccion = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (direccion.length > 0) {
            setLocalidadTexto(direccion[0].city || direccion[0].subregion || "Ubicación Desconocida");
            setProvinciaTexto(direccion[0].region || "Provincia");
          }
        }
      } catch (error) {
        if (isMounted) {
          setLocalidadTexto("Paraná");
          setProvinciaTexto("Entre Ríos");
        }
      }
    };

    if (!params.latitud && !params.longitud) {
      activarGeolocalizacion();
    } else {
      setLocalidadTexto("Ubicación del Producto");
      setProvinciaTexto("Comercio");
    }
    
    return () => { isMounted = false; };
  }, []);

  // EFECTO 2: Escucha cambios (vuelve del escáner)
  useEffect(() => {
    if (params.latitud && params.longitud) {
      const regionActualizada = {
        latitude: parseFloat(params.latitud),
        longitude: parseFloat(params.longitud),
        latitudeDelta: 0.008,
        longitudeDelta: 0.006
      };
      setRegion(regionActualizada);
      if (mapRef.current) mapRef.current.animateToRegion(regionActualizada, 1000);
      if (params.productoEncontrado) {
        setProductos([params.productoEncontrado]);
        setSearch(params.productoEncontrado.nombre);
      }
    }
  }, [params.latitud, params.longitud, params.productoEncontrado]);

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(logout, 1000);
  };

  const handleVolver = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home'); // O a la ruta principal que definas
    }
  };

  const realizarBusqueda = async () => {
    if (!search.trim()) return Alert.alert("Atención", "Ingresa un producto."); 
    
    setLoading(true);
    try {
      const response = await api.get('/productos/buscar', { params: { q: search } });
      
      if (response.data?.status === 'success') { 
        const items = response.data.data || [];
        setProductos(items);
        
        if (items.length > 0 && items[0].latitud) {
          const proxyRegion = {
            latitude: parseFloat(items[0].latitud),
            longitude: parseFloat(items[0].longitud),
            latitudeDelta: 0.008,
            longitudeDelta: 0.006
          };
          setRegion(proxyRegion);
          if (mapRef.current) mapRef.current.animateToRegion(proxyRegion, 1000);
        } else if (items.length === 0) {
          Alert.alert("Sin resultados", "No se encontraron productos.");
        }
      }
    } catch (error) { 
      console.error(error);
      Alert.alert("Error", "No se pudo conectar con el servidor."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
           <ProfileAvatar user={user} size={50} />
        </TouchableOpacity>
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
            provider={PROVIDER_GOOGLE} 
            style={styles.mapCanvas} 
            region={region}
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
      
      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleVolver}>
          <Image source={require('../../assets/volver.png')} style={styles.iconosFooter} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogoutFlow}>
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
  franjaNegra: { backgroundColor: '#000', padding: 10, alignItems: 'center' },
  tituloFranja: { color: '#ffcc00', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15 },
  input: { flex: 1, backgroundColor: '#002a54', padding: 12, borderRadius: 10, color: '#fff', borderWidth: 1, borderColor: '#004a91' },
  btnBuscar: { backgroundColor: '#00ffcc', padding: 12, borderRadius: 10, marginLeft: 10 },
  btnScanner: { alignItems: 'center', marginVertical: 10 },
  scannerImg: { width: 220, height: 60, resizeMode: 'contain' },
  mapSection: { marginHorizontal: 20, height: 210, marginTop: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, height: 20 },
  locationIcon: { width: 16, height: 16, resizeMode: 'contain', marginRight: 5 },
  locationText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  mapCanvasWrapper: { height: 185, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: '#00ffcc' },
  mapCanvas: { ...StyleSheet.absoluteFillObject }, 
  listArea: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  itemRow: { backgroundColor: '#002a54', padding: 15, borderRadius: 10, marginBottom: 5 },
  itemText: { color: '#fff' },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 10, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 25 },
  iconosFooter: { width: 45, height: 45, resizeMode: 'contain' }
});