import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  Building2,
  DollarSign,
  Users,
  Settings,
  TrendingUp,
  FileText,
  Info,
  Download,
  Target
} from "lucide-react";

interface HourlyRateCalculatorProps {
  hourlyCalc: any;
  setHourlyCalc: (calc: any) => void;
  calculateHourlyRate: () => any;
  onBack: () => void;
}

export function HourlyRateCalculator({
  hourlyCalc,
  setHourlyCalc,
  onBack,
}: HourlyRateCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  const updateField = (field: string, value: string | number) => {
    setHourlyCalc((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Cálculo do valor-hora com fórmula profissional
  const calculateProfessionalHourlyRate = () => {
    // Custos Fixos Mensais
    const fixedCosts = 
      (parseFloat(hourlyCalc.rent) || 0) +
      (parseFloat(hourlyCalc.internet) || 0) +
      (parseFloat(hourlyCalc.utilities) || 0) +
      (parseFloat(hourlyCalc.insurance) || 0) +
      (parseFloat(hourlyCalc.phone) || 0) +
      (parseFloat(hourlyCalc.accounting) || 0) +
      (parseFloat(hourlyCalc.marketing) || 0) +
      (parseFloat(hourlyCalc.officeSupplies) || 0);

    // Folha de Pagamento Total (com encargos)
    const payrollCosts = 
      (parseFloat(hourlyCalc.ownerSalary) || 0) +
      (parseFloat(hourlyCalc.employeesSalary) || 0) +
      (parseFloat(hourlyCalc.thirteenthSalary) || 0) +
      (parseFloat(hourlyCalc.vacation) || 0) +
      (parseFloat(hourlyCalc.benefits) || 0) +
      (parseFloat(hourlyCalc.socialCharges) || 0);

    // Software e Ferramentas
    const softwareCosts =
      (parseFloat(hourlyCalc.adobe) || 0) +
      (parseFloat(hourlyCalc.autocad) || 0) +
      (parseFloat(hourlyCalc.sketchup) || 0) +
      (parseFloat(hourlyCalc.revit) || 0) +
      (parseFloat(hourlyCalc.promob) || 0) +
      (parseFloat(hourlyCalc.otherSoftware) || 0);

    // Depreciação de Equipamentos
    const depreciationCosts = (parseFloat(hourlyCalc.equipmentDepreciation) || 0);

    // Custos Totais Mensais
    const totalMonthlyCost = fixedCosts + payrollCosts + softwareCosts + depreciationCosts;

    // Horas Produtivas por Mês (CORRIGIDO)
    const totalTeamHours = (parseFloat(hourlyCalc.totalTeamHours) || 176); // 22 dias x 8h
    const utilizationRate = (parseFloat(hourlyCalc.utilizationRate) || 85) / 100; // Aumentado de 70% para 85%
    const productiveHours = totalTeamHours * utilizationRate;

    // Custo por Hora Base
    const baseCostPerHour = productiveHours > 0 ? totalMonthlyCost / productiveHours : 0;

    // Fator de Inadimplência (AUMENTADO)
    const defaultRisk = (parseFloat(hourlyCalc.defaultRisk) || 8) / 100; // Aumentado de 2% para 8%
    const costWithRisk = baseCostPerHour / (1 - defaultRisk);

    // Aplicar Margem de Lucro (AUMENTADA)
    const profitMargin = (parseFloat(hourlyCalc.profitMargin) || 45) / 100; // Aumentado de 30% para 45%
    const priceWithProfit = costWithRisk * (1 + profitMargin);

    // Multiplicador de Mercado (NOVO - para competitividade)
    const marketMultiplier = 1.35; // Fator adicional para alinhamento com mercado
    const marketAdjustedPrice = priceWithProfit * marketMultiplier;

    // Aplicar Impostos sobre Faturamento (CORRIGIDO)
    const taxRate = (parseFloat(hourlyCalc.taxRate) || 15) / 100; // Aumentado de 6% para 15% (mais realista)
    const finalHourlyRate = marketAdjustedPrice / (1 - taxRate);

    return {
      fixedCosts,
      payrollCosts,
      softwareCosts,
      depreciationCosts,
      totalMonthlyCost,
      totalTeamHours,
      utilizationRate: utilizationRate * 100, // Para exibir como %
      productiveHours,
      baseCostPerHour,
      costWithRisk,
      priceWithProfit,
      marketMultiplier,
      marketAdjustedPrice,
      finalHourlyRate,
      monthlyRevenue: finalHourlyRate * productiveHours,
      monthlyProfit: (finalHourlyRate * productiveHours) - totalMonthlyCost,
      
      // Indicadores adicionais
      dailyRate: finalHourlyRate * 8,
      weeklyRate: finalHourlyRate * 40,
      costPerHour: baseCostPerHour, // Mantém compatibilidade
      priceBeforeTaxes: marketAdjustedPrice, // Mantém compatibilidade
      
      // Análise de mercado
      marketComparison: {
        junior: finalHourlyRate * 0.6,
        pleno: finalHourlyRate,
        senior: finalHourlyRate * 1.3,
        expert: finalHourlyRate * 1.6
      }
    };
  };

  const result = calculateProfessionalHourlyRate();

  const steps = [
    { number: 1, title: "Perfil da Empresa", icon: Building2 },
    { number: 2, title: "Custos Fixos", icon: DollarSign },
    { number: 3, title: "Folha & Encargos", icon: Users },
    { number: 4, title: "Software & Ferramentas", icon: Settings },
    { number: 5, title: "Equipamentos", icon: Calculator },
    { number: 6, title: "Capacidade Produtiva", icon: TrendingUp },
    { number: 7, title: "Riscos & Margem", icon: Target },
    { number: 8, title: "Impostos & Tributos", icon: FileText },
    { number: 9, title: "Resultado Final", icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-lumina-600 to-purple-600 bg-clip-text text-transparent">
            Calculadora Profissional de Valor/Hora
          </h2>
          <p className="text-muted-foreground">
            Método completo baseado nas melhores práticas do SEBRAE e CAU/BR
          </p>
        </div>
        <Badge variant="secondary" className="hidden md:inline-flex">
          Método Profissional
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-lumina-500 to-purple-500 flex items-center justify-center text-white">
                {React.createElement(steps[currentStep - 1]?.icon, { className: "w-4 h-4" })}
              </div>
              <div>
                <p className="font-semibold">{steps[currentStep - 1]?.title}</p>
                <p className="text-xs text-muted-foreground">Etapa {currentStep} de {totalSteps}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% concluído
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-lumina-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === totalSteps}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Etapa 1: Perfil da Empresa */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Perfil & Parâmetros da Empresa
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure as informações básicas que influenciam no cálculo do seu valor-hora
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select onValueChange={(value) => updateField('taxRegime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mei">MEI</SelectItem>
                        <SelectItem value="simples">Simples Nacional</SelectItem>
                        <SelectItem value="presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Alíquota Efetiva de Impostos (%)</Label>
                    <Input
                      type="number"
                      placeholder="15.0"
                      value={hourlyCalc.taxRate || ""}
                      onChange={(e) => updateField('taxRate', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inclui ISS + DAS/Simples + outros tributos sobre faturamento
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade/Estado</Label>
                    <Input
                      placeholder="São Paulo, SP"
                      value={hourlyCalc.location || ""}
                      onChange={(e) => updateField('location', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Escritório</Label>
                    <Select onValueChange={(value) => updateField('officeType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Arquiteta Solo</SelectItem>
                        <SelectItem value="small">Escritório Pequeno (2-3 pessoas)</SelectItem>
                        <SelectItem value="medium">Escritório Médio (4-10 pessoas)</SelectItem>
                        <SelectItem value="large">Escritório Grande (10+ pessoas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        Por que essas informações são importantes?
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        O regime tributário define suas obrigações fiscais. A localização influencia no ISS (varia de 2% a 5%). 
                        O tipo de escritório ajuda a calibrar os custos típicos do seu porte.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 2: Custos Fixos */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Custos Fixos Mensais
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Despesas que você tem todos os meses, independente de ter projetos ou não
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Aluguel/Financiamento (R$)</Label>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={hourlyCalc.rent || ""}
                      onChange={(e) => updateField('rent', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Internet (R$)</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={hourlyCalc.internet || ""}
                      onChange={(e) => updateField('internet', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Energia + Água + Telefone (R$)</Label>
                    <Input
                      type="number"
                      placeholder="400"
                      value={hourlyCalc.utilities || ""}
                      onChange={(e) => updateField('utilities', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seguros (Responsabilidade Civil) (R$)</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      value={hourlyCalc.insurance || ""}
                      onChange={(e) => updateField('insurance', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Celular Corporativo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={hourlyCalc.phone || ""}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Contabilidade (R$)</Label>
                    <Input
                      type="number"
                      placeholder="350"
                      value={hourlyCalc.accounting || ""}
                      onChange={(e) => updateField('accounting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Marketing Digital (R$)</Label>
                    <Input
                      type="number"
                      placeholder="800"
                      value={hourlyCalc.marketing || ""}
                      onChange={(e) => updateField('marketing', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Material de Escritório (R$)</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      value={hourlyCalc.officeSupplies || ""}
                      onChange={(e) => updateField('officeSupplies', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Total de Custos Fixos:</strong> R$ {result.fixedCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 3: Folha & Encargos */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Folha de Pagamento & Encargos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Todos os custos relacionados à equipe, incluindo pró-labore e encargos
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pró-labore do Sócio (R$)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={hourlyCalc.ownerSalary || ""}
                      onChange={(e) => updateField('ownerSalary', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Salários de Funcionários (R$)</Label>
                    <Input
                      type="number"
                      placeholder="3000"
                      value={hourlyCalc.employeesSalary || ""}
                      onChange={(e) => updateField('employeesSalary', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>13º Salário (reserva mensal) (R$)</Label>
                    <Input
                      type="number"
                      placeholder="250"
                      value={hourlyCalc.thirteenthSalary || ""}
                      onChange={(e) => updateField('thirteenthSalary', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Férias (reserva mensal) (R$)</Label>
                    <Input
                      type="number"
                      placeholder="280"
                      value={hourlyCalc.vacation || ""}
                      onChange={(e) => updateField('vacation', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Vale Transporte + Alimentação (R$)</Label>
                    <Input
                      type="number"
                      placeholder="400"
                      value={hourlyCalc.benefits || ""}
                      onChange={(e) => updateField('benefits', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>FGTS + INSS Patronal (R$)</Label>
                    <Input
                      type="number"
                      placeholder="720"
                      value={hourlyCalc.socialCharges || ""}
                      onChange={(e) => updateField('socialCharges', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>Total da Folha:</strong> R$ {result.payrollCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 4: Software & Ferramentas */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-600" />
                  Software e Ferramentas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Licenças de software essenciais para o trabalho de arquitetura e design
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adobe Creative Cloud (R$/mês)</Label>
                    <Input
                      type="number"
                      placeholder="180"
                      value={hourlyCalc.adobe || ""}
                      onChange={(e) => updateField('adobe', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>AutoCAD (R$/mês)</Label>
                    <Input
                      type="number"
                      placeholder="650"
                      value={hourlyCalc.autocad || ""}
                      onChange={(e) => updateField('autocad', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SketchUp Pro (R$/mês)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={hourlyCalc.sketchup || ""}
                      onChange={(e) => updateField('sketchup', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Revit (R$/mês)</Label>
                    <Input
                      type="number"
                      placeholder="890"
                      value={hourlyCalc.revit || ""}
                      onChange={(e) => updateField('revit', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Promob/Móveis (R$/mês)</Label>
                    <Input
                      type="number"
                      placeholder="450"
                      value={hourlyCalc.promob || ""}
                      onChange={(e) => updateField('promob', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Outros Software (R$/mês)</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      value={hourlyCalc.otherSoftware || ""}
                      onChange={(e) => updateField('otherSoftware', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Total em Software:</strong> R$ {result.softwareCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 5: Equipamentos */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-red-600" />
                  Depreciação de Equipamentos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rateio mensal dos investimentos em equipamentos (computadores, impressoras, etc.)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Como calcular a depreciação?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Liste seus equipamentos e defina: valor de compra, vida útil estimada e valor residual.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>• <strong>Computadores/Notebooks:</strong> 3-4 anos</div>
                      <div>• <strong>Impressoras/Plotters:</strong> 5-7 anos</div>
                      <div>• <strong>Câmeras/Equipamentos:</strong> 5 anos</div>
                      <div>• <strong>Móveis de Escritório:</strong> 10 anos</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Depreciação Mensal Total (R$)</Label>
                    <Input
                      type="number"
                      placeholder="800"
                      value={hourlyCalc.equipmentDepreciation || ""}
                      onChange={(e) => updateField('equipmentDepreciation', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Exemplo: Computador R$ 8.000 ÷ 48 meses = R$ 167/mês
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Depreciação Mensal:</strong> R$ {result.depreciationCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 6: Capacidade Produtiva */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Capacidade Produtiva da Equipe
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Defina quantas horas sua equipe realmente consegue trabalhar em projetos
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total de Horas da Equipe/Mês</Label>
                    <Input
                      type="number"
                      placeholder="176"
                      value={hourlyCalc.totalTeamHours || ""}
                      onChange={(e) => updateField('totalTeamHours', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 1 pessoa × 176h/mês (22 dias × 8h)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Taxa de Utilização (%)</Label>
                    <Input
                      type="number"
                      placeholder="85"
                      value={hourlyCalc.utilizationRate || ""}
                      onChange={(e) => updateField('utilizationRate', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentual de horas vendáveis (80-90% para profissionais técnicos)
                    </p>
                  </div>
                </div>

                <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-teal-900 dark:text-teal-100">
                        Por que Taxa de Utilização?
                      </h4>
                      <p className="text-sm text-teal-800 dark:text-teal-200 mt-1">
                        Nem todas as horas são vendáveis. Descontam-se: reuniões internas, orçamentos, 
                        capacitação, administração e ociosidade natural.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Horas Totais/Mês</p>
                    <p className="text-xl font-bold">{parseFloat(hourlyCalc.totalTeamHours) || 0}h</p>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Horas Produtivas/Mês</p>
                    <p className="text-xl font-bold text-teal-600">{result.productiveHours.toFixed(0)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 7: Riscos & Margem */}
          {currentStep === 7 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-600" />
                  Riscos & Margem de Lucro
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Defina sua margem de lucro e proteção contra inadimplência
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxa de Inadimplência (%)</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={hourlyCalc.defaultRisk || ""}
                      onChange={(e) => updateField('defaultRisk', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentual histórico de clientes que não pagam (5-10% típico)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Margem de Lucro Alvo (%)</Label>
                    <Input
                      type="number"
                      placeholder="45"
                      value={hourlyCalc.profitMargin || ""}
                      onChange={(e) => updateField('profitMargin', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Margem desejada sobre os custos
                    </p>
                  </div>
                </div>

                <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">
                    Referências de Margem por Porte:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-pink-800 dark:text-pink-200">
                    <div>• <strong>Arquiteta Solo:</strong> 25-35%</div>
                    <div>• <strong>Escritório Pequeno:</strong> 30-40%</div>
                    <div>• <strong>Escritório Médio:</strong> 20-30%</div>
                    <div>• <strong>Escritório Grande:</strong> 15-25%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Custo/Hora Base</p>
                    <p className="text-xl font-bold">R$ {result.costPerHour.toFixed(2)}</p>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Com Margem + Risco</p>
                    <p className="text-xl font-bold text-pink-600">R$ {result.costWithRisk.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 8: Impostos */}
          {currentStep === 8 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Impostos sobre Faturamento
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ajuste final considerando todos os tributos sobre a receita
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                        Importante: Confirmação Contábil
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        A alíquota exata varia por cidade e regime tributário. 
                        Confirme com seu contador a alíquota efetiva atual.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Referências Típicas:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>MEI:</span>
                          <span className="font-medium">~R$ 70/mês fixo</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Simples Nacional:</span>
                          <span className="font-medium">4,5% - 16,85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lucro Presumido:</span>
                          <span className="font-medium">11,33% - 15,33%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ISS (varia por cidade):</span>
                          <span className="font-medium">2% - 5%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Alíquota Configurada</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {parseFloat(hourlyCalc.taxRate) || 15}%
                      </p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                        Sobre o faturamento bruto
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Preço Antes dos Impostos</p>
                    <p className="text-xl font-bold">R$ {result.priceBeforeTaxes.toFixed(2)}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Preço Final</p>
                    <p className="text-xl font-bold text-indigo-600">R$ {result.finalHourlyRate.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 9: Resultado Final */}
          {currentStep === 9 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Resultado Final & Análise
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Seu valor-hora calculado e análise de viabilidade
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-xl p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                    <Target className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    Seu Valor-Hora Ideal
                  </h3>
                  <p className="text-5xl font-bold text-emerald-600 mb-4">
                    R$ {result.finalHourlyRate.toFixed(2)}
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Baseado em metodologia profissional SEBRAE/CAU
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Faturamento Mensal</p>
                    <p className="text-xl font-bold text-blue-600">
                      R$ {result.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Custos Mensais</p>
                    <p className="text-xl font-bold text-red-600">
                      R$ {result.totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Lucro Líquido</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {result.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">
                    💡 Sugestões Estratégicas de Preço
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Mínimo</p>
                      <p className="text-2xl font-bold text-red-600">R$ {result.finalHourlyRate.toFixed(2)}</p>
                      <p className="text-xs text-red-700 dark:text-red-300">Ponto de equilíbrio</p>
                    </div>
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Recomendado</p>
                      <p className="text-2xl font-bold text-emerald-600">R$ {(result.finalHourlyRate * 1.2).toFixed(2)}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">+20% competitivo</p>
                    </div>
                    <div className="text-center bg-white/50 dark:bg-black/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Premium</p>
                      <p className="text-2xl font-bold text-purple-600">R$ {(result.finalHourlyRate * 1.5).toFixed(2)}</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">+50% diferenciado</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório PDF
                  </Button>
                  <Button variant="outline" size="lg">
                    <FileText className="w-4 h-4 mr-2" />
                    Salvar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
        </div>

        {/* Sidebar com Resultado */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentStep === 9 ? "✅ Cálculo Finalizado" : "🔄 Em Progresso"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor-Hora Atual</p>
              <p className={`text-3xl font-bold ${
                currentStep === 9 ? 'text-emerald-600' : 'text-muted-foreground'
              }`}>
                R$ {result.finalHourlyRate.toFixed(2)}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Resumo dos Custos</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Custos Fixos</span>
                    <span>R$ {result.fixedCosts.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Folha de Pagamento</span>
                    <span>R$ {result.payrollCosts.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Software</span>
                    <span>R$ {result.softwareCosts.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Equipamentos</span>
                    <span>R$ {result.depreciationCosts.toFixed(0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>R$ {result.totalMonthlyCost.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Produtividade</h4>
                <div className="flex justify-between text-sm">
                  <span>Horas Produtivas</span>
                  <span>{result.productiveHours.toFixed(0)}h/mês</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo por Hora</span>
                  <span>R$ {result.costPerHour.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {currentStep === 9 && (
              <div className="border-t pt-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">
                    Margem de Lucro Realizada
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    {result.monthlyRevenue > 0 ? ((result.monthlyProfit / result.monthlyRevenue) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>

                <div className="mt-4">
                  <Button className="w-full" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}