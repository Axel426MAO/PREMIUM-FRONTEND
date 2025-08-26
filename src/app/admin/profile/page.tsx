"use client";

import { useUserStore } from "@/app/store/userStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Building,
  School,
  Phone,
  Calendar,
  KeyRound,
  Edit,
  Briefcase,
  CheckCircle2,
  XCircle,
  Info, // --- CORREÇÃO: Adicionado o ícone 'Info' ---
} from "lucide-react";
import React from "react";

// --- COMPONENTE AUXILIAR PARA EXIBIR DETALHES ---
const ProfileDetail = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <Icon
      className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0"
      aria-hidden="true"
    />
    <div className="flex flex-col">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-md font-semibold text-foreground">
        {value || (
          <span className="font-normal italic text-muted-foreground/80">
            Não informado
          </span>
        )}
      </p>
    </div>
  </div>
);

// --- FUNÇÕES DE FORMATAÇÃO ---
const getInitials = (name: string = ""): string => {
  const names = name.split(" ");
  if (names.length === 1 && names[0] === "") return "U";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (
    names[0].charAt(0) + names[names.length - 1].charAt(0)
  ).toUpperCase();
};

const formatUserType = (userType: string): string => {
  const types: { [key: string]: string } = {
    admin: "Administrador",
    responsible_secretary: "Responsável de Secretaria",
    responsible_school: "Responsável de Escola",
    teacher: "Professor(a)",
    student: "Aluno(a)",
  };
  return types[userType] || "Usuário";
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function ProfilePage() {
  const { user } = useUserStore();

  // Exibe um estado de carregamento se os dados do usuário ainda não estiverem disponíveis
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <p>Carregando perfil...</p>
      </main>
    );
  }

  const { responsible, email, user_type, createdAt} = user;
  const { name, role, phone, whatsapp, secretary, school } = responsible || {};

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Meu Perfil
      </h1>

      {/* Card Principal com Avatar e Resumo */}
      <Card>
        <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24">
            <AvatarImage src="/placeholder-avatar.jpg" alt={name || "Avatar"} />
            <AvatarFallback className="text-3xl">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{name}</CardTitle>
            <CardDescription className="mt-1">{email}</CardDescription>
            <Badge variant="outline" className="mt-2">
              {formatUserType(user_type)}
            </Badge>
          </div>
          {/* <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Button> */}
        </CardHeader>
      </Card>

      {/* Card com Detalhes da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Conta</CardTitle>
          <CardDescription>
            Suas informações pessoais, de contato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Seção de Dados Pessoais */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-foreground">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ProfileDetail
                icon={User}
                label="Nome Completo"
                value={name}
              />
              <ProfileDetail icon={Briefcase} label="Cargo" value={role} />
            </div>
          </div>

          {/* Seção de Contato */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-foreground">
              Contato
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ProfileDetail icon={Mail} label="E-mail" value={email} />
              <ProfileDetail
                icon={Phone}
                label="Telefone"
                value={phone || whatsapp}
              />
            </div>
          </div>

     
          
          {/* Seção de Informações da Conta */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-foreground">
              Informações da Conta
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ProfileDetail
                icon={Calendar}
                label="Data de Cadastro"
                value={new Date(createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
            
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}