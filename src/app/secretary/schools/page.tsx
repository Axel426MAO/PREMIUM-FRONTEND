// src/app/admin/schools/page.tsx
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
// Importar ambas as funções da API
import {
  getSchools,
  deleteSchool,
  getSchoolsBySecretaryId,
} from "./services/api";
import { toast } from "sonner"; // Usando sonner para toasts
import { useUserStore } from "@/app/store/userStore"; // Importar o store de usuário

// Interface para os dados formatados que a tabela usará
interface SchoolViewData {
  id: number;
  name: string;
  type: "Pública" | "Privada";
  location: string;
  secretaryName: string;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [allSchools, setAllSchools] = useState<SchoolViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolViewData | null>(
    null
  );
  // Obter os dados do usuário do store
  const { user } = useUserStore();

  useEffect(() => {
    const fetchSchools = async () => {
      // Garantir que o usuário e o ID da secretaria estejam disponíveis para evitar chamadas à API incorretas
      if (!user) {
        setError("Dados do usuário não disponíveis.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let apiData;

        // Lógica condicional para buscar as escolas
        if (user.user_type === "responsible_secretary") {
          // Se for um secretário, busque apenas as escolas da sua secretaria
          if (!user.responsible?.secretary?.id) {
            setError("ID da secretaria não encontrado para o usuário.");
            setIsLoading(false);
            return;
          }
          apiData = await getSchoolsBySecretaryId(user.responsible?.secretary?.id);
        } else {
          // Se for um administrador, busque todas as escolas
          apiData = await getSchools();
        }

        const viewData: SchoolViewData[] = apiData.map((school) => ({
          id: school.id,
          name: school.name,
          type: school.is_private ? "Privada" : "Pública",
          location: `${school.address.city} - ${school.address.state}`,
          secretaryName: school.secretary?.name || "N/A",
        }));

        setAllSchools(viewData);
        setError(null);
      } catch (err) {
        setError("Não foi possível carregar os dados das escolas.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchools();
    // Adicionar 'user' como dependência para re-executar a busca se o usuário mudar
  }, [user]);

  // Resto do componente permanece o mesmo...
  // ... (handleConfirmDelete, handleEdit, filteredSchools, o JSX)

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    const toastId = toast.loading("Excluindo escola...");

    try {
      await deleteSchool(schoolToDelete.id);
      setAllSchools((currentSchools) =>
        currentSchools.filter((school) => school.id !== schoolToDelete.id)
      );
      toast.success("Escola excluída com sucesso.", { id: toastId });
    } catch (err) {
      toast.error(
        (err as Error).message || "Ocorreu um erro ao tentar excluir.",
        { id: toastId }
      );
    } finally {
      setSchoolToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/schools/edit?id=${id}`);
  };

  // Lógica de filtragem simplificada, apenas com a busca por texto
  const filteredSchools = useMemo(() => {
    if (!searchQuery) {
      return allSchools;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allSchools.filter(
      (school) =>
        school.name.toLowerCase().includes(lowercasedQuery) ||
        school.location.toLowerCase().includes(lowercasedQuery) ||
        school.secretaryName.toLowerCase().includes(lowercasedQuery)
    );
  }, [allSchools, searchQuery]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Suas Escolas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as escolas vinculadas á sua secretaria.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, local ou secretaria..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/admin/schools/form")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Escola</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Localização
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Secretaria Vinculada
                </TableHead>
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
              ) : filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          school.type === "Pública" ? "default" : "secondary"
                        }
                      >
                        {school.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {school.location}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {school.secretaryName}
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
                            onClick={() => handleEdit(school.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSchoolToDelete(school)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma escola encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!schoolToDelete}
        onOpenChange={(isOpen) => !isOpen && setSchoolToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a escola{" "}
              <strong>&quot;{schoolToDelete?.name}&quot;</strong>? Esta ação não
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
