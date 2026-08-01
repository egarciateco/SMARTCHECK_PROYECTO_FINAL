import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailScreen({ route, navigation }) {
  // Accedemos a product de forma segura
  const product = route?.params?.product;
  const { logout } = useAuth();

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(() => {
      logout();
    }, 1000);
  };

  // Pantalla de error para manejar navegación sin datos
  if (!product) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <Text style={styles.text}>Información no disponible.</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Volver atrás</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        
        {product.comparisons?.length > 0 ? (
          product.comparisons.map((c, i) => (
            <View key={i} style={styles.compCard}>
              <Text style={styles.marketText}>{c.supermarket || 'Supermercado'}</Text>
              <Text style={styles.priceText}>${c.price || 'N/A'}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.text, { textAlign: 'center', marginTop: 10 }]}>
            No hay comparativas disponibles.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerBtn}>
          <Image source={require('../../assets/volver.png')} style={styles.btnIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleLogoutFlow} style={styles.footerBtn}>
          <Image source={require('../../assets/salir.png')} style={styles.btnIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  containerCenter: { flex: 1, backgroundColor: '#001f3f', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', padding: 20 },
  logo: { width: 60, height: 60, resizeMode: 'contain', marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 20 },
  subTitle: { color: '#ffcc00', fontSize: 16, marginLeft: 20, marginTop: 20, marginBottom: 10, fontWeight: 'bold', letterSpacing: 1 },
  image: { width: '100%', height: 250, resizeMode: 'contain', backgroundColor: '#fff' },
  placeholderImage: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002a54' },
  textPlaceholder: { color: '#aaa', fontSize: 16 },
  compCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, marginHorizontal: 20, marginVertical: 6, backgroundColor: '#002a54', borderRadius: 12, borderWidth: 1, borderColor: '#004a91' },
  marketText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  priceText: { color: '#00ffcc', fontSize: 18, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 16 },
  btnText: { color: '#001f3f', fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#004a91' },
  footerBtn: { padding: 5 },
  btnIcon: { width: 50, height: 50, resizeMode: 'contain' },
  btnRetry: { marginTop: 20, padding: 12, backgroundColor: '#00ffcc', borderRadius: 8 }
});