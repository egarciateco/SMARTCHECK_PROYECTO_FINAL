import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// 1. IMPORTACIONES DE ASSETS
const modelJson = require('../../assets/models/model.json');
const modelWeights1 = require('../../assets/models/face_recognition_model-shard1.bin');
const modelWeights2 = require('../../assets/models/face_recognition_model-shard2.bin');

export let model = null;

// 2. Inicialización
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

// 3. Carga del modelo (Ajustado para LayersModel)
export const loadModel = async () => {
  if (model) return model;
  
  try {
    console.log("📂 Cargando modelo de reconocimiento facial...");

    // DEBUG: Comprobamos si las importaciones son válidas
    if (!modelJson || !modelWeights1 || !modelWeights2) {
      throw new Error(`Importaciones fallidas: JSON=${!!modelJson}, W1=${!!modelWeights1}, W2=${!!modelWeights2}`);
    }

    // CAMBIO CLAVE: Usamos loadLayersModel en lugar de loadGraphModel
    model = await tf.loadLayersModel(bundleResourceIO(modelJson, [modelWeights1, modelWeights2]));
    
    console.log("✅ Modelo cargado exitosamente");
    return model;
  } catch (error) {
    console.error("❌ ERROR CRÍTICO al cargar el modelo:", error.message);
    return null;
  }
};

// 4. Conversión de Imagen a Tensor
export const imageToTensor = (rawImageData) => {
  return tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(rawImageData);
    const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
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

// 6. Verificación (67 líneas totales)
export const isModelLoaded = () => {
  return model !== null;
};