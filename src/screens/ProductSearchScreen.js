import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Image, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function ProductSearchScreen({ navigation, route }) {
  const { logout } = useAuth(); 
  const params = route?.params || {};
  const searchTimeoutRef = useRef(null);

  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.productoEncontrado) {
      const processed = procesarProducto(params.productoEncontrado);
      setProductos([processed]);
      setSearch(processed.nombreFormateado);
    }
  }, [params.productoEncontrado]);

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(logout, 1000);
  };

  const handleVolver = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeScreen');
    }
  };

  // Conversor robusto de precios (maneja números, strings con $, puntos y comas)
  const parsearPrecio = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val)
      .replace(/[^0-9,.-]+/g, "")
      .replace(/\./g, "")
      .replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Validador y armador de URL de imágenes (maneja absolutas y relativas del backend)
  const obtenerUrlImagen = (path) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseUrl = api.defaults?.baseURL || '';
    if (!baseUrl) return path;

    if (baseUrl.endsWith('/') && path.startsWith('/')) {
      return baseUrl.slice(0, -1) + path;
    }
    if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
      return baseUrl + '/' + path;
    }
    return baseUrl + path;
  };

  const procesarProducto = (prod) => {
    let mejorPrecio = 0;
    let mejorSuper = 'No especificado';

    // Buscar en listas de precios o comercios asociados
    const listaPrecios = prod.precios || prod.comercios || prod.preciosComercios || prod.comparisons || prod.preciosSupermercados || [];
    if (Array.isArray(listaPrecios) && listaPrecios.length > 0) {
      const ordenados = [...listaPrecios].sort((a, b) => {
        const pA = parsearPrecio(a.precio || a.valor || a.price || a.costo);
        const pB = parsearPrecio(b.precio || b.valor || b.price || b.costo);
        return pA - pB;
      });
      if (ordenados[0]) {
        mejorPrecio = parsearPrecio(ordenados[0].precio || ordenados[0].valor || ordenados[0].price || ordenados[0].costo);
        mejorSuper = ordenados[0].supermercado || ordenados[0].nombreComercio || ordenados[0].comercio || ordenados[0].supermarket || ordenados[0].nombre || 'Supermercado Local';
      }
    }

    // Si no encontró en la lista, buscar precio directo en el objeto principal
    if (!mejorPrecio || mejorPrecio === 0) {
      mejorPrecio = parsearPrecio(prod.precio || prod.precioActual || prod.price || prod.valor || prod.precioVenta);
    }

    if (mejorSuper === 'No especificado' || !mejorSuper) {
      mejorSuper = prod.supermercadoMasBarato || prod.supermercado || prod.comercio || prod.nombreComercio || 'Supermercado Local';
    }

    const precioFormateado = mejorPrecio > 0 
      ? `$ ${mejorPrecio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : (prod.precio || prod.price || '$ 0.00');

    const rawImage = prod.imagen || prod.image || prod.foto || prod.urlImagen || prod.img || null;

    return {
      ...prod,
      nombreFormateado: prod.name || prod.nombre || prod.titulo || prod.title || 'Producto sin nombre',
      marcaFormateada: prod.marca || prod.brand || prod.marcaProducto || 'Genérica',
      precioFormateado: precioFormateado,
      supermercadoFormateado: mejorSuper,
      imagenFormateada: obtenerUrlImagen(rawImage)
    };
  };

  const handleSearchInputChange = (text) => {
    setSearch(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/api/productos/autocompletar', { params: { q: text } });
        const json = response.data;
        if (json.status === 'success' && Array.isArray(json.data)) {
          setSuggestions(json.data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error al obtener sugerencias de autocompletar:', error);
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item) => {
    setSearch(item.name || item.nombre || '');
    setSuggestions([]);
    const productoProcesado = procesarProducto(item);
    setProductos([productoProcesado]);
  };

  const realizarBusqueda = async () => {
    if (!search.trim()) return Alert.alert("Atención", "Ingresa un producto a buscar."); 
    
    setSuggestions([]); 
    setLoading(true);
    try {
      const response = await api.get('/api/productos/buscar', { params: { q: search } });
      const json = response.data;
      const rawItems = json?.data || json?.productos || json || [];
      const items = Array.isArray(rawItems) ? rawItems.map(procesarProducto) : [];

      setProductos(items);
      
      if (items.length === 0) {
        Alert.alert("Sin resultados", "No se encontraron productos con ese nombre.");
      }
    } catch (error) { 
      console.error("Error en búsqueda manual:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header sin foto a la derecha */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
      </View>

      {/* Franja con título */}
      <View style={styles.franjaNegra}>
        <Text style={styles.tituloFranja}>¡BÚSQUEDA MANUAL DE PRODUCTOS!</Text>
      </View>
      
      {/* Campo de búsqueda y lupa más abajo, alineados */}
      <View style={styles.searchSectionWrapper}>
        <View style={styles.searchRow}>
          <TextInput 
            placeholder="Ej: Aceite, Leche, Fideos..." 
            placeholderTextColor="#666" 
            style={styles.input} 
            value={search} 
            onChangeText={handleSearchInputChange} 
            onSubmitEditing={() => {
              setSuggestions([]);
              realizarBusqueda();
            }} 
          />
          
          <TouchableOpacity style={styles.btnBuscarLupa} onPress={() => {
            setSuggestions([]);
            realizarBusqueda();
          }}>
            <Image source={require('../../assets/lupa.png')} style={styles.lupaImg} />
          </TouchableOpacity>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const proc = procesarProducto(item);
                return (
                  <TouchableOpacity 
                    style={styles.suggestionItem} 
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionText} numberOfLines={1}>{proc.nombreFormateado}</Text>
                      <Text style={styles.suggestionSubText}>{proc.marcaFormateada} • <Text style={{ color: '#00ffcc' }}>{proc.supermercadoFormateado}</Text></Text>
                    </View>
                    <Text style={styles.suggestionPrice}>{proc.precioFormateado}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}
      </View>
      
      {/* Línea fina dorada debajo de la búsqueda */}
      <View style={styles.lineaDoradaSuperior} />

      {/* Recuadro de resultados / espacio vacío */}
      <View style={styles.resultsContainerBox}>
        {loading ? (
          <ActivityIndicator size="large" color="#ffcc00" style={{ marginTop: 20 }} />
        ) : (
          <FlatList 
            data={productos} 
            keyExtractor={(item, index) => item.id?.toString() || index.toString()} 
            renderItem={({item}) => (
              <View style={styles.itemRow}>
                {item.imagenFormateada ? (
                  <Image source={{ uri: item.imagenFormateada }} style={styles.itemImage} resizeMode="contain" />
                ) : (
                  <View style={styles.itemPlaceholder}><Ionicons name="cube" size={20} color="#666" /></View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemText} numberOfLines={1}>{item.nombreFormateado}</Text>
                  <Text style={styles.itemBrand}>Marca: {item.marcaFormateada}</Text>
                  <Text style={styles.itemSuper}>📍 {item.supermercadoFormateado}</Text>
                </View>
                <View style={styles.itemPriceBox}>
                  <Text style={styles.itemPrice}>{item.precioFormateado}</Text>
                </View>
              </View>
            )} 
            ListEmptyComponent={<Text style={styles.emptyText}>Escribe un producto arriba para buscar...</Text>} 
          />
        )}
      </View>
      
      {/* Línea dorada antes del footer */}
      <View style={styles.lineaDorada} />

      {/* Footer con botones más grandes */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleVolver} style={styles.footerButtonTouch}>
          <Image source={require('../../assets/volver.png')} style={styles.iconosFooter} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogoutFlow} style={styles.footerButtonTouch}>
          <Image source={require('../../assets/salir.png')} style={styles.iconosFooter} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center', backgroundColor: '#000' },
  logoGrande: { width: 65, height: 65, resizeMode: 'contain', marginRight: 10 },
  nombreAppGrande: { width: 160, height: 45, resizeMode: 'contain' },
  franjaNegra: { backgroundColor: '#000', padding: 8, alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ffcc00' },
  tituloFranja: { color: '#ffcc00', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  searchSectionWrapper: { paddingHorizontal: 15, marginTop: 15, marginBottom: 10, zIndex: 999 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, color: '#000', borderWidth: 1, borderColor: '#ccc', fontSize: 14, height: 48 },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 15,
    right: 15,
    backgroundColor: '#002a54',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#004a91',
    maxHeight: 220,
    zIndex: 1000,
    elevation: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#003b75',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  suggestionSubText: { color: '#aaa', fontSize: 11, marginTop: 2 },
  suggestionPrice: { color: '#00ffcc', fontSize: 13, fontWeight: 'bold' },
  btnBuscarLupa: { backgroundColor: '#002a54', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ffcc00', justifyContent: 'center', alignItems: 'center', height: 48, width: 48 },
  lupaImg: { width: 28, height: 28, resizeMode: 'contain' },
  lineaDoradaSuperior: { height: 1.5, backgroundColor: '#ffcc00', width: '100%', marginBottom: 10 },
  resultsContainerBox: { flex: 1, marginHorizontal: 15, marginBottom: 8, borderWidth: 1, borderColor: '#ffcc00', borderRadius: 12, padding: 10, backgroundColor: '#001a33' },
  itemRow: { backgroundColor: '#002a54', padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#004a91' },
  itemImage: { width: 45, height: 45, borderRadius: 6, backgroundColor: '#FFF', marginRight: 10 },
  itemPlaceholder: { width: 45, height: 45, borderRadius: 6, backgroundColor: '#113a65', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  itemBrand: { color: '#aaa', fontSize: 11 },
  itemSuper: { color: '#FFD700', fontSize: 11, fontWeight: '600', marginTop: 2 },
  itemPriceBox: { justifyContent: 'center', alignItems: 'flex-end', paddingLeft: 8 },
  itemPrice: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 15, fontSize: 12 },
  lineaDorada: { height: 1.5, backgroundColor: '#ffcc00', width: '100%', marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 15, paddingTop: 5 },
  footerButtonTouch: { padding: 5 },
  iconosFooter: { width: 45, height: 45, resizeMode: 'contain', tintColor: '#00BFFF' }
});