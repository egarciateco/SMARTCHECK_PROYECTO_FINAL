const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const sharp = require('sharp');
const path = require('path');

// Importar el gestor de supermercados geográficos
const { getSupermarketsByLocality, supermarkets } = require('../supermarkets');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const db = admin.firestore();

async function loadModels() {
    const MODEL_URL = path.join(__dirname, '../weights'); 
    try {
        await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL); 
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
        console.log("✅ Modelos de IA cargados correctamente.");
    } catch (error) {
        console.error("❌ Error cargando modelos:", error);
    }
}
loadModels();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 } 
});

// RUTA TEST STATUS -> /api/users/
router.get('/', (req, res) => {
    res.json({ status: 'success', mensaje: 'Conexión exitosa a la API de usuarios' });
});

// OBTENER LISTA COMPLETA DE USUARIOS -> /api/users/usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const usuarios = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return res.json({
            status: 'success',
            usuarios: usuarios
        });
    } catch (error) {
        console.error('Error al obtener lista de usuarios:', error);
        return res.status(500).json({
            status: 'error',
            mensaje: 'Error al obtener los usuarios de la base de datos'
        });
    }
});

// OBTENER UN USUARIO POR SU ID O UID -> /api/users/usuario/:id
router.get('/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userDoc = await db.collection('users').doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                status: 'error',
                mensaje: 'Usuario no encontrado en la base de datos'
            });
        }

        return res.json({
            status: 'success',
            usuario: {
                id: userDoc.id,
                ...userDoc.data()
            }
        });
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return res.status(500).json({
            status: 'error',
            mensaje: 'Error al obtener el usuario'
        });
    }
});

// REGISTRO FACIAL ROBUSTO CON ROLLBACK -> /api/users/register-facial
router.post('/register-facial', upload.single('imageFile'), async (req, res) => {
    let createdAuthUser = null;

    try {
        const { nombre, apellido, email, sexo, localidad, provincia, fechaNacimiento } = req.body;
        
        if (!nombre || !apellido || !email || !sexo || !req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'Faltan campos obligatorios' });
        }

        const emailFinal = email.toLowerCase().trim();

        try {
            await admin.auth().getUserByEmail(emailFinal);
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
        } catch (authCheckErr) {
            if (authCheckErr.code !== 'auth/user-not-found') {
                throw authCheckErr;
            }
        }

        const existing = await db.collection('users').where('email', '==', emailFinal).get();
        if (!existing.empty) {
            return res.status(400).json({ status: 'error', mensaje: 'El email ya está registrado' });
        }

        const bufferCorregido = await sharp(req.file.buffer)
            .rotate()
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        const img = await canvas.loadImage(bufferCorregido);
        
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó un rostro claro. Mejora la iluminación.' });
        }

        const base64Foto = `data:image/jpeg;base64,${bufferCorregido.toString('base64')}`;

        createdAuthUser = await admin.auth().createUser({
            email: emailFinal,
            password: req.body.password || (Math.random().toString(36).slice(-12) + "A1!"),
            displayName: `${nombre} ${apellido}`
        });

        const newUser = {
            nombre: nombre || '',
            apellido: apellido || '',
            email: emailFinal,
            sexo: sexo || '',
            localidad: localidad || '',
            provincia: provincia || '',
            fechaNacimiento: fechaNacimiento || '',
            foto: base64Foto || '',
            uid: createdAuthUser.uid,
            faceDescriptor: Array.from(detection.descriptor),
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(createdAuthUser.uid).set(newUser);
        return res.status(201).json({ status: 'success', usuario: newUser });
        
    } catch (error) {
        console.error('Error en /register-facial:', error);

        if (createdAuthUser) {
            try {
                await admin.auth().deleteUser(createdAuthUser.uid);
                console.log("⚠️ Rollback: Usuario eliminado de Auth para mantener consistencia.");
            } catch (deleteErr) {
                console.error("Error realizando rollback:", deleteErr);
            }
        }

        return res.status(500).json({ status: 'error', mensaje: error.message || 'Error al procesar el registro' });
    }
});

