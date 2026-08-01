import React, { createContext, useState, useContext, useEffect } from 'react';
import storage from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [registerPhotoUri, setRegisterPhotoUri] = useState(null);
    const [registerFormData, setRegisterFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        dia: '',
        mes: '',
        anio: '',
        sexo: '',
        password: '',
        confirmPassword: '',
        authMode: null,
    });

    const clearRegisterData = () => {
        setRegisterPhotoUri(null);
        setRegisterFormData({
            nombre: '',
            apellido: '',
            email: '',
            dia: '',
            mes: '',
            anio: '',
            sexo: '',
            password: '',
            confirmPassword: '',
            authMode: null,
        });
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("AuthContext: Buscando sesión guardada...");
                if (storage && typeof storage.getUser === 'function') {
                    const savedUser = await storage.getUser();
                    if (savedUser && typeof savedUser === 'object') {
                        console.log("AuthContext: Usuario cargado correctamente.");
                        setUser(savedUser);
                    } else {
                        console.log("AuthContext: No se encontró sesión activa.");
                        setUser(null);
                    }
                }
            } catch (e) {
                console.error("AuthContext: Error crítico al recuperar usuario:", e);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (userData) => {
        try {
            if (storage && typeof storage.saveUser === 'function') {
                await storage.saveUser(userData);
            }
            setUser(userData);
        } catch (e) {
            console.error("AuthContext: Error al guardar sesión durante login:", e);
        }
    };

    const logout = async () => {
        try {
            if (storage && typeof storage.removeUser === 'function') {
                await storage.removeUser();
            }
            setUser(null);
        } catch (e) {
            console.error("AuthContext: Error al cerrar sesión:", e);
        }
    };

    const updateUser = async (newData) => {
        try {
            const updatedUser = { ...user, ...newData };
            if (storage && typeof storage.saveUser === 'function') {
                await storage.saveUser(updatedUser);
            }
            setUser(updatedUser);
        } catch (e) {
            console.error("AuthContext: Error al actualizar perfil:", e);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            updateUser, 
            isLoading, 
            registerPhotoUri, 
            setRegisterPhotoUri,
            registerFormData,
            setRegisterFormData,
            clearRegisterData
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);