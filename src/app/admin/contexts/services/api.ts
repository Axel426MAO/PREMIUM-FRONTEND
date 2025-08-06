const API_BASE_URL = 'http://212.85.14.247:4000/api';

export interface User {
    id: number;
    name: string;
    email: string;
    user_type: string;
    status: boolean;
}

// ... suas outras funções da API (getBooks, etc.)

// ✅ Adicione esta nova função para buscar o perfil
export const getProfile = async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        // Se o token for inválido, a API retornará 401
        throw new Error('Sessão inválida ou expirada');
    }
    return response.json();
};