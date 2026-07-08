import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('usuario_logueado');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Si los datos guardados venían envueltos en la propiedad 'usuario', los normalizamos
          const cleanUser = parsedUser?.usuario ? parsedUser.usuario : parsedUser;
          setUser(cleanUser);
          console.log("Sesión recuperada:", cleanUser);
        }
      } catch (error) { 
        console.error(error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    checkSession();
  }, []);

  const login = async (userData) => {
    // Normalizamos el objeto para asegurar que guardamos la raíz del usuario con sus campos dia, mes, anio
    const cleanUserData = userData?.usuario ? userData.usuario : userData;
    console.log("Guardando usuario en Context:", cleanUserData);
    setUser(cleanUserData);
    await AsyncStorage.setItem('usuario_logueado', JSON.stringify(cleanUserData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('usuario_logueado');
  };

  // Nueva función para inyectar la localidad y provincia obtenidas por geolocalización
  const updateLocation = async (localidad, provincia) => {
    try {
      if (user) {
        const updatedUser = { ...user, localidad, provincia };
        setUser(updatedUser);
        await AsyncStorage.setItem('usuario_logueado', JSON.stringify(updatedUser));
        console.log("Ubicación actualizada en Context y Storage:", localidad, provincia);
      }
    } catch (error) {
      console.error("Error actualizando la ubicación en el contexto:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateLocation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);