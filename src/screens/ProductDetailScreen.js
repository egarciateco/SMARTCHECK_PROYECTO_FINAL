import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, SafeAreaView } from 'react-native';

export default function ProductDetailScreen({ route }) {
    // Recibimos el producto y las comparaciones desde los parámetros de navegación o estado
    const { producto } = route.params || {};
    const comparisons = producto?.comparisons || [];

    const renderItem = ({ item, index }) => {
        // El primer elemento (index 0) es el más barato porque el backend ya los ordenó
        const esElMasBarato = index === 0;

        return (
            <View style={[styles.card, esElMasBarato && styles.cardMasBarato]}>
                {/* Etiqueta destacada para el más económico */}
                {esElMasBarato && (
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>🔥 ¡El más barato!</Text>
                    </View>
                )}

                <View style={styles.cardContent}>
                    {/* Logo o indicador del supermercado */}
                    {item.logo ? (
                        <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={[styles.colorIndicator, { backgroundColor: item.color || '#ccc' }]} />
                    )}

                    <View style={styles.infoContainer}>
                        <Text style={styles.supermarketName}>{item.supermarket}</Text>
                        <Text style={[styles.priceText, esElMasBarato && styles.priceTextBarato]}>
                            ${item.price}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Cabecera del Producto */}
            {producto && (
                <View style={styles.productHeader}>
                    <Image source={{ uri: producto.image }} style={styles.productImage} resizeMode="contain" />
                    <Text style={styles.productName}>{producto.name}</Text>
                    <Text style={styles.productBrand}>Marca: {producto.brand || 'Genérica'}</Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Comparativa en supermercados cercanos:</Text>

            {/* Lista de Comparaciones */}
            <FlatList
                data={comparisons}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay datos de precios disponibles para la zona.</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 16,
    },
    productHeader: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 16,
    },
    productImage: {
        width: 100,
        height: 100,
        marginBottom: 8,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    productBrand: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginBottom: 12,
    },
    listContainer: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee',
    },
    // Estilo especial para resaltar la tarjeta del producto más económico
    cardMasBarato: {
        borderColor: '#28a745',
        borderWidth: 2,
        backgroundColor: '#f4fff6',
    },
    badgeContainer: {
        backgroundColor: '#28a745',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        width: 60,
        height: 30,
        marginRight: 12,
    },
    colorIndicator: {
        width: 12,
        height: 40,
        borderRadius: 6,
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    supermarketName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    priceTextBarato: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
});