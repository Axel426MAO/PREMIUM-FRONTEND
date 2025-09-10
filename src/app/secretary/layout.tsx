"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

import "../globals.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User } from "lucide-react";
import { Toaster } from "sonner";
import { AuthProvider } from "../utils/contexts/AuthContext";
import RouteGuard from "../utils/auth/guard";
import { NavLinks, SideMenu } from "../shared/components/SideMenu";
import { useUserStore } from "../store/userStore";

import { DesktopHeader } from "../shared/components/Header";

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
  "/secretary/licenses/send",
  "/secretary/licenses/resume",
  "/secretary/profile",
  "/secretary/students",
  "/secretary/students/form",
  "/secretary/students/edit",

  "/secretary/teachers",
  "/secretary/teachers/form",
  "/secretary/teachers/edit",
];

function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const { logout } = useUserStore(); // Pega o logout para o menu mobile

  return (
    <div className="flex min-h-screen w-full ">
      <SideMenu isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      <DesktopHeader isCollapsed={isCollapsed} />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <header className="md:hidden flex h-14 items-center gap-4 border-b  px-6 ">
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
                    Premium Editora
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
        <main className="flex-1 md:pt-16">{children}</main>
      </div>
      <Toaster richColors />
    </div>
  );
}

export default function SecretaryAreaLayout({
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
