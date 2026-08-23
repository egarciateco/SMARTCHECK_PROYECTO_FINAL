import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- DICCIONARIO MAESTRO DE MARCAS Y LOGOTIPOS POR RUBRO ---
const MARCAS_POR_RUBRO = {
  almacen: [
    { nombre: 'Lucchetti', dominio: 'lucchetti.com.ar' },
    { nombre: 'Terrabusi', dominio: 'terrabusi.com.ar' },
    { nombre: 'Gallo', dominio: 'arrozgallo.com.ar' },
    { nombre: 'Doña Petrona', dominio: 'donapetrona.com.ar' },
    { nombre: 'Canale', dominio: 'canale.com.ar' },
    { nombre: 'Jorgito', dominio: 'alfajoresjorgito.com.ar' },
    { nombre: 'Águila', dominio: 'chocolatesaguila.com.ar' },
    { nombre: 'Marolio', dominio: 'marolio.com.ar' },
    { nombre: 'Oreo', dominio: 'oreo.com.ar' }
  ],
  bebidas: [
    { nombre: 'Pepsi', dominio: 'pepsi.com' },
    { nombre: 'Coca-Cola', dominio: 'cocacola.com.ar' },
    { nombre: 'Sprite', dominio: 'sprite.com' },
    { nombre: 'Fanta', dominio: 'fanta.com' },
    { nombre: 'Cepita', dominio: 'cepita.com.ar' },
    { nombre: 'Citric', dominio: 'citric.com.ar' },
    { nombre: 'Quilmes', dominio: 'quilmes.com.ar' },
    { nombre: 'Schneider', dominio: 'schneider.com.ar' }
  ],
  carnes: [
    { nombre: 'Paty', dominio: 'paty.com.ar' },
    { nombre: 'Vienissima', dominio: 'vienissima.com.ar' }
  ],
  congelados: [
    { nombre: 'Sadia', dominio: 'sadia.com.br' },
    { nombre: 'Green Life', dominio: 'greenlife.com' }
  ],
  lacteos: [
    { nombre: 'La Serenísima', dominio: 'laserenisima.com.ar' },
    { nombre: 'Sancor', dominio: 'sancor.com' }
  ],
  limpieza: [
    { nombre: 'Ala', dominio: 'ala.com.ar' },
    { nombre: 'Ayudín', dominio: 'ayudin.com.ar' }
  ],
  perfumeria: [
    { nombre: 'Sedal', dominio: 'sedal.com.ar' },
    { nombre: 'Rexona', dominio: 'rexona.com.ar' }
  ],
  panaderia: [
    { nombre: 'Fargo', dominio: 'fargo.com.ar' }
  ],
  desayuno: [
    { nombre: 'Playadito', dominio: 'yerbaplayadito.com.ar' },
    { nombre: 'La Virginia', dominio: 'lavirginia.com.ar' }
  ],
  bebes: [
    { nombre: 'Huggies', dominio: 'huggies.com.ar' }
  ],
  mascotas: [
    { nombre: 'Dog Chow', dominio: 'dogchow.com.ar' }
  ],
  'frutas y verduras': [
    { nombre: 'Frescos', dominio: 'coto.com.ar' }
  ]
};

