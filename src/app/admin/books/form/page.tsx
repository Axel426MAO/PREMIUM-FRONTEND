"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

// --- SHADCN/UI IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// --- API & TYPES ---
import {
  getBookById,
  createBook,
  updateBook,
  uploadFile,
  getFiles,
  deleteFile as apiDeleteFile,
  type BookData,
  type Book,
  type ApiFile,
} from "../services/api";

// --- TIPOS E CONSTANTES ---
const API_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL;
const ALLOWED_IMAGE_EXTENSIONS = ["svg", "png", "jpg", "jpeg"];
const ALLOWED_DOC_EXTENSIONS = ["pdf", "epub"];

const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
};

// --- SUBCOMPONENTES PARA ORGANIZAÇÃO ---

// Componente para o formulário de detalhes do livro
const BookDetailsCard = ({
  formData,
  handleInputChange,
  isLoading,
}: {
  formData: Partial<BookData>;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Informações do Livro</CardTitle>
      <CardDescription>
        Preencha as informações principais do livro.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="author">Autor</Label>
        <Input
          id="author"
          value={formData.author || ""}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pages">Nº de Páginas</Label>
          <Input
            id="pages"
            type="number"
            value={formData.pages || ""}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="year_launch">Ano de Lançamento</Label>
          <Input
            id="year_launch"
            type="number"
            value={formData.year_launch || ""}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="publisher">Editora</Label>
          <Input
            id="publisher"
            value={formData.publisher || ""}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            maxLength={13}
            id="isbn"
            value={formData.isbn || ""}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="summary">Resumo</Label>
        <Textarea
          id="summary"
          value={formData.summary || ""}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </div>
    </CardContent>
  </Card>
);

// Componente para os anexos e uploads
const AttachmentsCard = ({
  allPreviews,
  removeNewFile,
  deleteExistingFile,
  handleFileChange,
  isLoading,
  existingCoverImage,
  coverImageToUpload,
}: {
  allPreviews: any[];
  removeNewFile: (index: number, fileType: "cover" | "doc") => void;
  deleteExistingFile: (fileId: number, fileType: "cover" | "doc") => void;
  handleFileChange: (
    e: ChangeEvent<HTMLInputElement>,
    fileType: "cover" | "doc"
  ) => void;
  isLoading: boolean;
  existingCoverImage: any;
  coverImageToUpload: File | null;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Anexos</CardTitle>
      <CardDescription>
        Adicione a imagem da capa e os arquivos do livro (PDF, EPUB).
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-6">
      {allPreviews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {allPreviews.map((file) => (
            <div key={file.key} className="relative group aspect-square">
              {file.isImage ? (
                <Image
                  src={file.url}
                  alt={`Preview de ${file.name}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md bg-muted"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-md flex flex-col items-center justify-center p-2 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <p
                    className="text-xs text-muted-foreground mt-2 line-clamp-2"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() =>
                  file.isNew
                    ? removeNewFile(file.index!, file.type)
                    : deleteExistingFile(file.id!, file.type)
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label
          htmlFor="cover-input"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors data-[disabled]:opacity-50 "
          data-disabled={isLoading}
        >
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Cadastrar Capa</span>
            </p>
            <p className="text-xs text-muted-foreground">SVG, PNG, ou JPG</p>
          </div>
          <Input
            id="cover-input"
            type="file"
            className="hidden"
            onChange={(e) => handleFileChange(e, "cover")}
            accept=".svg, .png, .jpg, .jpeg"
            disabled={isLoading}
          />
        </label>
        <label
          htmlFor="doc-input"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors data-[disabled]:opacity-50 "
          data-disabled={isLoading}
        >
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Cadastrar Documentos</span>
            </p>
            <p className="text-xs text-muted-foreground">PDF ou EPUB</p>
          </div>
          <Input
            id="doc-input"
            type="file"
            className="hidden"
            onChange={(e) => handleFileChange(e, "doc")}
            multiple
            accept=".pdf, .epub"
            disabled={isLoading}
          />
        </label>
      </div>
    </CardContent>
  </Card>
);


// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function BookFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id");

  // --- ESTADOS DO COMPONENTE ---
  const [formData, setFormData] = useState<Partial<BookData>>({
    title: "",
    author: "",
    pages: 0,
    year_launch: new Date().getFullYear(),
    publisher: "",
    isbn: "",
    summary: "",
    description: "",
  });
  const [coverImageToUpload, setCoverImageToUpload] = useState<File | null>(
    null
  );
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [existingCoverImage, setExistingCoverImage] = useState<
    (ApiFile & { url: string }) | null
  >(null);
  const [docsToUpload, setDocsToUpload] = useState<File[]>([]);
  const [newDocPreviews, setNewDocPreviews] = useState<
    Array<{ url: string; name: string }>
  >([]);
  const [existingDocs, setExistingDocs] = useState<
    Array<ApiFile & { url: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- EFEITOS (DATA FETCHING) ---
  useEffect(() => {
    if (bookId) {
      const fetchBookData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [bookData, filesFromApi] = await Promise.all([
            getBookById(Number(bookId)),
            getFiles("books", Number(bookId)),
          ]);
          setFormData(bookData);

          const populatedFiles = filesFromApi
            .filter(
              (file) =>
                file &&
                typeof file.file_path === "string" &&
                file.file_path.trim() !== ""
            )
            .map((file) => ({
              ...file,
              url: new URL(file.file_path, API_DOMAIN as string).href,
            }));

          const cover =
            populatedFiles.find((file) => isImageFile(file.name)) || null;
          const docs = populatedFiles.filter((file) => !isImageFile(file.name));

          setExistingCoverImage(cover);
          setExistingDocs(docs);
        } catch (err) {
          console.error("Erro ao buscar dados:", err);
          setError(
            "Falha na comunicação com o servidor. Verifique se ele está ativo."
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchBookData();
    } else {
      // **ESTA É A CORREÇÃO PRINCIPAL**
      // Garante que a página não esteja em modo de carregamento se não houver ID de livro.
      setIsLoading(false);
    }
  }, [bookId]);

  // --- HANDLERS (EVENTOS) ---
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "pages" || id === "year_launch"
          ? value
            ? Number(value)
            : ""
          : value,
    }));
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    fileType: "cover" | "doc"
  ) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (fileType === "cover") {
      const file = files[0];
      if (!file) return;

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        alert(
          `Arquivo inválido. Apenas imagens (${ALLOWED_IMAGE_EXTENSIONS.join(
            ", "
          )}) são permitidas.`
        );
        e.target.value = "";
        return;
      }
      setCoverImageToUpload(file);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      setCoverImagePreview(URL.createObjectURL(file));
    } else {
      const validDocs = files.filter((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        return extension && ALLOWED_DOC_EXTENSIONS.includes(extension);
      });

      const invalidCount = files.length - validDocs.length;
      if (invalidCount > 0) {
        alert(
          `${invalidCount} arquivo(s) foram ignorados por não serem PDF ou EPUB.`
        );
      }

      if (validDocs.length > 0) {
        setDocsToUpload((prev) => [...prev, ...validDocs]);
        const newPreviews = validDocs.map((file) => ({
          url: URL.createObjectURL(file),
          name: file.name,
        }));
        setNewDocPreviews((prev) => [...prev, ...newPreviews]);
      }
      e.target.value = "";
    }
  };

  const removeNewFile = (index: number, fileType: "cover" | "doc") => {
    if (fileType === "cover") {
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      setCoverImageToUpload(null);
      setCoverImagePreview(null);
    } else {
      URL.revokeObjectURL(newDocPreviews[index].url);
      setDocsToUpload((prev) => prev.filter((_, i) => i !== index));
      setNewDocPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const deleteExistingFile = async (
    fileId: number,
    fileType: "cover" | "doc"
  ) => {
    const confirmMessage =
      fileType === "cover"
        ? "Tem certeza que deseja excluir a capa?"
        : "Tem certeza que deseja excluir este anexo permanentemente?";

    if (window.confirm(confirmMessage)) {
      try {
        await apiDeleteFile(fileId);
        if (fileType === "cover") {
          setExistingCoverImage(null);
        } else {
          setExistingDocs((prev) => prev.filter((file) => file.id !== fileId));
        }
      } catch (err) {
        console.error(err);
        alert("Falha ao excluir o anexo.");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      alert("Por favor, preencha o título e o autor.");
      return;
    }
    setIsLoading(true);

    try {
      let savedBook: Book;
      if (bookId) {
        savedBook = await updateBook(Number(bookId), formData);
      } else {
        savedBook = await createBook(formData as BookData);
      }

      const allFilesToUpload: File[] = [...docsToUpload];
      if (coverImageToUpload) {
        allFilesToUpload.push(coverImageToUpload);
      }

      if (allFilesToUpload.length > 0) {
        const uploadPromises = allFilesToUpload.map((file) =>
          uploadFile(file, "books", savedBook.id)
        );
        await Promise.all(uploadPromises);
      }

      router.push("/admin/books");
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao salvar o livro.");
      setIsLoading(false);
    }
  };

  // --- DADOS PARA RENDERIZAÇÃO ---
  const allPreviews: any[] = [
    ...(existingCoverImage
      ? [
          {
            key: `existing-${existingCoverImage.id}`,
            id: existingCoverImage.id,
            url: existingCoverImage.url,
            name: existingCoverImage.name,
            isNew: false,
            isImage: true,
            type: "cover",
          },
        ]
      : []),
    ...existingDocs.map((doc) => ({
      key: `existing-${doc.id}`,
      id: doc.id,
      url: doc.url,
      name: doc.name,
      isNew: false,
      isImage: false,
      type: "doc",
    })),
    ...(coverImagePreview && coverImageToUpload
      ? [
          {
            key: `new-${coverImageToUpload.name}`,
            url: coverImagePreview,
            name: coverImageToUpload.name,
            isNew: true,
            isImage: true,
            type: "cover",
            index: 0,
          },
        ]
      : []),
    ...newDocPreviews.map((doc, index) => ({
      key: `new-${doc.name}-${index}`,
      ...doc,
      isNew: true,
      isImage: false,
      type: "doc",
      index: index,
    })),
  ];

  // --- RENDERIZAÇÃO CONDICIONAL ---
  if (isLoading && !error && bookId)
    return <p className="text-center p-8">A carregar formulário...</p>;
  if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

  // --- RENDERIZAÇÃO PRINCIPAL (JSX) ---
  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {bookId ? "Editar Livro" : "Cadastrar Novo Livro"}
          </h1>
          <p className="text-muted-foreground">
            Preencha os campos para{" "}
            {bookId ? "atualizar o" : "cadastrar um novo"} livro.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className=" mx-auto grid gap-8"
      >
        <BookDetailsCard
          formData={formData}
          handleInputChange={handleInputChange}
          isLoading={isLoading}
        />
        <AttachmentsCard
          allPreviews={allPreviews}
          removeNewFile={removeNewFile}
          deleteExistingFile={deleteExistingFile}
          handleFileChange={handleFileChange}
          isLoading={isLoading}
          existingCoverImage={existingCoverImage}
          coverImageToUpload={coverImageToUpload}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : bookId ? (
              "Salvar Alterações"
            ) : (
              "Criar Livro"
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}