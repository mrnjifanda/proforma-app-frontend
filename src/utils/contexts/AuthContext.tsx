'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, ConfigEntreprise, User } from '@/utils/types';
import authService from '@/api/auth.service';
import { AUTH_STORAGE_KEY } from '@/utils/constants'
import apiService from '@/api/api.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {

    const [user, setUser] = useState<User | null>(null);
    const [entreprise, setEntreprise] = useState<ConfigEntreprise | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {

        const checkAuth = () => {

            const auth = apiService.getAuth();
            if (auth && "user" in auth  && "entreprise" in auth) {
                
                authService.me({
                    user: auth.user,
                    entreprise: auth.entreprise
                }).then(data => {

                    console.log(data);
                    setUser(auth.user);
                    setEntreprise(auth.entreprise);

                }).catch(error => {
                    console.log("Error: ", error);
                }).finally(() => {
                    setIsLoading(false);
                })
            } else {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {

        setIsLoading(true);

        try {

            const response = await authService.login({ email, password });
            const { user, entreprise, token, refresh_token } = response.data.data;

            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                user,
                entreprise,
                token,
                refresh_token
            }));

            setUser(user);
            setEntreprise(entreprise);

            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setEntreprise(null);
    };

    return (
        <AuthContext.Provider value={{ user, entreprise, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
