import { Class } from "@/app/admin/schools/services/api";

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

export interface UpdateStudentPayload {
  email: string;
  password?: string; // Senha é opcional
  name: string;
  school_id: number;
  turma?: string;
}


export const getTeachersBySecretaryId = async (secretaryId: number): Promise<StudentApiResponse[]> => {
    try {
        const response = await fetch(`${API_URL}/teacher/by-secretary/${secretaryId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch teacher with id ${secretaryId}:`, error);
        throw new Error("Não foi possível carregar os dados do professor.");
    }
};


export const getTeachersBySchoolId = async (schoolId: number): Promise<StudentApiResponse[]> => {
    try {
        const response = await fetch(`${API_URL}/teacher/by-school/${schoolId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch teacher with id ${schoolId}:`, error);
        throw new Error("Não foi possível carregar os dados do professor.");
    }
};