import { Audio } from 'expo-av';

let beepSoundInstance = null;

export const loadBeepSound = async () => {
  if (beepSoundInstance) return beepSoundInstance;
  
  try {
    const { sound } = await Audio.Sound.createAsync(require('../../assets/beepscanner.mp3'));
    beepSoundInstance = sound;
    return beepSoundInstance;
  } catch (e) {
    console.error("Error al cargar sonido de escáner:", e);
    return null; 
  }
};

export const playBeep = async () => {
  try {
    if (!beepSoundInstance) {
      await loadBeepSound();
    }
    if (beepSoundInstance) {
      const status = await beepSoundInstance.getStatusAsync();
      if (status.isLoaded) {
        await beepSoundInstance.replayAsync();
      }
    }
  } catch (e) { 
    console.error("Error al reproducir beep:", e); 
  }
};

// FUNCIÓN DE ÉXITO BLINDADA CONTRA CRASHES
export const playExitoSound = async () => {
  try {
    // Verificamos de forma segura la carga del archivo
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/exito.mp3'),
      { shouldPlay: true } // Le decimos que se reproduzca solo al terminar de cargar
    );
    
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        try {
          await sound.unloadAsync();
        } catch (unloadError) {
          // Ignoramos errores menores de descarga
        }
      }
    });
  } catch (e) {
    // Si falla el audio, la app NO se detiene ni se congela, solo imprime la advertencia
    console.warn("Aviso: No se pudo reproducir exito.mp3 en este momento.", e.message);
  }
};

export const unloadSounds = async () => {
  if (beepSoundInstance) {
    try {
      await beepSoundInstance.unloadAsync();
      beepSoundInstance = null;
    } catch (e) { console.error("Error al descargar sonido:", e); }
  }
};