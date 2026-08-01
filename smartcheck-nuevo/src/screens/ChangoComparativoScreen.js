import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../config/api';

export default function ChangoComparativoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Recibimos los ítems que trajo el usuario desde la pantalla anterior
  const [itemsChango, setItemsChango] = useState(route.params?.changoItems || []);
  const [guardando, setGuardando] = useState(false);

  // Función para modificar cantidad (+ / - / eliminar)
  const modificarCantidad = (id, delta) => {
    setItemsChango(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + delta;
          return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
        }
        return item;
      }).filter(Boolean); // Elimina si la cantidad llega a 0
    });
  };

  // Calcular total general de la compra optimizada (lo más barato de cada súper)
  const totalOptimizado = itemsChango.reduce((sum, item) => sum + (item.precioMasBarato * item.cantidad), 0);
  const totalItemsCount = itemsChango.reduce((sum, item) => sum + item.cantidad, 0);

  // Agrupar los ítems jerárquicamente para que el usuario de un vistazo vea si olvidó algo: Rubro -> Marca
  const agruparPorRubroYMarca = () => {
    const agrupar = {};
    itemsChango.forEach(item => {
      const rubro = item.rubro || 'Otros';
      const marca = item.marca || 'Varias';
      if (!agrupar[rubro]) agrupar[rubro] = {};
      if (!agrupar[rubro][marca]) agrupar[rubro][marca] = [];
      agrupar[rubro][marca].push(item);
    });
    return agrupar;
  };

  const changoAgrupado = agruparPorRubroYMarca();

  // Guardar historial de compra conectando con el backend real
  const guardarHistorialCompra = async () => {
    if (itemsChango.length === 0) {
      Alert.alert("Chango Vacío", "No hay productos en el chango para guardar.");
      return;
    }

    try {
      setGuardando(true);
      const fechaActual = new Date().toISOString().split('T')[0];
      const payload = {
        fecha: fechaActual,
        total: totalOptimizado,
        itemsCount: totalItemsCount,
        items: itemsChango
      };

      // Llamada real al backend para persistir el chango del usuario
      await api.post('/api/users/historial-compras', payload);

      Alert.alert(
        "¡Compra Guardada con Éxito!", 
        `Fecha: ${fechaActual}\nSupermercado más conveniente asignado por producto.\nEl próximo mes podrás repetir esta compra con 1 solo toque.`,
        [{ text: "OK", onPress: () => navigation.navigate('MisChangos') }]
      );
    } catch (error) {
      console.error("Error al guardar historial en backend:", error);
      Alert.alert("Aviso", "No se pudo conectar con el servidor para guardar el chango, pero se mantiene en sesión.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00BFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Chango Inteligente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* RESUMEN DE AHORRO / TOTAL */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Total Artículos:</Text>
            <Text style={styles.resumenValue}>{totalItemsCount} unidades</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Costo Total Óptimo:</Text>
            <Text style={styles.resumenPrecioTotal}>${totalOptimizado.toLocaleString()}</Text>
          </View>
          <View style={styles.badgeAhorroContainer}>
            <Ionicons name="trending-down" size={16} color="#0A192F" />
            <Text style={styles.badgeAhorroText}>Combinando los precios más bajos de tu zona</Text>
          </View>
        </View>

        {itemsChango.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#374151" />
            <Text style={styles.emptyText}>Tu chango está vacío actualmente.</Text>
            <TouchableOpacity 
              style={styles.btnVolverCatalogo}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnVolverTexto}>Volver al Selector Inteligente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.seccionTitulo}>Detalle ordenado por Rubro y Marca:</Text>
            
            {/* RECORRIDO JERÁRQUICO: Rubro ➔ Marca ➔ Productos */}
            {Object.keys(changoAgrupado).map(rubro => (
              <View key={rubro} style={styles.rubroBloque}>
                <View style={styles.rubroHeaderContainer}>
                  <Ionicons name="folder-open" size={18} color="#FFD700" />
                  <Text style={styles.rubroHeaderTitle}>{rubro.toUpperCase()}</Text>
                </View>

                {Object.keys(changoAgrupado[rubro]).map(marca => (
                  <View key={marca} style={styles.marcaSubBloque}>
                    <Text style={styles.marcaTitulo}>• Marca: {marca}</Text>

                    {changoAgrupado[rubro][marca].map(item => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemNombre}>{item.nombre}</Text>
                          <Text style={styles.itemMedida}>Medida: {item.medida}</Text>
                          <Text style={styles.itemSuper}>Mejor precio en: <Text style={styles.superResaltado}>{item.superMasBarato}</Text></Text>
                        </View>

                        <View style={styles.itemControlesContainer}>
                          <Text style={styles.itemSubtotal}>${(item.precioMasBarato * item.cantidad).toLocaleString()}</Text>
                          
                          <View style={styles.cantidadControles}>
                            <TouchableOpacity 
                              style={styles.btnCant}
                              onPress={() => modificarCantidad(item.id, -1)}
                            >
                              <Text style={styles.btnCantTexto}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.cantNumero}>{item.cantidad}</Text>
                            <TouchableOpacity 
                              style={styles.btnCant}
                              onPress={() => modificarCantidad(item.id, 1)}
                            >
                              <Text style={styles.btnCantTexto}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}

            {/* BOTÓN DE CONFIRMACIÓN / GUARDAR HISTORIAL */}
            <TouchableOpacity 
              style={[styles.btnGuardarHistorial, guardando && { opacity: 0.7 }]}
              onPress={guardarHistorialCompra}
              disabled={guardando}
            >
              <Ionicons name="save-outline" size={20} color="#0A192F" />
              <Text style={styles.btnGuardarTexto}>
                {guardando ? "Guardando..." : "Guardar Chango para Repetir el Mes Próximo"}
              </Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#020C1B',
    borderBottomWidth: 1, borderBottomColor: '#FFD700'
  },
  backButton: { padding: 4 },
  headerTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  resumenCard: {
    backgroundColor: '#020C1B', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#FFD700', marginBottom: 20
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resumenLabel: { color: '#8892B0', fontSize: 14 },
  resumenValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  resumenPrecioTotal: { color: '#00FFCC', fontSize: 22, fontWeight: 'bold' },
  badgeAhorroContainer: {
    flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 6,
    paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    marginTop: 10, gap: 6
  },
  badgeAhorroText: { color: '#0A192F', fontSize: 12, fontWeight: 'bold' },
  seccionTitulo: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#8892B0', fontSize: 14, marginTop: 12, marginBottom: 20 },
  btnVolverCatalogo: { backgroundColor: '#00E5FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnVolverTexto: { color: '#0A192F', fontSize: 13, fontWeight: 'bold' },
  rubroBloque: { marginBottom: 16, backgroundColor: '#112240', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1e3a5f' },
  rubroHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  rubroHeaderTitle: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  marcaSubBloque: { marginLeft: 10, marginBottom: 8 },
  marcaTitulo: { color: '#00E5FF', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  itemCard: {
    flexDirection: 'row', backgroundColor: '#020C1B', borderRadius: 8, padding: 10,
    marginBottom: 8, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1e3a5f'
  },
  itemInfo: { flex: 1, marginRight: 8 },
  itemNombre: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  itemMedida: { color: '#8892B0', fontSize: 11, marginBottom: 2 },
  itemSuper: { color: '#8892B0', fontSize: 10 },
  superResaltado: { color: '#00FFCC', fontWeight: 'bold' },
  itemControlesContainer: { alignItems: 'flex-end' },
  itemSubtotal: { color: '#00FFCC', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  cantidadControles: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#112240', borderRadius: 6, borderWidth: 1, borderColor: '#1e3a5f' },
  btnCant: { paddingHorizontal: 10, paddingVertical: 2 },
  btnCantTexto: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  cantNumero: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 6 },
  btnGuardarHistorial: {
    backgroundColor: '#FFD700', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 10, gap: 8
  },
  btnGuardarTexto: { color: '#0A192F', fontSize: 14, fontWeight: 'bold' }
});