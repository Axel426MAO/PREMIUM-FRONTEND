// Adicione esta diretiva no topo do arquivo para marcá-lo como um Componente de Cliente
"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
// --- IMPORTAÇÃO PRINCIPAL ---

// --- Ícones SVG como componentes para melhor organização ---

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
  </svg>
);


export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string; }>({});

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
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Credenciais inválidas. Tente novamente.");
      }

      if (data.token) {
       
        login(data.token);
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
    <main className="font-sans grid grid-cols-1 md:grid-cols-2 min-h-screen w-full">
      {/* Lado Esquerdo: Branding */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gray-100">
        <div>
        </div>
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Painel Premium Admin</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Bem-vindo de volta! Utilize suas credenciais para acessar o painel de controle.
          </p>
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Premium. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Lado Direito: Formulário */}
      <div className="bg-white flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md">
            <div className="md:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Premium Admin</h1>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {errors.api && (
              <div className="p-3 text-sm text-red-700 rounded-lg bg-red-50 text-center border border-red-200" role="alert">
                <span className="font-medium">Erro de login:</span> {errors.api}
              </div>
            )}

            {/* Campo de Email */}
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                Endereço de Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`bg-gray-50 border text-gray-900 sm:text-sm rounded-lg block w-full p-3.5 focus:outline-none transition duration-200 ${
                  errors.email 
                  ? "border-red-400 focus:ring-1 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                }`}
                placeholder="seu@email.com"
                required
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Campo de Senha */}
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
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
                  className={`bg-gray-50 border text-gray-900 sm:text-sm rounded-lg block w-full p-3.5 focus:outline-none transition duration-200 ${
                    errors.password 
                    ? "border-red-400 focus:ring-1 focus:ring-red-500" 
                    : "border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white bg-gray-900 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-3.5 text-center disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Entrando...</span>
                </>
              ) : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
