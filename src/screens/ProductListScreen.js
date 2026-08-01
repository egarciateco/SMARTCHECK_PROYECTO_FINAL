import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, FlatList, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Catálogo local completo con todos los productos de respaldo
const CATALOGO_LOCAL_COMPLETO = [
    { id: '1', nombre: 'Fideos Tallarín Marolio 500g', marca: 'Marolio', precio: 1100, imagen: 'https://masonline.vtexassets.com/arquivos/ids/245679/Fideos-Tallarin-Marolio-500-G-1-768gesch.jpg' },
    { id: '2', nombre: 'Fideos Tirabuzón Marolio 500g', marca: 'Marolio', precio: 1100, imagen: 'https://masonline.vtexassets.com/arquivos/ids/245678/Fideos-Mono-Marolio-500-G-1-768gesch.jpg' },
    { id: '3', nombre: 'Arroz Largo Fino Marolio 1kg', marca: 'Marolio', precio: 1400, imagen: 'https://masonline.vtexassets.com/arquivos/ids/231234/Arroz-Largo-Fino-Marolio-1-Kg-1-768gesch.jpg' },
    { id: '4', nombre: 'Fideos Tirabuzón Lucchetti 500g', marca: 'Lucchetti', precio: 1350, imagen: 'https://masonline.vtexassets.com/arquivos/ids/212345/Fideos-Tirabuzon-Lucchetti-500-G-1-768gesch.jpg' },
    { id: '5', nombre: 'Fideos Lucchetti 500g', marca: 'Lucchetti', precio: 1350, imagen: 'https://masonline.vtexassets.com/arquivos/ids/212346/Fideos-Fideo-Lucchetti-500-G-1-768gesch.jpg' },
    { id: '6', nombre: 'Harina Leudante 0000 Cañuelas 1kg', marca: 'Molino Cañuelas', precio: 980, imagen: 'https://masonline.vtexassets.com/arquivos/ids/221122/Harina-Leudante-Canuelas-1-Kg-1-768gesch.jpg' },
    { id: '7', nombre: 'Yerba Mate La Merced De Monte 500g', marca: 'La Merced', precio: 3200, imagen: 'https://masonline.vtexassets.com/arquivos/ids/223456/Yerba-Mate-La-Merced-De-Monte-500-G-1-768gesch.jpg' },
    { id: '8', nombre: 'Leche Entera La Serenísima Sachet 1L', marca: 'La Serenísima', precio: 1450, imagen: 'https://masonline.vtexassets.com/arquivos/ids/232323/Leche-Entera-La-Serenisima-1-Lt-1-768gesch.jpg' },
    { id: '9', nombre: 'Leche Descremada La Serenísima Sachet 1L', marca: 'La Serenísima', precio: 1450, imagen: 'https://masonline.vtexassets.com/arquivos/ids/232324/Leche-Descremada-La-Serenisima-1-Lt-1-768gesch.jpg' },
    { id: '10', nombre: 'Gaseosa Coca-Cola Sabor Original 2.25L', marca: 'Coca-Cola', precio: 2800, imagen: 'https://masonline.vtexassets.com/arquivos/ids/234567/Gaseosa-Coca-Cola-Sabor-Original-2-25-Lt-1-768gesch.jpg' }
];

