import React, { createContext, useState, useContext, useEffect } from 'react';
import storage from '../utils/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const savedUser = await storage.getUser();
            if (savedUser) {
                setUser(savedUser);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        await storage.removeUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);