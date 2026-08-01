import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let detector = null;

export const initializeTensorFlow = async () => {
    if (detector) return detector;

    try {
        await tf.ready();
        
        detector = await faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            {
                runtime: 'tfjs',
                modelType: 'lite',
                maxFaces: 1
            }
        );
        
        console.log("✅ Modelo de IA cargado correctamente.");
        return detector;
    } catch (error) {
        console.error("❌ ERROR CRÍTICO en initializeTensorFlow:", error);
        return null;
    }
};

export const imageToTensor = async (imageUri) => {
    try {
        const response = await fetch(imageUri);
        const imageData = await response.arrayBuffer();
        const imageTensor = decodeJpeg(new Uint8Array(imageData));
        return imageTensor;
    } catch (error) {
        console.error("Error convirtiendo a tensor:", error);
        return null;
    }
};

export { detector };