// Sua página: LicenseResumePage.tsx

"use client";

import { useState, useEffect, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Book,
  Hash,
  Calendar,
  Loader2,
  ServerCrash,
} from "lucide-react";
import { getLicenseBatchById, type LicenseBatchDetails } from "../services/api";
import { ListLicense } from "@/app/shared/sections/ListLicense";

const InfoCard: FC<{
  icon: React.ReactNode;
  title: string;
  value: string | React.ReactNode;
}> = ({ icon, title, value }) => (
  <Card>
    <CardContent className=" flex items-center">
      <div className="bg-muted p-3 rounded-lg">{icon}</div>
      <div className="ml-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="text-lg font-bold text-foreground">{value}</div>
      </div>
    </CardContent>
  </Card>
);

// --- PÁGINA PRINCIPAL ---
export default function LicenseResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("id");

  const [batch, setBatch] = useState<LicenseBatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ... (useEffect permanece o mesmo)
    if (!batchId) {
      setIsLoading(false);
      return;
    }

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
  }, [batchId]);

  const getBatchStatusConfig = (status: LicenseBatchDetails["status"]) => {
    // ... (getBatchStatusConfig permanece o mesmo)
    switch (status) {
      case "ATIVO":
      case "RECEBIDO":
      case "ENVIADO":
        return {
          variant: "default" as const,
          text: "Recebido", // Exibe "Recebido"
        };
      case "PENDENTE":
      case "CRIADO":
        return {
          variant: "secondary" as const,
          text: status.charAt(0) + status.slice(1).toLowerCase(),
        };
      case "EXPIRADO":
        return { variant: "destructive" as const, text: "Expirado" };
      default:
        return { variant: "outline" as const, text: "Desconhecido" };
    }
  };

  // --- Renderização de Loading, Erro e Lote não encontrado permanece a mesma ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-destructive">
        <ServerCrash className="h-12 w-12 mb-4" />
        <p className="text-lg">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          Voltar
        </Button>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">
          Nenhum lote selecionado.
        </p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          Voltar para a lista
        </Button>
      </div>
    );
  }

  const batchStatusConfig = getBatchStatusConfig(batch.status);

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {batch.book.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          icon={<Book className="h-6 w-6 text-primary" />}
          title="Status do Lote"
          value={
            <Badge variant={batchStatusConfig.variant} className="text-base">
              {batchStatusConfig.text}
            </Badge>
          }
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

      {/* A MÁGICA ACONTECE AQUI! */}
      {/* SUBSTITUÍDO: Todo o card da lista foi trocado pelo novo componente */}
      <ListLicense
        title={`Chaves de Licença (${batch.license_keys.length})`}
        description="Lista de todas as chaves geradas neste lote."
        ownerName={batch.secretary?.name || batch.school?.name || "N/A"}
        licenseKeys={batch.license_keys}
      />
    </main>
  );
}
