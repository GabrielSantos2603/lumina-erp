import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { HourlyRateCalculator } from "./calculators/HourlyRateCalculator";
import { SqmCalculator } from "./calculators/SqmCalculator";
import { ProjectCalculator } from "./calculators/ProjectCalculator";

interface CalculatorsTabProps {
  hourlyCalc: any;
  setHourlyCalc: (calc: any) => void;
  sqmCalc: any;
  setSqmCalc: (calc: any) => void;
  projectCalc: any;
  setProjectCalc: (calc: any) => void;
  calculateHourlyRate: () => any;
  calculateSqmPrice: () => any;
  calculateProjectTotal: () => any;
}

export function CalculatorsTab({
  hourlyCalc,
  setHourlyCalc,
  sqmCalc,
  setSqmCalc,
  projectCalc,
  setProjectCalc,
  calculateHourlyRate,
  calculateSqmPrice,
  calculateProjectTotal,
}: CalculatorsTabProps) {
  const [selectedCalculator, setSelectedCalculator] = useState<
    "hourly" | "sqm" | "project" | null
  >(null);

  // Se uma calculadora estiver selecionada, renderiza ela
  if (selectedCalculator === "hourly") {
    return (
      <HourlyRateCalculator
        hourlyCalc={hourlyCalc}
        setHourlyCalc={setHourlyCalc}
        calculateHourlyRate={calculateHourlyRate}
        onBack={() => setSelectedCalculator(null)}
      />
    );
  }

  if (selectedCalculator === "sqm") {
    return (
      <SqmCalculator
        sqmCalc={sqmCalc}
        setSqmCalc={setSqmCalc}
        calculateSqmPrice={calculateSqmPrice}
        onBack={() => setSelectedCalculator(null)}
      />
    );
  }

  if (selectedCalculator === "project") {
    return (
      <ProjectCalculator
        projectCalc={projectCalc}
        setProjectCalc={setProjectCalc}
        calculateProjectTotal={calculateProjectTotal}
        onBack={() => setSelectedCalculator(null)}
      />
    );
  }

  // Tela de seleção das calculadoras
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-lumina-500 to-purple-600 text-white mb-4">
          <Calculator className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Calculadoras Profissionais</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ferramentas desenvolvidas especialmente para arquitetas e designers. 
          Calcule seus preços de forma profissional e competitiva no mercado.
        </p>
      </div>

      {/* Grid de Calculadoras */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {/* Calculadora de Valor/Hora */}
        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-lumina-500 hover:-translate-y-1 group"
          onClick={() => setSelectedCalculator("hourly")}
        >
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-lumina-100 to-purple-100 dark:from-lumina-900/30 dark:to-purple-900/30 group-hover:from-lumina-200 group-hover:to-purple-200 transition-all duration-300">
                <Calculator className="h-8 w-8 text-lumina-600 dark:text-lumina-400" />
              </div>
            </div>
            <CardTitle className="text-xl mb-2">Calculadora de Valor/Hora</CardTitle>
            <Badge variant="secondary" className="mb-3">
              7 Etapas Completas
            </Badge>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Método profissional completo que considera todos os custos operacionais, 
              impostos, softwares e margem de lucro para definir seu valor ideal.
            </p>
            
            <div className="space-y-2 mb-6 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-lumina-500 rounded-full"></div>
                <span>Custos fixos e variáveis</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-lumina-500 rounded-full"></div>
                <span>Software e ferramentas</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-lumina-500 rounded-full"></div>
                <span>Impostos e encargos</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-lumina-500 rounded-full"></div>
                <span>Margem de lucro personalizada</span>
              </div>
            </div>
            
            <div className="bg-lumina-50 dark:bg-lumina-950/30 rounded-lg p-3 text-lumina-700 dark:text-lumina-300 text-sm font-medium">
              ✨ Mais Completo
            </div>
          </CardContent>
        </Card>

        {/* Calculadora de Preço por m² */}
        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-green-500 hover:-translate-y-1 group"
          onClick={() => setSelectedCalculator("sqm")}
        >
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-xl mb-2">Preço por m²</CardTitle>
            <Badge variant="secondary" className="mb-3">
              Rápido e Prático
            </Badge>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Calcule o valor do projeto baseado na área, tipo de projeto e 
              complexidade. Ideal para orçamentos rápidos e cotações.
            </p>
            
            <div className="space-y-2 mb-6 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Área do projeto</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Tipo de projeto</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Nível de complexidade</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Acompanhamento opcional</span>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-green-700 dark:text-green-300 text-sm font-medium">
              ⚡ Mais Rápido
            </div>
          </CardContent>
        </Card>

        {/* Calculadora de Projeto Completo */}
        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-blue-500 hover:-translate-y-1 group"
          onClick={() => setSelectedCalculator("project")}
        >
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-xl mb-2">Projeto Completo</CardTitle>
            <Badge variant="secondary" className="mb-3">
              Mais Detalhado
            </Badge>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Orçamento completo incluindo mão de obra, consultorias técnicas, 
              materiais, apresentações e legalização.
            </p>
            
            <div className="space-y-2 mb-6 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Horas de trabalho</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Consultorias técnicas</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Materiais e impressões</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Documentação legal</span>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-blue-700 dark:text-blue-300 text-sm font-medium">
              📊 Mais Detalhado
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Dicas */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                💡 Quando usar cada calculadora?
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-orange-800 dark:text-orange-200">
                <div>
                  <strong className="text-lumina-700 dark:text-lumina-300">Valor/Hora:</strong> 
                  <br />Ideal para serviços de consultoria, projetos sem área definida ou quando você trabalha por demanda.
                </div>
                <div>
                  <strong className="text-green-700 dark:text-green-300">Preço por m²:</strong> 
                  <br />Perfeito para projetos com área bem definida e escopo claro de trabalho.
                </div>
                <div>
                  <strong className="text-blue-700 dark:text-blue-300">Projeto Completo:</strong> 
                  <br />Use para orçamentos detalhados que incluem toda a cadeia de fornecedores e serviços.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Benefícios */}
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-center">
        <div className="p-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✅</span>
          </div>
          <h4 className="font-semibold mb-2">Preços Competitivos</h4>
          <p className="text-sm text-muted-foreground">
            Calcule preços justos que cobrem todos os seus custos e garantem lucro adequado.
          </p>
        </div>
        <div className="p-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <h4 className="font-semibold mb-2">Método Profissional</h4>
          <p className="text-sm text-muted-foreground">
            Baseado nas melhores práticas do mercado de arquitetura e design.
          </p>
        </div>
        <div className="p-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⚡</span>
          </div>
          <h4 className="font-semibold mb-2">Agilidade</h4>
          <p className="text-sm text-muted-foreground">
            Gere orçamentos profissionais em minutos, não em horas.
          </p>
        </div>
      </div>
    </div>
  );
}