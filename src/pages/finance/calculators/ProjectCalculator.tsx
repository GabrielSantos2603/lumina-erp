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
  Truck,
  FileText,
  PieChart,
  Target,
  Briefcase,
  ClipboardList,
  Download,
  TrendingUp
} from "lucide-react";

interface ProjectCalculatorProps {
  projectCalc: any;
  setProjectCalc: (calc: any) => void;
  calculateProjectTotal: () => any;
  onBack: () => void;
}

export function ProjectCalculator({
  projectCalc,
  setProjectCalc,
  onBack,
}: ProjectCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  const updateField = (field: string, value: string | number) => {
    setProjectCalc((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Cálculo completo do projeto com todas as metodologias
  const calculateCompleteProject = () => {
    // MÉTODO 1: POR HORAS (usando valor-hora base CORRIGIDO)
    const hourlyRate = parseFloat(projectCalc.hourlyRate) || 250; // Aumentado de R$ 120 para R$ 250
    
    // Fases do Projeto (CAU/BR)
    const briefingHours = parseFloat(projectCalc.briefingHours) || 0;
    const preliminaryHours = parseFloat(projectCalc.preliminaryHours) || 0;
    const anteroomHours = parseFloat(projectCalc.anteroomHours) || 0;
    const executiveHours = parseFloat(projectCalc.executiveHours) || 0;
    const compatibilizationHours = parseFloat(projectCalc.compatibilizationHours) || 0;
    const specificationHours = parseFloat(projectCalc.specificationHours) || 0;
    const budgetHours = parseFloat(projectCalc.budgetHours) || 0;
    const approvalHours = parseFloat(projectCalc.approvalHours) || 0;
    const supervisionHours = parseFloat(projectCalc.supervisionHours) || 0;

    const totalProjectHours = briefingHours + preliminaryHours + anteroomHours + 
                             executiveHours + compatibilizationHours + specificationHours + 
                             budgetHours + approvalHours + supervisionHours;

    // Aplicar multiplicadores de complexidade e urgência
    const complexityFactor = parseFloat(projectCalc.complexityFactor) || 1.0;
    const urgencyFactor = parseFloat(projectCalc.urgencyFactor) || 1.0;
    const adjustedHours = totalProjectHours * complexityFactor * urgencyFactor;

    const projectByHours = adjustedHours * hourlyRate;

    // MÉTODO 2: POR M² (com tipologia e padrão CORRIGIDO)
    const projectArea = parseFloat(projectCalc.projectArea) || 0;
    const sqmBasePrice = parseFloat(projectCalc.sqmBasePrice) || 150; // Aumentado de R$ 80 para R$ 150/m²
    const typologyMultiplier = parseFloat(projectCalc.typologyMultiplier) || 1.0;
    const standardMultiplier = parseFloat(projectCalc.standardMultiplier) || 1.0;
    
    const projectBySqm = projectArea * sqmBasePrice * typologyMultiplier * standardMultiplier;

    // MÉTODO 3: POR PERCENTUAL DA OBRA (CORRIGIDO)
    const constructionCost = parseFloat(projectCalc.constructionCost) || 0;
    const percentageFee = parseFloat(projectCalc.percentageFee) || 12; // Aumentado de 8% para 12%
    
    const projectByPercentage = constructionCost * (percentageFee / 100);

    // CUSTOS DIRETOS DO PROJETO
    // Consultorias Técnicas
    const structuralConsulting = parseFloat(projectCalc.structuralConsulting) || 0;
    const electricalConsulting = parseFloat(projectCalc.electricalConsulting) || 0;
    const hydraulicConsulting = parseFloat(projectCalc.hydraulicConsulting) || 0;
    const airConditioningConsulting = parseFloat(projectCalc.airConditioningConsulting) || 0;
    const landscapeConsulting = parseFloat(projectCalc.landscapeConsulting) || 0;
    const lightingConsulting = parseFloat(projectCalc.lightingConsulting) || 0;
    const acousticConsulting = parseFloat(projectCalc.acousticConsulting) || 0;
    
    const totalConsulting = structuralConsulting + electricalConsulting + hydraulicConsulting +
                           airConditioningConsulting + landscapeConsulting + lightingConsulting + acousticConsulting;

    // Materiais e Serviços
    const printing = parseFloat(projectCalc.printing) || 0;
    const plotting = parseFloat(projectCalc.plotting) || 0;
    const mockups = parseFloat(projectCalc.mockups) || 0;
    const presentations = parseFloat(projectCalc.presentations) || 0;
    const samples = parseFloat(projectCalc.samples) || 0;
    
    const totalMaterials = printing + plotting + mockups + presentations + samples;

    // Legalização
    const municipalFees = parseFloat(projectCalc.municipalFees) || 0;
    const condominiumFees = parseFloat(projectCalc.condominiumFees) || 0;
    const bodyFees = parseFloat(projectCalc.bodyFees) || 0;
    const environmentalFees = parseFloat(projectCalc.environmentalFees) || 0;
    
    const totalLegalization = municipalFees + condominiumFees + bodyFees + environmentalFees;

    // Despesas Reembolsáveis
    const travelCosts = parseFloat(projectCalc.travelCosts) || 0;
    const accommodationCosts = parseFloat(projectCalc.accommodationCosts) || 0;
    const transportCosts = parseFloat(projectCalc.transportCosts) || 0;
    
    const totalReimbursable = travelCosts + accommodationCosts + transportCosts;

    // CUSTOS TOTAIS DIRETOS
    const totalDirectCosts = totalConsulting + totalMaterials + totalLegalization + totalReimbursable;

    // BDI (Bonificação e Despesas Indiretas)
    const indirectCosts = parseFloat(projectCalc.indirectCosts) || 5; // %
    const insurance = parseFloat(projectCalc.insurance) || 1; // %
    const risks = parseFloat(projectCalc.risks) || 3; // %
    const taxes = parseFloat(projectCalc.taxes) || 6; // %
    const profit = parseFloat(projectCalc.profit) || 15; // %
    
    const totalBDIPercentage = indirectCosts + insurance + risks + taxes + profit;
    const bdiMultiplier = 1 / (1 - totalBDIPercentage / 100);

    // VALORES FINAIS
    const recommendedMethod = Math.max(projectByHours, projectBySqm, projectByPercentage);
    const finalProjectValue = (recommendedMethod + totalDirectCosts) * bdiMultiplier;
    
    // Análise de Coerência
    const methodVariation = {
      hours: projectByHours,
      sqm: projectBySqm,
      percentage: projectByPercentage,
      maxVariation: Math.max(projectByHours, projectBySqm, projectByPercentage) / Math.min(projectByHours || 1, projectBySqm || 1, projectByPercentage || 1)
    };

    return {
      // Métodos de cálculo
      projectByHours,
      projectBySqm,
      projectByPercentage,
      recommendedMethod,
      
      // Custos diretos
      totalConsulting,
      totalMaterials,
      totalLegalization,
      totalReimbursable,
      totalDirectCosts,
      
      // BDI
      bdiMultiplier,
      totalBDIPercentage,
      
      // Valores finais
      finalProjectValue,
      
      // Análises
      methodVariation,
      totalProjectHours,
      adjustedHours,
      
      // Breakdown por fase
      phaseBreakdown: {
        briefing: briefingHours * hourlyRate * complexityFactor * urgencyFactor,
        preliminary: preliminaryHours * hourlyRate * complexityFactor * urgencyFactor,
        anteroom: anteroomHours * hourlyRate * complexityFactor * urgencyFactor,
        executive: executiveHours * hourlyRate * complexityFactor * urgencyFactor,
        compatibilization: compatibilizationHours * hourlyRate * complexityFactor * urgencyFactor,
        specification: specificationHours * hourlyRate * complexityFactor * urgencyFactor,
        budget: budgetHours * hourlyRate * complexityFactor * urgencyFactor,
        approval: approvalHours * hourlyRate * complexityFactor * urgencyFactor,
        supervision: supervisionHours * hourlyRate * complexityFactor * urgencyFactor
      }
    };
  };

  const result = calculateCompleteProject();

  const steps = [
    { number: 1, title: "Dados do Projeto", icon: Building2 },
    { number: 2, title: "Fases CAU/BR", icon: ClipboardList },
    { number: 3, title: "Multiplicadores", icon: TrendingUp },
    { number: 4, title: "Consultorias Técnicas", icon: Users },
    { number: 5, title: "Materiais & Apresentações", icon: FileText },
    { number: 6, title: "Legalização", icon: Briefcase },
    { number: 7, title: "Despesas Reembolsáveis", icon: Truck },
    { number: 8, title: "BDI & Impostos", icon: PieChart },
    { number: 9, title: "Análise Comparativa", icon: Calculator },
    { number: 10, title: "Resultado Final", icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Calculadora de Projeto Completo
          </h2>
          <p className="text-muted-foreground">
            Orçamento profissional com 3 métodos: Horas + % Obra + m² + BDI
          </p>
        </div>
        <Badge variant="secondary" className="hidden md:inline-flex">
          CAU/BR + BDI
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white">
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
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
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
          
          {/* Etapa 1: Dados do Projeto */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Informações Básicas do Projeto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os dados fundamentais para os cálculos
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Projeto</Label>
                    <Input
                      placeholder="Ex: Residência Família Silva"
                      value={projectCalc.projectName || ""}
                      onChange={(e) => updateField('projectName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipologia</Label>
                    <Select onValueChange={(value) => updateField('typology', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a tipologia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residencial</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="corporate">Corporativo</SelectItem>
                        <SelectItem value="hospitality">Hospitalidade</SelectItem>
                        <SelectItem value="retail">Varejo</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Área Total (m²)</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={projectCalc.projectArea || ""}
                      onChange={(e) => updateField('projectArea', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custo Estimado da Obra (R$)</Label>
                    <Input
                      type="number"
                      placeholder="300000"
                      value={projectCalc.constructionCost || ""}
                      onChange={(e) => updateField('constructionCost', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valor-Hora Base (R$)</Label>
                    <Input
                      type="number"
                      placeholder="250"
                      value={projectCalc.hourlyRate || ""}
                      onChange={(e) => updateField('hourlyRate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Preço Base por m² (R$)</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={projectCalc.sqmBasePrice || ""}
                      onChange={(e) => updateField('sqmBasePrice', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Percentual sobre Obra (%)</Label>
                    <Input
                      type="number"
                      placeholder="12"
                      value={projectCalc.percentageFee || ""}
                      onChange={(e) => updateField('percentageFee', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Três Métodos de Cálculo
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Esta calculadora combina os 3 principais métodos do mercado: por horas (CAU/BR), 
                    por m² (prático) e por percentual da obra (internacional). 
                    O sistema recomendará o mais adequado para seu projeto.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 2: Fases do Projeto */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                  Fases do Projeto (baseado CAU/BR)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estime as horas necessárias para cada etapa do projeto
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Briefing & Levantamento (horas)</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={projectCalc.briefingHours || ""}
                      onChange={(e) => updateField('briefingHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Estudo Preliminar (horas)</Label>
                    <Input
                      type="number"
                      placeholder="16"
                      value={projectCalc.preliminaryHours || ""}
                      onChange={(e) => updateField('preliminaryHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Anteprojeto (horas)</Label>
                    <Input
                      type="number"
                      placeholder="24"
                      value={projectCalc.anteroomHours || ""}
                      onChange={(e) => updateField('anteroomHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Projeto Executivo (horas)</Label>
                    <Input
                      type="number"
                      placeholder="40"
                      value={projectCalc.executiveHours || ""}
                      onChange={(e) => updateField('executiveHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Compatibilização (horas)</Label>
                    <Input
                      type="number"
                      placeholder="12"
                      value={projectCalc.compatibilizationHours || ""}
                      onChange={(e) => updateField('compatibilizationHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Caderno de Especificações (horas)</Label>
                    <Input
                      type="number"
                      placeholder="16"
                      value={projectCalc.specificationHours || ""}
                      onChange={(e) => updateField('specificationHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Orçamento/Quantitativos (horas)</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={projectCalc.budgetHours || ""}
                      onChange={(e) => updateField('budgetHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Aprovações/Legalização (horas)</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={projectCalc.approvalHours || ""}
                      onChange={(e) => updateField('approvalHours', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Acompanhamento de Obra (horas)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={projectCalc.supervisionHours || ""}
                      onChange={(e) => updateField('supervisionHours', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Total de Horas Estimadas:</strong> {result.totalProjectHours} horas
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Base de cálculo: R$ {result.projectByHours.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 3: Multiplicadores */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Fatores de Ajuste
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ajuste o preço conforme complexidade, padrão e urgência
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fator de Complexidade</Label>
                    <Select onValueChange={(value) => updateField('complexityFactor', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a complexidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.8">Baixa (0.8x)</SelectItem>
                        <SelectItem value="1.0">Normal (1.0x)</SelectItem>
                        <SelectItem value="1.3">Alta (1.3x)</SelectItem>
                        <SelectItem value="1.6">Muito Alta (1.6x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fator de Urgência</Label>
                    <Select onValueChange={(value) => updateField('urgencyFactor', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a urgência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">Normal (1.0x)</SelectItem>
                        <SelectItem value="1.15">Urgente (1.15x)</SelectItem>
                        <SelectItem value="1.3">Muito Urgente (1.3x)</SelectItem>
                        <SelectItem value="1.5">Emergencial (1.5x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Multiplicador de Tipologia</Label>
                    <Select onValueChange={(value) => updateField('typologyMultiplier', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Baseado na tipologia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">Residencial (1.0x)</SelectItem>
                        <SelectItem value="1.2">Comercial (1.2x)</SelectItem>
                        <SelectItem value="1.4">Corporativo (1.4x)</SelectItem>
                        <SelectItem value="1.3">Hospitalidade (1.3x)</SelectItem>
                        <SelectItem value="1.1">Varejo (1.1x)</SelectItem>
                        <SelectItem value="1.5">Industrial (1.5x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Multiplicador de Padrão</Label>
                    <Select onValueChange={(value) => updateField('standardMultiplier', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Padrão do projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.8">Econômico (0.8x)</SelectItem>
                        <SelectItem value="1.0">Médio (1.0x)</SelectItem>
                        <SelectItem value="1.3">Alto (1.3x)</SelectItem>
                        <SelectItem value="1.6">Luxo (1.6x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Por Horas (Ajustado)</p>
                    <p className="text-xl font-bold text-blue-600">
                      R$ {(result.adjustedHours * (parseFloat(projectCalc.hourlyRate) || 120)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Por m² (Ajustado)</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {result.projectBySqm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Por % da Obra</p>
                    <p className="text-xl font-bold text-purple-600">
                      R$ {result.projectByPercentage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 4: Consultorias Técnicas */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Consultorias Técnicas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Custos de profissionais terceirizados especializados
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estrutural (R$)</Label>
                    <Input
                      type="number"
                      placeholder="3500"
                      value={projectCalc.structuralConsulting || ""}
                      onChange={(e) => updateField('structuralConsulting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Elétrica (R$)</Label>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={projectCalc.electricalConsulting || ""}
                      onChange={(e) => updateField('electricalConsulting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Hidráulica (R$)</Label>
                    <Input
                      type="number"
                      placeholder="1800"
                      value={projectCalc.hydraulicConsulting || ""}
                      onChange={(e) => updateField('hydraulicConsulting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ar Condicionado (R$)</Label>
                    <Input
                      type="number"
                      placeholder="1500"
                      value={projectCalc.airConditioningConsulting || ""}
                      onChange={(e) => updateField('airConditioningConsulting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Paisagismo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="2500"
                      value={projectCalc.landscapeConsulting || ""}
                      onChange={(e) => updateField('landscapeConsulting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Iluminação (R$)</Label>
                    <Input
                      type="number"
                      placeholder="1200"
                      value={projectCalc.lightingConsulting || ""}
                      onChange={(e) => updateField('lightingConsulting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Acústica (R$)</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={projectCalc.acousticConsulting || ""}
                      onChange={(e) => updateField('acousticConsulting', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>Total em Consultorias:</strong> R$ {result.totalConsulting.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 5: Materiais & Apresentações */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Materiais & Apresentações
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Custos de impressão, plotagem, maquetes e apresentações
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Impressões (R$)</Label>
                    <Input
                      type="number"
                      placeholder="300"
                      value={projectCalc.printing || ""}
                      onChange={(e) => updateField('printing', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Plotagens (R$)</Label>
                    <Input
                      type="number"
                      placeholder="800"
                      value={projectCalc.plotting || ""}
                      onChange={(e) => updateField('plotting', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maquetes/Mockups (R$)</Label>
                    <Input
                      type="number"
                      placeholder="1500"
                      value={projectCalc.mockups || ""}
                      onChange={(e) => updateField('mockups', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Apresentações 3D (R$)</Label>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={projectCalc.presentations || ""}
                      onChange={(e) => updateField('presentations', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Amostras de Materiais (R$)</Label>
                    <Input
                      type="number"
                      placeholder="400"
                      value={projectCalc.samples || ""}
                      onChange={(e) => updateField('samples', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                    <strong>Total em Materiais:</strong> R$ {result.totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 6: Legalização */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                  Legalização & Aprovações
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Taxas e custos para aprovação em órgãos competentes
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxas Municipais (R$)</Label>
                    <Input
                      type="number"
                      placeholder="1200"
                      value={projectCalc.municipalFees || ""}
                      onChange={(e) => updateField('municipalFees', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Aprovação Condomínio (R$)</Label>
                    <Input
                      type="number"
                      placeholder="300"
                      value={projectCalc.condominiumFees || ""}
                      onChange={(e) => updateField('condominiumFees', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Corpo de Bombeiros (R$)</Label>
                    <Input
                      type="number"
                      placeholder="800"
                      value={projectCalc.bodyFees || ""}
                      onChange={(e) => updateField('bodyFees', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Licenças Ambientais (R$)</Label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={projectCalc.environmentalFees || ""}
                      onChange={(e) => updateField('environmentalFees', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Total em Legalização:</strong> R$ {result.totalLegalization.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 7: Despesas Reembolsáveis */}
          {currentStep === 7 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-600" />
                  Despesas Reembolsáveis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Custos de deslocamento e hospedagem que podem ser reembolsados
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Viagens/Deslocamento (R$)</Label>
                    <Input
                      type="number"
                      placeholder="600"
                      value={projectCalc.travelCosts || ""}
                      onChange={(e) => updateField('travelCosts', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Hospedagem (R$)</Label>
                    <Input
                      type="number"
                      placeholder="400"
                      value={projectCalc.accommodationCosts || ""}
                      onChange={(e) => updateField('accommodationCosts', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Transporte Local (R$)</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      value={projectCalc.transportCosts || ""}
                      onChange={(e) => updateField('transportCosts', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                  <p className="text-sm text-teal-800 dark:text-teal-200">
                    <strong>Total Reembolsável:</strong> R$ {result.totalReimbursable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 8: BDI & Impostos */}
          {currentStep === 8 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-red-600" />
                  BDI (Bonificação e Despesas Indiretas)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os percentuais de despesas indiretas, riscos e lucro
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Despesas Indiretas (%)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={projectCalc.indirectCosts || ""}
                      onChange={(e) => updateField('indirectCosts', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seguros/Garantias (%)</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={projectCalc.insurance || ""}
                      onChange={(e) => updateField('insurance', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Riscos/Imprevistos (%)</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={projectCalc.risks || ""}
                      onChange={(e) => updateField('risks', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Impostos s/ Faturamento (%)</Label>
                    <Input
                      type="number"
                      placeholder="6"
                      value={projectCalc.taxes || ""}
                      onChange={(e) => updateField('taxes', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lucro Desejado (%)</Label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={projectCalc.profit || ""}
                      onChange={(e) => updateField('profit', e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Resumo BDI</h4>
                  <div className="space-y-1 text-sm text-red-800 dark:text-red-200">
                    <div className="flex justify-between">
                      <span>BDI Total:</span>
                      <span>{result.totalBDIPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplicador:</span>
                      <span>{result.bdiMultiplier.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 9: Análise Comparativa */}
          {currentStep === 9 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Análise Comparativa dos Métodos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Compare os resultados dos três métodos e veja a recomendação
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border-2 border-blue-200">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Por Horas (CAU/BR)</h4>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      R$ {result.projectByHours.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {result.adjustedHours.toFixed(0)} horas × R$ {parseFloat(projectCalc.hourlyRate) || 120}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border-2 border-green-200">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Por m²</h4>
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      R$ {result.projectBySqm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {parseFloat(projectCalc.projectArea) || 0}m² × R$ {parseFloat(projectCalc.sqmBasePrice) || 150}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border-2 border-purple-200">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Por % da Obra</h4>
                    <p className="text-2xl font-bold text-purple-600 mb-2">
                      R$ {result.projectByPercentage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      {parseFloat(projectCalc.percentageFee) || 12}% da obra
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-4">
                    💡 Método Recomendado
                  </h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600 mb-2">
                      R$ {result.recommendedMethod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      Baseado no maior valor entre os três métodos (prática recomendada)
                    </p>
                  </div>
                </div>

                {result.methodVariation.maxVariation > 2 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      ⚠️ Atenção: Grande Variação
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Há uma variação significativa entre os métodos. Revise os parâmetros e 
                      considere usar o método por horas para maior precisão.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Etapa 10: Resultado Final */}
          {currentStep === 10 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Resultado Final do Projeto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Orçamento completo com todos os custos e BDI aplicado
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-xl p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                    <Target className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    Valor Total do Projeto
                  </h3>
                  <p className="text-5xl font-bold text-emerald-600 mb-4">
                    R$ {result.finalProjectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Incluindo todos os custos diretos + BDI de {result.totalBDIPercentage.toFixed(1)}%
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Breakdown de Custos:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Honorários (método recomendado)</span>
                        <span>R$ {result.recommendedMethod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Consultorias Técnicas</span>
                        <span>R$ {result.totalConsulting.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Materiais & Apresentações</span>
                        <span>R$ {result.totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Legalização</span>
                        <span>R$ {result.totalLegalization.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Reembolsáveis</span>
                        <span>R$ {result.totalReimbursable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Subtotal</span>
                          <span>R$ {(result.recommendedMethod + result.totalDirectCosts).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>BDI ({result.totalBDIPercentage.toFixed(1)}%)</span>
                        <span>R$ {(result.finalProjectValue - (result.recommendedMethod + result.totalDirectCosts)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Sugestões de Pagamento:</h4>
                    <div className="space-y-3">
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">30% na Assinatura</p>
                        <p className="text-lg font-bold text-blue-600">
                          R$ {(result.finalProjectValue * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">40% na Aprovação</p>
                        <p className="text-lg font-bold text-orange-600">
                          R$ {(result.finalProjectValue * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">30% na Entrega</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {(result.finalProjectValue * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Proposta Comercial
                  </Button>
                  <Button variant="outline" size="lg">
                    <Calculator className="w-4 h-4 mr-2" />
                    Exportar Planilha
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
              {currentStep === 10 ? "✅ Projeto Finalizado" : "🔄 Em Progresso"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor Final do Projeto</p>
              <p className={`text-3xl font-bold ${
                currentStep === 10 ? 'text-emerald-600' : 'text-muted-foreground'
              }`}>
                R$ {result.finalProjectValue.toFixed(2)}
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Comparação de Métodos</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Por Horas</span>
                    <span>R$ {result.projectByHours.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Por m²</span>
                    <span>R$ {result.projectBySqm.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Por % Obra</span>
                    <span>R$ {result.projectByPercentage.toFixed(0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-blue-600">
                      <span>Recomendado</span>
                      <span>R$ {result.recommendedMethod.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Custos Diretos</h4>
                <div className="flex justify-between text-sm">
                  <span>Consultorias</span>
                  <span>R$ {result.totalConsulting.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Materiais</span>
                  <span>R$ {result.totalMaterials.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Legalização</span>
                  <span>R$ {result.totalLegalization.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {currentStep === 10 && (
              <div className="border-t pt-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">
                    BDI Aplicado
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    {result.totalBDIPercentage.toFixed(1)}%
                  </p>
                </div>

                <div className="mt-4">
                  <Button className="w-full" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Proposta PDF
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