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
  Search,
  BookOpen,
  Users,
  Hash,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  getLicenseBatches,
  deleteLicenseBatch,
  type LicenseBatchApiResponse,
} from "./services/api";
import { toast } from "sonner";


// --- TIPOS ---
type LicenseBatchViewData = LicenseBatchApiResponse & {
  formattedCreatedAt: string;
  customerName: string;
};

type CustomerTypeFilter = "all" | "secretary" | "private_school";

// --- COMPONENTE DE CARD PARA A VISÃO MOBILE ---
const LicenseBatchCard: FC<{
  batch: LicenseBatchViewData;
  onViewDetails: (id: number) => void;
  onDelete: (batch: LicenseBatchViewData) => void;
  statusVariant: (status: LicenseBatchApiResponse["status"]) => "default" | "secondary" | "destructive" | "outline";
}> = ({ batch, onViewDetails, onDelete, statusVariant }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-md flex flex-col">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="space-y-1.5 pr-2">
          <h3 className="text-base font-bold text-slate-800 leading-tight">{batch.book.title}</h3>
          <p className="text-sm text-slate-500 truncate">{batch.customerName}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 -mr-2 -mt-1 text-slate-500 shrink-0">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(batch.id)}>
              <BookOpen className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(batch)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Lote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Conteúdo do Card */}
      <div className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-3 text-slate-600">
          <Hash className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{batch.quantity} licenças</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span>Criado em {batch.formattedCreatedAt}</span>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="pt-4 mt-auto">
        <Badge variant={statusVariant(batch.status)}>
          {batch.status.replace("_", " ")}
        </Badge>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
export default function LicenseBatchesPage() {
  const router = useRouter();
  const [allBatches, setAllBatches] = useState<LicenseBatchViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerTypeFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<LicenseBatchViewData | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        const apiData = await getLicenseBatches();
        const viewData: LicenseBatchViewData[] = apiData.map((batch) => ({
          ...batch,
          formattedCreatedAt: new Date(batch.createdAt).toLocaleDateString("pt-BR"),
          customerName: batch.secretary?.name || batch.school?.name || "Não atribuído",
        }));
        setAllBatches(viewData);
        setError(null);
      } catch (err) {
        setError("Não foi possível carregar os lotes de licenças.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    const toastId = toast.loading("Excluindo lote...");
    try {
      await deleteLicenseBatch(batchToDelete.id);
      setAllBatches((current) => current.filter((batch) => batch.id !== batchToDelete.id));
      toast.success("Lote excluído com sucesso.", { id: toastId });
    } catch (err) {
      toast.error((err as Error).message || "Erro ao excluir o lote.", { id: toastId });
    } finally {
      setBatchToDelete(null);
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/admin/licenses/${id}`);
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
          batch.status.toLowerCase().includes(lowercasedQuery)
      );
    }

    return batches;
  }, [allBatches, searchQuery, customerTypeFilter]);

  const customerTypeLabels: Record<CustomerTypeFilter, string> = {
    all: "Todos",
    secretary: "Secretarias",
    private_school: "Escolas Privadas",
  };

  const statusVariant = (status: LicenseBatchApiResponse["status"]) => {
    switch (status) {
      case "PAID":
      case "SENT":
      case "RECEIVED":
        return "default"; // Geralmente verde ou azul primário
      case "PENDING_PAYMENT":
        return "secondary"; // Cinza
      case "CANCELLED":
        return "destructive"; // Vermelho
      default:
        return "outline";
    }
  };

  const FeedbackComponent = ({ message, showLoader = false }: { message: string, showLoader?: boolean }) => (
    <div className="flex flex-col items-center justify-center text-center h-48 gap-4 text-slate-500">
      {showLoader && <Loader2 className="h-8 w-8 animate-spin text-slate-400" />}
      <p>{message}</p>
    </div>
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Lotes de Licenças
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie os lotes de licenças de livros digitais.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Buscar por livro, cliente ou status..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/admin/licenses/form")} className="shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Lote
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        {(Object.keys(customerTypeLabels) as CustomerTypeFilter[]).map(
          (cat) => (
            <Button
              key={cat}
              variant={customerTypeFilter === cat ? "default" : "ghost"}
              className="rounded-md capitalize shrink-0"
              onClick={() => setCustomerTypeFilter(cat)}
            >
              {customerTypeLabels[cat]}
            </Button>
          )
        )}
      </div>

      <div>
        {isLoading ? (
          <FeedbackComponent message="Carregando lotes de licenças..." showLoader />
        ) : error ? (
          <FeedbackComponent message={error} />
        ) : filteredBatches.length > 0 ? (
          <>
            {/* Visão de Cards para Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:hidden">
              {filteredBatches.map((batch) => (
                <LicenseBatchCard
                  key={batch.id}
                  batch={batch}
                  onViewDetails={handleViewDetails}
                  onDelete={setBatchToDelete}
                  statusVariant={statusVariant}
                />
              ))}
            </div>

            {/* Visão de Tabela para Desktop */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Livro</TableHead>
                      <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.book.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{batch.customerName}</TableCell>
                        <TableCell className="text-center">{batch.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusVariant(batch.status)}>
                            {batch.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{batch.formattedCreatedAt}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(batch.id)}>
                                <BookOpen className="mr-2 h-4 w-4" /> Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setBatchToDelete(batch)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Lote
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <FeedbackComponent message="Nenhum lote encontrado para os filtros aplicados." />
        )}
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