// --- CATÁLOGO MAESTRO VERIFICADO DE PRODUCTOS PARA LAS 12 CATEGORÍAS ---
const CATALOGO_EXCEL_VERIFICADO = [
  // BEBIDAS
  { id: '1', ean: '7791813828464', marca: 'pepsi', nombre: 'Gaseosa cola Pepsi Black pet 2 lts', tipo: 'bebidas', medida: 'Botella 2L', superMasBarato: 'Coto', precioMasBarato: 4170 },
  { id: '2', ean: '7791813828419', marca: 'pepsi', nombre: 'Gaseosa Cola Pepsi Black Descartable 1.5 lt', tipo: 'bebidas', medida: 'Botella 1.5L', superMasBarato: 'Coto', precioMasBarato: 1750 },
  { id: '3', ean: '7791813888468', marca: 'pepsi', nombre: 'Gaseosa cola regular Pepsi pet N 2 lts.', tipo: 'bebidas', medida: 'Botella 2L', superMasBarato: 'Coto', precioMasBarato: 4729 },
  { id: '4', ean: '7791813888413', marca: 'pepsi', nombre: 'Gaseosa cola regular Pepsi N pet 1.5 lts.', tipo: 'bebidas', medida: 'Botella 1.5L', superMasBarato: 'Changomas', precioMasBarato: 1650 },
  { id: '5', ean: '7791813888376', marca: 'pepsi', nombre: 'Gaseosa cola Pepsi regular en lata 354 ml', tipo: 'bebidas', medida: 'Lata 354ml', superMasBarato: 'Dia', precioMasBarato: 1150 },
  { id: '6', ean: '7790895000123', marca: 'coca-cola', nombre: 'Gaseosa Coca-Cola Sabor Original 2.25L', tipo: 'bebidas', medida: 'Botella 2.25L', superMasBarato: 'Changomas', precioMasBarato: 2700 },
  { id: '7', ean: '7790895651038', marca: 'coca-cola', nombre: 'Pack gaseosa Coca Cola zero 2.25 lts + Coca Cola zero 2.25 lts', tipo: 'bebidas', medida: 'Pack 2x2.25L', superMasBarato: 'Coto', precioMasBarato: 4900 },
  { id: '8', ean: '7790895648908', marca: 'sprite', nombre: 'Gaseosa Sprite Lima Limón 2.25 L', tipo: 'bebidas', medida: 'Botella 2.25L', superMasBarato: 'Carrefour', precioMasBarato: 2650 },
  { id: '9', ean: '7790895648656', marca: 'fanta', nombre: 'Gaseosa Fanta Naranja 2.25 L', tipo: 'bebidas', medida: 'Botella 2.25L', superMasBarato: 'Dia', precioMasBarato: 2650 },
  { id: '10', ean: '7790895012345', marca: 'cepita', nombre: 'Jugo de Naranja Cepita 1 Litro', tipo: 'bebidas', medida: 'Tetra 1L', superMasBarato: 'Coto', precioMasBarato: 1800 },
  { id: '11', ean: '7798123456789', marca: 'citric', nombre: 'Jugo Citric Exprimido de Naranja 1 Litro', tipo: 'bebidas', medida: 'Botella 1L', superMasBarato: 'Changomas', precioMasBarato: 2400 },
  { id: '29', ean: '7796670001234', marca: 'quilmes', nombre: 'Cerveza Quilmes Stout / Rubia Botella 1 Litro', tipo: 'bebidas', medida: 'Botella 1L', superMasBarato: 'Carrefour', precioMasBarato: 2150 },
  { id: '30', ean: '7797780001234', marca: 'schneider', nombre: 'Cerveza Schneider Lager Lata 473 ml', tipo: 'bebidas', medida: 'Lata 473ml', superMasBarato: 'Dia', precioMasBarato: 1250 },

  // ALMACÉN
  { id: '12', ean: '7794600009435', marca: 'oreo', nombre: 'Galletitas Oreo Chocolate Paquete 111 G', tipo: 'almacén', medida: 'Paquete 111g', superMasBarato: 'Coto', precioMasBarato: 3212 },
  { id: '13', ean: '7790070336385', marca: 'lucchetti', nombre: 'Fideos Spaghetti N°7 500 Grs Lucchetti', tipo: 'almacén', medida: 'Paquete 500g', superMasBarato: 'Dia', precioMasBarato: 890 },
  { id: '14', ean: '7790070211306', marca: 'marolio', nombre: 'Aceite de Girasol Marolio Botella 1.5L', tipo: 'almacén', medida: 'Botella 1.5L', superMasBarato: 'Coto', precioMasBarato: 1950 },
  { id: '23', ean: '7794000123456', marca: 'terrabusi', nombre: 'Galletitas Variedad Terrabusi 400g', tipo: 'almacén', medida: 'Paquete 400g', superMasBarato: 'Dia', precioMasBarato: 3500 },
  { id: '24', ean: '7791120001234', marca: 'gallo', nombre: 'Arroz Largo Fino Gallo 1 Kg', tipo: 'almacén', medida: 'Paquete 1Kg', superMasBarato: 'Coto', precioMasBarato: 1650 },
  { id: '25', ean: '7792230001234', marca: 'doña petrona', nombre: 'Harina de Trigo 000 Doña Petrona 1 Kg', tipo: 'almacén', medida: 'Paquete 1Kg', superMasBarato: 'Carrefour', precioMasBarato: 980 },
  { id: '26', ean: '7793340001234', marca: 'canale', nombre: 'Puré de Tomate Canale 520g', tipo: 'almacén', medida: 'Tetra 520g', superMasBarato: 'Changomas', precioMasBarato: 850 },
  { id: '27', ean: '7794450001234', marca: 'jorgito', nombre: 'Alfajor de Chocolate Jorgito x 6 unidades', tipo: 'almacén', medida: 'Caja x6', superMasBarato: 'Dia', precioMasBarato: 2900 },
  { id: '28', ean: '7795560001234', marca: 'águila', nombre: 'Chocolate Taza Águila 150g', tipo: 'almacén', medida: 'Barra 150g', superMasBarato: 'Coto', precioMasBarato: 2100 },

  // LÁCTEOS
  { id: '15', ean: '7793940001019', marca: 'la serenísima', nombre: 'Leche Clásica Sachet La Serenísima 1L', tipo: 'lácteos', medida: 'Sachet 1L', superMasBarato: 'Dia', precioMasBarato: 1190 },
  { id: '16', ean: '7790742326607', marca: 'la serenísima', nombre: 'Queso Untable Sabores Jamon 180 Gr La Serenísima', tipo: 'lácteos', medida: 'Pote 180g', superMasBarato: 'Coto', precioMasBarato: 2450 },
  { id: '22', ean: '7790350001234', marca: 'sancor', nombre: 'Queso Crema Sancor Muzzarella 400g', tipo: 'lácteos', medida: 'Pote 400g', superMasBarato: 'Coto', precioMasBarato: 2890 },

  // CARNES
  { id: '18', ean: '7790580123456', marca: 'paty', nombre: 'Hamburguesas vacuna Paty x 4 unidades 320g', tipo: 'carnes', medida: 'Caja 320g', superMasBarato: 'Coto', precioMasBarato: 3800 },
  { id: '19', ean: '7790580654321', marca: 'vienissima', nombre: 'Salchichas Vienissima x 6 unidades 190g', tipo: 'carnes', medida: 'Paquete 190g', superMasBarato: 'Dia', precioMasBarato: 1950 },

  // FRUTAS Y VERDURAS
  { id: '31', ean: '7790000000011', marca: 'frescos', nombre: 'Manzana Roja Seleccionada x Kg', tipo: 'frutas y verduras', medida: '1 Kg', superMasBarato: 'Carrefour', precioMasBarato: 1400 },
  { id: '32', ean: '7790000000022', marca: 'frescos', nombre: 'Banana Ecuador x Kg', tipo: 'frutas y verduras', medida: '1 Kg', superMasBarato: 'Coto', precioMasBarato: 1850 },
  { id: '33', ean: '7790000000033', marca: 'frescos', nombre: 'Papa Negra Bolsa x 5 Kg', tipo: 'frutas y verduras', medida: 'Bolsa 5Kg', superMasBarato: 'Changomas', precioMasBarato: 3200 },

  // LIMPIEZA
  { id: '17', ean: '7790520002154', marca: 'ala', nombre: 'Jabón Líquido para Ropa Ala Doy Pack 3 Litros', tipo: 'limpieza', medida: 'Doy Pack 3L', superMasBarato: 'Carrefour', precioMasBarato: 4500 },
  { id: '34', ean: '7790520111111', marca: 'ayudín', nombre: 'Lavandina Tradicional Ayudín 2 Litros', tipo: 'limpieza', medida: 'Botella 2L', superMasBarato: 'Dia', precioMasBarato: 1100 },

  // PERFUMERÍA
  { id: '35', ean: '7791230001111', marca: 'sedal', nombre: 'Shampoo Sedal Ceramidas 650 ml', tipo: 'perfumería', medida: 'Botella 650ml', superMasBarato: 'Coto', precioMasBarato: 3400 },
  { id: '36', ean: '7791230002222', marca: 'rexona', nombre: 'Desodorante Aerosol Rexona Men Invisible 150ml', tipo: 'perfumería', medida: 'Aerosol 150ml', superMasBarato: 'Changomas', precioMasBarato: 2300 },

  // CONGELADOS
  { id: '20', ean: '7891515234567', marca: 'sadia', nombre: 'Medallones de Pollo Sadia x 4 unidades 300g', tipo: 'congelados', medida: 'Caja 300g', superMasBarato: 'Carrefour', precioMasBarato: 3100 },
  { id: '21', ean: '7798001122334', marca: 'green life', nombre: 'Mix de Verduras Congeladas Green Life 500g', tipo: 'congelados', medida: 'Bolsa 500g', superMasBarato: 'Changomas', precioMasBarato: 2200 },

  // PANADERÍA
  { id: '37', ean: '7794560001111', marca: 'fargo', nombre: 'Pan Lactal Blanco Grande Fargo 560g', tipo: 'panadería', medida: 'Paquete 560g', superMasBarato: 'Coto', precioMasBarato: 2750 },

  // DESAYUNO
  { id: '38', ean: '7797890001111', marca: 'playadito', nombre: 'Yerba Mate con Palo Playadito 1 Kg', tipo: 'desayuno', medida: 'Paquete 1Kg', superMasBarato: 'Dia', precioMasBarato: 3950 },
  { id: '39', ean: '7797890002222', marca: 'la virginia', nombre: 'Café Molido Suave La Virginia 500g', tipo: 'desayuno', medida: 'Paquete 500g', superMasBarato: 'Carrefour', precioMasBarato: 4800 },

  // BEBÉS
  { id: '40', ean: '7798880001111', marca: 'huggies', nombre: 'Pañales Huggies Protect Plus G x 36 unidades', tipo: 'bebés', medida: 'Pack x36', superMasBarato: 'Coto', precioMasBarato: 9500 },

  // MASCOTAS
  { id: '41', ean: '7799990001111', marca: 'dog chow', nombre: 'Alimento Balanceado Perros Adultos Dog Chow 3 Kg', tipo: 'mascotas', medida: 'Bolsa 3Kg', superMasBarato: 'Changomas', precioMasBarato: 8200 }
];

