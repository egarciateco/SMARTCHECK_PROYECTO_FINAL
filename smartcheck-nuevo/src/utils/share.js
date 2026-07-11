import { Audio } from 'expo-av';

// Variables de control global blindadas
let beepSoundInstance = null;
let isSoundLoaded = false;
let assetsSource = null;

// Intentamos resolver la ruta del asset de forma segura.
// Si falla,assetsSource quedará null, y las funciones de carga lo ignorarán.
try {
  // Asegúrate de que el archivo exista exactamente en esta ruta y en minúsculas
  assetsSource = require('../assets/beepscanner.mp3');
} catch (error) {
  try {
    // Probamos la ruta relativa alternativa si la primera falla
    assetsSource = require('../../assets/beepscanner.mp3');
  } catch (err) {
    // Si ambas fallan, registramos el error en la consola pero NO rompemos la app.
    console.warn("⚠️ Advertencia: No se pudo resolver la ruta física de beepscanner.mp3. El sonido de escaneo no funcionará.");
  }
}

/**
 * Función encargada de inicializar el sonido de forma única y segura.
 */
export const loadBeepSound = async () => {
  // Si ya está cargado o el recurso no existe, salimos inmediatamente sin hacer nada.
  if (isSoundLoaded || !assetsSource) {
    return beepSoundInstance; // Puede ser null
  }

  try {
    console.log("🔊 Intentando cargar sonido beepscanner.mp3...");
    const { sound } = await Audio.Sound.createAsync(assetsSource);
    beepSoundInstance = sound;
    isSoundLoaded = true;
    
    // Este log ahora está protegido y solo aparecerá una única vez.
    console.log('✅ Sonido beepscanner cargado correctamente');
    
    return beepSoundInstance;
  } catch (audioError) {
    console.error("❌ Error crítico al inicializar el objeto de audio de Expo:", audioError);
    // Marcamos como no cargado para que se pueda reintentar, pero no rompemos la app.
    isSoundLoaded = false;
    return null;
  }
};

/**
 * Ejecuta la reproducción del sonido beep de manera optimizada.
 */
export const playBeep = async () => {
  try {
    // Nos aseguramos de que esté inicializado antes de reproducir.
    // Si loadBeepSound falla internamente, retornará null y playBeep no hará nada.
    const sound = await loadBeepSound();
    if (sound) {
      await sound.replayAsync();
    }
  } catch (error) {
    console.error("❌ Error al reproducir el sonido de escaneo:", error);
  }
};

/**
 * Libera el archivo de sonido de la memoria RAM del dispositivo móvil.
 * Nombre requerido por tu AppNavigator para evitar el crash de inicio.
 * Esta función está blindada para no fallar si el sonido no se cargó.
 */
export const unloadSounds = async () => {
  if (beepSoundInstance) {
    try {
      console.log("🔈 Intentando liberar sonidos de la memoria...");
      await beepSoundInstance.unloadAsync();
      beepSoundInstance = null;
      isSoundLoaded = false;
      console.log('✅ Sonidos liberados de la memoria RAM.');
    } catch (error) {
      console.error("❌ Error al liberar los recursos de audio:", error);
    }
  } else {
    // Si no había instancia de sonido, no hacemos nada y apagamos la bandera.
    isSoundLoaded = false;
  }
};

// Clonamos el export usando un alias para dar compatibilidad total a cualquier pantalla vieja.
// Esto soluciona el error TypeError: _share.unloadSounds is not a function.
export const unloadBeepSound = unloadSounds;