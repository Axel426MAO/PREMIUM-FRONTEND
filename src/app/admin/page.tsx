"use client";

import { useState, useEffect } from "react";
import {
  Book,
  PlusCircle,
  Users,
  Building,
  ArrowRight,
  Layers,
  TrendingUp,
  // MODIFICAÇÃO 1: Novos ícones importados
  KeyRound, // Ícone de chave para licenças
  School, // Ícone para escola pública
  Building2, // Ícone para escola privada
} from "lucide-react";
import Link from "next/link";
import {
  getBooks,
  getLicenseBatches,
  getSecretaries,
  getSchools, // Adicionado conforme solicitado
} from "./licenses/services/api";
import { getUsers } from "./users/services/api";
import { useUserStore } from "../store/userStore";

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
  // MODIFICAÇÃO 2: Novo tema de cor para os cards de escolas
  schools: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    hoverText: "hover:text-teal-500",
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
  colorClass: string;
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
  theme,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  theme: { bg: string; text: string };
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
      <ArrowRight
        className={`absolute top-5 right-5 h-5 w-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:${theme.text}`}
      />
    </Link>
  );
}

export default function Home() {
  // MODIFICAÇÃO 3: Estado atualizado para incluir contagem de escolas
  const [stats, setStats] = useState({
    books: 0,
    secretaries: 0,
    users: 0,
    licenseBatches: 0,
    publicSchools: 0,
    privateSchools: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();
  const responsibleName = user?.responsible?.name;

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // MODIFICAÇÃO 4: Adicionada a chamada para getSchools
        const [
          booksData,
          secretariesData,
          usersData,
          licenseBatchesData,
          schoolsData,
        ] = await Promise.all([
          getBooks(),
          getSecretaries(),
          getUsers(),
          getLicenseBatches(),
          getSchools(), // Chamando a nova função
        ]);

        // MODIFICAÇÃO 5: Lógica para contar escolas públicas e privadas
        const publicSchoolsCount = schoolsData.filter(
          (school) => !school.is_private
        ).length;
        const privateSchoolsCount = schoolsData.filter(
          (school) => school.is_private
        ).length;

        setStats({
          books: booksData.length,
          secretaries: secretariesData.length,
          users: usersData.length,
          licenseBatches: licenseBatchesData.length,
          publicSchools: publicSchoolsCount,
          privateSchools: privateSchoolsCount,
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
    <main className="flex flex-1 flex-col bg-muted/20 dark:bg-background/95 p-6 md:p-8">
      <header className="mb-4 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo(a)
          {responsibleName ? `, ${responsibleName}` : ""}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui está um resumo rápido da atividade no seu sistema.
        </p>
      </header>

      <div className="">
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
            className="text-xl font-semibold tracking-tight text-foreground mb-4 mt-4"
          >
            Visão Geral
          </h2>
          {/* MODIFICAÇÃO 6: Grid ajustado para 6 colunas em telas grandes */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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
              icon={Building}
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
            {/* MODIFICAÇÃO 7: Card de Lotes de Licenças atualizado */}
            <StatCard
              href="/admin/licenses"
              title="Lotes de Licenças"
              value={stats.licenseBatches}
              icon={KeyRound}
              isLoading={isLoading}
              colorClass={themeColors.licenses.text}
            />
            {/* MODIFICAÇÃO 8: Card de Escolas Públicas atualizado */}
            <StatCard
              href="/admin/schools" // Link ajustado para a página de escolas
              title="Escolas Públicas"
              value={stats.publicSchools}
              icon={School}
              isLoading={isLoading}
              colorClass={themeColors.schools.text}
            />
            {/* MODIFICAÇÃO 9: Card de Escolas Privadas atualizado */}
            <StatCard
              href="/admin/schools" // Link ajustado para a página de escolas
              title="Escolas Privadas"
              value={stats.privateSchools}
              icon={Building2}
              isLoading={isLoading}
              colorClass={themeColors.schools.text}
            />
          </div>
        </section>
      </div>
    </main>
  );
}