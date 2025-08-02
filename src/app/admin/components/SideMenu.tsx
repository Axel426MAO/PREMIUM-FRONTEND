"use client";

// Removido o useState, pois o estado será controlado pelo layout
import { usePathname } from "next/navigation";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Book,
  BoxIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Livros", icon: Book },
  { href: "/admin/secretary", label: "Secretarias", icon: BoxIcon },
];

interface NavLinksProps {
  isCollapsed: boolean;
}

function NavLinks({ isCollapsed }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="grid gap-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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

interface UserProfileProps {
  isCollapsed: boolean;
}

function UserProfile({ isCollapsed }: UserProfileProps) {
  const router = useRouter();

  function logout() {
    localStorage.clear();
    router.push(`/admin/login`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full cursor-pointer items-center gap-3 border-t p-2 transition-colors hover:bg-accent">
          {!isCollapsed && (
            <div className="flex flex-col text-left">
              <p className="text-sm font-medium leading-none">Shadcn</p>
              <p className="text-xs leading-none text-muted-foreground">
                admin@example.com
              </p>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isCollapsed ? "end" : "start"}
        side="right"
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/40 dark:focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- COMPONENTE PRINCIPAL ---
// ✅ Recebe o estado e a função de toggle como props
export function SideMenu({
  isCollapsed,
  toggleCollapse,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 hidden h-screen flex-col justify-between border-r bg-background md:flex",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64" // A largura muda baseada na prop
      )}
    >
      <div>
        <div
          className={cn(
            "flex items-center border-b p-2",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <span className="pl-2 text-lg font-bold">Premium Admin</span>
          )}
          {/* ✅ O botão agora chama a função recebida via prop */}
          <Button variant="ghost" size="icon" onClick={toggleCollapse}>
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        <div className="mt-4">
          <NavLinks isCollapsed={isCollapsed} />
        </div>
      </div>

      <div>
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
