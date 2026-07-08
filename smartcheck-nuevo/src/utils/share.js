// src/utils/share.js
import { Audio } from 'expo-av';

const sounds = {};

// EXPORTACIÓN NOMBRADA
export const loadSounds = async () => {
  try {
    // Corregimos la ruta apuntando directamente a tu archivo real
    const { sound: beepSound } = await Audio.Sound.createAsync(
      require('../../assets/beepscanner.wav')
    );
    
    // Asignamos el sonido a las etiquetas que tu App.js va a solicitar
    sounds.beep = beepSound;
    sounds.success = beepSound;  // Suena al iniciar sesión con éxito
    sounds.logout = beepSound;   // Suena al cerrar sesión
    
    console.log('✅ Sonido beepscanner cargado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error cargando beepscanner:', error);
    return false;
  }
};

export const playSound = async (name) => {
  try {
    if (sounds[name]) {
      // ReplayAsync detiene el audio si se estaba ejecutando y lo vuelve a reproducir desde cero
      await sounds[name].replayAsync();
    } else {
      console.warn(`⚠️ Intento de reproducir un sonido no registrado: ${name}`);
    }
  } catch (error) {
    console.error(`Error reproduciendo ${name}:`, error);
  }
};

export const unloadSounds = async () => {
  try {
    for (const name in sounds) {
      if (sounds[name]) {
        await sounds[name].unloadAsync();
      }
    }
    console.log('🔈 Sonidos liberados de la memoria');
  } catch (error) {
    console.error('Error descargando sonidos:', error);
  }
};