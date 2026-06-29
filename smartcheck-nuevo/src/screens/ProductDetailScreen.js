import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';

export default function ProductDetailScreen({ route, navigation }) {
  // Obtenemos el producto de forma segura
  const { product } = route?.params || {};

  // Validacion: Si no hay producto, mostramos un aviso amable
  if (!product) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.text}>No se pudo cargar la información del producto.</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{product.name || 'Producto sin nombre'}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {product.imagen ? (
          <Image source={{ uri: product.imagen }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.textPlaceholder}>Sin imagen disponible</Text>
          </View>
        )}
        
        <Text style={styles.subTitle}>COMPARATIVA DE PRECIOS:</Text>
        
        {/* Validamos que comparisons exista y tenga datos */}
        {product.comparisons && product.comparisons.length > 0 ? (
          product.comparisons.map((c, i) => (
            <View key={i} style={styles.compCard}>
              <Text style={styles.marketText}>{c.supermarket || 'Supermercado'}</Text>
              <Text style={styles.priceText}>${c.price || 'N/A'}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.text, { textAlign: 'center', marginTop: 10 }]}>No hay comparativas disponibles.</Text>
        )}
      </ScrollView>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerBtn}>
        <Image source={require('../../assets/volver.png')} style={styles.btnIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  containerCenter: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', padding: 20, marginTop: 20 },
  logo: { width: 60, height: 60, resizeMode: 'contain', marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subTitle: { color: '#ffcc00', fontSize: 16, marginLeft: 20, marginTop: 20, marginBottom: 10, fontWeight: 'bold', letterSpacing: 1 },
  image: { width: '100%', height: 250, resizeMode: 'contain', backgroundColor: '#fff' },
  placeholderImage: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002a54' },
  textPlaceholder: { color: '#aaa', fontSize: 16 },
  compCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, marginHorizontal: 20, marginVertical: 6, backgroundColor: '#002a54', borderRadius: 12, borderWidth: 1, borderColor: '#004a91' },
  marketText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  priceText: { color: '#00ffcc', fontSize: 18, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 16 },
  btnText: { color: '#001f3f', fontWeight: 'bold' },
  footerBtn: { marginBottom: 30 },
  btnIcon: { width: 50, height: 50, alignSelf: 'center', resizeMode: 'contain' },
  btnRetry: { marginTop: 20, padding: 12, backgroundColor: '#00ffcc', borderRadius: 8 }
});