// Local: /app/admin/license-batches/form/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getBooks,
  getSecretaries,
  getSchools,
  createLicenseBatch,
  Book,
  Secretary,
  School,
} from "../services/api";

// Imports for the Combobox embutido
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
} from "@/components/ui/command";
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomerType = "secretary" | "private_school";

export default function LicenseBatchCreationForm() {
  const router = useRouter();

  // Estados para os dados dos dropdowns
  const [books, setBooks] = useState<Book[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  // Estados do formulário
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Estados de controle dos Popovers
  const [isBookPopoverOpen, setIsBookPopoverOpen] = useState(false);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

  // Estados de controle de envio
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError("Falha ao carregar dados para o formulário.");
      }
    }
    fetchData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBook || !customerType || !selectedCustomer || quantity <= 0) {
      setError("Todos os campos são obrigatórios.");
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
      // Idealmente, você usaria um sistema de toast aqui para notificar o sucesso
      router.push("/admin/licenses");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col justify-center items-start bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 md:p-8">
      {/* Card principal feito com div e classes Tailwind */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {"Adicionar Novo Lote"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados para cadastrar uma nova escola no sistema.
          </p>
        </div>
      </div>

      <div className="w-full  bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        {/* Cabeçalho do Card */}
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Criar Novo Lote de Licenças
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Preencha os detalhes abaixo para gerar um novo lote.
          </p>
        </div>
        {/* Conteúdo do Card */}
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- Dropdown de Livros --- */}
            <div className="space-y-2">
              <Label htmlFor="book">Selecione o Livro</Label>
              <Popover
                open={isBookPopoverOpen}
                onOpenChange={setIsBookPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isBookPopoverOpen}
                    className="w-full justify-between"
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
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* --- Seleção de Tipo de Cliente --- */}
            <div className="space-y-2">
              <Label> Selecione o Tipo de Cliente</Label>
              <RadioGroup
                value={customerType || ""}
                onValueChange={(value: CustomerType) => {
                  setCustomerType(value);
                  setSelectedCustomer("");
                }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="secretary" id="secretary" />
                  <Label htmlFor="secretary">Secretaria</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private_school" id="private_school" />
                  <Label htmlFor="private_school">Escola Privada</Label>
                </div>
              </RadioGroup>
            </div>

            {/* --- Dropdown de Clientes (Condicional) --- */}
            {customerType && (
              <div className="space-y-2">
                <Label htmlFor="customer">Selecione o Cliente</Label>
                <Popover
                  open={isCustomerPopoverOpen}
                  onOpenChange={setIsCustomerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCustomerPopoverOpen}
                      className="w-full justify-between"
                    >
                      {selectedCustomer
                        ? (customerType === "secretary"
                            ? secretaryOptions
                            : privateSchoolOptions
                          ).find((c) => c.value === selectedCustomer)?.label
                        : `Selecione uma ${
                            customerType === "secretary"
                              ? "secretaria"
                              : "escola"
                          }...`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {(customerType === "secretary"
                          ? secretaryOptions
                          : privateSchoolOptions
                        ).map((option) => (
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
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* --- Campo de Quantidade --- */}
            <div className="space-y-2">
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

            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-500">
                {error}
              </p>
            )}

            <Button type="submit" className="w-50" disabled={isLoading}>
              {isLoading ? "Criando Lote..." : "Criar Lote de Licenças"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
