"use client";

import { useState, useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  BookText,
  Calendar,
  Building,
} from "lucide-react";
// Importações de API atualizadas
import {
  getBooks,
  deleteBook,
  getFiles,
  type Book,
  type ApiFile,
} from "./services/api";

// --- CONSTANTES E FUNÇÕES AUXILIARES ---
const API_DOMAIN = "http://localhost:3000";

// Função para verificar se um arquivo é uma imagem
const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
};

// --- COMPONENTE DO CARD DE LIVRO ---
const BookCard: FC<{
  book: Book;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ book, onEdit, onDelete }) => {
  // ✅ Lógica de URL atualizada para usar a 'coverUrl' ou um placeholder
  const placeholderUrl = `https://placehold.co/400x400/1e293b/ffffff?text=${encodeURIComponent(
    book.title
  )}`;
  const displayUrl = book.coverUrl || placeholderUrl;

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
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="h-8 w-8 p-0 rounded-full bg-background/70 backdrop-blur-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(book.id)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50 cursor-pointer"
                onClick={() => onDelete(book.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

// --- COMPONENTE PRINCIPAL (PÁGINA DA LISTA) ---
export default function BookListPage() {
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooksAndCovers = async () => {
      try {
        setIsLoading(true);
        // 1. Busca a lista inicial de livros
        const initialBooks = await getBooks();

        // 2. Para cada livro, busca a sua imagem de capa em paralelo
        const booksWithCovers = await Promise.all(
          initialBooks.map(async (book) => {
            try {
              const files = await getFiles("books", book.id);
              const coverFile = files.find((file) => isImageFile(file.name));

              if (coverFile) {
                // Adiciona a URL da capa ao objeto do livro
                return {
                  ...book,
                  coverUrl: new URL(coverFile.file_path, API_DOMAIN).href,
                };
              }
            } catch (fileError) {
              console.error(
                `Falha ao buscar arquivos para o livro ${book.id}:`,
                fileError
              );
            }
            // Retorna o livro original se não encontrar capa ou se houver erro
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
    if (window.confirm("Tem certeza que deseja excluir este livro?")) {
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

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return allBooks;
    return allBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allBooks, searchQuery]);

  if (isLoading) return <p className="text-center p-8">Carregando livros...</p>;
  if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Acervo da Biblioteca
          </h1>
          <p className="text-muted-foreground mt-1">
            Navegue, adicione e gerencie os livros do seu acervo.
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
          <Button onClick={() => router.push("/admin/books/form")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
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
  );
}
