"use client";

import React, {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  useMemo,
  type FC,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  RefreshCw,
  XCircle,
  CheckCircle,
} from "lucide-react";

// --- API ---
import {
  getSecretariesForSelect,
  createResponsibleUser,
} from "../services/formApi";
import type { SecretaryApiResponse } from "../../secretary/services/api";

// --- TIPOS, CONSTANTES E UTILITÁRIOS ---
type UserType = "premium" | "responsible" | "student" | "teacher";
type UserLevel = "super_admin" | "admin";
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

const passwordCriteria = [
  { id: "length", text: "Pelo menos 8 caracteres" },
  { id: "uppercase", text: "Uma letra maiúscula" },
  { id: "lowercase", text: "Uma letra minúscula" },
  { id: "number", text: "Um número" },
  { id: "specialChar", text: "Um caractere especial (!@#...)" },
];

const roleOptions = [
  "Secretário(a) de Educação",
  "Secretário(a) Adjunto(a)",
  "Subsecretário(a)",
  "Superintendente",
  "Diretor(a) de Departamento",
  "Coordenador(a) Pedagógico",
  "Coordenador(a) Administrativo",
  "Assessor(a) Técnico",
];

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
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

// --- COMPONENTE AUXILIAR DE SENHA ---
const PasswordInput: FC<{
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
}> = ({ value, onChange, onGenerate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = useMemo(() => checkPasswordStrength(value), [value]);

  const strengthColor =
    strength.score <= 2
      ? "bg-red-500"
      : strength.score <= 4
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="p-0 h-auto text-primary"
            onClick={onGenerate}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Gerar Senha
          </Button>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
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
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
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
              const isMet =
                strength.criteria[
                  criterion.id as keyof PasswordStrength["criteria"]
                ];
              return (
                <li
                  key={criterion.id}
                  className={`flex items-center transition-colors ${
                    isMet ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {isMet ? (
                    <CheckCircle className="h-3 w-3 mr-2 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-2 shrink-0" />
                  )}
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

export default function UserFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [selectedUserType, setSelectedUserType] = useState<UserType | "">("");
  const [userLevel, setUserLevel] = useState<UserLevel>("admin");

  const [userData, setUserData] = useState({ email: "", password: "" });
  const [responsibleData, setResponsibleData] = useState({
    name: "",
    role: "",
    secretary_id: null as number | null,
  });

  // --- Novos estados para validação ---
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const [secretaries, setSecretaries] = useState<SecretaryApiResponse[]>([]);
  const [openSecretaryPopover, setOpenSecretaryPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = useMemo(
    () => checkPasswordStrength(userData.password),
    [userData.password]
  );

  useEffect(() => {
    if (selectedUserType === "responsible") {
      getSecretariesForSelect()
        .then(setSecretaries)
        .catch(() =>
          setError("Não foi possível carregar a lista de secretarias.")
        );
    }
  }, [selectedUserType]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validação antes de enviar
    if (!isValidEmail(userData.email)) {
      toast.error("O formato do e-mail é inválido.");
      return;
    }
    if (userData.email !== confirmEmail) {
      toast.error("Os e-mails não coincidem.");
      return;
    }
    if (passwordStrength.score < 4) {
      toast.error("A senha não atende aos critérios de segurança.");
      return;
    }
    if (userData.password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (selectedUserType === "premium" || selectedUserType === "responsible") {
      try {
        const userPayload = {
          ...userData,
          user_type:
            selectedUserType === "premium"
              ? userLevel
              : "responsible_secretary",
          status: true,
        };

        const finalResponsibleData = {
          ...responsibleData,
          secretary_id:
            selectedUserType === "responsible"
              ? responsibleData.secretary_id
              : null,
        };

        await createResponsibleUser({
          user: userPayload,
          responsible: finalResponsibleData,
        });
        toast.success("Usuário criado com sucesso!");
        router.push("/admin/users");
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Tipo de usuário selecionado não é válido para criação.");
      setIsLoading(false);
    }
  };

  const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setEmailTouched(true);
      if (value && !isValidEmail(value)) {
        setEmailError("Formato de e-mail inválido.");
      } else {
        setEmailError(null);
      }
    }
  };

  const handleResponsibleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResponsibleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setResponsibleData((prev) => ({ ...prev, role: value }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setUserData((prev) => ({ ...prev, password: newPassword }));
    setConfirmPassword(newPassword);
    toast.success("Nova senha segura gerada!");
  };

  const cardAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <main className="flex flex-1 flex-col p-4 md:p-8 bg-background min-h-screen">
      <div className=" mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {userId ? "Editar Usuário" : "Adicionar Novo Usuário"}
            </h1>
            <p className="text-muted-foreground">
              Siga os passos para criar um novo acesso ao sistema.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8">
          {/* Passo 1: Seleção de Tipo */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 grid gap-4">
            <Label htmlFor="userType" className="font-semibold text-lg">
              Passo 1: Tipo de Usuário
            </Label>
            <Select
              onValueChange={(value: UserType) => setSelectedUserType(value)}
              value={selectedUserType}
              required
            >
              <SelectTrigger id="userType">
                <SelectValue placeholder="Selecione o tipo de usuário..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">Premium (Admin)</SelectItem>
                <SelectItem value="responsible">
                  Responsável de Secretaria
                </SelectItem>
                {/* Outras opções desabilitadas */}
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence>
            {/* Passo 2: Nível de Acesso (Aparece apenas para Premium) */}
            {selectedUserType === "premium" && (
              <motion.div
                key="step2"
                variants={cardAnimation}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 grid gap-4"
              >
                <Label htmlFor="userLevel" className="font-semibold text-lg">
                  Passo 2: Nível de Acesso
                </Label>
                <Select
                  onValueChange={(value: UserLevel) => setUserLevel(value)}
                  defaultValue="admin"
                >
                  <SelectTrigger id="userLevel">
                    <SelectValue placeholder="Selecione o nível de acesso..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Passo 3: Dados de Acesso e Responsável */}
            {(selectedUserType === "premium" ||
              selectedUserType === "responsible") && (
              <motion.div
                key="step3"
                variants={cardAnimation}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 grid gap-6"
              >
                <h3 className="font-semibold text-lg">
                  {selectedUserType === "premium"
                    ? "Passo 3: Dados do Admin"
                    : "Passo 2: Dados de Acesso"}
                </h3>
                <div className="grid gap-2">
                  <Label htmlFor="responsibleName">Nome</Label>
                  <Input
                    id="responsibleName"
                    name="name"
                    value={responsibleData.name}
                    onChange={handleResponsibleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* --- SEÇÃO DE E-MAIL ATUALIZADA --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={userData.email}
                        onChange={handleUserInputChange}
                        required
                        disabled={isLoading}
                        className={`pr-10 ${
                          emailTouched && emailError
                            ? "border-red-500"
                            : emailTouched && !emailError && userData.email
                            ? "border-green-500"
                            : ""
                        }`}
                      />
                      {emailTouched && userData.email && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          {emailError ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="h-5">
                      <p className="text-xs text-red-500">
                        {emailTouched && emailError}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmEmail">Confirmar E-mail</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <div className="h-5">
                      {confirmEmail && userData.email !== confirmEmail && (
                        <p className="text-xs text-red-500">
                          Os e-mails não coincidem.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- SEÇÃO DE SENHA ATUALIZADA --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-x-6 gap-y-6">
                  <PasswordInput
                    value={userData.password}
                    onChange={handleUserInputChange}
                    onGenerate={handleGeneratePassword}
                  />
                  <div className="grid gap-2 pt-1">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full w-10"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="h-5">
                      {confirmPassword &&
                        userData.password !== confirmPassword && (
                          <p className="text-xs text-red-500">
                            As senhas não coincidem.
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="  grid gap-6">
                  {selectedUserType === "responsible" && (
                    <div className="grid grid-cols-2 gap-6">
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
                              aria-expanded={openSecretaryPopover}
                              className="w-full justify-between"
                              disabled={!secretaries.length}
                            >
                              {responsibleData.secretary_id
                                ? secretaries.find(
                                    (s) => s.id === responsibleData.secretary_id
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
                                  {secretaries.map((secretary) => (
                                    <CommandItem
                                      key={secretary.id}
                                      value={secretary.name}
                                      onSelect={() => {
                                        setResponsibleData((prev) => ({
                                          ...prev,
                                          secretary_id: secretary.id,
                                        }));
                                        setOpenSecretaryPopover(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          responsibleData.secretary_id ===
                                          secretary.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }`}
                                      />
                                      {secretary.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid gap-2 w-full">
                        <Label htmlFor="responsibleRole">Cargo</Label>
                        <Select
                          onValueChange={handleRoleChange}
                          value={responsibleData.role}
                          required
                        >
                          <SelectTrigger
                            id="responsibleRole"
                            disabled={isLoading}
                                                      className="w-full"

                          >
                            <SelectValue placeholder="Selecione um cargo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedUserType}>
              {isLoading ? "Salvando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
