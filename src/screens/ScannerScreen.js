import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Dimensions,
  Animated
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import api, { productService } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [flash, setFlash] = useState(false);

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (!scanned) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [scanned, blinkAnim]);

  if (!permission) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#FFD700" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.textError}>No hay acceso a la cámara</Text>
        <TouchableOpacity style={styles.buttonPermission} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;

    let cleanEan = data ? data.trim() : '';
    if (!cleanEan) return;

    if (!/^\d+$/.test(cleanEan)) {
      return; 
    }

    if (cleanEan.startsWith('479')) {
      cleanEan = '7' + cleanEan.slice(1);
    }

    setScanned(true);
    setLoading(true);
    setScannedCode(cleanEan);

    try {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/beepscanner.mp3'));
      await sound.playAsync();
    } catch (error) {
      console.log("No se pudo reproducir el sonido beepscanner:", error);
    }

    try {
      console.log(`🔍 Consultando EAN: ${cleanEan}`);
      
      const response = await productService.getByEan(cleanEan);
      const json = response.data;
      
      console.log("🔥 RESPUESTA RECIBIDA EXITOSAMENTE", json);

      if (response.status === 200 && json && (json.producto || json.status === 'éxito' || json.nombre || json.name)) {
        const prod = json.producto || json;
        
        const listaPrecios = json.comparativa || json.comparisons || json.precios || json.comercios || prod.precios || prod.comercios || prod.preciosComercios || [];
        
        let mejorPrecioStr = json.precioMasBarato || json.mejorPrecio || prod.precioMasBarato || prod.precio;
        let mejorSuper = json.supermercadoMasBarato || json.mejorSupermercado || prod.supermercadoMasBarato || prod.supermercado;

        if ((!mejorPrecioStr || !mejorSuper) && listaPrecios.length > 0) {
          const sortedPrecios = [...listaPrecios].sort((a, b) => {
            const pA = parseFloat(a.precio || a.price || a.valor || 0);
            const pB = parseFloat(b.precio || b.price || b.valor || 0);
            return pA - pB;
          });
          if (sortedPrecios.length > 0) {
            const cheapest = sortedPrecios[0];
            if (!mejorPrecioStr) {
              const rawP = cheapest.precio || cheapest.price || cheapest.valor;
              mejorPrecioStr = typeof rawP === 'number' ? `$ ${rawP.toFixed(2)}` : (rawP ? (String(rawP).startsWith('$') ? rawP : `$ ${rawP}`) : '$ 0.00');
            }
            if (!mejorSuper) {
              mejorSuper = cheapest.supermercado || cheapest.nombre || cheapest.comercio || cheapest.cadena || 'No especificado';
            }
          }
        }

        if (typeof mejorPrecioStr === 'number') {
          mejorPrecioStr = `$ ${mejorPrecioStr.toFixed(2)}`;
        } else if (mejorPrecioStr && !String(mejorPrecioStr).startsWith('$')) {
          mejorPrecioStr = `$ ${mejorPrecioStr}`;
        } else if (!mejorPrecioStr) {
          mejorPrecioStr = '$ 0.00';
        }

        setProductData({
          nombre: prod.nombre || prod.name || prod.title || 'Producto sin nombre',
          descripcion: prod.descripcion || prod.description || 'Artículo verificado por código de barras',
          marca: prod.marca || prod.brand || 'Genérica',
          medida: prod.medida || prod.unidad_medida || prod.presentation || '',
          precio: mejorPrecioStr,
          supermercadoMasBarato: mejorSuper || 'No especificado',
          imagen: prod.imagen || prod.image || prod.foto || json.imagen || null,
          ean: cleanEan,
          listaPrecios: listaPrecios 
        });
      } else {
        setProductData(null);
        // Incorporar automáticamente el EAN a la base de datos cuando no existe
        try {
          await api.post('/api/users/productos/registrar', { ean: cleanEan });
          console.log(`📌 EAN ${cleanEan} incorporado automáticamente para procesamiento nocturno.`);
        } catch (regError) {
          console.log("❌ Error al registrar EAN automáticamente:", regError.message);
        }
      }
    } catch (error) {
      console.log("❌ Error al buscar producto en la API:", error.message);
      setProductData(null);
      // Intentar registrar también en caso de error de conexión/búsqueda si el producto no existe
      try {
        await api.post('/api/users/productos/registrar', { ean: cleanEan });
      } catch (regError) {
        // Ignorar si falla el registro secundario
      }
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setProductData(null);
    setScannedCode('');
  };

  if (scanned) {
    return (
      <SafeAreaView style={styles.containerPostScan}>
        <View style={styles.topHeaderInline}>
          <Image source={require('../../assets/icon.png')} style={styles.appLogoInline} resizeMode="contain" />
          <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImageInline} resizeMode="contain" />
        </View>

        <View style={styles.goldenLine} />

        <View style={styles.titleStripBlue}>
          <Text style={styles.titleTextYellow}>PRODUCTO ESCANEADO</Text>
        </View>

        <View style={styles.goldenLine} />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Buscando producto vigente...</Text>
          </View>
        ) : (
          <View style={styles.recuadroPantalla}>
            {productData ? (
              <>
                <TouchableOpacity 
                  style={styles.imageContainer} 
                  onPress={() => navigation.navigate('ComparativaScreen', { 
                    productData: productData,
                    comparativa: productData.listaPrecios,
                    ean: productData.ean || scannedCode
                  })}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={productData.imagen ? { uri: productData.imagen } : require('../../assets/localidad.png')} 
                    style={styles.productImage} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.hintTapText}>👆 Toca la imagen para ver los precios</Text>
                </TouchableOpacity>

                <View style={styles.detailsContainer}>
                  <Text style={styles.productName}>{productData.nombre}</Text>
                  <Text style={styles.productDesc}>{productData.descripcion}</Text>
                  
                  <View style={styles.rowInfo}>
                    <Text style={styles.infoLabel}>Marca:</Text>
                    <Text style={styles.infoValue}>{productData.marca}</Text>
                  </View>

                  <View style={styles.rowInfo}>
                    <Text style={styles.infoLabel}>Medida:</Text>
                    <Text style={styles.infoValue}>{productData.medida || 'N/D'}</Text>
                  </View>

                  <View style={styles.rowInfo}>
                    <Text style={styles.infoLabel}>Más barato en:</Text>
                    <Text style={styles.infoValueSuper}>{productData.supermercadoMasBarato}</Text>
                  </View>

                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>MEJOR PRECIO VIGENTE:</Text>
                    <Text style={styles.priceValue}>{productData.precio}</Text>
                    <Text style={styles.eanText}>EAN: {productData.ean || scannedCode}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.backButton} onPress={resetScanner}>
                  <Ionicons name="scan-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.backButtonText}>Volver al Scanner</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.textError}>El producto no se encuentra registrado en la base de datos de los supermercados.</Text>
                
                <TouchableOpacity style={styles.backButton} onPress={resetScanner}>
                  <Ionicons name="scan-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.backButtonText}>Intentar de nuevo</Text>
                </TouchableOpacity>

                <Text style={styles.noticeTextBelow}>
                  Este producto se ha incorporado para que sea agregado a la base de datos a partir de la próxima actualización de la misma.
                </Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderBlack}>
        <Image source={require('../../assets/icon.png')} style={styles.appLogoLarge} resizeMode="contain" />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImage} resizeMode="contain" />
      </View>

      <View style={styles.titleSpacing} />

      <View style={styles.goldenLine} />

      <View style={styles.titleStripBlue}>
        <Text style={styles.titleTextYellow}>ESCÁNER DE CÓDIGOS EAN</Text>
      </View>

      <View style={styles.goldenLine} />

      <View style={styles.middleBlueSection}>
        <View style={styles.scanBoxContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={flash}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <Animated.View style={[styles.scanBoxBorder, { opacity: blinkAnim }]} />
          <Text style={styles.scanGuideText}>Apunta al código EAN</Text>
        </View>

        <TouchableOpacity style={styles.flashButtonCentered} onPress={() => setFlash(!flash)}>
          <Ionicons name={flash ? "flash" : "flash-off"} size={18} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.flashButtonText}>{flash ? "Linterna ON" : "Linterna"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goldenLine} />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButtonPlain} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/volver.png')} style={[styles.bottomButtonImageLarge, { tintColor: '#38BDF8' }]} resizeMode="contain" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomButtonPlain} onPress={() => navigation.navigate('Goodbye')}>
          <Image source={require('../../assets/salir.png')} style={[styles.bottomButtonImageLarge, { tintColor: '#38BDF8' }]} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  topHeaderBlack: { backgroundColor: '#000000', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  appLogoLarge: { width: 95, height: 95, marginBottom: 10, borderRadius: 14 },
  appNameImage: { width: 230, height: 42 },
  topHeaderInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', paddingVertical: 6, paddingHorizontal: 10 },
  appLogoInline: { width: 65, height: 65, marginRight: 10, borderRadius: 10 },
  appNameImageInline: { width: 180, height: 35 },
  titleSpacing: { height: 16, backgroundColor: '#000000' },
  goldenLine: { height: 1.5, backgroundColor: '#FFD700', width: '100%' },
  titleStripBlue: { backgroundColor: '#003366', width: '100%', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  titleTextYellow: { color: '#FFD700', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  middleBlueSection: { flex: 1, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', position: 'relative', paddingVertical: 20 },
  scanBoxContainer: { width: 325, height: 205, borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 20 },
  scanBoxBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 2.5, borderColor: '#FFD700', borderRadius: 12 },
  scanGuideText: { color: '#FFD700', fontSize: 12, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, position: 'absolute', bottom: 8, alignSelf: 'center', overflow: 'hidden', borderWidth: 0.5, borderColor: '#FFD700' },
  flashButtonCentered: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, elevation: 3 },
  flashButtonText: { color: '#000000', fontSize: 14, fontWeight: 'bold' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#003366', paddingVertical: 14, paddingHorizontal: 30, alignItems: 'center' },
  bottomButtonPlain: { padding: 6 },
  bottomButtonImageLarge: { width: 44, height: 44 },
  containerPostScan: { flex: 1, backgroundColor: '#000000', padding: 10 },
  recuadroPantalla: { flex: 1, borderWidth: 1.5, borderColor: '#FFD750', borderRadius: 16, backgroundColor: '#0A0A0A', padding: 16, justifyContent: 'space-between', marginTop: 6 },
  imageContainer: { alignItems: 'center', marginTop: 5, height: 150, justifyContent: 'center' },
  productImage: { width: 120, height: 120, borderRadius: 10, backgroundColor: '#FFF' },
  hintTapText: { color: '#38BDF8', fontSize: 11, marginTop: 4, fontWeight: '600' },
  detailsContainer: { flex: 1, marginTop: 4, justifyContent: 'flex-start' },
  productName: { color: '#FFFFFF', fontSize: 19, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  productDesc: { color: '#AAAAAA', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  infoLabel: { color: '#888888', fontSize: 13 },
  infoValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  infoValueSuper: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  priceBox: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#FFD700', borderRadius: 10, padding: 8, alignItems: 'center', marginTop: 10 },
  priceLabel: { color: '#555555', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  priceValue: { color: '#008000', fontSize: 26, fontWeight: '900', marginTop: 2 },
  eanText: { color: '#0284C7', fontSize: 12, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  backButton: { backgroundColor: '#FFD700', flexDirection: 'row', height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  backButtonText: { color: '#000000', fontSize: 15, fontWeight: 'bold' },
  loadingText: { color: '#FFD700', marginTop: 10, fontSize: 14 },
  textError: { color: '#FF5252', fontSize: 16, textAlign: 'center', marginBottom: 15 },
  noticeTextBelow: { color: '#38BDF8', fontSize: 13, textAlign: 'center', marginTop: 15, paddingHorizontal: 15, lineHeight: 18 },
  buttonPermission: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#000', fontWeight: 'bold' }
});