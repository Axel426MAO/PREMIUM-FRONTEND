"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

// --- Importações de Tema ---
import { ThemeProvider } from "../utils/contexts/ThemeProvider"; // ✨ NOVO

import "../globals.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, User } from "lucide-react";
import { Toaster } from "sonner";
import { SideMenu, NavLinks } from "../shared/components/SideMenu";
import RouteGuard from "../utils/auth/guard";
import { AuthProvider } from "../utils/contexts/AuthContext";
import { useUserStore } from "../store/userStore";
import { ThemeToggleButton } from "../shared/components/ThemeToggleButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const protectedRoutes = [
  "/admin",
  "/admin/books",
  "/admin/books/form",
  "/admin/users",
  "/admin/users/form",
  "/admin/secretary",
  "/admin/secretary/form",
  "/admin/secretary/edit",
  "/admin/schools",
  "/admin/schools/form",
  "/admin/schools/edit",
  "/admin/licenses",
  "/admin/licenses/form",
  "/admin/licenses/resume",
];

const DesktopHeader = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { user, logout } = useUserStore();

  let displayName = "Usuário";
  let displayEmail = "Não autenticado";
  let initials = "U";

  if (user) {
    displayEmail = user.email;
    if (!user.responsible) {
      displayName = user.email;
    } else {
      switch (user.user_type) {
        case "admin":
          displayName = "Responsável Editoria Premium";
          break;
        case "responsible_secretary":
          if (user.responsible.secretary?.is_state_level) {
            displayName = "Responsável da Secretaria Estadual";
          } else {
            displayName = "Responsável da Secretaria Municipal";
          }
          break;
        default:
          displayName = user.responsible.name;
          break;
      }
    }
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
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideMenu isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <DesktopHeader isCollapsed={isCollapsed} />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <header className="md:hidden flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-6">
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
                  <span className="pl-2 text-lg font-bold">
                    Editora Premium
                  </span>
                </div>
                <div className="mt-4">
                  <NavLinks isCollapsed={false} />
                </div>
              </div>
              <div className="mt-auto border-t p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start mt-4"
                  onClick={() => {
                    window.location.href = "./";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold text-lg">Dashboard</h1>
          <ThemeToggleButton />
        </header>

        <main className="flex-1  md:pt-[4%]">{children}</main>
      </div>
      <Toaster richColors />
    </div>
  );
}

export default function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProtectedRoute = protectedRoutes.includes(pathname);

  return (
    <AuthProvider>
      {isProtectedRoute ? (
        <RouteGuard>
          <AdminPanelLayout>{children}</AdminPanelLayout>
        </RouteGuard>
      ) : (
        children
      )}
    </AuthProvider>
  );
}
