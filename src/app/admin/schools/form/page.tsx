// app/admin/schools/form/page.tsx
"use client";

import React, { useState, useMemo, useEffect, type FC, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Icons ---
import {
  Building2,
  MapPin,
  UserCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Home,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  XCircle,
  Building,
  Map,
  Globe,
} from "lucide-react";

// --- API ---
import {
  createFullSchoolWorkflow,
  getSecretariesForSelect,
  type FullSchoolCreationPayload,
  type SecretarySelectItem,
} from "../services/api";

// --- TIPOS E INTERFACES AUXILIARES ---
type PasswordStrength = {
  score: number;
  criteria: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
  };
};
type SchoolType = "municipal" | "estadual" | "privada";

// --- DADOS E CONSTANTES ---
const passwordCriteria = [
  { id: "length", text: "Pelo menos 8 caracteres" },
  { id: "uppercase", text: "Uma letra maiúscula" },
  { id: "lowercase", text: "Uma letra minúscula" },
  { id: "number", text: "Um número" },
  { id: "specialChar", text: "Um caractere especial (!@#...)" },
];

const roleOptions = [
    "Diretor(a)",
    "Vice-Diretor(a)",
    "Coordenador(a) Pedagógico",
    "Secretário(a) Escolar",
    "Supervisor(a) de Ensino",
    "Orientador(a) Educacional",
    "Outro",
];

// --- FUNÇÕES UTILITÁRIAS ---
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const checkPasswordStrength = (password: string): PasswordStrength => {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  return { score, criteria };
};

const generateStrongPassword = (): string => {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const allChars = lower + upper + numbers + symbols;
  let password = "";
  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password.split("").sort(() => 0.5 - Math.random()).join("");
};

