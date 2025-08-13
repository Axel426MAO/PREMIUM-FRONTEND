"use client";

import { useState, useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";

// --- COMPONENTES UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// --- ÍCONES ---
import { Search, BookText, Calendar, Building, BookOpen } from "lucide-react";

// --- API ---
import { getBooks, deleteBook, getFiles, type Book } from "./services/api";
import SecurePdfViewer from "@/app/shared/components/SecurePdfViewer";

// --- COMPONENTE DO VISUALIZADOR DE PDF ---
// Importamos o componente corrigido que está no Canvas.
// Supondo que você salvou o arquivo em 'src/components/SecurePdfViewer.tsx'

// --- CONFIGURAÇÃO E CONSTANTES ---
const API_DOMAIN = "http://localhost:4000";

// --- FUNÇÕES AUXILIARES ---
const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
};

const isPdfFile = (fileName: string): boolean => {
  return /\.pdf$/i.test(fileName);
};

// =================================================================
//  COMPONENTE DO CARD DE LIVRO
// =================================================================
const BookCard: FC<{
  book: Book;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStartReading: (id: number) => void;
}> = ({ book, onEdit, onDelete, onStartReading }) => {
  const placeholderUrl = `https://placehold.co/400x400/1e293b/ffffff?text=${encodeURIComponent(
    book.title
  )}`;
  const displayUrl = book.coverUrl || placeholderUrl;

  // IMPORTANTE: Substitua esta linha pela sua lógica real de autenticação!
  const userType = "admin";

  return (
    <Card className="group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            src={displayUrl}
            alt={`Capa de ${book.title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/400x400/94a3b8/e2e8f0?text=Indisponível`;
            }}
          />
        </div>

        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            className="h-12 px-6 font-semibold text-base"
            onClick={() => onStartReading(book.id)}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Iniciar Leitura
          </Button>
        </div>
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
        <div className="border-t -mx-4 mt-3 mb-2"></div>
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
      </CardContent>
    </Card>
  );
};

export default function BookListPage() {
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingBookUrl, setReadingBookUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooksAndCovers = async () => {
      try {
        setIsLoading(true);
        const initialBooks = await getBooks();
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
          "Não foi possível carregar os livros. Verifique se a API está online."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooksAndCovers();
  }, []);

  const handleDeleteBook = async (id: number) => {
    // Substituindo window.confirm por um modal seria o ideal em uma app real
    if (confirm("Tem certeza que deseja excluir este livro?")) {
      try {
        await deleteBook(id);
        setAllBooks(allBooks.filter((book) => book.id !== id));
      } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao excluir o livro.");
      }
    }
  };

  const handleEditBook = (id: number) => {
    router.push(`/admin/books/form?id=${id}`);
  };

  const handleStartReading = async (bookId: number) => {
    try {
      const files = await getFiles("books", bookId);
      console.log(files);
      const pdfFile = files.find((file) => isPdfFile(file.name));
      if (pdfFile) {
        const url = new URL(pdfFile.file_path, API_DOMAIN).href;
        setReadingBookUrl(url);
      } else {
        alert("Nenhum arquivo PDF de leitura foi encontrado para este livro.");
      }
    } catch (error) {
      console.error("Erro ao buscar o arquivo do livro:", error);
      alert("Não foi possível carregar o arquivo do livro.");
    }
  };

  const FullScreenLoader = () => (
    <div className="flex items-center justify-center w-full h-full p-20">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-900"></div>
    </div>
  );

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return allBooks;
    return allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allBooks, searchQuery]);

  const Header = () => (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Acervo da Biblioteca
        </h1>
        <p className="text-muted-foreground mt-1">
          Conheça o acervo de Livros da Editora Premium.
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
      <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
        <Header />

        {isLoading ? (
          <FullScreenLoader />
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
                onStartReading={handleStartReading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold">Nenhum livro encontrado</h2>
            <p className="text-muted-foreground mt-2">
              Tente uma busca diferente ou adicione um novo livro.
            </p>
          </div>
        )}
      </main>

      {/* A mágica acontece aqui: renderiza o componente importado quando a URL estiver definida */}
      {readingBookUrl && (
        <SecurePdfViewer
          pdfUrl={readingBookUrl}
          onClose={() => setReadingBookUrl(null)}
          title="Leitor"
        />
      )}
    </>
  );
}
