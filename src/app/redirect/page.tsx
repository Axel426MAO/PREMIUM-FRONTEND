"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library } from "lucide-react";
import { useUserStore } from "../store/userStore";

// --- Componente de Spinner de Carregamento (Corrigido para o tema) ---
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
    <p className="text-lg font-medium text-muted-foreground">
      Verificando sua sessão...
    </p>
  </div>
);

// --- Mapeamento de Rota por Tipo de Usuário ---
const userTypeToRouteMap: { [key: string]: string } = {
  responsible_secretary: "/secretary",
  aluno: "/aluno/dashboard",
  professor: "/professor/dashboard",
  responsible_school: "/school",
  admin: "/admin/",
};

// --- Componente Principal da Página de Redirecionamento ---
export default function RedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { token, login, logout } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const verifyAndFetchUser = async () => {
      if (!token) {
        router.push("/onboard");
        return;
      }

      localStorage.setItem("authToken", token);

      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
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
  }, [isMounted, token, router, login, logout, API_BASE_URL]);

  return (
    // ✨ CORREÇÃO: Usando bg-background para se adaptar ao tema
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background font-sans p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <Link
          href="/"
          // ✨ CORREÇÃO: Usando text-foreground para o texto
          className="flex items-center justify-center gap-3 text-2xl font-bold text-foreground"
        >
          {/* ✨ CORREÇÃO: Usando text-muted-foreground para o ícone */}
          <Library className="h-8 w-8 text-muted-foreground" />
          <span>Premium Editora</span>
        </Link>

        {error ? (
          // ✨ CORREÇÃO: Usando text-destructive para a mensagem de erro
          <p className="text-lg font-medium text-destructive">
            {error} Redirecionando para o login...
          </p>
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </div>
  );
}
