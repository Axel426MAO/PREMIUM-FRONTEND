"use client";

import React, { useState, useMemo, type FC, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- IMPORTAÇÕES DA API ---
import { createFullSecretaryWorkflow, type FullSecretaryCreationPayload } from "../services/api";

// --- IMPORTAÇÕES DOS COMPONENTES DA UI (shadcn/ui) ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// --- IMPORTAÇÕES DOS ÍCONES (lucide-react) ---
import { Building, MapPin, UserCircle, CheckCircle, Loader2, ArrowLeft, Mail, Phone, Lock, Home, User } from "lucide-react";

// --- TIPOS LOCAIS ---
type Step = {
  id: number;
  name: string;
  icon: React.ReactNode;
};

// --- COMPONENTE AUXILIAR PARA A TELA DE REVISÃO ---
const ReviewCard: FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="rounded-xl border bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b bg-slate-50/50 p-4">
      {icon}
      <h4 className="text-md font-semibold text-slate-800">{title}</h4>
    </div>
    <div className="p-4 space-y-2 text-sm text-slate-600">
      {children}
    </div>
  </div>
);

const ReviewItem: FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center">
    <span className="font-semibold text-slate-800 w-28 shrink-0">{label}:</span>
    <span className="break-words">{value || <span className="text-slate-400">Não preenchido</span>}</span>
  </div>
);


