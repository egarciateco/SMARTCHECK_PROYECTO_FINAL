import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

export const initializeTensorFlow = async () => {
  try {
    // Esto asegura que el backend de WebGL (aceleración gráfica) esté listo
    await tf.ready();
    console.log("✅ TensorFlow.js inicializado correctamente en el dispositivo");
    return true;
  } catch (error) {
    console.error("❌ Error al inicializar TensorFlow:", error);
    return false;
  }
};