// BIOMETRÍA -> /api/users/biometria
router.post('/biometria', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', mensaje: 'No hay imagen' });
        }

        const bufferCorregido = await sharp(req.file.buffer).rotate().toBuffer();
        const img = await canvas.loadImage(bufferCorregido);
        
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ status: 'error', mensaje: 'No se detectó rostro' });
        }

        const snapshot = await db.collection('users').get();
        let bestMatch = null;
        let bestDistance = 0.75;

        for (const doc of snapshot.docs) {
            const user = doc.data();
            const desc = user.faceDescriptor;
            if (desc) {
                const distance = faceapi.euclideanDistance(detection.descriptor, new Float32Array(desc));
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = { id: doc.id, ...user };
                }
            }
        }

        if (bestMatch) {
            res.json({ status: 'success', usuario: bestMatch });
        } else {
            res.status(401).json({ status: 'error', mensaje: 'Rostro no reconocido' });
        }
    } catch (error) {
        console.error('Error en biometría:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al procesar biometría' });
    }
});

// ACTUALIZAR UBICACIÓN -> /api/users/actualizar-ubicacion
router.post('/actualizar-ubicacion', async (req, res) => {
    try {
        const { uid, localidad, provincia } = req.body;
        
        if (!uid) {
            return res.status(400).json({ status: 'error', mensaje: 'Falta el ID del usuario' });
        }

        await db.collection('users').doc(uid).update({
            localidad: localidad || '',
            provincia: provincia || '',
            ultimaActualizacion: new Date().toISOString()
        });

        res.json({ status: 'success', mensaje: 'Ubicación actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({ status: 'error', mensaje: 'Error al procesar la actualización' });
    }
});

// ==========================================
// NUEVO: GUARDAR UN CHANGO EN EL HISTORIAL -> /api/users/historial-compras
// ==========================================
router.post('/historial-compras', async (req, res) => {
    try {
        const { uid, fecha, total, itemsCount, items } = req.body;

        if (!uid) {
            return res.status(400).json({ status: 'error', mensaje: 'Falta el ID del usuario (uid)' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ status: 'error', mensaje: 'El chango está vacío.' });
        }

        const nuevoChango = {
            fecha: fecha || new Date().toLocaleDateString(),
            total: total || 0,
            itemsCount: itemsCount || items.length,
            items,
            createdAt: new Date().toISOString()
        };

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        let historial = [];
        if (doc.exists && doc.data().historialCompras) {
            historial = doc.data().historialCompras;
        }

        // Insertar al inicio para ver los más recientes primero
        historial.unshift(nuevoChango);

        await userRef.set({ historialCompras: historial }, { merge: true });

        return res.json({ 
            status: 'success',
            mensaje: 'Chango guardado con éxito', 
            historial 
        });
    } catch (error) {
        console.error('Error al guardar historial:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error interno al guardar el chango.' });
    }
});

// ==========================================
// NUEVO: OBTENER EL HISTORIAL DE COMPRAS -> /api/users/historial-compras/:uid
// ==========================================
router.get('/historial-compras/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        if (!uid) {
            return res.status(400).json({ status: 'error', mensaje: 'Falta el ID del usuario' });
        }

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.json({ status: 'success', historial: [] });
        }

        const data = doc.data();
        return res.json({
            status: 'success',
            historial: data.historialCompras || []
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error interno al obtener el historial.' });
    }
});

// ==========================================
// CATÁLOGO MASIVO PAGINADO CON FILTROS (11 Categorías)
// Ruta -> /api/users/productos/catalogo
// ==========================================
router.get('/productos/catalogo', async (req, res) => {
    try {
        const { categoria, marca, search, limit = 50, startAfter } = req.query;
        let queryRef = db.collection('productos');

        // Filtrar por categoría oficial
        if (categoria) {
            queryRef = queryRef.where('categoria', '==', categoria);
        }

        // Filtrar por marca específica
        if (marca) {
            queryRef = queryRef.where('marca', '==', marca);
        }

        // Ordenamiento por nombre para mantener consistencia en la paginación
        queryRef = queryRef.orderBy('name');

        // Paginación basada en documentos (Cursor Firestore)
        if (startAfter) {
            const docSnap = await db.collection('productos').doc(startAfter).get();
            if (docSnap.exists) {
                queryRef = queryRef.startAfter(docSnap);
            }
        }

        const limitNumber = parseInt(limit) || 50;
        queryRef = queryRef.limit(limitNumber);

        const snapshot = await queryRef.get();
        let productos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Si se envió un parámetro 'search' de texto libre, filtramos localmente para aproximaciones
        if (search) {
            const searchTerm = search.toLowerCase().trim();
            productos = productos.filter(p => 
                (p.name && p.name.toLowerCase().includes(searchTerm)) || 
                (p.ean && p.ean.includes(searchTerm)) ||
                (p.marca && p.marca.toLowerCase().includes(searchTerm))
            );
        }

        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

        return res.json({
            status: 'success',
            total: productos.length,
            lastVisible,
            data: productos
        });

    } catch (error) {
        console.error('Error al obtener el catálogo masivo:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error interno al cargar el catálogo de productos' });
    }
});

