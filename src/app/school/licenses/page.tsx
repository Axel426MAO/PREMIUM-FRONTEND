"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  MoreHorizontal,
  Search,
  BookOpen,
  RefreshCw,
  KeyRound, // NOVO: Ícone para a ação de ativar
} from "lucide-react";
import {
  getLicenseBatches,
  deleteLicenseBatch,
  getLicenseBatchesBySecretaryId,
  type LicenseBatchApiResponse,
  getLicenseBatchesBySchoolId,
} from "./services/api";
import { toast } from "sonner";
import { useUserStore } from "@/app/store/userStore";

type LicenseBatchStatus = LicenseBatchApiResponse["status"];
type LicenseBatchViewData = LicenseBatchApiResponse & {
  formattedCreatedAt: string;
  customerName: string;
};

const statusLabels: Record<LicenseBatchStatus, string> = {
  CRIADO: "Criado",
  ENVIADO: "Enviado",
  RECEBIDO: "Recebido",
  ATIVO: "Ativo",
  EXPIRADO: "Expirado",
  PENDENTE: "Pendente",
};

const getStatusClasses = (status: LicenseBatchStatus): string => {
  switch (status) {
    case "ATIVO":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800";
    case "ENVIADO":
    case "RECEBIDO":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800";
    case "PENDENTE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800";
    case "EXPIRADO":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800";
    case "CRIADO":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700";
  }
};

export default function LicenseBatchesPage() {
  const router = useRouter();
  const [allBatches, setAllBatches] = useState<LicenseBatchViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] =
    useState<LicenseBatchViewData | null>(null);
  const { user } = useUserStore();

  const fetchBatches = useCallback(
    async (showToast = false) => {
      if (!user) {
        setError("Dados do usuário não disponíveis.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        let apiData: LicenseBatchApiResponse[];
        if (user.user_type === "responsible_school") {
          if (!user.responsible?.school?.id) {
            throw new Error("ID da escola não encontrado para o usuário.");
          }
          apiData = await getLicenseBatchesBySchoolId(
            user.responsible.school?.id ?? 0
          );
        } else {
          apiData = [];
        }
        const viewData: LicenseBatchViewData[] = apiData.map((batch) => ({
          ...batch,
          formattedCreatedAt: new Date(batch.createdAt).toLocaleDateString(
            "pt-BR"
          ),
          customerName:
            batch.secretary?.name || batch.school?.name || "Não atribuído",
        }));
        setAllBatches(viewData);
        setError(null);
        if (showToast) {
          toast.success("Lista de licenças atualizada!");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(`Não foi possível carregar os lotes: ${errorMessage}`);
        toast.error(`Erro ao atualizar: ${errorMessage}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    const toastId = toast.loading("Excluindo lote...");
    try {
      await deleteLicenseBatch(batchToDelete.id);
      setAllBatches((current) =>
        current.filter((batch) => batch.id !== batchToDelete.id)
      );
      toast.success("Lote excluído com sucesso.", { id: toastId });
    } catch (err) {
      toast.error((err as Error).message || "Erro ao excluir o lote.", {
        id: toastId,
      });
    } finally {
      setBatchToDelete(null);
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/school/licenses/resume?id=${id}`);
  };

  // NOVO: Função para lidar com a ativação de licenças
  const handleActivateLicenses = (id: number) => {
    console.log(`Lógica para ativar licenças do lote ${id} aqui.`);
    toast.info(`Ativação para o lote ${id} foi acionada.`);
    // Futuramente, você pode navegar para uma página de ativação:
    // router.push(`/school/licenses/activate?id=${id}`);
  };

  const filteredBatches = useMemo(() => {
    if (!searchQuery) {
      return allBatches;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allBatches.filter(
      (batch) =>
        batch.book.title.toLowerCase().includes(lowercasedQuery) ||
        batch.customerName.toLowerCase().includes(lowercasedQuery) ||
        (statusLabels[batch.status] || "")
          .toLowerCase()
          .includes(lowercasedQuery)
    );
  }, [allBatches, searchQuery]);

  const getDisplayStatus = (status: LicenseBatchStatus) => {
    if (user?.user_type === "responsible_school" && status === "ENVIADO") {
      return statusLabels["RECEBIDO"];
    }
    return statusLabels[status] || status;
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Licenças Recebidas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as licenças de livros digitais.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por livro, cliente ou status..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchBatches(true)}
            disabled={isLoading}
            aria-label="Recarregar lista"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="shadow rounded-xl">
        <Table>
          <TableHeader>
            <TableHead>Livro</TableHead>
            <TableHead className="hidden sm:table-cell">Cliente</TableHead>
            <TableHead className="text-center">Quantidade</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="hidden md:table-cell">Criação</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Carregando licenças...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-red-500"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">
                    {batch.book.title}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {batch.customerName}
                  </TableCell>
                  <TableCell className="text-center">
                    {batch.quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={getStatusClasses(batch.status)}
                    >
                      {getDisplayStatus(batch.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {batch.formattedCreatedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(batch.id)}
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>

                        {/* NOVO: Renderização condicional do botão */}
                        {batch.quantity > 0 && batch.status !== "ATIVO" && (
                          <DropdownMenuItem
                            onClick={() => handleActivateLicenses(batch.id)}
                          >
                            <KeyRound className="mr-2 h-4 w-4" /> Ativar Licenças
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Nenhum lote de licenças encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!batchToDelete}
        onOpenChange={(isOpen) => !isOpen && setBatchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lote para o livro{" "}
              <strong>&quot;{batchToDelete?.book.title}&quot;</strong>? Todas as{" "}
              <strong>{batchToDelete?._count.license_keys}</strong> chaves de
              licença associadas também serão excluídas. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}