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
import { getSchools, deleteSchool } from "./services/api"; // Importa as funções da API

// Interface para os dados formatados que a tabela usará
interface SchoolViewData {
  id: number;
  name: string;
  type: "Pública" | "Privada";
  location: string;
  secretaryName: string;
  status: "Ativa" | "Inativa";
  is_private: boolean; // Mantido para facilitar a filtragem
}

export default function SchoolsPage() {
  const router = useRouter();
  const [allSchools, setAllSchools] = useState<SchoolViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "public" | "private">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar o diálogo de exclusão
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolViewData | null>(
    null
  );

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const apiData = await getSchools();

        // Mapeia os dados da API para o formato que a view precisa
        const viewData: SchoolViewData[] = apiData.map((school) => {
          const mainResponsible = school.responsibles?.[0];
          const userStatus = mainResponsible?.user?.status ?? false;

          return {
            id: school.id,
            name: school.name,
            type: school.is_private ? "Privada" : "Pública",
            location: `${school.address.city} - ${school.address.state}`,
            secretaryName: school.secretary?.name || "N/A",
            status: userStatus ? "Ativa" : "Inativa",
            is_private: school.is_private,
          };
        });

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
  }, []);

  const handleConfirmDelete = async () => {
    // Garante que há uma escola selecionada para deletar
    if (!schoolToDelete) return;

    try {
      // Chama a função da API para deletar
      await deleteSchool(schoolToDelete.id);

      // Remove a escola da lista local para atualizar a UI instantaneamente
      setAllSchools((currentSchools) =>
        currentSchools.filter((school) => school.id !== schoolToDelete.id)
      );

    } catch (err) {
      // Exibe um alerta em caso de erro na exclusão
      alert((err as Error).message || "Ocorreu um erro ao tentar excluir.");
      console.error(err);
    } finally {
      // Fecha o diálogo de confirmação, independentemente do resultado
      setSchoolToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/schools/form?id=${id}`);
  };

  // Lógica de filtragem combinada
  const filteredSchools = useMemo(() => {
    let schools = allSchools;

    // 1. Filtro por tipo (pública/privada)
    if (typeFilter !== "all") {
      schools = schools.filter((school) =>
        typeFilter === "public" ? !school.is_private : school.is_private
      );
    }

    // 2. Filtro por busca de texto
    if (searchQuery) {
      schools = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          school.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          school.secretaryName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return schools;
  }, [allSchools, searchQuery, typeFilter]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Escolas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as escolas da rede pública e privada.
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

      {/* FILTRO DE ABAS */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={typeFilter === "all" ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => setTypeFilter("all")}
        >
          Todas
        </Button>
        <Button
          variant={typeFilter === "public" ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => setTypeFilter("public")}
        >
          Públicas
        </Button>
        <Button
          variant={typeFilter === "private" ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => setTypeFilter("private")}
        >
          Privadas
        </Button>
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
                          <DropdownMenuItem onClick={() => handleEdit(school.id)}>
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