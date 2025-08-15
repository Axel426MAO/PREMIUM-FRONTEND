const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
        user_type: string;
    };
}


export interface FullSchoolUpdatePayload {
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
        password?: string; // Senha é opcional na atualização
    };
}

/**
 * Define a estrutura de dados completa de uma escola para a página de edição.
 */
export interface SchoolDetailApiResponse extends SchoolApiResponse {
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
 */
export const getSchools = async (): Promise<SchoolApiResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/schools`);
    if (!response.ok) {
        throw new Error("Falha ao buscar os dados das escolas.");
    }
    return response.json();
};

/**
 * Busca os dados detalhados de uma única escola pelo ID.
 */
export const getSchoolById = async (id: number): Promise<SchoolDetailApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/schools/${id}`);
    if (!response.ok) {
        throw new Error("Falha ao buscar os dados da escola.");
    }
    return response.json();
};


/**
 * Busca a lista de secretarias para preencher o combobox de seleção no formulário.
 */
export async function getSecretariesForSelect(): Promise<SecretarySelectItem[]> {
    const response = await fetch(`${API_BASE_URL}/secretaries`);
    if (!response.ok) {
        throw new Error("Não foi possível carregar as secretarias.");
    }
    const data = await response.json();
    return data.map((sec: any) => ({ id: sec.id, name: sec.name }));
}

export const deleteSchool = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/schools/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao excluir a escola.");
    }
};

/**
 * Envia todos os dados do formulário para o backend para criar a escola.
 * (Função original mantida sem alterações)
 */
export async function createFullSchoolWorkflow(payload: FullSchoolCreationPayload) {
    const flattenedPayload = {
        ...payload.school,
        address: payload.address,
        responsible: payload.responsible,
        user: payload.user,
    };

    const response = await fetch(`${API_BASE_URL}/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flattenedPayload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar a escola.");
    }

    return response.json();
}
/**
 * Envia todos os dados do formulário para o backend para ATUALIZAR uma escola.
 */
export async function updateFullSchoolWorkflow(id: number, payload: FullSchoolUpdatePayload) {
    const response = await fetch(`${API_BASE_URL}/schools/full/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar a escola.");
    }

    return response.json();
}
