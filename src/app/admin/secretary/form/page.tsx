"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  type FC,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- IMPORTAÇÕES DA API ---
import {
  createFullSecretaryWorkflow,
  type FullSecretaryCreationPayload,
} from "../services/api";

// --- IMPORTAÇÕES DOS COMPONENTES DA UI (shadcn/ui) ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- IMPORTAÇÕES DOS ÍCONES (lucide-react) ---
import {
  Building,
  MapPin,
  UserCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Home,
  User,
  Globe,
  Map,
} from "lucide-react";

// --- DADOS ---
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

// --- TIPOS LOCAIS ---
type Step = {
  id: number;
  name: string;
  icon: React.ReactNode;
};

type Municipality = {
  id: number;
  nome: string;
};

// --- COMPONENTES AUXILIARES (COM TEMA RESPONSIVO) ---
const ReviewCard: FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="rounded-xl border bg-card shadow-sm text-card-foreground">
    <div className="flex items-center gap-3 border-b bg-muted/50 p-4">
      {icon}
      <h4 className="text-md font-semibold">{title}</h4>
    </div>
    <div className="p-4 space-y-2 text-sm text-muted-foreground">
      {children}
    </div>
  </div>
);

const ReviewItem: FC<{ label: string; value: string | React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center">
    <span className="font-semibold text-foreground w-28 shrink-0">
      {label}:
    </span>
    <span className="break-words">
      {value || (
        <span className="text-muted-foreground/80">Não preenchido</span>
      )}
    </span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
const SecretaryFormPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const secretaryId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(1);
  const [levelSelected, setLevelSelected] = useState(false);
  const [formData, setFormData] = useState<FullSecretaryCreationPayload>({
    secretary: { name: "", is_state_level: false, municipality: "", state: "" },
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
    },
    responsible: { name: "", role: "", whatsapp: "", phone: "" },
    user: { email: "", password: "", user_type: "responsible_secretary" },
  });

  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isFetchingMunicipalities, setIsFetchingMunicipalities] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMunicipalities = async () => {
      if (!formData.secretary.state) {
        setMunicipalities([]);
        return;
      }
      setIsFetchingMunicipalities(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.secretary.state}/municipios`
        );
        if (!response.ok) throw new Error("Falha ao buscar municípios");
        const data: Municipality[] = await response.json();
        setMunicipalities(data);
      } catch (error) {
        toast.error(
          "Não foi possível carregar os municípios do estado selecionado."
        );
        setMunicipalities([]);
      } finally {
        setIsFetchingMunicipalities(false);
      }
    };

    if (!formData.secretary.is_state_level) {
      fetchMunicipalities();
    }
  }, [formData.secretary.state, formData.secretary.is_state_level]);

  const steps: Step[] = useMemo(
    () => [
      { id: 1, name: "Dados", icon: <Building className="h-5 w-5" /> },
      { id: 2, name: "Endereço", icon: <MapPin className="h-5 w-5" /> },
      { id: 3, name: "Acesso", icon: <UserCircle className="h-5 w-5" /> },
      { id: 4, name: "Revisão", icon: <CheckCircle className="h-5 w-5" /> },
    ],
    []
  );

  const isStepValid = useMemo(() => {
    const { secretary, address, responsible, user } = formData;
    switch (currentStep) {
      case 1:
        if (!levelSelected) return false;
        if (!secretary.name || !secretary.state) return false;
        if (!secretary.is_state_level && !secretary.municipality) return false;
        return true;
      case 2:
        return !!(
          address.street &&
          address.neighborhood &&
          address.city &&
          address.cep
        );
      case 3:
        return !!(
          responsible.name &&
          responsible.role &&
          user.email &&
          user.password &&
          user.email === confirmEmail &&
          user.password === confirmPassword
        );
      default:
        return true;
    }
  }, [formData, currentStep, levelSelected, confirmEmail, confirmPassword]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".") as [
      keyof FullSecretaryCreationPayload,
      string
    ];
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleLevelChange = (value: "state" | "municipal") => {
    const isStateLevel = value === "state";
    setLevelSelected(true);
    setFormData((prev) => ({
      ...prev,
      secretary: {
        ...prev.secretary,
        is_state_level: isStateLevel,
        municipality: "",
        state: isStateLevel ? prev.secretary.state : "",
      },
    }));
    if (isStateLevel) setMunicipalities([]);
  };

  const handleStateSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      secretary: { ...prev.secretary, state: value, municipality: "" },
    }));
  };

  const handleMunicipalitySelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      secretary: { ...prev.secretary, municipality: value },
    }));
  };

  const nextStep = () => {
    if (!isStepValid) {
      if (currentStep === 3) {
        if (formData.user.email !== confirmEmail)
          return toast.error("Os e-mails não coincidem.");
        if (formData.user.password !== confirmPassword)
          return toast.error("As senhas não coincidem.");
      }
      return toast.warning("Por favor, preencha todos os campos obrigatórios.");
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Salvando informações...");
    try {
      await createFullSecretaryWorkflow(formData);
      toast.success("Secretaria cadastrada com sucesso!", { id: toastId });
      setTimeout(() => router.push("/admin/secretary"), 1500);
    } catch (err) {
      toast.error((err as Error).message || "Ocorreu um erro desconhecido.", {
        id: toastId,
      });
      setIsLoading(false);
    }
  };

  const slideAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className="w-full mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {secretaryId ? "Editar Secretaria" : "Adicionar Nova Secretaria"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Siga as etapas para cadastrar uma nova entidade no sistema.
            </p>
          </div>
        </div>

        <div className="mb-8 mt-8">
          <div className="relative">
            <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-border">
              <motion.div
                className="h-full bg-primary"
                animate={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-col items-center text-center gap-2 w-16 sm:w-20"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`hidden sm:block text-xs font-medium ${
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-2xl shadow-lg border w-full">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset disabled={isLoading}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    variants={slideAnimation}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.3 }}
                  >
                    {currentStep === 1 && (
                      <div className="space-y-8">
                        <div>
                          <Label className="text-base font-semibold text-foreground">
                            Qual o nível da secretaria?
                          </Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Selecione uma das opções abaixo para continuar.
                          </p>
                          <RadioGroup
                            value={
                              levelSelected
                                ? formData.secretary.is_state_level
                                  ? "state"
                                  : "municipal"
                                : ""
                            }
                            onValueChange={(value: "state" | "municipal") =>
                              handleLevelChange(value)
                            }
                            className="grid grid-cols-1 sm:grid-cols-2 max-w-xl gap-4"
                          >
                            <Label
                              htmlFor="r-municipal"
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all ${
                                !formData.secretary.is_state_level &&
                                levelSelected
                                  ? "border-primary bg-muted"
                                  : "border"
                              }`}
                            >
                              <RadioGroupItem
                                value="municipal"
                                id="r-municipal"
                                className="sr-only"
                              />
                              <Map className="h-8 w-8 mb-2 text-muted-foreground" />
                              <span className="font-semibold">Municipal</span>
                            </Label>
                            <Label
                              htmlFor="r-state"
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all ${
                                formData.secretary.is_state_level &&
                                levelSelected
                                  ? "border-primary bg-muted"
                                  : "border"
                              }`}
                            >
                              <RadioGroupItem
                                value="state"
                                id="r-state"
                                className="sr-only"
                              />
                              <Globe className="h-8 w-8 mb-2 text-muted-foreground" />
                              <span className="font-semibold">Estadual</span>
                            </Label>
                          </RadioGroup>
                        </div>

                        <AnimatePresence>
                          {levelSelected && (
                            <motion.div
                              className="space-y-6"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="grid gap-2">
                                <Label htmlFor="secretary.name">
                                  Nome da Secretaria
                                </Label>
                                <Input
                                  id="secretary.name"
                                  name="secretary.name"
                                  value={formData.secretary.name}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="secretary.state">
                                    Estado (UF)
                                  </Label>
                                  <Select
                                    value={formData.secretary.state}
                                    onValueChange={handleStateSelectChange}
                                    required
                                  >
                                    <SelectTrigger id="secretary.state">
                                      <SelectValue placeholder="Selecione um estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {brazilianStates.map((state) => (
                                        <SelectItem
                                          key={state.uf}
                                          value={state.uf}
                                        >
                                          {state.name} ({state.uf})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {!formData.secretary.is_state_level && (
                                  <div className="grid gap-2">
                                    <Label htmlFor="secretary.municipality">
                                      Município
                                    </Label>
                                    <Select
                                      value={
                                        formData.secretary.municipality || ""
                                      }
                                      onValueChange={
                                        handleMunicipalitySelectChange
                                      }
                                      required={
                                        !formData.secretary.is_state_level
                                      }
                                      disabled={
                                        isFetchingMunicipalities ||
                                        municipalities.length === 0
                                      }
                                    >
                                      <SelectTrigger id="secretary.municipality">
                                        <SelectValue
                                          placeholder={
                                            isFetchingMunicipalities
                                              ? "Carregando..."
                                              : "Selecione um município"
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {municipalities.map((municipality) => (
                                          <SelectItem
                                            key={municipality.id}
                                            value={municipality.nome}
                                          >
                                            {municipality.nome}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="grid gap-2 sm:col-span-3">
                            <Label htmlFor="address.street">
                              Rua / Avenida
                            </Label>
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
                              value={formData.address.number}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="responsible.name">Nome</Label>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="responsible.phone">Telefone</Label>
                            <Input
                              id="responsible.phone"
                              name="responsible.phone"
                              value={formData.responsible.phone}
                              onChange={handleInputChange}
                              placeholder="(92) 9..."
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="responsible.whatsapp">
                              WhatsApp
                            </Label>
                            <Input
                              id="responsible.whatsapp"
                              name="responsible.whatsapp"
                              value={formData.responsible.whatsapp}
                              onChange={handleInputChange}
                              placeholder="(92) 9..."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6 mt-2">
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
                            <Label htmlFor="confirm.email">
                              Confirmar E-mail
                            </Label>
                            <Input
                              id="confirm.email"
                              name="confirm.email"
                              type="email"
                              value={confirmEmail}
                              onChange={(e) => setConfirmEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="user.password">
                              Senha de Acesso
                            </Label>
                            <Input
                              id="user.password"
                              name="user.password"
                              type="password"
                              value={formData.user.password}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="confirm.password">
                              Confirmar Senha
                            </Label>
                            <Input
                              id="confirm.password"
                              name="confirm.password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground text-center md:text-left">
                          Revise as Informações
                        </h3>
                        <div className="space-y-4">
                          <ReviewCard
                            title="Dados da Secretaria"
                            icon={
                              <Building className="h-5 w-5 text-muted-foreground" />
                            }
                          >
                            <ReviewItem
                              label="Nome"
                              value={formData.secretary.name}
                            />
                            <ReviewItem
                              label="Nível"
                              value={
                                formData.secretary.is_state_level
                                  ? "Estadual"
                                  : "Municipal"
                              }
                            />
                            {!formData.secretary.is_state_level && (
                              <ReviewItem
                                label="Município"
                                value={formData.secretary.municipality}
                              />
                            )}
                            <ReviewItem
                              label="Estado (UF)"
                              value={formData.secretary.state.toUpperCase()}
                            />
                          </ReviewCard>

                          <ReviewCard
                            title="Endereço"
                            icon={
                              <Home className="h-5 w-5 text-muted-foreground" />
                            }
                          >
                            <ReviewItem
                              label="Logradouro"
                              value={`${formData.address.street}, ${
                                formData.address.number || "s/n"
                              }`}
                            />
                            <ReviewItem
                              label="Bairro"
                              value={formData.address.neighborhood}
                            />
                            <ReviewItem
                              label="Cidade"
                              value={formData.address.city}
                            />
                            <ReviewItem
                              label="CEP"
                              value={formData.address.cep}
                            />
                          </ReviewCard>

                          <ReviewCard
                            title="Responsável e Acesso"
                            icon={
                              <User className="h-5 w-5 text-muted-foreground" />
                            }
                          >
                            <ReviewItem
                              label="Nome"
                              value={formData.responsible.name}
                            />
                            <ReviewItem
                              label="Cargo"
                              value={formData.responsible.role}
                            />
                            <ReviewItem
                              label="Contato"
                              value={`${
                                formData.responsible.phone || "N/A"
                              } (Tel) / ${
                                formData.responsible.whatsapp || "N/A"
                              } (Wpp)`}
                            />
                            <ReviewItem
                              label="E-mail"
                              value={formData.user.email}
                            />
                          </ReviewCard>
                        </div>
                        <p className="text-xs text-muted-foreground text-center !mt-8">
                          Ao clicar em "Salvar Secretaria", você confirma que
                          todas as informações estão corretas.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </fieldset>

              <div className="mt-8 pt-6 border-t flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading || currentStep === 1}
                >
                  Anterior
                </Button>
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isLoading || !isStepValid}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Salvando..." : "Salvar Secretaria"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SecretaryFormPage;
