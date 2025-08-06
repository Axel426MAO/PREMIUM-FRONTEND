"use client";

import { useState, useEffect, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Alterado para useSearchParams
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Book,
  Users,
  Hash,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  Copy,
  Loader2,
} from "lucide-react";
import { getLicenseBatchById, type LicenseBatchDetails } from "../services/api";
import { toast } from "sonner";

// --- COMPONENTES INTERNOS ---

// Card para exibir informações de resumo do lote
const InfoCard: FC<{
  icon: React.ReactNode;
  title: string;
  value: string | React.ReactNode;
  className?: string;
}> = ({ icon, title, value, className }) => (
  <div
    className={`bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 ${className}`}
  >
    <div className="bg-slate-100 p-3 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

// Card para exibir uma chave de licença na visão mobile
const LicenseKeyCard: FC<{ license: LicenseBatchDetails["license_keys"][0] }> = ({
  license,
}) => {
  const copyToClipboard = (text: string) => {
    // navigator.clipboard.writeText(text) is not available in this context.
    // Using a fallback.
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success("Código copiado para a área de transferência!");
    } catch (err) {
      toast.error("Falha ao copiar o código.");
    }
    document.body.removeChild(textArea);
  };

  const statusConfig = {
    AVAILABLE: {
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      text: "Disponível",
      color: "bg-blue-100 text-blue-800",
    },
    ACTIVATED: {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      text: "Ativada",
      color: "bg-green-100 text-green-800",
    },
    EXPIRED: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      text: "Expirada",
      color: "bg-red-100 text-red-800",
    },
    REVOKED: {
        icon: <XCircle className="h-4 w-4 text-yellow-500" />,
        text: "Revogada",
        color: "bg-yellow-100 text-yellow-800",
      },
  };

  const currentStatus = statusConfig[license.status] || statusConfig.AVAILABLE;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <code className="font-mono text-sm text-slate-700 break-all pr-2">
          {license.code}
        </code>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => copyToClipboard(license.code)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <Badge className={`${currentStatus.color} font-medium`}>
          {currentStatus.icon}
          <span className="ml-1.5">{currentStatus.text}</span>
        </Badge>
        <div className="text-slate-500">
          {license.activatedAt
            ? `Ativada em: ${new Date(license.activatedAt).toLocaleDateString("pt-BR")}`
            : `Criada em: ${new Date(license.createdAt).toLocaleDateString("pt-BR")}`}
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function LicenseResumePage() {
  const router = useRouter();
  // CORREÇÃO: Usando useSearchParams para ler o ID da URL
  const searchParams = useSearchParams();
  const batchId = searchParams.get("id");

  const [batch, setBatch] = useState<LicenseBatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A verificação agora é feita em uma string ou nulo
    if (batchId) {
      const fetchBatchDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // O ID é convertido para número aqui
          const data = await getLicenseBatchById(Number(batchId));
          setBatch(data);
        } catch (err) {
          setError("Não foi possível carregar os detalhes do lote.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBatchDetails();
    } else {
        // Se não houver ID, podemos parar o carregamento
        setIsLoading(false);
    }
  }, [batchId]);

  const statusVariant = (status: LicenseBatchDetails["status"]) => {
    switch (status) {
      case "PAID":
      case "SENT":
      case "RECEIVED":
        return "default";
      case "PENDING_PAYMENT":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const copyToClipboard = (text: string) => {
    // navigator.clipboard.writeText(text) is not available in this context.
    // Using a fallback.
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success("Código copiado para a área de transferência!");
    } catch (err) {
      toast.error("Falha ao copiar o código.");
    }
    document.body.removeChild(textArea);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-red-500">
        <XCircle className="h-12 w-12 mb-4" />
        <p className="text-lg">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <p className="text-lg text-slate-600">Nenhum lote selecionado.</p>
        <p className="text-sm text-slate-500">Por favor, selecione um lote na página anterior.</p>
         <Button onClick={() => router.back()} className="mt-4">
          Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 flex-col p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {batch.book.title}
            </h1>
            <p className="text-slate-600 mt-1">
              Lote para: {batch.secretary?.name || batch.school?.name}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/licenses/form?id=${batch.id}`)}>
          <Pencil className="mr-2 h-4 w-4" /> Editar Lote
        </Button>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InfoCard
          icon={<Book className="h-6 w-6 text-blue-500" />}
          title="Status do Lote"
          value={
            <Badge variant={statusVariant(batch.status)} className="text-base">
              {batch.status.replace("_", " ")}
            </Badge>
          }
        />
        <InfoCard
          icon={<Hash className="h-6 w-6 text-green-500" />}
          title="Quantidade de Licenças"
          value={batch.quantity}
        />
        <InfoCard
          icon={<Calendar className="h-6 w-6 text-purple-500" />}
          title="Data de Criação"
          value={new Date(batch.createdAt).toLocaleDateString("pt-BR")}
        />
      </div>

      {/* Seção de Chaves de Licença */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">
            Chaves de Licença ({batch.license_keys.length})
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Lista de todas as chaves geradas neste lote.
          </p>
        </div>

        {/* Visão de Cards para Mobile */}
        <div className="p-4 grid grid-cols-1 gap-4 md:hidden">
          {batch.license_keys.map((key) => (
            <LicenseKeyCard key={key.id} license={key} />
          ))}
        </div>

        {/* Visão de Tabela para Desktop */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código da Licença</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Data de Ativação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.license_keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-mono text-sm">{key.code}</TableCell>
                  <TableCell>
                    <Badge variant={key.status === "ACTIVATED" ? "default" : "secondary"}>
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {key.activatedAt
                      ? new Date(key.activatedAt).toLocaleDateString("pt-BR")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(key.code)}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copiar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
