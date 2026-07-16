import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// IMPORTANTE: Tras renombrar 'face_recognition_model-weights_manifest.json' a 'model.json',
// el require apuntará al nuevo nombre.
const modelJson = require('../../assets/models/model.json');

// NOTA: Como tienes shard1 y shard2, los pesos se cargarán automáticamente
// siempre que estén en la misma carpeta que el model.json.
const modelWeights = [
  require('../../assets/models/face_recognition_model-shard1'),
  require('../../assets/models/face_recognition_model-shard2')
];

export let model = null;

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

export const loadModel = async () => {
  if (model) return model;
  try {
    console.log("📂 Cargando modelo de reconocimiento facial...");

    // Cargamos el grafo. Usamos los archivos de pesos cargados arriba.
    model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
    
    console.log("✅ Modelo cargado exitosamente");
    return model;
  } catch (error) {
    console.error("❌ Error crítico al cargar el modelo:", error);
    return null;
  }
};

export const imageToTensor = (rawImageData) => {
  return tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(rawImageData);
    const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
    const normalized = resized.div(255.0).expandDims(0);
    return normalized;
  });
};

export const disposeModel = () => {
  if (model) {
    model.dispose();
    model = null;
    console.log("🗑️ Modelo liberado de memoria");
  }
};