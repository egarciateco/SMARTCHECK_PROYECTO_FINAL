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
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// --- LISTA MAESTRA DE LOS 12 RUBROS ---
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

// --- BASE DE DATOS EXTENDIDA CON MÚLTIPLES MARCAS Y PRODUCTOS POR RUBRO ---
const CATALOGO_INTELIGENTE = {
  almacen: {
    nombre: 'Almacén',
    marcas: {
      terrabusi: {
        nombre: 'Terrabusi',
        logo: 'https://cdn-icons-png.flaticon.com/512/2488/2488749.png',
        tipos: {
          galletitas: {
            nombre: 'Galletitas Dulces y Saladas',
            productos: [
              { id: 't_anillos_300', barcode: '7790070112233', nombre: 'Anillos de Chocolate', medida: '300 gr', precioMasBarato: 1450, superMasBarato: 'Coto' },
              { id: 't_variedad_400', barcode: '7790070112240', nombre: 'Variedad Terrabusi', medida: '400 gr', precioMasBarato: 2100, superMasBarato: 'Carrefour' },
              { id: 't_matutina_150', barcode: '7790070112257', nombre: 'Galletitas Matutinas', medida: '150 gr', precioMasBarato: 890, superMasBarato: 'Día' },
              { id: 't_anana_160', barcode: '7790070112264', nombre: 'Ananá Ring', medida: '160 gr', precioMasBarato: 990, superMasBarato: 'Vea' },
              { id: 't_ducales_200', barcode: '7790070112271', nombre: 'Galletitas Ducal Hojaldre', medida: '200 gr', precioMasBarato: 1150, superMasBarato: 'Coto' },
              { id: 't_lincoln_150', barcode: '7790070112288', nombre: 'Galletitas Lincoln', medida: '150 gr', precioMasBarato: 750, superMasBarato: 'Día' },
            ]
          },
          alfajores: {
            nombre: 'Alfajores y Golosinas',
            productos: [
              { id: 't_torta_6x', barcode: '7790070223344', nombre: 'Alfajor Torta Terrabusi', medida: 'Caja x6', precioMasBarato: 3200, superMasBarato: 'Vea' },
              { id: 't_minitorta_sencillo', barcode: '7790070223351', nombre: 'Alfajor Terrabusi Clásico DDL', medida: 'Single 55g', precioMasBarato: 650, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      lucchetti: {
        nombre: 'Lucchetti',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076136.png',
        tipos: {
          fideos: {
            nombre: 'Fideos y Pastas Secas',
            productos: [
              { id: 'luc_tallarin_500', barcode: '7790390111222', nombre: 'Tallarines N° 5', medida: '500 gr', precioMasBarato: 950, superMasBarato: 'Coto' },
              { id: 'luc_tirabuzon_500', barcode: '7790390111239', nombre: 'Fideos Tirabuzón', medida: '500 gr', precioMasBarato: 950, superMasBarato: 'Día' },
              { id: 'luc_coda_500', barcode: '7790390111253', nombre: 'Fideos Coditos', medida: '500 gr', precioMasBarato: 920, superMasBarato: 'Vea' }
            ]
          },
          salsas: {
            nombre: 'Salsas y Pure de Tomate',
            productos: [
              { id: 'luc_pure_520', barcode: '7790390333444', nombre: 'Puré de Tomate Lucchetti', medida: '520 gr', precioMasBarato: 850, superMasBarato: 'Coto' },
              { id: 'luc_tuco_300', barcode: '7790390333451', nombre: 'Salsa Listo Tuco', medida: '300 gr', precioMasBarato: 1100, superMasBarato: 'Día' }
            ]
          }
        }
      },
      gallo: {
        nombre: 'Arroz Gallo',
        logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
        tipos: {
          arroz: {
            nombre: 'Arroces Seleccionados',
            productos: [
              { id: 'gallo_oro_1kg', barcode: '7791234567890', nombre: 'Arroz Gallo Oro Largo Fino', medida: '1 kg', precioMasBarato: 1850, superMasBarato: 'Carrefour' },
              { id: 'gallo_doble_1kg', barcode: '7791234567891', nombre: 'Arroz Gallo Doble Carolina', medida: '1 kg', precioMasBarato: 2100, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      marolio: {
        nombre: 'Marolio',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076137.png',
        tipos: {
          varios: {
            nombre: 'Conservas y Aceites',
            productos: [
              { id: 'marolio_aceite_1l', barcode: '7792222333444', nombre: 'Aceite de Girasol Marolio', medida: '1.5 Litros', precioMasBarato: 1950, superMasBarato: 'Día' },
              { id: 'marolio_arvejas', barcode: '7792222333451', nombre: 'Arvejas Secas Deshidratadas', medida: '300 gr', precioMasBarato: 650, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      arcor: {
        nombre: 'Arcor',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076138.png',
        tipos: {
          golosinas: {
            nombre: 'Golpes y Mermeladas',
            productos: [
              { id: 'arcor_mermelada', barcode: '7790580112233', nombre: 'Mermelada de Damasco Arcor', medida: '454 gr', precioMasBarato: 1600, superMasBarato: 'Carrefour' },
              { id: 'arcor_durazno', barcode: '7790580112240', nombre: 'Duraznos en Almíbar Arcor', medida: '820 gr', precioMasBarato: 2450, superMasBarato: 'Vea' }
            ]
          }
        }
      },
      molinos: {
        nombre: 'Molinos',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076139.png',
        tipos: {
          harinas: {
            nombre: 'Harinas y Premezclas',
            productos: [
              { id: 'molinos_blanca_flore', barcode: '7790700111222', nombre: 'Harina 000 Blanca Flor', medida: '1 kg', precioMasBarato: 850, superMasBarato: 'Coto' }
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
            nombre: 'Gaseosas Cola y Sabores',
            productos: [
              { id: 'coca_2_25l', barcode: '7790895001011', nombre: 'Coca-Cola Retornable', medida: '2.25 Litros', precioMasBarato: 2400, superMasBarato: 'Coto' },
              { id: 'coca_1_5l', barcode: '7790895001028', nombre: 'Coca-Cola Descartable', medida: '1.5 Litros', precioMasBarato: 1900, superMasBarato: 'Vea' },
              { id: 'sprite_2l', barcode: '7790895002010', nombre: 'Sprite Limón Descartable', medida: '2.25 Litros', precioMasBarato: 2300, superMasBarato: 'Día' }
            ]
          }
        }
      },
      pepsi: {
        nombre: 'PepsiCo',
        logo: 'https://cdn-icons-png.flaticon.com/512/2748/2748560.png',
        tipos: {
          gaseosas: {
            nombre: 'Línea Pepsi y 7Up',
            productos: [
              { id: 'pepsi_2l', barcode: '7790896001011', nombre: 'Pepsi Descartable', medida: '2.25 Litros', precioMasBarato: 2300, superMasBarato: 'Carrefour' },
              { id: '7up_2l', barcode: '7790896002022', nombre: '7Up Lima Limón', medida: '2.25 Litros', precioMasBarato: 2200, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      villavicencio: {
        nombre: 'Villavicencio',
        logo: 'https://cdn-icons-png.flaticon.com/512/3105/3105807.png',
        tipos: {
          aguas: {
            nombre: 'Aguas Minerales y Saborizadas',
            productos: [
              { id: 'villavicencio_1_5l', barcode: '7790300111222', nombre: 'Agua Mineral Sin Gas', medida: '1.5 Litros', precioMasBarato: 1100, superMasBarato: 'Vea' },
              { id: 'villavicencio_sabor_pomelo', barcode: '7790300111239', nombre: 'Agua Saborizada Pomelo', medida: '1.5 Litros', precioMasBarato: 1400, superMasBarato: 'Día' }
            ]
          }
        }
      },
      quilmes: {
        nombre: 'Cervecería Quilmes',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076105.png',
        tipos: {
          cervezas: {
            nombre: 'Cervezas y Sidras',
            productos: [
              { id: 'quilmes_1l', barcode: '7791540001234', nombre: 'Cerveza Quilmes Clásica Retornable', medida: '1 Litro', precioMasBarato: 1800, superMasBarato: 'Coto' },
              { id: 'stella_arltois_pack', barcode: '7791540005678', nombre: 'Cerveza Stella Artois No Retornable', medida: '1 Litro', precioMasBarato: 2600, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      baggio: {
        nombre: 'Baggio',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076106.png',
        tipos: {
          jugos: {
            nombre: 'Jugos y Néctares',
            productos: [
              { id: 'baggio_naranja_1l', barcode: '7790350111222', nombre: 'Jugo Baggio Naranja', medida: '1 Litro', precioMasBarato: 1250, superMasBarato: 'Día' }
            ]
          }
        }
      },
      gatorade: {
        nombre: 'Gatorade',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076107.png',
        tipos: {
          isotonicas: {
            nombre: 'Bebidas Deportivas',
            productos: [
              { id: 'gatorade_manzana_500', barcode: '7790350222333', nombre: 'Gatorade Manzana', medida: '500 ml', precioMasBarato: 1100, superMasBarato: 'Carrefour' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',
        tipos: {
          leches: {
            nombre: 'Leches Sachet y Cartón',
            productos: [
              { id: 'ls_leche_1l', barcode: '7790580123450', nombre: 'Leche Entera Sachet', medida: '1 Litro', precioMasBarato: 1350, superMasBarato: 'Coto' },
              { id: 'ls_leche_desc_1l', barcode: '7790580123451', nombre: 'Leche Descremada Sachet', medida: '1 Litro', precioMasBarato: 1350, superMasBarato: 'Carrefour' }
            ]
          },
          yogures: {
            nombre: 'Yogures y Postres',
            productos: [
              { id: 'ls_yogur_1l', barcode: '7790580987654', nombre: 'Yogur Bebible Ser / Clásico', medida: '1 Litro', precioMasBarato: 2200, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      sancor: {
        nombre: 'SanCor',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050160.png',
        tipos: {
          quesos: {
            nombre: 'Quesos Untables y Rallados',
            productos: [
              { id: 'sc_queso_300', barcode: '7790356001122', nombre: 'Queso Untable Clásico', medida: '300 gr', precioMasBarato: 2500, superMasBarato: 'Día' },
              { id: 'sc_rallado_150', barcode: '7790356001139', nombre: 'Queso Rallado Sachet', medida: '150 gr', precioMasBarato: 3100, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      tregar: {
        nombre: 'Tregar',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050175.png',
        tipos: {
          crema_manteca: {
            nombre: 'Cremas y Mantecas',
            productos: [
              { id: 'tregar_manteca_200', barcode: '7793333444555', nombre: 'Manteca Tradicional Tregar', medida: '200 gr', precioMasBarato: 1750, superMasBarato: 'Vea' },
              { id: 'tregar_crema_200', barcode: '7793333444562', nombre: 'Crema de Leche Tregar', medida: '200 cc', precioMasBarato: 1600, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      milkaut: {
        nombre: 'Milkaut',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050176.png',
        tipos: {
          quesos_cremas: {
            nombre: 'Quesos y Postrecitos',
            productos: [
              { id: 'milkaut_crema_200', barcode: '7794444111222', nombre: 'Queso Crema Milkaut', medida: '300 gr', precioMasBarato: 2350, superMasBarato: 'Carrefour' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
        tipos: {
          hamburguesas: {
            nombre: 'Hamburguesas Vacunas',
            productos: [
              { id: 'paty_4u', barcode: '7791111222333', nombre: 'Hamburguesas Paty x4', medida: '320 gr', precioMasBarato: 3800, superMasBarato: 'Coto' },
              { id: 'paty_8u', barcode: '7791111222340', nombre: 'Hamburguesas Paty x8 Familiar', medida: '640 gr', precioMasBarato: 7100, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      swift: {
        nombre: 'Swift',
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075980.png',
        tipos: {
          congelados_vacunos: {
            nombre: 'Hamburguesas y Despostados',
            productos: [
              { id: 'swift_hamburguesas_4u', barcode: '7794444555666', nombre: 'Medallones de Carne Swift x4', medida: '280 gr', precioMasBarato: 3200, superMasBarato: 'Día' }
            ]
          }
        }
      },
      paladini: {
        nombre: 'Paladini',
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075981.png',
        tipos: {
          fiambres_embutidos: {
            nombre: 'Salchichas y Fiambres',
            productos: [
              { id: 'paladini_salchichas_6u', barcode: '7795555666777', nombre: 'Salchichas Viena Paladini x6', medida: '190 gr', precioMasBarato: 1200, superMasBarato: 'Vea' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3186/3186718.png',
        tipos: {
          frutas: {
            nombre: 'Frutas Frescas',
            productos: [
              { id: 'manzana_kg', barcode: '2000000001001', nombre: 'Manzana Roja Seleccionada', medida: '1 kg', precioMasBarato: 1900, superMasBarato: 'Carrefour' },
              { id: 'banana_kg', barcode: '2000000001002', nombre: 'Banana Cavendish', medida: '1 kg', precioMasBarato: 1700, superMasBarato: 'Día' }
            ]
          },
          verduras: {
            nombre: 'Verduras y Hortalizas',
            productos: [
              { id: 'papa_kg', barcode: '2000000001003', nombre: 'Papa Negra Seleccionada', medida: '1 kg', precioMasBarato: 1100, superMasBarato: 'Coto' },
              { id: 'cebolla_kg', barcode: '2000000001004', nombre: 'Cebolla Blanca', medida: '1 kg', precioMasBarato: 950, superMasBarato: 'Vea' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921825.png',
        tipos: {
          jabon_liquido: {
            nombre: 'Jabón Líquido y en Polvo',
            productos: [
              { id: 'ala_liq_3l', barcode: '7794000123123', nombre: 'Jabón Líquido Matic', medida: '3 Litros', precioMasBarato: 6500, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      magistral: {
        nombre: 'Magistral',
        logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921828.png',
        tipos: {
          lavandina_detergente: {
            nombre: 'Detergentes Concentrados',
            productos: [
              { id: 'mag_det_500', barcode: '7794000456456', nombre: 'Detergente Limón', medida: '500 ml', precioMasBarato: 1800, superMasBarato: 'Vea' }
            ]
          }
        }
      },
      cif: {
        nombre: 'Cif',
        logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921830.png',
        tipos: {
          limpiadores: {
            nombre: 'Limpiadores Cremosos y Pisos',
            productos: [
              { id: 'cif_crema_500', barcode: '7794555666777', nombre: 'Cif Limpiador Cremoso Original', medida: '500 gr', precioMasBarato: 1900, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      ayudin: {
        nombre: 'Ayudín',
        logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921831.png',
        tipos: {
          desinfectantes: {
            nombre: 'Lavandinas y Desinfectantes',
            productos: [
              { id: 'ayudin_lavandina_1l', barcode: '7794666777888', nombre: 'Lavandina Tradicional Ayudín', medida: '1 Litro', precioMasBarato: 1150, superMasBarato: 'Día' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050201.png',
        tipos: {
          jabones_shampoo: {
            nombre: 'Jabones y Cuidado Personal',
            productos: [
              { id: 'dove_jabon_3x', barcode: '7795000789789', nombre: 'Jabón Tocador Pack x3', medida: '270 gr', precioMasBarato: 2400, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      sedal: {
        nombre: 'Sedal',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050210.png',
        tipos: {
          shampoo_acondicionador: {
            nombre: 'Shampoos y Cremas de Enjuague',
            productos: [
              { id: 'sedal_shampoo_340', barcode: '7795111222333', nombre: 'Shampoo Sedal Ceramidas', medida: '340 ml', precioMasBarato: 2100, superMasBarato: 'Día' }
            ]
          }
        }
      },
      colgate: {
        nombre: 'Colgate',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050212.png',
        tipos: {
          dental: {
            nombre: 'Pastas y Cepillos Dentales',
            productos: [
              { id: 'colgate_triple_180', barcode: '7795222333444', nombre: 'Pasta Dental Colgate Triple Acción', medida: '180 gr', precioMasBarato: 1950, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      rexona: {
        nombre: 'Rexona',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050215.png',
        tipos: {
          desodorantes: {
            nombre: 'Desodorantes y Antitranspirantes',
            productos: [
              { id: 'rexona_aer_150', barcode: '7795333444555', nombre: 'Desodorante Aerosol Rexona Men', medida: '150 ml', precioMasBarato: 2300, superMasBarato: 'Vea' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075990.png',
        tipos: {
          rebozados: {
            nombre: 'Medallones y Pollo Congelado',
            productos: [
              { id: 'gds_medallones', barcode: '7796000111222', nombre: 'Medallones Pollo y Queso', medida: '400 gr', precioMasBarato: 3400, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      mccain: {
        nombre: 'McCain',
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075995.png',
        tipos: {
          papas: {
            nombre: 'Papas Bastón Congeladas',
            productos: [
              { id: 'mccain_papas_720', barcode: '7796222333444', nombre: 'Papas Noisettes / Bastón McCain', medida: '720 gr', precioMasBarato: 3800, superMasBarato: 'Vea' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076115.png',
        tipos: {
          pan_lactal: {
            nombre: 'Pan Lactal y Derivados',
            productos: [
              { id: 'fargo_negro', barcode: '7797000333444', nombre: 'Pan Lactal Salvado', medida: '560 gr', precioMasBarato: 2300, superMasBarato: 'Día' }
            ]
          }
        }
      },
      bimbo: {
        nombre: 'Bimbo',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076120.png',
        tipos: {
          panificados: {
            nombre: 'Panes de Miga y Hamburguesas',
            productos: [
              { id: 'bimbo_artesano', barcode: '7797111222333', nombre: 'Pan Bimbo Artesano Rodajas', medida: '500 gr', precioMasBarato: 2500, superMasBarato: 'Carrefour' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076140.png',
        tipos: {
          cafe_cacao: {
            nombre: 'Café e Infusiones',
            productos: [
              { id: 'cafe_dolca_170', barcode: '7798000555666', nombre: 'Café Instantáneo Dolca', medida: '170 gr', precioMasBarato: 4500, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      lavinia: {
        nombre: 'La Virginia',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076145.png',
        tipos: {
          te_mate: {
            nombre: 'Té y Mate Cocido',
            productos: [
              { id: 'lavinia_te_50u', barcode: '7798222333444', nombre: 'Té Saquitos La Virginia', medida: '50 unidades', precioMasBarato: 1500, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      aguila: {
        nombre: 'Águila',
        logo: 'https://cdn-icons-png.flaticon.com/512/3076/3076146.png',
        tipos: {
          cacao: {
            nombre: 'Cacao en Polvo',
            productos: [
              { id: 'aguila_cacao_360', barcode: '7798333444555', nombre: 'Cacao Soluble Águila', medida: '360 gr', precioMasBarato: 2800, superMasBarato: 'Vea' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050220.png',
        tipos: {
          pañales: {
            nombre: 'Pañales y Toallitas',
            productos: [
              { id: 'pampers_g_30', barcode: '7799000111999', nombre: 'Pañales Confort Sec G', medida: '30 unidades', precioMasBarato: 7900, superMasBarato: 'Coto' }
            ]
          }
        }
      },
      huggies: {
        nombre: 'Huggies',
        logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050225.png',
        tipos: {
          cuidado_bebe: {
            nombre: 'Pañales Protect Plus',
            productos: [
              { id: 'huggies_protect_m', barcode: '7799111222333', nombre: 'Pañales Huggies M', medida: '34 unidades', precioMasBarato: 8200, superMasBarato: 'Vea' }
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
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075960.png',
        tipos: {
          alimento_perro: {
            nombre: 'Alimentos Balanceados',
            productos: [
              { id: 'pedigree_3kg', barcode: '7790123456789', nombre: 'Alimento Perro Adulto', medida: '3 kg', precioMasBarato: 9200, superMasBarato: 'Carrefour' }
            ]
          }
        }
      },
      whiskas: {
        nombre: 'Whiskas',
        logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075965.png',
        tipos: {
          alimento_gato: {
            nombre: 'Alimentos para Gatos',
            productos: [
              { id: 'whiskas_carne_1kg', barcode: '7790987654321', nombre: 'Alimento Gato Adulto Carne', medida: '1 kg', precioMasBarato: 4100, superMasBarato: 'Coto' }
            ]
          }
        }
      }
    }
  }
};

export default function SelectorInteligenteScreen({ route }) {
  const navigation = useNavigation();

  // Estados de navegación en cascada
  const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  // Estados de Buscador y Escáner
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [modalEscannerVisible, setModalEscannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Estado del Chango
  const [chango, setChango] = useState(route?.params?.changoItems || []);

  // Control de errores de carga de imágenes de logos
  const [logoErrors, setLogoErrors] = useState({});

  const handleImageError = (key) => {
    setLogoErrors(prev => ({ ...prev, [key]: true }));
  };

  // 1. Obtener marcas del rubro activo
  const marcasDelRubro = rubroSeleccionado && CATALOGO_INTELIGENTE[rubroSeleccionado] ? CATALOGO_INTELIGENTE[rubroSeleccionado].marcas : {};
  const marcasKeys = Object.keys(marcasDelRubro);

  // 2. Obtener tipos de la marca activa
  const tiposDeLaMarca = marcaSeleccionada && marcasDelRubro[marcaSeleccionada] ? marcasDelRubro[marcaSeleccionada].tipos : {};
  const tiposKeys = Object.keys(tiposDeLaMarca);

  // 3. Obtener productos del tipo activo
  const productosFinales = tipoSeleccionado && tiposDeLaMarca[tipoSeleccionado] ? tiposDeLaMarca[tipoSeleccionado].productos : [];

  // Función de búsqueda global en todo el catálogo
  const obtenerProductosBusqueda = () => {
    if (!textoBusqueda.trim()) return [];
    const query = textoBusqueda.toLowerCase();
    let resultados = [];

    Object.keys(CATALOGO_INTELIGENTE).forEach(rubroKey => {
      const rubroObj = CATALOGO_INTELIGENTE[rubroKey];
      Object.keys(rubroObj.marcas).forEach(marcaKey => {
        const marcaObj = rubroObj.marcas[marcaKey];
        Object.keys(marcaObj.tipos).forEach(tipoKey => {
          const tipoObj = marcaObj.tipos[tipoKey];
          tipoObj.productos.forEach(prod => {
            if (
              prod.nombre.toLowerCase().includes(query) ||
              marcaObj.nombre.toLowerCase().includes(query) ||
              prod.medida.toLowerCase().includes(query)
            ) {
              resultados.push({
                ...prod,
                rubro: rubroObj.nombre,
                marca: marcaObj.nombre,
                tipo: tipoObj.nombre
              });
            }
          });
        });
      });
    });
    return resultados;
  };

  const productosFiltradosBusqueda = obtenerProductosBusqueda();

  // Selecciones en cascada
  const seleccionarRubro = (key) => {
    setRubroSeleccionado(key);
    setMarcaSeleccionada(null);
    setTipoSeleccionado(null);
    setTextoBusqueda('');
  };

  const seleccionarMarca = (key) => {
    setMarcaSeleccionada(key);
    setTipoSeleccionado(null);
  };

  const seleccionarTipo = (key) => {
    setTipoSeleccionado(key);
  };

  // Agregar al Chango
  const agregarAlChango = (producto, customRubro, customMarca) => {
    const itemExistente = chango.find(item => item.id === producto.id);
    let nuevoChango;
    if (itemExistente) {
      nuevoChango = chango.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    } else {
      nuevoChango = [...chango, { 
        ...producto, 
        rubro: customRubro || CATALOGO_INTELIGENTE[rubroSeleccionado]?.nombre || 'Almacén',
        marca: customMarca || marcasDelRubro[marcaSeleccionada]?.nombre || 'Genérica',
        cantidad: 1 
      }];
    }
    setChango(nuevoChango);
    Alert.alert("¡Agregado al Chango!", `${producto.nombre} (${producto.medida}) añadido al menor precio en ${producto.superMasBarato}.`);
  };

  // Manejador del escáner de códigos de barras
  const handleBarCodeScanned = ({ data }) => {
    setModalEscannerVisible(false);
    let productoEncontrado = null;

    Object.keys(CATALOGO_INTELIGENTE).forEach(rubroKey => {
      const rubroObj = CATALOGO_INTELIGENTE[rubroKey];
      Object.keys(rubroObj.marcas).forEach(marcaKey => {
        const marcaObj = rubroObj.marcas[marcaKey];
        Object.keys(marcaObj.tipos).forEach(tipoKey => {
          const tipoObj = marcaObj.tipos[tipoKey];
          tipoObj.productos.forEach(prod => {
            if (prod.barcode === data) {
              productoEncontrado = {
                ...prod,
                rubro: rubroObj.nombre,
                marca: marcaObj.nombre
              };
            }
          });
        });
      });
    });

    if (productoEncontrado) {
      agregarAlChango(productoEncontrado, productoEncontrado.rubro, productoEncontrado.marca);
    } else {
      Alert.alert("Código no registrado", `El código ${data} no se encuentra en el catálogo local. Puedes agregarlo manualmente.`);
    }
  };

  const abrirEscanner = async () => {
    if (!permission || !permission.granted) {
      const permRes = await requestPermission();
      if (!permRes.granted) {
        Alert.alert("Permiso Denegado", "Se requiere acceso a la cámara para escanear códigos de barras.");
        return;
      }
    }
    setModalEscannerVisible(true);
  };

  const cantidadTotalItems = chango.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER SUPERIOR */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logoMini} resizeMode="contain" />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} resizeMode="contain" />
        </View>

        <TouchableOpacity 
          style={styles.carritoBotonHeader}
          onPress={() => navigation.navigate('ChangoComparativoScreen', { changoItems: chango })}
        >
          <Ionicons name="cart" size={26} color="#FFD700" />
          {cantidadTotalItems > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{cantidadTotalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.titleGoldLine} />

      {/* 2. BARRA DE BÚSQUEDA MANUAL Y ESCÁNER */}
      <View style={styles.searchAndScannerContainer}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={18} color="#8892B0" style={{ marginLeft: 10 }} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar producto, marca o medida..."
            placeholderTextColor="#8892B0"
            value={textoBusqueda}
            onChangeText={(text) => {
              setTextoBusqueda(text);
              if (text.trim().length > 0) {
                setRubroSeleccionado(null);
                setMarcaSeleccionada(null);
                setTipoSeleccionado(null);
              }
            }}
          />
          {textoBusqueda.length > 0 && (
            <TouchableOpacity onPress={() => setTextoBusqueda('')} style={{ marginRight: 8 }}>
              <Ionicons name="close-circle" size={18} color="#8892B0" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.btnScanner} onPress={abrirEscanner}>
          <Ionicons name="barcode-outline" size={22} color="#0A192F" />
        </TouchableOpacity>
      </View>

      {/* 3. BOTONES DE NAVEGACIÓN EN CASCADA */}
      <View style={styles.breadcrumbContainer}>
        <View style={styles.stepWrapper}>
          <Text style={styles.stepTitleLabel}>RUBRO</Text>
          <TouchableOpacity 
            style={[styles.topStepButton, rubroSeleccionado && styles.stepActive]}
            onPress={() => seleccionarRubro(null)}
          >
            <View style={styles.buttonStackFull}>
              <Image source={require('../../assets/btn_no.png')} style={[styles.stepImageFull, rubroSeleccionado && styles.hiddenButton]} resizeMode="contain" />
              <Image source={require('../../assets/btn_ok.png')} style={[styles.stepImageFull, !rubroSeleccionado && styles.hiddenButton]} resizeMode="contain" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.stepWrapper}>
          <Text style={styles.stepTitleLabel}>MARCA</Text>
          <TouchableOpacity 
            style={[styles.topStepButton, marcaSeleccionada && styles.stepActive]}
            onPress={() => { if (rubroSeleccionado) seleccionarMarca(null); }}
            disabled={!rubroSeleccionado}
          >
            <View style={styles.buttonStackFull}>
              <Image source={require('../../assets/btn_no.png')} style={[styles.stepImageFull, marcaSeleccionada && styles.hiddenButton]} resizeMode="contain" />
              <Image source={require('../../assets/btn_ok.png')} style={[styles.stepImageFull, !marcaSeleccionada && styles.hiddenButton]} resizeMode="contain" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.stepWrapper}>
          <Text style={styles.stepTitleLabel}>TIPO</Text>
          <TouchableOpacity 
            style={[styles.topStepButton, tipoSeleccionado && styles.stepActive]}
            onPress={() => { if (marcaSeleccionada) setTipoSeleccionado(null); }}
            disabled={!marcaSeleccionada}
          >
            <View style={styles.buttonStackFull}>
              <Image source={require('../../assets/btn_no.png')} style={[styles.stepImageFull, tipoSeleccionado && styles.hiddenButton]} resizeMode="contain" />
              <Image source={require('../../assets/btn_ok.png')} style={[styles.stepImageFull, !tipoSeleccionado && styles.hiddenButton]} resizeMode="contain" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL SEGÚN BÚSQUEDA O CASCADA */}
      {textoBusqueda.trim().length > 0 ? (
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBanner}>
            <Text style={styles.tituloSeccionBanner}>Resultados de Búsqueda ({productosFiltradosBusqueda.length}):</Text>
          </View>
          {productosFiltradosBusqueda.length === 0 ? (
            <Text style={styles.noResultsText}>{`No se encontraron productos para "${textoBusqueda}".`}</Text>
          ) : (
            productosFiltradosBusqueda.map(prod => (
              <View key={prod.id} style={styles.productoCard}>
                <View style={styles.infoProducto}>
                  <Text style={styles.nombreProducto}>{prod.nombre}</Text>
                  <Text style={styles.medidaProducto}>{prod.rubro} › {prod.marca} › {prod.medida}</Text>
                  <View style={styles.badgeSuper}>
                    <Ionicons name="flash" size={12} color="#0A192F" />
                    <Text style={styles.badgeSuperText}>Más barato en: {prod.superMasBarato}</Text>
                  </View>
                </View>
                <View style={styles.precioAccionContainer}>
                  <Text style={styles.precioText}>${prod.precioMasBarato}</Text>
                  <TouchableOpacity style={styles.btnAgregar} onPress={() => agregarAlChango(prod, prod.rubro, prod.marca)}>
                    <Text style={styles.btnAgregarText}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : !rubroSeleccionado ? (
        <View style={styles.singleScreenRubrosContainer}>
          <View style={styles.titleBanner}>
            <Text style={styles.tituloSeccionBanner}>SELECCIONÁ UN RUBRO:</Text>
          </View>
          <ScrollView contentContainerStyle={styles.gridOpciones3ColsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.gridOpciones3Cols}>
              {CATEGORIAS_RUBROS.map(item => {
                const existeEnCatalogo = CATALOGO_INTELIGENTE[item.clave];
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.cardRubroCompacto, { borderLeftColor: item.color }]}
                    onPress={() => {
                      if (existeEnCatalogo) seleccionarRubro(item.clave);
                      else Alert.alert("Próximamente", `El rubro ${item.nombre} estará disponible muy pronto.`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiTextCompact}>{item.emoji}</Text>
                    <Text style={styles.cardTextoRubroCompacto} numberOfLines={2}>{item.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {rubroSeleccionado && !marcaSeleccionada && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Seleccione Marca ({CATALOGO_INTELIGENTE[rubroSeleccionado]?.nombre}):</Text>
              </View>
              <View style={styles.gridOpciones}>
                {marcasKeys.map(key => {
                  const marca = marcasDelRubro[key];
                  const hasError = logoErrors[key];
                  return (
                    <TouchableOpacity key={key} style={styles.cardOpcion} onPress={() => seleccionarMarca(key)}>
                      {marca.logo && !hasError ? (
                        <Image 
                          source={{ uri: marca.logo }} 
                          style={styles.brandLogo} 
                          resizeMode="contain" 
                          onError={() => handleImageError(key)}
                        />
                      ) : (
                        <View style={styles.fallbackLogo}>
                          <Text style={styles.fallbackText}>{marca.nombre.substring(0, 2).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.cardTexto}>{marca.nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {marcaSeleccionada && !tipoSeleccionado && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Seleccione Tipo de Producto:</Text>
              </View>
              <View style={styles.gridOpciones}>
                {tiposKeys.map(key => (
                  <TouchableOpacity key={key} style={styles.cardOpcion} onPress={() => seleccionarTipo(key)}>
                    <Ionicons name="file-tray-outline" size={26} color="#00FFCC" />
                    <Text style={styles.cardTexto}>{tiposDeLaMarca[key].nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {tipoSeleccionado && (
            <View style={styles.seccionBloque}>
              <View style={styles.titleBanner}>
                <Text style={styles.tituloSeccionBanner}>Productos Disponibles ({productosFinales.length}):</Text>
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
                    <TouchableOpacity style={styles.btnAgregar} onPress={() => agregarAlChango(prod)}>
                      <Text style={styles.btnAgregarText}>+ Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL ESCÁNER DE CÓDIGO DE BARRAS */}
      <Modal visible={modalEscannerVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Escanea el Código de Barras</Text>
            <TouchableOpacity onPress={() => setModalEscannerVisible(false)} style={styles.scannerCloseBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
          <CameraView 
            style={{ flex: 1 }}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "code128"],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scanTargetBox} />
              <Text style={styles.scannerInstructions}>Apunta la cámara al código de barras del producto</Text>
            </View>
          </CameraView>
        </SafeAreaView>
      </Modal>

      {/* FOOTER INFERIOR */}
      <View style={styles.footerContainer}>
        <View style={styles.footerGoldLine} />
        <View style={styles.footerBar}>
          <TouchableOpacity 
            style={styles.footerBtn}
            onPress={() => {
              if (textoBusqueda) setTextoBusqueda('');
              else if (tipoSeleccionado) setTipoSeleccionado(null);
              else if (marcaSeleccionada) seleccionarMarca(null);
              else if (rubroSeleccionado) seleccionarRubro(null);
              else navigation.goBack();
            }}
          >
            <Image source={require('../../assets/volver.png')} style={[styles.footerIcon, { tintColor: '#00E5FF' }]} resizeMode="contain" />
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
            <Image source={require('../../assets/salir.png')} style={[styles.footerIcon, { tintColor: '#00E5FF' }]} resizeMode="contain" />
            <Text style={styles.footerBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#020C1B' },
  headerLeftContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoMini: { width: 48, height: 48, resizeMode: 'contain', marginRight: 12 },
  nombreApp: { width: 180, height: 46, resizeMode: 'contain' },
  carritoBotonHeader: { position: 'relative', padding: 6 },
  badgeContainer: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FFD700', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#0A192F', fontSize: 12, fontWeight: 'bold' },
  titleGoldLine: { height: 2, backgroundColor: '#FFD700', width: '100%' },
  searchAndScannerContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0A192F', alignItems: 'center' },
  searchBarWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#020C1B', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', height: 44, marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', paddingHorizontal: 8, fontSize: 14 },
  btnScanner: { backgroundColor: '#FFD700', width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  breadcrumbContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#020C1B', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepTitleLabel: { color: '#8892B0', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  topStepButton: { width: '90%', height: 32, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  stepActive: { borderColor: '#FFD700' },
  buttonStackFull: { width: '100%', height: '100%', position: 'relative' },
  stepImageFull: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  hiddenButton: { opacity: 0 },
  singleScreenRubrosContainer: { flex: 1 },
  gridOpciones3ColsScroll: { paddingHorizontal: 16, paddingBottom: 20 },
  gridOpciones3Cols: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardRubroCompacto: { width: '31%', backgroundColor: '#020C1B', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#1e293b' },
  emojiTextCompact: { fontSize: 24, marginBottom: 6 },
  cardTextoRubroCompacto: { color: '#FFF', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  contentScroll: { paddingHorizontal: 16, paddingBottom: 30, paddingTop: 10 },
  seccionBloque: { marginBottom: 20 },
  titleBanner: { backgroundColor: '#020C1B', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  tituloSeccionBanner: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  gridOpciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardOpcion: { width: '48%', backgroundColor: '#020C1B', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  brandLogo: { width: 60, height: 60, resizeMode: 'contain', marginBottom: 8 },
  fallbackLogo: { width: 60, height: 60, backgroundColor: '#0A192F', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#00E5FF' },
  fallbackText: { color: '#00E5FF', fontSize: 16, fontWeight: 'bold' },
  cardTexto: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  productoCard: { flexDirection: 'row', backgroundColor: '#020C1B', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'space-between' },
  infoProducto: { flex: 1, marginRight: 10 },
  nombreProducto: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  medidaProducto: { color: '#8892B0', fontSize: 12, marginBottom: 6 },
  badgeSuper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeSuperText: { color: '#0A192F', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  precioAccionContainer: { alignItems: 'flex-end' },
  precioText: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  btnAgregar: { backgroundColor: '#00E5FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  btnAgregarText: { color: '#0A192F', fontSize: 12, fontWeight: 'bold' },
  noResultsText: { color: '#8892B0', textAlign: 'center', marginTop: 20, fontSize: 14 },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.8)' },
  scannerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scannerCloseBtn: { padding: 4 },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  scanTargetBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#FFD700', backgroundColor: 'transparent', borderRadius: 12 },
  scannerInstructions: { color: '#FFF', fontSize: 14, marginTop: 20, textAlign: 'center', paddingHorizontal: 40 },
  footerContainer: { backgroundColor: '#020C1B' },
  footerGoldLine: { height: 1, backgroundColor: '#FFD700', width: '100%' },
  footerBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  footerBtn: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  footerIcon: { width: 22, height: 22, marginBottom: 4 },
  footerBtnText: { color: '#00E5FF', fontSize: 12, fontWeight: '600' }
});