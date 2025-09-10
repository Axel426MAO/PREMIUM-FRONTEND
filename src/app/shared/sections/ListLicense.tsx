// src/components/licensing/ListLicense.tsx

"use client";

import { type FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Clock,
  Copy,
  Download,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BackendKeyStatus, LicenseBatchDetails } from "@/app/admin/licenses/services/api";



// --- TIPOS E PROPS ---
type LicenseKey = LicenseBatchDetails["license_keys"][0];

interface ListLicenseProps {
  title: string;
  description: string;
  ownerName: string;
  licenseKeys: LicenseKey[];
}

// --- LÓGICA E HELPERS (Agora dentro do componente) ---

const copyToClipboard = async (
  text: string,
  message: string = "Código copiado!"
) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch (err) {
    toast.error("Falha ao copiar o código.");
    console.error("Clipboard API error:", err);
  }
};

const getKeyStatusConfig = (status: BackendKeyStatus) => {
  // ... (a função getKeyStatusConfig permanece a mesma)
  switch (status) {
    case "ATIVO":
      return {
        variant: "default" as const,
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Ativo",
      };
    case "EXPIRADO":
      return {
        variant: "destructive" as const,
        icon: <XCircle className="h-4 w-4" />,
        text: "Expirado",
      };
    case "CRIADO":
      return {
        variant: "outline" as const,
        icon: <Clock className="h-4 w-4" />,
        text: "Criado",
      };
    case "PENDENTE":
      return {
        variant: "secondary" as const,
        icon: <Clock className="h-4 w-4" />,
        text: "Pendente",
      };
    case "ENVIADO":
      return {
        variant: "secondary" as const,
        icon: <Send className="h-4 w-4" />,
        text: "Enviado",
      };
    case "RECEBIDO":
      return {
        variant: "secondary" as const,
        icon: <Download className="h-4 w-4" />,
        text: "Recebido",
      };
    default:
      return {
        variant: "outline" as const,
        icon: <Clock className="h-4 w-4" />,
        text: "Disponível",
      };
  }
};

// --- SUB-COMPONENTE PARA A LISTA MOBILE ---

const LicenseKeyCard: FC<{ license: LicenseKey; index: number }> = ({
  license,
  index,
}) => {
  const currentStatus = getKeyStatusConfig(license.status);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Licença #{index}
        </CardTitle>
        <Badge variant={currentStatus.variant} className="gap-1.5 font-medium">
          {currentStatus.icon}
          {currentStatus.text}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <div className="flex justify-between items-start gap-2 bg-muted p-2 rounded-md">
          <code className="font-mono text-sm text-muted-foreground break-all">
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
        <div className="text-muted-foreground text-xs text-right">
          {license.activatedAt
            ? `Ativada em: ${new Date(license.activatedAt).toLocaleDateString(
                "pt-BR"
              )}`
            : `Criada em: ${new Date(license.createdAt).toLocaleDateString(
                "pt-BR"
              )}`}
        </div>
      </CardContent>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL EXPORTADO ---

export const ListLicense: FC<ListLicenseProps> = ({
  title,
  description,
  ownerName,
  licenseKeys,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className="text-muted-foreground mt-1">
          Lote para: <span className="font-bold">{ownerName}</span>
        </p>
      </CardHeader>
      <CardContent>
        {licenseKeys.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              Nenhuma chave de licença neste lote.
            </p>
          </div>
        ) : (
          <>
            {/* Visão de Cards para Mobile (md:hidden) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {licenseKeys.map((key, index) => (
                <LicenseKeyCard key={key.id} license={key} index={index + 1} />
              ))}
            </div>

            {/* Visão de Tabela para Desktop (hidden md:block) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Código da Licença</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Data de Ativação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableHeader>
                <TableBody>
                  {licenseKeys.map((key, index) => {
                    const currentStatus = getKeyStatusConfig(key.status);
                    return (
                      <TableRow key={key.id} className="even:bg-gray-100 dark:even:bg-muted/40">
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {key.code}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={currentStatus.variant}
                            className="gap-1.5"
                          >
                            {currentStatus.icon} {currentStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {key.activatedAt
                            ? new Date(key.activatedAt).toLocaleDateString(
                                "pt-BR"
                              )
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
