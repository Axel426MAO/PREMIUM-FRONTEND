"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

import "../globals.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { SideMenu, NavLinks } from "../shared/components/SideMenu";
import RouteGuard from "../utils/auth/guard";
import { AuthProvider } from "../utils/contexts/AuthContext";
import { ThemeToggleButton } from "../shared/components/ThemeToggleButton";

import { DesktopHeader } from "../shared/components/Header";

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
  "/admin/profile",
];

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
