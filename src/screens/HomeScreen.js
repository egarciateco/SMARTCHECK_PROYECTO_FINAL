import React, { useEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, ScrollView, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // DIAGNÓSTICO: Imprime en la consola la estructura real del usuario al cargar
  useEffect(() => {
    console.log(">>> ESTRUCTURA DEL USUARIO EN HOMESCREEN:", JSON.stringify(user, null, 2));
  }, [user]);

  // Generar iniciales si el usuario no tiene foto
  const getInitials = () => {
    const n = user?.nombre ? user.nombre.charAt(0) : '';
    const a = user?.apellido ? user.apellido.charAt(0) : '';
    return (n + a).toUpperCase() || 'U';
  };

  // Resuelve la foto probando todos los posibles nombres de campo y formatos
  const resolveUserPhoto = () => {
    if (!user) return null;

    // Buscar en cualquier campo donde el backend pueda haber guardado la foto
    const rawPhoto = 
      user.foto || 
      user.fotoUrl || 
      user.foto_url || 
      user.fotoPerfil || 
      user.imageUrl || 
      user.imagenUrl || 
      user.imagen || 
      user.avatar || 
      user.image || 
      user.photo || 
      user.rostro || 
      user.faceUrl || 
      user.path;

    if (!rawPhoto) return null;

    if (typeof rawPhoto === 'string') {
      // 1. Si es URL completa (http/https) o Base64 con encabezado
      if (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:image')) {
        return rawPhoto;
      }

      // 2. Si es un Base64 puro sin el prefijo "data:image..."
      if (rawPhoto.length > 200 && !rawPhoto.includes('/') && !rawPhoto.includes('.')) {
        return `data:image/jpeg;base64,${rawPhoto}`;
      }

      // 3. Si es una ruta relativa del servidor (e.g. "uploads/facial_123.jpg")
      let cleanPath = rawPhoto.replace(/\\/g, '/'); // Normaliza barras de Windows
      if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
      }

      return `https://smartcheck-proyecto-final.onrender.com${cleanPath}`;
    }

    return rawPhoto.uri || null;
  };

  const userPhoto = resolveUserPhoto();

  // Botón Volver: Regresa a Login y borra la pila de navegación
  const handleVolver = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  // Botón Salir: Cierra por completo la aplicación
  const handleSalir = async () => {
    await logout();
    BackHandler.exitApp();
  };

  return (
    <View style={styles.container}>
      {/* CABECERA */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.logoMini} />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreApp} />
        </View>

        {/* FOTO O INICIALES ARRIBA A LA DERECHA */}
        <View style={styles.avatarContainer}>
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* FRANJA NEGRA CON SALUDO */}
      <View style={styles.blackBanner}>
        <Text style={styles.bannerText}>
          {user?.nombre ? `¡BIENVENID@, ${user.nombre.toUpperCase()}!` : '¡BIENVENID@!'}
        </Text>
      </View>
      <View style={styles.titleGoldLine} />

      {/* MENÚ PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.goldenFrame}>
          <Text style={styles.welcomeSubtitle}>Seleccione una opción</Text>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.navigate('Busqueda')}
          >
            <Text style={styles.menuButtonText}>🔍 Buscar Productos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.menuButtonText}>📷 Escáner de Código</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={styles.menuButtonText}>👤 Mi Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButtonAdmin} 
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <Text style={styles.menuButtonText}>⚙️ Panel de Administración</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOOTER FIJO ABAJO */}
      <View style={styles.footerFixed}>
        <View style={styles.goldLine} />
        <View style={styles.footerButtonsRow}>
          <TouchableOpacity onPress={handleVolver} style={styles.footerButton}>
            <Image source={require('../../assets/volver.png')} style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSalir} style={styles.footerButton}>
            <Image source={require('../../assets/salir.png')} style={styles.footerIcon} />
            <Text style={styles.footerButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', paddingTop: 20 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingBottom: 10 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoMini: { width: 45, height: 45, resizeMode: 'contain', marginRight: 10 },
  nombreApp: { width: 180, height: 45, resizeMode: 'contain' },
  
  avatarContainer: { marginLeft: 10 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFD700', resizeMode: 'cover' },
  initialsCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#003366', borderWidth: 2, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },

  blackBanner: { width: '100%', backgroundColor: '#000000', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  bannerText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  titleGoldLine: { height: 1, backgroundColor: '#FFD700', width: '100%', marginBottom: 15 },
  
  scrollContainer: { paddingBottom: 100, paddingHorizontal: 20 },
  goldenFrame: { borderWidth: 1, borderColor: '#FFD700', borderRadius: 15, padding: 20, backgroundColor: '#001f3f', alignItems: 'center' },
  
  welcomeSubtitle: { color: '#fff', fontSize: 16, marginBottom: 20, fontWeight: '600' },
  
  menuButton: { width: '100%', backgroundColor: '#003366', borderWidth: 1, borderColor: '#00ffff', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  menuButtonAdmin: { width: '100%', backgroundColor: '#331a00', borderWidth: 1, borderColor: '#FFD700', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  menuButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  footerFixed: { position: 'absolute', bottom: 10, left: 20, right: 20, paddingBottom: 10 },
  goldLine: { height: 1, backgroundColor: '#FFD700', marginBottom: 10 },
  footerButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  footerButton: { alignItems: 'center', justifyContent: 'center' },
  footerIcon: { width: 40, height: 40, resizeMode: 'contain', tintColor: '#00BFFF' },
  footerButtonText: { color: '#00BFFF', fontSize: 11, marginTop: 4, fontWeight: 'bold' }
});