import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function ProfileAvatar({ user, size = 60 }) {
  // MIRA ESTO EN TU TERMINAL: Si esto dice 'undefined', el problema está en tu AuthContext
  console.log("DEBUG AVATAR - Usuario recibido:", user);
  
  // Lista de posibles campos donde podría venir la foto
  const photoUri = user?.foto || user?.image || user?.photoURL || user?.photo || user?.avatar || user?.urlFoto;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {photoUri ? (
        <Image 
          source={{ uri: photoUri }} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
      ) : (
        <View style={styles.initialsContainer}>
          <Text style={[styles.initialsText, { fontSize: size * 0.4 }]}>
            {(user?.nombre?.[0] || 'U') + (user?.apellido?.[0] || '')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 2, borderColor: '#FFD700', backgroundColor: '#002a54', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  initialsContainer: { justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: '#FFD700', fontWeight: 'bold' },
});