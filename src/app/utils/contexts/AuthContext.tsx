"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// (Opcional) Um componente de carregamento para a verificação inicial
const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen w-full bg-white">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-900"></div>
  </div>
);

// Define a forma do nosso contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// O Provedor de Autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // `isLoading` é crucial para esperar a verificação inicial do token no localStorage
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Na primeira carga, verifica se o token existe no localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      // Em um app real, você poderia decodificar o token aqui para verificar a expiração
      setIsAuthenticated(true);
    }
    // Finaliza o carregamento inicial
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    router.push('/admin'); // Redireciona para a dashboard após o login
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    router.push('/onboard'); // Redireciona para o login após o logout
  };

  const value = { isAuthenticated, isLoading, login, logout };

  // Enquanto verifica o token, exibe um loader para evitar piscar de conteúdo
  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto de autenticação facilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
