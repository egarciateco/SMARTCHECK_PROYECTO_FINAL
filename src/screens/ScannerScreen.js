import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api'; 
import { playBeep, loadBeepSound, unloadSounds } from '../utils/share';

// Logos oficiales locales robustos
const LOGOS_SUPERMERCADO = {
  'carrefour': require('../../assets/logos/carrefour.png'),
  'coto': require('../../assets/logos/coto.png'),
  'jumbo': require('../../assets/logos/jumbo.png'),
  'dia': require('../../assets/logos/dia.png'),
  'changomas': require('../../assets/logos/changomas.png'),
  'vea': require('../../assets/logos/vea.png'),
  'disco': require('../../assets/logos/disco.png'),
  'maxiconsumo': require('../../assets/logos/maxiconsumo.png')
};

const getLogoSuperLocal = (nombreSuper) => {
  if (!nombreSuper) return LOGOS_SUPERMERCADO['vea'];
  const clave = String(nombreSuper).toLowerCase().trim();
  for (const key in LOGOS_SUPERMERCADO) {
    if (clave.includes(key)) {
      return LOGOS_SUPERMERCADO[key];
    }
  }
  return LOGOS_SUPERMERCADO['carrefour'];
};

const IMAGEN_DEFAULT_PRODUCTO = 'https://images.carrefour.com.ar/media/catalog/product/s/e/685100_1.jpg';

