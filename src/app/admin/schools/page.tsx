"use client";

import { useState, useEffect, useMemo, type FC } from "react";
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
  MapPin,
  Building,
  Loader2,
} from "lucide-react";
import { getSchools, deleteSchool } from "./services/api";
import { toast } from "sonner";

// --- TIPOS ---
interface SchoolViewData {
  id: number;
  name: string;
  type: "Pública" | "Privada";
  location: string;
  secretaryName: string;
  status: "Ativa" | "Inativa";
  is_private: boolean;
}

// --- COMPONENTE DE CARD PARA A VISÃO MOBILE ---
const SchoolCard: FC<{
  school: SchoolViewData;
  onEdit: (id: number) => void;
  onDelete: (school: SchoolViewData) => void;
}> = ({ school, onEdit, onDelete }) => {
  return (
    <div className="w-full bg-background border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-md flex flex-col">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-800 leading-tight">
            {school.name}
          </h3>
          <Badge variant={school.type === "Pública" ? "secondary" : "outline"}>
            {school.type}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 -mr-2 -mt-1 text-slate-500"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(school.id)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(school)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Conteúdo do Card */}
      <div className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-3 text-slate-600">
          <Building className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate" title={school.secretaryName}>
            {school.secretaryName}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{school.location}</span>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="pt-4 mt-auto">
        <Badge variant={school.status === "Ativa" ? "default" : "destructive"}>
          {school.status}
        </Badge>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function SchoolsPage() {
  const router = useRouter();
  const [allSchools, setAllSchools] = useState<SchoolViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "public" | "private">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolViewData | null>(
    null
  );

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const apiData = await getSchools();
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
      console.error(err);
    } finally {
      setSchoolToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/schools/edit?id=${id}`);
  };

  const filteredSchools = useMemo(() => {
    let schools = allSchools;
    if (typeFilter !== "all") {
      schools = schools.filter((school) =>
        typeFilter === "public" ? !school.is_private : school.is_private
      );
    }
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
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
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
          <Button
            onClick={() => router.push("/admin/schools/form")}
            className="shrink-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* FILTRO DE ABAS */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-full sm:w-fit overflow-x-auto shadow">
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

   
          <div className="hidden md:block shadow rounded-xl">
            <Table>
              <TableHeader>
                  <TableHead className="w-[30%]">Escola</TableHead>
                  <TableHead>Secretaria Vinculada</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-red-600"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredSchools.length > 0 ? (
                  filteredSchools.map((school) => (
                    <TableRow
                      key={school.id}
                      className="even:bg-gray-100 dark:even:bg-muted/40"
                    >
                      <TableCell className="font-medium">
                        {school.name}
                      </TableCell>
                      <TableCell>{school.secretaryName}</TableCell>
                      <TableCell>{school.location}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            school.type === "Pública" ? "secondary" : "outline"
                          }
                        >
                          {school.type}
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma escola encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Visão de Cards para Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden p-4">
            {isLoading ? (
              <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
              </div>
            ) : error ? (
              <div className="col-span-full h-24 flex items-center justify-center text-red-600">
                {error}
              </div>
            ) : filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  onEdit={handleEdit}
                  onDelete={setSchoolToDelete}
                />
              ))
            ) : (
              <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
                Nenhuma escola encontrada.
              </div>
            )}
          </div>

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
