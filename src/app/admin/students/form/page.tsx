"use client";

import React, { useState, useMemo, useEffect, type ChangeEvent, type FormEvent, type FC } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

// --- UI Components ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Icons ---
import { ArrowLeft, Loader2, Eye, EyeOff, RefreshCw, XCircle, CheckCircle, ChevronsUpDown, Check, PlusCircle } from "lucide-react";

// --- API & Types ---
import { createStudent, getSchools,  SchoolApiResponse,  type StudentCreationPayload } from "../services/api";
import { Class, createClass } from "../../schools/services/api";

// --- UTILITÁRIOS E CONSTANTES ---
type PasswordStrength = {
  score: number;
  criteria: {
    length: boolean; uppercase: boolean; lowercase: boolean; number: boolean; specialChar: boolean;
  };
};
const passwordCriteria = [
  { id: "length", text: "Pelo menos 8 caracteres" }, { id: "uppercase", text: "Uma letra maiúscula" },
  { id: "lowercase", text: "Uma letra minúscula" }, { id: "number", text: "Um número" },
  { id: "specialChar", text: "Um caractere especial (!@#...)" },
];
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const checkPasswordStrength = (password: string): PasswordStrength => {
  const criteria = {
    length: password.length >= 8, uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password), number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  return { score, criteria };
};
const generateStrongPassword = (): string => {
  const allChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = Array(4).fill(0).map((_, i) => {
    const sets = ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "!@#$%^&*()_+-=[]{}|;:,.<>?"];
    return sets[i][Math.floor(Math.random() * sets[i].length)];
  }).join('');
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password.split("").sort(() => 0.5 - Math.random()).join("");
};

