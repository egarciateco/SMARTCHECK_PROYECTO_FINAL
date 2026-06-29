// src/utils/share.js
import { Audio } from 'expo-av';

const sounds = {};

// ✅ EXPORTACIÓN NOMBRADA (no default)
export const loadSounds = async () => {
  try {
    const { sound: beep } = await Audio.Sound.createAsync(
      require('../../assets/sounds/beep.wav')
    );
    sounds.beep = beep;
    console.log('✅ Sonido beep cargado');
    return true;
  } catch (error) {
    console.error('❌ Error cargando beep:', error);
    return false;
  }
};

export const playSound = async (name) => {
  try {
    if (sounds[name]) {
      await sounds[name].replayAsync();
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
  } catch (error) {
    console.error('Error descargando sonidos:', error);
  }
};