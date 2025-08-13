// src/app/admin/secretary/services/api.ts
'use strict';

// --- CONFIGURAÇÃO DA API ---
const API_BASE_URL = 'http://localhost:4000/api';

// --- TIPOS DE DADOS (INPUT) ---

interface AddressInput {
    street: string;
    number?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
}

// Dados para criar/atualizar uma secretaria
interface SecretaryInput {
    name: string;
    is_state_level: boolean;
    municipality?: string | null;
    state: string;
}

// Dados para criar um usuário
interface UserInput {
    email: string;
    password: string;
    user_type: string;
}

// Dados para criar/atualizar um responsável
interface ResponsibleInput {
    name: string;
    role: string;
    whatsapp?: string;
    phone?: string;
}

// Objeto completo para o formulário de criação
export interface FullSecretaryCreationPayload {
    secretary: Omit<SecretaryInput, 'address'>;
    address: AddressInput;
    user: UserInput;
    responsible: Omit<ResponsibleInput, 'user_id' | 'secretary_id'>;
}

// Objeto completo para o formulário de ATUALIZAÇÃO
export interface FullSecretaryUpdatePayload {
    secretary: SecretaryInput;
    address: AddressInput;
    responsible: ResponsibleInput;
    user: Omit<UserInput, 'password' | 'user_type'> & { password?: string };
}


// --- TIPOS DE RESPOSTA DA API ---

export interface SecretaryApiResponse {
    id: number;
    name: string;
    is_state_level: boolean;
    municipality: string | null;
    state: string;
    createdAt: string;
    updatedAt: string;
    address_id: number;
    address: {
        id: number;
        street: string;
        number: string | null;
        neighborhood: string;
        city: string;
        state: string;
        cep: string;
    };
    responsibles: {
        id: number;
        name: string;
        role: string;
        whatsapp: string | null;
        phone: string | null;
        user: {
            id: number;
            email: string;
            status: boolean;
        };
    }[];
}

// --- FUNÇÕES DA API ---

/**
 * Busca todas as secretarias no backend.
 */
export const getSecretaries = async (): Promise<SecretaryApiResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/secretaries`);
    if (!response.ok) {
        throw new Error('Falha ao buscar os dados das secretarias.');
    }
    return response.json();
};

/**
 * Busca uma única secretaria pelo seu ID.
 */
export const getSecretaryById = async (id: number): Promise<SecretaryApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/secretaries/${id}`);
    if (!response.ok) {
        throw new Error('Falha ao buscar os dados da secretaria.');
    }
    return response.json();
};

/**
 * Deleta uma secretaria pelo ID.
 */
export const deleteSecretary = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/secretaries/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar a secretaria.');
    }
};

/**
 * Função principal que orquestra a criação completa de uma secretaria,
 * seu endereço, o usuário e o responsável em um único fluxo.
 * @param data - O objeto contendo todos os dados necessários.
 * @returns O responsável criado, com todos os dados aninhados.
 */
export const createFullSecretaryWorkflow = async (data: FullSecretaryCreationPayload) => {
    try {
        // Passo 1: Criar o Usuário
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.user),
        });
        if (!userResponse.ok) {
            const error = await userResponse.json();
            throw new Error(`Erro ao criar usuário: ${error.error}`);
        }
        const createdUser = await userResponse.json();

        // Passo 2: Criar a Secretaria (com o endereço aninhado)
        const secretaryPayload = { ...data.secretary, address: data.address };
        const secretaryResponse = await fetch(`${API_BASE_URL}/secretaries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(secretaryPayload),
        });
        if (!secretaryResponse.ok) {
            const error = await secretaryResponse.json();
            throw new Error(`Erro ao criar secretaria: ${error.error}`);
        }
        const createdSecretary = await secretaryResponse.json();

        // Passo 3: Criar o Responsável, vinculando o usuário e a secretaria
        const responsiblePayload = {
            ...data.responsible,
            user_id: createdUser.id,
            secretary_id: createdSecretary.id,
        };
        const responsibleResponse = await fetch(`${API_BASE_URL}/responsibles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responsiblePayload),
        });
        if (!responsibleResponse.ok) {
            const error = await responsibleResponse.json();
            throw new Error(`Erro ao criar responsável: ${error.error}`);
        }

        return responsibleResponse.json();

    } catch (error) {
        console.error("Falha no fluxo de criação da secretaria:", error);
        // Re-lança o erro para que o componente que chamou a função possa tratá-lo (ex: mostrar um toast de erro)
        throw error;
    }
};


/**
 * Orquestra a atualização completa de uma secretaria, seu endereço e responsável.
 * @param id O ID da secretaria a ser atualizada.
 * @param data O objeto contendo todos os dados a serem atualizados.
 */
export const updateFullSecretaryWorkflow = async (id: number, data: FullSecretaryUpdatePayload) => {
    try {
        // Remove a senha do payload se estiver vazia, para não alterá-la desnecessariamente
        if (data.user && (!data.user.password || data.user.password.trim() === '')) {
            delete data.user.password;
        }

        const response = await fetch(`${API_BASE_URL}/secretaries/full/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Erro ao atualizar secretaria: ${error.error || 'Erro desconhecido'}`);
        }
        return response.json();

    } catch (error) {
        console.error("Falha no fluxo de atualização da secretaria:", error);
        throw error;
    }
};
