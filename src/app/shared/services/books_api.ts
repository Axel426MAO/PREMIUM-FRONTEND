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
    coverUrl?: string | null;
}

export interface BookWithAccess {
  id: number;
  title: string;
  author: string;
  publisher: string | null;
  year_launch: number;
  pages: number;
  summary: string | null;
  hasAccess: boolean;
  coverUrl?: string;
  isbn:string;
  description:string
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


export const getBooks = async (): Promise<Book[]> => {
    const response = await fetch(`${API_BASE_URL}/books`);
    if (!response.ok) throw new Error('Falha ao buscar livros.');
    return response.json();
};

// --- MODIFICAÇÃO: Nova função para buscar livros para uma secretaria ---
export const getBooksForSecretary = async (secretaryId: number): Promise<BookWithAccess[]> => {
    const response = await fetch(`${API_BASE_URL}/books/secretary/${secretaryId}`);
    if (!response.ok) throw new Error('Falha ao buscar livros para a secretaria.');
    return response.json();
};


export const getBooksForSchool = async (schoolId: number): Promise<BookWithAccess[]> => {
    const response = await fetch(`${API_BASE_URL}/books/school/${schoolId}`);
    if (!response.ok) throw new Error('Falha ao buscar livros para a escola.');
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


