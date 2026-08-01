import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';

// --- LISTA MAESTRA DE LOS 12 RUBROS (Iconos, Emojis y Colores visuales) ---
const CATEGORIAS_RUBROS = [
  { id: '1', nombre: 'Almacén', clave: 'almacen', emoji: '🛒', color: '#F59E0B' },
  { id: '2', nombre: 'Bebidas', clave: 'bebidas', emoji: '🥤', color: '#3B82F6' },
  { id: '3', nombre: 'Lácteos', clave: 'lacteos', emoji: '🥛', color: '#10B981' },
  { id: '4', nombre: 'Carnes', clave: 'carnes', emoji: '🥩', color: '#EF4444' },
  { id: '5', nombre: 'Frutas y Verduras', clave: 'frutasyverduras', emoji: '🍎', color: '#84CC16' },
  { id: '6', nombre: 'Limpieza', clave: 'limpieza', emoji: '🧹', color: '#8B5CF6' },
  { id: '7', nombre: 'Perfumería', clave: 'perfumeria', emoji: '🧴', color: '#EC4899' },
  { id: '8', nombre: 'Congelados', clave: 'congelados', emoji: '❄️', color: '#06B6D4' },
  { id: '9', nombre: 'Panadería', clave: 'panaderia', emoji: '🍞', color: '#D97706' },
  { id: '10', nombre: 'Desayuno', clave: 'desayuno', emoji: '☕', color: '#B45309' },
  { id: '11', nombre: 'Bebés', clave: 'bebes', emoji: '👶', color: '#6366F1' },
  { id: '12', nombre: 'Mascotas', clave: 'mascotas', emoji: '🐾', color: '#78716C' },
];

