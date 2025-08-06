// src/app/admin/schools/services/api.ts

// --- TIPOS DE DADOS PARA A PÁGINA DE LISTAGEM ---

/**
 * Define a estrutura de dados retornada pela API para um único item da lista de escolas.
 * Usado na página de listagem (page.tsx).
 */
export interface SchoolApiResponse {
    id: number;
    name: string;
    is_private: boolean;
    address: {
        city: string;
        state: string;
    };
    secretary: {
        id: number;
        name: string;
    } | null;
    responsibles: {
        name: string;
        user: {
            status: boolean;
        } | null;
    }[];
}


// --- TIPOS DE DADOS PARA O FORMULÁRIO DE CRIAÇÃO ---

/**
 * Define o payload completo que será enviado para criar a escola e seus dados relacionados.
 * Usado na página do formulário (form/page.tsx).
 */
export interface FullSchoolCreationPayload {
    school: {
        name: string;
        is_private: boolean;
        secretary_id?: number | null;
    };
    address: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        cep: string;
    };
    responsible: {
        name: string;
        role: string;
        whatsapp?: string;
        phone?: string;
    };
    user: {
        email: string;
        password: string;
        user_type: string; // Ex: 'responsible_school'
    };
}

/**
 * Define o tipo de dado para o combobox de seleção de secretarias.
 */
export interface SecretarySelectItem {
    id: number;
    name: string;
}


// --- FUNÇÕES DA API ---

/**
 * Busca a lista completa de escolas da API para a página de listagem.
 * @returns {Promise<SchoolApiResponse[]>} Uma promessa que resolve para um array de escolas.
 */
export const getSchools = async (): Promise<SchoolApiResponse[]> => {
    const response = await fetch("http://localhost:4000/api/schools");

    if (!response.ok) {
        throw new Error("Falha ao buscar os dados das escolas.");
    }

    return response.json();
};

/**
 * Busca a lista de secretarias para preencher o combobox de seleção no formulário.
 * @returns {Promise<SecretarySelectItem[]>}
 */
export async function getSecretariesForSelect(): Promise<SecretarySelectItem[]> {
    const response = await fetch("http://localhost:4000/api/secretaries");
    if (!response.ok) {
        throw new Error("Não foi possível carregar as secretarias.");
    }
    const data = await response.json();
    return data.map((sec: any) => ({ id: sec.id, name: sec.name }));
}

export const deleteSchool = async (id: number): Promise<void> => {
    const response = await fetch(`http://localhost:4000/api/schools/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Tenta pegar o erro, se não, usa objeto vazio
        throw new Error(errorData.error || "Falha ao excluir a escola.");
    }

    // Não precisa retornar nada em caso de sucesso
};

/**
 * Envia todos os dados do formulário para o backend para criar a escola.
 * @param {FullSchoolCreationPayload} payload - Os dados completos do formulário.
 */
export async function createFullSchoolWorkflow(payload: FullSchoolCreationPayload) {
    // --- CORREÇÃO APLICADA AQUI ---
    // O backend espera os dados da escola no nível principal do JSON.
    // Esta nova constante 'flattenedPayload' desestrutura o objeto 'school'
    // e o mescla com o restante dos dados, criando o formato correto.
    const flattenedPayload = {
        ...payload.school, // Espalha name, is_private, secretary_id
        address: payload.address,
        responsible: payload.responsible,
        user: payload.user,
    };

    const response = await fetch("http://localhost:4000/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Enviando o payload corrigido e "achatado"
        body: JSON.stringify(flattenedPayload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar a escola.");
    }

    return response.json();
}
