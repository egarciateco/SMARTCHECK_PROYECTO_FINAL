import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// 1. IMPORTANTE: Ajustamos la ruta a 'models' (plural)
// Asegúrate de que dentro de esa carpeta exista el archivo 'model.json'
const modelJson = require('../../assets/models/model.json');
const modelWeights = require('../../assets/models/group1-shard1.bin'); 

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
    console.log("📂 Assets encontrados en 'models/', intentando cargar...");

    // Si tu archivo de pesos tiene otro nombre, cámbialo aquí también
    model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
    
    console.log("✅ Modelo cargado exitosamente");
    return model;
  } catch (error) {
    console.error("❌ Error al cargar el modelo:", error);
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