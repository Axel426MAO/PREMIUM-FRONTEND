"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Book,
  Landmark,
  School,
  KeyRound,
} from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavLinksProps {
  isCollapsed: boolean;
}

export function NavLinks({ isCollapsed }: NavLinksProps) {
  const pathname = usePathname();
  const { user } = useUserStore();

  // <-- 3. Lógica do logoname foi REMOVIDA daqui.
  const navItems = useMemo(() => {
    const userType = user?.user_type;

    if (userType === "admin") {
      return [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/secretary", label: "Secretarias", icon: Landmark },
        { href: "/admin/schools", label: "Escolas", icon: School },
        { href: "/admin/books", label: "Livros", icon: Book },
        { href: "/admin/users", label: "Usuários", icon: Users },
        { href: "/admin/licenses", label: "Licenças", icon: KeyRound },
      ];
    }

    if (userType === "responsible_secretary") {
      // A linha "logoname = ..." foi removida daqui.
      return [
        { href: "/secretary", label: "Dashboard", icon: LayoutDashboard },
        { href: "/secretary/schools", label: "Escolas", icon: School },
        { href: "/secretary/books", label: "Livros", icon: Book },
        { href: "/secretary/licenses", label: "Licenças", icon: KeyRound },
      ];
    }

    return [];
  }, [user]);

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="grid px-2">
        {navItems.map((item) => {
          let isActive = false;
          if (item.label === "Dashboard") {
            isActive = pathname === item.href;
          } else {
            isActive = pathname.startsWith(item.href);
          }

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-colors",
                    isCollapsed ? "h-10 w-10 p-0 justify-center" : "h-10"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon
                      className={cn("h-5 w-5", !isCollapsed && "mr-3")}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export function SideMenu({
  isCollapsed,
  toggleCollapse,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}) {
  // <-- 1. Obter o objeto 'user' completo do store.
  const { user, logout } = useUserStore();
  const router = useRouter();

  // <-- 2. Lógica para definir o nome do logo foi MOVIDA para cá.
  const logoname = useMemo(() => {
    if (user?.user_type === "responsible_secretary") {
      // Tenta pegar o nome real da secretaria, com um fallback.
      return  "Portal da Secretaria";
    }
    return "Editora Premium";
  }, [user]);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 hidden h-screen flex-col border-r bg-background md:flex",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1">
        <div
          className={cn(
            "flex items-center border-b p-2",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <span className="pl-2 text-lg font-bold">{logoname}</span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleCollapse}>
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            <span className="sr-only">Recolher menu</span>
          </Button>
        </div>
        <div className="mt-4">
          <NavLinks isCollapsed={isCollapsed} />
        </div>
      </div>

      <div className="mt-auto border-t p-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-500",
                  isCollapsed ? "h-10 w-10 p-0 justify-center" : "h-10"
                )}
              >
                <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Sair</span>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}