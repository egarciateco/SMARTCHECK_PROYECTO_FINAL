import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const getSupermarketLogo = (superName) => {
  if (!superName) return null;
  const clean = superName.toLowerCase().trim();
  
  if (clean.includes('coto')) return require('../../assets/logos/coto.png');
  if (clean.includes('carrefour')) return require('../../assets/logos/carrefour.png');
  if (clean.includes('dia') || clean.includes('día')) return require('../../assets/logos/dia.png');
  if (clean.includes('changomas') || clean.includes('chango mas')) return require('../../assets/logos/changomas.png');
  if (clean.includes('vea')) return require('../../assets/logos/vea.png');
  if (clean.includes('jumbo')) return require('../../assets/logos/jumbo.png');
  if (clean.includes('disco')) return require('../../assets/logos/disco.png');
  if (clean.includes('walmart')) return require('../../assets/logos/walmart.png');
  
  return null;
};

const formatPrecio = (val) => {
  const num = Number(val || 0);
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts[0]},${parts[1]}`;
};

export default function NuevoChangoScreen({ route, navigation }) {
  const { productosSeleccionados } = route.params || {};

  const [productos, setProductos] = useState(
    (productosSeleccionados || []).map((item, index) => {
      const basePrice = Number(
        item?.precioActual ?? 
        item?.precio ?? 
        item?.price ?? 
        item?.valor ?? 
        item?.precioMasBarato ?? 0
      );

      const rawSuper = item?.supermercadoActual ?? item?.supermercado ?? item?.superMasBarato ?? 'Supermercado';

      const rawImagen = 
        item?.imagenActual ?? 
        item?.imagen ?? 
        item?.image ?? 
        item?.img ?? 
        item?.foto ?? 
        item?.url ?? 
        item?.imageUrl ?? 
        null;

      return {
        ...item,
        idUnico: item.idUnico || item.id || index.toString(),
        cantidad: Number(item.cantidad || item.quantity || 1),
        precioActual: basePrice,
        supermercadoActual: rawSuper,
        imagenActual: rawImagen,
        opcionesSupermercados: item.opcionesSupermercados && item.opcionesSupermercados.length > 0 
          ? item.opcionesSupermercados 
          : [
              { supermercado: rawSuper, precio: basePrice }
            ]
      };
    })
  );

  useEffect(() => {
    const fetchImagesFromFirestore = async () => {
      const productosActualizados = [...productos];
      let huboCambios = false;

      for (let i = 0; i < productosActualizados.length; i++) {
        const prod = productosActualizados[i];
        if (!prod.imagenActual || typeof prod.imagenActual !== 'string' || prod.imagenActual.trim() === '') {
          try {
            let imageUrl = null;
            const prodId = prod.id || prod.codigo || prod.barcode || prod.barra;

            if (prodId) {
              const docRef = doc(db, 'productos', String(prodId));
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const data = docSnap.data();
                imageUrl = data.imagen || data.image || data.img || data.foto || data.url || data.imageUrl || data.thumbnail;
              }
            }

            const codigoBusqueda = prod.codigo || prod.barcode || prod.barra;
            if (!imageUrl && codigoBusqueda) {
              const camposBusqueda = ['codigo', 'barcode', 'barra', 'id'];
              for (const campo of camposBusqueda) {
                const q = query(
                  collection(db, 'productos'), 
                  where(campo, '==', String(codigoBusqueda)),
                  limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                  const data = querySnapshot.docs[0].data();
                  imageUrl = data.imagen || data.image || data.img || data.foto || data.url || data.imageUrl || data.thumbnail;
                  if (imageUrl) break;
                }
              }
            }

            if (imageUrl) {
              productosActualizados[i] = { ...prod, imagenActual: imageUrl };
              huboCambios = true;
            }
          } catch (error) {
            console.log("Error al obtener imagen de Firestore en NuevoChango:", error);
          }
        }
      }

      if (huboCambios) {
        setProductos(productosActualizados);
      }
    };

    fetchImagesFromFirestore();
  }, []);

  const cambiarCantidad = (idUnico, delta) => {
    setProductos(prev =>
      prev.map(p => {
        if (p.idUnico === idUnico) {
          const nuevaCant = Math.max(1, p.cantidad + delta);
          return { ...p, cantidad: nuevaCant };
        }
        return p;
      })
    );
  };

  const productosConPreciosReales = productos.map(prod => {
    const opciones = prod.opcionesSupermercados || [];
    if (opciones.length === 0) {
      return { 
        ...prod, 
        mejorPrecio: prod.precioActual, 
        mejorSuper: prod.supermercadoActual 
      };
    }
    let masBarata = opciones[0];
    opciones.forEach(op => {
      if (op.precio < masBarata.precio) {
        masBarata = op;
      }
    });
    return {
      ...prod,
      mejorPrecio: masBarata.precio,
      mejorSuper: masBarata.supermercado
    };
  });

  const totalChangoReal = productosConPreciosReales.reduce((acc, p) => acc + (p.precioActual * p.cantidad), 0);

  const renderProductImage = (imagenUri) => {
    if (!imagenUri || typeof imagenUri !== 'string' || imagenUri.trim() === '') {
      return <Ionicons name="cube-outline" size={26} color="#00E5FF" />;
    }
    if (imagenUri.startsWith('http://') || imagenUri.startsWith('https://') || imagenUri.startsWith('file://')) {
      return <Image source={{ uri: imagenUri }} style={styles.productImage} resizeMode="contain" />;
    }
    return <Ionicons name="cube-outline" size={26} color="#00E5FF" />;
  };

  const renderSupermarketDisplay = (superName) => {
    const logoSource = getSupermarketLogo(superName);
    if (logoSource) {
      return <Image source={logoSource} style={styles.superLogo} resizeMode="contain" />;
    }
    return <Text style={styles.superNameText}>{superName || 'Supermercado'}</Text>;
  };

  const renderLineaProducto = ({ item }) => {
    const nombre = item?.nombre || item?.name || item?.titulo || 'Producto';
    const medida = item?.medidaActual || item?.medida || 'Unidad';

    return (
      <View style={styles.lineRow}>
        <View style={styles.qtyContainer}>
          <TouchableOpacity onPress={() => cambiarCantidad(item.idUnico, -1)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.cantidad}</Text>
          <TouchableOpacity onPress={() => cambiarCantidad(item.idUnico, 1)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          {renderProductImage(item.imagenActual)}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={1}>{nombre}</Text>
          <Text style={styles.productMeasure}>{medida}</Text>
          <View style={styles.superRowInline}>
            <Text style={styles.cheapestInfo}>Precio: ${formatPrecio(item.precioActual)} en </Text>
            {renderSupermarketDisplay(item.supermercadoActual)}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImage} resizeMode="contain" />
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.franjaNegra}>
        <Text style={styles.tituloFranja}>ARMADO DE NUEVO CHANGO</Text>
      </View>

      <View style={styles.resumenChangoBox}>
        <Text style={styles.resumenLabel}>Total Chango Actual (Real):</Text>
        <Text style={styles.resumenTotalText}>${formatPrecio(totalChangoReal)}</Text>
      </View>

      <FlatList
        data={productosConPreciosReales}
        keyExtractor={(item) => item.idUnico}
        renderItem={renderLineaProducto}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.lineaDorada} />

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerButton}>
          <Image source={require('../../assets/volver.png')} style={styles.footerIconCelestial} resizeMode="contain" />
          <Text style={styles.footerText}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.footerButton}>
          <Image source={require('../../assets/salir.png')} style={styles.footerIconCelestial} resizeMode="contain" />
          <Text style={styles.footerText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 12 },
  logoImage: { width: 48, height: 48 },
  appNameImage: { width: 170, height: 32 },
  headerSpacer: { width: 48 },
  franjaNegra: { backgroundColor: '#000', paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ffcc00' },
  tituloFranja: { color: '#ffcc00', fontWeight: 'bold', fontSize: 12, letterSpacing: 1.1 },
  resumenChangoBox: { backgroundColor: '#001529', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#00E5FF' },
  resumenLabel: { color: '#AAA', fontSize: 12 },
  resumenTotalText: { color: '#ffcc00', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  listContainer: { padding: 15, gap: 10 },
  lineRow: { backgroundColor: '#000', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#002233', borderRadius: 6, borderWidth: 1, borderColor: '#00E5FF', paddingHorizontal: 2 },
  qtyBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtnText: { color: '#00E5FF', fontWeight: 'bold', fontSize: 14 },
  qtyText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 2 },
  imageContainer: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', borderRadius: 4 },
  productImage: { width: 34, height: 34 },
  infoContainer: { flex: 1 },
  productName: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  productMeasure: { color: '#AAA', fontSize: 11, marginBottom: 2 },
  superRowInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cheapestInfo: { color: '#ffcc00', fontSize: 11 },
  superLogo: { width: 45, height: 14 },
  superNameText: { color: '#00E5FF', fontSize: 11, fontWeight: 'bold' },
  lineaDorada: { height: 1.5, backgroundColor: '#ffcc00', width: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#000', paddingHorizontal: 40, paddingVertical: 12, alignItems: 'center' },
  footerButton: { alignItems: 'center', justifyContent: 'center' },
  footerIconCelestial: { width: 36, height: 36, tintColor: '#00E5FF', marginBottom: 2 },
  footerText: { color: '#FFF', fontSize: 11 }
});