import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Defines the structure for the user's profile information
// No seu arquivo do store (ex: /store/userStore.ts)

// Adicione uma interface separada para a Secretaria para manter o código limpo
interface SecretaryProfile {
    id: number;
    name: string;
    is_state_level: boolean;
    municipality: string;
    state: string;

}

interface UserProfile {
    id: number;
    email: string;
    user_type: string;
    createdAt: string
    responsible?: {
        id: number;
        name: string;
        role: string;
        school?: { id: number; name: string };
        phone: string;
        whatsapp: string
        secretary?: SecretaryProfile;

    };
}
interface UserState {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (userData: UserProfile, token: string) => void;
    logout: () => void;
}

// Creates the Zustand store
export const useUserStore = create<UserState>()(
    // The `persist` middleware automatically saves the store's state to localStorage
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (userData, token) => {
                set({ user: userData, token, isAuthenticated: true });
            },

            logout: () => {
                localStorage.removeItem('authToken')
                set({ token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'user-auth-storage', // The key used in localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