// --- COMPONENTE DE SENHA ---
const PasswordInput: FC<{ value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; onGenerate: () => void; }> = ({ value, onChange, onGenerate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = useMemo(() => checkPasswordStrength(value), [value]);
  const strengthColor = strength.score <= 2 ? "bg-red-500" : strength.score <= 4 ? "bg-yellow-500" : "bg-green-500";
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
            {passwordCriteria.map((c) => {
              const isMet = strength.criteria[c.id as keyof PasswordStrength["criteria"]];
              return (<li key={c.id} className={`flex items-center transition-colors ${isMet ? "text-green-600" : "text-muted-foreground"}`}>
                {isMet ? <CheckCircle className="h-3 w-3 mr-2 shrink-0" /> : <XCircle className="h-3 w-3 mr-2 shrink-0" />} {c.text}
              </li>);
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DO FORMULÁRIO ---
export default function StudentFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<StudentCreationPayload>({
    name: "", email: "", password: "", school_id: 0, turma: "", idade: 0, phone: "", whatsapp: ""
  });
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [schools, setSchools] = useState<SchoolApiResponse[]>([]);
  const [openSchoolPopover, setOpenSchoolPopover] = useState(false);

  // Estados para gerenciamento de turmas
  const [selectedSchoolClasses, setSelectedSchoolClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [isClassLoading, setIsClassLoading] = useState(false);

  const passwordStrength = useMemo(() => checkPasswordStrength(formData.password || ""), [formData.password]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsData = await getSchools();
        setSchools(schoolsData);
      } catch (error) {
        toast.error("Não foi possível carregar a lista de escolas.");
        console.error(error);
      }
    };
    fetchSchools();
  }, []);

  // Efeito para atualizar as turmas quando uma escola é selecionada
  useEffect(() => {
    const school = schools.find(s => s.id === formData.school_id);
    if (school) {
      setSelectedSchoolClasses(school.classes || []);
      // Reseta a turma selecionada para evitar inconsistência
      setFormData(prev => ({ ...prev, turma: "" }));
    } else {
      setSelectedSchoolClasses([]);
    }
  }, [formData.school_id, schools]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setFormData(prev => ({ ...prev, password: newPassword }));
    setConfirmPassword(newPassword);
    toast.success("Nova senha segura gerada!");
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      toast.warning("O nome da turma não pode ser vazio.");
      return;
    }
    if (!formData.school_id) {
        toast.error("Selecione uma escola primeiro.");
        return;
    }

    setIsClassLoading(true);
    try {
      const newClass = await createClass(formData.school_id, newClassName.trim());
      // Atualiza a lista de turmas da escola selecionada
      setSelectedSchoolClasses(prev => [...prev, newClass]);
      // Atualiza a lista de escolas principal para manter os dados consistentes
      setSchools(prevSchools => prevSchools.map(s =>
        s.id === formData.school_id
          ? { ...s, classes: [...s.classes, newClass] }
          : s
      ));
      setNewClassName("");
      toast.success(`Turma "${newClass.name}" criada com sucesso!`);
    } catch (error) {
      toast.error((error as Error).message || "Falha ao criar turma.");
    } finally {
      setIsClassLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(formData.email)) { toast.error("O formato do e-mail é inválido."); return; }
    if (formData.email !== confirmEmail) { toast.error("Os e-mails não coincidem."); return; }
    if (passwordStrength.score < 4) { toast.error("A senha não atende aos critérios de segurança."); return; }
    if (formData.password !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    if (formData.name.length < 3) { toast.error("O nome deve ter pelo menos 3 caracteres."); return; }
    if (!formData.school_id || formData.school_id <= 0) { toast.error("Selecione uma escola válida."); return; }
    if (!formData.turma) { toast.error("Selecione uma turma para o aluno."); return; }

    setIsLoading(true);
    const toastId = toast.loading("Criando aluno...");

    try {
      await createStudent(formData);
      toast.success("Aluno criado com sucesso!", { id: toastId });
      router.push("/admin/students");
      router.refresh();
    } catch (error) {
      const errorMessage = (error as Error).message || "Ocorreu um erro desconhecido.";
      toast.error(errorMessage, { id: toastId });
      console.error("Erro ao criar aluno:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSchoolName = useMemo(() => {
    return schools.find(school => school.id === formData.school_id)?.name;
  }, [schools, formData.school_id]);


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criar Novo Aluno</h1>
          <p className="text-muted-foreground">Preencha os detalhes abaixo para cadastrar um novo aluno.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Aluno</CardTitle>
          <CardDescription>Os dados de acesso serão usados para o login do aluno na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo do Aluno</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school_id">Escola</Label>
                <Popover open={openSchoolPopover} onOpenChange={setOpenSchoolPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openSchoolPopover} className="w-full justify-between font-normal">
                      {selectedSchoolName || "Selecione uma escola..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar escola..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
                        <CommandGroup>
                          {schools.map((school) => (
                            <CommandItem
                              key={school.id}
                              value={school.name}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, school_id: school.id }));
                                setOpenSchoolPopover(false);
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${formData.school_id === school.id ? "opacity-100" : "opacity-0"}`} />
                              {school.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-semibold">Dados de Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de Acesso</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="aluno@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirmar E-mail</Label>
                  <Input id="confirmEmail" name="confirmEmail" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="Repita o e-mail" />
                  {confirmEmail && formData.email !== confirmEmail && <p className="text-xs text-red-500">Os e-mails não coincidem.</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-x-6 gap-y-6">
                <PasswordInput value={formData.password || ""} onChange={handleChange} onGenerate={handleGeneratePassword} />
                <div className="grid gap-2 pt-1">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {confirmPassword && formData.password !== confirmPassword && <p className="text-xs text-red-500">As senhas não coincidem.</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-semibold">Informações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* --- SEÇÃO DE TURMA MODIFICADA --- */}
                <div className="space-y-2">
                  <Label>Turma</Label>
                  {formData.school_id ? (
                    <div className="p-4 border rounded-md space-y-4 bg-background/50">
                      {selectedSchoolClasses.length > 0 ? (
                        <RadioGroup
                          value={formData.turma}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, turma: value }))}
                          className="max-h-32 overflow-y-auto pr-2"
                        >
                          <p className="text-sm font-medium mb-2 text-muted-foreground">Selecione uma turma existente:</p>
                          {selectedSchoolClasses.map(c => (
                            <div key={c.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={c.name} id={`class-${c.id}`} />
                              <Label htmlFor={`class-${c.id}`} className="font-normal cursor-pointer">{c.name}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhuma turma cadastrada. 
                        </p>
                      )}
                      
                  
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full p-4 border rounded-md border-dashed">
                       <p className="text-sm text-muted-foreground">Selecione uma escola para ver as turmas.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idade">Idade (Opcional)</Label>
                  <Input id="idade" name="idade" type="number" value={formData.idade || ''} onChange={handleChange} placeholder="Ex: 10" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Salvando..." : "Salvar Aluno"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}