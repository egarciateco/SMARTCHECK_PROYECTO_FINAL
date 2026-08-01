import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';

const LOGOS_SUPER = {
    coto: require('../../assets/logos/coto.png'),
    carrefour: require('../../assets/logos/carrefour.png'),
    dia: require('../../assets/logos/dia.png'),
    vea: require('../../assets/logos/vea.png'),
    default: require('../../assets/localidad.png')
};

const obtenerLogoSupermercado = (nombre) => {
    if (!nombre) return LOGOS_SUPER.default;
    const lower = nombre.toLowerCase();
    if (lower.includes('coto')) return LOGOS_SUPER.coto;
    if (lower.includes('carrefour')) return LOGOS_SUPER.carrefour;
    if (lower.includes('dia') || lower.includes('día')) return LOGOS_SUPER.dia;
    if (lower.includes('vea')) return LOGOS_SUPER.vea;
    return LOGOS_SUPER.default;
};

const SUPERMERCADOS_RESPALDO = [
    { id: '1', nombre: 'Coto - Sucursal Paraná', latitude: -31.7400, longitude: -60.5200, direccion: 'Av. Ramírez 2300', distancia: '650 mts' },
    { id: '2', nombre: 'Carrefour Market', latitude: -31.7250, longitude: -60.5400, direccion: 'Gualeguaychú 450', distancia: '1.2 km' },
    { id: '3', nombre: 'Supermercados Día', latitude: -31.7350, longitude: -60.5150, direccion: 'Belgrano 890', distancia: '1.8 km' },
    { id: '4', nombre: 'Supermercados Vea', latitude: -31.7310, longitude: -60.5250, direccion: '25 de Mayo 1420', distancia: '2.3 km' }
];

export default function SupermercadosCercaScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [supermercados, setSupermercados] = useState([]);

    useEffect(() => {
        cargarSupermercadosCercanos();
    }, []);

    const cargarSupermercadosCercanos = async () => {
        setLoading(true);
        try {
            // Ajustado a /api/supermercados/cercanos (si tu backend usa /api/users, puedes volver a agregarlo)
            const response = await api.get('/api/supermercados/cercanos', {
                params: { localidad: 'Paraná', provincia: 'Entre Ríos' },
                timeout: 3000
            });

            if (response.data && typeof response.data === 'object' && response.data.status === 'success') {
                const dataServidor = response.data.data;
                const formateados = (dataServidor && dataServidor.length > 0 ? dataServidor : SUPERMERCADOS_RESPALDO).map(sup => ({
                    ...sup,
                    latitude: sup.latitude || sup.lat || -31.7333,
                    longitude: sup.longitude || sup.lng || -60.5333
                }));
                setSupermercados(formateados);
            } else {
                setSupermercados(SUPERMERCADOS_RESPALDO);
            }
        } catch (error) {
            // Ante cualquier fallo de red o 404, usamos el respaldo local sin interrumpir al usuario
            setSupermercados(SUPERMERCADOS_RESPALDO);
        } finally {
            setLoading(false);
        }
    };

    const abrirEnMapaExterno = (sup) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${sup.latitude},${sup.longitude}`;
        const label = encodeURIComponent(sup.nombre);
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sup.nombre + ' ' + sup.direccion)}`);
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../../assets/volver.png')} style={styles.volverIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Supermercados + Cerca</Text>
                <View style={{ width: 40 }} />
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
                                <Text style={styles.mapMockTitle}>Ubicación Actual: Paraná, Entre Ríos</Text>
                            </View>
                            <Text style={styles.mapMockSubtitle}>Radar activo: {supermercados.length} sucursales encontradas en la zona</Text>
                            <TouchableOpacity 
                                style={styles.mapButtonAction}
                                onPress={() => abrirEnMapaExterno({ latitude: -31.7333, longitude: -60.5333, nombre: 'Mi Ubicación', direccion: 'Paraná' })}
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
                                key={sup.id || index} 
                                style={styles.card}
                                activeOpacity={0.8}
                                onPress={() => abrirEnMapaExterno(sup)}
                            >
                                <View style={styles.cardIconContainer}>
                                    <Image 
                                        source={obtenerLogoSupermercado(sup.nombre)} 
                                        style={styles.logoImage} 
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{sup.nombre}</Text>
                                    <Text style={styles.cardAddress}>{sup.direccion}</Text>
                                    <Text style={styles.cardDistance}>Aprox. {sup.distancia || 'A pocos metros'}</Text>
                                </View>
                                <View style={styles.actionContainer}>
                                    <Text style={styles.actionText}>Ir ➔</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
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
    backButton: { padding: 4, justifyContent: 'center', alignItems: 'center' },
    volverIcon: { width: 30, height: 30, resizeMode: 'contain', tintColor: '#00BFFF' },
    headerTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A192F' },
    loadingText: { color: '#8892B0', marginTop: 10, fontSize: 13 },
    contentContainer: { flex: 1 },
    mapContainer: { 
        height: 160, 
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
        marginBottom: 4,
        gap: 6
    },
    localidadIcon: { width: 20, height: 20 },
    mapMockTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
    mapMockSubtitle: { color: '#8892B0', fontSize: 12, marginBottom: 12 },
    mapButtonAction: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8
    },
    mapButtonText: { color: '#0A192F', fontSize: 12, fontWeight: 'bold' },
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
        backgroundColor: '#020C1B', 
        borderRadius: 12, 
        padding: 14, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e3a5f'
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
    cardAddress: { color: '#8892B0', fontSize: 12, marginBottom: 4 },
    cardDistance: { color: '#00ffcc', fontSize: 11, fontWeight: '600' },
    actionContainer: { paddingLeft: 10, justifyContent: 'center', alignItems: 'center' },
    actionText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' }
});