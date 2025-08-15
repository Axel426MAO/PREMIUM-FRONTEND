// Define a URL base da sua API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- INTERFACES ---

export interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string | null;
  pages: number;
  year_launch: number;
  isbn: string | null;
  summary: string | null;
  description: string | null;
  coverUrl?: string | null; // ✅ Adicione esta linha
}

export interface ApiFile {
    id: number;
    reference_table: string;
    reference_id: number;
    name: string;
    file_path: string;
    created_at: string;
}

export type BookData = Omit<Book, 'id'>;


// --- FUNÇÕES DA API DE LIVROS ---

export const getBooks = async (): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books`);
  if (!response.ok) throw new Error('Falha ao buscar livros.');
  return response.json();
};

export const getBookById = async (id: number): Promise<Book> => {
    const response = await fetch(`${API_BASE_URL}/books/${id}`);
    if (!response.ok) throw new Error('Falha ao buscar o livro.');
    return response.json();
};

export const createBook = async (bookData: Partial<BookData>): Promise<Book> => {
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData),
  });
  if (!response.ok) throw new Error('Falha ao criar livro.');
  return response.json();
};

export const updateBook = async (id: number, bookData: Partial<BookData>): Promise<Book> => {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
    });
    if (!response.ok) throw new Error('Falha ao atualizar livro.');
    return response.json();
};

export const deleteBook = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Falha ao deletar livro.');
};


// --- FUNÇÕES DA API DE ARQUIVOS ---

export const getFiles = async (reference_table: string, reference_id: number): Promise<ApiFile[]> => {
    const response = await fetch(`${API_BASE_URL}/files/${reference_table}/${reference_id}`);
    if (!response.ok) throw new Error('Falha ao buscar arquivos.');
    return response.json();
}

export const uploadFile = async (file: File, reference_table: string, reference_id: number): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reference_table', reference_table);
    formData.append('reference_id', String(reference_id));

    const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) throw new Error('Falha ao enviar arquivo.');
    return response.json();
};

export const deleteFile = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, { // Assumindo que a rota de delete é /api/files/:id
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao deletar arquivo.');
};
