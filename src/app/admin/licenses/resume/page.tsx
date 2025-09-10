"use client";

import React, { useState, useEffect, useCallback, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Componentes da UI (Shadcn)
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Apenas o componente Badge é necessário aqui

// Ícones
import {
  ArrowLeft,
  ArrowRight,
  Book,
  Building,
  Calendar,
  Check,
  Hash,
  Loader2,
  ServerCrash,
  Users,
} from "lucide-react";

import { ListLicense } from "@/app/shared/sections/ListLicense";
import {
  ChildBatch,
  getLicenseBatchById,
  LicenseBatchDetails,
} from "@/app/secretary/licenses/services/api";

// ============================================================================
// 1. COMPONENTES DE ESTADO DE UI (Sem alterações)
// ============================================================================

const LoadingState: FC = () => (
  <div className="flex flex-1 items-center justify-center p-8 ">
    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
  </div>
);

const ErrorState: FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center ">
    <ServerCrash className="h-12 w-12 mb-4 text-destructive" />
    <p className="text-lg text-destructive mb-4">{message}</p>
    <Button variant="outline" onClick={onRetry}>
      Tentar Novamente
    </Button>
  </div>
);

const EmptyState: FC = () => {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 ">
      <p className="text-lg text-muted-foreground">
        Nenhum lote selecionado ou encontrado.
      </p>
      <Button variant="outline" onClick={() => router.back()} className="mt-4">
        Voltar para a lista
      </Button>
    </div>
  );
};

// ============================================================================
// 2. COMPONENTES DE APRESENTAÇÃO E LÓGICA DE STATUS
// ============================================================================

const InfoCard: FC<{
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}> = ({ icon, title, value }) => (
  <Card className="gap-2">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent className="">
      <div className="text-2xl font-bold truncate">{value}</div>
    </CardContent>
  </Card>
);

