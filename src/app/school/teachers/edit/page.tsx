// app/secretary/teachers/edit/page.tsx
"use client";

import React, { useState, useEffect, type ChangeEvent, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";



// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// --- Icons ---
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Home,
  BookUser,
  KeyRound,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { getSchools, getTeacherById, SchoolApiResponse, updateTeacher, UpdateTeacherPayload } from "../services/api";

// Componente para agrupar seções do formulário
const FormSection: FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <div className="bg-card rounded-lg border shadow-sm mt-4 mb-4">
    <div className="p-5 border-b">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mt-1 ml-9">{description}</p>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function EditTeacherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("id");

  const [formData, setFormData] = useState<UpdateTeacherPayload | null>(null);
  const [schools, setSchools] = useState<SchoolApiResponse[]>([]);
  const [openSchoolPopover, setOpenSchoolPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    if (!teacherId) {
      toast.error("ID do Professor não fornecido.");
      router.push("/secretary/teachers");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [teacherData, schoolsData] = await Promise.all([
          getTeacherById(Number(teacherId)),
          getSchools(),
        ]);
        
        setSchools(schoolsData);
        setFormData({
          email: teacherData.email,
          name: teacherData.responsible?.name || "",
          school_id: teacherData.responsible?.school?.id || 0,
          turma: teacherData.responsible?.turma || "",
          password: "", // Senha sempre em branco por segurança
        });

      } catch (error) {
        toast.error("Falha ao carregar dados para edição.");
        console.error(error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchInitialData();
  }, [teacherId, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };
  
  const handleSchoolSelect = (schoolId: number) => {
    setFormData((prev) => (prev ? { ...prev, school_id: schoolId } : null));
    setOpenSchoolPopover(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !teacherId) return;

    setIsLoading(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      const payload: UpdateTeacherPayload = { ...formData };
      
      // Remove a senha do payload se o campo estiver vazio
      if (!payload.password || payload.password.trim() === "") {
        delete payload.password;
      }

      await updateTeacher(Number(teacherId), payload);
      toast.success("Professor atualizado com sucesso!", { id: toastId });
      router.push("/secretary/teachers");

    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-destructive">
        Não foi possível carregar o formulário de edição.
      </div>
    );
  }

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className=" mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Editar Professor
            </h1>
            <p className="text-muted-foreground">
              Altere os dados necessários e salve as modificações.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate}>
          <fieldset disabled={isLoading} className="space-y-8">
            <FormSection
              title="Dados Pessoais"
              description="Informações de identificação do Professor."
              icon={<User className="h-6 w-6 text-muted-foreground" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email de Acesso</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Informações da Escola"
              description="Vincule o Professor a uma escola e turma."
              icon={<Home className="h-6 w-6 text-muted-foreground" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                  <Label>Escola Vinculada</Label>
                  <Popover open={openSchoolPopover} onOpenChange={setOpenSchoolPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {schools.find(s => s.id === formData.school_id)?.name || "Selecione uma escola..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar escola..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
                          <CommandGroup>
                            {schools.map(s => (
                              <CommandItem
                                key={s.id}
                                value={s.name}
                                onSelect={() => handleSchoolSelect(s.id)}
                              >
                                <Check className={`mr-2 h-4 w-4 ${formData.school_id === s.id ? "opacity-100" : "opacity-0"}`} />
                                {s.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="turma">Turma</Label>
                    <Input
                        id="turma"
                        name="turma"
                        value={formData.turma || ""}
                        onChange={handleInputChange}
                        placeholder="Ex: 3º Ano B"
                    />
                </div>
              </div>
            </FormSection>

            {/* <FormSection
              title="Credenciais de Acesso"
              description="Altere a senha de acesso do Professor."
              icon={<KeyRound className="h-6 w-6 text-muted-foreground" />}
            >
                <div className="grid gap-2 max-w-sm">
                    <Label htmlFor="password">Nova Senha</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password || ""}
                        onChange={handleInputChange}
                        placeholder="Deixe em branco para não alterar"
                    />
                </div>
            </FormSection> */}
          </fieldset>
          
          <div className="flex justify-end gap-3 pt-8 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}