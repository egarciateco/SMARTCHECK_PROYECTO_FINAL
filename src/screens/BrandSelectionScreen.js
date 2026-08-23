import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BrandSelectionScreen({ navigation, route }) {
  const { rubroSeleccionado = 'Almacén' } = route.params || {};
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rubroSeleccionado) {
      fetchMarcasPorRubro(rubroSeleccionado);
    }
  }, [rubroSeleccionado]);

  const fetchMarcasPorRubro = async (categoria) => {
    try {
      setLoading(true);
      const encodedCategoria = encodeURIComponent(categoria);
      const response = await fetch(`http://192.168.1.7:5000/api/rubros/${encodedCategoria}/marcas`);
      const json = await response.json();
      if (json.status === 'success') {
        setMarcas(json.data);
      }
    } catch (error) {
      console.error('Error al obtener marcas:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarMarca = (marca) => {
    navigation.navigate('ProductSelectionScreen', { 
      categoriaSeleccionada: rubroSeleccionado, 
      marcaSeleccionada: marca.nombre 
    });
  };

  const renderMarcaItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.brandCard} 
        onPress={() => seleccionarMarca(item)}
        activeOpacity={0.8}
      >
        <View style={styles.brandLogoWrapper}>
          <Ionicons name="pricetag-outline" size={22} color="#00E5FF" />
        </View>
        <Text style={styles.brandNameText} numberOfLines={1}>
          {item.nombre}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImage} resizeMode="contain" />
        <View style={styles.placeholderRight} />
      </View>

      <View style={styles.stepBarContainer}>
        <TouchableOpacity style={[styles.stepButton, styles.stepInactive]} onPress={() => navigation.navigate('CategorySelection')} activeOpacity={0.9}>
          <Image source={require('../../assets/btnrubro.png')} style={styles.stepImage} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stepButton, styles.stepActive]} activeOpacity={0.9}>
          <Image source={require('../../assets/btnmarca.png')} style={styles.stepImage} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stepButton, styles.stepInactive]} onPress={() => navigation.navigate('ProductSelectionScreen', { categoriaSeleccionada: rubroSeleccionado })} activeOpacity={0.9}>
          <Image source={require('../../assets/btntipo.png')} style={styles.stepImage} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <Text style={styles.bannerText}>SELECCIONÁ UNA MARCA: {rubroSeleccionado.toUpperCase()}</Text>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.emptyText}>Cargando marcas...</Text>
          </View>
        ) : marcas.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>No hay marcas registradas para este rubro.</Text>
          </View>
        ) : (
          <FlatList
            data={marcas}
            keyExtractor={(item) => item.id}
            renderItem={renderMarcaItem}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.rowWrapper}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.footerContainer}>
        <View style={styles.goldLine} />
        <View style={styles.footerButtons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerButton}>
            <Image source={require('../../assets/volver.png')} style={styles.footerIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.footerButton}>
            <Image source={require('../../assets/salir.png')} style={styles.footerIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  topHeader: { 
    height: 44, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 12, 
    backgroundColor: '#111827' 
  },
  logo: { width: 30, height: 30 },
  appNameImage: { height: 20, width: 100 },
  placeholderRight: { width: 30 },
  stepBarContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  stepButton: { 
    flex: 1, 
    marginHorizontal: 1,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: { opacity: 1 },
  stepInactive: { opacity: 0.4 },
  stepImage: { width: '100%', height: '100%' },
  bannerContainer: { 
    width: '100%', 
    backgroundColor: '#000000', 
    paddingVertical: 4, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#374151' 
  },
  bannerText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  contentContainer: { flex: 1, paddingHorizontal: 8, paddingTop: 6 },
  gridContainer: { paddingBottom: 8 },
  rowWrapper: { justifyContent: 'space-between', marginBottom: 6 },
  brandCard: { 
    width: '48%', 
    backgroundColor: '#1F2937', 
    borderRadius: 8, 
    padding: 10, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#374151', 
    elevation: 2 
  },
  brandLogoWrapper: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#111827', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6, 
    borderWidth: 1, 
    borderColor: '#374151' 
  },
  brandNameText: { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { marginTop: 8, color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 4 },
  goldLine: { width: '100%', height: 1, backgroundColor: '#D4AF37', marginBottom: 4 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  footerButton: { padding: 2 },
  footerIcon: { width: 24, height: 24, tintColor: '#00E5FF' }
});