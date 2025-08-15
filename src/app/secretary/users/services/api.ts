'use strict';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface UserApiResponse {
    id: number;
    email: string;
    user_type: string;
    status: boolean;
    createdAt: string;
    responsible: {
        id: number;
        name: string;
        secretary: {
            id: number;
            name: string;
            is_state_level: boolean
        }
    } | null;
}

// Tipo para os dados do formulário de usuário (criação/edição)
export interface UserFormData {
    email: string;
    user_type: string;
    status: boolean;
    password?: string; // Senha é opcional na atualização
}


export const getUsers = async (): Promise<UserApiResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
        throw new Error('Falha ao buscar os dados dos usuários.');
    }
    return response.json();
};

export const getUserById = async (id: number): Promise<UserApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
        throw new Error('Falha ao buscar os dados do usuário.');
    }
    return response.json();
};

export const createUser = async (data: UserFormData): Promise<UserApiResponse> => {
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

export const updateUser = async (id: number, data: Partial<UserFormData>): Promise<UserApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao atualizar usuário.');
    }
    return response.json();
};

export const deleteUser = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar o usuário.');
    }
};
