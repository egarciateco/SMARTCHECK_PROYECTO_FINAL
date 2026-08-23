import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
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

// Formato estricto argentino: 1.234.567,89 (puntos para miles, coma para centavos)
const formatPrecio = (val) => {
  const num = Number(val || 0);
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts[0]},${parts[1]}`;
};

export default function DetalleHistorialScreen({ route, navigation }) {
  const { compra } = route.params || {};
  const productosOriginales = compra?.items || [];

  const [productos, setProductos] = useState(
    productosOriginales.map((item, index) => {
      const rawPrecio = Number(
        item?.precio ?? 
        item?.price ?? 
        item?.valor ?? 
        item?.costo ?? 
        item?.precioMasBarato ?? 
        item?.precioUnitario ?? 
        item?.unitPrice ?? 0
      );

      const rawSuper = 
        item?.supermercado ?? 
        item?.supermarket ?? 
        item?.tienda ?? 
        item?.nombreSupermercado ?? 
        item?.super ?? 
        item?.superMasBarato ?? 
        'Supermercado';

      const rawMedida = item?.medida ?? item?.presentacion ?? item?.peso ?? item?.contenido ?? 'Unidad';
      
      const rawImagen = 
        item?.imagen ?? 
        item?.image ?? 
        item?.img ?? 
        item?.foto ?? 
        item?.url ?? 
        item?.imageUrl ?? 
        item?.thumbnail ?? 
        null;

      return {
        ...item,
        idUnico: item.id || item.codigo || index.toString(),
        seleccionado: true,
        precioActual: rawPrecio,
        supermercadoActual: rawSuper,
        medidaActual: rawMedida,
        imagenActual: rawImagen,
        opcionesSupermercados: item.opcionesSupermercados || [
          { supermercado: rawSuper, precio: rawPrecio }
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
            console.log("Error al obtener imagen de Firestore:", error);
          }
        }
      }

      if (huboCambios) {
        setProductos(productosActualizados);
      }
    };

    fetchImagesFromFirestore();
  }, []);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Fecha no registrada';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) return fechaStr;

    const cleanDate = fechaStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const date = new Date(fechaStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return fechaStr;
  };

  const fechaFormateada = formatearFecha(compra?.fecha);

  const totalCalculadoOriginal = productos.reduce((acc, p) => acc + (Number(p.precioActual) * Number(p.cantidad || p.quantity || 1)), 0);
  const totalOriginal = compra?.total != null && Number(compra.total) > 0 
    ? formatPrecio(compra.total) 
    : formatPrecio(totalCalculadoOriginal);

  const toggleSeleccion = (idUnico) => {
    setProductos(prev =>
      prev.map(prod => (prod.idUnico === idUnico ? { ...prod, seleccionado: !prod.seleccionado } : prod))
    );
  };

  const handleReconfirmarChango = () => {
    const seleccionados = productos.filter(p => p.seleccionado);
    if (seleccionados.length === 0) {
      Alert.alert("Atención", "Debes seleccionar al menos un producto para el nuevo chango.");
      return;
    }

    navigation.navigate('NuevoChangoScreen', { productosSeleccionados: seleccionados });
  };

  const renderProductImage = (imagenUri) => {
    if (!imagenUri || typeof imagenUri !== 'string' || imagenUri.trim() === '') {
      return <Ionicons name="cube-outline" size={24} color="#00E5FF" />;
    }
    if (imagenUri.startsWith('http://') || imagenUri.startsWith('https://') || imagenUri.startsWith('file://')) {
      return <Image source={{ uri: imagenUri }} style={styles.productThumbnail} resizeMode="contain" />;
    }
    return <Ionicons name="cube-outline" size={24} color="#00E5FF" />;
  };

  const renderSupermarketDisplay = (superName) => {
    const logoSource = getSupermarketLogo(superName);
    if (logoSource) {
      return <Image source={logoSource} style={styles.superLogo} resizeMode="contain" />;
    }
    return <Text style={styles.superNameText}>{superName || 'Supermercado'}</Text>;
  };

  const renderProductoItem = ({ item }) => {
    const nombre = item?.nombre || item?.name || item?.titulo || 'Producto sin nombre';
    const precio = formatPrecio(item?.precioActual);
    const cantidad = item?.cantidad || item?.quantity || 1;
    const subtotal = formatPrecio(Number(item?.precioActual || 0) * Number(cantidad));

    return (
      <View style={styles.productCard}>
        <View style={styles.checkboxRow}>
          <Text style={styles.checkboxLabel}>Tildar para considerarlo en el nuevo chango:</Text>
          <TouchableOpacity 
            style={styles.checkboxButton} 
            onPress={() => toggleSeleccion(item.idUnico)}
          >
            <Ionicons 
              name={item.seleccionado ? "checkbox" : "square-outline"} 
              size={24} 
              color="#00E5FF" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardMainContent}>
          <View style={styles.imageWrapper}>
            {renderProductImage(item.imagenActual)}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{nombre}</Text>
            <Text style={styles.productDetails}>Cant: {cantidad} | Precio: ${precio}</Text>
            <View style={styles.superContainerRow}>
              <Text style={styles.superText}>Supermercado: </Text>
              {renderSupermarketDisplay(item.supermercadoActual)}
            </View>
          </View>
          <Text style={styles.productSubtotal}>${subtotal}</Text>
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
        <Text style={styles.tituloFranja}>DETALLE DEL CHANGO GUARDADO</Text>
      </View>

      <View style={styles.infoCompraHeader}>
        <Text style={styles.fechaCompraText}>Fecha: {fechaFormateada}</Text>
        <Text style={styles.totalCompraText}>Total: ${totalOriginal}</Text>
      </View>

      {productos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="basket-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No hay productos registrados en este chango.</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.idUnico}
          renderItem={renderProductoItem}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleReconfirmarChango}>
                <Ionicons name="cart-outline" size={18} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonPrimaryText}>Reconfirmar para Nuevo Chango</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
  infoCompraHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#001529' },
  fechaCompraText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  totalCompraText: { color: '#ffcc00', fontSize: 14, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#AAA', marginTop: 10, fontSize: 14, textAlign: 'center' },
  listContainer: { padding: 15, gap: 10 },
  productCard: { backgroundColor: '#000', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8, padding: 10 },
  checkboxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#112233', paddingBottom: 6 },
  checkboxLabel: { color: '#FFD700', fontSize: 10, fontStyle: 'italic', flex: 1, marginRight: 8 },
  checkboxButton: { padding: 2 },
  cardMainContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imageWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', borderRadius: 6 },
  productThumbnail: { width: 36, height: 36 },
  productInfo: { flex: 1 },
  productName: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  productDetails: { color: '#AAA', fontSize: 11, marginBottom: 2 },
  superContainerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  superText: { color: '#888', fontSize: 10 },
  superLogo: { width: 50, height: 16 },
  superNameText: { color: '#00E5FF', fontSize: 10, fontWeight: 'bold' },
  productSubtotal: { color: '#ffcc00', fontSize: 15, fontWeight: 'bold', marginLeft: 5 },
  actionButtonsContainer: { marginTop: 15, marginBottom: 10 },
  actionButtonPrimary: { backgroundColor: '#ffcc00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  actionButtonPrimaryText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  lineaDorada: { height: 1.5, backgroundColor: '#ffcc00', width: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#000', paddingHorizontal: 40, paddingVertical: 12, alignItems: 'center' },
  footerButton: { alignItems: 'center', justifyContent: 'center' },
  footerIconCelestial: { width: 36, height: 36, tintColor: '#00E5FF', marginBottom: 2 },
  footerText: { color: '#FFF', fontSize: 11 }
});