import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../config/api';

const LOGOS_SUPER = {
    coto: require('../../assets/logos/coto.png'),
    carrefour: require('../../assets/logos/carrefour.png'),
    dia: require('../../assets/logos/dia.png'),
    vea: require('../../assets/logos/vea.png'),
    jumbo: require('../../assets/logos/jumbo.png'),
    changomas: require('../../assets/logos/changomas.png'),
    maxiconsumo: require('../../assets/logos/maxiconsumo.png'),
    lanonima: require('../../assets/logos/lanonima.png'),
    walmart: require('../../assets/logos/walmart.png'),
    disco: require('../../assets/logos/disco.png'),
    default: require('../../assets/localidad.png')
};

const obtenerLogoSupermercado = (sup) => {
    const nombre = sup?.supermercado || sup?.nombre || sup?.cadena || '';
    if (!nombre) return LOGOS_SUPER.default;
    
    const lower = String(nombre).toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (lower.includes('coto')) return LOGOS_SUPER.coto;
    if (lower.includes('carrefour')) return LOGOS_SUPER.carrefour;
    if (lower.includes('dia')) return LOGOS_SUPER.dia;
    if (lower.includes('vea')) return LOGOS_SUPER.vea;
    if (lower.includes('jumbo')) return LOGOS_SUPER.jumbo;
    if (lower.includes('chango')) return LOGOS_SUPER.changomas;
    if (lower.includes('maxiconsumo')) return LOGOS_SUPER.maxiconsumo;
    if (lower.includes('anonima')) return LOGOS_SUPER.lanonima;
    if (lower.includes('walmart')) return LOGOS_SUPER.walmart;
    if (lower.includes('disco')) return LOGOS_SUPER.disco;
    
    return LOGOS_SUPER.default;
};

// Respaldo robusto con distancias métricas iniciales
const SUPERMERCADOS_RESPALDO = [
    { id: '1', supermercado: 'Coto - Sucursal Paraná', latitude: -31.7400, longitude: -60.5200, direccion: 'Av. Ramírez 2300', distanciaKm: 0.65, distancia: '650 mts' },
    { id: '2', supermercado: 'Carrefour Market', latitude: -31.7250, longitude: -60.5400, direccion: 'Gualeguaychú 450', distanciaKm: 1.2, distancia: '1.2 km' },
    { id: '3', supermercado: 'Supermercados Día', latitude: -31.7350, longitude: -60.5150, direccion: 'Belgrano 890', distanciaKm: 1.8, distancia: '1.8 km' },
    { id: '4', supermercado: 'Supermercados Vea', latitude: -31.7310, longitude: -60.5250, direccion: '25 de Mayo 1420', distanciaKm: 2.3, distancia: '2.3 km' }
];

