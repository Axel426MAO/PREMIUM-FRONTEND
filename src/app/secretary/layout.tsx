"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

import "../globals.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { AuthProvider } from "../utils/contexts/AuthContext";
import RouteGuard from "../utils/auth/guard";
import { NavLinks, SideMenu } from "../shared/components/SideMenu";
import { useUserStore } from "../store/userStore";

// 1. Importar o store do Zustand

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const protectedRoutes = [
  "/secretary",
  "/secretary/books",
  "/secretary/books/form",
  "/secretary/users",
  "/secretary/users/form",
  "/secretary/schools",
  "/secretary/schools/form",
  "/secretary/schools/edit",
  "/secretary/licenses",
  "/secretary/licenses/form",
  "/secretary/licenses/resume",
];

// Componente de cabeçalho para o desktop, agora dinâmico
const DesktopHeader = ({ isCollapsed }: { isCollapsed: boolean }) => {
  // 2. Obter o usuário e a função de logout do store
  const { user, logout } = useUserStore();

  // 3. Lógica para definir o nome de exibição e email dinamicamente
  let displayName = "Usuário";
  let displayEmail = "Não autenticado";
  let initials = "U";

  if (user) {
    displayEmail = user.email; // O email sempre existe se o usuário estiver logado

    // Se não houver perfil de responsável, o nome de exibição é o próprio email
    if (!user.responsible) {
      displayName = user.email;
    } else {
      // Lógica baseada no user_type
      switch (user.user_type) {
        case "admin":
          displayName = "Responsável Editoria Premium";
          break;
        case "responsible_secretary":
          // Verifica se a secretaria é estadual. A verificação `is_state_level` é mais robusta.
          if (user.responsible.secretary?.is_state_level) {
            displayName = "Responsável da Secretaria Estadual";
          } else {
            displayName = "Responsável da Secretaria Municipal";
          }
          break;
        default:
          // Um fallback caso existam outros tipos de usuário
          displayName = user.responsible.name;
          break;
      }
    }

    // 4. Lógica para gerar as iniciais para o Avatar
    // Pega as iniciais do nome do responsável, se existir, senão do email.
    const nameForInitials = user.responsible?.name || user.email;
    initials = nameForInitials
      .split(" ")
      .slice(0, 2)
      .map((n: any) => n[0])
      .join("")
      .toUpperCase();
  }

  return (
    <header
      className={cn(
        "hidden md:flex items-center justify-end border-b bg-white px-6 py-2 dark:bg-gray-950",
        "fixed top-0 z-30 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "left-16 w-[calc(100%-4rem)]"
          : "left-64 w-[calc(100%-16rem)]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          {" "}
          {/* Alinhado à direita para melhor visual */}
          {/* 5. Usar as variáveis dinâmicas no JSX */}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {displayEmail}
          </span>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarImage src="" alt="Foto do usuário" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const { logout } = useUserStore(); // Pega o logout para o menu mobile

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-gray-950">
      <SideMenu isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      <DesktopHeader isCollapsed={isCollapsed} />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <header className="md:hidden flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center border-b p-2 justify-between">
                  <span className="pl-2 text-lg font-bold">Editora Premium</span>
                </div>
                <div className="mt-4">
                  <NavLinks isCollapsed={false} />
                </div>
              </div>
              <div className="mt-auto border-t p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start mt-4"
                  onClick={logout} // Lógica de logout adicionada
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold text-lg">Dashboard</h1>
        </header>
        <main className="flex-1 bg-gray-50/50 md:pt-16">{children}</main>{" "}
        {/* Ajustei o padding-top */}
      </div>
      <Toaster richColors />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isProtectedRoute = protectedRoutes.includes(pathname);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          {isProtectedRoute ? (
            <RouteGuard>
              <AdminPanelLayout>{children}</AdminPanelLayout>
            </RouteGuard>
          ) : (
            children
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