export default function ScannerScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [resultadoEscaneo, setResultadoEscaneo] = useState(null);
  const [searchText, setSearchText] = useState('');
  
  const isFocused = useIsFocused();
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBeepSound().catch(() => {});
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    );
    animation.start();

    return () => { 
      unloadSounds().catch(() => {}); 
      animation.stop();
    };
  }, [blinkAnim]);

  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setResultadoEscaneo(null);
      setSearchText('');
    }, [])
  );

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(logout, 1000);
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeScreen', { user });
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (loading) return;
    
    setLoading(true);
    setResultadoEscaneo(null);
    
    await playBeep().catch(() => {});

    const codigoEanLimpio = String(data).trim();
    let productoEncontradoFinal = null;

    // CONSULTA ÚNICA Y OFICIAL AL ENDPOINT EXISTENTE DEL BACKEND (/api/users/productos/buscar)
    try {
      const response = await api.get('/api/users/productos/buscar', { 
        params: { 
          q: codigoEanLimpio,
          codigo: codigoEanLimpio,
          ean: codigoEanLimpio,
          localidad: 'Paraná',
          provincia: 'Entre Ríos'
        },
        timeout: 8000 
      });

      if (response.data?.status === 'success' && response.data.data?.length > 0) {
        let listaSucursales = response.data.data;

        // Ordenar estrictamente de menor a mayor precio para garantizar el supermercado más barato en Paraná (Coto, Maxiconsumo, etc.)
        listaSucursales.sort((a, b) => {
          const precioA = parseFloat(String(a.precio || '0').replace(/\./g, '').replace(',', '.'));
          const precioB = parseFloat(String(b.precio || '0').replace(/\./g, '').replace(',', '.'));
          return precioA - precioB;
        });

        const mejorOpcion = listaSucursales[0];

        productoEncontradoFinal = {
          id: mejorOpcion.id || codigoEanLimpio,
          nombre: mejorOpcion.nombre || mejorOpcion.descripcion || `Producto EAN ${codigoEanLimpio}`,
          marca: mejorOpcion.marca || 'Marca Registrada',
          medida: mejorOpcion.medida || mejorOpcion.presentacion || '',
          ean: codigoEanLimpio,
          precio: mejorOpcion.precio ? String(mejorOpcion.precio).replace('.', ',') : '0,00',
          supermercado: mejorOpcion.supermercado || mejorOpcion.comercio || 'Supermercado Local',
          imagen: mejorOpcion.imagen || mejorOpcion.foto || IMAGEN_DEFAULT_PRODUCTO,
          sucursalesDisponibles: listaSucursales
        };
      }
    } catch (e) {
      console.log('Error al conectar con la API de productos:', e.message);
    }

    if (!productoEncontradoFinal) {
      setResultadoEscaneo({ encontrado: false });
      setLoading(false);
      return;
    }

    setResultadoEscaneo({
      encontrado: true,
      nombre: productoEncontradoFinal.nombre,
      marca: productoEncontradoFinal.marca,
      medida: productoEncontradoFinal.medida,
      ean: codigoEanLimpio,
      precio: productoEncontradoFinal.precio,
      supermercado: productoEncontradoFinal.supermercado,
      logoSuperSource: getLogoSuperLocal(productoEncontradoFinal.supermercado),
      imagen: productoEncontradoFinal.imagen,
      productoCompleto: productoEncontradoFinal
    });
    setLoading(false);
  };

  const handleManualSearch = () => {
    if (!searchText.trim()) return;
    navigation.navigate('ProductList', { query: searchText.trim() });
  };

  if (!hasPermission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.textError}>Se requiere acceso a la cámara.</Text>
        <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
          <Text style={{color: '#fff'}}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/logo.png')} style={styles.logoGrande} />
            <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} />
          </View>
        </View>

        <View style={styles.titleGoldLine} />
        <View style={styles.blackBanner}>
          <Text style={styles.bannerText}>ESCÁNER DE CÓDIGOS SMARTCHECK</Text>
        </View>
        <View style={styles.titleGoldLine} />

        <View style={styles.instructionRow}>
          <Text style={styles.instructionText}>Enfoque el código EAN del producto</Text>
          <Image 
            source={require('../../assets/eancod.png')} 
            style={styles.eanSampleImg} 
          />
        </View>

        <View style={styles.cameraWrapper}>
          {isFocused && (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128'] }}
            />
          )}
          <View style={styles.overlayFrame}>
            <Animated.View style={[styles.scannerTarget, { opacity: blinkAnim }]} />
          </View>
        </View>

        <View style={styles.manualSearchContainer}>
          <TextInput
            style={styles.inputBusquedaGrande}
            placeholder="O escribe el producto aquí..."
            placeholderTextColor="#8892B0"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleManualSearch}
          />
          <TouchableOpacity style={styles.btnBuscarManualPequeno} onPress={handleManualSearch}>
            <Text style={styles.btnBuscarManualText}>🔍 Buscar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedbackContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#00ffcc" />
          ) : resultadoEscaneo ? (
            resultadoEscaneo.encontrado ? (
              <TouchableOpacity 
                style={styles.resultadoBox} 
                onPress={() => {
                  navigation.navigate('ShoppingList', { 
                    itemsSeleccionados: [resultadoEscaneo.productoCompleto],
                    localidadUser: 'Paraná',
                    provinciaUser: 'Entre Ríos'
                  });
                }}
              >
                <Text style={styles.textoExito}>¡Mejor Precio Localizado en Paraná!</Text>
                
                <View style={styles.mejorPrecioContainer}>
                  <Text style={styles.mejorPrecioLabel}>🔥 MEJOR PRECIO ENCONTRADO:</Text>
                  <View style={styles.precioSuperRow}>
                    <Text style={styles.mejorPrecioValor}>$ {resultadoEscaneo.precio}</Text>
                    <View style={styles.superInfoBox}>
                      <Image source={resultadoEscaneo.logoSuperSource} style={styles.logoSuperImg} />
                      <Text style={styles.superNombreTexto}>{resultadoEscaneo.supermercado}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.productoInfoRow}>
                  <Image 
                    source={{ uri: resultadoEscaneo.imagen }} 
                    style={styles.productoMiniImg} 
                    resizeMode="cover"
                  />
                  <View style={styles.productoTextos}>
                    <Text style={styles.productoDesc} numberOfLines={1}>{resultadoEscaneo.nombre}</Text>
                    <Text style={styles.productoMarca}>Marca: {resultadoEscaneo.marca}</Text>
                    <Text style={styles.productoDetalle}>Medida: {resultadoEscaneo.medida}</Text>
                    <Text style={styles.verMasTexto}>Toca para enviar al Chango Ahorrador ➔</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.resultadoBox}>
                <Text style={styles.textoErrorNoEncontrado}>❌ Producto no encontrado en las sucursales de Paraná.</Text>
              </View>
            )
          ) : (
            <Text style={styles.instructions}>Apuntá al código de barras (EAN)</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.goldLine} />
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackPress} style={styles.footerButton}>
            <Image source={require('../../assets/volver.png')} style={styles.iconosFooter} />
            <Text style={styles.footerButtonText}>Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogoutFlow} style={styles.footerButton}>
            <Image source={require('../../assets/salir.png')} style={styles.iconosFooter} />
            <Text style={styles.footerButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  scrollContainer: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 10 },
  center: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    backgroundColor: '#000000',
    marginBottom: 6
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoGrande: { width: 75, height: 75, resizeMode: 'contain', marginRight: 10 },
  nombreAppGrande: { width: 190, height: 42, resizeMode: 'contain' },
  
  blackBanner: { width: '100%', backgroundColor: '#000000', paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  bannerText: { color: '#FFD700', fontSize: 17, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  titleGoldLine: { height: 1, backgroundColor: '#FFD700', width: '100%' },
  
  instructionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 6 },
  instructionText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
  eanSampleImg: { width: 75, height: 18, resizeMode: 'contain', backgroundColor: '#fff', borderRadius: 3 },

  cameraWrapper: { width: '85%', height: 185, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: '#00ffcc', alignSelf: 'center' },
  overlayFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  scannerTarget: { width: '92%', height: '88%', borderWidth: 2, borderColor: '#ffcc00', borderRadius: 6, borderStyle: 'dashed' },
  
  manualSearchContainer: { width: '85%', alignSelf: 'center', marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputBusquedaGrande: { flex: 1, backgroundColor: '#0A192F', borderWidth: 1, borderColor: '#00ffff', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13 },
  btnBuscarManualPequeno: { backgroundColor: '#003366', borderWidth: 1, borderColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  btnBuscarManualText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },

  feedbackContainer: { minHeight: 110, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, marginTop: 4 },
  instructions: { color: '#aaa', fontSize: 12, textAlign: 'center' },
  resultadoBox: { width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#00ffcc' },
  textoExito: { color: '#00ffcc', fontSize: 11, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  
  mejorPrecioContainer: { backgroundColor: '#003366', width: '100%', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FFD700', marginBottom: 4, alignItems: 'center' },
  mejorPrecioLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  precioSuperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mejorPrecioValor: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  superInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  logoSuperImg: { width: 22, height: 14, resizeMode: 'contain' },
  superNombreTexto: { color: '#000', fontSize: 10, fontWeight: 'bold' },

  textoErrorNoEncontrado: { color: '#ff4d4d', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  productoInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%', gap: 10 },
  productoMiniImg: { width: 50, height: 50, borderRadius: 6, resizeMode: 'cover', backgroundColor: '#fff' },
  productoTextos: { flex: 1, justifyContent: 'center' },
  productoDesc: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  productoMarca: { color: '#ccc', fontSize: 10 },
  productoDetalle: { color: '#00ffcc', fontSize: 10, fontWeight: 'bold' },
  verMasTexto: { color: '#FFD700', fontSize: 9, fontStyle: 'italic', marginTop: 1 },
  
  footerContainer: { width: '100%', paddingTop: 5, paddingBottom: 8, backgroundColor: '#001f3f' },
  goldLine: { height: 1, backgroundColor: '#FFD700', width: '100%', marginBottom: 5 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, width: '100%' },
  footerButton: { alignItems: 'center', justifyContent: 'center' },
  iconosFooter: { width: 28, height: 28, resizeMode: 'contain', tintColor: '#00BFFF' },
  footerButtonText: { color: '#00BFFF', fontSize: 10, marginTop: 1, fontWeight: 'bold' },
  btnPermiso: { backgroundColor: '#00ffcc', padding: 12, borderRadius: 8, marginTop: 10 },
  textError: { color: '#fff', marginBottom: 10 }
});