// app/admin/schools/form/page.tsx
"use client";

import React, { useState, useMemo, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- API ---
import {
  createFullSchoolWorkflow,
  getSecretariesForSelect,
  type FullSchoolCreationPayload,
  type SecretarySelectItem,
} from "../services/api";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// --- Icons ---
import { Building2, MapPin, UserCircle, CheckCircle, Loader2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";

// --- COMPONENTE PRINCIPAL ---
export default function SchoolFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("id"); // Para futuras edições

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FullSchoolCreationPayload>({
    school: { name: "", is_private: true, secretary_id: null },
    address: { street: "", number: "", neighborhood: "", city: "", state: "", cep: "" },
    responsible: { name: "", role: "Diretor(a)", whatsapp: "", phone: "" },
    user: { email: "", password: "", user_type: "responsible_school" },
  });
  
  const [secretaries, setSecretaries] = useState<SecretarySelectItem[]>([]);
  const [openSecretaryPopover, setOpenSecretaryPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Busca as secretarias quando o componente é montado
  useEffect(() => {
    setIsLoading(true);
    getSecretariesForSelect()
      .then(setSecretaries)
      .catch((err) => toast.error("Erro ao buscar secretarias: " + err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const steps = useMemo(() => [
    { id: 1, name: "Escola", icon: <Building2 className="h-5 w-5" /> },
    { id: 2, name: "Endereço", icon: <MapPin className="h-5 w-5" /> },
    { id: 3, name: "Acesso", icon: <UserCircle className="h-5 w-5" /> },
    { id: 4, name: "Revisão", icon: <CheckCircle className="h-5 w-5" /> },
  ], []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.') as [keyof FullSchoolCreationPayload, string];

    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSwitchChange = (isPrivate: boolean) => {
    setFormData((prev) => ({
      ...prev,
      school: {
        ...prev.school,
        is_private: isPrivate,
        // Limpa o ID da secretaria se a escola for marcada como privada
        secretary_id: isPrivate ? null : prev.school.secretary_id,
      },
    }));
  };
  
  const handleSecretarySelect = (secretaryId: number) => {
    setFormData((prev) => ({
        ...prev,
        school: { ...prev.school, secretary_id: secretaryId }
    }));
    setOpenSecretaryPopover(false);
  }

  const nextStep = () => currentStep < steps.length && setCurrentStep(currentStep + 1);
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
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-slate-50 min-h-screen">
      <div className="w-full  mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {schoolId ? "Editar Escola" : "Adicionar Nova Escola"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados para cadastrar uma nova escola no sistema.
            </p>
          </div>
        </div>
        
        {/* Stepper */}
        <div className="mb-8 mt-8">
            <div className="relative">
              <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-slate-200">
                <motion.div className="h-full bg-slate-800" animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
              <div className="relative flex justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center text-center gap-2 w-20">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all duration-300 ${currentStep >= step.id ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${currentStep >= step.id ? "text-slate-800" : "text-slate-500"}`}>{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Formulário */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
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
                    <div className="space-y-6">
                      <div className="grid gap-2">
                        <Label htmlFor="school.name">Nome da Escola</Label>
                        <Input id="school.name" name="school.name" value={formData.school.name} onChange={handleInputChange} required />
                      </div>
                      <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 bg-slate-50">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Escola Privada</p>
                          <p className="text-sm text-slate-500">Marque se for uma instituição de ensino privada.</p>
                        </div>
                        <Switch id="school.is_private" checked={formData.school.is_private} onCheckedChange={handleSwitchChange} />
                      </div>
                      {!formData.school.is_private && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                          <div className="grid gap-2">
                            <Label>Secretaria Vinculada (Obrigatório para escolas públicas)</Label>
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
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Etapa 2: Endereço */}
                  {currentStep === 2 && (
                     <div className="space-y-6">
                       <div className="grid sm:grid-cols-4 gap-4">
                         <div className="grid gap-2 sm:col-span-3">
                           <Label htmlFor="address.street">Rua / Avenida</Label>
                           <Input id="address.street" name="address.street" value={formData.address.street} onChange={handleInputChange} required />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="address.number">Número</Label>
                           <Input id="address.number" name="address.number" value={formData.address.number} onChange={handleInputChange} />
                         </div>
                       </div>
                       <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="grid gap-2">
                           <Label htmlFor="address.neighborhood">Bairro</Label>
                           <Input id="address.neighborhood" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleInputChange} required />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="address.city">Cidade</Label>
                           <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleInputChange} required />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="address.state">Estado (UF)</Label>
                           <Input id="address.state" name="address.state" value={formData.address.state} onChange={handleInputChange} required maxLength={2}/>
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="address.cep">CEP</Label>
                           <Input id="address.cep" name="address.cep" value={formData.address.cep} onChange={handleInputChange} required />
                         </div>
                       </div>
                     </div>
                  )}
                  
                  {/* Etapa 3: Acesso */}
                  {currentStep === 3 && (
                     <div className="space-y-6">
                       <h3 className="text-lg font-medium border-b pb-2">Dados do Responsável Principal</h3>
                       <div className="grid sm:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                           <Label htmlFor="responsible.name">Nome do Responsável</Label>
                           <Input id="responsible.name" name="responsible.name" value={formData.responsible.name} onChange={handleInputChange} required />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="responsible.role">Cargo</Label>
                           <Input id="responsible.role" name="responsible.role" value={formData.responsible.role} onChange={handleInputChange} required />
                         </div>
                       </div>
                       
                       <h3 className="text-lg font-medium border-b pb-2 pt-4">Credenciais de Acesso</h3>
                       <div className="grid sm:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                           <Label htmlFor="user.email">E-mail de Acesso</Label>
                           <Input id="user.email" name="user.email" type="email" value={formData.user.email} onChange={handleInputChange} required />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="user.password">Senha de Acesso</Label>
                           <Input id="user.password" name="user.password" type="password" value={formData.user.password} onChange={handleInputChange} required />
                         </div>
                       </div>
                     </div>
                  )}

                  {/* Etapa 4: Revisão */}
                  {currentStep === 4 && (
                     <div className="space-y-6">
                       <h3 className="text-xl font-semibold text-slate-800">Revise as Informações</h3>
                       <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm">
                         <p><strong>Escola:</strong> {formData.school.name || 'Não preenchido'}</p>
                         <p><strong>Tipo:</strong> {formData.school.is_private ? 'Privada' : 'Pública'}</p>
                         {!formData.school.is_private && <p><strong>Secretaria:</strong> {secretaries.find(s=>s.id === formData.school.secretary_id)?.name || 'Nenhuma'}</p>}
                         <p><strong>Endereço:</strong> {`${formData.address.street}, ${formData.address.number}` || 'Não preenchido'}</p>
                         <p><strong>Responsável:</strong> {formData.responsible.name || 'Não preenchido'} ({formData.user.email || 'N/A'})</p>
                       </div>
                       <p className="text-xs text-slate-500 text-center">Ao clicar em "Salvar Escola", você confirma que todas as informações estão corretas.</p>
                     </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </fieldset>

            {/* Navegação do Formulário */}
            <div className="mt-8 pt-6 border-t flex justify-between items-center">
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading || currentStep === 1}>Anterior</Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep} disabled={isLoading}>Próximo</Button>
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