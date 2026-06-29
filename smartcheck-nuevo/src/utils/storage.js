// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@smartcheck_user';

export const storage = {
  /**
   * Guarda los datos del usuario en almacenamiento local
   * @param {Object} userData - Datos del usuario a guardar
   * @returns {Promise<boolean>} - true si se guardó correctamente
   */
  saveUser: async (userData) => {
    try {
      if (!userData || !userData.email) {
        console.error('❌ Datos de usuario inválidos');
        return false;
      }
      
      // Limpiar datos sensibles antes de guardar
      const safeUserData = {
        id: userData.id,
        email: userData.email.toLowerCase().trim(),
        nombre: userData.nombre,
        apellido: userData.apellido,
        sexo: userData.sexo,
        authMethod: userData.authMethod || 'password',
        faceData: userData.faceData || null, // Solo referencia, no base64 completo si es muy grande
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(safeUserData));
      console.log('✅ Usuario guardado:', safeUserData.email);
      return true;
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      return false;
    }
  },

  /**
   * Obtiene los datos del usuario almacenado
   * @returns {Promise<Object|null>} - Datos del usuario o null
   */
  getUser: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) {
        return null;
      }
      const userData = JSON.parse(jsonValue);
      console.log('✅ Usuario cargado:', userData?.email);
      return userData;
    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
      return null;
    }
  },

  /**
   * Elimina los datos del usuario del almacenamiento local
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  clearUser: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('✅ Sesión cerrada - usuario eliminado');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return false;
    }
  },

  /**
   * Actualiza parcialmente los datos del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<boolean>} - true si se actualizó correctamente
   */
  updateUser: async (updates) => {
    try {
      const currentUser = await storage.getUser();
      if (!currentUser) return false;
      
      const updatedUser = {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return await storage.saveUser(updatedUser);
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      return false;
    }
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns {Promise<boolean>} - true si hay usuario logueado
   */
  isAuthenticated: async () => {
    try {
      const user = await storage.getUser();
      return user !== null && user.email !== undefined;
    } catch {
      return false;
    }
  }
};

export default storage;