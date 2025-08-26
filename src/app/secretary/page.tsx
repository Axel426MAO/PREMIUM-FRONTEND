"use client";

// 1. Adicionar imports do React
import { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";
import Link from "next/link";
import {
  Users,
  Layers,
  TrendingUp,
  School,
  PlusCircle,
  ArrowRight,
  UserCheck,
  Loader2,
  Building2,
} from "lucide-react";
import { getSchoolsBySecretaryId } from "./schools/services/api";
// --- MODIFICAÇÃO 1: Importar o serviço de licenças ---
import { getLicenseBatchesBySecretaryId } from "./licenses/services/api";

// Paleta de cores (sem alterações)
const themeColors = {
  schools: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
  },
  licenses: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
  },
  students: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
  },
  teachers: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
  },
};

// Componente StatCard (sem alterações)
function StatCard({
  title,
  value,
  icon: Icon,
  href,
  colorClass,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  colorClass: string;
  isLoading?: boolean;
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
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="flex items-center text-xs text-emerald-500">
              <TrendingUp className="h-3 w-3 mr-1" />
            </span>
            <p className="text-xs text-muted-foreground">Total no sistema</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Componente ActionCard (sem alterações)
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

// Componente Principal Home (com a nova lógica)
export default function Home() {
  const { user } = useUserStore();
  const responsibleName = user?.responsible?.name;

  // --- MODIFICAÇÃO 2: Adicionar 'receivedLicenses' ao estado ---
  const [stats, setStats] = useState({
    publicSchools: 0,
    privateSchools: 0,
    receivedLicenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (user.user_type === "responsible_secretary") {
        try {
          if (!user.responsible?.secretary?.id) {
            throw new Error("ID da secretaria não encontrado.");
          }
          const secretaryId = user.responsible.secretary.id;

          // --- MODIFICAÇÃO 3: Buscar escolas e licenças em paralelo ---
          const [schools, licenseBatches] = await Promise.all([
            getSchoolsBySecretaryId(secretaryId),
            getLicenseBatchesBySecretaryId(secretaryId),
          ]);

          const publicSchoolsCount = schools.filter(
            (school) => !school.is_private
          ).length;
          const privateSchoolsCount = schools.filter(
            (school) => school.is_private
          ).length;

          setStats({
            publicSchools: publicSchoolsCount,
            privateSchools: privateSchoolsCount,
            receivedLicenses: licenseBatches.length, // Contagem total de lotes de licença
          });
        } catch (err) {
          console.error("Erro ao buscar dados do dashboard:", err);
          setError("Não foi possível carregar os dados.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <main className="flex flex-1 flex-col p-6 md:p-10 md:py-6">
      <header className="mb-4 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo
          {responsibleName
            ? `, ${responsibleName.trim().split(" ").slice(0, 2).join(" ")}`
            : ""}
          !
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui está um resumo das escolas, livros e licenças relacionados à sua
          secretaria.
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
              title="Adicionar Escola"
              description="Cadastre uma nova instituição de ensino no sistema."
              href="/admin/schools/form"
              icon={PlusCircle}
              theme={themeColors.schools}
            />
            <ActionCard
              title="Gerenciar Licenças"
              description="Visualize suas Licenças Recebidas"
              href="/admin/licenses"
              icon={Layers}
              theme={themeColors.licenses}
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              href="/admin/schools"
              title="Escolas"
              value={stats.publicSchools}
              icon={School}
              colorClass={themeColors.schools.text}
              isLoading={isLoading}
            />

            {/* --- MODIFICAÇÃO 4: Conectar o valor do card com o estado --- */}
            <StatCard
              href="/admin/licenses"
              title="Licenças Recebidas"
              value={stats.receivedLicenses}
              icon={Layers}
              colorClass={themeColors.licenses.text}
              isLoading={isLoading}
            />

            <StatCard
              href="/admin/licenses"
              title="Licenças Enviadas"
              value={0} // TODO: Conectar com o backend
              icon={Layers}
              colorClass={themeColors.licenses.text}
              isLoading={isLoading}
            />
            <StatCard
              href="/admin/users?filter=student"
              title="Alunos Ativos"
              value={0} // TODO: Conectar com o backend
              icon={Users}
              colorClass={themeColors.students.text}
              isLoading={isLoading}
            />
            <StatCard
              href="/admin/users?filter=teacher"
              title="Professores Ativos"
              value={0} // TODO: Conectar com o backend
              icon={UserCheck}
              colorClass={themeColors.teachers.text}
              isLoading={isLoading}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
