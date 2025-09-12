"use client";

// --- IMPORTS ---
import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,      // Ícone para livros lidos
  Target,        // Ícone para metas
  Sparkles,      // Ícone para novos lançamentos
  Library,       // Ícone para a biblioteca
  ArrowRight,    // Ícone de seta
  Star           // Ícone para destaques/principais
} from "lucide-react";

// Store (Mantido caso precise do nome do usuário)
import { useUserStore } from "../store/userStore";


// --- DADOS MOCKADOS COM LIVROS REAIS ---

// Simula o livro que o aluno está lendo atualmente
const currentReading = {
  id: "OL2737380W", // Open Library ID
  title: "O Pequeno Príncipe",
  author: "Antoine de Saint-Exupéry",
  coverUrl: "https://m.media-amazon.com/images/I/81VZTl16z4L._UF1000,1000_QL80_.jpg",
  progress: 65,
};

// Simula uma lista de livros em destaque ou recomendados (Clássicos Brasileiros)
const featuredBooks = [
  { id: "OL24391695M", title: "Dom Casmurro", author: "Machado de Assis", coverUrl: "https://m.media-amazon.com/images/I/61Z2bMhGicL.jpg" },
  { id: "OL4688126M", title: "Capitães da Areia", author: "Jorge Amado", coverUrl: "https://m.media-amazon.com/images/I/816CKGW3kXL.jpg" },
  { id: "OL24354228M", title: "O Auto da Compadecida", author: "Ariano Suassuna", coverUrl: "https://m.media-amazon.com/images/M/MV5BOGExNzZlMWMtOWY5OC00NjFhLTljOGYtM2MxMTViYTI4ZDQ5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg" },
  { id: "OL26339893M", title: "Vidas Secas", author: "Graciliano Ramos", coverUrl: "https://cdn.awsli.com.br/800x800/1304/1304678/produto/255011060/a15bj0ux25l-_sl1500_-8f8nm4t8tp.jpg" },
  { id: "OL9087544M", title: "A Hora da Estrela", author: "Clarice Lispector", coverUrl: "https://m.media-amazon.com/images/I/61TaHURu27L._UF1000,1000_QL80_.jpg" },
];

// Simula uma lista de novos lançamentos (Best-sellers Modernos)
const newReleases = [
  { id: "OL33182285M", title: "Torto Arado", author: "Itamar Vieira Junior", coverUrl: "https://m.media-amazon.com/images/I/71GyHj5glWL._UF1000,1000_QL80_.jpg" },
  { id: "OL7376450M", title: "O Ladrão de Raios", author: "Rick Riordan", coverUrl: "https://br.web.img3.acsta.net/medias/nmedia/18/87/90/23/19962722.jpg" },
  { id: "OL25413348M", title: "Crime e Castigo", author: "F. Dostoéviski", coverUrl: "https://m.media-amazon.com/images/I/916WkSH4cGL.jpg" },
  { id: "OL24334947M", title: "Jogos Vorazes", author: "Suzanne Collins", coverUrl: "https://m.media-amazon.com/images/I/71WOkspHbOL._UF1000,1000_QL80_.jpg" },
];


// --- COMPONENTES AUXILIARES (Sem alterações) ---

function ReadingStatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground text-indigo-500" />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function BookCard({ book }: { book: { id: string; title: string; author: string; coverUrl: string } }) {
  return (
    <Link href={`/student/books/${book.id}`} className="block group w-40 flex-shrink-0">
      <div className="flex flex-col gap-2">
        <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
          <img
            src={book.coverUrl}
            alt={`Capa do livro ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div>
            <h3 className="font-semibold text-sm truncate group-hover:text-primary">{book.title}</h3>
            <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>
      </div>
    </Link>
  );
}

function ContinueReadingCard({ book }: { book: typeof currentReading }) {
    return (
        <Link href={`/student/books/${book.id}`} className="block group">
            <div className="rounded-xl border bg-card text-card-foreground p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 flex-shrink-0">
                    <img
                        src={book.coverUrl}
                        alt={`Capa do livro ${book.title}`}
                        className="rounded-md shadow-lg aspect-[2/3] object-cover bg-muted"
                        loading="lazy"
                    />
                </div>
                <div className="w-full">
                    <p className="text-xs text-primary font-semibold uppercase">CONTINUE LENDO</p>
                    <h3 className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">por {book.author}</p>
                    
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                            <span className="text-xs font-semibold text-primary">{book.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${book.progress}%` }}></div>
                        </div>
                    </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1 ml-auto hidden sm:block"/>
            </div>
        </Link>
    );
}


// --- COMPONENTE PRINCIPAL ---
export default function StudentDashboard() {
  const { user } = useUserStore();
  // Corrigido para pegar o nome do aluno diretamente e ter um fallback
  const studentName = user?.responsible?.name

  const readingStats = {
    readThisMonth: 3,
    readThisYear: 25,
    readingGoal: 50,
  };

  return (
    <main className="flex flex-1 flex-col p-6 md:p-10 md:py-6 bg-muted/20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Olá, {studentName!.trim().split(" ")[0]}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pronto para uma nova aventura literária?
        </p>
      </header>

      <div className="flex flex-col gap-10">
        
        <section aria-labelledby="progresso-heading">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <ReadingStatCard
              title="Livros lidos este mês"
              value={readingStats.readThisMonth}
              icon={BookOpen}
            />
            <ReadingStatCard
              title="Livros lidos em 2025"
              value={readingStats.readThisYear}
              icon={Library}
            />
            <ReadingStatCard
              title="Meta de Leitura Anual"
              value={`${readingStats.readThisYear} / ${readingStats.readingGoal}`}
              icon={Target}
            />
          </div>
        </section>

        <section aria-labelledby="continue-lendo-heading">
            <ContinueReadingCard book={currentReading} />
        </section>

        <section aria-labelledby="principais-livros-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="principais-livros-heading" className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Star className="text-amber-500 h-5 w-5"/>
              Clássicos para Você
            </h2>
            <Link href="/student/books/featured" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-6 px-6">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
        
        <section aria-labelledby="novos-lancamentos-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="novos-lancamentos-heading" className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="text-sky-500 h-5 w-5"/>
                Mais Populares
            </h2>
            <Link href="/student/books/new" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-6 px-6">
            {newReleases.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}