import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// 1. IMPORTANTE: Asegúrate de que los archivos en tu carpeta 'models' 
// tengan la extensión .bin y que el archivo manifest se llame 'model.json'
const modelJson = require('../../assets/models/model.json');

const modelWeights = [
  require('../../assets/models/face_recognition_model-shard1.bin'),
  require('../../assets/models/face_recognition_model-shard2.bin')
];

export let model = null;

// 2. Inicialización del backend
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

// 3. Carga del modelo (se ejecuta solo una vez)
export const loadModel = async () => {
  if (model) return model;
  try {
    console.log("📂 Cargando modelo de reconocimiento facial...");

    // Cargamos el grafo usando el JSON y el array de pesos (.bin)
    model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
    
    console.log("✅ Modelo cargado exitosamente");
    return model;
  } catch (error) {
    console.error("❌ Error crítico al cargar el modelo:", error);
    return null;
  }
};

// 4. Conversión de Imagen a Tensor (Pre-procesamiento)
export const imageToTensor = (rawImageData) => {
  return tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(rawImageData);
    
    // Redimensionar a lo que tu modelo espera (224x224)
    const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
    
    // Normalizar
    const normalized = resized.div(255.0).expandDims(0);
    
    return normalized;
  });
};

// 5. Limpieza
export const disposeModel = () => {
  if (model) {
    model.dispose();
    model = null;
    console.log("🗑️ Modelo liberado de memoria");
  }
};