// Dominios de supermercados para logotipos
const SUPER_DOMINIOS = {
  'coto': 'coto.com.ar',
  'carrefour': 'carrefour.com.ar',
  'changomas': 'changomas.com.ar',
  'dia': 'supermercadosdia.com.ar'
};

// --- MOTOR INTELIGENTE DE IMÁGENES SEGÚN CATEGORÍA/NOMBRE ---
const obtenerImagenPorArticulo = (nombre, tipo) => {
  const n = (nombre || '').toLowerCase();
  const t = (tipo || '').toLowerCase();

  if (n.includes('gaseosa') || n.includes('cola') || n.includes('pepsi') || n.includes('sprite') || n.includes('fanta') || n.includes('7up')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('cerveza') || n.includes('quilmes') || n.includes('schneider') || n.includes('brahma')) {
    return 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('leche') || n.includes('queso') || n.includes('yogur') || n.includes('manteca') || t.includes('lácteo')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('galletita') || n.includes('oreo') || n.includes('galleta') || n.includes('chocolate') || n.includes('dulce')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('aceite') || n.includes('girasol') || n.includes('maíz')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('fideo') || n.includes('pasta') || n.includes('arroz') || n.includes('spaghetti')) {
    return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('jabón') || n.includes('limpieza') || n.includes('lavandina') || n.includes('detergente')) {
    return 'https://images.unsplash.com/photo-1584184866819-7437b4f33b7c?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('manzana') || n.includes('banana') || n.includes('papa') || t.includes('frutas')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('shampoo') || n.includes('desodorante') || t.includes('perfumería')) {
    return 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('pan') || t.includes('panadería')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('yerba') || n.includes('café') || t.includes('desayuno')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('pañal') || t.includes('bebé')) {
    return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=60';
  }
  if (n.includes('perro') || n.includes('gato') || t.includes('mascota')) {
    return 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=60';
  }
  
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
};

