"use client";

import { useState, useEffect } from "react";
import { ThemeToggleButton } from "./ThemeToggleButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/app/store/userStore";
import { useRouter } from "next/navigation";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL_WITHOUTH_SUFIX;

interface ApiFile {
  id: number;
  name: string;
  file_path: string;
}

const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
};

export const getFiles = async (reference_table: string, reference_id: number): Promise<ApiFile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${reference_table}/${reference_id}`);
    if (!response.ok) return []; // Retorna array vazio em caso de erro para não quebrar a interface
    return response.json();
  } catch (error) {
    console.error("Falha ao buscar arquivos:", error);
    return [];
  }
};

// =================================================================
//  COMPONENTE HEADER
// =================================================================
export const DesktopHeader = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { user, logout } = useUserStore();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Efeito para buscar a foto de perfil do usuário
  useEffect(() => {
    if (user?.id) {
      const fetchAvatar = async () => {
        const files = await getFiles('users', user.id);
        const imageFile = files.find(file => isImageFile(file.name));
        if (imageFile) {
          setAvatarUrl(new URL(imageFile.file_path, API_DOMAIN).href);
        } else {
          setAvatarUrl(null);
        }
      };
      fetchAvatar();
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  // Valores padrão
  let displayName = "Usuário";
  let displayEmail = "Não autenticado";
  let initials = "U";

  const exit = () => {
    logout();
    router.push("/");
  };

  const handleProfileNavigation = () => {
    if (!user) return;
    switch (user.user_type) {
      case "admin":
        router.push("/admin/profile");
        break;
      case "responsible_secretary":
        router.push("/secretary/profile");
        break;
      default:
        router.push("/admin/profile");
        break;
    }
  };

  if (user) {
    displayEmail = user.email;

    if (user.responsible && user.responsible.name) {
      displayName = user.responsible.name.split(" ").slice(0, 2).join(" ");
    } else {
      displayName = user.email;
    }

    const nameForInitials = user.responsible?.name || user.email;
    initials = nameForInitials
      .split(" ")
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();
  }

  return (
    <header
      className={cn(
        "hidden md:flex items-center justify-between border-b bg-sidebar px-6 py-1.5",
        "fixed top-0 z-30 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "left-16 w-[calc(100%-4rem)]"
          : "left-64 w-[calc(100%-16rem)]"
      )}
    >
      <div /> {/* Espaçador */}
      <div className="flex items-center gap-4">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <div className="flex cursor-pointer items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {displayEmail}
                </span>
              </div>
              <Avatar className="h-10 w-10 shadow-sm">
                {/* A URL da imagem agora vem do estado 'avatarUrl' */}
                <AvatarImage src={avatarUrl ?? undefined} alt="Foto do usuário" />
                <AvatarFallback className="bg-card ">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <ThemeToggleButton />

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 bg-card"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.responsible?.name || user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileNavigation}>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exit}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};