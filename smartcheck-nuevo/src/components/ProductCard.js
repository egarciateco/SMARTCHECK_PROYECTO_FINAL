// ============================================================================
// ProductCard Component
// Muestra una tarjeta de producto con imagen, nombre, precio y acciones
// ============================================================================

import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Platform 
} from 'react-native';

const ProductCard = ({ 
  product = {}, 
  onPress, 
  onShare,
  style 
}) => {
  // ✅ Extraer datos con valores por defecto (para evitar errores si faltan)
  const {
    id,
    name = 'Producto sin nombre',
    price = 0,
    originalPrice,
    discount = 0,
    image = 'https://via.placeholder.com/150/cccccc/666666?text=Sin+Imagen',
    supermarket = '',
    category = '',
    inStock = true,
  } = product || {};

  // ✅ Formatear precio en pesos argentinos
  const formatPrice = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ✅ Calcular precio con descuento
  const discountedPrice = discount > 0 
    ? price * (1 - discount / 100) 
    : price;

  return (
    <TouchableOpacity 
      style={[styles.card, !inStock && styles.outOfStock, style]} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!inStock}
    >
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: image }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Badge de descuento */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        
        {/* Badge de sin stock */}
        {!inStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.infoContainer}>
        {/* Nombre del producto (máximo 2 líneas) */}
        <Text 
          style={styles.name} 
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {name}
        </Text>

        {/* Supermercado y categoría */}
        {(supermarket || category) && (
          <View style={styles.metaContainer}>
            {supermarket && (
              <Text style={styles.supermarket}>{supermarket}</Text>
            )}
            {category && supermarket && (
              <Text style={styles.separator}>•</Text>
            )}
            {category && (
              <Text style={styles.category}>{category}</Text>
            )}
          </View>
        )}

        {/* Precios */}
        <View style={styles.priceContainer}>
          {discount > 0 && originalPrice && (
            <Text style={styles.originalPrice}>
              {formatPrice(originalPrice)}
            </Text>
          )}
          <Text style={styles.price}>
            {formatPrice(discountedPrice)}
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={(e) => {
              e.stopPropagation();
              onShare?.(product);
            }}
          >
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={(e) => {
              e.stopPropagation();
              onPress?.(product);
            }}
          >
            <Text style={styles.detailsButtonText}>Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  outOfStock: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 10,
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#001f3f',
    marginBottom: 4,
    lineHeight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  supermarket: {
    fontSize: 11,
    color: '#666',
  },
  separator: {
    fontSize: 11,
    color: '#ccc',
    marginHorizontal: 4,
  },
  category: {
    fontSize: 11,
    color: '#007bff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f3f4',
  },
  shareButtonText: {
    fontSize: 14,
  },
  detailsButton: {
    backgroundColor: '#001f3f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProductCard;