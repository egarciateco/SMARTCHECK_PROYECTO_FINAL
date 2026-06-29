import { Audio } from 'expo-av';

const sounds = {};

export const loadSounds = async () => {
  try {
    // Cargar sonido de beep
    const { sound: beepSound } = await Audio.Sound.createAsync(
      require('../assets/sounds/beep.wav')
    );
    sounds.beep = beepSound;
    
    // Cargar sonido de éxito
    const { sound: successSound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.wav')
    );
    sounds.success = successSound;
    
    console.log('✅ Sonidos cargados correctamente');
  } catch (error) {
    console.error('❌ Error cargando sonidos:', error);
    throw error;
  }
};

export const playSound = async (soundName) => {
  try {
    if (sounds[soundName]) {
      await sounds[soundName].replayAsync();
    }
  } catch (error) {
    console.error(`Error reproduciendo sonido ${soundName}:`, error);
  }
};

export const unloadSounds = async () => {
  try {
    for (const soundName in sounds) {
      if (sounds[soundName]) {
        await sounds[soundName].unloadAsync();
      }
    }
    console.log('🔇 Sonidos descargados');
  } catch (error) {
    console.error('Error descargando sonidos:', error);
  }
};