"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

// --- NOSSAS IMPORTAÇÕES DE AUTENTICAÇÃO ---
// -----------------------------------------

// Seus outros imports
import "../globals.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SideMenu } from "./components/SideMenu";
import { AuthProvider } from "./contexts/AuthContext";
import RouteGuard from "./auth/guard";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// ===================================================================
// CONFIGURAÇÃO CENTRALIZADA DAS ROTAS PROTEGIDAS
// ===================================================================
const protectedRoutes = [
  "/admin",
  "/admin/books",
  "/admin/books/form",
  "/admin/users",
  "/admin/secretary",
  "/settings",
  // Adicione aqui qualquer outra rota que precise de proteção
];
// ===================================================================

// Componente interno para o layout do painel de admin
// Isso ajuda a manter o código limpo, separando a lógica do layout protegido.
function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-gray-950">
      <SideMenu isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out",
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
            <SheetContent side="left">
              {/* Conteúdo do menu móvel pode ser adicionado aqui */}
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold text-lg">Dashboard</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
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
