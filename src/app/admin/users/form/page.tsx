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
  Loader2,
} from "lucide-react";

// --- API ---
import {
  getSecretariesForSelect,
  createResponsibleUser,
} from "../services/formApi";
import { createTeacher } from "../../teachers/services/api";
import { createStudent } from "../../students/services/api";
import type { SecretaryApiResponse } from "../../secretary/services/api";
import { getSchoolById, type Class } from "../../schools/services/api";
import {  getSchools, School } from "../../licenses/services/api"; // Renomeado para getSchoolsForSelect por clareza

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

const secretaryRoleOptions = [
  "Secretário(a) de Educação",
  "Secretário(a) Adjunto(a)",
  "Subsecretário(a)",
  "Superintendente",
  "Diretor(a) de Departamento",
  "Coordenador(a) Pedagógico",
];

const adminRoleOptions = [
  "Desenvolvedor",
  "Gestor de Projetos",
  "Diretor Executivo",
  "Editor Chefe",
  "Analista de Marketing",
  "Designer Gráfico",
  "Outro",
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
          <Button type="button" variant="link" size="sm" className="p-0 h-auto text-primary" onClick={onGenerate}>
            <RefreshCw className="h-3 w-3 mr-1" /> Gerar Senha
          </Button>
        </div>
        <div className="relative">
          <Input id="password" name="password" type={showPassword ? "text" : "password"} value={value} onChange={onChange} required className="pr-10" />
          <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {value.length > 0 && (
        <div className="space-y-3">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div className={`h-2 rounded-full ${strengthColor}`} initial={{ width: 0 }} animate={{ width: `${(strength.score / 5) * 100}%` }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {passwordCriteria.map((criterion) => {
              const isMet = strength.criteria[criterion.id as keyof PasswordStrength["criteria"]];
              return (
                <li key={criterion.id} className={`flex items-center transition-colors ${isMet ? "text-green-600" : "text-muted-foreground"}`}>
                  {isMet ? <CheckCircle className="h-3 w-3 mr-2 shrink-0" /> : <XCircle className="h-3 w-3 mr-2 shrink-0" />} {criterion.text}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function UserFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [selectedUserType, setSelectedUserType] = useState<UserType | "">("");
  const [userLevel, setUserLevel] = useState<UserLevel>("admin");

  const [userData, setUserData] = useState({ email: "", password: "" });
  const [profileData, setProfileData] = useState({
    name: "",
    role: "",
    phone: "",
    secretary_id: null as number | null,
    school_id: null as number | null,
    class_id: null as number | null,
  });

  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const [secretaries, setSecretaries] = useState<SecretaryApiResponse[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [openPopover, setOpenPopover] = useState({ secretary: false, school: false, class: false });
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => checkPasswordStrength(userData.password), [userData.password]);

  useEffect(() => {
    setProfileData((prev) => ({ ...prev, role: "", secretary_id: null, school_id: null, class_id: null }));
    setClasses([]);
    const fetchSelectData = async () => {
      if (selectedUserType === "responsible") {
        try {
          const data = await getSecretariesForSelect();
          setSecretaries(data);
        } catch {
          toast.error("Falha ao carregar secretarias.");
        }
      }
      if (selectedUserType === "student" || selectedUserType === "teacher") {
        try {
          const data = await getSchools();
          setSchools(data);
        } catch {
          toast.error("Falha ao carregar escolas.");
        }
      }
    };
    if (selectedUserType) fetchSelectData();
  }, [selectedUserType]);

  useEffect(() => {
    setProfileData((prev) => ({ ...prev, class_id: null }));
    setClasses([]);
    if (profileData.school_id) {
      const fetchClasses = async () => {
        try {
          const schoolData = await getSchoolById(profileData.school_id!);
          setClasses(schoolData.classes || []);
        } catch {
          toast.error("Falha ao carregar as turmas da escola selecionada.");
        }
      };
      fetchClasses();
    }
  }, [profileData.school_id]);

  const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      setEmailTouched(true);
      if (value && !isValidEmail(value)) setEmailError("Formato de e-mail inválido.");
      else setEmailError(null);
    }
  };

  const handleProfileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof typeof profileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setUserData((prev) => ({ ...prev, password: newPassword }));
    setConfirmPassword(newPassword);
    toast.success("Nova senha segura gerada!");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserType) { toast.warning("Por favor, selecione um tipo de usuário."); return; }
    if (userData.email !== confirmEmail || !isValidEmail(userData.email)) { toast.error("Verifique os campos de e-mail."); return; }
    if (userData.password !== confirmPassword || passwordStrength.score < 4) { toast.error("A senha não é válida ou não coincide."); return; }

    setIsLoading(true);

    try {
      switch (selectedUserType) {
        case "premium":
        case "responsible":
          await createResponsibleUser({
            user: { email: userData.email, password: userData.password, user_type: selectedUserType === 'premium' ? userLevel : 'responsible_secretary', status: true },
            responsible: { name: profileData.name, role: profileData.role, phone: profileData.phone, secretary_id: profileData.secretary_id },
          });
          break;
        case "teacher":
          await createTeacher({
            email: userData.email,
            password: userData.password,
            name: profileData.name,
            phone: profileData.phone,
            school_id: profileData.school_id!,
          });
          break;
        case "student":
          // MODIFICAÇÃO: Encontra o nome da turma e envia como string.
          const selectedClassName = classes.find(c => c.id === profileData.class_id)?.name;
          if (!selectedClassName) {
            toast.error("Por favor, selecione uma turma válida.");
            setIsLoading(false);
            return;
          }
          await createStudent({
            email: userData.email,
            password: userData.password,
            name: profileData.name,
            school_id: profileData.school_id!,
            turma: selectedClassName, // Envia o NOME da turma, não o ID
          });
          break;
        default:
          throw new Error("Tipo de usuário inválido.");
      }
      toast.success("Usuário criado com sucesso!");
      router.push("/admin/users");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleOptions = useMemo(() => {
    if (selectedUserType === "premium") return adminRoleOptions;
    if (selectedUserType === "responsible") return secretaryRoleOptions;
    return [];
  }, [selectedUserType]);

  const cardAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <main className="flex flex-1 flex-col p-4 md:p-8 bg-background min-h-screen">
      <div className="mx-auto w-full ">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{userId ? "Editar Usuário" : "Cadastrar Novo Usuário"}</h1>
            <p className="text-muted-foreground">Siga os passos para criar um novo acesso ao sistema.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 grid gap-4">
            <Label htmlFor="userType" className="font-semibold text-lg">Passo 1: Tipo de Usuário</Label>
            <Select onValueChange={(value: UserType) => setSelectedUserType(value)} value={selectedUserType} required>
              <SelectTrigger id="userType"><SelectValue placeholder="Selecione o tipo de usuário..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">Premium Editora</SelectItem>
                <SelectItem value="responsible">Responsável de Secretaria</SelectItem>
                <SelectItem value="teacher">Professor</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence>
            {selectedUserType && (
              <motion.div key="userDataStep" variants={cardAnimation} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 grid gap-6">
                <h3 className="font-semibold text-lg">Passo 2: Dados de Acesso e Perfil</h3>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" value={profileData.name} onChange={handleProfileInputChange} required />
                </div>
                {selectedUserType !== "student" && (
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" type="tel" value={profileData.phone} onChange={handleProfileInputChange} placeholder="(99) 99999-9999" />
                  </div>
                )}
                {(selectedUserType === "premium" || selectedUserType === "responsible") && (
                  <div className="grid gap-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Select onValueChange={(value) => handleSelectChange("role", value)} value={profileData.role} required>
                      <SelectTrigger id="role"><SelectValue placeholder="Selecione o cargo..." /></SelectTrigger>
                      <SelectContent>
                        {currentRoleOptions.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedUserType === "responsible" && (
                  <div className="grid gap-2">
                    <Label>Secretaria Vinculada</Label>
                    <Popover open={openPopover.secretary} onOpenChange={(v) => setOpenPopover((p) => ({ ...p, secretary: v }))}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {secretaries.find((s) => s.id === profileData.secretary_id)?.name || "Selecione..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar secretaria..." />
                          <CommandList><CommandEmpty>Nenhuma secretaria.</CommandEmpty><CommandGroup>
                            {secretaries.map((s) => (
                              <CommandItem key={s.id} value={s.name} onSelect={() => { handleSelectChange("secretary_id", s.id); setOpenPopover((p) => ({ ...p, secretary: false })); }}>
                                <Check className={`mr-2 h-4 w-4 ${profileData.secretary_id === s.id ? "opacity-100" : "opacity-0"}`} />{s.name}
                              </CommandItem>
                            ))}
                          </CommandGroup></CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {(selectedUserType === "student" || selectedUserType === "teacher") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="grid gap-2">
                      <Label>Escola</Label>
                      <Popover open={openPopover.school} onOpenChange={(v) => setOpenPopover((p) => ({ ...p, school: v }))}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between">
                            {schools.find((s) => s.id === profileData.school_id)?.name || "Selecione a escola..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar escola..." />
                            <CommandList><CommandEmpty>Nenhuma escola.</CommandEmpty><CommandGroup>
                              {schools.map((s) => (
                                <CommandItem key={s.id} value={s.name} onSelect={() => { handleSelectChange("school_id", s.id); setOpenPopover((p) => ({ ...p, school: false })); }}>
                                  <Check className={`mr-2 h-4 w-4 ${profileData.school_id === s.id ? "opacity-100" : "opacity-0"}`} />{s.name}
                                </CommandItem>
                              ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label>Turma</Label>
                      <Popover open={openPopover.class} onOpenChange={(v) => setOpenPopover((p) => ({ ...p, class: v }))}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" disabled={!profileData.school_id || classes.length === 0} className="w-full justify-between">
                            {classes.find((c) => c.id === profileData.class_id)?.name || "Selecione a turma..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar turma..." />
                            <CommandList><CommandEmpty>Nenhuma turma.</CommandEmpty><CommandGroup>
                              {classes.map((c) => (
                                <CommandItem key={c.id} value={c.name} onSelect={() => { handleSelectChange("class_id", c.id); setOpenPopover((p) => ({ ...p, class: false })); }}>
                                  <Check className={`mr-2 h-4 w-4 ${profileData.class_id === c.id ? "opacity-100" : "opacity-0"}`} />{c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-4 border-t">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <div className="relative">
                      <Input id="email" name="email" type="email" value={userData.email} onChange={handleUserInputChange} onBlur={() => setEmailTouched(true)} required className={`pr-10 ${emailTouched && emailError ? "border-red-500" : emailTouched && !emailError && userData.email ? "border-green-500" : ""}`} />
                      {emailTouched && userData.email && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          {emailError ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                      )}
                    </div>
                    <div className="h-5"><p className="text-xs text-red-500">{emailTouched && emailError}</p></div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmEmail">Confirmar E-mail</Label>
                    <Input id="confirmEmail" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required />
                    <div className="h-5">{confirmEmail && userData.email !== confirmEmail && (<p className="text-xs text-red-500">Os e-mails não coincidem.</p>)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-x-6 gap-y-6">
                  <PasswordInput value={userData.password} onChange={handleUserInputChange} onGenerate={handleGeneratePassword} />
                  <div className="grid gap-2 pt-1">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full w-10" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="h-5">{confirmPassword && userData.password !== confirmPassword && (<p className="text-xs text-red-500">As senhas não coincidem.</p>)}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !selectedUserType}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}