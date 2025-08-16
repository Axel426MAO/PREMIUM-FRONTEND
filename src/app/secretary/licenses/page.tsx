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
  Trash2,
  Search,
  BookOpen,
} from "lucide-react";
import {
  getLicenseBatches,
  deleteLicenseBatch,
  getLicenseBatchesBySecretaryId,
  type LicenseBatchApiResponse,
} from "./services/api";
import { toast } from "sonner";
import { useUserStore } from "@/app/store/userStore";

// --- MODIFICAÇÃO 1: TIPAGEM E MAPEAMENTO DE STATUS ---
type LicenseBatchStatus = LicenseBatchApiResponse["status"];
type LicenseBatchViewData = LicenseBatchApiResponse & {
  formattedCreatedAt: string;
  customerName: string;
};

// Mapeamento para os textos dos status
const statusLabels: Record<LicenseBatchStatus, string> = {
  CRIADO: "CRIADO",
  ENVIADO: "ENVIADO",
  RECEBIDO: "RECEBIDO",
  ATIVO: "ATIVO",
  EXPIRADO: "EXPIRADO",
  PENDENTE: "PENDENTE"
};

// Função para definir a cor do badge com base no status
const getStatusVariant = (status: LicenseBatchStatus) => {
  switch (status) {
    case "CRIADO":
    case "ENVIADO":
    case "RECEBIDO":
    case "ATIVO":
      return "default";
    case "PENDENTE":
      return "secondary";
    case "EXPIRADO":
      return "destructive";
    default:
      return "outline";
  }
};


// --- COMPONENTE PRINCIPAL ---
export default function LicenseBatchesPage() {
  const router = useRouter();
  const [allBatches, setAllBatches] = useState<LicenseBatchViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] =
    useState<LicenseBatchViewData | null>(null);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchBatches = async () => {
      if (!user) {
        setError("Dados do usuário não disponíveis.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        let apiData: LicenseBatchApiResponse[];
        if (user.user_type === "responsible_secretary") {
          if (!user.responsible?.secretary?.id) {
            setError("ID da secretaria não encontrado para o usuário.");
            setIsLoading(false);
            return;
          }
          apiData = await getLicenseBatchesBySecretaryId(
            user.responsible.secretary.id
          );
        } else {
          apiData = await getLicenseBatches();
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
      } catch (err) {
        setError("Não foi possível carregar os lotes de licenças.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, [user]);

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

  const filteredBatches = useMemo(() => {
    if (!searchQuery) {
      return allBatches;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allBatches.filter(
      (batch) =>
        batch.book.title.toLowerCase().includes(lowercasedQuery) ||
        batch.customerName.toLowerCase().includes(lowercasedQuery) ||
        (statusLabels[batch.status] || "").toLowerCase().includes(lowercasedQuery)
    );
  }, [allBatches, searchQuery]);

  // --- MODIFICAÇÃO 2: LÓGICA DE EXIBIÇÃO DO STATUS ---
  const getDisplayStatus = (status: LicenseBatchStatus) => {
    // Se o usuário for da secretaria e o status for "ENVIADO", mostra "RECEBIDO"
    if (user?.user_type === "responsible_secretary" && status === "ENVIADO") {
      return statusLabels["RECEBIDO"];
    }
    // Para todos os outros casos, retorna o label padrão
    return statusLabels[status] || status;
  };


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Licenças
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
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Livro</TableHead>
                <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="hidden md:table-cell">Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
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
                  <TableRow key={batch.id}>
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
                      {/* MODIFICAÇÃO 3: APLICANDO A NOVA LÓGICA */}
                      <Badge variant={getStatusVariant(batch.status)}>
                        {getDisplayStatus(batch.status)}
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
        </CardContent>
      </Card>

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