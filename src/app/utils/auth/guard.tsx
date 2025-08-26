"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  // 1. Buscamos também o estado de 'isLoading' do nosso contexto.
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 2. A verificação agora só acontece quando o carregamento inicial termina.
    // Se não estiver carregando E não estiver autenticado, redireciona.
    if (!isLoading && !isAuthenticated) {
      router.replace('/onboard');
    }
  }, [isAuthenticated, isLoading, router]); // Adicionamos isLoading às dependências


  if (isLoading) {
    return null; 
  }


  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Se não estiver autenticado, o redirecionamento está em andamento.
  return null;
}
