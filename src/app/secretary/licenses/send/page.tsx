"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";
import { toast } from "sonner";

// Componentes da UI (Shadcn)
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

// Ícones
import { ArrowLeft, Check, ChevronsUpDown, XIcon } from "lucide-react";

// Funções da API e Tipos
import {
  getBatchesForDistribution,
  sendFractionedBatchToSchool,
  type LicenseBatchToDistribute,
  type School,
} from "../services/api";
import { cn } from "@/lib/utils";
import { getSchoolsBySecretaryId } from "../../schools/services/api";

type DistributionMode = "manual" | "intelligent";

export default function SendLicenseBatchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();

  // Estados de dados
  const [sourceBatches, setSourceBatches] = useState<
    LicenseBatchToDistribute[]
  >([]);
  const [schools, setSchools] = useState<School[]>([]);

  // Estados do formulário
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [mode, setMode] = useState<DistributionMode>("manual");
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [manualQuantities, setManualQuantities] = useState<
    Record<number, number>
  >({});
  const [intelligentTotal, setIntelligentTotal] = useState<number>(0);

  // Estados de UI e controle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBatchPopoverOpen, setIsBatchPopoverOpen] = useState(false);
  const [isSchoolPopoverOpen, setIsSchoolPopoverOpen] = useState(false);

  // Carregar dados iniciais (lotes e escolas da secretaria)
  useEffect(() => {
    async function fetchData() {
      if (!user?.responsible?.secretary?.id) {
        setError("ID da secretaria do usuário não encontrado.");
        return;
      }
      try {
        const secretaryId = user.responsible.secretary.id;
        const [batchesData, schoolsData] = await Promise.all([
          getBatchesForDistribution(secretaryId),
          getSchoolsBySecretaryId(secretaryId),
        ]);
        setSourceBatches(batchesData);
        setSchools(schoolsData);
      } catch (err) {
        setError("Falha ao carregar dados para o formulário.");
        toast.error("Erro ao carregar dados.");
      }
    }
    fetchData();
  }, [user]);

  // useEffect para pré-selecionar o lote da URL
  useEffect(() => {
    const batchIdFromUrl = searchParams.get("batchId");
    if (batchIdFromUrl && sourceBatches.length > 0) {
      const batchExists = sourceBatches.some(
        (b) => b.id.toString() === batchIdFromUrl
      );
      if (batchExists) {
        setSelectedBatchId(batchIdFromUrl);
      }
    }
  }, [sourceBatches, searchParams]);

  // Memos para otimizar cálculos
  const selectedBatch = useMemo(
    () => sourceBatches.find((b) => b.id.toString() === selectedBatchId),
    [sourceBatches, selectedBatchId]
  );

  // --- CÓDIGO CORRIGIDO AQUI ---
  const availableLicenses = useMemo(() => {
    // Se não houver lote selecionado, não há licenças.
    if (!selectedBatch) {
      return 0;
    }

    // A quantidade de licenças disponíveis é simplesmente
    // o valor 'quantity' do lote pai, que o backend já mantém atualizado.
    return selectedBatch.quantity;
  }, [selectedBatch]);
  // --- FIM DA CORREÇÃO ---

  // Handlers
  const handleSchoolToggle = (school: School) => {
    setSelectedSchools((prev) => {
      const isSelected = prev.some((s) => s.id === school.id);
      if (isSelected) {
        const newQuantities = { ...manualQuantities };
        delete newQuantities[school.id];
        setManualQuantities(newQuantities);
        return prev.filter((s) => s.id !== school.id);
      } else {
        return [...prev, school];
      }
    });
  };

  const handleManualQuantityChange = (schoolId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setManualQuantities((prev) => ({
      ...prev,
      [schoolId]: quantity,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!selectedBatchId) {
      setError("É necessário selecionar um lote de origem.");
      return;
    }
    if (selectedSchools.length === 0) {
      setError("Selecione pelo menos uma escola.");
      return;
    }

    let distributions: { schoolId: number; quantity: number }[] = [];

    if (mode === "manual") {
      const totalManual = selectedSchools.reduce(
        (sum, school) => sum + (manualQuantities[school.id] || 0),
        0
      );
      if (totalManual > availableLicenses) {
        setError(
          `A soma das quantidades (${totalManual}) excede as licenças disponíveis (${availableLicenses}).`
        );
        return;
      }
      if (selectedSchools.some((s) => (manualQuantities[s.id] || 0) <= 0)) {
        setError(
          "Todas as escolas selecionadas devem ter quantidade maior que zero."
        );
        return;
      }
      distributions = selectedSchools.map((s) => ({
        schoolId: s.id,
        quantity: manualQuantities[s.id],
      }));
    } else {
      // Modo Inteligente
      if (intelligentTotal <= 0) {
        setError("A quantidade total deve ser maior que zero.");
        return;
      }
      if (intelligentTotal > availableLicenses) {
        setError(
          `A quantidade total (${intelligentTotal}) excede as licenças disponíveis (${availableLicenses}).`
        );
        return;
      }
      if (intelligentTotal % selectedSchools.length !== 0) {
        setError(
          `A quantidade total (${intelligentTotal}) não pode ser dividida igualmente por ${selectedSchools.length} escolas.`
        );
        return;
      }
      const quantityPerSchool = intelligentTotal / selectedSchools.length;
      distributions = selectedSchools.map((s) => ({
        schoolId: s.id,
        quantity: quantityPerSchool,
      }));
    }

    setIsLoading(true);
    const toastId = toast.loading("Enviando licenças...");

    try {
      await Promise.all(
        distributions.map((dist) =>
          sendFractionedBatchToSchool(parseInt(selectedBatchId), {
            school_id: dist.schoolId,
            quantity: dist.quantity,
          })
        )
      );

      toast.success("Licenças enviadas com sucesso para todas as escolas!", {
        id: toastId,
      });
      router.push("/secretary/licenses");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(`Falha no envio: ${message}`);
      toast.error(`Falha no envio: ${message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col justify-start items-start p-4 sm:p-6 md:p-8">
      {/* Cabeçalho com botão de voltar */}
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
            Enviar Licenças para Escolas
          </h1>
          <p className="text-muted-foreground mt-1">
            Distribua licenças de um lote existente para as escolas da sua rede.
          </p>
        </div>
      </div>

      {/* Card do Formulário */}
      <div className="w-full max-w-4xl bg-card border rounded-xl shadow-sm">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Seleção do Lote de Origem */}
            <div className="space-y-2">
              <Label htmlFor="batch" className="text-lg font-semibold">
                Passo 1: Selecione o Lote de Origem
              </Label>
              <Popover
                open={isBatchPopoverOpen}
                onOpenChange={setIsBatchPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedBatch
                      ? `${selectedBatch.book.title} (ID: ${selectedBatch.id})`
                      : "Selecione um lote..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar lote..." />
                    <CommandEmpty>Nenhum lote encontrado.</CommandEmpty>
                    <CommandGroup>
                      {sourceBatches.map((batch) => (
                        <CommandItem
                          key={batch.id}
                          value={batch.id.toString()}
                          onSelect={(currentValue) => {
                            setSelectedBatchId(
                              currentValue === selectedBatchId
                                ? ""
                                : currentValue
                            );
                            setIsBatchPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBatchId === batch.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {batch.book.title} (ID: {batch.id})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedBatch && (
                <p className="text-sm text-muted-foreground pt-1">
                  Licenças disponíveis neste lote:{" "}
                  <span className="font-bold text-primary">
                    {availableLicenses}
                  </span>
                </p>
              )}
            </div>

            {/* Renderiza o resto do form apenas se um lote for selecionado */}
            {selectedBatchId && (
              <>
                {/* 2. Modo de Distribuição */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">
                    Passo 2: Escolha o Modo de Envio
                  </Label>
                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => setMode(v as DistributionMode)}
                    className="flex items-center gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Envio Manual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intelligent" id="intelligent" />
                      <Label htmlFor="intelligent">Envio Inteligente</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* 3. Seleção de Escolas */}
                <div className="space-y-2">
                  <Label htmlFor="schools" className="text-lg font-semibold">
                    Passo 3: Selecione as Escolas
                  </Label>
                  <Popover
                    open={isSchoolPopoverOpen}
                    onOpenChange={setIsSchoolPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedSchools.length > 0
                          ? `${selectedSchools.length} escola(s) selecionada(s)`
                          : "Selecione as escolas..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar escola..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhuma escola encontrada.
                          </CommandEmpty>
                          <CommandGroup>
                            {schools.map((school) => (
                              <CommandItem
                                key={school.id}
                                value={school.name}
                                onSelect={() => handleSchoolToggle(school)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSchools.some(
                                      (s) => s.id === school.id
                                    )
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {school.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedSchools.map((school) => (
                      <Badge key={school.id} variant="secondary">
                        {school.name}
                        <button
                          type="button"
                          className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => handleSchoolToggle(school)}
                        >
                          <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 4. Definição de Quantidades (Condicional) */}
                {selectedSchools.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">
                      Passo 4: Defina as Quantidades
                    </Label>
                    {mode === "manual" ? (
                      <div className="space-y-4 pt-2">
                        {selectedSchools.map((school) => (
                          <div
                            key={school.id}
                            className="flex items-center gap-4"
                          >
                            <Label
                              htmlFor={`qty-${school.id}`}
                              className="w-1/2"
                            >
                              {school.name}
                            </Label>
                            <Input
                              id={`qty-${school.id}`}
                              type="number"
                              min="1"
                              value={manualQuantities[school.id] || ""}
                              onChange={(e) =>
                                handleManualQuantityChange(
                                  school.id,
                                  e.target.value
                                )
                              }
                              placeholder="Qtde."
                              className="w-1/2"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pt-2">
                        <Label htmlFor="total-qty">
                          Quantidade Total a Distribuir
                        </Label>
                        <Input
                          id="total-qty"
                          type="number"
                          min="1"
                          value={intelligentTotal || ""}
                          onChange={(e) =>
                            setIntelligentTotal(parseInt(e.target.value) || 0)
                          }
                          placeholder="Ex: 1000"
                        />
                        <p className="text-sm text-muted-foreground pt-1">
                          Cada uma das {selectedSchools.length} escolas receberá{" "}
                          <span className="font-bold text-primary">
                            {intelligentTotal > 0 &&
                            selectedSchools.length > 0 &&
                            intelligentTotal % selectedSchools.length === 0
                              ? intelligentTotal / selectedSchools.length
                              : 0}
                          </span>{" "}
                          licenças.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Erros e Botão de Envio */}
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isLoading || !selectedBatchId}
            >
              {isLoading ? "Enviando..." : "Enviar Licenças"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
