"use client";

import { useState, useEffect, useCallback } from "react";
import type { FC } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Square,
} from "lucide-react";

// Estilos essenciais para o react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configuração do worker local
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// Definição das propriedades do componente
interface SecurePdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

// Classe de estilo reutilizável para botões de ícone
const iconButtonClasses =
  "p-2 rounded-full transition-colors duration-200 hover:bg-black/20 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-white/50";

// Componente Principal
export default function SecurePdfViewer({
  pdfUrl,
  title,
  onClose,
}: SecurePdfViewerProps) {
  // --- STATES ---
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [layout, setLayout] = useState<"single" | "double">("single");
  const [isMobile, setIsMobile] = useState(false);

  // --- HOOKS ---

  // Efeito para salvar e carregar o progresso da leitura
  useEffect(() => {
    const savedPage = localStorage.getItem(`pdf_progress_${pdfUrl}`);
    if (savedPage) setPageNumber(parseInt(savedPage, 10));
  }, [pdfUrl]);

  useEffect(() => {
    if (numPages)
      localStorage.setItem(`pdf_progress_${pdfUrl}`, String(pageNumber));
  }, [pageNumber, numPages, pdfUrl]);

  // Efeito para bloquear atalhos de teclado (Segurança)
  useEffect(() => {
    const handleSecurityKeys = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "p" || event.key === "s")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleSecurityKeys);
    return () => window.removeEventListener("keydown", handleSecurityKeys);
  }, []);

  // --- FUNÇÕES ---

  if (!(URL as any).parse) {
    (URL as any).parse = function (val: string) {
      try {
        return new window.URL(val, window.location.href);
      } catch {
        return null;
      }
    };
  }

  // Callback executado quando o documento PDF é carregado com sucesso
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      const savedPage = localStorage.getItem(`pdf_progress_${pdfUrl}`);
      setPageNumber(savedPage ? parseInt(savedPage, 10) : 1);
    },
    [pdfUrl]
  );

  // Função para mudar de página (para frente ou para trás)
  const changePage = useCallback(
    (offset: number) => {
      const pageIncrement = layout === "double" && !isMobile ? 2 : 1;
      setPageNumber((prev) =>
        Math.max(1, Math.min(prev + offset * pageIncrement, numPages || 1))
      );
    },
    [layout, isMobile, numPages]
  );

  // Efeito para navegação com setas do teclado (UX)
  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") changePage(1);
      else if (event.key === "ArrowLeft") changePage(-1);
    };
    window.addEventListener("keydown", handleArrowKeys);
    return () => window.removeEventListener("keydown", handleArrowKeys);
  }, [changePage]);

  // Função para ir a uma página específica (usada pelo slider)
  const goToPage = (page: number) => {
    setPageNumber(Math.max(1, Math.min(page, numPages || 1)));
  };

  // Função para controlar o zoom
  const handleZoom = (direction: "in" | "out") => {
    setScale((prev) => {
      const newScale = direction === "in" ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(newScale, 3));
    });
  };

  // --- LÓGICA DE RENDERIZAÇÃO ---
  const isDoubleLayout =
    layout === "double" && !isMobile && numPages && numPages > 1;
  const currentLeftPage = isDoubleLayout ? pageNumber : null;
  const currentRightPage = isDoubleLayout
    ? pageNumber + 1 <= numPages
      ? pageNumber + 1
      : null
    : pageNumber;

  // --- JSX ---
  return (
    <>
      {/* Bloco de CSS para segurança (anti-impressão) e usabilidade (sem seleção) */}
      <style jsx global>{`
        @media print {
          body * {
            display: none !important;
          }
          body::before {
            content: "A impressão desta página não é permitida.";
            color: black;
            font-size: 24px;
            text-align: center;
            padding: 50px;
            display: block;
          }
        }
        .no-select {
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-2 md:p-4 bg-[#F5F1E8] text-gray-800 animate-in fade-in-0 no-select"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Cabeçalho */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm shadow-sm text-gray-700 z-30">
          <div className="flex-1 text-left">
            <h2
              className="text-base md:text-lg font-semibold truncate"
              title={title}
            >
              {title}
            </h2>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center gap-4">
            <button
              onClick={() => handleZoom("out")}
              className={iconButtonClasses}
              aria-label="Diminuir zoom"
            >
              <ZoomOut />
            </button>
            <button
              onClick={() =>
                setLayout((prev) => (prev === "single" ? "double" : "single"))
              }
              className={iconButtonClasses}
              title={layout === "single" ? "Página Dupla" : "Página Única"}
              aria-label={
                layout === "single"
                  ? "Ativar página dupla"
                  : "Ativar página única"
              }
            >
              {layout === "single" ? <BookOpen /> : <Square />}
            </button>
            <button
              onClick={() => handleZoom("in")}
              className={iconButtonClasses}
              aria-label="Aumentar zoom"
            >
              <ZoomIn />
            </button>
          </div>
          <div className="flex-1 text-right">
            <button
              onClick={onClose}
              className={iconButtonClasses}
              aria-label="Fechar Leitor"
            >
              <X />
            </button>
          </div>
        </header>

        {/* Área de Leitura Principal */}
        <main className="relative flex-grow w-full flex items-center justify-center overflow-hidden mt-14 mb-20 md:mb-24">
          <div
            className="absolute left-0 top-0 h-full w-1/4 cursor-pointer z-10"
            onClick={() => changePage(-1)}
          ></div>
          <div
            className="absolute right-0 top-0 h-full w-1/4 cursor-pointer z-10"
            onClick={() => changePage(1)}
          ></div>

          <div className="relative overflow-auto max-w-full max-h-full">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<p className="text-lg">Carregando livro...</p>}
              error={<p className="text-red-500">Falha ao carregar o PDF.</p>}
            >
              <div
                className="flex justify-center items-center gap-4"
                style={{ transform: `scale(${scale})` }}
              >
                {isDoubleLayout ? (
                  <>
                    {currentLeftPage && (
                      <Page
                        key={`page_${currentLeftPage}`}
                        pageNumber={currentLeftPage}
                        renderTextLayer={false}
                        className="shadow-2xl"
                        loading={<div className="p-8">Carregando...</div>}
                      />
                    )}
                    {currentRightPage && (
                      <Page
                        key={`page_${currentRightPage}`}
                        pageNumber={currentRightPage}
                        renderTextLayer={false}
                        className="shadow-2xl"
                        loading={<div className="p-8">Carregando...</div>}
                      />
                    )}
                  </>
                ) : (
                  <Page
                    key={`page_${pageNumber}`}
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    className="shadow-2xl"
                    loading={<div className="p-8">Carregando...</div>}
                  />
                )}
              </div>
            </Document>
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            ></div>
          </div>
        </main>

        {/* Rodapé */}
        {numPages && (
          <footer className="absolute bottom-0 left-0 right-0 p-3 bg-white/50 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 z-30">
            <div className="hidden md:flex w-full max-w-2xl items-center gap-4">
              <button
                onClick={() => changePage(-1)}
                className={iconButtonClasses}
                aria-label="Página anterior"
              >
                <ChevronLeft />
              </button>
              <input
                type="range"
                min="1"
                max={numPages}
                value={pageNumber}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
              />
              <button
                onClick={() => changePage(1)}
                className={iconButtonClasses}
                aria-label="Próxima página"
              >
                <ChevronRight />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Página {pageNumber}
              {isDoubleLayout && currentRightPage
                ? `-${currentRightPage}`
                : ""}{" "}
              de {numPages}
            </p>
          </footer>
        )}
      </div>
    </>
  );
}
