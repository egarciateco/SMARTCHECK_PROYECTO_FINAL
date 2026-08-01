import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';

// --- LISTA MAESTRA DE LOS 12 RUBROS CON EMOJIS Y ESTILOS ---
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

// --- BASE DE DATOS MAESTRA COMPLETA PARA LOS 12 RUBROS ---
const CATALOGO_INTELIGENTE = {
  almacen: {
    nombre: 'Almacén',
    marcas: {
      terrabusi: {
        nombre: 'Terrabusi',
        logo: 'https://cdn-icons-png.flaticon.com/512/2488/2488749.png',
        tipos: {
          galletitas: {
            nombre: 'Galletitas Dulces',
            productos: [
              { id: 't_anillos_300', nombre: 'Anillos de Chocolate', medida: '300 gr', precioMasBarato: 1450, superMasBarato: 'Coto' },
              { id: 't_variedad_400', nombre: 'Variedad Terrabusi', medida: '400 gr', precioMasBarato: 2100, superMasBarato: 'Carrefour' },
              { id: 't_matutina_150', nombre: 'Matutinas', medida: '150 gr', precioMasBarato: 890, superMasBarato: 'Día' }
            ]
          },
          alfajores: {
            nombre: 'Alfajores',
            productos: [
              { id: 't_torta_6x', nombre: 'Alfajor Torta', medida: 'Caja x6', precioMasBarato: 3200, superMasBarato: 'Vea' }
            ]
          }
        }
      },
      lucchetti: {
        nombre: 'Lucchetti',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076136.png',
        tipos: {
          fideos: {
            nombre: 'Fideos Guiseros / Tallarines',
            productos: [
              { id: 'luc_tallarin_500', nombre: 'Tallarín /arroz/ tirabuzón', medida: '500 gr', precioMasBarato: 950, superMasBarato: 'Coto' },
              { id: 'luc_fideo_recorte', nombre: 'Fideos arroz / Moñito', medida: '500 gr', precioMasBarato: 980, superMasBarato: 'Día' }
            ]
          }
        }
      },
      gallo: {
        nombre: 'Arroz Gallo',
        logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
        tipos: {
          arroz: {
            nombre: 'Arroz Largo Fino',
            productos: [
              { id: 'gallo_oro_1kg', nombre: 'Arroz Gallo Oro', medida: '1 kg', precioMasBarato: 1850, superMasBarato: 'Carrefour' }
            ]
          }
        }
      }
    }
  },
  bebidas: {
    nombre: 'Bebidas',
    marcas: {
      coca_cola: {
        nombre: 'Coca-Cola',
        logo: 'https://cdn-icons-png.flaticon.com/512/2748/2748558.png',
        tipos: {
          gaseosas: {
            nombre: 'Gaseosa Cola',
            productos: [
              { id: 'coca_2_25l', nombre: 'Coca-Cola Retornable', medida: '2.25 Litros', precioMasBarato: 2400, superMasBarato: 'Coto' },
              { id: 'coca_1_5l', nombre: 'Coca-Cola Descartable', medida: '1.5 Litros', precioMasBarato: 1900, superMasBarato: 'Vea' }
            ]
          }
        }
      }
    }
  },
  lacteos: {
    nombre: 'Lácteos',
    marcas: {
      laserenisima: {
        nombre: 'La Serenísima',
        tipos: {
          leches: {
            nombre: 'Leche Entera / Descremada',
            productos: [
              { id: 'ls_leche_1l', nombre: 'Leche Sachet La Serenísima', medida: '1 Litro', precioMasBarato: 1350, superMasBarato: 'Coto' }
            ]
          },
          yogures: {
            nombre: 'Yogur Bebible',
            productos: [
              { id: 'ls_yogur_1l', nombre: 'Yogur Ser / Entero', medida: '1 Litro', precioMasBarato: 2200, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      sancor: {
        nombre: 'SanCor',
        tipos: {
          quesos: {
            nombre: 'Queso Untable',
            productos: [
              { id: 'sc_queso_300', nombre: 'Queso Untable Clásico', medida: '300 gr', precioMasBarato: 2500, superMasBarato: 'Día' }
            ]
          }
        }
      }
    }
  },
  carnes: {
    nombre: 'Carnes',
    marcas: {
      paty: {
        nombre: 'Paty',
        tipos: {
          hamburguesas: {
            nombre: 'Hamburguesas Vacunas',
            productos: [
              { id: 'paty_4u', nombre: 'Hamburguesas x4 unidades', medida: '320 gr', precioMasBarato: 3800, superMasBarato: 'Coto' }
            ]
          }
        }
      }
    }
  },
  frutasyverduras: {
    nombre: 'Frutas y Verduras',
    marcas: {
      fresco: {
        nombre: 'Selección Natural',
        tipos: {
          frutas: {
            nombre: 'Frutas Frescas',
            productos: [
              { id: 'manzana_kg', nombre: 'Manzana Roja', medida: '1 kg', precioMasBarato: 1900, superMasBarato: 'Carrefour' },
              { id: 'banana_kg', nombre: 'Banana Cavendish', medida: '1 kg', precioMasBarato: 1700, superMasBarato: 'Día' }
            ]
          }
        }
      }
    }
  },
  limpieza: {
    nombre: 'Limpieza',
    marcas: {
      ala: {
        nombre: 'Ala',
        tipos: {
          jabon_liquido: {
            nombre: 'Jabón Líquido para Ropa',
            productos: [
              { id: 'ala_liq_3l', nombre: 'Jabón Líquido Matic', medida: '3 Litros', precioMasBarato: 6500, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      magistral: {
        nombre: 'Magistral',
        tipos: {
          lavandina_detergente: {
            nombre: 'Detergente Concentrado',
            productos: [
              { id: 'mag_det_500', nombre: 'Detergente Limón', medida: '500 ml', precioMasBarato: 1800, superMasBarato: 'Vea' }
            ]
          }
        }
      }
    }
  },
  perfumeria: {
    nombre: 'Perfumería',
    marcas: {
      dove: {
        nombre: 'Dove',
        tipos: {
          jabones_shampoo: {
            nombre: 'Jabón de Tocador y Shampoo',
            productos: [
              { id: 'dove_jabon_3x', nombre: 'Jabón Tocador Pack x3', medida: '270 gr', precioMasBarato: 2400, superMasBarato: 'Carrefour' }
            ]
          }
        }
      }
    }
  },
  congelados: {
    nombre: 'Congelados',
    marcas: {
      granja_del_sol: {
        nombre: 'Granja del Sol',
        tipos: {
          rebozados: {
            nombre: 'Medallones de Pollo',
            productos: [
              { id: 'gds_medallones', nombre: 'Medallones Pollo y Queso', medida: '400 gr', precioMasBarato: 3400, superMasBarato: 'Coto' }
            ]
          }
        }
      }
    }
  },
  panaderia: {
    nombre: 'Panadería',
    marcas: {
      fargo: {
        nombre: 'Fargo',
        tipos: {
          pan_lactal: {
            nombre: 'Pan Lactal',
            productos: [
              { id: 'fargo_negro', nombre: 'Pan Lactal Salvado', medida: '560 gr', precioMasBarato: 2300, superMasBarato: 'Día' }
            ]
          }
        }
      }
    }
  },
  desayuno: {
    nombre: 'Desayuno',
    marcas: {
      nestle: {
        nombre: 'Nestlé',
        tipos: {
          cafe_cacao: {
            nombre: 'Café e Infusiones',
            productos: [
              { id: 'cafe_dolca_170', nombre: 'Café Instantáneo Dolca', medida: '170 gr', precioMasBarato: 4500, superMasBarato: 'Carrefour' }
            ]
          }
        }
      }
    }
  },
  bebes: {
    nombre: 'Bebés',
    marcas: {
      pampers: {
        nombre: 'Pampers',
        tipos: {
          pañales: {
            nombre: 'Pañales Descartables',
            productos: [
              { id: 'pampers_g_30', nombre: 'Pañales Confort Sec G', medida: '30 unidades', precioMasBarato: 7900, superMasBarato: 'Coto' }
            ]
          }
        }
      }
    }
  },
  mascotas: {
    nombre: 'Mascotas',
    marcas: {
      pedigree: {
        nombre: 'Pedigree',
        tipos: {
          alimento_perro: {
            nombre: 'Alimento Balanceado Perros',
            productos: [
              { id: 'pedigree_3kg', nombre: 'Alimento Perro Adulto', medida: '3 kg', precioMasBarato: 9200, superMasBarato: 'Carrefour' }
            ]
          }
        }
      }
    }
  }
};

export default function SelectorInteligenteScreen() {
  const navigation = useNavigation();

  // Estados para controlar los niveles en cascada
  const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  // Estado del Chango
  const [chango, setChango] = useState([]);

  // 1. Obtener marcas del rubro activo
  const marcasDelRubro = rubroSeleccionado && CATALOGO_INTELIGENTE[rubroSeleccionado] ? CATALOGO_INTELIGENTE[rubroSeleccionado].marcas : {};
  const marcasKeys = Object.keys(marcasDelRubro);

  // 2. Obtener tipos de la marca activa
  const tiposDeLaMarca = marcaSeleccionada && marcasDelRubro[marcaSeleccionada] ? marcasDelRubro[marcaSeleccionada].tipos : {};
  const tiposKeys = Object.keys(tiposDeLaMarca);

  // 3. Obtener productos del tipo activo
  const productosFinales = tipoSeleccionado && tiposDeLaMarca[tipoSeleccionado] ? tiposDeLaMarca[tipoSeleccionado].productos : [];

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
        rubro: CATALOGO_INTELIGENTE[rubroSeleccionado]?.nombre || rubroSeleccionado,
        marca: marcasDelRubro[marcaSeleccionada]?.nombre || marcaSeleccionada,
        tipo: tiposDeLaMarca[tipoSeleccionado]?.nombre || tipoSeleccionado,
        cantidad: 1 
      }]);
    }
    Alert.alert("¡Agregado al Chango!", `${producto.nombre} (${producto.medida}) añadido al menor precio en ${producto.superMasBarato}.`);
  };

  const cantidadTotalItems = chango.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER SUPERIOR CON LOGO Y NOMBRE DE LA APP */}
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

      {/* 2. 3 BOTONES SUPERIORES CON ASSETS (btnrubro, btnmarca, btntipo) E ILUMINACIÓN */}
      <View style={styles.breadcrumbContainer}>
        <TouchableOpacity 
          style={[styles.topStepButton, rubroSeleccionado && styles.stepActive]}
          onPress={() => seleccionarRubro(null)}
        >
          <Image 
            source={require('../../assets/btnrubro.png')} 
            style={[styles.stepImage, rubroSeleccionado && styles.stepImageActive]} 
            resizeMode="contain" 
          />
          <Text style={[styles.stepBtnText, rubroSeleccionado && styles.stepBtnTextActive]} numberOfLines={1}>
            {rubroSeleccionado ? (CATALOGO_INTELIGENTE[rubroSeleccionado]?.nombre || rubroSeleccionado) : 'Rubro'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topStepButton, marcaSeleccionada && styles.stepActive]}
          onPress={() => { if (rubroSeleccionado) seleccionarMarca(null); }}
          disabled={!rubroSeleccionado}
        >
          <Image 
            source={require('../../assets/btnmarca.png')} 
            style={[styles.stepImage, marcaSeleccionada && styles.stepImageActive]} 
            resizeMode="contain" 
          />
          <Text style={[styles.stepBtnText, marcaSeleccionada && styles.stepBtnTextActive]} numberOfLines={1}>
            {marcaSeleccionada ? marcasDelRubro[marcaSeleccionada]?.nombre : 'Marca'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topStepButton, tipoSeleccionado && styles.stepActive]}
          onPress={() => { if (marcaSeleccionada) setTipoSeleccionado(null); }}
          disabled={!marcaSeleccionada}
        >
          <Image 
            source={require('../../assets/btntipo.png')} 
            style={[styles.stepImage, tipoSeleccionado && styles.stepImageActive]} 
            resizeMode="contain" 
          />
          <Text style={[styles.stepBtnText, tipoSeleccionado && styles.stepBtnTextActive]} numberOfLines={1}>
            {tipoSeleccionado ? tiposDeLaMarca[tipoSeleccionado]?.nombre : 'Tipo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      {!rubroSeleccionado ? (
        <View style={styles.singleScreenRubrosContainer}>
          {/* FRANJA NEGRA DE LADO A LADO PARA EL TÍTULO */}
          <View style={styles.titleBanner}>
            <Text style={styles.tituloSeccionBanner}>SELECCIONÁ UN RUBRO:</Text>
          </View>
          
          <View style={styles.gridOpciones3Cols}>
            {CATEGORIAS_RUBROS.map(item => {
              const existeEnCatalogo = CATALOGO_INTELIGENTE[item.clave];
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.cardRubroCompacto, { borderLeftColor: item.color }]}
                  onPress={() => {
                    if (existeEnCatalogo) {
                      seleccionarRubro(item.clave);
                    } else {
                      Alert.alert("Próximamente", `El rubro ${item.nombre} estará disponible muy pronto.`);
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
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* NIVEL 2: SELECCIONAR MARCA CON LOGOS */}
          {rubroSeleccionado && !marcaSeleccionada && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Seleccione Marca ({CATALOGO_INTELIGENTE[rubroSeleccionado]?.nombre}):</Text>
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
                      {marca.logo ? (
                        <Image source={{ uri: marca.logo }} style={styles.brandLogo} resizeMode="contain" />
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

          {/* NIVEL 4 Y 5: PRODUCTO Y MEDIDA (Muestra el más barato) */}
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
                    <Text style={styles.precioText}>${prod.precioMasBarato}</Text>
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

      {/* FOOTER INFERIOR CON LÍNEA FINA DORADA Y BOTONES VOLVER / SALIR */}
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
              style={[styles.footerIcon, { tintColor: '#00E5FF' }]} 
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
              style={[styles.footerIcon, { tintColor: '#00E5FF' }]} 
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    backgroundColor: '#020C1B' 
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
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#112240', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e3a5f',
    gap: 8
  },
  topStepButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020C1B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1e3a5f'
  },
  stepActive: { 
    backgroundColor: '#1e3a5f', 
    borderColor: '#00E5FF' 
  },
  stepImage: { 
    width: 22, 
    height: 22, 
    marginRight: 6,
    tintColor: '#8892B0'
  },
  stepImageActive: {
    tintColor: '#00E5FF'
  },
  stepBtnText: { 
    color: '#8892B0', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  stepBtnTextActive: {
    color: '#00E5FF'
  },

  titleBanner: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f'
  },
  tituloSeccionBanner: { 
    color: '#FFD700', 
    fontSize: 14, 
    fontWeight: 'bold', 
    letterSpacing: 0.5 
  },

  singleScreenRubrosContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 6
  },
  
  gridOpciones3Cols: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    rowGap: 10,
    flex: 1,
    alignContent: 'space-around'
  },
  
  cardRubroCompacto: {
    width: '31%',
    backgroundColor: '#020C1B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderLeftWidth: 5,
    height: 82,
    justifyContent: 'center'
  },
  emojiTextCompact: { fontSize: 22, marginBottom: 4 },
  cardTextoRubroCompacto: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center'
  },

  contentScroll: { paddingBottom: 20 },
  seccionBloque: { marginBottom: 20 },
  
  gridOpciones: { flexDirection: 'column', gap: 10, paddingHorizontal: 16 },
  
  cardOpcion: {
    width: '100%', backgroundColor: '#020C1B', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 4, gap: 14
  },
  brandLogo: {
    width: 38,
    height: 38,
    resizeMode: 'contain'
  },
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

  footerContainer: {
    backgroundColor: '#020C1B',
  },
  footerGoldLine: {
    height: 1,
    backgroundColor: '#FFD700',
    width: '100%'
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#020C1B',
  },
  footerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  footerIcon: {
    width: 24,
    height: 24,
    marginBottom: 2
  },
  footerBtnText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold'
  }
});