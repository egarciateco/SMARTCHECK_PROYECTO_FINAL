import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import storage from '../utils/storage';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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

    // Bandera para evitar dobles llamadas consecutivas en un mismo login
    const isLoggingIn = useRef(false);

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
        // Sincronización en tiempo real con Firebase Auth y el storage local
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName || ''
                    };
                    setUser(userData);
                    if (storage && typeof storage.saveUser === 'function') {
                        await storage.saveUser(userData);
                    }
                } else {
                    setUser(null);
                    if (storage && typeof storage.removeUser === 'function') {
                        await storage.removeUser();
                    }
                }
            } catch (e) {
                console.error("AuthContext: Error al sincronizar estado de autenticación:", e);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (userData) => {
        // Si ya hay un proceso de login corriendo en este milisegundo, lo ignoramos para evitar duplicados
        if (isLoggingIn.current) return;
        isLoggingIn.current = true;

        try {
            let finalUser = { ...userData };
            const userId = userData?.id || userData?.uid;

            if (userId) {
                try {
                    const response = await fetch(`https://smartcheck-proyecto.onrender.com/api/users/incrementar-visitas/${userId}`, {
                        method: 'POST',
                    });
                    const data = await response.json();
                    
                    if (data.success && data.visitas) {
                        // Sincronizamos exactamente con lo que dictaminó el servidor
                        finalUser.visitas = data.visitas;
                    }
                } catch (apiError) {
                    console.log("Error al intentar sumar la visita:", apiError);
                }
            }

            if (storage && typeof storage.saveUser === 'function') {
                await storage.saveUser(finalUser);
            }
            setUser(finalUser);

        } catch (e) {
            console.error("AuthContext: Error al guardar sesión durante login:", e);
        } finally {
            // Liberamos el bloqueo después de un breve momento
            setTimeout(() => {
                isLoggingIn.current = false;
            }, 1000);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            if (storage && typeof storage.removeUser === 'function') {
                await storage.removeUser();
            }
        } catch (e) {
            console.error("AuthContext: Error al cerrar sesión:", e);
        } finally {
            setUser(null);
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