"use client";

import { useState, useEffect, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Book,
  Hash,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Loader2,
  ServerCrash,
  Send,
  Download,
} from "lucide-react";
import { getLicenseBatchById, type LicenseBatchDetails,  type BackendBatchStatus, BackendKeyStatus } from "../services/api";
import { toast } from "sonner";


const InfoCard: FC<{
  icon: React.ReactNode;
  title: string;
  value: string | React.ReactNode;
  className?: string;
}> = ({ icon, title, value, className }) => (
  <Card className={`flex items-center p-4 ${className}`}>
    <div className="bg-muted p-3 rounded-lg">{icon}</div>
    <div className="ml-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  </Card>
);

const LicenseKeyCard: FC<{ license: LicenseBatchDetails["license_keys"][0] }> = ({ license }) => {
  const copyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success("Código copiado!");
    } catch (err) {
      toast.error("Falha ao copiar o código.");
    }
    document.body.removeChild(textArea);
  };

  const getKeyStatusConfig = (status: BackendKeyStatus) => {
    switch (status) {
        case "ATIVO": return { variant: "default" as const, icon: <CheckCircle className="h-4 w-4" />, text: "Ativo" };
        case "EXPIRADO": return { variant: "destructive" as const, icon: <XCircle className="h-4 w-4" />, text: "Expirado" };
        case "CRIADO": return { variant: "outline" as const, icon: <Clock className="h-4 w-4" />, text: "Criado" };
        case "PENDENTE": return { variant: "secondary" as const, icon: <Clock className="h-4 w-4" />, text: "Pendente" };
        case "ENVIADO": return { variant: "secondary" as const, icon: <Send className="h-4 w-4" />, text: "Enviado" };
        case "RECEBIDO": return { variant: "secondary" as const, icon: <Download className="h-4 w-4" />, text: "Recebido" };
        default: return { variant: "outline" as const, icon: <Clock className="h-4 w-4" />, text: "Disponível" };
    }
  };

  const currentStatus = getKeyStatusConfig(license.status);

  return (
    <Card>
        <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <code className="font-mono text-sm text-muted-foreground break-all pr-2">
                {license.code}
                </code>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(license.code)}>
                <Copy className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
                <Badge variant={currentStatus.variant} className="gap-1.5 font-medium">
                    {currentStatus.icon}
                    {currentStatus.text}
                </Badge>
                <div className="text-muted-foreground text-xs">
                {license.activatedAt
                    ? `Ativada em: ${new Date(license.activatedAt).toLocaleDateString("pt-BR")}`
                    : `Criada em: ${new Date(license.createdAt).toLocaleDateString("pt-BR")}`}
                </div>
            </div>
        </CardContent>
    </Card>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function LicenseResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("id");

  const [batch, setBatch] = useState<LicenseBatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      const fetchBatchDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
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
      setIsLoading(false);
    }
  }, [batchId]);

  const getBatchStatusConfig = (status: any) => {
    switch (status) {
      case "ATIVO": case "RECEBIDO": case "ENVIADO": return { variant: "default" as const, text: status.charAt(0) + status.slice(1).toLowerCase() };
      case "PENDENTE": case "CRIADO": return { variant: "secondary" as const, text: status.charAt(0) + status.slice(1).toLowerCase() };
      case "EXPIRADO": return { variant: "destructive" as const, text: "Expirado" };
      default: return { variant: "outline" as const, text: "Desconhecido" };
    }
  };

  const copyToClipboard = (text: string) => {
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
      <div className="flex items-center justify-center min-h-screen ">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen  text-destructive">
        <ServerCrash className="h-12 w-12 mb-4" />
        <p className="text-lg">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen ">
        <p className="text-lg text-muted-foreground">Nenhum lote selecionado.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar para a lista</Button>
      </div>
    );
  }

  const batchStatusConfig = getBatchStatusConfig(batch.status);

  return (
    <main className="flex-1 flex-col p-4 md:p-8  min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {batch.book.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              Lote para: {batch.secretary?.name || batch.school?.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InfoCard
          icon={<Book className="h-6 w-6 text-primary" />}
          title="Status do Lote"
          value={<Badge variant={batchStatusConfig.variant} className="text-base">{batchStatusConfig.text}</Badge>}
        />
        <InfoCard
          icon={<Hash className="h-6 w-6 text-primary" />}
          title="Quantidade de Licenças"
          value={batch.quantity.toString()}
        />
        <InfoCard
          icon={<Calendar className="h-6 w-6 text-primary" />}
          title="Data de Criação"
          value={new Date(batch.createdAt).toLocaleDateString("pt-BR")}
        />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Chaves de Licença ({batch.license_keys.length})</CardTitle>
            <CardDescription>Lista de todas as chaves geradas neste lote.</CardDescription>
        </CardHeader>
        <CardContent>
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
                {batch.license_keys.map((key) => {
                    const getKeyStatusConfig = (status: BackendKeyStatus) => {
                        switch (status) {
                            case "ATIVO": return { variant: "default" as const, text: "Ativo" };
                            case "EXPIRADO": return { variant: "destructive" as const, text: "Expirado" };
                            case "CRIADO": return { variant: "outline" as const, text: "Criado" };
                            case "PENDENTE": return { variant: "secondary" as const, text: "Pendente" };
                            case "ENVIADO": return { variant: "secondary" as const, text: "Enviado" };
                            case "RECEBIDO": return { variant: "secondary" as const, text: "Recebido" };
                            default: return { variant: "outline" as const, text: "Disponível" };
                        }
                    };
                    const currentStatus = getKeyStatusConfig(key.status);
                    return (
                        <TableRow key={key.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-sm">{key.code}</TableCell>
                            <TableCell>
                                <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
                            </TableCell>
                            <TableCell>{new Date(key.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>{key.activatedAt ? new Date(key.activatedAt).toLocaleDateString("pt-BR") : "N/A"}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(key.code)}>
                                <Copy className="mr-2 h-3 w-3" />
                                Copiar
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
