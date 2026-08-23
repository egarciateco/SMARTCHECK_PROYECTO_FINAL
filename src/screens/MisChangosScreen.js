import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

export default function MisChangosScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [changosGuardados, setChangosGuardados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerUidYCargarHistorial();
  }, []);

  // Función auxiliar para transformar fecha de YYYY-MM-DD a DD/MM/AAAA
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

  // Función para calcular qué supermercado concentra el mayor monto
  const obtenerSuperMasConveniente = (items) => {
    if (!items || items.length === 0) return 'No especificado';
    const totalesPorSuper = {};
    items.forEach(item => {
      const superName = item.superMasBarato || 'Varios';
      const subtotal = (item.precioMasBarato || 0) * (item.cantidad || 1);
      totalesPorSuper[superName] = (totalesPorSuper[superName] || 0) + subtotal;
    });

    let superMasAlto = 'Varios';
    let mayorMonto = -1;
    for (const [superName, monto] of Object.entries(totalesPorSuper)) {
      if (monto > mayorMonto) {
        mayorMonto = monto;
        superMasAlto = superName;
      }
    }
    return superMasAlto;
  };

  // 🛡️ EXTRACCIÓN UNIVERSAL Y BLINDADA DEL UID (CORREGIDA CONTRA "undefined")
  const obtenerUidUniversal = async () => {
    // 1. Revisar si viene por parámetros de navegación
    if (route.params?.uid) return route.params.uid;

    const posiblesClaves = ['@smartcheck_user', 'user_uid', 'uid', 'userId', 'user', 'usuario', 'userData'];

    for (const clave of posiblesClaves) {
      try {
        const valorCrudo = await AsyncStorage.getItem(clave);
        
        // Filtramos nulos, vacíos y la cadena literal "undefined" o "null"
        if (
          !valorCrudo || 
          valorCrudo === 'undefined' || 
          valorCrudo === 'null' || 
          valorCrudo === '"undefined"' || 
          valorCrudo === '"null"'
        ) {
          continue;
        }

        // Intentar parsearlo como JSON
        let parsed;
        try {
          parsed = JSON.parse(valorCrudo);
        } catch (e) {
          // Si no es JSON, es texto plano (el UID directo)
          if (typeof valorCrudo === 'string' && valorCrudo.trim().length > 3) {
            return valorCrudo.trim();
          }
          continue;
        }

        if (parsed && typeof parsed === 'object') {
          // Búsqueda exhaustiva en todas las propiedades posibles del objeto
          const uidEncontrado = 
            parsed.id || 
            parsed.uid || 
            parsed._id || 
            parsed.userId || 
            parsed.user_uid || 
            parsed?.usuario?.id || 
            parsed?.usuario?.uid || 
            parsed?.usuario?._id || 
            parsed?.usuario?.userId ||
            parsed?.user?.id || 
            parsed?.user?.uid || 
            parsed?.user?._id ||
            parsed?.user?.userId ||
            parsed?.data?.id ||
            parsed?.data?.uid;

          if (uidEncontrado) {
            return String(uidEncontrado);
          }
        }
      } catch (err) {
        console.log(`Error leyendo clave ${clave}:`, err);
      }
    }
    return null;
  };

  const obtenerUidYCargarHistorial = async () => {
    try {
      setLoading(true);
      const uidUsuario = await obtenerUidUniversal();

      if (!uidUsuario) {
        console.warn("⚠️ No se pudo extraer el ID de usuario desde AsyncStorage.");
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/users/historial-compras/${uidUsuario}`);
      
      if (response.data && response.data.status === 'success') {
        setChangosGuardados(response.data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar historial desde Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Repetir chango consultando precios vigentes
  const repetirChango = (chango) => {
    Alert.alert(
      "Repetir Chango",
      `¿Deseas cargar los ${chango.items?.length || 0} productos de este chango con los precios vigentes de hoy?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, cargar", 
          onPress: async () => {
            try {
              setLoading(true);
              const itemsActualizados = await Promise.all(
                (chango.items || []).map(async (item) => {
                  try {
                    const res = await api.get(`/api/productos/${item.id}`);
                    if (res.data && res.data.producto) {
                      const p = res.data.producto;
                      return {
                        ...item,
                        precioMasBarato: p.precioMasBarato !== undefined ? p.precioMasBarato : item.precioMasBarato,
                        superMasBarato: p.superMasBarato !== undefined ? p.superMasBarato : item.superMasBarato,
                      };
                    }
                  } catch (err) {
                    // Mantiene el valor original si falla
                  }
                  return item;
                })
              );
              setLoading(false);
              navigation.navigate('ChangoComparativoScreen', { changoItems: itemsActualizados });
            } catch (e) {
              setLoading(false);
              navigation.navigate('ChangoComparativoScreen', { changoItems: chango.items });
            }
          } 
        }
      ]
    );
  };

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('@smartcheck_user');
      await AsyncStorage.removeItem('user_uid');
      navigation.navigate('LoginScreen');
    } catch (e) {
      navigation.navigate('LoginScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior */}
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} resizeMode="contain" />
        <View style={{ width: 55 }} />
      </View>

      {/* Título */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>MIS CHANGOS GUARDADOS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
          changosGuardados.map((chango, index) => {
            const superConveniente = obtenerSuperMasConveniente(chango.items);
            return (
              <View key={chango.createdAt || index} style={styles.changoCard}>
                <View style={styles.changoCardHeader}>
                  <View style={styles.rowFecha}>
                    <Ionicons name="calendar-outline" size={16} color="#FFD700" />
                    <Text style={styles.fechaText}>Guardado el: {formatearFecha(chango.fecha)}</Text>
                  </View>
                  <Text style={styles.totalText}>${Number(chango.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Text>
                </View>

                <Text style={styles.detallesResumenText}>
                  {chango.items?.length || 0} productos optimizados en total.
                </Text>

                <View style={styles.superConvenienteContainer}>
                  <Ionicons name="storefront-outline" size={14} color="#00FFCC" />
                  <Text style={styles.superConvenienteText}>
                    Supermercado Más Conveniente: <Text style={styles.superResaltado}>{superConveniente}</Text>
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.btnRepetir}
                  onPress={() => repetirChango(chango)}
                >
                  <Ionicons name="repeat-outline" size={18} color="#0A192F" />
                  <Text style={styles.btnRepetirText}>Repetir este Chango con 1 Toque</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.goldLine} />
        <View style={styles.footerControls}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../assets/volver.png')} style={styles.navIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={cerrarSesion}>
            <Image source={require('../../assets/salir.png')} style={styles.navIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  headerContainer: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#000000' 
  },
  logo: { width: 55, height: 55 },
  nombreApp: { width: 170, height: 35 },
  titleBar: { 
    backgroundColor: '#000000', paddingVertical: 15, width: '100%', 
    alignItems: 'center', marginVertical: 10,
    borderTopWidth: 1, borderTopColor: '#FFD700',
    borderBottomWidth: 1, borderBottomColor: '#FFD700'
  },
  titleText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  scrollContainer: { padding: 16 },
  centerContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { color: '#8892B0', fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubText: { color: '#8892B0', fontSize: 12, marginTop: 4, textAlign: 'center' },
  changoCard: { backgroundColor: '#020C1B', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e3a5f' },
  changoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowFecha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fechaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  totalText: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold' },
  detallesResumenText: { color: '#8892B0', fontSize: 12, marginBottom: 10 },
  superConvenienteContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#112240', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginBottom: 14, gap: 6 },
  superConvenienteText: { color: '#8892B0', fontSize: 12 },
  superResaltado: { color: '#00FFCC', fontWeight: 'bold' },
  btnRepetir: { backgroundColor: '#FFD700', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  btnRepetirText: { color: '#0A192F', fontSize: 13, fontWeight: 'bold' },
  footerContainer: { paddingBottom: 15 },
  goldLine: { height: 1, backgroundColor: '#FFD700', width: '100%', marginBottom: 10 },
  footerControls: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
  navIcon: { width: 40, height: 40, tintColor: '#00BFFF' }
});