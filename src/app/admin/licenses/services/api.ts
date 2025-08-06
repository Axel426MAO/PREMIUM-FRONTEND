// Local: /app/admin/licenses/services/api.ts

// --- CONSTANTES ---
const API_BASE_URL = 'http://212.85.14.247:4000/api';

// --- INTERFACES E TIPOS ---

// Interface para a lista de lotes (visão resumida)
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

// Interface para os detalhes de um lote específico (visão completa)
export interface LicenseBatchDetails {
  id: number;
  quantity: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'SENT' | 'RECEIVED' | 'PARTITIONED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  book_id: number;
  customer_type: string;
  secretary_id: number | null;
  school_id: number | null;
  parent_batch_id: number | null;
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
  license_keys: Array<{
    id: number;
    code: string;
    status: 'AVAILABLE' | 'ACTIVATED' | 'EXPIRED' | 'REVOKED';
    createdAt: string;
    activatedAt: string | null;
  }>;
}


// Tipos para os dados dos dropdowns do formulário
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

// Payload para a criação de um novo lote
export interface CreateBatchPayload {
  book_id: number;
  quantity: number;
  secretary_id?: number;
  school_id?: number;
}


// --- FUNÇÕES DA API ---

/**
 * Busca a lista de todos os lotes de licenças.
 */
export async function getLicenseBatches(): Promise<LicenseBatchApiResponse[]> {
  const response = await fetch(`${API_BASE_URL}/license`);
  if (!response.ok) {
    throw new Error('Falha ao buscar os lotes de licenças.');
  }
  return response.json();
}

/**
 * Busca os detalhes completos de um lote de licenças específico pelo ID.
 */
export async function getLicenseBatchById(id: number): Promise<LicenseBatchDetails> {
  const response = await fetch(`${API_BASE_URL}/license/${id}`);
  if (!response.ok) {
    throw new Error('Falha ao buscar os detalhes do lote de licenças.');
  }
  return response.json();
}

/**
 * Cria um novo lote de licenças.
 */
export async function createLicenseBatch(payload: CreateBatchPayload): Promise<LicenseBatchApiResponse> {
  const response = await fetch(`${API_BASE_URL}/license`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Falha ao criar o lote de licenças.');
  }

  return responseData;
}

/**
 * Exclui um lote de licenças pelo ID.
 */
export async function deleteLicenseBatch(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/license/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 204) {
    const responseData = await response.json().catch(() => ({}));
    throw new Error(responseData.error || 'Falha ao excluir o lote de licenças.');
  }
}

// --- Funções para popular os formulários ---

export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);
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
