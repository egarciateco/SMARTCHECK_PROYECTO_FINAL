import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    SafeAreaView, 
    TouchableOpacity, 
    Image, 
    ScrollView,
    Linking,
    Platform 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

// Diccionario corregido con la ruta correcta para el logo de DIA y el resto de los supermercados
const LOGOS_SUPER = {
    carrefour: require('../../assets/logos/carrefour.png'),
    coto: require('../../assets/logos/coto.png'),
    changomas: require('../../assets/logos/changomas.png'),
    disco: require('../../assets/logos/disco.png'),
    jumbo: require('../../assets/logos/jumbo.png'),
    vea: require('../../assets/logos/vea.png'),
    dia: require('../../assets/logos/dia.png'),
    walmart: require('../../assets/logos/walmart.png'),
    maxiconsumo: require('../../assets/logos/maxiconsumo.png'),
};

const obtenerLogoSupermercado = (nombreSup) => {
    const nombreLower = (nombreSup || '').toLowerCase();
    for (const key of Object.keys(LOGOS_SUPER)) {
        if (nombreLower.includes(key)) {
            return LOGOS_SUPER[key];
        }
    }
    return LOGOS_SUPER['carrefour'];
};

export default function ProductSearchScreen({ route, navigation }) {
    const { logout } = useAuth();
    const { latitud, longitud, productoEncontrado } = route.params || {};

    const [productosCercanos, setProductosCercanos] = useState([]);
    const [loading, setLoading] = useState(true);

    const userLat = latitud || -31.7333;
    const userLng = longitud || -60.5333;

    useEffect(() => {
        buscarSupermercadosCercanos();
    }, []);

    const buscarSupermercadosCercanos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/users/productos/cercanos', {
                params: { 
                    lat: userLat, 
                    lng: userLng,
                    ean: productoEncontrado?.ean || '' 
                },
                timeout: 8000
            });

            if (response.data && response.data.status === 'success') {
                setProductosCercanos(response.data.data || []);
            } else {
                throw new Error("Sin datos del servidor");
            }
        } catch (error) {
            setProductosCercanos([
                { id: '1', sucursal: 'Carrefour Hyper', direccion: 'Av. Ramírez 2500, Paraná', lat: -31.7410, lng: -60.5120, distancia: '0.8 km' },
                { id: '2', sucursal: 'Supermercados Coto', direccion: 'Peatonal San Martín 450, Paraná', lat: -31.7315, lng: -60.5230, distancia: '1.2 km' },
                { id: '3', sucursal: 'Supermercados DIA', direccion: 'Gualeguaychú 120, Paraná', lat: -31.7380, lng: -60.5190, distancia: '1.5 km' },
                { id: '4', sucursal: 'Changomas', direccion: 'Circunvalación S/N, Paraná', lat: -31.7550, lng: -60.5050, distancia: '2.5 km' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir la ruta en auto utilizando mapas nativos (Google Maps / Apple Maps)
    const abrirRutaEnAuto = (destinoLat, destinoLng, nombreSucursal) => {
        const dLat = destinoLat || userLat;
        const dLng = destinoLng || userLng;
        const label = encodeURIComponent(nombreSucursal);

        const url = Platform.select({
            ios: `maps://app?saddr=${userLat},${userLng}&daddr=${dLat},${dLng}&dirflg=d`,
            android: `google.navigation:q=${dLat},${dLng}&mode=d`
        });

        const webFallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${dLat},${dLng}&travelmode=driving`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    return Linking.openURL(webFallbackUrl);
                }
            })
            .catch(() => Linking.openURL(webFallbackUrl));
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ubicación y Sucursales</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                
                {/* Producto Seleccionado Info */}
                {productoEncontrado && (
                    <View style={styles.productCard}>
                        {productoEncontrado.imagen ? (
                            <Image source={{ uri: productoEncontrado.imagen }} style={styles.productImg} resizeMode="contain" />
                        ) : null}
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{productoEncontrado.descripcion || productoEncontrado.nombre}</Text>
                            <Text style={styles.productBrand}>Marca: {productoEncontrado.marca || 'N/D'}</Text>
                            <Text style={styles.productEan}>EAN: {productoEncontrado.ean || productoEncontrado.id || 'N/D'}</Text>
                        </View>
                    </View>
                )}

                {/* Cuadro contenedor con el Mapa integrado adentro */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionHeaderText}>📍 Supermercados Cercanos y Mapa Radar</Text>
                    </View>

                    {/* Contenedor del Mapa Visual Interactivo */}
                    <View style={styles.mapContainer}>
                        <View style={styles.radarCenterPin}>
                            <Text style={styles.pinText}>🎯 Tu Ubicación</Text>
                        </View>
                        {productosCercanos.map((item, index) => (
                            <View key={index} style={[styles.miniPin, { top: 20 + (index * 35), left: 15 + (index * 55) }]} >
                                <Text style={styles.miniPinText}>🛒 {item.sucursal.split(' ')[0]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Listado detallado ordenado por cercanía */}
                <Text style={styles.subTitle}>Listado de sucursales por orden de cercanía</Text>

                {loading ? (
                    <Text style={styles.loadingText}>Cargando sucursales cercanas...</Text>
                ) : (
                    productosCercanos.map((item, index) => (
                        <View key={item.id || index} style={styles.sucursalCard}>
                            <Image 
                                source={obtenerLogoSupermercado(item.sucursal)} 
                                style={styles.superLogo} 
                                resizeMode="contain" 
                            />
                            
                            <View style={styles.sucursalInfoContent}>
                                <Text style={styles.sucursalName}>{item.sucursal}</Text>
                                <Text style={styles.sucursalAddress}>{item.direccion}</Text>
                                <Text style={styles.distanciaText}>A {item.distancia} de tu ubicación</Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.selectButton}
                                onPress={() => abrirRutaEnAuto(item.lat, item.lng, item.sucursal)}
                            >
                                <Text style={styles.selectButtonText}>Ver Ruta</Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#020C1B',
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
    },
    backText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
    headerTitle: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
    scrollContainer: { padding: 16, paddingBottom: 40 },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#112240',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#233554'
    },
    productImg: { width: 60, height: 60, backgroundColor: '#fff', borderRadius: 8, marginRight: 12 },
    productInfo: { flex: 1 },
    productName: { color: '#E6F1FF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    productBrand: { color: '#8892B0', fontSize: 12, marginBottom: 2 },
    productEan: { color: '#FFD700', fontSize: 11 },
    sectionContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#00ffcc',
        marginBottom: 20,
        backgroundColor: '#020C1B'
    },
    sectionHeaderBox: {
        backgroundColor: '#003366',
        paddingVertical: 8,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#00ffcc'
    },
    sectionHeaderText: { color: '#00ffcc', fontSize: 13, fontWeight: 'bold' },
    mapContainer: {
        height: 180,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#071124'
    },
    radarCenterPin: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#000'
    },
    pinText: { color: '#000', fontWeight: 'bold', fontSize: 11 },
    miniPin: {
        position: 'absolute',
        backgroundColor: '#112240',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#28a745'
    },
    miniPinText: { color: '#28a745', fontSize: 10, fontWeight: 'bold' },
    subTitle: { fontSize: 14, fontWeight: 'bold', color: '#E6F1FF', marginBottom: 12 },
    loadingText: { color: '#8892B0', textAlign: 'center', marginVertical: 20 },
    sucursalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#112240',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#233554'
    },
    superLogo: {
        width: 48,
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 4,
        marginRight: 12,
        resizeMode: 'contain'
    },
    sucursalInfoContent: {
        flex: 1
    },
    sucursalName: { color: '#E6F1FF', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    sucursalAddress: { color: '#8892B0', fontSize: 11, marginBottom: 2 },
    distanciaText: { color: '#00ffcc', fontSize: 11, fontWeight: 'bold' },
    selectButton: { 
        backgroundColor: '#28a745', 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectButtonText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});