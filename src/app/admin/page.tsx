"use client";

// 1. Importa os hooks e as funções da API necessárias
import { useState, useEffect } from "react";
import { Book, PlusCircle, Users, BoxIcon, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { getBooks, getLicenseBatches, getSecretaries } from "./licenses/services/api";
import { getUsers } from "./users/services/api";


/**
 * StatCard: Mostra um estado de carregamento.
 */
function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {isLoading ? "..." : value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Total no sistema
        </p>
      </div>
    </div>
  );
}

/**
 * ActionCard: Nenhuma alteração necessária.
 */
function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/20">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      </div>
      <p className="mt-4 flex-grow text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 font-semibold text-primary transition-all group-hover:gap-3"
      >
        Ir agora
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function Home() {
  // 2. Adiciona estado para todas as estatísticas e para o carregamento
  const [stats, setStats] = useState({
    books: 0,
    secretaries: 0,
    users: 0,
    licenseBatches: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 3. Usa o useEffect para buscar todos os dados de forma concorrente
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Busca todos os dados em paralelo para mais eficiência
        const [
          booksData,
          secretariesData,
          usersData,
          licenseBatchesData,
        ] = await Promise.all([
          getBooks(),
          getSecretaries(),
          getUsers(),
          getLicenseBatches(),
        ]);

        // Atualiza o estado com os dados dinâmicos
        setStats({
          books: booksData.length,
          secretaries: secretariesData.length,
          users: usersData.length,
          licenseBatches: licenseBatchesData.length,
        });

      } catch (error) {
        console.error("Falha ao buscar estatísticas do dashboard:", error);
        // Em caso de erro, pode-se definir um estado de erro para exibir na UI
      } finally {
        setIsLoading(false); // Finaliza o carregamento, com sucesso ou erro
      }
    };

    fetchAllStats();
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 bg-slate-50 dark:bg-slate-950/95">
      <div className="mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Bem-vindo(a) de volta!
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Aqui está um resumo do seu sistema.
        </p>
      </div>

      {/* 4. Grid de Estatísticas agora usa os dados dinâmicos */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Livros"
          value={stats.books}
          icon={Book}
          isLoading={isLoading}
        />
        <StatCard
          title="Secretarias"
          value={stats.secretaries}
          icon={BoxIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Usuários Ativos"
          value={stats.users}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Lotes de Lotes de Licenças"
          value={stats.licenseBatches}
          icon={Layers} // Ícone para lotes/camadas
          isLoading={isLoading}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ActionCard
            title="Adicionar Novo Livro"
            description="Cadastre um novo título no acervo da biblioteca, definindo autor, editora e outras informações."
            href="/admin/books/form"
            icon={PlusCircle}
          />
          <ActionCard
            title="Gerenciar Acervo"
            description="Visualize, edite ou remova livros existentes. Consulte a lista completa de títulos disponíveis."
            href="/admin/books"
            icon={Book}
          />
        </div>
      </div>
    </main>
  );
}
