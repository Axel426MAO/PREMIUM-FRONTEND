"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  UploadCloud,
  X,
  FileText,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
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

// --- TIPOS E CONSTANTES INTERNAS ---
const API_DOMAIN = "http://212.85.14.247/:4000";

interface UnifiedPreview {
  key: string;
  id?: number;
  index?: number;
  url: string;
  name: string;
  isNew: boolean;
  isImage: boolean;
  type: "cover" | "doc";
}

const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
};

// --- COMPONENTE DA PÁGINA DO FORMULÁRIO ---
export default function BookFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id");

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
  // ✅ CORREÇÃO 1: Removido o 'type' daqui, pois não era necessário.
  const [newDocPreviews, setNewDocPreviews] = useState<
    Array<{ url: string; name: string }>
  >([]);
  const [existingDocs, setExistingDocs] = useState<
    Array<ApiFile & { url: string }>
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      const fetchBookData = async () => {
        setIsLoading(true);
        setError(null); // Limpa erros anteriores
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
              url: new URL(file.file_path, API_DOMAIN).href,
            }));

          const cover =
            populatedFiles.find((file) => isImageFile(file.name)) || null;
          const docs = populatedFiles.filter((file) => !isImageFile(file.name));

          setExistingCoverImage(cover);
          setExistingDocs(docs);
        } catch (err) {
          console.error("Erro ao buscar dados:", err);
          // Define um erro amigável para o usuário
          setError(
            "Falha na comunicação com o servidor. Verifique se ele está ativo."
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchBookData();
    }
  }, [bookId]);

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

    if (fileType === "cover" && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageToUpload(file);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      setCoverImagePreview(URL.createObjectURL(file));
    } else {
      const newFiles = Array.from(e.target.files);
      setDocsToUpload((prev) => [...prev, ...newFiles]);
      // ✅ CORREÇÃO 2: Removido o 'type' daqui para corresponder ao estado.
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setNewDocPreviews((prev) => [...prev, ...newPreviews]);
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

  if (isLoading && !error && bookId)
    return <p className="text-center p-8">A carregar formulário...</p>;
  if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="flex items-center gap-4 mb-8 pb-4 border-b">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {bookId ? "Editar Livro" : "Adicionar Novo Livro"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha os campos para{" "}
            {bookId ? "atualizar o" : "cadastrar um novo"} livro.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
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

          <div className="grid gap-4 border-t pt-6">
            <Label className="text-base font-semibold">Anexos</Label>

            {allPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
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

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <label
                htmlFor="cover-input"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Adicionar Capa</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Apenas uma imagem
                  </p>
                </div>
                <Input
                  id="cover-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "cover")}
                  accept="image/*"
                  disabled={
                    isLoading || !!existingCoverImage || !!coverImageToUpload
                  }
                />
              </label>
              <label
                htmlFor="doc-input"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Adicionar Documentos</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDFs, etc.</p>
                </div>
                <Input
                  id="doc-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "doc")}
                  multiple
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "A guardar..." : "Guardar Livro"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
