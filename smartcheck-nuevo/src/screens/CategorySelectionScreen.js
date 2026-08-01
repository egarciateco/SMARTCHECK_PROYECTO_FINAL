import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- LISTA MAESTRA DE LOS 12 RUBROS CON EMOJIS Y ESTILOS ---
const CATEGORIAS_RUBROS = [
  { id: '1', nombre: 'Almacén', clave: 'almacen', emoji: '🛒', color: '#F59E0B' },
  { id: '2', nombre: 'Bebidas', clave: 'bebidas', emoji: '🥤', color: '#3B82F6' },
  { id: '3', nombre: 'Lácteos', clave: 'lacteos', emoji: '🥛', color: '#10B981' },
  { id: '4', nombre: 'Carnes', clave: 'carnes', emoji: '🥩', color: '#EF4444' },
  { id: '5', nombre: 'Frutas y Verduras', clave: 'frutasyverduras', emoji: '🍎', color: '#84CC16' },
  { id: '6', nombre: 'Limpieza', clave: 'limpieza', emoji: '🧹', color: '#8B5CF6' },
  { id: '7', nombre: 'Perfumería', clave: 'perfumeria', emoji: '🧴', color: '#EC4899' },
  { id: '8', nombre: 'Congelados', clave: 'congelados', emoji: '❄️', color: '#06B6D4' },
  { id: '9', nombre: 'Panadería', clave: 'panaderia', emoji: '🍞', color: '#D97706' },
  { id: '10', nombre: 'Desayuno', clave: 'desayuno', emoji: '☕', color: '#B45309' },
  { id: '11', nombre: 'Bebés', clave: 'bebes', emoji: '👶', color: '#6366F1' },
  { id: '12', nombre: 'Mascotas', clave: 'mascotas', emoji: '🐾', color: '#78716C' },
];

export default function CategorySelectionScreen({ navigation }) {
  
  const handleSeleccionarRubro = (rubro) => {
    // Navegamos a la pantalla de marcas pasando el rubro seleccionado
    navigation.navigate('BrandSelectionScreen', { 
      rubroSeleccionado: rubro.clave,
      nombreRubro: rubro.nombre 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER SUPERIOR CON LOGO Y NOMBRE DE LA APP */}
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

      {/* 2. BARRA DE NAVEGACIÓN DE PASOS (Rubro Activo) */}
      <View style={styles.stepBarContainer}>
        <TouchableOpacity 
          style={[styles.stepButton, styles.stepActive]} 
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btnrubro.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.stepButton, styles.stepInactive]} 
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btnmarca.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.stepButton, styles.stepInactive]} 
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btntipo.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
      </View>

      {/* 3. BANNER DE TÍTULO */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerText}>SELECCIONÁ UN RUBRO</Text>
      </View>

      {/* 4. GRILLA DE LOS 12 RUBROS CON EMOJIS */}
      <ScrollView contentContainerStyle={styles.scrollGridContainer}>
        <View style={styles.gridContainer}>
          {CATEGORIAS_RUBROS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.categoryCard, { borderLeftColor: item.color }]}
              onPress={() => handleSeleccionarRubro(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.emojiContainer, { backgroundColor: `${item.color}22` }]}>
                <Text style={styles.emojiText}>{item.emoji}</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {item.nombre}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 5. FOOTER FIJO */}
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
          
          <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.footerButton}>
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
  
  topHeader: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    backgroundColor: '#111827' 
  },
  logo: { width: 44, height: 44 },
  appNameImage: { height: 28, width: 140 },
  placeholderRight: { width: 44 },

  stepBarContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  stepButton: { flex: 1, marginHorizontal: 3 },
  stepActive: { opacity: 1 },
  stepInactive: { opacity: 0.4 },
  stepImage: { width: '100%', height: undefined, aspectRatio: 3.2 },

  bannerContainer: { 
    width: '100%', 
    backgroundColor: '#000000', 
    paddingVertical: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#374151' 
  },
  bannerText: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', letterSpacing: 1.2 },

  scrollGridContainer: { padding: 16, paddingBottom: 24 },
  gridContainer: { flexDirection: 'column', gap: 10 },
  
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderLeftWidth: 6,
    marginBottom: 8,
    elevation: 2,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emojiText: { fontSize: 24 },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E5E7EB',
  },

  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 12 },
  goldLine: { width: '100%', height: 1.5, backgroundColor: '#D4AF37', marginBottom: 10 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  footerButton: { padding: 4 },
  footerIcon: { width: 36, height: 36, tintColor: '#00E5FF' },
});