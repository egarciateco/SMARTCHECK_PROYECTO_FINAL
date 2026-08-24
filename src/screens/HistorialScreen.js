import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Formato estricto argentino: 1.234.567,89 (puntos para miles, coma para centavos)
const formatPrecio = (val) => {
  const num = Number(val || 0);
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts[0]},${parts[1]}`;
};

export default function HistorialScreen({ navigation }) {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      const uid = user?.uid || user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://192.168.1.7:8000/api/users/historial-compras/${uid}`);
      
      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      const text = await response.text();
      const json = text ? JSON.parse(text) : [];
      
      const historialData = json.data || json;

      if (Array.isArray(historialData)) {
        setHistorial(historialData);
      } else {
        setHistorial([]);
      }
    } catch (error) {
      console.error("Error al cargar el historial:", error);
      Alert.alert("Atención", "No se pudo conectar con el servidor para recuperar el historial.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const fechaTexto = String(item?.fecha || 'Fecha no registrada');
    const cantidadItems = item?.itemsCount || (Array.isArray(item?.items) ? item.items.length : 0);
    const totalMonto = item?.total != null ? formatPrecio(item.total) : '0,00';

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('DetalleHistorialScreen', { compra: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#00E5FF" style={styles.calendarIcon} />
            <Text style={styles.dateText}>{fechaTexto}</Text>
          </View>
          <Text style={styles.itemsCountText}>{cantidadItems} ítems</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <Text style={styles.totalLabel}>Total de la compra:</Text>
          <Text style={styles.totalValue}>${totalMonto}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con Logo y Nombre de la App */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameImage} resizeMode="contain" />
        <View style={styles.headerSpacer} />
      </View>

      {/* Franja Negra con Título */}
      <View style={styles.franjaNegra}>
        <Text style={styles.tituloFranja}>REGISTRO DE CHANGOS GUARDADOS</Text>
      </View>

      {/* CONTENIDO */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : historial.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No tenés compras guardadas todavía.</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : String(index))}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* LÍNEA DORADA ANTES DEL FOOTER */}
      <View style={styles.lineaDorada} />

      {/* Footer con Volver y Salir */}
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
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#000', 
    paddingHorizontal: 15, 
    paddingVertical: 12 
  },
  logoImage: { width: 48, height: 48 },
  appNameImage: { width: 170, height: 32 },
  headerSpacer: { width: 48 },

  franjaNegra: { 
    backgroundColor: '#000', 
    paddingVertical: 8, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#ffcc00' 
  },
  tituloFranja: { color: '#ffcc00', fontWeight: 'bold', fontSize: 12, letterSpacing: 1.1 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#DDD', marginTop: 10, fontSize: 14 },
  emptyText: { color: '#AAA', marginTop: 10, fontSize: 14, textAlign: 'center' },

  listContainer: { padding: 15, gap: 12 },

  card: { 
    backgroundColor: '#000', 
    borderWidth: 1, 
    borderColor: '#00E5FF', 
    borderRadius: 8, 
    padding: 14 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: { marginRight: 6 },
  dateText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  itemsCountText: { color: '#00E5FF', fontSize: 12, fontWeight: 'bold', backgroundColor: '#002233', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },

  divider: { height: 1, backgroundColor: '#222', marginVertical: 10 },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#AAA', fontSize: 13 },
  totalValue: { color: '#ffcc00', fontSize: 18, fontWeight: 'bold' },

  lineaDorada: { height: 1.5, backgroundColor: '#ffcc00', width: '100%' },

  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#000', 
    paddingHorizontal: 40, 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  footerButton: { alignItems: 'center', justifyContent: 'center' },
  footerIconCelestial: { width: 36, height: 36, tintColor: '#00E5FF', marginBottom: 2 },
  footerText: { color: '#FFF', fontSize: 11 }
});