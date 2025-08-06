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
  BookOpen,
} from "lucide-react";
import {
  getLicenseBatches,
  deleteLicenseBatch,
  type LicenseBatchApiResponse,
} from "./services/api";

// Interface para os dados formatados que a tabela irá usar
type LicenseBatchViewData = LicenseBatchApiResponse & {
  formattedCreatedAt: string;
  customerName: string;
};

// Tipo para o filtro de cliente
type CustomerTypeFilter = "all" | "secretary" | "private_school";

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

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        const apiData = await getLicenseBatches();

        // Formata os dados para exibição na tabela
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
  }, []);

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    try {
      await deleteLicenseBatch(batchToDelete.id);
      setAllBatches((current) =>
        current.filter((batch) => batch.id !== batchToDelete.id)
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBatchToDelete(null);
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/admin/licenses/form${id}`); // Rota para ver detalhes do lote
  };

  const filteredBatches = useMemo(() => {
    let batches = allBatches;

    // Etapa 1: Filtrar por tipo de cliente
    if (customerTypeFilter !== "all") {
      batches = batches.filter((batch) => {
        if (customerTypeFilter === "secretary") return !!batch.secretary;
        if (customerTypeFilter === "private_school") return !!batch.school;
        return false;
      });
    }

    // Etapa 2: Filtrar pela Barra de Busca
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

  // Mapeia o status do lote para uma cor de badge
  const statusVariant = (status: LicenseBatchApiResponse["status"]) => {
    switch (status) {
      case "PAID":
      case "SENT":
      case "RECEIVED":
        return "success";
      case "PENDING_PAYMENT":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Lotes de Licenças
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
          <Button onClick={() => router.push("/admin/licenses/form")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Lote
          </Button>
        </div>
      </div>

      {/* ABAS DE FILTRO PRINCIPAL */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit flex-wrap">
        {(Object.keys(customerTypeLabels) as CustomerTypeFilter[]).map(
          (cat) => (
            <Button
              key={cat}
              variant={customerTypeFilter === cat ? "default" : "ghost"}
              className="rounded-md capitalize"
              onClick={() => setCustomerTypeFilter(cat)}
            >
              {customerTypeLabels[cat]}
            </Button>
          )
        )}
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
                <TableHead className="hidden md:table-cell">
                  Data de Criação
                </TableHead>
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
                      <Badge>{batch.status.replace("_", " ")}</Badge>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Nenhum lote encontrado.
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
