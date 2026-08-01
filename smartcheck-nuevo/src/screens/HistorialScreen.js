import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistorialScreen({ navigation, route }) {
  const { userData } = route.params || {};
  const uidUsuario = userData?.uid || 'USUARIO_TEST_UID';

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulación de carga del historial desde el backend
  useEffect(() => {
    fetchHistorialCompras();
  }, []);

  const fetchHistorialCompras = async () => {
    try {
      setLoading(true);
      // Ajusta la URL según tu endpoint de backend
      const response = await fetch(`https://tu-api.com/api/users/historial-compras/${uidUsuario}`);
      const data = await response.json();

      if (data.status === 'success') {
        setHistorial(data.historial || []);
      } else {
        // Si el backend devuelve un array directo o estructura diferente
        setHistorial(data.data || []);
      }
    } catch (error) {
      console.error('Error al obtener historial:', error);
      Alert.alert('Error', 'No se pudo cargar el historial de compras.');
    } finally {
      setLoading(false);
    }
  };

  const renderItemHistorial = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#D4AF37" />
          <Text style={styles.dateText}>{item.fecha || 'Fecha desconocida'}</Text>
        </View>
        <Text style={styles.totalText}>${item.total?.toLocaleString('es-AR')}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <Text style={styles.infoText}>
          Ítems comprados: <Text style={{ color: '#E5E7EB' }}>{item.itemsCount || item.items?.length || 0}</Text>
        </Text>
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

      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>HISTORIAL DE CHANGOS</Text>
      </View>

      {/* Contenido Principal */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Cargando tus compras...</Text>
          </View>
        ) : historial.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="receipt-outline" size={56} color="#9CA3AF" />
            <Text style={styles.emptyText}>No tenés changos guardados</Text>
            <Text style={styles.emptySubText}>Tus compras guardadas aparecerán aquí.</Text>
          </View>
        ) : (
          <FlatList
            data={historial}
            keyExtractor={(item, index) => item.id || `historial-${index}`}
            renderItem={renderItemHistorial}
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
  titleContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  screenTitle: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  listContainer: { paddingBottom: 16, paddingTop: 8 },
  historyCard: { backgroundColor: '#1F2937', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: '#E5E7EB', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  totalText: { color: '#10B981', fontSize: 15, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 6 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  infoText: { color: '#9CA3AF', fontSize: 12 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { color: '#9CA3AF', fontSize: 13, marginTop: 10 },
  emptyText: { color: '#E5E7EB', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 4 },
  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 12 },
  goldLine: { width: '100%', height: 1.5, backgroundColor: '#D4AF37', marginBottom: 10 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  footerButton: { padding: 4 },
  footerIcon: { width: 36, height: 36, tintColor: '#00E5FF' }
});