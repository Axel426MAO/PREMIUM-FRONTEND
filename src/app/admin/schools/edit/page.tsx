"use client";

import React, { useState, useEffect, type ChangeEvent, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// --- API ---
import {
  getSchoolById,
  updateFullSchoolWorkflow,
  getSecretariesForSelect,
  createClass,
  deleteClass,
  type FullSchoolUpdatePayload,
  type SecretarySelectItem,
  type Class,
} from "../services/api";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- Icons ---
import {
  Loader2,
  ArrowLeft,
  Building2,
  Home,
  User,
  Check,
  ChevronsUpDown,
  Users, // Ícone para a nova seção de turmas
  PlusCircle,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

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

export default function EditSchoolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("id");

  const [formData, setFormData] = useState<FullSchoolUpdatePayload | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [secretaries, setSecretaries] = useState<SecretarySelectItem[]>([]);
  const [openSecretaryPopover, setOpenSecretaryPopover] = useState(false);

  // Estados para gerenciamento de turmas
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [isClassLoading, setIsClassLoading] = useState(false);

  // Busca os dados da escola e a lista de secretarias
  useEffect(() => {
    if (!schoolId) {
      toast.error("ID da escola não fornecido.");
      router.push("/admin/schools");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const schoolData = await getSchoolById(Number(schoolId));
        const secretariesData = await getSecretariesForSelect();
        setSecretaries(secretariesData);
        setClasses(schoolData.classes || []); // Carrega as turmas existentes

        const mainResponsible = schoolData.responsibles?.[0];
        if (!mainResponsible || !mainResponsible.user) {
          throw new Error("Dados de responsável ou usuário ausentes.");
        }

        setFormData({
          school: {
            name: schoolData.name,
            is_private: schoolData.is_private,
            secretary_id: schoolData.secretary?.id || null,
          },
          address: {
            street: schoolData.address.street,
            number: schoolData.address.number || "",
            neighborhood: schoolData.address.neighborhood,
            city: schoolData.address.city,
            state: schoolData.address.state,
            cep: schoolData.address.cep,
          },
          responsible: {
            name: mainResponsible.name,
            role: mainResponsible.role,
            whatsapp: mainResponsible.whatsapp || "",
            phone: mainResponsible.phone || "",
          },
          user: {
            email: mainResponsible.user.email,
            password: "", // Senha fica em branco por padrão
          },
        });
      } catch (error) {
        toast.error("Falha ao carregar dados para edição.");
        console.error(error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchInitialData();
  }, [schoolId, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split(
      "."
    ) as (keyof FullSchoolUpdatePayload)[];
    setFormData((prev) =>
      prev ? { ...prev, [section]: { ...prev[section], [field]: value } } : null
    );
  };

  const handleSecretarySelect = (secretaryId: number) => {
    setFormData((prev) =>
      prev
        ? { ...prev, school: { ...prev.school, secretary_id: secretaryId } }
        : null
    );
    setOpenSecretaryPopover(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !schoolId) return;

    setIsLoading(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      // Cria uma cópia para não modificar o estado diretamente
      const payload = { ...formData };

      // Remove a senha do payload se estiver em branco, para não alterá-la no backend
      if (!payload.user.password) {
        delete (payload.user as Partial<typeof payload.user>).password;
      }

      await updateFullSchoolWorkflow(Number(schoolId), payload);
      toast.success("Escola atualizada com sucesso!", { id: toastId });
      router.push("/admin/schools");
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Funções de Gerenciamento de Turmas ---
  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      toast.warning("O nome da turma não pode estar vazio.");
      return;
    }
    if (!schoolId) return;

    setIsClassLoading(true);
    const toastId = toast.loading("Adicionando turma...");
    try {
      const newClass = await createClass(Number(schoolId), newClassName.trim());
      setClasses((prev) => [...prev, newClass]);
      setNewClassName("");
      toast.success("Turma adicionada com sucesso!", { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsClassLoading(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    setIsClassLoading(true);
    const toastId = toast.loading("Excluindo turma...");
    try {
      await deleteClass(classId);
      setClasses((prev) => prev.filter((c) => c.id !== classId));
      toast.success("Turma excluída com sucesso!", { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsClassLoading(false);
    }
  };
  // --- Fim das Funções de Turmas ---

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
              Editar Escola
            </h1>
            <p className="text-muted-foreground">
              Altere os dados necessários e salve as modificações.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          <fieldset disabled={isLoading}>
            {/* Seção de Dados da Escola */}
            <FormSection
              title="Dados da Escola"
              description="Informações principais sobre a instituição de ensino."
              icon={<Building2 className="h-6 w-6 text-muted-foreground" />}
            >
              <div className="space-y-6 grid grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="school.name">Nome da Escola</Label>
                  <Input
                    id="school.name"
                    name="school.name"
                    value={formData.school.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {!formData.school.is_private && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid gap-2">
                      <Label>Secretaria Vinculada</Label>
                      <Popover
                        open={openSecretaryPopover}
                        onOpenChange={setOpenSecretaryPopover}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {formData.school.secretary_id
                              ? secretaries.find(
                                  (s) => s.id === formData.school.secretary_id
                                )?.name
                              : "Selecione uma secretaria..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar secretaria..." />
                            <CommandList>
                              <CommandEmpty>
                                Nenhuma secretaria encontrada.
                              </CommandEmpty>
                              <CommandGroup>
                                {secretaries.map((s) => (
                                  <CommandItem
                                    key={s.id}
                                    value={s.name}
                                    onSelect={() => handleSecretarySelect(s.id)}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        formData.school.secretary_id === s.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    {s.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </motion.div>
                )}
              </div>
            </FormSection>

            {/* Seção de Endereço */}
            <FormSection
              title="Endereço"
              description="Localização física onde a escola está estabelecida."
              icon={<Home className="h-6 w-6 text-muted-foreground" />}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="grid gap-2 sm:col-span-3">
                    <Label htmlFor="address.street">Rua / Avenida</Label>
                    <Input
                      id="address.street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address.number">Número</Label>
                    <Input
                      id="address.number"
                      name="address.number"
                      value={formData.address.number || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="address.neighborhood">Bairro</Label>
                    <Input
                      id="address.neighborhood"
                      name="address.neighborhood"
                      value={formData.address.neighborhood}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address.city">Cidade</Label>
                    <Input
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address.state">Estado (UF)</Label>
                    <Input
                      id="address.state"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      required
                      maxLength={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address.cep">CEP</Label>
                    <Input
                      id="address.cep"
                      name="address.cep"
                      value={formData.address.cep}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Seção de Responsável e Acesso */}
            <FormSection
              title="Responsável e Acesso"
              description="Dados do gestor principal e suas credenciais de acesso ao sistema."
              icon={<User className="h-6 w-6 text-muted-foreground" />}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="responsible.name">
                      Nome do Responsável
                    </Label>
                    <Input
                      id="responsible.name"
                      name="responsible.name"
                      value={formData.responsible.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="responsible.role">Cargo</Label>
                    <Input
                      id="responsible.role"
                      name="responsible.role"
                      value={formData.responsible.role}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="grid gap-2">
                    <Label htmlFor="user.email">E-mail de Acesso</Label>
                    <Input
                      id="user.email"
                      name="user.email"
                      type="email"
                      value={formData.user.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user.password">Nova Senha</Label>
                    <Input
                      id="user.password"
                      name="user.password"
                      type="password"
                      value={formData.user.password}
                      onChange={handleInputChange}
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* NOVA SEÇÃO DE GERENCIAMENTO DE TURMAS */}
            <FormSection
              title="Gerenciamento de Turmas"
              description="Adicione ou remova turmas para esta escola."
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
            >
              <fieldset disabled={isClassLoading || isLoading}>
                <div className="flex items-center gap-2 mb-6">
                  <Input
                    placeholder="Nome da nova turma (ex: 1º Ano A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddClass();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddClass}
                    disabled={isClassLoading}
                  >
                    {isClassLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Cadastrar
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Turmas Cadastradas
                  </h4>
                  {classes.length > 0 ? (
                    <ul className="rounded-md border">
                      {classes.map((c, index) => (
                        <li
                          key={c.id}
                          className={`flex items-center justify-between p-3 ${
                            index < classes.length - 1 ? "border-b" : ""
                          }`}
                        >
                          <span className="text-sm font-medium">{c.name}</span>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Você tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso
                                  excluirá permanentemente a turma{" "}
                                  <strong>"{c.name}"</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteClass(c.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-6 border rounded-md border-dashed">
                      Nenhuma turma cadastrada para esta escola.
                    </div>
                  )}
                </div>
              </fieldset>
            </FormSection>
          </fieldset>

          <div className="flex justify-end gap-3 pt-4">
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