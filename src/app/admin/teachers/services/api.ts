import { Class } from "../../schools/services/api";

// URL base da sua API, lida das variáveis de ambiente ou com um padrão
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface SchoolApiResponse {
  id: number;
  name: string;
  is_private: boolean;
  address: {
    street: string;
    number: string | null;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  secretary: {
    id: number;
    name: string;
  } | null;
  responsibles: {
    name: string;
    role: string;
    whatsapp: string | null;
    phone: string | null;
    user: {
      email: string;
    };
  }[];
  classes: Class[];
}
interface School {
  id: number;
  name: string;
  is_private: boolean
}

interface Responsible {
  id: number;
  name: string;
  turma: string | null;
  idade: number | null;
  phone: string | null;
  whatsapp: string | null;
  school: School;
}

export interface StudentApiResponse {
  id: number; // ID do User
  email: string;
  status: boolean;
  responsible: Responsible | null;
}

// --- TIPO PARA CRIAÇÃO DE ALUNO (OBJETO ÚNICO) ---
export interface StudentCreationPayload {
  email: string;
  password?: string;
  name: string;
  school_id: number;
  turma?: string;
  idade?: number;
  phone?: string;
  whatsapp?: string;
}

export interface UpdateTeacherPayload {
  email: string;
  password?: string; // Senha é opcional
  name: string;
  school_id: number;
  turma?: string;
}
// --- FUNÇÃO PARA CRIAR UM ALUNO (CHAMADA ÚNICA) ---
export const createTeacher = async (data: StudentCreationPayload): Promise<StudentApiResponse> => {
  try {
    // A rota '/students' (plural) lida com a criação completa
    const response = await fetch(`${API_URL}/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to create student:", error);
    // Re-lança o erro para que o componente possa exibi-lo
    throw error;
  }
};


// --- FUNÇÃO PARA BUSCAR ALUNOS USANDO FETCH ---
export const getStudents = async (): Promise<StudentApiResponse[]> => {
  try {
    const response = await fetch(`${API_URL}/teacher`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: StudentApiResponse[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch students:", error);
    throw new Error("Não foi possível carregar os dados dos alunos.");
  }
};

// --- FUNÇÃO PARA DELETAR UM ALUNO USANDO FETCH ---
export const deleteStudent = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/teacher/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return;

  } catch (error) {
    console.error(`Failed to delete student with id ${id}:`, error);
    throw new Error("Erro ao excluir o aluno. Tente novamente.");
  }
};

// --- FUNÇÃO PARA BUSCAR ESCOLAS ---
export const getSchools = async (): Promise<SchoolApiResponse[]> => {
  const response = await fetch(`${API_URL}/schools`);
  if (!response.ok) {
    throw new Error("Falha ao buscar os dados das escolas.");
  }
  return response.json();
};


export const getTeacherById = async (id: number): Promise<StudentApiResponse> => {
  try {
    const response = await fetch(`${API_URL}/teacher/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch teacher with id ${id}:`, error);
    throw new Error("Não foi possível carregar os dados do professor.");
  }
};

// Adicione esta nova função
export const updateTeacher = async (id: number, data: UpdateTeacherPayload): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/teacher/${id}`, {
      method: "PUT", // Usar PATCH é ideal para atualizações parciais
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to update teacher with id ${id}:`, error);
    throw new Error("Erro ao atualizar o professor. Tente novamente.");
  }
};