// BUSCAR PRODUCTO CRUZANDO PRECIOS Y SUPERMERCADOS CERCANOS -> /api/users/productos/buscar
router.get('/productos/buscar', async (req, res) => {
    try {
        const { q, ean, search, localidad, provincia } = req.query;
        const queryTerm = q || ean || search;

        if (!queryTerm) {
            return res.status(400).json({ status: 'error', mensaje: 'Falta el parámetro de búsqueda' });
        }

        const productsRef = db.collection('productos');
        let productData = null;

        const isEan = /^\d{8,14}$/.test(queryTerm.trim());
        
        if (isEan) {
            const eanQuery = await productsRef.where('ean', '==', queryTerm.trim()).get();
            if (!eanQuery.empty) {
                productData = { id: eanQuery.docs[0].id, ...eanQuery.docs[0].data() };
            }
        } else {
            const nameQuery = await productsRef
                .where('name', '>=', queryTerm.trim())
                .where('name', '<=', queryTerm.trim() + '\uf8ff')
                .get();
                
            if (!nameQuery.empty) {
                productData = { id: nameQuery.docs[0].id, ...nameQuery.docs[0].data() };
            }
        }

        if (!productData) {
            return res.status(404).json({
                status: 'not_found',
                mensaje: 'El producto escaneado o buscado no figura en la base de datos.',
                data: []
            });
        }

        const nearbySupermarkets = getSupermarketsByLocality(localidad, provincia);
        let comparisonsList = [];

        if (productData.comparisons && Array.isArray(productData.comparisons) && productData.comparisons.length > 0) {
            comparisonsList = productData.comparisons;
        } else {
            const basePriceNum = parseFloat(String(productData.precio || productData.price || "0").replace(/\./g, '').replace(',', '.')) || 1000;
            
            comparisonsList = nearbySupermarkets.map((sup, idx) => {
                const varianceFactor = 1 + ((idx * 3 - 4) / 100); 
                const simulatedPrice = Math.round(basePriceNum * varianceFactor);
                const formattedPrice = simulatedPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                return {
                    supermarket: sup.name,
                    price: formattedPrice,
                    logo: sup.logo,
                    color: sup.color
                };
            });
        }

        // Mapear las sucursales al formato plano exacto que la app móvil procesa
        const listaSucursalesParaApp = comparisonsList.map(comp => ({
            id: productData.id,
            nombre: productData.name || productData.nombre || 'Producto',
            marca: productData.marca || 'Marca Registrada',
            medida: productData.medida || productData.presentacion || '',
            ean: productData.ean || queryTerm.trim(),
            precio: comp.price,
            supermercado: comp.supermarket || comp.comercio,
            imagen: productData.imagen || productData.foto || 'https://images.carrefour.com.ar/media/catalog/product/s/e/685100_1.jpg'
        }));

        return res.json({
            status: 'success',
            data: listaSucursalesParaApp
        });

    } catch (error) {
        console.error('Error al buscar producto:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error interno al consultar el producto' });
    }
});