export default function ProductListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { logout } = useAuth();
    const searchQuery = route.params?.query || '';

    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    const [mensajeAviso, setMensajeAviso] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        realizarBusquedaLocal();
    }, [searchQuery]);

    const realizarBusquedaLocal = () => {
        setLoading(true);
        setMensajeAviso(null);

        setTimeout(() => {
            const textoBusqueda = searchQuery.toLowerCase().trim();
            
            const resultados = CATALOGO_LOCAL_COMPLETO.filter(item => 
                item.nombre.toLowerCase().includes(textoBusqueda) || 
                item.marca.toLowerCase().includes(textoBusqueda)
            );

            if (resultados.length > 0) {
                setProductos(resultados);
            } else {
                setProductos(CATALOGO_LOCAL_COMPLETO);
                setMensajeAviso(`No se encontraron coincidencias exactas para "${searchQuery}". Mostrando productos disponibles:`);
            }
            setLoading(false);
        }, 300);
    };

    const handleSelectProduct = (item) => {
        setSelectedId(item.id);
        setTimeout(() => {
            setSelectedId(null);
            navigation.navigate('ShoppingList', { 
                itemsSeleccionados: [item],
                localidadUser: 'Paraná',
                provinciaUser: 'Entre Ríos'
            });
        }, 150);
    };

    const handleLogoutFlow = () => {
        navigation.navigate('Goodbye');
        setTimeout(logout, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ENCABEZADO SUPERIOR */}
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

            {/* FRANJA NEGRA CON TÍTULO EN MAYÚSCULAS AMARILLAS */}
            <View style={styles.bannerContainer}>
                <Text style={styles.bannerText}>RESULTADO DE BÚSQUEDA</Text>
            </View>

            <View style={styles.queryInfoBar}>
                <Text style={styles.queryText}>Buscando: "{searchQuery}"</Text>
            </View>

            {mensajeAviso && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{mensajeAviso}</Text>
                </View>
            )}

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#00E5FF" />
                        <Text style={styles.loadingText}>Buscando productos...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={productos}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        renderItem={({ item }) => {
                            const isSelected = selectedId === item.id;
                            return (
                                <TouchableOpacity 
                                    style={[styles.card, isSelected && styles.cardSelected]}
                                    onPress={() => handleSelectProduct(item)}
                                    activeOpacity={0.8}
                                >
                                    {item.imagen ? (
                                        <Image source={{ uri: item.imagen }} style={styles.productoImg} />
                                    ) : null}
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.nombreProd, isSelected && styles.nombreProdSelected]} numberOfLines={2}>{item.nombre}</Text>
                                        <Text style={styles.marcaProd}>Marca: {item.marca}</Text>
                                        <Text style={styles.precioProd}>Precio ref: ${item.precio}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={isSelected ? '#000' : '#00E5FF'} />
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>

            {/* PIE DE PÁGINA FIJO */}
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
                    <TouchableOpacity onPress={handleLogoutFlow} style={styles.footerButton}>
                        <Image 
                            source={require('../../assets/salir.png')} 
                            style={styles.footerIcon} 
                            resizeMode="contain" 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0B0F19' 
    },
    topHeader: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#111827',
    },
    logo: {
        width: 44,
        height: 44,
    },
    appNameImage: {
        height: 28,
        width: 140,
        resizeMode: 'contain'
    },
    placeholderRight: {
        width: 44,
    },
    bannerContainer: {
        width: '100%',
        backgroundColor: '#000000',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    bannerText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    queryInfoBar: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        backgroundColor: '#111827', 
        borderBottomWidth: 1, 
        borderBottomColor: '#374151' 
    },
    queryText: { 
        color: '#00E5FF', 
        fontSize: 13, 
        fontWeight: '600' 
    },
    errorBanner: { 
        backgroundColor: 'rgba(255, 215, 0, 0.15)', 
        padding: 8, 
        marginHorizontal: 16, 
        marginTop: 8, 
        borderRadius: 6, 
        borderWidth: 1, 
        borderColor: '#FFD700' 
    },
    errorBannerText: { 
        color: '#FFD700', 
        fontSize: 11, 
        textAlign: 'center' 
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 12,
    },
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        color: '#9CA3AF', 
        marginTop: 10, 
        fontSize: 13 
    },
    listContainer: { 
        paddingVertical: 10 
    },
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#1F2937', 
        borderRadius: 12, 
        padding: 12, 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: '#374151',
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        gap: 12
    },
    cardSelected: {
        backgroundColor: '#00E5FF',
        borderColor: '#FFFFFF',
    },
    productoImg: { 
        width: 50, 
        height: 50, 
        borderRadius: 8, 
        backgroundColor: '#111827', 
        resizeMode: 'cover' 
    },
    cardInfo: { 
        flex: 1 
    },
    nombreProd: { 
        color: '#E5E7EB', 
        fontSize: 13, 
        fontWeight: 'bold', 
        marginBottom: 2 
    },
    nombreProdSelected: {
        color: '#000000'
    },
    marcaProd: { 
        color: '#9CA3AF', 
        fontSize: 11, 
        marginBottom: 2 
    },
    precioProd: { 
        color: '#34D399', 
        fontSize: 12, 
        fontWeight: '600' 
    },
    footerContainer: {
        width: '100%',
        backgroundColor: '#111827',
        paddingBottom: 12,
    },
    goldLine: {
        width: '100%',
        height: 1.5,
        backgroundColor: '#D4AF37',
        marginBottom: 10,
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
    },
    footerButton: {
        padding: 4,
    },
    footerIcon: {
        width: 36,
        height: 36,
        tintColor: '#00E5FF',
    },
});