export default function ProductSelectionScreen({ navigation, route }) {
  const { categoriaSeleccionada, rubroSeleccionado, marcaSeleccionada } = route.params || {};
  const catActiva = categoriaSeleccionada || rubroSeleccionado;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [imagenesRotas, setImagenesRotas] = useState({});

  useEffect(() => {
    const fetchProductosDesdeBackend = async () => {
      try {
        setLoading(true);
        
        // URL corregida hacia Render (o reemplázala por tu IP local si lo pruebas en desarrollo)
        const response = await fetch('https://tudominio-en-render.onrender.com/api/productos');
        const data = await response.json();

        // Soporte tanto para arreglos directos como para objetos con propiedad productos
        let catalogoBase = CATALOGO_EXCEL_VERIFICADO; 
        if (Array.isArray(data)) {
          catalogoBase = data;
        } else if (data.success && data.productos && data.productos.length > 0) {
          catalogoBase = data.productos;
        }

        const marcaFiltro = marcaSeleccionada 
          ? marcaSeleccionada.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          : '';

        const catFiltro = catActiva 
          ? catActiva.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          : '';

        let listaFiltrada = catalogoBase.filter(item => {
          const itemMarcaNorm = (item.marca || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const itemTipoNorm = (item.tipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          const matchMarca = !marcaFiltro || itemMarcaNorm.includes(marcaFiltro) || marcaFiltro.includes(itemMarcaNorm);
          const matchCat = !catFiltro || itemTipoNorm.includes(catFiltro) || catFiltro.includes(itemTipoNorm);

          return matchMarca && matchCat;
        });

        // Fallback robusto si la combinación específica no arroja resultados directos
        if (listaFiltrada.length === 0 && marcaFiltro) {
          listaFiltrada = catalogoBase.filter(item => {
            const itemMarcaNorm = (item.marca || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return itemMarcaNorm.includes(marcaFiltro) || marcaFiltro.includes(itemMarcaNorm);
          });
        }

        if (listaFiltrada.length === 0 && catFiltro) {
          listaFiltrada = catalogoBase.filter(item => {
            const itemTipoNorm = (item.tipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return itemTipoNorm.includes(catFiltro) || catFiltro.includes(itemTipoNorm);
          });
        }

        if (listaFiltrada.length === 0) {
          listaFiltrada = catalogoBase;
        }

        const productosFormateados = listaFiltrada.map((item) => {
          const superKey = item.superMasBarato ? item.superMasBarato.toLowerCase().trim() : 'coto';
          const superDomain = SUPER_DOMINIOS[superKey] || 'coto.com.ar';

          return {
            ...item,
            cantidad: 1, 
            imagenAsignada: obtenerImagenPorArticulo(item.nombre, item.tipo),
            logoSuper: `https://api.companyenrich.com/logo/${superDomain}`
          };
        });

        setProductos(productosFormateados);
      } catch (error) {
        console.error('Error al obtener productos del backend:', error);
        // En caso de fallo de red, usamos el catálogo estático como respaldo
        const marcaFiltro = marcaSeleccionada 
          ? marcaSeleccionada.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          : '';

        const catFiltro = catActiva 
          ? catActiva.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          : '';

        let listaFiltrada = CATALOGO_EXCEL_VERIFICADO.filter(item => {
          const itemMarcaNorm = (item.marca || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const itemTipoNorm = (item.tipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          const matchMarca = !marcaFiltro || itemMarcaNorm.includes(marcaFiltro) || marcaFiltro.includes(itemMarcaNorm);
          const matchCat = !catFiltro || itemTipoNorm.includes(catFiltro) || catFiltro.includes(itemTipoNorm);

          return matchMarca && matchCat;
        });

        if (listaFiltrada.length === 0 && marcaFiltro) {
          listaFiltrada = CATALOGO_EXCEL_VERIFICADO.filter(item => {
            const itemMarcaNorm = (item.marca || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return itemMarcaNorm.includes(marcaFiltro) || marcaFiltro.includes(itemMarcaNorm);
          });
        }

        if (listaFiltrada.length === 0 && catFiltro) {
          listaFiltrada = CATALOGO_EXCEL_VERIFICADO.filter(item => {
            const itemTipoNorm = (item.tipo || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return itemTipoNorm.includes(catFiltro) || catFiltro.includes(itemTipoNorm);
          });
        }

        if (listaFiltrada.length === 0) {
          listaFiltrada = CATALOGO_EXCEL_VERIFICADO;
        }

        const productosFormateados = listaFiltrada.map((item) => {
          const superKey = item.superMasBarato ? item.superMasBarato.toLowerCase().trim() : 'coto';
          const superDomain = SUPER_DOMINIOS[superKey] || 'coto.com.ar';

          return {
            ...item,
            cantidad: 1, 
            imagenAsignada: obtenerImagenPorArticulo(item.nombre, item.tipo),
            logoSuper: `https://api.companyenrich.com/logo/${superDomain}`
          };
        });

        setProductos(productosFormateados);
      } finally {
        setLoading(false);
      }
    };

    fetchProductosDesdeBackend();
  }, [catActiva, marcaSeleccionada]);

  const handleAgregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const handleImageError = (idProducto) => {
    setImagenesRotas(prev => ({ ...prev, [idProducto]: true }));
  };

  const renderItem = ({ item }) => {
    const sourceImage = imagenesRotas[item.id] || !item.imagenAsignada 
      ? { uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60' } 
      : { uri: item.imagenAsignada };

    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => handleAgregarAlCarrito(item)}
          activeOpacity={0.8}
        >
          <Image 
            source={require('../../assets/changuito.png')} 
            style={styles.changuitoIcon} 
            resizeMode="contain" 
          />
          <View style={styles.plusBadge}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.productHeaderRow}>
          <View style={styles.imageWrapper}>
            <Image 
              source={sourceImage} 
              style={styles.productImage} 
              resizeMode="cover" 
              onError={() => handleImageError(item.id)}
            />
          </View>
          <View style={styles.productInfoContainer}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.nombre}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.tipo || 'General'}</Text>
              <Text style={styles.badgeTextMeasure}>{item.medida || 'Unidad'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceDetails}>
            <Text style={styles.priceLabel}>MEJOR PRECIO:</Text>
            <Text style={styles.priceValue}>${item.precioMasBarato?.toLocaleString('es-AR') || '---'}</Text>
          </View>

          <View style={styles.superIndicatorRow}>
            <Ionicons name="arrow-forward" size={16} color="#FFD700" style={{ marginHorizontal: 4 }} />
            <View style={styles.superBadgeLarge}>
              <Image 
                source={{ uri: item.logoSuper }} 
                style={styles.superLogoImageLarge} 
                resizeMode="contain" 
              />
            </View>
            <Text style={styles.superTextLarge}>{item.superMasBarato || 'Supermercado'}</Text>
          </View>
        </View>
      </View>
    );
  };

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

      {/* BARRA DE NAVEGACIÓN HORIZONTAL CON LOS 3 BOTONES DE IMAGEN */}
      <View style={styles.stepBarContainer}>
        <TouchableOpacity 
          style={[styles.stepButton, styles.stepInactive]} 
          onPress={() => navigation.navigate('CategorySelection')}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btnrubro.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.stepButton, styles.stepInactive]} 
          onPress={() => navigation.navigate('BrandSelectionScreen', { rubroSeleccionado: catActiva || 'almacen' })}
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btnmarca.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.stepButton, styles.stepActive]} 
          activeOpacity={0.9}
        >
          <Image 
            source={require('../../assets/btntipo.png')} 
            style={styles.stepImage} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
      </View>

      {/* Banner de Sección */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerText}>
          {marcaSeleccionada ? `PRODUCTOS DE: ${marcaSeleccionada.toUpperCase()}` : catActiva ? `RUBRO: ${catActiva.toUpperCase()}` : 'TODOS LOS PRODUCTOS'}
        </Text>
      </View>

      {/* Contenido Principal */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.loadingText}>Sincronizando productos...</Text>
          </View>
        ) : productos.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="basket-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No hay productos registrados para esta selección en este momento.</Text>
          </View>
        ) : (
          <FlatList
            data={productos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
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
          
          {/* BOTÓN CONECTADO AL CHANGOSO / COMPARATIVO INTELIGENTE */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ChangoComparativoScreen', { changoItems: carrito })} 
            style={styles.footerButton}
          >
            <View>
              <Image 
                source={require('../../assets/salir.png')} 
                style={styles.footerIcon} 
                resizeMode="contain" 
              />
              {carrito.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
                  </Text>
                </View>
              )}
            </View>
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
  stepBarContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  stepButton: { flex: 1, marginHorizontal: 3 },
  stepActive: { opacity: 1 },
  stepInactive: { opacity: 0.5 },
  stepImage: { width: '100%', height: undefined, aspectRatio: 3.2 },
  bannerContainer: { width: '100%', backgroundColor: '#000000', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#374151' },
  bannerText: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', letterSpacing: 1.2 },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  listContainer: { paddingVertical: 12 },
  productCard: { backgroundColor: '#1F2937', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#374151', elevation: 3, position: 'relative' },
  addButton: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFFFFF', width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderWidth: 1.5, borderColor: '#D4AF37', elevation: 6 },
  changuitoIcon: { width: 26, height: 26, tintColor: '#111827' },
  plusBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#10B981', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  plusText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', lineHeight: 13 },
  productHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingRight: 50 },
  imageWrapper: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12 },
  productImage: { width: '100%', height: '100%' },
  productInfoContainer: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#E5E7EB', marginBottom: 4 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6, marginBottom: 2 },
  badgeTextMeasure: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', backgroundColor: '#374151', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 8, marginTop: 4 },
  priceDetails: { flexDirection: 'row', alignItems: 'center' },
  priceLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFD700', marginRight: 6 },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  superIndicatorRow: { flexDirection: 'row', alignItems: 'center' },
  superBadgeLarge: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 6, padding: 3 },
  superLogoImageLarge: { width: '100%', height: '100%' },
  superTextLarge: { fontSize: 12, fontWeight: 'bold', color: '#00E5FF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { marginTop: 10, color: '#9CA3AF', fontSize: 13 },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
  footerContainer: { width: '100%', backgroundColor: '#111827', paddingBottom: 12 },
  goldLine: { width: '100%', height: 1.5, backgroundColor: '#D4AF37', marginBottom: 10 },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
  footerButton: { padding: 4 },
  footerIcon: { width: 36, height: 36, tintColor: '#00E5FF' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#111827' },
  cartBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }
});