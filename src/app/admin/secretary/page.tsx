"use client";

import { useState, useEffect, useMemo, type FC } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
} from "lucide-react";

// --- TIPOS E DADOS DE EXEMPLO ---
// No futuro, estes tipos e a função virão do seu arquivo services/api.ts

interface Secretary {
  id: number;
  name: string;
  responsible: string;
  email: string;
  phone: string;
  status: "Ativa" | "Inativa";
}

// Simula uma chamada de API com dados de exemplo
const getSecretaries = async (): Promise<Secretary[]> => {
  const mockData: Secretary[] = [
    {
      id: 1,
      name: "Secretaria da Educação",
      responsible: "Ana Silva",
      email: "educacao@email.com",
      phone: "(92) 99999-0001",
      status: "Ativa",
    },
    {
      id: 2,
      name: "Secretaria da Saúde",
      responsible: "Carlos Pereira",
      email: "saude@email.com",
      phone: "(92) 99999-0002",
      status: "Ativa",
    },
    {
      id: 3,
      name: "Secretaria de Obras",
      responsible: "Mariana Costa",
      email: "obras@email.com",
      phone: "(92) 99999-0003",
      status: "Inativa",
    },
    {
      id: 4,
      name: "Secretaria de Cultura",
      responsible: "João Martins",
      email: "cultura@email.com",
      phone: "(92) 99999-0004",
      status: "Ativa",
    },
  ];
  // Simula um atraso de rede
  return new Promise((resolve) => setTimeout(() => resolve(mockData), 500));
};

// --- COMPONENTE PRINCIPAL (PÁGINA DA LISTA) ---
export default function SecretaryPage() {
  const router = useRouter();
  const [allSecretaries, setAllSecretaries] = useState<Secretary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecretaries = async () => {
      try {
        setIsLoading(true);
        const data = await getSecretaries(); // Substitua pela sua chamada de API real
        setAllSecretaries(data);
        setError(null);
      } catch (err) {
        setError("Não foi possível carregar os dados das secretarias.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSecretaries();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta secretaria?")) {
      // Aqui você chamaria sua função de API para deletar
      // await deleteSecretary(id);
      setAllSecretaries(allSecretaries.filter((sec) => sec.id !== id));
    }
  };

  const handleEdit = (id: number) => {
    // Ajuste a rota se o seu formulário tiver um nome diferente
    router.push(`/admin/secretary/form?id=${id}`);
  };

  const filteredSecretaries = useMemo(() => {
    if (!searchQuery) return allSecretaries;
    return allSecretaries.filter(
      (sec) =>
        sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.responsible.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSecretaries, searchQuery]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Secretarias
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as secretarias e seus responsáveis.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou responsável..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push("/admin/secretary/form")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Responsável
                </TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-red-500"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredSecretaries.length > 0 ? (
                filteredSecretaries.map((secretary) => (
                  <TableRow key={secretary.id}>
                    <TableCell className="font-medium">
                      {secretary.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {secretary.responsible}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{secretary.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {secretary.phone}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          secretary.status === "Ativa"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {secretary.status}
                      </Badge>
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
                            onClick={() => handleEdit(secretary.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(secretary.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma secretaria encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