// OPTIMIZADOR Y CALCULADOR DE AHORRO DE LISTAS DE COMPRAS -> /api/users/lista/optimizar
router.post('/lista/optimizar', async (req, res) => {
    try {
        const { items, localidad, provincia } = req.body; 

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ status: 'error', mensaje: 'La lista de compras está vacía' });
        }

        const nearbySupermarkets = getSupermarketsByLocality(localidad, provincia);
        const productsRef = db.collection('productos');
        
        let detalleItemsOptimizados = [];
        let totalesPorSupermercado = {};

        nearbySupermarkets.forEach(sup => {
            totalesPorSupermercado[sup.name] = {
                supermarket: sup.name,
                logo: sup.logo,
                color: sup.color,
                totalNumerico: 0,
                totalFormateado: "$0,00"
            };
        });

        for (const item of items) {
            let productData = null;

            if (item.ean) {
                const eanQ = await productsRef.where('ean', '==', item.ean).get();
                if (!eanQ.empty) productData = eanQ.docs[0].data();
            } else if (item.name) {
                const nameQ = await productsRef.where('name', '==', item.name).get();
                if (!nameQ.empty) productData = nameQ.docs[0].data();
            }

            if (!productData) continue; 

            let itemComparisons = productData.comparisons;
            if (!itemComparisons || !Array.isArray(itemComparisons) || itemComparisons.length === 0) {
                const basePriceNum = parseFloat(String(productData.precio || productData.price || "1000").replace(/\./g, '').replace(',', '.')) || 1000;
                itemComparisons = nearbySupermarkets.map((sup, idx) => {
                    const varianceFactor = 1 + ((idx * 3 - 4) / 100);
                    const simulatedPrice = Math.round(basePriceNum * varianceFactor);
                    return {
                        supermarket: sup.name,
                        price: simulatedPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    };
                });
            }

            itemComparisons.sort((a, b) => {
                const cleanA = parseFloat(String(a.price).replace(/\./g, '').replace(',', '.')) || 0;
                const cleanB = parseFloat(String(b.price).replace(/\./g, '').replace(',', '.')) || 0;
                return cleanA - cleanB;
            });

            const masBaratoItem = itemComparisons[0];
            const masCaroItem = itemComparisons[itemComparisons.length - 1];

            const precioMinNum = parseFloat(String(masBaratoItem.price).replace(/\./g, '').replace(',', '.')) || 0;
            const precioMaxNum = parseFloat(String(masCaroItem.price).replace(/\./g, '').replace(',', '.')) || 0;
            const ahorroUnitario = precioMaxNum - precioMinNum;

            detalleItemsOptimizados.push({
                nombre: productData.name,
                ean: productData.ean,
                masBaratoEn: masBaratoItem.supermarket,
                precioMasBarato: masBaratoItem.price,
                ahorroIndividual: ahorroUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                comparaciones: itemComparisons
            });

            itemComparisons.forEach(comp => {
                if (totalesPorSupermercado[comp.supermarket]) {
                    const valNum = parseFloat(String(comp.price).replace(/\./g, '').replace(',', '.')) || 0;
                    totalesPorSupermercado[comp.supermarket].totalNumerico += valNum;
                }
            });
        }

        let rankingSupermercados = Object.values(totalesPorSupermercado).map(sup => ({
            ...sup,
            totalFormateado: sup.totalNumerico.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })).filter(sup => sup.totalNumerico > 0);

        rankingSupermercados.sort((a, b) => a.totalNumerico - b.totalNumerico);

        const mejorSupermercadoGlobal = rankingSupermercados[0] || null;
        const peorSupermercadoGlobal = rankingSupermercados[rankingSupermercados.length - 1] || null;

        let ahorroTotalPesos = 0;
        if (mejorSupermercadoGlobal && peorSupermercadoGlobal) {
            ahorroTotalPesos = peorSupermercadoGlobal.totalNumerico - mejorSupermercadoGlobal.totalNumerico;
        }

        return res.json({
            status: 'success',
            resumenAhorro: {
                supermercadoRecomendado: mejorSupermercadoGlobal ? mejorSupermercadoGlobal.supermarket : 'N/A',
                costoTotalRecomendado: mejorSupermercadoGlobal ? mejorSupermercadoGlobal.totalFormateado : '$0,00',
                ahorroMaximoEstimado: ahorroTotalPesos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                mensajeAhorro: mejorSupermercadoGlobal 
                    ? `¡Comprando toda la lista en ${mejorSupermercadoGlobal.supermarket} ahorrás hasta $${ahorroTotalPesos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} en comparación con el comercio más costoso de la zona!`
                    : 'No hay suficientes datos para calcular el ahorro.'
            },
            rankingSupermercados: rankingSupermercados,
            detalleItems: detalleItemsOptimizados
        });

    } catch (error) {
        console.error('Error al optimizar la lista de compras:', error);
        return res.status(500).json({ status: 'error', mensaje: 'Error interno al procesar el chango de compras' });
    }
});

module.exports = router;