// src/components/features/UserProfileCardPureTailwind.tsx
"use client";

import React, { useState, useEffect, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  User, Mail, Phone, Calendar, Briefcase, Building, School as SchoolIcon,
  FilePenLine, Camera, Loader2, X as CloseIcon,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// =================================================================
//  API HELPERS (Atualizado com getFiles)
// =================================================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL_WITHOUTH_SUFIX;

interface ApiFile {
    id: number;
    reference_table: string;
    reference_id: number;
    name: string;
    file_path: string;
    created_at: string;
}

export const getFiles = async (reference_table: string, reference_id: number): Promise<ApiFile[]> => {
    const response = await fetch(`${API_BASE_URL}/files/${reference_table}/${reference_id}`);
    if (!response.ok) throw new Error('Falha ao buscar arquivos.');
    return response.json();
}

export const uploadFile = async (file: File, reference_table: string, reference_id: number): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reference_table', reference_table);
    formData.append('reference_id', String(reference_id));
    const response = await fetch(`${API_BASE_URL}/files`, { method: 'POST', body: formData });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Falha ao enviar arquivo.'); }
    return response.json();
};
export const updateUser = async (id: number, userData: { email: string; password?: string }) => {
  const payload = { ...userData };
  if (!payload.password) { delete payload.password; }
  const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Falha ao atualizar dados de acesso.'); }
  return response.json();
};
export const updateResponsible = async (id: number, responsibleData: { name: string; role: string; phone?: string; whatsapp?: string }) => {
  const response = await fetch(`${API_BASE_URL}/responsibles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(responsibleData) });
  if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Falha ao atualizar dados do responsável.'); }
  return response.json();
};

// =================================================================
//  TIPAGEM E FUNÇÕES AUXILIARES
// =================================================================
type UserProfile = { id: number; email: string; user_type: string; createdAt: string; responsible?: { id: number; name?: string; role?: string; phone?: string; whatsapp?: string; secretary?: { name?: string }; school?: { name?: string }; }; };
type FormData = { name: string; role: string; phone: string; whatsapp: string; email: string; password?: string; };
const isImageFile = (fileName: string): boolean => { return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName); };
const getInitials = (name?: string): string => { if (!name) return "U"; const n = name.split(" ").filter(Boolean); if (n.length === 0) return "U"; if (n.length === 1) return n[0].charAt(0).toUpperCase(); return (n[0].charAt(0) + n[n.length - 1].charAt(0)).toUpperCase(); };
const formatUserType = (userType: string): string => { const t: { [k: string]: string } = { admin: "Administrador", responsible_secretary: "Responsável de Secretaria", responsible_school: "Responsável de Escola", teacher: "Professor(a)", student: "Aluno(a)" }; return t[userType] || "Usuário"; };

// =================================================================
//  SUB-COMPONENTES (REUTILIZÁVEIS E EDITÁVEIS)
// =================================================================
const EditableProfileDetailItem = ({ icon: Icon, label, value, name, isEditing, onChange, }: { icon: React.ElementType; label: string; value?: string | null; name: keyof FormData; isEditing: boolean; onChange: (e: ChangeEvent<HTMLInputElement>) => void; }) => ( <div className="flex items-start gap-4"><div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 shadow dark:bg-gray-800"><Icon className="text-gray-500 dark:text-gray-400" /></div><div className="w-full"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>{isEditing ? (<input type={name === "password" ? "password" : "text"} name={name} value={value || ""} onChange={onChange} placeholder={name === "password" ? "Deixe em branco para não alterar" : label} className="mt-1 w-full rounded-md border-gray-300 bg-gray-50 p-2 text-base font-semibold text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100" />) : (<p className="text-base font-semibold text-gray-900 dark:text-gray-100">{value || <span className="font-normal italic text-gray-400 dark:text-gray-500">Não informado</span>}</p>)}</div></div> );
const AvatarUploader = ({ src, alt, fallback, isEditing, onFileSelect, previewUrl, }: { src?: string | null; alt: string; fallback: React.ReactNode; isEditing: boolean; onFileSelect: (file: File | null) => void; previewUrl?: string | null; }) => { const [imageError, setImageError] = useState(false); const fileInputRef = React.useRef<HTMLInputElement>(null); const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; onFileSelect(file || null); }; const finalSrc = previewUrl || src; useEffect(() => { if (src) { setImageError(false); } }, [src]); return ( <div className="relative"><div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full">{!imageError && finalSrc ? (<img src={finalSrc} alt={alt} className="aspect-square h-full w-full object-cover" onError={() => setImageError(true)} />) : (<div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">{fallback}</div>)}</div>{isEditing && (<><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" /><button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-white transition-colors hover:bg-gray-700 dark:border-gray-950"><Camera className="h-4 w-4" /></button></>)}</div> ); };

// =================================================================
//  COMPONENTE PRINCIPAL (COM LÓGICA DE EDIÇÃO)
// =================================================================
export const UserProfileCard = ({ user }: { user: UserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: "", role: "", phone: "", whatsapp: "", email: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // <-- Estado para a foto da API

  // Efeito para buscar a foto de perfil existente
  useEffect(() => {
    if (user?.id) {
        const fetchAvatar = async () => {
            try {
                const files = await getFiles('users', user.id);
                const imageFile = files.find(file => isImageFile(file.name));
                if (imageFile) {
                    setAvatarUrl(new URL(imageFile.file_path, API_DOMAIN).href);
                }
            } catch (error) {
                console.warn("Nenhuma foto de perfil encontrada ou falha ao buscar:", error);
                setAvatarUrl(null);
            }
        };
        fetchAvatar();
    }
  }, [user]);

  // Inicializa o formulário com os dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.responsible?.name || "",
        role: user.responsible?.role || "",
        phone: user.responsible?.phone || "",
        whatsapp: user.responsible?.whatsapp || "",
        email: user.email || "",
        password: "",
      });
    }
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };
  
  const handleCancel = () => {
    // ... (lógica de cancelar permanece a mesma)
    if (user) { setFormData({ name: user.responsible?.name || "", role: user.responsible?.role || "", phone: user.responsible?.phone || "", whatsapp: user.responsible?.whatsapp || "", email: user.email || "", password: "", }); }
    setSelectedFile(null); setPreviewUrl(null); setIsEditing(false);
  };
  
  const handleSave = async () => {
    // ... (lógica de salvar permanece a mesma)
    if (!user || !user.responsible) { toast.error("Dados de usuário ou responsável ausentes para salvar."); return; } setIsLoading(true); const toastId = toast.loading("Salvando alterações..."); try { const promises = []; const responsiblePayload = { name: formData.name, role: formData.role, phone: formData.phone, whatsapp: formData.whatsapp, }; promises.push(updateResponsible(user.responsible.id, responsiblePayload)); const userPayload = { email: formData.email, password: formData.password, }; promises.push(updateUser(user.id, userPayload)); if (selectedFile) { promises.push(uploadFile(selectedFile, 'users', user.id)); } await Promise.all(promises); toast.success("Perfil atualizado com sucesso!", { id: toastId }); setIsEditing(false); window.location.reload(); } catch (error) { toast.error((error as Error).message || "Ocorreu um erro desconhecido.", { id: toastId }); console.error("Erro ao salvar perfil:", error); } finally { setIsLoading(false); }
  };

  if (!user) {
    return <div className="w-full max-w-4xl mx-auto rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800"><h2 className="text-xl font-bold">Erro</h2><p className="text-sm">Dados do usuário não disponíveis.</p></div>;
  }

  const { responsible, user_type, createdAt } = user;
  const { secretary, school } = responsible || {};

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      {/* HEADER */}
      <div className="p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visualize e gerencie suas informações.</p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}><CloseIcon className="mr-2 h-4 w-4" />Cancelar</Button>
                <Button onClick={handleSave} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePenLine className="mr-2 h-4 w-4" />}Salvar</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}><FilePenLine className="mr-2 h-4 w-4" />Editar Perfil</Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 pt-0">
        <div className="flex flex-col items-center gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row">
          <AvatarUploader
            src={avatarUrl} // <-- Usa a URL da API
            alt={formData.name || "Avatar"}
            fallback={<span className="text-3xl font-medium text-gray-600 dark:text-gray-300">{getInitials(formData.name)}</span>}
            isEditing={isEditing}
            onFileSelect={handleFileSelect}
            previewUrl={previewUrl} // <-- O preview sobrepõe a imagem da API
          />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formData.name || "Usuário"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-50">
              {formatUserType(user_type)}
            </span>
          </div>
        </div>

        <div className="pt-6 space-y-6">
          {/* Seção Dados Pessoais */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Dados Pessoais & Contato</h3>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              <EditableProfileDetailItem icon={User} label="Nome Completo" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
              <EditableProfileDetailItem icon={Mail} label="E-mail" name="email" value={formData.email} isEditing={isEditing} onChange={handleInputChange} />
              <EditableProfileDetailItem icon={Briefcase} label="Cargo" name="role" value={formData.role} isEditing={isEditing} onChange={handleInputChange} />
              <EditableProfileDetailItem icon={Phone} label="Telefone" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleInputChange} />
            </div>
          </div>
          
          {/* Seção Vínculo Institucional */}
          {(secretary?.name || school?.name) && (
             <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Vínculo Institucional</h3>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    {secretary?.name && <EditableProfileDetailItem icon={Building} label="Secretaria" name="name" value={secretary.name} isEditing={false} onChange={()=>{}} />}
                    {school?.name && <EditableProfileDetailItem icon={SchoolIcon} label="Escola" name="name" value={school.name} isEditing={false} onChange={()=>{}} />}
                </div>
            </div>
          )}

           {/* Seção Informações da Conta (senha) */}
           <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Informações da Conta</h3>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <EditableProfileDetailItem icon={Calendar} label="Membro desde" name="name" value={new Date(createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} isEditing={false} onChange={()=>{}} />
                    {isEditing && <EditableProfileDetailItem icon={Lock} label="Nova Senha" name="password" value={formData.password} isEditing={isEditing} onChange={handleInputChange} />}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};