const ChildBatchCard: FC<{ childBatch: ChildBatch }> = ({ childBatch }) => {
  const router = useRouter();
  const statusConfig = getBatchStatusConfig(childBatch.status);

  const handleViewDetails = () => {
    // Ex: router.push(`/admin/licenses/resume?id=${childBatch.id}`);
    alert(`Implementar navegação para detalhes do microlote ID: ${childBatch.id}`);
  };

  return (
    <Card className="flex flex-col justify-between transition-colors hover:border-primary/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <Building className="h-5 w-5 shrink-0 text-muted-foreground" />
            <CardTitle className="text-lg leading-tight">
              {childBatch.school?.name ?? "Escola não identificada"}
            </CardTitle>
          </div>
          <Badge variant={statusConfig.variant} className="shrink-0">
            {statusConfig.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-muted-foreground">
            <Hash className="mr-2 h-4 w-4" />
            Licenças no Lote
          </span>
          <span className="font-bold">{childBatch._count.license_keys}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            Data de Envio
          </span>
          <span className="font-bold">
            {new Date(childBatch.sentAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleViewDetails}>
          Ver Detalhes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

type BatchStatus = LicenseBatchDetails["status"];

// ============================================================================
// ✨ CORREÇÃO APLICADA AQUI ✨
// 1. Extraímos o tipo das props diretamente do componente Badge
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

// 2. Definimos o tipo do nosso objeto de configuração usando o tipo extraído
type StatusConfig = {
  variant: BadgeVariant;
  text: string;
  color: string;
};

// 3. Aplicamos esse tipo como o retorno da função. Agora está 100% correto.
const getBatchStatusConfig = (status: BatchStatus): StatusConfig => {
  switch (status) {
    case "ATIVO": return { variant: "default", text: "Ativo", color: "bg-green-500" };
    case "RECEBIDO": return { variant: "default", text: "Recebido", color: "bg-blue-500" };
    case "ENVIADO": return { variant: "secondary", text: "Enviado", color: "bg-yellow-500" };
    case "CRIADO": case "PENDENTE": return { variant: "outline", text: "Criado", color: "bg-gray-500" };
    case "EXPIRADO": return { variant: "destructive", text: "Expirado", color: "bg-red-500" };
    default: return { variant: "outline", text: "Desconhecido", color: "bg-gray-400" };
  }
};
// ============================================================================

const timelineSteps: { status: BatchStatus; label: string }[] = [
  { status: "CRIADO", label: "Criado" },
  { status: "ENVIADO", label: "Enviado" },
  { status: "RECEBIDO", label: "Recebido" },
  { status: "ATIVO", label: "Ativo" },
];

const StatusTimeline: FC<{ currentStatus: BatchStatus }> = ({
  currentStatus,
}) => {
  let statusParaTimeline = currentStatus === "PENDENTE" ? "CRIADO" : currentStatus;
  if (statusParaTimeline === "ENVIADO") {
    statusParaTimeline = "RECEBIDO";
  }
  const currentIndex = timelineSteps.findIndex(
    (step) => step.status === statusParaTimeline
  );

  return (
    <div className="flex w-full items-start pt-2">
      {timelineSteps.map((step, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index;
        const isActive = isCompleted || isCurrent;
        const showCheckIcon = isCompleted || (step.status === 'ENVIADO' && currentStatus === 'ENVIADO');

        return (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-primary" : "bg-border"
                }`}
              >
                {showCheckIcon ? (
                  <Check className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                )}
              </div>
              <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </p>
            </div>
            {index < timelineSteps.length - 1 && (
              <div className={`h-1 flex-1 transition-colors ${isCompleted ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// 3. COMPONENTE PRINCIPAL DA PÁGINA (COM NOVO LAYOUT)
// ============================================================================
const BatchDetailsView: FC<{ batch: LicenseBatchDetails }> = ({ batch }) => {
  const router = useRouter();
  const statusConfig = getBatchStatusConfig(batch.status);
  const ownerName = batch.secretary?.name ?? batch.school?.name ?? "N/A";
  const hasChildBatches = batch.child_batches && batch.child_batches.length > 0;

  return (
    <main className="flex-1  p-4 md:p-6">
      <div className="mx-auto  space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {batch.book.title}
              </h1>
              <p className="text-muted-foreground">Detalhes do lote de licenças</p>
            </div>
          </div>
        
        </div>

        {/* Card da Linha do Tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Status do Lote Principal</CardTitle>
            <CardDescription>
              Progresso do lote desde a criação até a ativação.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <StatusTimeline currentStatus={batch.status} />
          </CardContent>
        </Card>

        {/* Grid de Informações Gerais */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <InfoCard
            icon={<Hash className=" text-muted-foreground" />}
            title="Licenças Restantes"
            value={batch.quantity.toString()}
          />
          <InfoCard
            icon={<Users className=" text-muted-foreground" />}
            title="Lote Para"
            value={ownerName}
          />
          <InfoCard
            icon={<Calendar className=" text-muted-foreground" />}
            title="Data de Criação"
            value={new Date(batch.createdAt).toLocaleDateString("pt-BR")}
          />
        </div>

        {/* Seção de Microlotes */}
        {hasChildBatches && (
          <Card>
            <CardHeader>
              <CardTitle>Microlotes Distribuídos</CardTitle>
              <CardDescription>
                Este lote foi dividido e enviado para as escolas abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {batch.child_batches.map((child) => (
                  <ChildBatchCard key={child.id} childBatch={child} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Chaves de Licença */}
        <ListLicense
          title={`Chaves de Licença Atuais (${batch.license_keys.length})`}
          description="Lista de todas as chaves de licença que ainda pertencem a este lote."
          ownerName={ownerName}
          licenseKeys={batch.license_keys}
        />
      </div>
    </main>
  );
};

// ============================================================================
// 4. CONTAINER DA PÁGINA (LÓGICA DE DADOS)
// ============================================================================
export default function LicenseResumePage() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("id");

  const [batch, setBatch] = useState<LicenseBatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchDetails = useCallback(async () => {
    if (!batchId) {
      setError("ID do lote não fornecido na URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getLicenseBatchById(Number(batchId));
      setBatch(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(`Falha ao carregar os detalhes do lote: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatchDetails();
  }, [fetchBatchDetails]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchBatchDetails} />;
  if (!batch) return <EmptyState />;

  return <BatchDetailsView batch={batch} />;
}