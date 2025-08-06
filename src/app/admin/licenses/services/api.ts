// Exemplo: /app/admin/license/services/api.ts

// Esta interface representa a resposta que vem da sua API Fastify
export interface LicenseBatchApiResponse {
  id: number;
  quantity: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'SENT' | 'RECEIVED' | 'PARTITIONED' | 'CANCELLED';
  createdAt: string;
  book: {
    id: number;
    title: string;
  };
  secretary: {
    id: number;
    name: string;
  } | null;
  school: {
    id: number;
    name: string;
  } | null;
  _count: {
    license_keys: number;
  };
}

const API_URL = 'http://localhost:4000/api/license'; // Ajuste se a sua URL base for diferente

export async function getLicenseBatches(): Promise<LicenseBatchApiResponse[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Falha ao buscar os lotes de licenças.');
  }
  return response.json();
}

export async function deleteLicenseBatch(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 204) {
    throw new Error('Falha ao excluir o lote de licenças.');
  }
}


// Exemplo de local: /app/admin/license/services/api.ts

// --- Tipos de dados que esperamos da API ---

export interface Book {
  id: number;
  title: string;
}

export interface Secretary {
  id: number;
  name: string;
}

export interface School {
  id: number;
  name: string;
  is_private: boolean;
}

// --- Dados que o formulário enviará para a API ---
export interface CreateBatchPayload {
  book_id: number;
  quantity: number;
  secretary_id?: number;
  school_id?: number;
}

const API_BASE_URL = 'http://localhost:4000/api'; // Sua URL base da API

// --- Funções para buscar dados para os dropdowns ---

export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`); // Assumindo que você tem uma rota /api/books
  if (!response.ok) throw new Error('Falha ao buscar os livros.');
  return response.json();
}

export async function getSecretaries(): Promise<Secretary[]> {
  const response = await fetch(`${API_BASE_URL}/secretaries`);
  if (!response.ok) throw new Error('Falha ao buscar as secretarias.');
  return response.json();
}

export async function getSchools(): Promise<School[]> {
  const response = await fetch(`${API_BASE_URL}/schools`);
  if (!response.ok) throw new Error('Falha ao buscar as escolas.');
  return response.json();
}


export async function createLicenseBatch(payload: CreateBatchPayload) {
  const response = await fetch(`${API_BASE_URL}/license`, { // A rota que criamos anteriormente
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    // Lança um erro com a mensagem vinda da API, se houver
    throw new Error(responseData.error || 'Falha ao criar o lote de licenças.');
  }

  return responseData;
}