// --- COMPONENTE PRINCIPAL ---
const SecretaryFormPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const secretaryId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FullSecretaryCreationPayload>({
    secretary: { name: "", is_state_level: false, municipality: "", state: "" },
    address: { street: "", number: "", neighborhood: "", city: "", state: "", cep: "" },
    responsible: { name: "", role: "", whatsapp: "", phone: "" },
    user: { email: "", password: "", user_type: "default_user" },
  });

  const [isLoading, setIsLoading] = useState(false);

  const steps: Step[] = useMemo(() => [
    { id: 1, name: "Dados", icon: <Building className="h-5 w-5" /> },
    { id: 2, name: "Endereço", icon: <MapPin className="h-5 w-5" /> },
    { id: 3, name: "Acesso", icon: <UserCircle className="h-5 w-5" /> },
    { id: 4, name: "Revisão", icon: <CheckCircle className="h-5 w-5" /> },
  ], []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.') as [keyof FullSecretaryCreationPayload, string];

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      secretary: {
        ...prev.secretary,
        is_state_level: checked,
        municipality: checked ? "" : prev.secretary.municipality,
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Salvando informações...");

    try {
      await createFullSecretaryWorkflow(formData);
      toast.success("Secretaria cadastrada com sucesso!", { id: toastId });
      setTimeout(() => {
        router.push("/admin/secretary");
      }, 1500);
    } catch (err) {
      toast.error((err as Error).message || "Ocorreu um erro desconhecido.", { id: toastId });
      setIsLoading(false);
    }
  };

  const slideAnimation = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-slate-50 min-h-screen">
      <div className="w-full  mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0 h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {secretaryId ? "Editar Secretaria" : "Adicionar Nova Secretaria"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Siga as etapas para cadastrar uma nova entidade no sistema.
            </p>
          </div>
        </div>
        
        <div className="mb-8 mt-8">
            <div className="relative">
              <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-slate-200">
                <motion.div className="h-full bg-slate-800" animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
              <div className="relative flex justify-between">
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center text-center gap-2 w-16 sm:w-20">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all duration-300 ${currentStep >= step.id ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                    </div>
                    {/* Oculta o texto em telas pequenas para não quebrar o layout */}
                    <span className={`hidden sm:block text-xs font-medium ${currentStep >= step.id ? "text-slate-800" : "text-slate-500"}`}>{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border">
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
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor="secretary.name">Nome da Secretaria</Label>
                          <Input id="secretary.name" name="secretary.name" value={formData.secretary.name} onChange={handleInputChange} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="secretary.state">Estado (UF)</Label>
                          <Input id="secretary.state" name="secretary.state" value={formData.secretary.state} onChange={handleInputChange} required maxLength={2} placeholder="Ex: AM" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 bg-slate-50/50">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">Secretaria de Nível Estadual</p>
                          <p className="text-sm text-slate-500">Marque esta opção se for uma secretaria estadual.</p>
                        </div>
                        <Switch id="secretary.is_state_level" checked={formData.secretary.is_state_level} onCheckedChange={handleSwitchChange} />
                      </div>
                      {!formData.secretary.is_state_level && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                          <div className="grid gap-2">
                            <Label htmlFor="secretary.municipality">Município</Label>
                            <Input id="secretary.municipality" name="secretary.municipality" value={formData.secretary.municipality || ''} onChange={handleInputChange} required={!formData.secretary.is_state_level} disabled={formData.secretary.is_state_level} />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="grid gap-2 sm:col-span-3">
                          <Label htmlFor="address.street">Rua / Avenida</Label>
                          <Input id="address.street" name="address.street" value={formData.address.street} onChange={handleInputChange} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="address.number">Número</Label>
                          <Input id="address.number" name="address.number" value={formData.address.number} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="address.neighborhood">Bairro</Label>
                          <Input id="address.neighborhood" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleInputChange} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="address.city">Cidade</Label>
                          <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleInputChange} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="address.cep">CEP</Label>
                          <Input id="address.cep" name="address.cep" value={formData.address.cep} onChange={handleInputChange} required />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                     <div className="space-y-6">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                           <Label htmlFor="responsible.name">Nome do Responsável</Label>
                           <Input id="responsible.name" name="responsible.name" value={formData.responsible.name} onChange={handleInputChange} required />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="responsible.role">Cargo</Label>
                           <Input id="responsible.role" name="responsible.role" value={formData.responsible.role} onChange={handleInputChange} required />
                         </div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                           <Label htmlFor="responsible.phone">Telefone</Label>
                           <Input id="responsible.phone" name="responsible.phone" value={formData.responsible.phone} onChange={handleInputChange} placeholder="(92) 9..." />
                         </div>
                         <div className="grid gap-2">
                           <Label htmlFor="responsible.whatsapp">WhatsApp</Label>
                           <Input id="responsible.whatsapp" name="responsible.whatsapp" value={formData.responsible.whatsapp} onChange={handleInputChange} placeholder="(92) 9..." />
                         </div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6 mt-2">
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

                  {currentStep === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-slate-800 text-center md:text-left">Revise as Informações</h3>
                        <div className="space-y-4">
                            <ReviewCard title="Dados da Secretaria" icon={<Building className="h-5 w-5 text-slate-600" />}>
                                <ReviewItem label="Nome" value={formData.secretary.name} />
                                <ReviewItem label="Nível" value={formData.secretary.is_state_level ? 'Estadual' : 'Municipal'} />
                                {!formData.secretary.is_state_level && (
                                    <ReviewItem label="Município" value={formData.secretary.municipality} />
                                )}
                                <ReviewItem label="Estado (UF)" value={formData.secretary.state.toUpperCase()} />
                            </ReviewCard>

                            <ReviewCard title="Endereço" icon={<Home className="h-5 w-5 text-slate-600" />}>
                                <ReviewItem label="Logradouro" value={`${formData.address.street}, ${formData.address.number || 's/n'}`} />
                                <ReviewItem label="Bairro" value={formData.address.neighborhood} />
                                <ReviewItem label="Cidade" value={formData.address.city} />
                                <ReviewItem label="CEP" value={formData.address.cep} />
                            </ReviewCard>

                            <ReviewCard title="Responsável e Acesso" icon={<User className="h-5 w-5 text-slate-600" />}>
                                <ReviewItem label="Nome" value={formData.responsible.name} />
                                <ReviewItem label="Cargo" value={formData.responsible.role} />
                                <ReviewItem label="Contato" value={`${formData.responsible.phone || 'N/A'} (Tel) / ${formData.responsible.whatsapp || 'N/A'} (Wpp)`} />
                                <ReviewItem label="E-mail" value={formData.user.email} />
                            </ReviewCard>
                        </div>
                         <p className="text-xs text-slate-500 text-center !mt-8">Ao clicar em "Salvar Secretaria", você confirma que todas as informações estão corretas.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </fieldset>

            <div className="mt-8 pt-6 border-t flex justify-between items-center">
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading || currentStep === 1}>
                Anterior
              </Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep} disabled={isLoading}>
                  Próximo
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isLoading} size="lg">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Salvando..." : "Salvar Secretaria"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default SecretaryFormPage;