export default function SupermercadosCercaScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [supermercados, setSupermercados] = useState([]);
    const [ubicacionTexto, setUbicacionTexto] = useState('Detectando dirección...');
    const [userCoords, setUserCoords] = useState({ latitude: -31.7333, longitude: -60.5333 });

    useEffect(() => {
        cargarSupermercadosCercanos();
    }, []);

    const cargarSupermercadosCercanos = async () => {
        setLoading(true);
        let latitude = -31.7333;
        let longitude = -60.5333;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
                setUserCoords({ latitude, longitude });

                let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (reverseGeocode && reverseGeocode.length > 0) {
                    const addr = reverseGeocode[0];
                    const calle = addr.street || addr.name || 'Ubicación actual';
                    const numero = addr.streetNumber ? ` ${addr.streetNumber}` : '';
                    const ciudad = addr.city || addr.subregion || addr.region || 'Paraná';
                    setUbicacionTexto(`${calle}${numero}, ${ciudad}`);
                } else {
                    setUbicacionTexto('Paraná, Entre Ríos');
                }
            } else {
                setUbicacionTexto('Paraná, Entre Ríos (Ubicación predeterminada)');
            }
        } catch (locError) {
            console.log('Aviso GPS:', locError);
            setUbicacionTexto('Paraná, Entre Ríos');
        }

        try {
            const urlPeticion = `/api/supermercados/cercanos?lat=${latitude}&lng=${longitude}`;
            console.log(`🚀 [API] Consultando: ${urlPeticion}`);

            const response = await api.get(urlPeticion, { timeout: 6000 });
            let listaBruta = [];

            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                listaBruta = response.data.data;
            } else if (Array.isArray(response.data)) {
                listaBruta = response.data;
            }

            if (listaBruta.length > 0) {
                const formateados = listaBruta.map(sup => {
                    const lat = parseFloat(sup.latitude || sup.lat || sup.LATITUD || latitude);
                    const lng = parseFloat(sup.longitude || sup.lng || sup.LONGITUD || longitude);
                    
                    let distKm = sup.distanciaKm !== undefined ? parseFloat(sup.distanciaKm) : null;

                    if (distKm === null || isNaN(distKm)) {
                        const R = 6371;
                        const dLat = (lat - latitude) * (Math.PI / 180);
                        const dLon = (lng - longitude) * (Math.PI / 180);
                        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                  Math.cos(latitude * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) *
                                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        distKm = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                    }

                    return {
                        ...sup,
                        latitude: lat,
                        longitude: lng,
                        distanciaKm: distKm,
                        distancia: distKm < 1 ? `${Math.round(distKm * 1000)} mts` : `${distKm.toFixed(1)} km`
                    };
                });

                formateados.sort((a, b) => a.distanciaKm - b.distanciaKm);
                setSupermercados(formateados);
            } else {
                setSupermercados(SUPERMERCADOS_RESPALDO);
            }
        } catch (error) {
            console.error('Error conectando al backend de cercanos, usando respaldo:', error);
            setSupermercados(SUPERMERCADOS_RESPALDO);
        } finally {
            setLoading(false);
        }
    };

    const abrirEnMapaExterno = (sup) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${sup.latitude},${sup.longitude}`;
        const label = encodeURIComponent(sup.supermercado || sup.nombre || sup.cadena || 'Sucursal');
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((sup.supermercado || sup.nombre || sup.cadena || '') + ' ' + (sup.direccion || ''))}`);
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.appHeader}>
                <Image source={require('../../assets/logo.png')} style={styles.logoApp} resizeMode="contain" />
                <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} resizeMode="contain" />
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.goldenLineTop} />

            <View style={styles.titleBand}>
                <Text style={styles.titleBandText}>SUPERMERCADOS + CERCA</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Localizando sucursales en tu zona...</Text>
                </View>
            ) : (
                <View style={styles.contentContainer}>
                    <View style={styles.mapContainer}>
                        <View style={styles.mapVisualMock}>
                            <View style={styles.ubicacionRow}>
                                <Image source={require('../../assets/localidad.png')} style={styles.localidadIcon} resizeMode="contain" />
                                <Text style={styles.mapMockTitle}>Ubicación Actual: Geolocalizada</Text>
                            </View>
                            <Text style={styles.mapMockAddress}>{ubicacionTexto}</Text>
                            <Text style={styles.mapMockSubtitle}>Radar activo: {supermercados.length} sucursales cercanas</Text>
                            <TouchableOpacity 
                                style={styles.mapButtonAction}
                                onPress={() => abrirEnMapaExterno({ latitude: userCoords.latitude, longitude: userCoords.longitude, supermercado: 'Mi Ubicación', direccion: 'Ubicación Actual' })}
                            >
                                <Text style={styles.mapButtonText}>Abrir Mapa General en Google Maps</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.infoBanner}>
                            <Text style={styles.bannerText}>Toque cualquier sucursal para trazar la ruta</Text>
                        </View>

                        {supermercados.map((sup, index) => (
                            <TouchableOpacity 
                                key={sup.id || sup.sucursal_id || index} 
                                style={styles.card}
                                activeOpacity={0.8}
                                onPress={() => abrirEnMapaExterno(sup)}
                            >
                                <View style={styles.cardIconContainer}>
                                    <Image 
                                        source={sup.logo ? { uri: sup.logo } : obtenerLogoSupermercado(sup)} 
                                        style={styles.logoImage} 
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{sup.supermercado || sup.nombre || `${sup.cadena || ''} - ${sup.localidad || ''}`}</Text>
                                    <Text style={styles.cardAddress}>{sup.direccion || `${sup.localidad}, ${sup.provincia}`}</Text>
                                    <Text style={styles.cardDistance}>📍 Aprox. {sup.distancia}</Text>
                                </View>
                                <View style={styles.actionContainer}>
                                    <Text style={styles.actionText}>Ir ➔</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.footerContainer}>
                <View style={styles.goldenLine} />
                <View style={styles.footerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerButton}>
                        <Image source={require('../../assets/volver.png')} style={styles.footerIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.footerButton}>
                        <Image source={require('../../assets/salir.png')} style={styles.footerIcon} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A192F' },
    appHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16,
        paddingVertical: 10, 
        backgroundColor: '#020C1B'
    },
    logoApp: { width: 52, height: 52 },
    nombreApp: { height: 32, width: 170, resizeMode: 'contain' },
    headerSpacer: { width: 52 },
    goldenLineTop: {
        width: '100%',
        height: 1.5,
        backgroundColor: '#FFD700'
    },
    titleBand: {
        width: '100%',
        backgroundColor: '#000000',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700'
    },
    titleBandText: {
        color: '#FFD700',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A192F' },
    loadingText: { color: '#8892B0', marginTop: 10, fontSize: 13 },
    contentContainer: { flex: 1 },
    mapContainer: { 
        height: 175, 
        width: '100%', 
        backgroundColor: '#020C1B',
        borderBottomWidth: 2, 
        borderBottomColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12
    },
    mapVisualMock: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    ubicacionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        gap: 6
    },
    localidadIcon: { width: 18, height: 18 },
    mapMockTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
    mapMockAddress: { color: '#FFD700', fontSize: 13, fontWeight: '600', marginBottom: 2, textAlign: 'center' },
    mapMockSubtitle: { color: '#8892B0', fontSize: 11, marginBottom: 8 },
    mapButtonAction: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    mapButtonText: { color: '#0A192F', fontSize: 11, fontWeight: 'bold' },
    scrollContainer: { padding: 16, paddingBottom: 30 },
    infoBanner: { 
        backgroundColor: 'rgba(255, 215, 0, 0.1)', 
        borderWidth: 1, 
        borderColor: '#FFD700', 
        borderRadius: 8, 
        padding: 10, 
        marginBottom: 14,
        alignItems: 'center' 
    },
    bannerText: { color: '#FFD700', fontSize: 11, textAlign: 'center', fontWeight: '500' },
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#1E222B', 
        borderRadius: 12, 
        padding: 14, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2D3748'
    },
    cardIconContainer: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: '#FFFFFF', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        marginRight: 12,
        overflow: 'hidden',
        padding: 4
    },
    logoImage: { width: '100%', height: '100%' },
    cardContent: { flex: 1 },
    cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    cardAddress: { color: '#A0AEC0', fontSize: 12, marginBottom: 4 },
    cardDistance: { color: '#00ffcc', fontSize: 11, fontWeight: '600' },
    actionContainer: { paddingLeft: 10, justifyContent: 'center', alignItems: 'center' },
    actionText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
    footerContainer: {
        width: '100%',
        backgroundColor: '#020C1B',
        paddingVertical: 10
    },
    goldenLine: {
        width: '100%',
        height: 1.5,
        backgroundColor: '#FFD700',
        marginBottom: 10
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
        alignItems: 'center'
    },
    footerButton: {
        padding: 4
    },
    footerIcon: {
        width: 36,
        height: 36,
        resizeMode: 'contain',
        tintColor: '#00BFFF'
    }
});