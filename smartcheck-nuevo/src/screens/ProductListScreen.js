import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Alert, Keyboard } from 'react-native';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { searchProducts, getProducts } from '../config/api';

const ProductListScreen = ({ navigation, route }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { category } = route?.params || {};

  useEffect(() => { fetchProducts(); }, [category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await (category && category !== 'all' ? getProducts({ category }) : getProducts());
      setProducts(Array.isArray(response) ? response : (response?.data || []));
    } catch (err) {
      Alert.alert("Error", "No pudimos conectar con la base de datos.");
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const handleSearch = async () => {
    Keyboard.dismiss(); // Cierra el teclado al buscar
    if (!searchQuery.trim()) { fetchProducts(); return; }
    try {
      setLoading(true);
      const isEan = /^\d{8,14}$/.test(searchQuery.trim());
      const response = await searchProducts(isEan ? { ean: searchQuery.trim() } : { search: searchQuery.trim() });
      const results = Array.isArray(response) ? response : (response?.data || []);
      setProducts(results);
      if (results.length === 0) Alert.alert("Sin resultados", "No se hallaron coincidencias.");
    } catch (err) { 
      Alert.alert("Error", "Problema al conectar con el servidor."); 
    } finally { setLoading(false); }
  };

  const handleProductPress = (item) => {
    if (item) navigation.navigate('ProductDetail', { product: item });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={styles.loadingText}>Cargando catálogo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={category || 'Productos'} onBackPress={() => navigation.goBack()} />
      <View style={styles.searchContainer}>
        <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar por nombre o EAN..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            onSubmitEditing={handleSearch} 
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item)} />}
        keyExtractor={(item, index) => item?.id || index.toString()}
        numColumns={2}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.textEmpty}>No hay productos disponibles.</Text>
            <TouchableOpacity onPress={fetchProducts} style={styles.retryButton}>
                <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProducts} colors={['#00ffcc']} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#fff' },
  searchContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#000' },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#004a91' },
  searchButton: { backgroundColor: '#00ffcc', padding: 16, marginLeft: 8, borderRadius: 8 },
  searchButtonText: { color: '#001f3f', fontWeight: 'bold' },
  retryButton: { marginTop: 15, padding: 12, backgroundColor: '#ffcc00', borderRadius: 8 },
  retryText: { color: '#001f3f', fontWeight: 'bold' },
  textEmpty: { color: '#fff' }
});

export default ProductListScreen;