// src/app/admin/users/services/formApi.ts
'use strict';

import type { SecretaryApiResponse } from "../../secretary/services/api";
import type { UserApiResponse, UserFormData } from "./api";

const API_BASE_URL = 'http://localhost:4000/api';

// --- TIPOS DE DADOS ---

// Dados para criar um responsável (sem o user_id, que será criado no fluxo)
interface ResponsibleFormData {
  name: string;
  role: string;
  whatsapp?: string;
  phone?: string;
  secretary_id: number;
}

// Payload completo para o fluxo de criação de um usuário responsável
export interface ResponsibleUserPayload {
    user: UserFormData;
    responsible: Omit<ResponsibleFormData, 'user_id'>;
}

// --- FUNÇÕES DA API ---

/**
 * Busca todas as secretarias para popular o seletor.
 */
export const getSecretariesForSelect = async (): Promise<SecretaryApiResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/secretaries`);
  if (!response.ok) {
    throw new Error('Falha ao buscar as secretarias.');
  }
  return response.json();
};

/**
 * Cria um usuário simples (sem vínculo de responsável).
 */
export const createSimpleUser = async (data: UserFormData): Promise<UserApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar usuário.');
    }
    return response.json();
};

/**
 * Orquestra a criação de um usuário e, em seguida, de um responsável vinculado a ele.
 */
export const createResponsibleUser = async (data: ResponsibleUserPayload) => {
    // Passo 1: Criar o usuário
    const createdUser = await createSimpleUser(data.user);

    // Passo 2: Preparar e criar o responsável
    const responsiblePayload = {
        ...data.responsible,
        user_id: createdUser.id,
    };

    const responsibleResponse = await fetch(`${API_BASE_URL}/responsibles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responsiblePayload),
    });

    if (!responsibleResponse.ok) {
        // Tenta reverter a criação do usuário em caso de falha
        await fetch(`${API_BASE_URL}/users/${createdUser.id}`, { method: 'DELETE' });
        const error = await responsibleResponse.json();
        throw new Error(error.error || 'Falha ao criar o vínculo de responsável.');
    }

    return responsibleResponse.json();
};
