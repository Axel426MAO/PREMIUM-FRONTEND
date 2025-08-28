"use client";

import { useState, useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";

// --- COMPONENTES UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- ÍCONES ---
import {
  Search,
  BookText,
  Calendar,
  Building,
  BookOpen,
  Lock,
  BookX,
  X,
  FileText, // Ícone para "Ver Resumo"
} from "lucide-react";

// --- API ---
import { getBooksForSecretary, getFiles, type BookWithAccess } from "./services/api";
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
//  COMPONENTE DE CARD PARA DESKTOP (COM "VER RESUMO")
// =================================================================
const BookCard: FC<{
  book: BookWithAccess;
  onStartReading: (book: BookWithAccess) => void;
  onViewSummary: (book: BookWithAccess) => void; // Prop para resumo
}> = ({ book, onStartReading, onViewSummary }) => {
  const placeholderUrl = `https://placehold.co/400x550/111827/ffffff?text=${encodeURIComponent(book.title)}`;
  const displayUrl = book.coverUrl || placeholderUrl;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5">
      <div className="relative">
        <div className="aspect-[3.6/5] w-full overflow-hidden bg-slate-900">
          <img
            src={displayUrl}
            alt={`Capa de ${book.title}`}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${!book.hasAccess ? "grayscale" : ""}`}
            onError={(e) => { e.currentTarget.src = `https://placehold.co/400x550/334155/e2e8f0?text=Indisponível`; }}
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 p-4 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
          <Button className="w-full bg-white text-black hover:bg-white" onClick={() => onStartReading(book)} disabled={!book.hasAccess}>
            {book.hasAccess ? <BookOpen className="mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
            Iniciar Leitura
          </Button>
          <Button variant="secondary" className="w-full bg-slate-600 text-white hover:bg-slate-700" onClick={() => onViewSummary(book)}>
            <FileText className="mr-2 h-5 w-5" />
            Ver Resumo
          </Button>
        </div>
      </div>
      <div className="flex flex-grow flex-col p-4">
        <div className="flex-grow">
          <h3 className="line-clamp-1 font-bold leading-tight text-sm" title={book.title}>{book.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{book.author}</p>
        </div>
        <div className="mt-4 border-t pt-3">
          <div className="space-y-2 text-xs text-muted-foreground">
            {book.publisher && (<div className="flex items-center gap-2"><Building className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{book.publisher}</span></div>)}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /><span>{book.year_launch}</span></div>
              <div className="flex items-center gap-2"><BookText className="h-3.5 w-3.5" /><span>{book.pages} páginas</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
//  COMPONENTE DE CAPA PARA MOBILE (SEM ALTERAÇÃO)
// =================================================================
const MobileBookCover: FC<{ book: BookWithAccess; onSelect: (book: BookWithAccess) => void }> = ({ book, onSelect }) => {
    // ... (este componente permanece o mesmo)
  const displayUrl = book.coverUrl || `https://placehold.co/400x550/111827/ffffff?text=${encodeURIComponent(book.title)}`;
  return (
    <div className="cursor-pointer overflow-hidden rounded-lg bg-card shadow-md transition-transform duration-300 hover:scale-105" onClick={() => onSelect(book)}>
      <div className="relative">
        <img src={displayUrl} alt={`Capa de ${book.title}`} className={`aspect-[3.6/5] w-full object-cover ${!book.hasAccess ? "grayscale" : ""}`} onError={(e) => { e.currentTarget.src = `https://placehold.co/400x550/334155/e2e8f0?text=Indisponível`; }}/>
        {!book.hasAccess && (<div className="absolute inset-0 flex items-center justify-center bg-black/40"><Lock className="h-6 w-6 text-white/80" /></div>)}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-card-foreground">{book.title}</p>
        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
      </div>
    </div>
  );
};

// =================================================================
//  PAINEL DE DETALHES PARA MOBILE (COM "VER RESUMO")
// =================================================================
const MobileBookDetailSheet: FC<{
  book: BookWithAccess;
  onClose: () => void;
  onStartReading: (book: BookWithAccess) => void;
  onViewSummary: (book: BookWithAccess) => void; // Prop para resumo
}> = ({ book, onClose, onStartReading, onViewSummary }) => (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full rounded-t-2xl border-t bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
      <div className="p-4">
        <div className="mx-auto -mt-2 mb-2 h-1.5 w-12 rounded-full bg-muted"></div>
        <div className="flex gap-4">
          <img src={book.coverUrl ?? ""} alt={`Capa de ${book.title}`} className={`h-32 w-auto flex-shrink-0 rounded-md object-cover shadow-md ${!book.hasAccess ? "grayscale" : ""}`} />
          <div className="flex-grow">
            <h2 className="text-lg font-bold leading-tight">{book.title}</h2>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{book.year_launch}</span>
              <span className="flex items-center gap-1.5"><BookText className="h-3.5 w-3.5" />{book.pages} pág.</span>
            </div>
          </div>
        </div>
        {/* Botões agora em grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
            <Button className="h-11 bg-blue-600 text-white hover:bg-blue-700" onClick={() => onStartReading(book)} disabled={!book.hasAccess}>
                {book.hasAccess ? <BookOpen className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                Ler
            </Button>
            <Button className="h-11 bg-slate-600 text-white hover:bg-slate-700" onClick={() => onViewSummary(book)}>
                <FileText className="mr-2 h-4 w-4" />
                Resumo
            </Button>
        </div>
      </div>
    </div>
  </div>
);

// =================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// =================================================================
export default function BookListPage() {
  const { user } = useUserStore();
  const [allBooks, setAllBooks] = useState<BookWithAccess[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingBook, setReadingBook] = useState<{ url: string; title: string } | null>(null);
  const [summaryBook, setSummaryBook] = useState<BookWithAccess | null>(null); // Estado para o modal de resumo
  const [selectedMobileBook, setSelectedMobileBook] = useState<BookWithAccess | null>(null);

  useEffect(() => {
    // ... (lógica de fetch permanece a mesma)
    const fetchBooksForSecretary = async () => { if (!user?.responsible?.secretary?.id) { setError("ID da secretaria não encontrado. Não é possível carregar os livros."); setIsLoading(false); return; } try { setIsLoading(true); const t=user.responsible.secretary.id,o=await getBooksForSecretary(t),e=await Promise.all(o.map(async s=>{try{const i=await getFiles("books",s.id),r=i.find(l=>isImageFile(l.name));if(r)return{...s,coverUrl:new URL(r.file_path,API_DOMAIN).href}}catch(i){console.error(`Falha ao buscar capa para o livro ${s.id}:`,i)}return s})); setAllBooks(e); setError(null)}catch(t){setError("Não foi possível carregar os livros. Verifique a conexão com a API."); console.error(t)}finally{setIsLoading(false)}}; if (user) {fetchBooksForSecretary();}
  }, [user]);

  const handleStartReading = async (book: BookWithAccess) => {
    // ... (lógica de iniciar leitura permanece a mesma)
    if (!book.hasAccess) { toast.info("Você não tem licença para ler este livro. Solicite ao administrador."); return; } try { setSelectedMobileBook(null); const t=await getFiles("books",book.id),o=t.find(e=>isPdfFile(e.name)); if (o) { const e=new URL(o.file_path,API_DOMAIN).href; setReadingBook({url:e,title:book.title})}else{toast.error("Nenhum arquivo PDF foi encontrado para este livro.")}}catch(t){console.error("Erro ao buscar o arquivo do livro:",t); toast.error("Não foi possível carregar o arquivo do livro.")}
  };

  // Nova função para ver o resumo
  const handleViewSummary = (book: BookWithAccess) => {
    setSummaryBook(book);
    setSelectedMobileBook(null); // Fecha o painel mobile se estiver aberto
  };

  const handleMobileBookSelect = (book: BookWithAccess) => { setSelectedMobileBook(book); };
  const filteredAndSortedBooks = useMemo(() => { return allBooks.filter((book) => book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => { if (a.hasAccess && !b.hasAccess) return -1; if (!a.hasAccess && b.hasAccess) return 1; return 0; }); }, [allBooks, searchQuery]);
  const FullScreenLoader = () => (<div className="flex h-full w-full flex-grow items-center justify-center p-20"><div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div></div>);
  const Header = () => (<div className="mb-8 flex flex-col items-center justify-between gap-4 border-b pb-4 md:flex-row"><div><h1 className="text-3xl font-bold tracking-tight text-foreground">Biblioteca Digital</h1><p className="mt-1 text-muted-foreground">Explore os livros disponíveis para sua secretaria.</p></div><div className="relative w-full flex-grow md:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" placeholder="Buscar por título ou autor..." className="w-full pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>);
  const EmptyState = () => (<div className="flex flex-grow flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card py-20 text-center"><BookX className="h-16 w-16 text-muted-foreground" /><h2 className="mt-6 text-xl font-semibold">Nenhum livro encontrado</h2><p className="mt-2 text-muted-foreground">Não há livros correspondentes à sua busca no acervo.</p></div>);
  
  // Componente do Modal de Resumo
  const SummaryModal: FC<{ book: BookWithAccess; onClose: () => void }> = ({ book, onClose }) => (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}><div className="relative w-full max-w-2xl rounded-lg bg-card text-card-foreground shadow-xl" onClick={(e) => e.stopPropagation()}><div className="p-6"><h2 className="text-2xl font-bold">{book.title}</h2><p className="mt-1 text-sm text-muted-foreground">{book.author}</p><div className="my-4 h-px bg-border" /><p className="max-h-[50vh] overflow-y-auto pr-3 text-card-foreground/90">{book.summary || "Este livro não possui um resumo disponível."}</p></div><div className="flex justify-end rounded-b-lg border-t bg-muted/50 p-3"><Button onClick={onClose} variant="outline">Fechar</Button></div><Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 rounded-full" onClick={onClose}><X className="h-4 w-4" /></Button></div></div>);
  
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;

  return (
    <>
      <main className="flex min-h-screen flex-1 flex-col bg-slate-50 p-4 dark:bg-slate-950 md:p-8">
        <Header />
        {isLoading ? (
          <FullScreenLoader />
        ) : (
          <section>
            {filteredAndSortedBooks.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredAndSortedBooks.map((book) => (
                  <div key={book.id}>
                    <div className="sm:hidden">
                      <MobileBookCover book={book} onSelect={handleMobileBookSelect} />
                    </div>
                    <div className="hidden sm:block">
                      <BookCard book={book} onStartReading={handleStartReading} onViewSummary={handleViewSummary}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        )}
      </main>

      {readingBook && (<SecurePdfViewer pdfUrl={readingBook.url} title={readingBook.title} onClose={() => setReadingBook(null)} />)}
      {summaryBook && (<SummaryModal book={summaryBook} onClose={() => setSummaryBook(null)} />)}
      {selectedMobileBook && (
        <MobileBookDetailSheet
          book={selectedMobileBook}
          onClose={() => setSelectedMobileBook(null)}
          onStartReading={handleStartReading}
          onViewSummary={handleViewSummary}
        />
      )}
    </>
  );
}