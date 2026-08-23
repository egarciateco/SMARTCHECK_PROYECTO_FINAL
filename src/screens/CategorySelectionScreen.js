import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIAS = [
  { id: '1', nombre: 'Almacén', icon: 'cart-outline', tipo: 'almacen' },
  { id: '2', nombre: 'Bebidas', icon: 'beer-outline', tipo: 'bebidas' },
  { id: '3', nombre: 'Lácteos', icon: 'water-outline', tipo: 'lacteos' },
  { id: '4', nombre: 'Carnes', icon: 'restaurant-outline', tipo: 'carnes' },
  { id: '5', nombre: 'Frutas y Verduras', icon: 'nutrition-outline', tipo: 'frutas y verduras' },
  { id: '6', nombre: 'Limpieza', icon: 'brush-outline', tipo: 'limpieza' },
  { id: '7', nombre: 'Perfumería', icon: 'color-palette-outline', tipo: 'perfumeria' },
  { id: '8', nombre: 'Congelados', icon: 'snow-outline', tipo: 'congelados' },
  { id: '9', nombre: 'Panadería', icon: 'basket-outline', tipo: 'panaderia' },
  { id: '10', nombre: 'Desayuno', icon: 'cafe-outline', tipo: 'desayuno' },
  { id: '11', nombre: 'Bebés', icon: 'happy-outline', tipo: 'bebes' },
  { id: '12', nombre: 'Mascotas', icon: 'paw-outline', tipo: 'mascotas' },
];

export default function CategorySelectionScreen({ navigation, route }) {
  const handleSeleccionarRubro = (categoria) => {
    navigation.navigate('ProductSelectionScreen', { 
      categoriaSeleccionada: categoria.tipo,
      rubroSeleccionado: categoria.tipo 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Image 
          source={require('../../assets/nombreapp.png')} 
          style={styles.appNameImage} 
          resizeMode="contain" 
        />
        <View style={styles.placeholderRight} />
      </View>

      {/* BARRA SUPERIOR DE 3 BOTONES AMPLIADOS (SIN TEXTO LATERAL) */}
      <View style={styles.stepBarContainer}>
        <View style={styles.stepColumn}>
          <Text style={styles.stepHeaderLabel}>RUBRO</Text>
          <TouchableOpacity style={styles.stepButtonActive} activeOpacity={0.9}>
            <View style={styles.miniSwitchOn} />
          </TouchableOpacity>
        </View>

        <View style={styles.stepColumn}>
          <Text style={styles.stepHeaderLabel}>MARCA</Text>
          <TouchableOpacity 
            style={styles.stepButtonInactive} 
            onPress={() => navigation.navigate('BrandSelectionScreen')}
            activeOpacity={0.9}
          >
            <View style={styles.miniSwitchOff} />
          </TouchableOpacity>
        </View>

        <View style={styles.stepColumn}>
          <Text style={styles.stepHeaderLabel}>TIPO</Text>
          <TouchableOpacity style={styles.stepButtonInactive} activeOpacity={0.9}>
            <View style={styles.miniSwitchOff} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de Título con líneas doradas finas arriba y abajo */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerText}>SELECCIONÁ UN RUBRO:</Text>
      </View>

      {/* Cuadrícula de Rubros con menor espacio vertical */}
      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={styles.card}
              onPress={() => handleSeleccionarRubro(cat)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={26} color="#00E5FF" style={styles.cardIcon} />
              <Text style={styles.cardText} numberOfLines={2}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer Fijo */}
      <View style={styles.footerContainer}>
        <View style={styles.goldLine} />
        <View style={styles.footerButtons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerButton}>
            <Image 
              source={require('../../assets/volver.png')} 
              style={styles.footerIcon} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('ChangoComparativoScreen')} 
            style={styles.footerButton}
          >
            <View style={styles.changoButtonContainer}>
              <Image 
                source={require('../../assets/salir.png')} 
                style={styles.footerIcon} 
                resizeMode="contain" 
              />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>1</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerButton}>
            <Image 
              source={require('../../assets/salir.png')} 
              style={styles.footerIcon} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  topHeader: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#111827' },
  logo: { width: 36, height: 36 },
  appNameImage: { height: 22, width: 120 },
  placeholderRight: { width: 36 },
  
  stepBarContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 5,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  stepColumn: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stepHeaderLabel: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    letterSpacing: 1,
  },
  stepButtonActive: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  stepButtonInactive: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  miniSwitchOn: {
    width: 22,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  miniSwitchOff: {
    width: 22,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },

  bannerContainer: { 
    width: '100%', 
    backgroundColor: '#000000', 
    paddingVertical: 6, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    marginVertical: 2,
  },
  bannerText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

  gridContainer: { 
    paddingHorizontal: 12, 
    paddingVertical: 4,
  },
  row: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
  },
  card: {
    width: '31%',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6, // Espacio vertical reducido entre los 12 cuadrados
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    height: 70, // Altura compacta para aprovechar mejor la pantalla
  },
  cardIcon: {
    marginBottom: 2,
  },
  cardText: {
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 6 },
  goldLine: { width: '100%', height: 1.5, backgroundColor: '#D4AF37', marginBottom: 6 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  footerButton: { padding: 4 },
  footerIcon: { width: 30, height: 30, tintColor: '#00E5FF' },
  changoButtonContainer: { position: 'relative' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: '#111827' },
  cartBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }
});