// Adicione esta diretiva no topo do arquivo para marcá-lo como um Componente de Cliente
"use client";

import { useUserStore } from "@/app/store/userStore";
import { useState, type FormEvent } from "react";

// Ícone para o logo da empresa
const LogoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

// Ícone para mostrar a senha
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-500 dark:text-gray-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Ícone para ocultar a senha
const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-500 dark:text-gray-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228"
    />
  </svg>
);

export default function Login() {
  // Se o useAuth for apenas para chamar login(), pode ser mais limpo
  // gerenciar o token aqui e passar para um contexto/storage.
  // const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    api?: string;
  }>({});
  const login = useUserStore((state) => state.login);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const base_url = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${base_url}/auth/login`, {
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
        window.location.href = "/redirect"; // Ou para a rota que desejar
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
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo e Nome da Empresa */}
        <div className="flex items-center justify-center gap-2 font-semibold text-gray-900 dark:text-gray-50">
          <div className="bg-gray-900 dark:bg-gray-50 text-white dark:text-black flex size-6 items-center justify-center rounded-md">
            <LogoIcon />
          </div>
          Editora Premium
        </div>

        {/* Card Component */}
        <div className="bg-white dark:bg-[#030712] rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          {/* Card Header */}
          <div className="p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              Bem-vindo(a) de volta!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Faça login para continuar.
            </p>
          </div>

          {/* Card Content */}
          <div className="p-6 pt-0">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* API Error Message */}
              {errors.api && (
                <div
                  className="p-3 text-sm text-red-800 rounded-lg bg-red-100 dark:bg-red-900/20 dark:text-red-400 text-center border border-red-200 dark:border-red-500/30"
                  role="alert"
                >
                  {errors.api}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-50 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 ${
                    errors.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-gray-300 dark:border-gray-800 focus-visible:ring-gray-950 dark:focus-visible:ring-gray-300"
                  }`}
                  placeholder="seu@email.com"
                  required
                />
                {errors.email && (
                  <p className="text-sm font-medium text-red-500 dark:text-red-400 pt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-50 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 ${
                      errors.password
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300 dark:border-gray-800 focus-visible:ring-gray-950 dark:focus-visible:ring-gray-300"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm font-medium text-red-500 dark:text-red-400 pt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 bg-gray-900 text-gray-50 hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200 h-10 px-4 py-2 w-full mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5"
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
                  "Entrar"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Editora Premium. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </main>
  );
}
