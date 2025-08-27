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

export const DesktopHeader = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { user, logout } = useUserStore();
  const router = useRouter();

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

    // ======================= INÍCIO DA ALTERAÇÃO =======================
    if (user.responsible && user.responsible.name) {
      // 1. Divide o nome completo em um array de palavras.
      // 2. Pega as duas primeiras palavras com slice(0, 2).
      // 3. Junta as palavras novamente com um espaço.
      displayName = user.responsible.name.split(" ").slice(0, 2).join(" ");
    } else {
      displayName = user.email;
    }
    // ======================= FIM DA ALTERAÇÃO =======================

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
        "hidden md:flex items-center justify-between border-b bg-background px-6 py-1.5",
        "fixed top-0 z-30 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "left-16 w-[calc(100%-4rem)]"
          : "left-64 w-[calc(100%-16rem)]"
      )}
    >
      <div /> {/* Espaçador */}
      <div className="flex items-center gap-4">
        <ThemeToggleButton />

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
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt="Foto do usuário" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {/* ATUALIZAÇÃO: Exibe o nome completo no dropdown */}
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