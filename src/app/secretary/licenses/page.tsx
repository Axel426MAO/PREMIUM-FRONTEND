"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Trash2,
  Search,
  BookOpen,
  Send,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Building,
  PlusCircle,
} from "lucide-react";
import {
  getLicenseBatches,
  getLicenseBatchesBySecretaryId,
  deleteLicenseBatch,
  type LicenseBatchApiResponse,
} from "./services/api";
import { toast } from "sonner";
import { useUserStore } from "@/app/store/userStore";
import { cn } from "@/lib/utils";
import { updateLicenseBatchStatus } from "@/app/admin/licenses/services/api";

// --- TIPOS ---
type LicenseBatchStatus = LicenseBatchApiResponse["status"];
type LicenseBatchViewData = LicenseBatchApiResponse & {
  formattedCreatedAt: string;
  customerName: string;
  quantityAvailable: number;
  quantityDistributed: number;
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
  // (A função getStatusClasses permanece a mesma)
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

// --- SUB-COMPONENTE PARA A TABELA DE DISTRIBUIÇÕES ---
const ChildBatchesSubTable: React.FC<{
  childBatches: LicenseBatchApiResponse["child_batches"];
}> = ({ childBatches }) => {
  if (!childBatches || childBatches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4 text-center">
        Nenhuma licença distribuída a partir deste lote.
      </p>
    );
  }
  return (
    <div className="bg-muted/50 p-4">
      <h4 className="font-bold mb-2 pl-2">Distribuições para Escolas:</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Escola</TableHead>
            <TableHead className="text-center">Quantidade</TableHead>
            <TableHead>Data de Envio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {childBatches.map((child) => (
            <TableRow key={child.id} className="bg-background">
              <TableCell className="font-medium flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                {child.school?.name ?? "N/A"}
              </TableCell>
              <TableCell className="text-center">{child.quantity}</TableCell>
              <TableCell>
                {new Date(child.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function LicenseBatchesPage() {
  const router = useRouter();
  const { user } = useUserStore();
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const isSecretaryUser = user?.user_type === "responsible_secretary";

  const fetchBatches = useCallback(
    async (showToast = false) => {
      if (!user) return;
      setIsLoading(true);
      try {
        let apiData: LicenseBatchApiResponse[];

        if (isSecretaryUser) {
          if (!user.responsible?.secretary?.id) {
            throw new Error("ID da secretaria não encontrado.");
          }
          apiData = await getLicenseBatchesBySecretaryId(
            user.responsible.secretary.id
          );
        } else {
          apiData = await getLicenseBatches();
        }

        const viewData: LicenseBatchViewData[] = apiData.map((batch) => {
          const distributed =
            batch.child_batches?.reduce(
              (sum, child) => sum + child.quantity,
              0
            ) || 0;
          return {
            ...batch,
            formattedCreatedAt: new Date(batch.createdAt).toLocaleDateString(
              "pt-BR"
            ),
            customerName:
              batch.secretary?.name || batch.school?.name || "Não atribuído",
            quantityAvailable: batch.quantity ,
            quantityDistributed: distributed,
          };
        });

        setAllBatches(viewData);
        setError(null);
        if (showToast) toast.success("Lista de licenças atualizada!");
      } catch (err) {
        setError("Não foi possível carregar os lotes de licenças.");
      } finally {
        setIsLoading(false);
      }
    },
    [user, isSecretaryUser]
  );

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleToggleRow = (batchId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) newSet.delete(batchId);
      else newSet.add(batchId);
      return newSet;
    });
  };

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
      toast.error((err as Error).message, { id: toastId });
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
      toast.error((err as Error).message, { id: toastId });
    } finally {
      setBatchToDelete(null);
    }
  };

  const handleViewDetails = (id: number) => {
    const basePath = isSecretaryUser ? "/secretary" : "/admin";
    router.push(`${basePath}/licenses/resume?id=${id}`);
  };

  const handleSendLicenses = (id: number) => {
    router.push(`/secretary/licenses/send?batchId=${id}`);
  };

  const filteredBatches = useMemo(() => {
    let batches = allBatches;
    if (!isSecretaryUser && customerTypeFilter !== "all") {
      batches = batches.filter((batch) => {
        if (customerTypeFilter === "secretary") return !!batch.secretary;
        if (customerTypeFilter === "private_school") return !!batch.school;
        return false;
      });
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      batches = batches.filter(
        (b) =>
          b.book.title.toLowerCase().includes(lower) ||
          b.customerName.toLowerCase().includes(lower)
      );
    }
    return batches;
  }, [allBatches, searchQuery, customerTypeFilter, isSecretaryUser]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isSecretaryUser ? "Licenças Recebidas" : "Gerenciar Licenças"}
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
              placeholder="Buscar por livro ou cliente..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!isSecretaryUser && (
            <Button onClick={() => router.push("/admin/licenses/form")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Criar Lote
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchBatches(true)}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {!isSecretaryUser && (
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit shadow">
          {(Object.keys(customerTypeLabels) as CustomerTypeFilter[]).map(
            (cat) => (
              <Button
                key={cat}
                variant={customerTypeFilter === cat ? "default" : "ghost"}
                onClick={() => setCustomerTypeFilter(cat)}
              >
                {customerTypeLabels[cat]}
              </Button>
            )
          )}
        </div>
      )}

      <div className="shadow rounded-xl border">
        <Table>
          <TableHeader>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Livro</TableHead>
              <TableHead className="hidden sm:table-cell">Cliente</TableHead>
              <TableHead className="text-center">Disponíveis</TableHead>
              <TableHead className="text-center">Distribuídas</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden md:table-cell">Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">Carregando...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-red-500">{error}</TableCell>
              </TableRow>
            ) : filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => (
                <Fragment key={batch.id}>
                  <TableRow className={cn(expandedRows.has(batch.id) && "border-b-0")}>
                    <TableCell>
                      {batch.child_batches && batch.child_batches.length > 0 && (
                        <Button variant="ghost" size="icon" onClick={() => handleToggleRow(batch.id)}>
                          {expandedRows.has(batch.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{batch.book.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{batch.customerName}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">{batch.quantityAvailable}</TableCell>
                    <TableCell className="text-center">{batch.quantityDistributed}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getStatusClasses(batch.status)}>
                        {isSecretaryUser && batch.status === "ENVIADO" ? "Recebido" : statusLabels[batch.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{batch.formattedCreatedAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(batch.id)}>
                            <BookOpen className="mr-2 h-4 w-4" /> Ver Detalhes
                          </DropdownMenuItem>
                          {isSecretaryUser && batch.status === "ENVIADO" && batch.quantityAvailable > 0 && (
                            <DropdownMenuItem onClick={() => handleSendLicenses(batch.id)}>
                              <Send className="mr-2 h-4 w-4" /> Enviar Licenças
                            </DropdownMenuItem>
                          )}
                          {!isSecretaryUser && batch.status === "CRIADO" && (
                            <>
                              <DropdownMenuItem onClick={() => setBatchToSend(batch)}>
                                <Send className="mr-2 h-4 w-4" /> Enviar Lote
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setBatchToDelete(batch)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Lote
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(batch.id) && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <ChildBatchesSubTable childBatches={batch.child_batches} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">Nenhum lote de licenças encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* AlertDialogs para Confirmação de Envio e Exclusão */}
      <AlertDialog open={!!batchToSend} onOpenChange={(isOpen) => !isOpen && setBatchToSend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar o lote do livro <strong>{batchToSend?.book.title}</strong> como "Enviado"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>Confirmar Envio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!batchToDelete} onOpenChange={(isOpen) => !isOpen && setBatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e excluirá o lote do livro <strong>&quot;{batchToDelete?.book.title}&quot;</strong>,
              junto com suas chaves e todas as distribuições.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}