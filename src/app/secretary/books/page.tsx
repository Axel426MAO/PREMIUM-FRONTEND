"use client";

import { useState, useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";

// --- COMPONENTES UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- ÍCONES ---
import {
  Search,
  BookText,
  Calendar,
  Building,
  BookOpen,
  Lock,
} from "lucide-react";

// --- API ---
import {
  getBooksForSecretary,
  getFiles,
  type BookWithAccess,
} from "./services/api";
import SecurePdfViewer from "@/app/shared/components/SecurePdfViewer";
import { toast } from "sonner";

// --- CONFIGURAÇÃO E CONSTANTES ---
const API_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL_WITHOUTH_SUFIX;

// --- FUNÇÕES AUXILIARES ---
const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
};

const isPdfFile = (fileName: string): boolean => {
  return /\.pdf$/i.test(fileName);
};

// =================================================================
//  COMPONENTE DO CARD DE LIVRO (MODIFICADO)
// =================================================================
const BookCard: FC<{
  book: BookWithAccess;
  onStartReading: (book: BookWithAccess) => void;
}> = ({ book, onStartReading }) => {
  const placeholderUrl = `https://placehold.co/400x400/1e29b/ffffff?text=${encodeURIComponent(
    book.title
  )}`;
  const displayUrl = book.coverUrl || placeholderUrl;

  return (
    <Card className="group p-0 flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            src={displayUrl}
            alt={`Capa de ${book.title}`}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              !book.hasAccess ? "grayscale" : ""
            }`}
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/400x400/94a3b8/e2e8f0?text=Indisponível`;
            }}
          />
        </div>

        {/* Overlay para livros sem acesso (visual mantido) */}
        {!book.hasAccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/20">
            <Lock className="h-12 w-12 text-white/80" />
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3
            className="font-semibold text-base leading-tight line-clamp-2"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>
        <div className="border-t -mx-4 mt-4 mb-4"></div>
        <div className="space-y-2 text-xs text-muted-foreground">
          {book.publisher && (
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{book.publisher}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{book.year_launch}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookText className="h-3 w-3" />
              <span>{book.pages} páginas</span>
            </div>
          </div>
        </div>
        <Button
          className="w-full mt-4"
          onClick={() => onStartReading(book)}
          disabled={!book.hasAccess}
        >
          {book.hasAccess ? (
            <BookOpen className="mr-2 h-4 w-4" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {/* Texto do botão modificado conforme solicitado */}
          {book.hasAccess ? "Iniciar Leitura" : "Iniciar Leitura"}
        </Button>
      </CardContent>
    </Card>
  );
};

// =================================================================
// COMPONENTE PRINCIPAL DA PÁGINA (MODIFICADO)
// =================================================================
export default function BookListPage() {
  const router = useRouter();
  const { user } = useUserStore(); // Pega o usuário logado
  const [allBooks, setAllBooks] = useState<BookWithAccess[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingBook, setReadingBook] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const fetchBooksForSecretary = async () => {
      if (!user?.responsible?.secretary?.id) {
        setError(
          "ID da secretaria não encontrado. Não é possível carregar os livros."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const secretaryId = user.responsible.secretary.id;
        const initialBooks = await getBooksForSecretary(secretaryId);

        const booksWithCovers = await Promise.all(
          initialBooks.map(async (book) => {
            try {
              const files = await getFiles("books", book.id);
              const coverFile = files.find((file) => isImageFile(file.name));
              if (coverFile) {
                return {
                  ...book,
                  coverUrl: new URL(coverFile.file_path, API_DOMAIN).href,
                };
              }
            } catch (fileError) {
              console.error(
                `Falha ao buscar capa para o livro ${book.id}:`,
                fileError
              );
            }
            return book;
          })
        );
        setAllBooks(booksWithCovers);
        setError(null);
      } catch (err) {
        setError(
          "Não foi possível carregar os livros. Verifique a conexão com a API."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      // Garante que a busca só comece quando o usuário estiver carregado
      fetchBooksForSecretary();
    }
  }, [user]);

  const handleStartReading = async (book: BookWithAccess) => {
    if (!book.hasAccess) {
      // Ação futura para solicitar licença pode ser adicionada aqui
      toast.info("Função para solicitar licença ainda não implementada.");
      return;
    }
    try {
      const files = await getFiles("books", book.id);
      const pdfFile = files.find((file) => isPdfFile(file.name));
      if (pdfFile) {
        const url = new URL(pdfFile.file_path, API_DOMAIN).href;
        setReadingBook({ url: url, title: book.title });
      } else {
        alert("Nenhum arquivo PDF de leitura foi encontrado para este livro.");
      }
    } catch (error) {
      console.error("Erro ao buscar o arquivo do livro:", error);
      alert("Não foi possível carregar o arquivo do livro.");
    }
  };

  // --- MODIFICAÇÃO: Lógica para filtrar e ordenar em uma única lista ---
  const filteredAndSortedBooks = useMemo(() => {
    return allBooks
      .filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Coloca os livros com acesso (`hasAccess: true`) no início da lista
        if (a.hasAccess && !b.hasAccess) return -1;
        if (!a.hasAccess && b.hasAccess) return 1;
        return 0;
      });
  }, [allBooks, searchQuery]);

  const FullScreenLoader = () => (
    <div className="flex items-center justify-center w-full h-full p-20">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
    </div>
  );

  const Header = () => (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Biblioteca Digital
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore os livros disponíveis para sua secretaria.
        </p>
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título ou autor..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

  return (
    <>
      <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
        <Header />

        {isLoading ? (
          <FullScreenLoader />
        ) : (
          // --- MODIFICAÇÃO: Renderiza uma única seção com todos os livros ---
          <section>
            {filteredAndSortedBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onStartReading={handleStartReading}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-xl font-semibold">Nenhum livro encontrado</h2>
                <p className="text-muted-foreground mt-2">
                  Não há livros correspondentes à sua busca no acervo.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {readingBook && (
        <SecurePdfViewer
          pdfUrl={readingBook.url}
          title={readingBook.title}
          onClose={() => setReadingBook(null)}
        />
      )}
    </>
  );
}
