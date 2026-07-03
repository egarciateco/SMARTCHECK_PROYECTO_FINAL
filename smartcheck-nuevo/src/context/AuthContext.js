import React, { createContext, useState, useContext } from 'react';

// Agregamos null para inicializar correctamente el contexto
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Cambiado a false para evitar bloqueos iniciales

  const login = (userData) => {
    // DIAGNÓSTICO EN TIEMPO REAL: Revisa si el backend envía la foto y qué campos trae el usuario
    if (userData) {
      console.log("=========================================");
      console.log("=== DATOS RECIBIDOS EN AUTH CONTEXT ===");
      console.log("Campos del usuario:", Object.keys(userData));
      console.log("¿Existe campo 'foto'?:", !!userData.foto);
      console.log("¿Existe campo 'image'?:", !!userData.image);
      if (userData.foto) {
        console.log("Longitud del string de la foto:", userData.foto.length);
        console.log("Inicio del string de la foto:", userData.foto.substring(0, 50));
      }
      console.log("=========================================");
    } else {
      console.log("=== AUTH CONTEXT: Se intentó loguear con userData vacío ó null ===");
    }

    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};