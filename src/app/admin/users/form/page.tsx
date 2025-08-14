"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import {
  getSecretariesForSelect,
  createResponsibleUser, // Usaremos esta função para ambos os casos
} from "../services/formApi";
import type { SecretaryApiResponse } from "../../secretary/services/api";

type UserType = "premium" | "responsible" | "student" | "teacher";
type UserLevel = "super_admin" | "admin";

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
    // MODIFICAÇÃO: Iniciar com null para clareza
    secretary_id: null as number | null,
  });

  const [secretaries, setSecretaries] = useState<SecretaryApiResponse[]>([]);
  const [openSecretaryPopover, setOpenSecretaryPopover] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Esta lógica continua a mesma, pois só buscamos secretarias para o tipo 'responsible'
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
    setIsLoading(true);
    setError(null);

    if (selectedUserType === "premium" || selectedUserType === "responsible") {
      try {
        const userPayload = {
          ...userData,
          // Define o tipo de usuário corretamente
          user_type: selectedUserType === "premium" ? userLevel : "responsible_secretary",
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

        router.push("/admin/users");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Lógica para outros tipos de usuário (student, teacher) se necessário no futuro
      setError("Tipo de usuário selecionado não é válido para criação.");
      setIsLoading(false);
    }
  };

  const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponsibleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResponsibleData((prev) => ({ ...prev, [name]: value }));
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
          {/* Passo 1: Seleção de Tipo (Sem alterações) */}
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
                <SelectItem value="student" disabled>
                  Responsável de Escola (Em breve)
                </SelectItem>
                <SelectItem value="student" disabled>
                  Aluno (Em breve)
                </SelectItem>
                <SelectItem value="teacher" disabled>
                  Professor (Em breve)
                </SelectItem>
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
                  <Label htmlFor="email">E-mail de Acesso</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userData.email}
                    onChange={handleUserInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={userData.password}
                    onChange={handleUserInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* MODIFICAÇÃO: Dados do responsável agora aparecem para ambos */}
                <div className="border-t pt-6 grid gap-6">
                  <h3 className="font-semibold text-lg">
                    Dados do Responsável
                  </h3>
                  <div className="grid gap-2">
                    <Label htmlFor="responsibleName">
                      Nome Completo do Responsável
                    </Label>
                    <Input
                      id="responsibleName"
                      name="name"
                      value={responsibleData.name}
                      onChange={handleResponsibleInputChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="responsibleRole">Cargo</Label>
                    <Input
                      id="responsibleRole"
                      name="role"
                      value={responsibleData.role}
                      onChange={handleResponsibleInputChange}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* MODIFICAÇÃO: Campo de Secretaria só aparece para 'responsible' */}
                  {selectedUserType === "responsible" && (
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
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-center text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}

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
