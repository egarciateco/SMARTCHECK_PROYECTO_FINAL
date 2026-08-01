import React, { useState, useEffect } from 'react';
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

export default function MisChangosScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Recibimos el uid del usuario (puede venir por parámetros de navegación o AsyncStorage según manejes tu app)
  const uidUsuario = route.params?.uid || 'USUARIO_UID_DEFECTO'; 

  const [changosGuardados, setChangosGuardados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarChangosGuardados();
  }, []);

  const cargarChangosGuardados = async () => {
    try {
      setLoading(true);
      // Petición real al endpoint GET /api/users/historial-compras/:uid que creamos en el backend
      const response = await api.get(`/api/users/historial-compras/${uidUsuario}`);
      
      if (response.data && response.data.status === 'success') {
        setChangosGuardados(response.data.historial || []);
      }
    } catch (error) {
      console.error("Error al cargar historial desde Firebase:", error);
      Alert.alert("Atención", "No se pudo sincronizar tu historial de changos guardados.");
    } finally {
      setLoading(false);
    }
  };

  const repetirChango = (chango) => {
    Alert.alert(
      "Repetir Chango",
      `¿Deseas cargar los ${chango.items?.length || 0} productos de este chango guardado?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, cargar", 
          onPress: () => navigation.navigate('ChangoComparativoScreen', { changoItems: chango.items }) 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00BFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Changos Guardados</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.seccionSubtitulo}>Tus listas de compras inteligentes para repetir mes a mes:</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Cargando tus changos...</Text>
          </View>
        ) : changosGuardados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={60} color="#8892B0" />
            <Text style={styles.emptyText}>No tienes changos guardados todavía.</Text>
            <Text style={styles.emptySubText}>Arma un chango y guárdalo al finalizar la comparativa.</Text>
          </View>
        ) : (
          changosGuardados.map((chango, index) => (
            <View key={chango.createdAt || index} style={styles.changoCard}>
              <View style={styles.changoCardHeader}>
                <View style={styles.rowFecha}>
                  <Ionicons name="calendar-outline" size={16} color="#FFD700" />
                  <Text style={styles.fechaText}>Guardado el: {chango.fecha}</Text>
                </View>
                <Text style={styles.totalText}>${Number(chango.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Text>
              </View>

              <Text style={styles.detallesResumenText}>
                {chango.items?.length || 0} productos optimizados en total.
              </Text>

              <TouchableOpacity 
                style={styles.btnRepetir}
                onPress={() => repetirChango(chango)}
              >
                <Ionicons name="repeat-outline" size={18} color="#0A192F" />
                <Text style={styles.btnRepetirText}>Repetir este Chango con 1 Toque</Text>
              </TouchableOpacity>
            </View>
          ))
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
  scrollContainer: { padding: 16 },
  seccionSubtitulo: { color: '#8892B0', fontSize: 13, marginBottom: 16 },
  centerContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { color: '#8892B0', fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#8892B0', fontSize: 12, marginTop: 4, textAlign: 'center' },
  changoCard: {
    backgroundColor: '#020C1B', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#1e3a5f'
  },
  changoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowFecha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fechaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  totalText: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold' },
  detallesResumenText: { color: '#8892B0', fontSize: 12, marginBottom: 14 },
  btnRepetir: {
    backgroundColor: '#FFD700', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 6
  },
  btnRepetirText: { color: '#0A192F', fontSize: 13, fontWeight: 'bold' }
});