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
import { getUsers, deleteUser, type UserApiResponse } from "./services/api";

// Interface de dados para a View, esperando os dados aninhados de escola
interface UserViewData {
  id: number;
  email: string;
  user_type: string;
  status: "Ativo" | "Inativo";
  createdAt: string;
  responsible?: {
    name: string;
    school?: { is_private: boolean; name: string };
    secretary?: { is_state_level: boolean; name: string };
  };
  student?: {
    name: string;
    school?: { is_private: boolean; name: string };
  };
  teacher?: {
    name: string;
    school?: { is_private: boolean; name: string };
  };
}

// Tipos para os dois níveis de filtro
type MainUserCategory =
  | "all"
  | "premium"
  | "resp_sec_estadual"
  | "resp_sec_municipal"
  | "resp_school"
  | "teacher"
  | "student";
type SchoolTypeCategory = "all" | "public" | "private";

export default function UsersPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainCategoryFilter, setMainCategoryFilter] =
    useState<MainUserCategory>("all");
  const [schoolTypeFilter, setSchoolTypeFilter] =
    useState<SchoolTypeCategory>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserViewData | null>(null);

  // Efeito para resetar o sub-filtro de escola ao mudar a categoria principal
  useEffect(() => {
    setSchoolTypeFilter("all");
  }, [mainCategoryFilter]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // Garanta que sua API `getUsers` inclua os dados aninhados necessários
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
    try {
      await deleteUser(userToDelete.id);
      setAllUsers((current) =>
        current.filter((user) => user.id !== userToDelete.id)
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUserToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/users/form?id=${id}`);
  };

  const filteredUsers = useMemo(() => {
    let users = allUsers;

    // Etapa 1: Filtrar pela Categoria Principal
    if (mainCategoryFilter !== "all") {
      users = users.filter((user) => {
        const type = user.user_type;
        switch (mainCategoryFilter) {
          case "premium":
            return type === "admin";
          case "resp_sec_municipal":
            return user.responsible?.secretary?.is_state_level === false;
          case "resp_sec_estadual":
            return user.responsible?.secretary?.is_state_level === true;
          case "resp_school":
            return !!user.responsible?.school;
          case "student":
            return type === "student";
          case "teacher":
            return type === "teacher";
          default:
            return true;
        }
      });
    }

    // Etapa 2: Filtrar pelo Tipo de Escola (sub-filtro), se aplicável
    if (schoolTypeFilter !== "all") {
      users = users.filter((user) => {
        const school =
          user.responsible?.school ||
          user.student?.school ||
          user.teacher?.school;
        if (!school) return false; // Se não tiver escola, não passa no filtro
        return schoolTypeFilter === "public"
          ? school.is_private === false
          : school.is_private === true;
      });
    }

    // Etapa 3: Filtrar pela Barra de Busca
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
  }, [allUsers, searchQuery, mainCategoryFilter, schoolTypeFilter]);

  const mainCategoryLabels: Record<MainUserCategory, string> = {
    all: "Todos",
    premium: "Premium",
    resp_sec_estadual: "Resp. Sec. Estadual",
    resp_sec_municipal: "Resp. Sec. Municipal",
    resp_school: "Resp. Escolas",
    teacher: "Professores",
    student: "Alunos",
  };

  const showSchoolTypeFilter = ["resp_school", "student", "teacher"].includes(
    mainCategoryFilter
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8  min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
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

      <div className="flex flex-col gap-4">
        {/* ABAS DE FILTRO PRINCIPAL */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit flex-wrap">
          {(Object.keys(mainCategoryLabels) as MainUserCategory[]).map(
            (cat) => (
              <Button
                key={cat}
                variant={mainCategoryFilter === cat ? "default" : "ghost"}
                className="rounded-md capitalize"
                onClick={() => setMainCategoryFilter(cat)}
              >
                {mainCategoryLabels[cat]}
              </Button>
            )
          )}
        </div>

        {/* SUB-FILTRO DE ESCOLA (RENDERIZAÇÃO CONDICIONAL) */}
        {showSchoolTypeFilter && (
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit flex-wrap">
            <Button
              variant={schoolTypeFilter === "all" ? "secondary" : "ghost"}
              onClick={() => setSchoolTypeFilter("all")}
            >
              Todos os Tipos
            </Button>
            <Button
              variant={schoolTypeFilter === "public" ? "secondary" : "ghost"}
              onClick={() => setSchoolTypeFilter("public")}
            >
              Pública
            </Button>
            <Button
              variant={schoolTypeFilter === "private" ? "secondary" : "ghost"}
              onClick={() => setSchoolTypeFilter("private")}
            >
              Privada
            </Button>
          </div>
        )}
      </div>

      <Card className="py-0 rounded">
        <CardContent className="p-0 rounded">
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
                  const profile =
                    user.responsible || user.student || user.teacher;
                  const school =
                    user.responsible?.school ||
                    user.student?.school ||
                    user.teacher?.school;
                  const secretary = user.responsible?.secretary;

                  return (
                    <TableRow
                      key={user.id}
                      className="even:bg-gray-100 dark:even:bg-muted/40"
                    >
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
                        {secretary ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {secretary.is_state_level
                                ? "Resp. Sec. Estadual"
                                : "Resp. Sec. Municipal"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {secretary.name}
                            </span>
                          </div>
                        ) : school ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {school.is_private
                                ? "Escola Privada"
                                : "Escola Pública"}
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
