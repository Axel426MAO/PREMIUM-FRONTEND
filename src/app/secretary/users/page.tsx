"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
} from "lucide-react";
import { getUsers, deleteUser } from "./services/api";
import { toast } from "sonner";

// --- TIPOS ---
interface UserViewData {
  id: number;
  email: string;
  user_type: string;
  status: "Ativo" | "Inativo";
  createdAt: string;
  responsible?: {
    name: string;
    school?: { name: string };
  };
  student?: {
    name: string;
    school?: { name: string };
  };
  teacher?: {
    name: string;
    school?: { name: string };
  };
}

// Tipo de filtro principal simplificado
type MainUserCategory = "all" | "resp_school" | "student" | "teacher";

// --- COMPONENTE PRINCIPAL ---
export default function UsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainCategoryFilter, setMainCategoryFilter] =
    useState<MainUserCategory>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserViewData | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const apiData = await getUsers();
        const viewData: any[] = apiData.map((user: any) => ({
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          status: user.status ? "Ativo" : "Inativo",
          createdAt: new Date(user.createdAt).toLocaleDateString("pt-BR"),
          responsible: user.responsible,
          student: user.student,
          teacher: user.teacher,
        }));
        setAllUsers(viewData);
        setError(null);
      } catch (err) {
        setError("Não foi possível carregar os dados dos usuários.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const toastId = toast.loading("Excluindo usuário...");
    try {
      await deleteUser(userToDelete.id);
      setAllUsers((current) =>
        current.filter((user) => user.id !== userToDelete.id)
      );
      toast.success("Usuário excluído com sucesso.", { id: toastId });
    } catch (err) {
      toast.error((err as Error).message, { id: toastId });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/users/form?id=${id}`);
  };

  const filteredUsers = useMemo(() => {
    let users = allUsers;

    // Etapa 1: Filtrar pela Categoria Principal (lógica simplificada)
    if (mainCategoryFilter !== "all") {
      users = users.filter((user) => {
        switch (mainCategoryFilter) {
          case "resp_school":
            return !!user.responsible?.school;
          case "student":
            return user.user_type === "student";
          case "teacher":
            return user.user_type === "teacher";
          default:
            return true;
        }
      });
    }

    // Etapa 2: Filtrar pela Barra de Busca
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      users = users.filter((user) => {
        const profile = user.responsible || user.student || user.teacher;
        return (
          user.email.toLowerCase().includes(lowercasedQuery) ||
          (profile?.name &&
            profile.name.toLowerCase().includes(lowercasedQuery)) ||
          user.user_type.toLowerCase().includes(lowercasedQuery)
        );
      });
    }

    return users;
  }, [allUsers, searchQuery, mainCategoryFilter]);

  // Labels para os filtros principais (simplificado)
  const mainCategoryLabels: Record<MainUserCategory, string> = {
    all: "Todos",
    resp_school: "Responsavel de Escola",
    student: "Alunos",
    teacher: "Professores",
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e suas permissões.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por e-mail, nome ou tipo..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/admin/users/form")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* ABAS DE FILTRO PRINCIPAL (RENDERIZA APENAS AS OPÇÕES SIMPLIFICADAS) */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit flex-wrap">
        {(Object.keys(mainCategoryLabels) as MainUserCategory[]).map((cat) => (
          <Button
            key={cat}
            variant={mainCategoryFilter === cat ? "default" : "ghost"}
            className="rounded-md capitalize"
            onClick={() => setMainCategoryFilter(cat)}
          >
            {mainCategoryLabels[cat]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail / Nome</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Tipo / Vínculo
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Data de Criação
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-red-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const profile = user.responsible || user.student || user.teacher;
                  const school = user.responsible?.school || user.student?.school || user.teacher?.school;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          {profile?.name && (
                            <span className="text-xs text-muted-foreground">
                              {profile.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {school ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {mainCategoryLabels[user.user_type as keyof typeof mainCategoryLabels] || user.user_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {school.name}
                            </span>
                          </div>
                        ) : (
                          user.user_type
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.createdAt}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            user.status === "Ativo" ? "default" : "destructive"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEdit(user.id)}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setUserToDelete(user)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>&quot;{userToDelete?.email}&quot;</strong>? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}