// --- COMPONENTES AUXILIARES ---
const PasswordInput: FC<{
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
}> = ({ value, onChange, onGenerate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = useMemo(() => checkPasswordStrength(value), [value]);

  const strengthColor =
    strength.score <= 2 ? "bg-red-500" :
    strength.score <= 4 ? "bg-yellow-500" :
    "bg-green-500";

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="user.password">Senha de Acesso</Label>
          <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={onGenerate}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Gerar Senha
          </Button>
        </div>
        <div className="relative">
          <Input
            id="user.password"
            name="user.password"
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            required
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-2 rounded-full ${strengthColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${(strength.score / 5) * 100}%` }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {passwordCriteria.map((criterion) => {
              const isMet = strength.criteria[criterion.id as keyof PasswordStrength["criteria"]];
              return (
                <li key={criterion.id} className={`flex items-center transition-colors ${isMet ? "text-green-600" : "text-muted-foreground"}`}>
                  {isMet ? <CheckCircle className="h-3 w-3 mr-2 shrink-0" /> : <XCircle className="h-3 w-3 mr-2 shrink-0" />}
                  {criterion.text}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const ReviewCard: FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> =
({ title, icon, children }) => (
  <div className="rounded-xl border bg-card shadow-sm text-card-foreground">
    <div className="flex items-center gap-3 border-b bg-muted/50 p-4">
      {icon}
      <h4 className="text-md font-semibold">{title}</h4>
    </div>
    <div className="p-4 space-y-2 text-sm text-muted-foreground">{children}</div>
  </div>
);

const ReviewItem: FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center">
    <span className="font-semibold text-foreground w-28 shrink-0">{label}:</span>
    <span className="break-words">
      {value || <span className="text-muted-foreground/80">Não preenchido</span>}
    </span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function SchoolFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FullSchoolCreationPayload>({
    school: { name: "", is_private: true, secretary_id: null },
    address: { street: "", number: "", neighborhood: "", city: "", state: "", cep: "" },
    responsible: { name: "", role: "Diretor(a)", whatsapp: "", phone: "" },
    user: { email: "", password: "", user_type: "responsible_school" },
  });

  const [schoolTypeSelected, setSchoolTypeSelected] = useState<SchoolType | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const [secretaries, setSecretaries] = useState<SecretarySelectItem[]>([]);
  const [openSecretaryPopover, setOpenSecretaryPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => checkPasswordStrength(formData.user.password), [formData.user.password]);

  useEffect(() => {
    getSecretariesForSelect()
      .then(setSecretaries)
      .catch((err) => toast.error("Erro ao buscar secretarias: " + err.message));
  }, []);

  const steps = useMemo(() => [
    { id: 1, name: "Tipo", icon: <Building2 className="h-5 w-5" /> },
    { id: 2, name: "Endereço", icon: <MapPin className="h-5 w-5" /> },
    { id: 3, name: "Acesso", icon: <UserCircle className="h-5 w-5" /> },
    { id: 4, name: "Revisão", icon: <CheckCircle className="h-5 w-5" /> },
  ], []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.') as [keyof FullSchoolCreationPayload, string];
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

    if (name === "user.email") {
      if (value && !isValidEmail(value)) {
        setEmailError("Formato de e-mail inválido.");
      } else {
        setEmailError(null);
      }
    }
  };

  const handleSchoolTypeChange = (value: SchoolType) => {
    setSchoolTypeSelected(value);
    const isPrivate = value === "privada";
    setFormData(prev => ({
        ...prev,
        school: {
            ...prev.school,
            is_private: isPrivate,
            secretary_id: isPrivate ? null : prev.school.secretary_id,
        }
    }))
  }

  const handleSecretarySelect = (secretaryId: number) => {
    setFormData((prev) => ({ ...prev, school: { ...prev.school, secretary_id: secretaryId } }));
    setOpenSecretaryPopover(false);
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, responsible: { ...prev.responsible, role: value } }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setFormData((prev) => ({ ...prev, user: { ...prev.user, password: newPassword } }));
    setConfirmPassword(newPassword);
    toast.success("Nova senha segura gerada!");
  };

  const handleCepLookup = async () => {
    const cep = formData.address.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      if(formData.address.cep.length > 0) toast.warning("O CEP deve conter 8 dígitos.");
      return;
    }
    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP não encontrado. Por favor, preencha o endereço manualmente.");
        return;
      }
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }
      }));
      toast.success("Endereço encontrado!");
    } catch (error) {
      toast.error("Falha ao buscar o CEP. Tente novamente mais tarde.");
    } finally {
      setIsFetchingCep(false);
    }
  };

  const isStepValid = useMemo(() => {
    const { school, responsible, user } = formData;
    switch(currentStep) {
        case 1:
            if (!schoolTypeSelected) return false;
            if (!school.name) return false;
            if (!school.is_private && !school.secretary_id) return false;
            return true;
        case 3:
            return !!(
                responsible.name &&
                responsible.role &&
                user.email &&
                isValidEmail(user.email) &&
                user.password &&
                user.email === confirmEmail &&
                user.password === confirmPassword &&
                passwordStrength.score >= 4
            );
        default:
            return true;
    }
  }, [formData, currentStep, schoolTypeSelected, confirmEmail, confirmPassword, passwordStrength.score]);


  const nextStep = () => {
    if (!isStepValid) {
        return toast.warning("Por favor, preencha todos os campos obrigatórios para avançar.");
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  }

  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Salvando informações da escola...");
    try {
      await createFullSchoolWorkflow(formData);
      toast.success("Escola cadastrada com sucesso!", { id: toastId });
      setTimeout(() => router.push("/admin/schools"), 1500);
    } catch (err) {
      toast.error((err as Error).message, { id: toastId });
      setIsLoading(false);
    }
  };

  const slideAnimation = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-background min-h-screen">
      <div className="w-full mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {schoolId ? "Editar Escola" : "Adicionar Nova Escola"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Siga as etapas para cadastrar uma nova escola no sistema.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8 mt-8">
            <div className="relative">
              <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-border">
                <motion.div className="h-full bg-primary" animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
              <div className="relative flex justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center text-center gap-2 w-20">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all duration-300 ${currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Formulário */}
        <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-2xl shadow-lg border">
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset disabled={isLoading}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={slideAnimation}
                  initial="initial" animate="animate" exit="exit"
                  transition={{ type: "tween", duration: 0.3 }}
                >
                  {/* Etapa 1: Dados da Escola */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                        <div>
                            <Label className="text-base font-semibold text-foreground">Qual o tipo da escola?</Label>
                            <p className="text-sm text-muted-foreground mb-4">Selecione uma das opções para continuar.</p>
                            <RadioGroup
                                value={schoolTypeSelected ?? ""}
                                onValueChange={(value: SchoolType) => handleSchoolTypeChange(value)}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                            >
                                {[{id: "municipal", icon: <Map className="h-8 w-8 mb-2 text-muted-foreground" />, label: "Municipal"},
                                  {id: "estadual", icon: <Globe className="h-8 w-8 mb-2 text-muted-foreground" />, label: "Estadual"},
                                  {id: "privada", icon: <Building className="h-8 w-8 mb-2 text-muted-foreground" />, label: "Privada"}
                                ].map((type) => (
                                    <Label
                                        key={type.id}
                                        htmlFor={`r-${type.id}`}
                                        className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all ${
                                            schoolTypeSelected === type.id ? "border-primary bg-muted" : "border"
                                        }`}
                                    >
                                        <RadioGroupItem value={type.id} id={`r-${type.id}`} className="sr-only" />
                                        {type.icon}
                                        <span className="font-semibold">{type.label}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        <AnimatePresence>
                            {schoolTypeSelected && (
                                <motion.div
                                    className="space-y-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="grid gap-2">
                                        <Label htmlFor="school.name">Nome da Escola</Label>
                                        <Input id="school.name" name="school.name" value={formData.school.name} onChange={handleInputChange} required />
                                    </div>

                                    {!formData.school.is_private && (
                                        <div className="grid gap-2">
                                            <Label>Secretaria Vinculada (Obrigatório)</Label>
                                            <Popover open={openSecretaryPopover} onOpenChange={setOpenSecretaryPopover}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {formData.school.secretary_id ? secretaries.find(s => s.id === formData.school.secretary_id)?.name : "Selecione uma secretaria..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                <CommandInput placeholder="Buscar secretaria..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma secretaria encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                    {secretaries.map((s) => (
                                                        <CommandItem key={s.id} value={s.name} onSelect={() => handleSecretarySelect(s.id)}>
                                                        <Check className={`mr-2 h-4 w-4 ${formData.school.secretary_id === s.id ? "opacity-100" : "opacity-0"}`} />
                                                        {s.name}
                                                        </CommandItem>
                                                    ))}
                                                    </CommandGroup>
                                                </CommandList>
                                                </Command>
                                            </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                  )}

                  {/* Etapa 2: Endereço */}
                  {currentStep === 2 && (
                       <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2 sm:col-span-1">
                              <Label htmlFor="address.cep">CEP</Label>
                              <div className="relative flex items-center">
                                <Input
                                  id="address.cep"
                                  name="address.cep"
                                  value={formData.address.cep}
                                  onChange={handleInputChange}
                                  onBlur={handleCepLookup}
                                  placeholder="00000-000"
                                  maxLength={9}
                                  required
                                />
                                {isFetchingCep && <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />}
                              </div>
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-4 gap-4">
                            <div className="grid gap-2 sm:col-span-3">
                              <Label htmlFor="address.street">Rua / Avenida</Label>
                              <Input id="address.street" name="address.street" value={formData.address.street} onChange={handleInputChange} disabled={isFetchingCep} required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="address.number">Número</Label>
                              <Input id="address.number" name="address.number" value={formData.address.number} onChange={handleInputChange} />
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="address.neighborhood">Bairro</Label>
                              <Input id="address.neighborhood" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleInputChange} disabled={isFetchingCep} required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="address.city">Cidade</Label>
                              <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleInputChange} disabled={isFetchingCep} required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="address.state">Estado (UF)</Label>
                              <Input id="address.state" name="address.state" value={formData.address.state} onChange={handleInputChange} disabled={isFetchingCep} required maxLength={2} />
                            </div>
                          </div>
                        </div>
                  )}

                  {/* Etapa 3: Acesso */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium border-b pb-2 text-foreground">Dados do Responsável Principal</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="responsible.name">Nome do Responsável</Label>
                            <Input id="responsible.name" name="responsible.name" value={formData.responsible.name} onChange={handleInputChange} required />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="responsible.role">Cargo</Label>
                              <Select value={formData.responsible.role} onValueChange={handleRoleChange} required>
                                  <SelectTrigger id="responsible.role">
                                      <SelectValue placeholder="Selecione um cargo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {roleOptions.map((role) => (
                                          <SelectItem key={role} value={role}>{role}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                        </div>

                        <h3 className="text-lg font-medium border-b pb-2 pt-4 text-foreground">Credenciais de Acesso</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            <div className="grid gap-2">
                                <Label htmlFor="user.email">E-mail de Acesso</Label>
                                <div className="relative">
                                    <Input
                                        id="user.email"
                                        name="user.email"
                                        type="email"
                                        value={formData.user.email}
                                        onChange={handleInputChange}
                                        onBlur={() => setEmailTouched(true)}
                                        required
                                        className={`pr-10 ${
                                            emailTouched && emailError ? "border-red-500 focus-visible:ring-red-500"
                                            : emailTouched && !emailError && formData.user.email ? "border-green-500 focus-visible:ring-green-500"
                                            : ""
                                        }`}
                                    />
                                    {emailTouched && formData.user.email && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            {emailError ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                        </div>
                                    )}
                                </div>
                                <div className="h-5">
                                    {emailTouched && emailError && (<p className="text-xs text-red-500">{emailError}</p>)}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm.email">Confirmar E-mail</Label>
                                <Input
                                    id="confirm.email"
                                    name="confirm.email"
                                    type="email"
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    required
                                />
                                <div className="h-5">
                                    {confirmEmail && formData.user.email !== confirmEmail && (
                                        <p className="text-xs text-red-500">Os e-mails não coincidem.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-x-4 gap-y-6 border-t pt-6 mt-2">
                            <PasswordInput
                                value={formData.user.password}
                                onChange={handleInputChange}
                                onGenerate={handleGeneratePassword}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="confirm.password">Confirmar Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm.password"
                                        name="confirm.password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="h-5">
                                    {formData.user.password && confirmPassword && formData.user.password !== confirmPassword && (
                                        <p className="text-xs text-red-500">As senhas não coincidem.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* Etapa 4: Revisão */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-foreground text-center md:text-left">
                        Revise as Informações
                      </h3>
                      <div className="space-y-4">
                        <ReviewCard title="Dados da Escola" icon={<Building2 className="h-5 w-5 text-muted-foreground" />}>
                          <ReviewItem label="Nome" value={formData.school.name} />
                          <ReviewItem label="Tipo" value={formData.school.is_private ? 'Privada' : `Pública (${schoolTypeSelected})`} />
                          {!formData.school.is_private && (
                              <ReviewItem label="Secretaria" value={secretaries.find(s=>s.id === formData.school.secretary_id)?.name || 'Nenhuma'} />
                          )}
                        </ReviewCard>

                        <ReviewCard title="Endereço" icon={<Home className="h-5 w-5 text-muted-foreground" />}>
                          <ReviewItem label="Logradouro" value={`${formData.address.street}, ${formData.address.number || "s/n"}`} />
                          <ReviewItem label="Bairro" value={formData.address.neighborhood} />
                          <ReviewItem label="Cidade" value={`${formData.address.city} - ${formData.address.state.toUpperCase()}`} />
                          <ReviewItem label="CEP" value={formData.address.cep} />
                        </ReviewCard>

                        <ReviewCard title="Responsável e Acesso" icon={<User className="h-5 w-5 text-muted-foreground" />}>
                          <ReviewItem label="Nome" value={formData.responsible.name} />
                          <ReviewItem label="Cargo" value={formData.responsible.role} />
                          <ReviewItem label="E-mail" value={formData.user.email} />
                        </ReviewCard>
                      </div>
                      <p className="text-xs text-muted-foreground text-center !mt-8">
                        Ao clicar em "Salvar Escola", você confirma que todas as informações estão corretas.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </fieldset>

            {/* Navegação do Formulário */}
            <div className="mt-8 pt-6 border-t flex justify-between items-center">
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading || currentStep === 1}>Anterior</Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep} disabled={isLoading || !isStepValid}>Próximo</Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Salvando..." : "Salvar Escola"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}