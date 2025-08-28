"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator, // Importado para separar visualmente as ações
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
  PlusCircle,
  Trash2,
  Search,
  BookOpen,
  Pencil, // Ícone já estava importado
  Send,
} from "lucide-react";
import {
  getLicenseBatches,
  deleteLicenseBatch,
  type LicenseBatchApiResponse,
  updateLicenseBatchStatus,
} from "./services/api";
import { toast } from "sonner";

// --- TIPOS ---
type LicenseBatchStatus = LicenseBatchApiResponse["status"];
type LicenseBatchViewData = LicenseBatchApiResponse & {
  formattedCreatedAt: string;
  customerName: string;
};
type CustomerTypeFilter = "all" | "secretary" | "private_school";

// --- MAPEAMENTOS E FUNÇÕES AUXILIARES ---
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

const customerTypeLabels: Record<CustomerTypeFilter, string> = {
  all: "Todos",
  secretary: "Secretarias",
  private_school: "Escolas Privadas",
};

// --- COMPONENTE PRINCIPAL ---
export default function LicenseBatchesPage() {
  const router = useRouter();
  const [allBatches, setAllBatches] = useState<LicenseBatchViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] =
    useState<CustomerTypeFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] =
    useState<LicenseBatchViewData | null>(null);
  const [batchToSend, setBatchToSend] = useState<LicenseBatchViewData | null>(
    null
  );

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        const apiData = await getLicenseBatches();
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
      } catch (err) {
        setError("Não foi possível carregar os lotes de licenças.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const handleConfirmSend = async () => {
    if (!batchToSend) return;
    const toastId = toast.loading("Enviando lote...");
    try {
      const updatedBatch = await updateLicenseBatchStatus(
        batchToSend.id,
        "ENVIADO"
      );
      setAllBatches((prev) =>
        prev.map((b) =>
          b.id === updatedBatch.id ? { ...b, status: updatedBatch.status } : b
        )
      );
      toast.success("Lote enviado com sucesso!", { id: toastId });
    } catch (err) {
      toast.error((err as Error).message || "Erro ao enviar o lote.", {
        id: toastId,
      });
    } finally {
      setBatchToSend(null);
    }
  };

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
    router.push(`/admin/licenses/resume?id=${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/licenses/edit?id=${id}`);
  };

  const filteredBatches = useMemo(() => {
    let batches = allBatches;

    if (customerTypeFilter !== "all") {
      batches = batches.filter((batch) => {
        if (customerTypeFilter === "secretary") return !!batch.secretary;
        if (customerTypeFilter === "private_school") return !!batch.school;
        return false;
      });
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      batches = batches.filter(
        (batch) =>
          batch.book.title.toLowerCase().includes(lowercasedQuery) ||
          batch.customerName.toLowerCase().includes(lowercasedQuery) ||
          (statusLabels[batch.status] || "")
            .toLowerCase()
            .includes(lowercasedQuery)
      );
    }

    return batches;
  }, [allBatches, searchQuery, customerTypeFilter]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Licenças
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os lotes de licenças de livros digitais.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
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
            onClick={() => router.push("/admin/licenses/form")}
            className="shrink-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Lote
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit shadow">
        {(Object.keys(customerTypeLabels) as CustomerTypeFilter[]).map(
          (cat) => (
            <Button
              key={cat}
              variant={customerTypeFilter === cat ? "default" : "ghost"}
              className="rounded-md"
              onClick={() => setCustomerTypeFilter(cat)}
            >
              {customerTypeLabels[cat]}
            </Button>
          )
        )}
      </div>

      <div className="shadow rounded-xl">
        <Table>
          <TableHeader>
              <TableHead>Livro</TableHead>
              <TableHead className="hidden sm:table-cell">Cliente</TableHead>
              <TableHead className="text-center">Quantidade</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden md:table-cell">Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Carregando...
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
                <TableRow
                  key={batch.id}
                  className="even:bg-gray-100 dark:even:bg-muted/40"
                >
                  <TableCell className="font-medium">
                    {batch.book.title}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
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
                      {statusLabels[batch.status] || batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {batch.formattedCreatedAt}
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
                          onClick={() => handleViewDetails(batch.id)}
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>

                        {/* --- INÍCIO DA MODIFICAÇÃO --- */}
                        {/* Mostra as opções de Enviar, Editar e Excluir apenas se o status for "CRIADO" */}
                        {batch.status === "CRIADO" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setBatchToSend(batch)}
                            >
                              <Send className="mr-2 h-4 w-4" /> Enviar Lote
                            </DropdownMenuItem>
                         
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setBatchToDelete(batch)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir Lote
                            </DropdownMenuItem>
                          </>
                        )}
                        {/* --- FIM DA MODIFICAÇÃO --- */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Nenhum lote encontrado para os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!batchToSend}
        onOpenChange={(isOpen) => !isOpen && setBatchToSend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar o lote{" "}
              <strong>{batchToSend?.book.title}</strong> como{" "}
              <strong>Enviado</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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