export default function SelectorInteligenteScreen() {
  const navigation = useNavigation();

  // Estados para controlar los niveles en cascada
  const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  // Estados para el catálogo de la nube y carga
  const [fullCatalog, setFullCatalog] = useState({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Estado del Chango
  const [chango, setChango] = useState([]);

  // Cargar catálogo completo desde la API de Render al iniciar
  useEffect(() => {
    obtenerCatalogoDeLaNube();
  }, []);

  const obtenerCatalogoDeLaNube = async () => {
    try {
      setLoadingCatalog(true);
      // Petición al endpoint backend que devuelve el catálogo masivo sincronizado
      const response = await api.get('/api/users/productos/catalogo');
      
      if (response.data && response.data.status === 'success') {
        setFullCatalog(response.data.catalogo || {});
      } else {
        Alert.alert("Atención", "No se pudo sincronizar el catálogo completo. Verifique su conexión.");
      }
    } catch (error) {
      console.error("Error al obtener catálogo de Render:", error);
      Alert.alert("Error de Conexión", "Imposible conectar con el servidor SmartCheck.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Derivar datos dinámicamente según la selección actual
  const rubroData = rubroSeleccionado && fullCatalog ? fullCatalog[rubroSeleccionado] : null;
  const marcasDelRubro = rubroData ? (rubroData.marcas || {}) : {};
  const marcasKeys = Object.keys(marcasDelRubro);

  const marcaData = marcaSeleccionada && marcasDelRubro ? marcasDelRubro[marcaSeleccionada] : null;
  const tiposDeLaMarca = marcaData ? (marcaData.tipos || {}) : {};
  const tiposKeys = Object.keys(tiposDeLaMarca);

  const tipoData = tipoSeleccionado && tiposDeLaMarca ? tiposDeLaMarca[tipoSeleccionado] : null;
  const productosFinales = tipoData ? (tipoData.productos || []) : [];

  // Funciones de selección con reseteo inteligente en cascada
  const seleccionarRubro = (key) => {
    setRubroSeleccionado(key);
    setMarcaSeleccionada(null);
    setTipoSeleccionado(null);
  };

  const seleccionarMarca = (key) => {
    setMarcaSeleccionada(key);
    setTipoSeleccionado(null);
  };

  const seleccionarTipo = (key) => {
    setTipoSeleccionado(key);
  };

  // Función para agregar al chango
  const agregarAlChango = (producto) => {
    const itemExistente = chango.find(item => item.id === producto.id);
    if (itemExistente) {
      setChango(chango.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setChango([...chango, { 
        ...producto, 
        rubro: rubroData?.nombre || rubroSeleccionado,
        marca: marcaData?.nombre || marcaSeleccionada,
        tipo: tipoData?.nombre || tipoSeleccionado,
        cantidad: 1 
      }]);
    }
    Alert.alert("¡Agregado al Chango!", `${producto.nombre} (${producto.medida}) añadido al menor precio.`);
  };

  const cantidadTotalItems = chango.reduce((acc, item) => acc + item.cantidad, 0);

  if (loadingCatalog) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: '#FFD700', marginTop: 12, fontWeight: 'bold' }}>Sincronizando base de precios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER SUPERIOR CON LOGO Y NOMBRE */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoMini} 
            resizeMode="contain" 
          />
          <Image 
            source={require('../../assets/nombreapp.png')} 
            style={styles.nombreApp} 
            resizeMode="contain" 
          />
        </View>

        <TouchableOpacity 
          style={styles.carritoBotonHeader}
          onPress={() => navigation.navigate('ChangoComparativoScreen', { changoItems: chango })}
        >
          <Ionicons name="cart" size={24} color="#FFD700" />
          {cantidadTotalItems > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{cantidadTotalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.titleGoldLine} />

      {/* 2. 3 BOTONES SUPERIORES CON ASSETS (btnrubro, btnmarca, btntipo) */}
      <View style={styles.breadcrumbContainer}>
        <TouchableOpacity 
          style={[styles.topStepButton, rubroSeleccionado && styles.stepActive]}
          onPress={() => seleccionarRubro(null)}
        >
          <Image 
            source={require('../../assets/btnrubro.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
          <Text style={[styles.stepBtnText, rubroSeleccionado && styles.stepBtnTextActive]} numberOfLines={1}>
            {rubroData ? rubroData.nombre : 'Rubro'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topStepButton, marcaSeleccionada && styles.stepActive]}
          onPress={() => { if (rubroSeleccionado) seleccionarMarca(null); }}
          disabled={!rubroSeleccionado}
        >
          <Image 
            source={require('../../assets/btnmarca.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
          <Text style={[styles.stepBtnText, marcaSeleccionada && styles.stepBtnTextActive]} numberOfLines={1}>
            {marcaData ? marcaData.nombre : 'Marca'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topStepButton, tipoSeleccionado && styles.stepActive]}
          onPress={() => { if (marcaSeleccionada) setTipoSeleccionado(null); }}
          disabled={!marcaSeleccionada}
        >
          <Image 
            source={require('../../assets/btntipo.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
          <Text style={[styles.stepBtnText, tipoSeleccionado && styles.stepBtnTextActive]} numberOfLines={1}>
            {tipoData ? tipoData.nombre : 'Tipo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      {!rubroSeleccionado ? (
        <View style={styles.singleScreenRubrosContainer}>
          <View style={styles.titleBanner}>
            <Text style={styles.tituloSeccionBanner}>SELECCIONÁ UN RUBRO:</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.gridOpciones3Cols} showsVerticalScrollIndicator={false}>
            {CATEGORIAS_RUBROS.map(item => {
              const existeEnCatalogo = fullCatalog[item.clave];
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.cardRubroCompacto, { borderLeftColor: item.color, opacity: existeEnCatalogo ? 1 : 0.6 }]}
                  onPress={() => {
                    if (existeEnCatalogo) {
                      seleccionarRubro(item.clave);
                    } else {
                      Alert.alert("Próximamente", `El rubro ${item.nombre} estará disponible próximamente.`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiTextCompact}>{item.emoji}</Text>
                  <Text style={styles.cardTextoRubroCompacto} numberOfLines={2}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* NIVEL 2: SELECCIONAR MARCA */}
          {rubroSeleccionado && !marcaSeleccionada && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Seleccione Marca ({rubroData?.nombre}):</Text>
              </View>
              <View style={styles.gridOpciones}>
                {marcasKeys.map(key => {
                  const marca = marcasDelRubro[key];
                  return (
                    <TouchableOpacity 
                      key={key} 
                      style={styles.cardOpcion}
                      onPress={() => seleccionarMarca(key)}
                    >
                      {marca.logo || marca.urlLogo ? (
                        <Image source={{ uri: marca.logo || marca.urlLogo }} style={styles.brandLogo} resizeMode="contain" />
                      ) : (
                        <Ionicons name="pricetag-outline" size={26} color="#00E5FF" />
                      )}
                      <Text style={styles.cardTexto}>{marca.nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* NIVEL 3: SELECCIONAR TIPO DE PRODUCTO */}
          {marcaSeleccionada && !tipoSeleccionado && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Seleccione Tipo de Producto:</Text>
              </View>
              <View style={styles.gridOpciones}>
                {tiposKeys.map(key => (
                  <TouchableOpacity 
                    key={key} 
                    style={styles.cardOpcion}
                    onPress={() => seleccionarTipo(key)}
                  >
                    <Ionicons name="file-tray-outline" size={26} color="#00FFCC" />
                    <Text style={styles.cardTexto}>{tiposDeLaMarca[key].nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* NIVEL 4 Y 5: PRODUCTOS Y PRECIOS MÁS BAJOS */}
          {tipoSeleccionado && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Productos y Medidas (Más económicos):</Text>
              </View>

              {productosFinales.map(prod => (
                <View key={prod.id} style={styles.productoCard}>
                  <View style={styles.infoProducto}>
                    <Text style={styles.nombreProducto}>{prod.nombre}</Text>
                    <Text style={styles.medidaProducto}>Medida: {prod.medida}</Text>
                    <View style={styles.badgeSuper}>
                      <Ionicons name="flash" size={12} color="#0A192F" />
                      <Text style={styles.badgeSuperText}>Más barato en: {prod.superMasBarato}</Text>
                    </View>
                  </View>
                  <View style={styles.precioAccionContainer}>
                    <Text style={styles.precioText}>${Number(prod.precioMasBarato || 0).toLocaleString('es-AR')}</Text>
                    <TouchableOpacity 
                      style={styles.btnAgregar}
                      onPress={() => agregarAlChango(prod)}
                    >
                      <Text style={styles.btnAgregarText}>+ Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* FOOTER INFERIOR */}
      <View style={styles.footerContainer}>
        <View style={styles.footerGoldLine} />
        <View style={styles.footerBar}>
          <TouchableOpacity 
            style={styles.footerBtn}
            onPress={() => {
              if (tipoSeleccionado) setTipoSeleccionado(null);
              else if (marcaSeleccionada) seleccionarMarca(null);
              else if (rubroSeleccionado) seleccionarRubro(null);
              else navigation.goBack();
            }}
          >
            <Image 
              source={require('../../assets/volver.png')} 
              style={styles.footerIcon} 
              resizeMode="contain" 
            />
            <Text style={styles.footerBtnText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footerBtn}
            onPress={() => navigation.navigate('ChangoComparativoScreen', { changoItems: chango })}
          >
            <Ionicons name="cart" size={22} color="#FFD700" />
            <Text style={[styles.footerBtnText, { color: '#FFD700' }]}>Chango ({cantidadTotalItems})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footerBtn}
            onPress={() => {
              Alert.alert("Salir", "¿Deseas salir de la aplicación?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Sí", onPress: () => navigation.goBack() }
              ]);
            }}
          >
            <Image 
              source={require('../../assets/salir.png')} 
              style={styles.footerIcon} 
              resizeMode="contain" 
            />
            <Text style={styles.footerBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  topHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#020C1B' 
  },
  headerLeftContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoMini: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  nombreApp: { width: 160, height: 40, resizeMode: 'contain' },
  carritoBotonHeader: { position: 'relative', padding: 6 },
  badgeContainer: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#FF4500',
    borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  titleGoldLine: { height: 1, backgroundColor: '#FFD700', width: '100%' },

  breadcrumbContainer: { 
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#112240', 
    paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1e3a5f', gap: 8
  },
  topStepButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#020C1B', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: '#1e3a5f'
  },
  stepActive: { backgroundColor: '#1e3a5f', borderColor: '#00E5FF' },
  stepImage: { width: 22, height: 22, marginRight: 6 }, // Sin tintColor para que tus assets se vean con su color real
  stepBtnText: { color: '#8892B0', fontSize: 12, fontWeight: 'bold' },
  stepBtnTextActive: { color: '#00E5FF' },

  titleBanner: {
    width: '100%', backgroundColor: '#000000', paddingVertical: 12, paddingHorizontal: 16,
    marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e3a5f'
  },
  tituloSeccionBanner: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },

  singleScreenRubrosContainer: { flex: 1, justifyContent: 'flex-start' },
  gridOpciones3Cols: { 
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', 
    paddingHorizontal: 16, rowGap: 10, paddingBottom: 20
  },
  cardRubroCompacto: {
    width: '31%', backgroundColor: '#020C1B', borderRadius: 10, paddingVertical: 8,
    paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, borderColor: '#1e3a5f',
    borderLeftWidth: 5, height: 82, justifyContent: 'center'
  },
  emojiTextCompact: { fontSize: 22, marginBottom: 4 },
  cardTextoRubroCompacto: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  contentScroll: { paddingBottom: 20 },
  seccionBloque: { marginBottom: 20 },
  gridOpciones: { flexDirection: 'column', gap: 10, paddingHorizontal: 16 },
  cardOpcion: {
    width: '100%', backgroundColor: '#020C1B', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 4, gap: 14
  },
  brandLogo: { width: 38, height: 38, resizeMode: 'contain' },
  cardTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  productoCard: {
    flexDirection: 'row', backgroundColor: '#020C1B', borderRadius: 12, padding: 14,
    marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e3a5f', alignItems: 'center', justifyContent: 'space-between'
  },
  infoProducto: { flex: 1, marginRight: 10 },
  nombreProducto: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  medidaProducto: { color: '#8892B0', fontSize: 12, marginBottom: 6 },
  badgeSuper: { flexDirection: 'row', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', alignItems: 'center', gap: 4 },
  badgeSuperText: { color: '#0A192F', fontSize: 10, fontWeight: 'bold' },
  precioAccionContainer: { alignItems: 'flex-end' },
  precioText: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  btnAgregar: { backgroundColor: '#00E5FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnAgregarText: { color: '#0A192F', fontSize: 12, fontWeight: 'bold' },

  footerContainer: { backgroundColor: '#020C1B' },
  footerGoldLine: { height: 1, backgroundColor: '#FFD700', width: '100%' },
  footerBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, backgroundColor: '#020C1B' },
  footerBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  footerIcon: { width: 24, height: 24, marginBottom: 2 },
  footerBtnText: { color: '#00E5FF', fontSize: 11, fontWeight: 'bold' }
});