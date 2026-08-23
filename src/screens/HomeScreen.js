import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Alert, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ProfileAvatar from '../components/ProfileAvatar';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogoutFlow = () => {
    navigation.navigate('Goodbye');
    setTimeout(logout, 1000);
  };

  const handleAdminPress = () => {
    navigation.navigate('AdminPanel');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.logoGrande} resizeMode="contain" />
          <Image source={require('../../assets/nombreapp.png')} style={styles.nombreAppGrande} resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')} activeOpacity={0.7}>
          <ProfileAvatar user={user} size={58} />
        </TouchableOpacity>
      </View>

      {/* TÍTULO CON LÍNEA DORADA ARRIBA Y ABAJO */}
      <View style={styles.franjaNegra}>
        <Text style={styles.tituloFranja}>PANEL PRINCIPAL</Text>
      </View>

      {/* CONTENEDOR PRINCIPAL */}
      <View style={styles.menuContainer}>
        
        {/* Armar Chango */}
        <TouchableOpacity style={styles.btnFull} onPress={() => navigation.navigate('SelectorInteligente')} activeOpacity={0.7}>
          <Image source={require('../../assets/btnarmatuchango.png')} style={styles.btnImg} resizeMode="contain" />
          <View style={styles.textContainer}>
            <Text style={styles.btnTitle}>ARMÁ TU CHANGO</Text>
            <Text style={styles.btnDesc}>Verificá cuánto ahorrarías en tu compra.</Text>
          </View>
        </TouchableOpacity>

        {/* Búsqueda y Escáner */}
        <View style={styles.rowWrapper}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('ProductSearch')} activeOpacity={0.7}>
            <Image source={require('../../assets/btnbuscamanual.png')} style={styles.btnImgSmall} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.btnTitle}>BÚSQUEDA</Text>
              <Text style={styles.btnDesc}>Por nombre o marca.</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('Scanner')} activeOpacity={0.7}>
            <Image source={require('../../assets/btnescaner.png')} style={styles.btnImgSmall} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.btnTitle}>ESCÁNER</Text>
              <Text style={styles.btnDesc}>Código de barras.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Historial y Supermercados */}
        <View style={styles.rowWrapper}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('HistorialScreen')} activeOpacity={0.7}>
            <Image source={require('../../assets/btnhistochan.png')} style={styles.btnImgSmall} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.btnTitle}>HISTORIAL</Text>
              <Text style={styles.btnDesc}>Listas guardadas.</Text>
            </View>
          </TouchableOpacity>
          
          {/* Ubicación (Supermercados) */}
          <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('SupermercadosCerca')} activeOpacity={0.7}>
            <Image source={require('../../assets/btnsuper+cerca.png')} style={styles.btnImgSmall} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.btnTitle}>UBICACIÓN</Text>
              <Text style={styles.btnDesc}>Comercios cercanos.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Perfil y Admin */}
        <View style={styles.rowWrapper}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => navigation.navigate('Perfil')} activeOpacity={0.7}>
            <Image source={require('../../assets/btnperfil.png')} style={styles.btnImgSmall} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.btnTitle}>MI PERFIL</Text>
              <Text style={styles.btnDesc}>Datos personales.</Text>
            </View>
          </TouchableOpacity>
          
          {/* Botón Admin */}
          <TouchableOpacity style={[styles.smallBtn, styles.adminBtnVioleta]} onPress={handleAdminPress} activeOpacity={0.7}>
            <Image source={require('../../assets/btnadminist.png')} style={styles.btnImgCentered} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.lineaDorada} />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exitButton} onPress={handleLogoutFlow} activeOpacity={0.7}>
          <Image source={require('../../assets/salir.png')} style={styles.exitIcon} resizeMode="contain" />
          <Text style={styles.exitText}>SALIR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center', backgroundColor: '#000' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoGrande: { width: 70, height: 70, marginRight: 12 },
  nombreAppGrande: { width: 175, height: 46 },
  
  franjaNegra: { backgroundColor: '#000', paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ffcc00' },
  tituloFranja: { color: '#ffcc00', fontWeight: 'bold', fontSize: 16, letterSpacing: 1.2 },
  
  menuContainer: { flex: 1, paddingHorizontal: 12, justifyContent: 'space-evenly', paddingVertical: 4 },
  
  btnFull: { flexDirection: 'row', backgroundColor: '#000', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8, padding: 8, alignItems: 'center', height: 84 },
  smallBtn: { flexDirection: 'row', backgroundColor: '#000', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 8, padding: 8, alignItems: 'center', flex: 1, height: 74 },
  
  adminBtnVioleta: { backgroundColor: 'transparent', borderColor: '#8A2BE2', justifyContent: 'center', alignItems: 'center' },
  
  btnImg: { width: 62, height: '100%', marginRight: 10 },
  btnImgSmall: { width: 48, height: '100%', marginRight: 8 },
  btnImgCentered: { width: 50, height: '100%' },
  
  textContainer: { flex: 1, justifyContent: 'center' },
  btnTitle: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  btnDesc: { color: '#DDD', fontSize: 9, marginTop: 2 },
  
  rowWrapper: { flexDirection: 'row', gap: 10 },

  lineaDorada: { height: 1.5, backgroundColor: '#ffcc00', width: '100%' },

  footer: { paddingVertical: 12, backgroundColor: '#000', alignItems: 'center' },
  exitButton: { flexDirection: 'row', backgroundColor: '#000', borderWidth: 1, borderColor: '#FF5555', paddingVertical: 6, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center' },
  exitIcon: { width: 28, height: 28, marginRight: 10, tintColor: '#00E5FF' },
  exitText: { color: '#FF5555', fontSize: 14, fontWeight: 'bold' }
});