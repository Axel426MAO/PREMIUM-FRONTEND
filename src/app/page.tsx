// Adiciona a diretiva para marcar como Componente de Cliente
"use client";

export default function Home() {
  return (
    <main className="font-sans flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Página Principal (Protegida)
        </h1>
        <p className="text-lg text-gray-700">
          Bem-vindo! Você está autenticado e pode ver este conteúdo.
        </p>
      </div>
    </main>
  );
}
