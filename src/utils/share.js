import { Audio } from 'expo-av';

let beepSoundInstance = null;
let isSoundLoaded = false;
let assetsSource = require('../../assets/beepscanner.mp3');

export const loadBeepSound = async () => {
  if (isSoundLoaded) return beepSoundInstance;
  try {
    const { sound } = await Audio.Sound.createAsync(assetsSource);
    beepSoundInstance = sound;
    isSoundLoaded = true;
    return beepSoundInstance;
  } catch (e) {
    return null;
  }
};

export const playBeep = async () => {
  try {
    const sound = await loadBeepSound();
    if (sound) await sound.replayAsync();
  } catch (e) { }
};

export const unloadSounds = async () => {
  if (beepSoundInstance) {
    try {
      await beepSoundInstance.unloadAsync().catch(() => {});
      beepSoundInstance = null;
      isSoundLoaded = false;
    } catch (e) { }
  }
};