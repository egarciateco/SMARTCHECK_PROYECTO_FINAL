import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MARCAS_POR_RUBRO = {
  almacen: [
    { nombre: 'Lucchetti', dominio: 'lucchetti.com.ar' },
    { nombre: 'Terrabusi', dominio: 'terrabusi.com.ar' },
    { nombre: 'Gallo', dominio: 'arrozgallo.com.ar' },
    { nombre: 'Doña Petrona', dominio: 'donapetrona.com.ar' },
    { nombre: 'Canale', dominio: 'canale.com.ar' },
    { nombre: 'Jorgito', dominio: 'alfajoresjorgito.com.ar' },
    { nombre: 'Águila', dominio: 'chocolatesaguila.com.ar' },
    { nombre: 'Marolio', dominio: 'marolio.com.ar' },
    { nombre: 'Oreo', dominio: 'oreo.com.ar' }
  ],
  bebidas: [
    { nombre: 'Pepsi', dominio: 'pepsi.com' },
    { nombre: 'Coca-Cola', dominio: 'cocacola.com.ar' },
    { nombre: 'Sprite', dominio: 'sprite.com' },
    { nombre: 'Fanta', dominio: 'fanta.com' },
    { nombre: 'Cepita', dominio: 'cepita.com.ar' },
    { nombre: 'Citric', dominio: 'citric.com.ar' },
    { nombre: 'Quilmes', dominio: 'quilmes.com.ar' },
    { nombre: 'Schneider', dominio: 'schneider.com.ar' }
  ],
  carnes: [
    { nombre: 'Paty', dominio: 'paty.com.ar' },
    { nombre: 'Vienissima', dominio: 'vienissima.com.ar' }
  ],
  congelados: [
    { nombre: 'Sadia', dominio: 'sadia.com.br' },
    { nombre: 'Green Life', dominio: 'greenlife.com' }
  ],
  lacteos: [
    { nombre: 'La Serenísima', dominio: 'laserenisima.com.ar' },
    { nombre: 'Sancor', dominio: 'sancor.com' }
  ],
  limpieza: [
    { nombre: 'Ala', dominio: 'ala.com.ar' }
  ]
};

export default function BrandSelectionScreen({ navigation, route }) {
  const { rubroSeleccionado = 'almacen' } = route.params || {};
  const [rubroActivo, setRubroActivo] = useState(rubroSeleccionado.toLowerCase());
  const [logosRotos, setLogosRotos] = useState({});

  const marcasActuales = MARCAS_POR_RUBRO[rubroActivo] || [];

  const handleLogoError = (nombreMarca) => {
    setLogosRotos(prev => ({ ...prev, [nombreMarca]: true }));
  };

  const seleccionarMarca = (marca) => {
    navigation.navigate('ProductSelectionScreen', { 
      categoriaSeleccionada: rubroActivo, 
      marcaSeleccionada: marca.nombre 
    });
  };

  const renderMarcaItem = ({ item }) => {
    const logoUrl = `https://api.companyenrich.com/logo/${item.dominio}`;
    const tieneError = logosRotos[item.nombre];

    return (
      <TouchableOpacity 
        style={styles.brandCard} 
        onPress={() => seleccionarMarca(item)}
        activeOpacity={0.8}
      >
        <View style={styles.brandLogoWrapper}>
          {tieneError ? (
            <Ionicons name="image-outline" size={28} color="#9CA3AF" />
          ) : (
            <Image 
              source={{ uri: logoUrl }} 
              style={styles.brandLogoImage} 
              resizeMode="contain" 
              onError={() => handleLogoError(item.nombre)}
            />
          )}
        </View>
        <Text style={styles.brandNameText} numberOfLines={1}>
          {item.nombre}
        </Text>
      </TouchableOpacity>
    );
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

      {/* BARRA DE NAVEGACIÓN HORIZONTAL CON LOS 3 BOTONES DE IMAGEN */}
      <View style={styles.stepBarContainer}>
        <TouchableOpacity 
          style={[styles.stepButton, styles.stepInactive]} 
          onPress={() => navigation.navigate('CategorySelection')}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btnrubro.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.stepButton, styles.stepActive]} 
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
          onPress={() => navigation.navigate('ProductSelectionScreen', { categoriaSeleccionada: rubroActivo })}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btntipo.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
      </View>

      {/* Grilla de Marcas */}
      <View style={styles.contentContainer}>
        {marcasActuales.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No hay marcas configuradas para este rubro.</Text>
          </View>
        ) : (
          <FlatList
            data={marcasActuales}
            keyExtractor={(item) => item.nombre}
            renderItem={renderMarcaItem}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.rowWrapper}
          />
        )}
      </View>

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
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.footerButton}>
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
  topHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#111827' },
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
  stepInactive: { opacity: 0.5 },
  stepImage: { width: '100%', height: undefined, aspectRatio: 3.2 },
  contentContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  gridContainer: { paddingBottom: 16 },
  rowWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  brandCard: { width: '48%', backgroundColor: '#1F2937', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#374151', elevation: 3 },
  brandLogoWrapper: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10, padding: 8, overflow: 'hidden' },
  brandLogoImage: { width: '100%', height: '100%' },
  brandNameText: { color: '#E5E7EB', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 12 },
  goldLine: { width: '100%', height: 1.5, backgroundColor: '#D4AF37', marginBottom: 10 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  footerButton: { padding: 4 },
  footerIcon: { width: 36, height: 36, tintColor: '#00E5FF' }
});