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
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  User,
  Mail,
  Home,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteStudent, StudentApiResponse } from "./services/api";
import { getStudentsBySecretaryId } from "@/app/shared/services/students_api";
import { useUserStore } from "@/app/store/userStore";

// --- TIPO PARA OS DADOS DE VISUALIZAÇÃO DO ALUNO ---
interface StudentViewData {
  id: number; // User ID
  name: string;
  email: string;
  schoolName: string;
  schoolType: "public" | "private";
  className: string; // Turma
  status: "Ativo" | "Inativo";
}

// --- COMPONENTE DE CARD PARA A VISÃO MOBILE ---
const StudentCard: FC<{
  student: StudentViewData;
  onEdit: (id: number) => void;
  onDelete: (student: StudentViewData) => void;
}> = ({ student, onEdit, onDelete }) => {
  return (
    <div className="w-full bg-card border border-slate-200 dark:border-card rounded-lg p-4 transition-shadow hover:shadow-md flex flex-col">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-800 dark:text-foreground leading-tight">
            {student.name}
          </h3>
          <p className="text-xs text-muted-foreground">{student.className}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 -mr-2 -mt-1 text-slate-500 dark:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(student.id)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(student)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Conteúdo do Card */}
      <div className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-3 text-slate-600 dark:text-foreground">
          <Home className="h-4 w-4 shrink-0 text-slate-400 dark:text-foreground" />
          <span>{student.schoolName}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600 dark:text-foreground">
          <Mail className="h-4 w-4 shrink-0 text-slate-400 dark:text-foreground" />
          <span className="truncate">{student.email}</span>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="pt-4 mt-auto">
        <Badge variant={student.status === "Ativo" ? "default" : "destructive"}>
          {student.status}
        </Badge>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function StudentsPage() {
  const router = useRouter();
  const [allStudents, setAllStudents] = useState<StudentViewData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "public" | "private">(
    "all"
  );
  const { user } = useUserStore();

  const SecretaryId = user!.responsible?.secretary?.id ?? 0;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] =
    useState<StudentViewData | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const apiData: StudentApiResponse[] = await getStudentsBySecretaryId(
          SecretaryId
        );

        // Mapeia os dados da API para o formato que a UI precisa
        const viewData: StudentViewData[] = apiData.map((student) => ({
          id: student.id,
          name: student.responsible?.name || "Nome não informado",
          email: student.email,
          schoolName:
            student.responsible?.school?.name || "Escola não informada",
          // <<-- LINHA ALTERADA PARA USAR 'is_private' -->>
          schoolType: student.responsible?.school?.is_private
            ? "private"
            : "public",
          className: student.responsible?.turma || "Turma não informada",
          status: student.status ? "Ativo" : "Inativo",
        }));

        setAllStudents(viewData);
        setError(null);
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Ocorreu um erro desconhecido.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    const toastId = toast.loading("Excluindo aluno...");
    try {
      await deleteStudent(studentToDelete.id);
      setAllStudents((currentStudents) =>
        currentStudents.filter((student) => student.id !== studentToDelete.id)
      );
      toast.success("Aluno excluído com sucesso!", { id: toastId });
    } catch (err) {
      const errorMessage =
        (err as Error).message || "Ocorreu um erro desconhecido.";
      toast.error(errorMessage, { id: toastId });
      console.error("Erro ao excluir aluno:", err);
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/secretary/students/edit?id=${id}`);
  };

  const filteredStudents = useMemo(() => {
    let students = allStudents;

    if (typeFilter !== "all") {
      students = students.filter(
        (student) => student.schoolType === typeFilter
      );
    }

    if (searchQuery) {
      students = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return students;
  }, [allStudents, searchQuery, typeFilter]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Alunos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os alunos e suas informações.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou escola..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => router.push("/secretary/students/form")}
            className="shrink-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar
          </Button>
        </div>
      </div>

      {/* FILTRO DE ABAS */}
      <div className="flex">
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-full sm:w-fit overflow-x-auto shadow">
          <Button
            variant={typeFilter === "all" ? "default" : "ghost"}
            className="rounded-md"
            onClick={() => setTypeFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={typeFilter === "public" ? "default" : "ghost"}
            className="rounded-md"
            onClick={() => setTypeFilter("public")}
          >
            Públicas
          </Button>
          <Button
            variant={typeFilter === "private" ? "default" : "ghost"}
            className="rounded-md"
            onClick={() => setTypeFilter("private")}
          >
            Privadas
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal: Tabela para Desktop */}
      <div className="hidden md:block shadow rounded-xl">
        <Table>
          <TableHeader>
            <TableHead>Aluno</TableHead>
            <TableHead>Escola</TableHead>
            <TableHead>Contato (Email)</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    Carregando...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-red-600"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="even:bg-gray-100 dark:even:bg-card/100"
                >
                  <TableCell className="font-medium p-4">
                    {student.name}
                  </TableCell>
                  <TableCell>{student.schoolName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        student.status === "Ativo" ? "default" : "destructive"
                      }
                    >
                      {student.status}
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
                          onClick={() => handleEdit(student.id)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStudentToDelete(student)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum aluno encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Conteúdo Principal: Cards para Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {isLoading ? (
          <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="col-span-full h-24 flex items-center justify-center text-red-600">
            {error}
          </div>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={handleEdit}
              onDelete={setStudentToDelete}
            />
          ))
        ) : (
          <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
            Nenhum aluno encontrado.
          </div>
        )}
      </div>

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(isOpen) => !isOpen && setStudentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno{" "}
              <strong>&quot;{studentToDelete?.name}&quot;</strong>? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
