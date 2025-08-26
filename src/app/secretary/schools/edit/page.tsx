"use client";

import React, { useState, useEffect, type ChangeEvent, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// --- API ---
import {
  getSchoolById,
  updateFullSchoolWorkflow,
  // MODIFICAÇÃO: 'getSecretariesForSelect' não é mais necessário aqui
  type FullSchoolUpdatePayload,
} from "../services/api";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// MODIFICAÇÃO: Switch, Popover e Command não são mais usados nesta página
// import { Switch } from "@/components/ui/switch"; 
// ...

// --- Icons ---
import {
  Loader2,
  ArrowLeft,
  Building2,
  Home,
  User,
  // MODIFICAÇÃO: Check e ChevronsUpDown não são mais necessários
} from "lucide-react";
import { motion } from "framer-motion";

// --- NOVO COMPONENTE AUXILIAR ---
// Componente para exibir dados de forma estática (não editável)
const InfoDisplay: FC<{ label: string; value: string | null }> = ({
  label,
  value,
}) => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
      {value || "Não aplicável"}
    </div>
  </div>
);

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
  
  // MODIFICAÇÃO: Estado para guardar o nome da secretaria para exibição
  const [secretaryName, setSecretaryName] = useState<string | null>(null);

  // Busca apenas os dados da escola
  useEffect(() => {
    if (!schoolId) {
      toast.error("ID da escola não fornecido.");
      router.push("/secretary/schools");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const schoolData = await getSchoolById(Number(schoolId));
        
        // Guarda o nome da secretaria para exibição
        setSecretaryName(schoolData.secretary?.name || null);

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
            password: "",
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


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !schoolId) return;

    setIsLoading(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      await updateFullSchoolWorkflow(Number(schoolId), formData);
      toast.success("Escola atualizada com sucesso!", { id: toastId });
      router.push("/secretary/schools");
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
              <div className="space-y-6">
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
                
                {/* --- MODIFICAÇÃO: Exibição estática do tipo de escola e secretaria --- */}
                <div className="hidden ">
                   <InfoDisplay
                      label="Tipo de Escola"
                      value={formData.school.is_private ? "Privada" : "Pública"}
                   />
                   {!formData.school.is_private && (
                     <InfoDisplay
                       label="Secretaria Vinculada"
                       value={secretaryName}
                     />
                   )}
                </div>

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