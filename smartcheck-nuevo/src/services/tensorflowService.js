import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

let model = null;

// 1. Inicialización del backend
export const initializeTensorFlow = async () => {
  try {
    await tf.ready();
    console.log("✅ TensorFlow.js inicializado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error al inicializar TensorFlow:", error);
    return false;
  }
};

// 2. Carga del modelo (se ejecuta solo una vez)
export const loadModel = async () => {
  if (model) return model;
  try {
    // IMPORTANTE: Asegúrate de tener tu modelo (model.json y pesos) en tus assets
    // Ajusta las rutas según donde tengas guardado tu modelo
    model = await tf.loadGraphModel(bundleResourceIO(
      require('../../assets/model/model.json'), 
      require('../../assets/model/group1-shard1.bin')
    ));
    console.log("✅ Modelo cargado exitosamente");
    return model;
  } catch (error) {
    console.error("❌ Error al cargar el modelo:", error);
    return null;
  }
};

// 3. Conversión de Imagen a Tensor (Pre-procesamiento)
export const imageToTensor = (rawImageData) => {
  // rawImageData es el buffer de píxeles que viene de la cámara
  return tf.tidy(() => {
    // 1. Convertir a tensor 3D
    const imgTensor = tf.browser.fromPixels(rawImageData);
    
    // 2. Redimensionar a lo que tu modelo espera (ej: 224x224)
    const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
    
    // 3. Normalizar (típicamente entre -1 y 1 o 0 y 1)
    const normalized = resized.div(255.0).expandDims(0);
    
    return normalized;
  });
};

// 4. Limpieza (Fundamental para evitar fugas de memoria)
export const disposeModel = () => {
  if (model) {
    model.dispose();
    model = null;
    console.log("🗑️ Modelo liberado de memoria");
  }
};