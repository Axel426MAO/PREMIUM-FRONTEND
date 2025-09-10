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
  Building2,
  Landmark, // Ícone para escola privada
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BookLecture {
  book: string;
  lectures: number;
}

interface ReadingTime {
  month: string;
  "Tempo Médio (min)": number;
}

interface PopularGenre {
  name: string;
  value: number;
}

const mostReadBooksData: BookLecture[] = [
  { book: "O Pequeno Príncipe", lectures: 485 },
  { book: "A Culpa é das Estrelas", lectures: 392 },
  { book: "Dom Casmurro", lectures: 351 },
  { book: "Harry Potter", lectures: 289 },
  { book: "O Alquimista", lectures: 254 },
];

const readingTimeData: ReadingTime[] = [
  { month: "Março", "Tempo Médio (min)": 28 },
  { month: "Abril", "Tempo Médio (min)": 35 },
  { month: "Maio", "Tempo Médio (min)": 42 },
  { month: "Junho", "Tempo Médio (min)": 38 },
  { month: "Julho", "Tempo Médio (min)": 51 },
  { month: "Agosto", "Tempo Médio (min)": 45 },
];

const popularGenresData: PopularGenre[] = [
  { name: "Ficção", value: 45 },
  { name: "Romance", value: 25 },
  { name: "Aventura", value: 15 },
  { name: "Biografia", value: 10 },
  { name: "Outros", value: 5 },
];

interface MostReadBooksChartProps {
  data: BookLecture[];
}
interface PopularGenresChartProps {
  data: PopularGenre[];
}
interface ReadingTimeChartProps {
  data: ReadingTime[];
}

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

function MostReadBooksChart({ data }: MostReadBooksChartProps) {
  const chartData: ChartData<"bar"> = {
    labels: data.map((item) => item.book),
    datasets: [
      {
        label: "Leituras",
        data: data.map((item) => item.lectures),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(200, 200, 200, 0.1)" } },
      x: { grid: { display: false } },
    },
  };
  return <Bar options={options} data={chartData} />;
}

function PopularGenresChart({ data }: PopularGenresChartProps) {
  const chartData: ChartData<"doughnut"> = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Leituras por Gênero",
        data: data.map((item) => item.value),
        backgroundColor: [
          "#3498db",
          "#9b59b6",
          "#e74c3c",
          "#f1c40f",
          "#2ecc71",
        ],
        borderColor: "#111827",
        borderWidth: 0,
      },
    ],
  };
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { boxWidth: 20, padding: 15 },
      },
    },
    cutout: "60%",
  };
  return <Doughnut options={options} data={chartData} />;
}

function ReadingTimeChart({ data }: ReadingTimeChartProps) {
  const chartData: ChartData<"line"> = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Tempo Médio (min)",
        data: data.map((item) => item["Tempo Médio (min)"]),
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.4,
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
      },
    ],
  };
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: false, grid: { color: "rgba(200, 200, 200, 0.1)" } },
      x: { grid: { display: false } },
    },
  };
  return <Line options={options} data={chartData} />;
}

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
          <div className="flex align-bottom ">
            <p className="text-3xl font-bold">{isLoading ? "..." : value}</p>{" "}
            {!isLoading && (
              <span className="flex items-center pl-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3 mr-1" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Total de registros.</p>
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
          getSchools(),
        ]);

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
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">
          Bem-vindo
          {responsibleName
            ? `, ${responsibleName.trim().split(" ").slice(0, 2).join(" ")}`
            : ""}
          !
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui está um resumo rápido da atividade no seu sistema.
        </p>
      </header>

      <div className="">
        <section aria-labelledby="acoes-rapidas-heading">
          <section aria-labelledby="acoes-rapidas-heading">
            <h2
              id="acoes-rapidas-heading"
              className="mb-4 text-2xl font-semibold tracking-tight text-foreground"
            >
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                title="Cadastrar Secretaria"
                description="Cadastrar uma nova secretaria no sistema."
                href="/admin/secretary/form"
                icon={Landmark}
                theme={themeColors.secretaries}
              />
              <ActionCard
                title="Cadastrar Escola"
                description="Cadastrar uma nova instituição de ensino."
                href="/admin/schools/form"
                icon={School}
                theme={themeColors.schools}
              />
              <ActionCard
                title="Cadastrar Livro"
                description="Cadastrar um novo livro."
                href="/admin/books/form"
                icon={Book}
                theme={themeColors.books}
              />
              <ActionCard
                title="Criar Licenças"
                description="Criar novo lote de licenças."
                href="/admin/licenses/form"
                icon={KeyRound}
                theme={themeColors.licenses}
              />
            </div>
          </section>
        </section>

        <section aria-labelledby="visao-geral-heading">
          <h2
            id="visao-geral-heading"
            className="text-[24px] font-semibold tracking-tight text-foreground mb-4 mt-4"
          >
            Visão Geral
          </h2>
          {/* MODIFICAÇÃO 6: Grid ajustado para 6 colunas em telas grandes */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <StatCard
              href="/admin/secretary"
              title="Total de Secretarias"
              value={stats.secretaries}
              icon={Building}
              isLoading={isLoading}
              colorClass={themeColors.secretaries.text}
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

            <StatCard
              href="/admin/users"
              title="Total de Usuários"
              value={stats.users}
              icon={Users}
              isLoading={isLoading}
              colorClass={themeColors.users.text}
            />
            <StatCard
              href="/admin/books"
              title="Total de Livros"
              value={stats.books}
              icon={Book}
              isLoading={isLoading}
              colorClass={themeColors.books.text}
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
          </div>
        </section>
      </div>

      <section aria-labelledby="analises-heading">
        <h2
          id="analises-heading"
          className="mb-4 mt-4 text-[24px] font-semibold tracking-tight text-foreground"
        >
          Análises de Leitura
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Livros Mais Lidos</CardTitle>
              <CardDescription>
                Top 5 livros mais acessados no último mês.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[350px]">
                <MostReadBooksChart data={mostReadBooksData} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gêneros Populares</CardTitle>
              <CardDescription>
                Distribuição de leituras por gênero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[350px]">
                <PopularGenresChart data={popularGenresData} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Média de Tempo de Leitura</CardTitle>
              <CardDescription>
                Evolução do tempo médio de leitura diária por usuário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[300px]">
                <ReadingTimeChart data={readingTimeData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
