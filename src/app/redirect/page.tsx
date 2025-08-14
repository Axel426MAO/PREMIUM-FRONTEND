"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library } from "lucide-react";
import { useUserStore } from "../store/userStore";

// --- Componente de Spinner de Carregamento ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-200" />
    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
      Verificando sua sessão...
    </p>
  </div>
);

// --- Mapeamento de Rota por Tipo de Usuário ---
const userTypeToRouteMap: { [key: string]: string } = {
  responsible_secretary: "/secretary",
  aluno: "/aluno/dashboard",
  professor: "/professor/dashboard",
  escola: "/escola/dashboard",
  admin: "/admin/",
};

// --- Componente Principal da Página de Redirecionamento ---
export default function RedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { token, login, logout } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // **CORREÇÃO**: A verificação só roda depois que o componente foi montado
    // e o Zustand teve a chance de reidratar o estado do localStorage.
    if (!isMounted) {
      return;
    }

    const verifyAndFetchUser = async () => {
      console.log(token);
      if (!token) {
        router.push("/onboard");
        return;
      }

      localStorage.setItem("authToken", token);

      try {
        const response = await fetch("http://localhost:4000/api/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = await response.json();

        if (!response.ok) {
          throw new Error(userData.error || "Sessão inválida ou expirada.");
        }

        login(userData, token);

        const userType = userData.user_type;
        const targetRoute = userTypeToRouteMap[userType];

        if (targetRoute) {
          router.push(targetRoute);
        } else {
          throw new Error("Tipo de usuário desconhecido.");
        }
      } catch (err: any) {
        setError(err.message);
        logout(); // Limpa o token inválido
        setTimeout(() => {
          router.push("/onboard");
        }, 3000);
      }
    };

    verifyAndFetchUser();
  }, [isMounted, token, router, login, logout]); // Adicionado 'isMounted' às dependências

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white dark:bg-gray-900 font-sans p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-900 dark:text-white"
        >
          <Library className="h-8 w-8 text-gray-800 dark:text-gray-200" />
          <span>Editora Premium</span>
        </Link>

        {error ? (
          <p className="text-lg font-medium text-red-600 dark:text-red-400">
            {error} Redirecionando para o login...
          </p>
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </div>
  );
}
