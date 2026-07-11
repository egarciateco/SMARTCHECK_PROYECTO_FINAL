import React, { useLayoutEffect, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleExitProfile = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir de tu perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", onPress: () => navigation.navigate('Goodbye') }
      ]
    );
  };

  // Mapeo flexible para datos del usuario
  const emailFinal = user?.email || user?.correo || 'No registrado';
  const fechaFinal = user?.fechaNacimiento || user?.fecha_nacimiento || user?.fechaNac || 'No registrada';
  const edadFinal = user?.edad || user?.age || 'No registrada';
  const sexoFinal = user?.sexo || user?.genero || user?.gender || 'No registrado';
  const provinciaFinal = user?.provincia || user?.province || 'No registrada';
  const localidadFinal = user?.localidad || user?.city || 'No registrada';

  // Lógica de iconos 3D
  const getSexoAsset = (sexo) => {
    const s = String(sexo).toLowerCase().trim();
    if (s.startsWith('m') || s === 'masculino' || s === 'male') return require('../../assets/sexmascu.png');
    if (s.startsWith('f') || s === 'femenino' || s === 'female') return require('../../assets/sexfeme.png');
    return require('../../assets/sexindef.png');
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.appHeaderZone}>
        <Image source={require('../../assets/logo.png')} style={styles.logoTopImage} />
        <Image source={require('../../assets/nombreapp.png')} style={styles.appNameTopImage} />
        <View style={styles.blackSectionStrip}>
          <Text style={styles.yellowStripTitleText}>MI PERFIL</Text>
        </View>
      </View>

      {/* CUERPO CENTRAL */}
      <View style={styles.middleSection}>
        <View style={styles.goldenContainer}>
          <View style={styles.avatarPhotoFrame}>
            {user?.foto ? (
              <Image source={{ uri: user.foto }} style={styles.avatarUserImage} />
            ) : (
              <View style={[styles.avatarUserImage, styles.avatarFallbackBackground]}>
                <Text style={styles.avatarFallbackText}>SIN FOTO</Text>
              </View>
            )}
          </View>

          <Text style={styles.userNameHeader}>{user?.nombre ? `${user.nombre} ${user?.apellido || ''}`.trim() : 'Usuario'}</Text>

          {/* DATOS */}
          <View style={styles.dataRow}>
            <Image source={require('../../assets/email.png')} style={styles.giantAssetIcon} />
            <Text style={styles.dataFieldValueText} numberOfLines={1}>{emailFinal}</Text>
          </View>

          <View style={styles.dataRow}>
            <Image source={require('../../assets/fechanac.png')} style={styles.giantAssetIcon} />
            <Text style={styles.dataFieldValueText}>{fechaFinal}</Text>
          </View>

          <View style={styles.combinedDataRow}>
            <View style={styles.halfDataBlock}>
              <Image source={require('../../assets/edad.png')} style={styles.giantAssetIcon} />
              <Text style={styles.dataFieldValueText}>{edadFinal} años</Text>
            </View>
            <View style={styles.halfDataBlock}>
              <Image source={getSexoAsset(sexoFinal)} style={styles.sexAssetIcon} />
              <Text style={styles.dataFieldValueText}>{sexoFinal}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Image source={require('../../assets/provincia.png')} style={styles.giantAssetIcon} />
            <Text style={styles.dataFieldValueText}>{provinciaFinal}</Text>
          </View>

          <View style={styles.dataRow}>
            <Image source={require('../../assets/localidad.png')} style={styles.giantAssetIcon} />
            <Text style={styles.dataFieldValueText}>{localidadFinal}</Text>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footerNavigationRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.6}>
          <Image source={require('../../assets/volver.png')} style={styles.footerImageButton} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExitProfile} activeOpacity={0.6}>
          <Image source={require('../../assets/salir.png')} style={styles.footerImageButton} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f3f', paddingTop: Platform.OS === 'ios' ? 40 : 10, justifyContent: 'space-between', paddingBottom: 20 },
  appHeaderZone: { alignItems: 'center', width: '100%' },
  logoTopImage: { width: 75, height: 75, resizeMode: 'contain' },
  appNameTopImage: { width: 140, height: 32, resizeMode: 'contain', marginTop: 6 },
  blackSectionStrip: { backgroundColor: '#000', width: '100%', paddingVertical: 6, marginTop: 6 },
  yellowStripTitleText: { color: '#ffcc00', textAlign: 'center', fontWeight: 'bold', fontSize: 15, letterSpacing: 1.5 },
  middleSection: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, marginVertical: 4 },
  goldenContainer: { width: '100%', borderWidth: 1, borderColor: '#ffcc00', borderRadius: 14, backgroundColor: '#003366', paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  avatarPhotoFrame: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#00ffcc', overflow: 'hidden', marginBottom: 4, backgroundColor: '#001f3f' },
  avatarUserImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarFallbackBackground: { justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  userNameHeader: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2, width: '100%' },
  combinedDataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 2, width: '100%' },
  halfDataBlock: { flexDirection: 'row', alignItems: 'center', flex: 0.49 },
  giantAssetIcon: { width: 60, height: 60, resizeMode: 'contain', marginRight: 8 },
  sexAssetIcon: { width: 54, height: 54, resizeMode: 'contain', marginRight: 14 },
  dataFieldValueText: { color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1 },
  footerNavigationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, width: '100%' },
  footerImageButton: { width: 44, height: 44, resizeMode: 'contain' }
});