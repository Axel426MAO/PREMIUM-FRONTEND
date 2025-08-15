"use client";

import Link from "next/link";
import { Library, Mail, Lock, Eye, EyeOff } from "lucide-react";
import React, { useState, type FC, type FormEvent } from "react";
import { useUserStore } from "../store/userStore"; // Importe o seu store Zustand

// --- Componente de Input Genérico (Estilo Atualizado) ---
const FormInput: FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon: React.ElementType;
    error?: string;
  }
> = ({ icon: Icon, error, ...props }) => (
  <div className="w-full">
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        className={`w-full rounded-lg border  py-3 pl-12 pr-4 text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-2  dark:text-white dark:placeholder:text-gray-400 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-gray-900 focus:ring-gray-900/50 dark:border-gray-600 dark:focus:border-gray-400 dark:focus:ring-gray-400/50"
        }`}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
        {error}
      </p>
    )}
  </div>
);

// --- Componente Principal da Página de Login (Estilo Atualizado) ---
export default function LoginPage() {
  // --- Estados do Componente ---
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    api?: string;
  }>({});
  const login = useUserStore((state) => state.login);

  // --- Função de Validação ---
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "O email é obrigatório.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "O formato do email é inválido.";
    }
    if (!password) {
      newErrors.password = "A senha é obrigatória.";
    }
    return newErrors;
  };

  // --- Função de Submissão do Formulário ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Substitua pela URL da sua API de produção
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Credenciais inválidas. Tente novamente."
        );
      }

      if (data.token) {
        login(data.user, data.token);

        window.location.href = "/redirect"; // Idealmente use o useRouter para navegação
      } else {
        throw new Error("Token não recebido do servidor.");
      }
    } catch (error: any) {
      setErrors({ api: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full  font-sans">
      {/* Coluna do Formulário */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 flex items-center justify-center gap-3 text-2xl font-bold text-gray-900 dark:text-white lg:justify-start"
          >
            {/* Ícone com cor neutra */}
            <Library className="h-8 w-8 text-gray-800 dark:text-gray-200" />
            <span>Editora Premium</span>
          </Link>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Bem-vindo(a) de volta!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Acesse sua conta para gerenciar a plataforma.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Mensagem de Erro da API */}
            {errors.api && (
              <div
                className="rounded-lg border border-red-300 bg-red-50 p-4 text-center text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                role="alert"
              >
                {errors.api}
              </div>
            )}

            {/* Campo de Email */}
            <FormInput
              icon={Mail}
              type="email"
              name="email"
              id="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            {/* Campo de Senha */}
            <div className="w-full">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border  py-3 pl-12 pr-12 text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-2  dark:text-white dark:placeholder:text-gray-400 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-gray-900 focus:ring-gray-900/50 dark:border-gray-600 dark:focus:border-gray-400 dark:focus:ring-gray-400/50"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:text-gray-50 dark:focus:ring-gray-50"
                />
                <label
                  htmlFor="remember-me"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Lembrar-me
                </label>
              </div>
              <Link
                href="#"
                className="font-medium text-gray-800 hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Botão de Submissão (Estilo Admin) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg  px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors bg-black hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:pointer-events-none disabled:opacity-60  dark:text-white dark:bg-gray-900  dark:border dark:hover:bg-gray-200"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Entrando...</span>
                </>
              ) : (
                "Entrar na Plataforma"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Editora Premium. Todos os direitos
            reservados.
          </p>
        </div>
      </div>

      {/* Coluna da Imagem */}
      <div className="relative hidden lg:block lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop"
          alt="Pessoa lendo um livro em uma biblioteca"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/1064x1200/374151/FFFFFF?text=Imagem+Indispon%C3%ADvel";
            (e.target as HTMLImageElement).alt = "Imagem de fallback";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="relative flex h-full flex-col items-start justify-end p-12">
          <h2 className="text-4xl font-bold text-white leading-tight">
            O conhecimento que abre portas para o futuro.
          </h2>
          <p className="mt-4 max-w-md text-lg text-gray-200">
            Nossa plataforma une conteúdo de qualidade e tecnologia para
            transformar a educação.
          </p>
        </div>
      </div>
    </div>
  );
}
