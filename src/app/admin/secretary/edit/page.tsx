"use client";

import React, { useState, useEffect, type ChangeEvent, type FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// --- API ---
import {
  getSecretaryById,
  updateFullSecretaryWorkflow,
  type FullSecretaryUpdatePayload,
} from "../services/api";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Icons ---
import { Loader2, ArrowLeft, Building, Home, User } from "lucide-react";

// --- Data ---
const brazilianStates = [
  { name: "Acre", uf: "AC" },
  { name: "Alagoas", uf: "AL" },
  { name: "Amapá", uf: "AP" },
  { name: "Amazonas", uf: "AM" },
  { name: "Bahia", uf: "BA" },
  { name: "Ceará", uf: "CE" },
  { name: "Distrito Federal", uf: "DF" },
  { name: "Espírito Santo", uf: "ES" },
  { name: "Goiás", uf: "GO" },
  { name: "Maranhão", uf: "MA" },
  { name: "Mato Grosso", uf: "MT" },
  { name: "Mato Grosso do Sul", uf: "MS" },
  { name: "Minas Gerais", uf: "MG" },
  { name: "Pará", uf: "PA" },
  { name: "Paraíba", uf: "PB" },
  { name: "Paraná", uf: "PR" },
  { name: "Pernambuco", uf: "PE" },
  { name: "Piauí", uf: "PI" },
  { name: "Rio de Janeiro", uf: "RJ" },
  { name: "Rio Grande do Norte", uf: "RN" },
  { name: "Rio Grande do Sul", uf: "RS" },
  { name: "Rondônia", uf: "RO" },
  { name: "Roraima", uf: "RR" },
  { name: "Santa Catarina", uf: "SC" },
  { name: "São Paulo", uf: "SP" },
  { name: "Sergipe", uf: "SE" },
  { name: "Tocantins", uf: "TO" },
];

type Municipality = { id: number; nome: string };

// Componente para agrupar seções do formulário (Redesenhado)
const FormSection: FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <div className="bg-card rounded-xl border shadow-sm mt-4 mb-4">
    <div className="p-5 border-b bg-muted/50 rounded-t-xl">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mt-1 ml-9">{description}</p>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const EditSecretaryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const secretaryId = searchParams.get("id");

  const [formData, setFormData] = useState<FullSecretaryUpdatePayload | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isFetchingMunicipalities, setIsFetchingMunicipalities] =
    useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // Efeito para buscar os dados iniciais da secretaria
  useEffect(() => {
    if (!secretaryId) {
      toast.error("ID da secretaria não fornecido.");
      router.push("/admin/secretary");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const data = await getSecretaryById(Number(secretaryId));
        const mainResponsible = data.responsibles?.[0];
        const user = mainResponsible?.user;

        if (!mainResponsible || !user) {
          throw new Error("Dados de responsável ou usuário ausentes.");
        }

        setFormData({
          secretary: {
            name: data.name,
            is_state_level: data.is_state_level,
            municipality: data.municipality || "",
            state: data.state,
          },
          address: {
            street: data.address.street,
            number: data.address.number || "",
            neighborhood: data.address.neighborhood,
            city: data.address.city,
            cep: data.address.cep,
            state: data.address.state,
          },
          responsible: {
            name: mainResponsible.name,
            role: mainResponsible.role,
            whatsapp: mainResponsible.whatsapp || "",
            phone: mainResponsible.phone || "",
          },
          user: {
            email: user.email,
            password: "", // Senha fica em branco por padrão
          },
        });
      } catch (error) {
        toast.error("Falha ao carregar dados da secretaria.");
        console.error(error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchInitialData();
  }, [secretaryId, router]);

  // Efeito para buscar municípios quando o estado muda
  useEffect(() => {
    if (
      !formData ||
      formData.secretary.is_state_level ||
      !formData.secretary.state
    ) {
      setMunicipalities([]);
      return;
    }

    const fetchMunicipalities = async (stateUF: string) => {
      setIsFetchingMunicipalities(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateUF}/municipios`
        );
        if (!response.ok) throw new Error("Falha ao buscar municípios");
        const data: Municipality[] = await response.json();
        setMunicipalities(data);
      } catch (error) {
        toast.error("Não foi possível carregar os municípios.");
      } finally {
        setIsFetchingMunicipalities(false);
      }
    };

    fetchMunicipalities(formData.secretary.state);
  }, [formData?.secretary.state, formData?.secretary.is_state_level]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".");

    let finalValue: string | number = value;

    // Aplica a máscara de CEP (XXXXX-XXX)
    if (name === "address.cep") {
      finalValue = value
        .replace(/\D/g, "")
        .replace(/^(\d{5})(\d)/, "$1-$2")
        .substring(0, 9);
    }

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [section]: {
              ...prev[section as keyof typeof prev],
              [field]: finalValue,
            },
          }
        : null
    );
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      return;
    }

    setIsFetchingCep(true);
    const toastId = toast.loading("Buscando CEP...");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        throw new Error("Serviço de CEP indisponível.");
      }
      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado.");
      }

      setFormData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            cep: prev.address.cep,
          },
          secretary: {
            ...prev.secretary,
            state: data.uf,
            municipality: "",
          },
        };
      });

      toast.success("Endereço preenchido automaticamente.", { id: toastId });
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    const [section, field] = name.split(".");
    setFormData((prev:any) => {
      if (!prev) return null;
      const updatedSection = {
        ...prev[section as keyof typeof prev],
        [field]: value,
      };

      if (name === "secretary.is_state_level" || name === "secretary.state") {
        (updatedSection as any).municipality = "";
      }

      // Se o estado do endereço for alterado manualmente, sincronize com o estado da secretaria
      if (name === "address.state") {
        return {
          ...prev,
          address: updatedSection,
          secretary: {
            ...prev.secretary,
            state: value as string,
            municipality: "",
          },
        };
      }

      return { ...prev, [section]: updatedSection };
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !secretaryId) return;

    setIsLoading(true);
    const toastId = toast.loading("Salvando alterações...");

    try {
      await updateFullSecretaryWorkflow(Number(secretaryId), formData);
      toast.success("Secretaria atualizada com sucesso!", { id: toastId });
      router.push("/admin/secretary");
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-destructive">
        Não foi possível carregar o formulário de edição.
      </div>
    );
  }

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className="flex items-center gap-4 mb-4">
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
            {formData.secretary.is_state_level
              ? "Editar Secretaria Estadual"
              : "Editar Secretaria Municipal"}
          </h1>
          <p className="text-muted-foreground">
            Altere os dados necessários e salve as modificações.
          </p>
        </div>
      </div>
      <div className=" mx-auto ">
        <form onSubmit={handleUpdate} className="space-y-8">
          <fieldset disabled={isLoading}>
            <FormSection
              title={
                formData.secretary.is_state_level
                  ? "Dados da Secretaria Estadual"
                  : "Dados da Secretaria Municipal"
              }
              description="Informações principais sobre a entidade e sua abrangência."
              icon={<Building className="h-6 w-6 text-primary" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2 sm:col-span-1 ">
                  <Label htmlFor="secretary.name">Nome da Secretaria</Label>
                  <Input
                    id="secretary.name"
                    name="secretary.name"
                    value={formData.secretary.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2 col-span-1">
                  <Label>Tipo</Label>
                  <Select
                    value={
                      formData.secretary.is_state_level ? "state" : "municipal"
                    }
                    onValueChange={(v) =>
                      handleSelectChange(
                        "secretary.is_state_level",
                        v === "state"
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="municipal">Municipal</SelectItem>
                      <SelectItem value="state">Estadual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 ">
                  <Label htmlFor="secretary.state">Estado (UF)</Label>
                  <Select
                    name="secretary.state"
                    value={formData.secretary.state}
                    onValueChange={(v) =>
                      handleSelectChange("secretary.state", v)
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((s) => (
                        <SelectItem key={s.uf} value={s.uf}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!formData.secretary.is_state_level && (
                  <div className="grid gap-2  w-full">
                    <Label htmlFor="secretary.municipality">Município</Label>
                    <Select
                      name="secretary.municipality"
                      value={formData.secretary.municipality ?? ""}
                      onValueChange={(v) =>
                        handleSelectChange("secretary.municipality", v)
                      }
                      required={!formData.secretary.is_state_level}
                      disabled={
                        isFetchingMunicipalities || municipalities.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isFetchingMunicipalities
                              ? "Carregando..."
                              : "Selecione um município"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {municipalities.map((m) => (
                          <SelectItem key={m.id} value={m.nome}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Endereço"
              description="Localização física onde a secretaria está estabelecida."
              icon={<Home className="h-6 w-6 text-primary" />}
            >
              <fieldset disabled={isFetchingCep}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="address.cep">CEP</Label>
                      <div className="relative">
                        <Input
                          id="address.cep"
                          name="address.cep"
                          value={formData.address.cep}
                          onChange={handleInputChange}
                          onBlur={handleCepBlur}
                          required
                        />
                        {isFetchingCep && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                        )}
                      </div>
                    </div>
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="address.number">Número</Label>
                      <Input
                        id="address.number"
                        name="address.number"
                        value={formData.address.number || ""}
                        onChange={handleInputChange}
                      />
                    </div>
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
                  </div>
                </div>
              </fieldset>
            </FormSection>

            <FormSection
              title="Responsável e Acesso"
              description="Dados do gestor principal e suas credenciais de acesso ao sistema."
              icon={<User className="h-6 w-6 text-primary" />}
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
                  <div className="grid gap-2">
                    <Label htmlFor="responsible.phone">Telefone</Label>
                    <Input
                      id="responsible.phone"
                      name="responsible.phone"
                      value={formData.responsible.phone || ""}
                      onChange={handleInputChange}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="responsible.whatsapp">WhatsApp</Label>
                    <Input
                      id="responsible.whatsapp"
                      name="responsible.whatsapp"
                      value={formData.responsible.whatsapp || ""}
                      onChange={handleInputChange}
                      placeholder="(XX) XXXXX-XXXX"
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
                  {/* <div className="grid gap-2">
                    <Label htmlFor="user.password">Nova Senha</Label>
                    <Input
                      id="user.password"
                      name="user.password"
                      type="password"
                      value={formData.user.password}
                      onChange={handleInputChange}
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div> */}
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
};

export default EditSecretaryPage;
