let model = null;

// Función para inicializar usando carga dinámica
export const initializeTensorFlow = async () => {
    if (model) return model;
    
    try {
        // Importaciones dinámicas: Se ejecutan solo cuando se llama a la función, 
        // no al iniciar la aplicación. Esto acelera el Bundling dramáticamente.
        const tf = require('@tensorflow/tfjs');
        require('@tensorflow/tfjs-react-native');
        const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');

        console.log("DEBUG: Iniciando tf.ready()...");
        await tf.ready();
        
        console.log("DEBUG: Cargando modelo...");
        model = await faceLandmarksDetection.load(
            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
            { maxFaces: 1 }
        );
        
        console.log("✅ Modelo de IA cargado dinámicamente.");
        return model;
    } catch (error) {
        console.error("❌ ERROR CRÍTICO en initializeTensorFlow:", error);
        return null;
    }
};

export const imageToTensor = async (image) => {
    try {
        const tf = require('@tensorflow/tfjs'); // Importación dinámica también aquí
        const response = await fetch(image.uri, {}, { isBinary: true });
        const imageDataArrayBuffer = await response.arrayBuffer();
        const imageData = new Uint8Array(imageDataArrayBuffer);
        const imageTensor = tf.browser.fromPixels({
            data: imageData,
            width: image.width,
            height: image.height,
        });
        return imageTensor;
    } catch (error) {
        console.error("Error convirtiendo a tensor:", error);
        return null;
    }
};

export { model };