import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation, route }) {
  // Recibimos los productos del carrito y opcionalmente los datos del usuario (uid)
  const { carritoInicial = [], userData } = route.params || {};
  const [carrito, setCarrito] = useState(carritoInicial);
  const [guardando, setGuardando] = useState(false);

  const eliminarItem = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  // Motor inteligente para calcular el supermercado más barato global del carrito
  const calcularMejorSupermercado = () => {
    if (carrito.length === 0) return { super: 'Ninguno', total: 0 };
    
    const supers = {};
    carrito.forEach(item => {
      const sup = item.superMasBarato || 'Coto';
      supers[sup] = (supers[sup] || 0) + (item.precioMasBarato || 0);
    });

    let mejorSuper = 'Coto';
    let menorPrecio = Infinity;

    for (const [sup, total] of Object.entries(supers)) {
      if (total < menorPrecio) {
        menorPrecio = total;
        mejorSuper = sup;
      }
    }
    return { super: mejorSuper, total: menorPrecio };
  };

  const resultadoOptimo = calcularMejorSupermercado();

  // Función para guardar el chango utilizando tu endpoint de backend /api/users/historial-compras
  const guardarChangoEnHistorial = async () => {
    if (carrito.length === 0) {
      Alert.alert('Atención', 'El carrito está vacío.');
      return;
    }

    const uidUsuario = userData?.uid || 'USUARIO_TEST_UID'; // Reemplazar con el UID real de autenticación

    try {
      setGuardando(true);
      const response = await fetch('http://192.168.1.7:8000/api/users/historial-compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uidUsuario,
          fecha: new Date().toLocaleDateString('es-AR'),
          total: resultadoOptimo.total,
          itemsCount: carrito.length,
          items: carrito
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        Alert.alert('Éxito', '¡Chango guardado correctamente en tu historial!');
      } else {
        Alert.alert('Error', data.mensaje || 'No se pudo guardar el chango.');
      }
    } catch (error) {
      console.error('Error al guardar historial:', error);
      Alert.alert('Error', 'Hubo un problema de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const renderItemCarrito = ({ item }) => (
    <View style={styles.cartCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.nombre}</Text>
        <Text style={styles.itemMeasure}>
          {item.medida || 'Unidad'} • <Text style={{ color: '#00E5FF' }}>{item.superMasBarato}</Text>
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>${item.precioMasBarato?.toLocaleString('es-AR')}</Text>
        <TouchableOpacity onPress={() => eliminarItem(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

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

      {/* Banner de Resultado Óptimo */}
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryTitle}>MEJOR OPCIÓN DE COMPRA GLOBAL</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summarySuper}>
            Súper recomendado: <Text style={{ color: '#00E5FF' }}>{resultadoOptimo.super}</Text>
          </Text>
          <Text style={styles.summaryTotal}>
            ${resultadoOptimo.total.toLocaleString('es-AR')}
          </Text>
        </View>

        {carrito.length > 0 && (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={guardarChangoEnHistorial}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Chango en Historial</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Lista del Carrito */}
      <View style={styles.contentContainer}>
        {carrito.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cart-outline" size={56} color="#9CA3AF" />
            <Text style={styles.emptyText}>Tu carrito está vacío</Text>
            <Text style={styles.emptySubText}>Agregá productos desde el catálogo usando el changuito.</Text>
          </View>
        ) : (
          <FlatList
            data={carrito}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderItemCarrito}
            contentContainerStyle={styles.listContainer}
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
          <TouchableOpacity onPress={() => navigation.navigate('CategorySelection')} style={styles.footerButton}>
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
  summaryBanner: { backgroundColor: '#1F2937', padding: 14, margin: 16, borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37' },
  summaryTitle: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 6, textAlign: 'center', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summarySuper: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  summaryTotal: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#D4AF37', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#111827', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  listContainer: { paddingBottom: 16 },
  cartCard: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 10, padding: 12, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#374151' },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  itemMeasure: { color: '#9CA3AF', fontSize: 11 },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { color: '#10B981', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  deleteButton: { padding: 4 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { color: '#E5E7EB', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 4 },
  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 12 },
  goldLine: { width: '100%', height: 1.5, backgroundColor: '#D4AF37', marginBottom: 10 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  footerButton: { padding: 4 },
  footerIcon: { width: 36, height: 36, tintColor: '#00E5FF' }
});