// Local: /app/admin/license-batches/form/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // ADICIONADO: Importação do Sonner

// Imports de Componentes (shadcn/ui)
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// Imports de Ícones (lucide-react)
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";

// Funções e Tipos
import {
  getBooks,
  getSecretaries,
  getSchools,
  createLicenseBatch,
  Book,
  Secretary,
  School,
} from "../services/api";
import { cn } from "@/lib/utils";

type CustomerType = "secretary" | "private_school";

export default function LicenseBatchCreationForm() {
  const router = useRouter();

  // Estados dos dados e do formulário (sem alterações)
  const [books, setBooks] = useState<Book[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isBookPopoverOpen, setIsBookPopoverOpen] = useState(false);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // REMOVIDO: O estado de erro não é mais necessário, pois será tratado pelo toast.
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [booksData, secretariesData, schoolsData] = await Promise.all([
          getBooks(),
          getSecretaries(),
          getSchools(),
        ]);
        setBooks(booksData);
        setSecretaries(secretariesData);
        setSchools(schoolsData);
      } catch (err) {
        // ALTERADO: Usa toast para erro no carregamento inicial
        toast.error("Falha ao carregar os dados do formulário.", {
          description: "Por favor, recarregue a página para tentar novamente.",
        });
      }
    }
    fetchData();
  }, []);

  // useMemo hooks (sem alterações)
  const privateSchools = useMemo(
    () => schools.filter((school) => school.is_private),
    [schools]
  );
  const bookOptions = useMemo(
    () => books.map((b) => ({ value: b.id.toString(), label: b.title })),
    [books]
  );
  const secretaryOptions = useMemo(
    () => secretaries.map((s) => ({ value: s.id.toString(), label: s.name })),
    [secretaries]
  );
  const privateSchoolOptions = useMemo(
    () =>
      privateSchools.map((s) => ({ value: s.id.toString(), label: s.name })),
    [privateSchools]
  );
  const customerOptions = useMemo(() => {
    if (customerType === "secretary") return secretaryOptions;
    if (customerType === "private_school") return privateSchoolOptions;
    return [];
  }, [customerType, secretaryOptions, privateSchoolOptions]);


  // ALTERADO: Função handleSubmit agora usa toast para feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBook || !customerType || !selectedCustomer || quantity <= 0) {
      toast.error("Formulário incompleto", {
        description: "Todos os campos são obrigatórios. Verifique os dados e tente novamente.",
      });
      return;
    }

    setIsLoading(true);
    const payload = {
      book_id: parseInt(selectedBook),
      quantity,
      ...(customerType === "secretary" && {
        secretary_id: parseInt(selectedCustomer),
      }),
      ...(customerType === "private_school" && {
        school_id: parseInt(selectedCustomer),
      }),
    };

    try {
      await createLicenseBatch(payload);
      toast.success("Lote de licenças criado com sucesso!");
      router.push("/admin/licenses");
    } catch (err) {
      toast.error("Falha ao criar o lote", {
        description: (err as Error).message || "Ocorreu um erro desconhecido. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 space-y-8 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Criar Novo Lote de Licenças
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha os detalhes abaixo para gerar um novo lote de licenças.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Detalhes do Lote</CardTitle>
            <CardDescription>
              Selecione o livro, o tipo de cliente, o cliente específico e a
              quantidade de licenças.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* O conteúdo do formulário (grid, inputs, etc.) permanece o mesmo */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
              {/* --- Campo de Livro --- */}
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="book">Livro</Label>
                <Popover
                  open={isBookPopoverOpen}
                  onOpenChange={setIsBookPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isBookPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedBook
                        ? bookOptions.find((b) => b.value === selectedBook)?.label
                        : "Selecione um livro..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar livro..." />
                      <CommandList>
                        <CommandEmpty>Nenhum livro encontrado.</CommandEmpty>
                        <CommandGroup>
                          {bookOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                setSelectedBook(
                                  currentValue === selectedBook ? "" : currentValue
                                );
                                setIsBookPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedBook === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* --- Campo de Quantidade --- */}
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="quantity">Quantidade de Licenças</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Ex: 1000"
                />
              </div>

              {/* --- Seleção de Tipo de Cliente --- */}
              <div className="space-y-2 md:col-span-6">
                <Label>Tipo de Cliente</Label>
                <RadioGroup
                  value={customerType || ""}
                  onValueChange={(value: CustomerType) => {
                    setCustomerType(value);
                    setSelectedCustomer(""); // Reseta o cliente ao trocar o tipo
                  }}
                  className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secretary" id="secretary" />
                    <Label htmlFor="secretary" className="font-normal">
                      Secretaria de Educação
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private_school" id="private_school" />
                    <Label htmlFor="private_school" className="font-normal">
                      Escola Privada
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* --- Dropdown de Clientes (Condicional) --- */}
              {customerType && (
                <div className="space-y-2 md:col-span-6">
                  <Label htmlFor="customer">
                    {customerType === "secretary" ? "Secretaria" : "Escola"}
                  </Label>
                  <Popover
                    open={isCustomerPopoverOpen}
                    onOpenChange={setIsCustomerPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={customerOptions.length === 0}
                      >
                        {selectedCustomer
                          ? customerOptions.find(
                              (c) => c.value === selectedCustomer
                            )?.label
                          : `Selecione uma ${
                              customerType === "secretary" ? "secretaria" : "escola"
                            }...`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {customerOptions.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={(currentValue) => {
                                  setSelectedCustomer(
                                    currentValue === selectedCustomer
                                      ? ""
                                      : currentValue
                                  );
                                  setIsCustomerPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCustomer === option.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {option.label}
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
          </CardContent>
          {/* REMOVIDO: O CardFooter agora só contém o botão, sem o Alert */}
          <CardFooter className="border-t pt-6 mt-6">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Lote...
                </>
              ) : (
                "Criar Lote de Licenças"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}