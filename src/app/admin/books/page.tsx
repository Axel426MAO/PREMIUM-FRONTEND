"use client";

import { useState, useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";

// --- COMPONENTES UI ---
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

// --- ÍCONES ---
import {
  Search,
  BookText,
  Calendar,
  Building,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  PlusCircle,
  BookX,
  FileText,
  X,
} from "lucide-react";

// --- API ---
import { getBooks, deleteBook, getFiles, type Book } from "./services/api";
import SecurePdfViewer from "@/app/shared/components/SecurePdfViewer";

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
//  COMPONENTE DE CARD PARA DESKTOP (INTOCADO)
// =================================================================
const BookCard: FC<{
  book: Book;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStartReading: (book: Book) => void;
  onViewSummary: (book: Book) => void;
}> = ({ book, onEdit, onDelete, onStartReading, onViewSummary }) => {
  const placeholderUrl = `https://placehold.co/400x550/111827/ffffff?text=${encodeURIComponent(
    book.title
  )}`;
  const displayUrl = book.coverUrl || placeholderUrl;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5">
      <div className="relative">
        <div className="aspect-[3.6/5] w-full overflow-hidden bg-slate-900">
          <img
            src={displayUrl}
            alt={`Capa de ${book.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/400x550/334155/e2e8f0?text=Indisponível`;
            }}
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center  gap-4 bg-black/75 p-4 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
          <button
            className="flex w-full items-center justify-center gap-2 cursor-pointer dark:text-white rounded-md bg-card py-2.5 text-sm font-semibold text-black transition-colors "
            onClick={() => onStartReading(book)}
          >
            <BookOpen className="h-5 w-5" />
            <span>Iniciar Leitura</span>
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-md bg-slate-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            onClick={() => onViewSummary(book)}
          >
            <FileText className="h-5 w-5" />
            <span>Ver Resumo</span>
          </button>
        </div>
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/40 text-white backdrop-blur-lg hover:bg-black/60"
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
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                onClick={() => onDelete(book.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-grow flex-col p-2 pb-4">
        <div className="flex-grow">
          <h3
            className="line-clamp-1 font-bold leading-tight text-sm"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {book.author}
          </p>
        </div>
        <div className="mt-3 border-t pt-3">
          <div className="space-y-2 text-xs text-muted-foreground">
            {book.publisher && (
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{book.publisher}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{book.year_launch}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookText className="h-3.5 w-3.5" />
                <span>{book.pages} páginas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
//  NOVO COMPONENTE: CAPA DE LIVRO PARA O GRID MOBILE (COM FOOTER)
// =================================================================
const MobileBookCover: FC<{ book: Book; onSelect: (book: Book) => void }> = ({
  book,
  onSelect,
}) => {
  const displayUrl =
    book.coverUrl ||
    `https://placehold.co/400x550/111827/ffffff?text=${encodeURIComponent(
      book.title
    )}`;

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg bg-card shadow-md transition-transform duration-300 hover:scale-105"
      onClick={() => onSelect(book)}
    >
      <img
        src={displayUrl}
        alt={`Capa de ${book.title}`}
        className="aspect-[3.6/5] w-full object-cover"
        onError={(e) => {
          e.currentTarget.src = `https://placehold.co/400x550/334155/e2e8f0?text=Indisponível`;
        }}
      />
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-card-foreground">
          {book.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
      </div>
    </div>
  );
};

// =================================================================
//  NOVO COMPONENTE: PAINEL DE DETALHES PARA MOBILE
// =================================================================
const MobileBookDetailSheet: FC<{
  book: Book;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStartReading: (book: Book) => void;
  onViewSummary: (book: Book) => void;
}> = ({ book, onClose, onEdit, onDelete, onStartReading, onViewSummary }) => (
  <div
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full rounded-t-2xl border-t bg-card shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <div className="mx-auto -mt-2 mb-2 h-1.5 w-12 rounded-full bg-muted"></div>
        <div className="flex gap-4">
          <img
            src={book.coverUrl ?? ""}
            alt={`Capa de ${book.title}`}
            className="h-32 w-auto flex-shrink-0 rounded-md object-cover shadow-md"
          />
          <div className="flex-grow">
            <h2 className="text-lg font-bold leading-tight">{book.title}</h2>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {book.year_launch}
              </span>
              <span className="flex items-center gap-1.5">
                <BookText className="h-3.5 w-3.5" />
                {book.pages} pág.
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            className="h-11 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => onStartReading(book)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Ler
          </Button>
          <Button
            className="h-11 bg-slate-600 text-white hover:bg-slate-700"
            onClick={() => onViewSummary(book)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Resumo
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center rounded-b-2xl border-t bg-muted/50 px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(book.id)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={() => onDelete(book.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </div>
    </div>
  </div>
);

// =================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// =================================================================
export default function BookListPage() {
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingBook, setReadingBook] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [summaryBook, setSummaryBook] = useState<Book | null>(null);
  const [selectedMobileBook, setSelectedMobileBook] = useState<Book | null>(
    null
  ); // Estado para o painel mobile

  useEffect(() => {
    const fetchBooksAndCovers = async () => {
      /* ... Lógica de fetch ... */ try {
        setIsLoading(true);
        const i = await getBooks();
        const t = await Promise.all(
          i.map(async (o) => {
            try {
              const e = await getFiles("books", o.id),
                n = e.find((r) => isImageFile(r.name));
              if (n)
                return {
                  ...o,
                  coverUrl: new URL(n.file_path, API_DOMAIN).href,
                };
            } catch (e) {
              console.error(`Falha ao buscar capa para o livro ${o.id}:`, e);
            }
            return o;
          })
        );
        setAllBooks(t);
        setError(null);
      } catch (o) {
        setError(
          "Não foi possível carregar os livros. Verifique sua conexão com a API."
        );
        console.error(o);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooksAndCovers();
  }, []);

  const handleDeleteBook = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este livro?")) {
      try {
        await deleteBook(id);
        setAllBooks(allBooks.filter((b) => b.id !== id));
        setSelectedMobileBook(null);
      } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao excluir o livro.");
      }
    }
  };
  const handleEditBook = (id: number) => {
    setSelectedMobileBook(null);
    router.push(`/admin/books/form?id=${id}`);
  };
  const handleStartReading = async (book: Book) => {
    try {
      const files = await getFiles("books", book.id);
      const pdfFile = files.find((f) => isPdfFile(f.name));
      if (pdfFile) {
        const url = new URL(pdfFile.file_path, API_DOMAIN).href;
        setReadingBook({ url, title: book.title });
        setSelectedMobileBook(null);
      } else {
        alert("Nenhum arquivo PDF foi encontrado para este livro.");
      }
    } catch (error) {
      console.error("Erro ao buscar o arquivo do livro:", error);
      alert("Não foi possível carregar o arquivo do livro.");
    }
  };
  const handleViewSummary = (book: Book) => {
    setSummaryBook(book);
    setSelectedMobileBook(null);
  };
  const handleMobileBookSelect = (book: Book) => {
    setSelectedMobileBook(book);
  };

  const FullScreenLoader = () => (
    <div className="flex h-full w-full flex-grow items-center justify-center p-20">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
    </div>
  );
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return allBooks;
    const query = searchQuery.toLowerCase();
    return allBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
    );
  }, [allBooks, searchQuery]);
  const Header = () => (
    <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Acervo da Biblioteca
        </h1>
        <p className="mt-1 text-muted-foreground">
          Navegue, adicione e gerencie os livros do seu acervo.
        </p>
      </div>
      <div className="flex w-full items-center gap-2 md:w-auto">
        <div className="relative w-full flex-grow md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título ou autor..."
            className="w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push("/admin/books/form")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Cadastrar</span>
        </Button>
      </div>
    </div>
  );
  const EmptyState = () => (
    <div className="flex flex-grow flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card py-20 text-center">
      <BookX className="h-16 w-16 text-muted-foreground" />
      <h2 className="mt-6 text-xl font-semibold">Nenhum livro encontrado</h2>
      <p className="mt-2 text-muted-foreground">
        Tente uma busca diferente ou adicione um novo livro ao acervo.
      </p>
    </div>
  );
  const SummaryModal: FC<{ book: Book; onClose: () => void }> = ({
    book,
    onClose,
  }) => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-card text-card-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold">{book.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
          <div className="my-4 h-px bg-border" />
          <p className="max-h-[50vh] overflow-y-auto pr-3 text-card-foreground/90">
            {book.summary || "Este livro não possui um resumo disponível."}
          </p>
        </div>
        <div className="flex justify-end rounded-b-lg border-t bg-muted/50 p-3">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;

  return (
    <>
      <main className="flex min-h-screen flex-1 flex-col bg-slate-50 p-4 dark:bg-slate-950 md:p-8">
        <Header />
        {isLoading ? (
          <FullScreenLoader />
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredBooks.map((book) => (
              <div key={book.id}>
                <div className="sm:hidden">
                  <MobileBookCover
                    book={book}
                    onSelect={handleMobileBookSelect}
                  />
                </div>
                <div className="hidden sm:block">
                  <BookCard
                    book={book}
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                    onStartReading={handleStartReading}
                    onViewSummary={handleViewSummary}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Modais e Painéis */}
      {readingBook && (
        <SecurePdfViewer
          pdfUrl={readingBook.url}
          title={readingBook.title}
          onClose={() => setReadingBook(null)}
        />
      )}
      {summaryBook && (
        <SummaryModal book={summaryBook} onClose={() => setSummaryBook(null)} />
      )}
      {selectedMobileBook && (
        <MobileBookDetailSheet
          book={selectedMobileBook}
          onClose={() => setSelectedMobileBook(null)}
          onEdit={handleEditBook}
          onDelete={handleDeleteBook}
          onStartReading={handleStartReading}
          onViewSummary={handleViewSummary}
        />
      )}
    </>
  );
}
