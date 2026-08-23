import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';

export default function ComparativaScreen({ route, navigation }) {
  const { productData, comparativa } = route.params || {};

  const [loading, setLoading] = useState(!comparativa && !productData?.listaPrecios);
  const [listaPrecios, setListaPrecios] = useState(
    comparativa || productData?.listaPrecios || productData?.precios || []
  );
  const [currentProduct, setCurrentProduct] = useState(productData || null);

  useEffect(() => {
    const eanToFetch = productData?.ean || route.params?.ean;
    
    if ((!listaPrecios || listaPrecios.length === 0) && eanToFetch) {
      setLoading(true);
      // ✅ CORREGIDO: Se quitó el /users/ para que coincida con el servidor (/api/producto/)
      api.get(`/api/producto/${eanToFetch}`)
        .then(response => {
          const json = response.data;
          const prod = json?.producto || json?.data || json;
          if (prod) {
            setCurrentProduct({
              nombre: prod.name || prod.nombre || prod.titulo || productData?.nombre || 'Producto',
              marca: prod.marca || prod.brand || productData?.marca || '',
              medida: prod.medida || prod.unidad_medida || prod.presentacion || productData?.medida || '',
              imagen: prod.imagen || prod.image || prod.foto || productData?.imagen || null,
            });

            const foundPrices = prod.precios || prod.comercios || prod.preciosComercios || prod.supermercados || prod.preciosSupermercados || [];
            if (Array.isArray(foundPrices) && foundPrices.length > 0) {
              setListaPrecios(foundPrices);
            } else {
              const extracted = [];
              Object.keys(prod).forEach(key => {
                if (Array.isArray(prod[key])) {
                  const sample = prod[key][0];
                  if (sample && (sample.precio || sample.valor || sample.supermercado || sample.comercio)) {
                    extracted.push(...prod[key]);
                  }
                }
              });
              if (extracted.length > 0) {
                setListaPrecios(extracted);
              }
            }
          }
        })
        .catch(err => {
          console.log("Error al re-consultar precios en ComparativaScreen:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productData, route.params]);

  const getSupermarketLogo = (nombreSuper) => {
    if (!nombreSuper) return null;
    
    const nombre = nombreSuper.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (nombre.includes('dia')) {
      return require('../../assets/logos/dia.png');
    } else if (nombre.includes('coto')) {
      return require('../../assets/logos/coto.png');
    } else if (nombre.includes('carrefour')) {
      return require('../../assets/logos/carrefour.png');
    } else if (nombre.includes('jumbo')) {
      return require('../../assets/logos/jumbo.png');
    } else if (nombre.includes('vea')) {
      return require('../../assets/logos/vea.png');
    } else if (nombre.includes('chango')) {
      return require('../../assets/logos/changomas.png');
    } else if (nombre.includes('masonline') || nombre.includes('mas online') || nombre === 'mas' || nombre.startsWith('mas ')) {
      return require('../../assets/logos/mas_online.png');
    } else if (nombre.includes('maxiconsumo')) {
      return require('../../assets/logos/maxiconsumo.png');
    } else if (nombre.includes('anonima')) {
      return require('../../assets/logos/lanonima.png');
    } else if (nombre.includes('walmart')) {
      return require('../../assets/logos/walmart.png');
    } else if (nombre.includes('disco')) {
      return require('../../assets/logos/disco.png');
    }
    
    return null;
  };

  const listaOrdenada = Array.isArray(listaPrecios) 
    ? [...listaPrecios].sort((a, b) => {
        const precioA = Number(a.precio || a.valorNumerico || a.valor || a.costo || a.price || 0);
        const precioB = Number(b.precio || b.valorNumerico || b.valor || b.costo || b.price || 0);
        return precioA - precioB;
      })
    : [];

  const ganador = listaOrdenada.length > 0 ? listaOrdenada[0] : null;
  const restoSupermercados = listaOrdenada.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderInline}>
        <Image source={require('../../assets/icon.png')} style={styles.appLogoInline} resizeMode="contain" />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImageInline} resizeMode="contain" />
      </View>

      <View style={styles.goldenLine} />

      <View style={styles.titleStripBlue}>
        <Text style={styles.titleTextYellow}>COMPARATIVA DE PRECIOS</Text>
      </View>

      <View style={styles.goldenLine} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Cargando comparativa de los supermercados...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentProduct && (
            <View style={styles.productHeaderCard}>
              {currentProduct.imagen ? (
                <Image source={{ uri: currentProduct.imagen }} style={styles.miniProductImage} resizeMode="contain" />
              ) : (
                <View style={[styles.miniProductImage, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image-outline" size={24} color="#888" />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.miniProductName}>{currentProduct.nombre}</Text>
                <Text style={styles.miniProductBrand}>
                  Marca: {currentProduct.marca} {currentProduct.medida ? `| ${currentProduct.medida}` : ''}
                </Text>
              </View>
            </View>
          )}

          {ganador ? (
            <View style={styles.winnerCard}>
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={styles.winnerTextBadge}>MÁS BARATO (GANADOR)</Text>
              </View>

              <View style={styles.rowSuperContent}>
                <View style={styles.superInfoLeft}>
                  {getSupermarketLogo(ganador.supermercado || ganador.nombreComercio || ganador.comercio || ganador.nombre) ? (
                    <Image 
                      source={getSupermarketLogo(ganador.supermercado || ganador.nombreComercio || ganador.comercio || ganador.nombre)} 
                      style={styles.superLogoImage} 
                      resizeMode="contain" 
                    />
                  ) : (
                    <View style={styles.superLogoBox}>
                      <Ionicons name="storefront" size={24} color="#FFD700" />
                    </View>
                  )}
                  <Text style={styles.winnerSuperName}>
                    {ganador.supermercado || ganador.nombreComercio || ganador.comercio || ganador.nombre || 'Supermercado'}
                  </Text>
                </View>
                <Text style={styles.winnerPriceText}>
                  {typeof ganador.price === 'string' ? ganador.price : `$${Number(ganador.precio || ganador.valorNumerico || ganador.valor || ganador.costo || ganador.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={40} color="#FF5252" style={{ marginBottom: 10 }} />
              <Text style={styles.errorText}>No hay datos de precios disponibles para este producto.</Text>
            </View>
          )}

          {restoSupermercados.length > 0 && (
            <Text style={styles.sectionSubtitle}>Otros Supermercados:</Text>
          )}
          
          {restoSupermercados.map((item, index) => {
            const nombreSup = item.supermercado || item.nombreComercio || item.comercio || item.nombre || 'Supermercado';
            const valorNumerico = Number(item.precio || item.valorNumerico || item.valor || item.costo || item.price || 0);
            const precioSup = typeof item.price === 'string' ? item.price : `$${valorNumerico.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const logoSup = getSupermarketLogo(nombreSup);

            return (
              <View key={index} style={styles.normalCard}>
                <View style={styles.superInfoLeft}>
                  {logoSup ? (
                    <Image 
                      source={logoSup} 
                      style={styles.superLogoImageNormal} 
                      resizeMode="contain" 
                    />
                  ) : (
                    <View style={styles.superLogoBoxNormal}>
                      <Ionicons name="cart-outline" size={20} color="#38BDF8" />
                    </View>
                  )}
                  <Text style={styles.normalSuperName}>{nombreSup}</Text>
                </View>
                <Text style={styles.normalPriceText}>{precioSup}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 14,
  },
  topHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  appLogoInline: {
    width: 65,
    height: 65,
    marginRight: 10,
    borderRadius: 10,
  },
  appNameImageInline: {
    width: 180,
    height: 35,
  },
  goldenLine: {
    height: 1.5,
    backgroundColor: '#FFD700',
    width: '100%',
  },
  titleStripBlue: {
    backgroundColor: '#003366',
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextYellow: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scrollContent: {
    padding: 12,
  },
  productHeaderCard: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  miniProductImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  miniProductName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  miniProductBrand: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  winnerCard: {
    backgroundColor: '#002244',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  winnerTextBadge: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  rowSuperContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  superInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  superLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  superLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 10,
  },
  winnerSuperName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  winnerPriceText: {
    color: '#00FF66',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  normalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  superLogoBoxNormal: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  superLogoImageNormal: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 10,
  },
  normalSuperName: {
    color: '#DDDDDD',
    fontSize: 15,
    fontWeight: '600',
  },
  normalPriceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#003366',
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  bottomButtonPlain: {
    padding: 0,
  },
  bottomButtonImageLarge: {
    width: 44,
    height: 44,
  },
});