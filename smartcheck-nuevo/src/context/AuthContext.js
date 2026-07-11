import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("🔄 Firebase Auth State Changed:", currentUser ? "Usuario conectado" : "Usuario desconectado");
      // Solo actualizamos si Firebase realmente detecta un cambio, 
      // esto ayuda a no sobreescribir el login manual del reconocimiento facial
      if (currentUser) {
        setUser(currentUser);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- CORRECCIÓN: Definimos la función login que faltaba ---
  const login = (userData) => {
    console.log("🔑 Ejecutando login manual en Context:", userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      console.log("🚪 Sesión cerrada");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const updateLocation = (localidad, provincia) => {
    if (user) {
      const updatedUser = { ...user, localidad, provincia };
      setUser(updatedUser);
      console.log("📍 Ubicación actualizada en Context:", localidad, provincia);
    }
  };

  // --- CORRECCIÓN: Agregamos 'login' al valor que provee el contexto ---
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateLocation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);