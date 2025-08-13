"use client";

import { useState, useEffect } from "react";
import {
  Book,
  PlusCircle,
  Users,
  Building, // Ícone trocado para melhor representar "Secretarias"
  ArrowRight,
  Layers,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  getBooks,
  getLicenseBatches,
  getSecretaries,
} from "./licenses/services/api";
import { getUsers } from "./users/services/api";

// Paleta de cores para os cards
const themeColors = {
  books: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    hoverText: "hover:text-blue-500",
  },
  secretaries: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
    hoverText: "hover:text-orange-500",
  },
  users: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
    hoverText: "hover:text-green-500",
  },
  licenses: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
    hoverText: "hover:text-purple-500",
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  href,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
  href: string;
  colorClass: string; // Nova prop para a cor do ícone no hover
}) {
  return (
    <Link href={href} className="block group">
      <div className="rounded-xl border bg-card text-card-foreground p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon
            className={`h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:${colorClass}`}
          />
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{isLoading ? "..." : value}</p>
          <div className="flex items-center gap-2">
            {!isLoading && (
              <span className="flex items-center text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3 mr-1" />
              </span>
            )}
            <p className="text-xs text-muted-foreground">Total no sistema</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  theme, // Nova prop para passar o tema de cores
}: {
  title:string;
  description:string;
  href:string;
  icon:React.ElementType;
  theme:{ bg:string; text:string };
}) {
  return (
    <Link href={href} className="block group relative">
      <div className="flex h-full flex-col rounded-xl border bg-card p-6 text-card-foreground transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 group-hover:border-primary/40">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 ${theme.bg} ${theme.text}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          {/* O título agora ganha a cor do tema no hover */}
          <h3
            className={`text-lg font-semibold transition-colors duration-300 group-hover:${theme.text}`}
          >
            {title}
          </h3>
        </div>
        <p className="mt-4 flex-grow text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {/* A seta agora também ganha a cor do tema */}
      <ArrowRight
        className={`absolute top-5 right-5 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:${theme.text}`}
      />
    </Link>
  );
}

export default function Home() {
  const [stats, setStats] = useState({
    books: 0,
    secretaries: 0,
    users: 0,
    licenseBatches: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [booksData, secretariesData, usersData, licenseBatchesData] =
          await Promise.all([
            getBooks(),
            getSecretaries(),
            getUsers(),
            getLicenseBatches(),
          ]);

        setStats({
          books: booksData.length,
          secretaries: secretariesData.length,
          users: usersData.length,
          licenseBatches: licenseBatchesData.length,
        });
      } catch (error) {
        console.error("Falha ao buscar estatísticas do dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  return (
    <main className="flex flex-1 flex-col bg-muted/20 dark:bg-background/95 p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo(a) de volta! 
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui está um resumo rápido da atividade no seu sistema.
        </p>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="acoes-rapidas-heading">
          <h2
            id="acoes-rapidas-heading"
            className="text-xl font-semibold tracking-tight text-foreground mb-4"
          >
            Ações Rápidas 
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              title="Adicionar Livro"
              description="Cadastre um novo título no acervo da biblioteca."
              href="/admin/books/form"
              icon={PlusCircle}
              theme={themeColors.books}
            />
         
            <ActionCard
              title="Criar Licença"
              description="Gere um novo lote de licenças para as escolas."
              href="/admin/licenses/form"
              icon={Layers}
              theme={themeColors.licenses}
            />
            <ActionCard
              title="Adicionar Usuário"
              description="Cadastre um novo gestor no sistema."
              href="/admin/users/form"
              icon={Users}
              theme={themeColors.users}
            />
          </div>
        </section>

        <section aria-labelledby="visao-geral-heading">
          <h2
            id="visao-geral-heading"
            className="text-xl font-semibold tracking-tight text-foreground mb-4"
          >
            Visão Geral 
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              href="/admin/books"
              title="Total de Livros"
              value={stats.books}
              icon={Book}
              isLoading={isLoading}
              colorClass={themeColors.books.text}
            />
            <StatCard
              href="/admin/secretary"
              title="Total de Secretarias"
              value={stats.secretaries}
              icon={Building} // Ícone atualizado
              isLoading={isLoading}
              colorClass={themeColors.secretaries.text}
            />
            <StatCard
              href="/admin/users"
              title="Total de Usuários"
              value={stats.users}
              icon={Users}
              isLoading={isLoading}
              colorClass={themeColors.users.text}
            />
            <StatCard
              href="/admin/licenses"
              title="Total de Licenças"
              value={stats.licenseBatches}
              icon={Layers}
              isLoading={isLoading}
              colorClass={themeColors.licenses.text}
            />
          </div>
        </section>
      </div>
    </main>
  );
}