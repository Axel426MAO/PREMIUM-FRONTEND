// Local: /app/secretary/licenses/services/api.ts

// --- CONSTANTES ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"; // Ajustado para porta 4000 se for o caso

// --- INTERFACES E TIPOS ---

export type BackendBatchStatus =
  | "CRIADO"
  | "ENVIADO"
  | "RECEBIDO"
  | "PENDENTE"
  | "ATIVO"
  | "EXPIRADO";

// Tipo base para a lista geral de lotes
export interface LicenseBatchApiResponse {
  id: number;
  quantity: number;
  status: BackendBatchStatus;
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
  child_batches: ChildBatch[]; // Propriedade para os microlotes

}

export interface ChildBatch {
  sentAt: string | number | Date;
  id: number;
  quantity: number;
  status: BackendBatchStatus;
  createdAt: string;
  school: {
    id: number;
    name: string;
  } | null;
  _count: {
    license_keys: number;
  };
}

// Tipo para os detalhes completos de um lote, incluindo microlotes
export interface LicenseBatchDetails extends LicenseBatchApiResponse {
  updatedAt: string;
  sentAt: string | null;
  license_keys: Array<{
    id: number;
    code: string;
    status: BackendBatchStatus;
    createdAt: string;
    activatedAt: string | null;
  }>;
  child_batches: ChildBatch[]; // Propriedade para os microlotes
}

// Payload para a criação de um novo lote
export interface CreateBatchPayload {
  book_id: number;
  quantity: number;
  secretary_id?: number;
  school_id?: number;
}

// Payload para a função de envio de lote fracionado
export interface SendFractionedPayload {
  school_id: number;
  quantity: number;
}

// Tipos genéricos para outras entidades
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

// --- FUNÇÕES DA API ---

/**
 * Lida com respostas de erro da API, extraindo a mensagem.
 */
async function handleApiError(response: Response): Promise<never> {
  const responseData = await response.json().catch(() => ({}));
  throw new Error(responseData.error || `Erro ${response.status}: ${response.statusText}`);
}

/**
 * Busca a lista de todos os lotes de licenças. (Rota: GET /license)
 */
export async function getLicenseBatches(): Promise<LicenseBatchApiResponse[]> {
  const response = await fetch(`${API_BASE_URL}/license`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Busca os detalhes completos de um lote de licenças pelo ID. (Rota: GET /license/:id)
 */
export async function getLicenseBatchById(id: number): Promise<LicenseBatchDetails> {
  const response = await fetch(`${API_BASE_URL}/license/${id}`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Busca os lotes de licenças recebidos por uma secretaria. (Rota: GET /license/by-secretary/:id)
 */
export async function getLicenseBatchesBySecretaryId(secretaryId: number): Promise<LicenseBatchApiResponse[]> {
  const response = await fetch(`${API_BASE_URL}/license/by-secretary/${secretaryId}`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Busca os lotes de licenças enviados para uma escola. (Rota: GET /license/by-school/:id)
 */
export async function getReceivedBatchesBySchoolId(schoolId: number): Promise<LicenseBatchApiResponse[]> {
  const response = await fetch(`${API_BASE_URL}/license/by-school/${schoolId}`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Cria um novo lote de licenças. (Rota: POST /license)
 */
export async function createLicenseBatch(payload: CreateBatchPayload): Promise<LicenseBatchApiResponse> {
  const response = await fetch(`${API_BASE_URL}/license`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Envia um microlote (fração de um lote pai) para uma escola.
 * (Rota: POST /license/:parentId/send-to-school)
 */
export async function sendFractionedBatchToSchool(parentId: number, payload: SendFractionedPayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/license/${parentId}/send-to-school`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await handleApiError(response);
}

/**
 * Exclui um lote de licenças pelo ID. (Rota: DELETE /license/:id)
 */
export async function deleteLicenseBatch(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/license/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 204) {
    await handleApiError(response);
  }
}

// --- FUNÇÕES AUXILIARES PARA FORMULÁRIOS ---

/**
 * Busca todos os livros. (Assumindo uma rota GET /books)
 */
export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Busca todas as secretarias. (Assumindo uma rota GET /secretaries)
 */
export async function getSecretaries(): Promise<Secretary[]> {
  const response = await fetch(`${API_BASE_URL}/secretaries`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Busca todas as escolas. (Assumindo uma rota GET /schools)
 */
export async function getSchools(): Promise<School[]> {
  const response = await fetch(`${API_BASE_URL}/schools`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}

/**
 * Busca todas as escolas de uma secretaria específica.
 */
export async function getSchoolsBySecretaryId(secretaryId: number): Promise<School[]> {
  const response = await fetch(`${API_BASE_URL}/schools/by-secretary/${secretaryId}`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}


/**
 * Busca os lotes de uma secretaria para usar no formulário de distribuição.
 * (Rota: GET /license/by-secretary/:id)
 */
export async function getBatchesForDistribution(secretaryId: number): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/license/by-secretary/${secretaryId}`);
  if (!response.ok) await handleApiError(response);
  return response.json();
}