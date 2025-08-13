// Local: /app/admin/licenses/services/api.ts

// --- CONSTANTES ---
const API_BASE_URL = 'http://212.85.14.247:4000/api';

// --- INTERFACES E TIPOS ---

// <-- CORREÇÃO: O tipo de status DEVE corresponder aos enums do backend
type BackendBatchStatus = 'CRIADO' | 'ENVIADO' | 'RECEBIDO' | 'PENDENTE' | 'ATIVO' | 'EXPIRADO';
type BackendKeyStatus = 'CRIADO' | 'ENVIADO' | 'RECEBIDO' | 'PENDENTE' | 'ATIVO' | 'EXPIRADO';

// Interface para a lista de lotes (visão resumida)
export interface LicenseBatchApiResponse {
  id: number;
  quantity: number;
  status: BackendBatchStatus; // <-- Usando o tipo corrigido
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
  status: BackendBatchStatus; // <-- Usando o tipo corrigido
  // ... resto dos campos
  license_keys: Array<{
    id: number;
    code: string;
    status: BackendKeyStatus; // <-- Tipo para o status da chave
    createdAt: string;
    activatedAt: string | null;
  }>;
}

// ... (Resto do seu arquivo api.ts pode continuar igual)
export interface Book { id: number; title: string; }
export interface Secretary { id: number; name: string; }
export interface School { id: number; name: string; is_private: boolean; }
export interface CreateBatchPayload { book_id: number; quantity: number; secretary_id?: number; school_id?: number; }

export async function getLicenseBatches(): Promise<LicenseBatchApiResponse[]> {
  const response = await fetch(`${API_BASE_URL}/license`);
  if (!response.ok) throw new Error('Falha ao buscar os lotes de licenças.');
  return response.json();
}

export async function getLicenseBatchById(id: number): Promise<LicenseBatchDetails> {
  const response = await fetch(`${API_BASE_URL}/license/${id}`);
  if (!response.ok) throw new Error('Falha ao buscar os detalhes do lote.');
  return response.json();
}

export async function createLicenseBatch(payload: CreateBatchPayload): Promise<LicenseBatchApiResponse> {
  const response = await fetch(`${API_BASE_URL}/license`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const responseData = await response.json();
  if (!response.ok) throw new Error(responseData.error || 'Falha ao criar o lote.');
  return responseData;
}

export async function deleteLicenseBatch(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/license/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 204) {
    const responseData = await response.json().catch(() => ({}));
    throw new Error(responseData.error || 'Falha ao excluir o lote.');
  }
}

/**
 * @description Atualiza o status de um lote de licenças.
 * @param id O ID do lote de licenças.
 * @param status O novo status a ser aplicado (e.g., 'SENT').
 * @returns O lote de licenças atualizado.
 */
export async function updateLicenseBatchStatus(id: number, status: BackendBatchStatus): Promise<LicenseBatchApiResponse> {
  const response = await fetch(`${API_BASE_URL}/license/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || 'Falha ao atualizar o status do lote.');
  }
  return responseData;
}

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


