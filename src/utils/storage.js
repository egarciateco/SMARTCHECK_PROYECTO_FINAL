import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@smartcheck_user';

export const storage = {
  /**
   * Guarda los datos del usuario en almacenamiento local
   */
  saveUser: async (userData) => {
    try {
      if (!userData || !userData.email) {
        console.error('❌ Datos de usuario inválidos');
        return false;
      }
      
      const safeUserData = {
        id: userData.id || userData._id,
        email: userData.email.toLowerCase().trim(),
        nombre: userData.nombre,
        apellido: userData.apellido,
        sexo: userData.sexo,
        fechaNacimiento: userData.fechaNacimiento || null,
        dia: userData.dia || null,
        mes: userData.mes || null,
        anio: userData.anio || null,
        authMethod: userData.authMethod || 'password',
        faceData: userData.faceData || null,
        foto: userData.foto || null,
        image: userData.image || null,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(safeUserData));
      console.log('✅ Usuario guardado correctamente.');
      return true;
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      return false;
    }
  },

  /**
   * Obtiene los datos del usuario con blindaje anti-crash
   */
  getUser: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      
      // 1. Verificación básica: Si es null o la cadena "undefined"
      if (jsonValue === null || jsonValue === 'undefined') {
        return null;
      }
      
      // 2. Intento de parseo seguro
      try {
        const userData = JSON.parse(jsonValue);
        return userData;
      } catch (parseError) {
        // Si el JSON está roto (corrupto), limpiamos el storage y devolvemos null
        console.error('❌ JSON Corrupto detectado, limpiando storage...', parseError);
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }
    } catch (error) {
      console.error('❌ Error inesperado cargando usuario:', error);
      return null;
    }
  },

  /**
   * Elimina los datos del usuario del almacenamiento local
   */
  clearUser: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return false;
    }
  },

  /**
   * Alias de clearUser para compatibilidad directa con AuthContext (removeUser)
   */
  removeUser: async () => {
    return await storage.clearUser();
  },

  /**
   * Actualiza parcialmente los datos del usuario
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
   */
  isAuthenticated: async () => {
    const user = await storage.getUser();
    return user !== null && user.email !== undefined;
  }
};

export default storage;