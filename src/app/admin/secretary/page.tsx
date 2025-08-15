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
  User,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import { getSecretaries, deleteSecretary } from "./services/api";
import { toast } from "sonner";

// --- TIPOS ---
interface SecretaryViewData {
  id: number;
  name: string;
  responsible: string;
  email: string;
  phone: string;
  status: "Ativa" | "Inativa";
  is_state_level: boolean;
}

// --- COMPONENTE DE CARD PARA A VISÃO MOBILE (Refatorado com Tailwind CSS) ---
const SecretaryCard: FC<{
  secretary: SecretaryViewData;
  onEdit: (id: number) => void;
  onDelete: (secretary: SecretaryViewData) => void;
}> = ({ secretary, onEdit, onDelete }) => {
  return (
    <div className="w-full bg-background border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-md flex flex-col">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-800 leading-tight">
            {secretary.name}
          </h3>
          <Badge variant={secretary.is_state_level ? "secondary" : "outline"}>
            {secretary.is_state_level ? "Estadual" : "Municipal"}
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
            <DropdownMenuItem onClick={() => onEdit(secretary.id)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(secretary)}
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
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{secretary.responsible}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{secretary.email}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Phone className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{secretary.phone}</span>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="pt-4 mt-auto">
        <Badge
          variant={secretary.status === "Ativa" ? "default" : "destructive"}
        >
          {secretary.status}
        </Badge>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function SecretaryPage() {
  const router = useRouter();
  const [allSecretaries, setAllSecretaries] = useState<SecretaryViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "municipal" | "state">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secretaryToDelete, setSecretaryToDelete] =
    useState<SecretaryViewData | null>(null);

  useEffect(() => {
    const fetchSecretaries = async () => {
      try {
        setIsLoading(true);
        const apiData = await getSecretaries();
        const viewData: SecretaryViewData[] = apiData.map((sec) => {
          const mainResponsible = sec.responsibles[0];
          const user = mainResponsible?.user;
          return {
            id: sec.id,
            name: sec.name,
            responsible: mainResponsible?.name || "N/A",
            email: user?.email || "N/A",
            phone: mainResponsible?.phone || mainResponsible?.whatsapp || "N/A",
            status: user?.status ? "Ativa" : "Inativa",
            is_state_level: sec.is_state_level,
          };
        });
        setAllSecretaries(viewData);
        setError(null);
      } catch (err) {
        setError("Não foi possível carregar os dados das secretarias.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSecretaries();
  }, []);

  const handleConfirmDelete = async () => {
    if (!secretaryToDelete) return;
    const toastId = toast.loading("Excluindo secretaria...");
    try {
      await deleteSecretary(secretaryToDelete.id);
      setAllSecretaries((current) =>
        current.filter((sec) => sec.id !== secretaryToDelete.id)
      );
      toast.success("Secretaria excluída com sucesso.", { id: toastId });
    } catch (err) {
      toast.error((err as Error).message || "Erro ao excluir secretaria.", {
        id: toastId,
      });
      console.error("Erro ao deletar:", err);
    } finally {
      setSecretaryToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/secretary/edit?id=${id}`);
  };

  const filteredSecretaries = useMemo(() => {
    let secretaries = allSecretaries;
    if (levelFilter !== "all") {
      secretaries = secretaries.filter((sec) =>
        levelFilter === "state" ? sec.is_state_level : !sec.is_state_level
      );
    }
    if (searchQuery) {
      secretaries = secretaries.filter(
        (sec) =>
          sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sec.responsible.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return secretaries;
  }, [allSecretaries, searchQuery, levelFilter]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Secretarias
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as secretarias e seus responsáveis.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou responsável..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => router.push("/admin/secretary/form")}
            className="shrink-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* FILTRO DE ABAS */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        <Button
          variant={levelFilter === "all" ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => setLevelFilter("all")}
        >
          Todas
        </Button>
        <Button
          variant={levelFilter === "municipal" ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => setLevelFilter("municipal")}
        >
          Municipais
        </Button>
        <Button
          variant={levelFilter === "state" ? "default" : "ghost"}
          className="rounded-md"
          onClick={() => setLevelFilter("state")}
        >
          Estaduais
        </Button>
      </div>

      {/* Conteúdo Principal: Cards ou Tabela */}
      <Card>
        <CardContent className="p-0">
          {/* Visão de Tabela para Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-red-600"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredSecretaries.length > 0 ? (
                  filteredSecretaries.map((secretary) => (
                    <TableRow key={secretary.id} className="odd:bg-muted/50">
                      <TableCell className="font-medium">
                        {secretary.name}
                      </TableCell>
                      <TableCell>{secretary.responsible}</TableCell>
                      <TableCell>
                        <div className="text-sm">{secretary.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {secretary.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            secretary.status === "Ativa"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {secretary.status}
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
                              onClick={() => handleEdit(secretary.id)}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSecretaryToDelete(secretary)}
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
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma secretaria encontrada.
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
            ) : filteredSecretaries.length > 0 ? (
              filteredSecretaries.map((secretary) => (
                <SecretaryCard
                  key={secretary.id}
                  secretary={secretary}
                  onEdit={handleEdit}
                  onDelete={setSecretaryToDelete}
                />
              ))
            ) : (
              <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
                Nenhuma secretaria encontrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!secretaryToDelete}
        onOpenChange={(isOpen) => !isOpen && setSecretaryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a secretaria{" "}
              <strong>&quot;{secretaryToDelete?.name}&quot;</strong>? Esta ação
              não pode ser desfeita.
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
