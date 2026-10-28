import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, Receipt, BarChart3, Download } from "lucide-react";
import { financeService } from "@/services/financeService";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { FinancialGoalsModal } from "@/components/forms/FinancialGoalsModal";
import { DashboardTab } from "./DashboardTab";
import { PaymentsTab } from "./PaymentsTab";
import { CalculatorsTab } from "./CalculatorsTab";
import { DynamicContainer } from "@/components/responsive";
import toast from "react-hot-toast";

interface Payment {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  method: "pix" | "boleto" | "card" | "transfer" | "cash";
  status: "pending" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  paidDate?: string;
  project?: string;
  client?: string;
  installments?: number;
  currentInstallment?: number;
}

// Dados mockados removidos - agora carrega do Supabase

export function FinancePage() {
  const [selectedTab, setSelectedTab] = useState<"dashboard" | "payments" | "calculators">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTransactionForm, setShowAddTransactionForm] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashFlow, setCashFlow] = useState<Array<{ month: string; income: number; expense: number }>>([]);
  const [selectedTransactionGroup, setSelectedTransactionGroup] = useState<string | null>(null);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [loadingFinance, setLoadingFinance] = useState(false);
  
  // Filtro de mês para Dashboard (NOVO)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [financialGoals, setFinancialGoals] = useState({
    monthlyRevenue: 60000,
    monthlyProfit: 20000,
    yearlyRevenue: 720000,
    savingsTarget: 100000,
    profitMargin: 30,
  });
  
  // Carregar metas do localStorage ao iniciar
  useEffect(() => {
    const savedGoals = localStorage.getItem("financialGoals");
    if (savedGoals) {
      setFinancialGoals(JSON.parse(savedGoals));
    }
    loadFinanceData();
  }, []);

  // Carregar dados reais do Supabase
  async function loadFinanceData() {
    try {
      setLoadingFinance(true);
      const [txs, flow] = await Promise.all([
        financeService.getTransactions({ limit: 200 }),
        financeService.getMonthlyCashFlow(),
      ]);

      // Mapear transações para o shape local (payments)
      const mapped = txs.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        method: (t.method || "pix") as "pix" | "boleto" | "card" | "transfer" | "cash",
        status: t.status,
        dueDate: t.due_date,
        paidDate: t.paid_date || undefined,
        project: t.project_name || undefined,
        client: t.client_name || undefined,
        installments: t.installments || undefined,
        currentInstallment: t.current_installment || undefined,
      }));
      setPayments(mapped);

      // Mapear fluxo de caixa (converter mês para rótulo curto pt-BR)
      const flowMapped = flow.map((r) => {
        const d = new Date(r.month);
        const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" });
        return { month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), income: r.income, expense: r.expense };
      });
      setCashFlow(flowMapped);
    } catch (e) {
      console.error("Erro carregando dados financeiros:", e);
    } finally {
      setLoadingFinance(false);
    }
  }

  function handlePaymentSuccess() {
    loadFinanceData();
  }

  async function handleDeleteTransaction(id: string, description: string) {
    if (!confirm(`Tem certeza que deseja excluir a transação "${description}"?`)) {
      return;
    }

    try {
      await financeService.deleteTransaction(id);
      toast.success("Transação excluída com sucesso!");
      loadFinanceData();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast.error("Erro ao excluir transação");
    }
  }

  async function handleDeleteInstallmentGroup(baseDescription: string, installmentIds: string[], totalInstallments: number) {
    const confirmMessage = `⚠️ ATENÇÃO: Esta transação possui ${totalInstallments} parcelas.\n\n` +
      `Ao excluir, TODAS as ${totalInstallments} parcelas serão removidas permanentemente.\n\n` +
      `Deseja realmente excluir todas as parcelas de "${baseDescription}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Deletar todas as parcelas
      await Promise.all(installmentIds.map(id => financeService.deleteTransaction(id)));
      toast.success(`${totalInstallments} parcelas excluídas com sucesso!`);
      loadFinanceData();
    } catch (error) {
      console.error("Erro ao excluir parcelas:", error);
      toast.error("Erro ao excluir parcelas");
    }
  }

  // Inicializar dados ao abrir a aba financeiro
  // Observação: mantém mock se não houver dados
  // Sugestão: chamar loadFinanceData quando usuário abrir a aba Financeiro
  
  // Estados da calculadora
  const [hourlyCalc, setHourlyCalc] = useState({
    // Custos Fixos Mensais
    rent: "",
    internet: "",
    water: "",
    electricity: "",
    phone: "",
    condominium: "",
    cleaning: "",
    
    // Equipe e Pessoal
    prolabore: "",
    employees: "",
    accounting: "",
    
    // Softwares e Tecnologia
    cad: "",
    rendering: "",
    projectManagement: "",
    cloudStorage: "",
    otherSoftware: "",
    autocad: "",
    sketchup: "",
    adobe: "",
    promob: "",
    otherSoft: "",
    
    // Impostos e Taxas
    taxes: "",
    cau: "",
    insurance: "",
    
    // Educação e Desenvolvimento
    courses: "",
    books: "",
    events: "",
    
    // Marketing e Outros
    website: "",
    socialMedia: "",
    portfolio: "",
    transport: "",
    meals: "",
    office: "",
    depreciation: "",
    others: "",
    
    // Transporte e Deslocamento
    fuel: "",
    parking: "",
    publicTransport: "",
    vehicleMaintenance: "",
    
    // Outros Custos Profissionais
    marketing: "",
    officeMaterials: "",
    professionalAssociations: "",
    training: "",
    
    // Configurações
    workHours: "160",
    profitMargin: "30"
  });
  const [sqmCalc, setSqmCalc] = useState({
    area: "",
    complexity: "medium",
    projectType: "residential",
    pricePerSqm: "150",
    includesExecution: false
  });
  const [projectCalc, setProjectCalc] = useState({
    estimatedHours: "",
    hourlyRate: "",
    
    // Custos Externos
    topography: "",
    soilAnalysis: "",
    structuralEngineering: "",
    electricalProject: "",
    hydraulicProject: "",
    airConditioning: "",
    landscaping: "",
    otherConsultancies: "",
    
    // Materiais e Modelos
    physicalModels: "",
    renderings3D: "",
    presentations: "",
    printing: "",
    
    // Legalização
    permits: "",
    documentation: "",
    
    profitMargin: "25"
  });



  // Carregar dados ao montar o componente
  useEffect(() => {
    loadFinanceData();
  }, []);

  // Calculadora de Valor/Hora
  const calculateHourlyRate = () => {
    // Soma todos os custos fixos mensais
    const fixedCosts = 
      (parseFloat(hourlyCalc.rent) || 0) +
      (parseFloat(hourlyCalc.internet) || 0) +
      (parseFloat(hourlyCalc.water) || 0) +
      (parseFloat(hourlyCalc.electricity) || 0) +
      (parseFloat(hourlyCalc.phone) || 0) +
      (parseFloat(hourlyCalc.condominium) || 0) +
      (parseFloat(hourlyCalc.cleaning) || 0);
    
    // Soma custos de software
    const softwareCosts = 
      (parseFloat(hourlyCalc.cad) || 0) +
      (parseFloat(hourlyCalc.rendering) || 0) +
      (parseFloat(hourlyCalc.projectManagement) || 0) +
      (parseFloat(hourlyCalc.cloudStorage) || 0) +
      (parseFloat(hourlyCalc.otherSoftware) || 0) +
      (parseFloat(hourlyCalc.autocad) || 0) +
      (parseFloat(hourlyCalc.sketchup) || 0) +
      (parseFloat(hourlyCalc.adobe) || 0) +
      (parseFloat(hourlyCalc.promob) || 0) +
      (parseFloat(hourlyCalc.otherSoft) || 0);
    
    // Soma custos de equipe
    const teamCosts = 
      (parseFloat(hourlyCalc.prolabore) || 0) +
      (parseFloat(hourlyCalc.employees) || 0) +
      (parseFloat(hourlyCalc.accounting) || 0);
    
    // Soma custos de transporte
    const transportCosts = 
      (parseFloat(hourlyCalc.fuel) || 0) +
      (parseFloat(hourlyCalc.parking) || 0) +
      (parseFloat(hourlyCalc.publicTransport) || 0) +
      (parseFloat(hourlyCalc.vehicleMaintenance) || 0) +
      (parseFloat(hourlyCalc.transport) || 0);
    
    // Soma outros custos profissionais
    const professionalCosts = 
      (parseFloat(hourlyCalc.insurance) || 0) +
      (parseFloat(hourlyCalc.taxes) || 0) +
      (parseFloat(hourlyCalc.cau) || 0) +
      (parseFloat(hourlyCalc.courses) || 0) +
      (parseFloat(hourlyCalc.books) || 0) +
      (parseFloat(hourlyCalc.events) || 0) +
      (parseFloat(hourlyCalc.website) || 0) +
      (parseFloat(hourlyCalc.socialMedia) || 0) +
      (parseFloat(hourlyCalc.portfolio) || 0) +
      (parseFloat(hourlyCalc.meals) || 0) +
      (parseFloat(hourlyCalc.office) || 0) +
      (parseFloat(hourlyCalc.depreciation) || 0) +
      (parseFloat(hourlyCalc.others) || 0) +
      (parseFloat(hourlyCalc.marketing) || 0) +
      (parseFloat(hourlyCalc.officeMaterials) || 0) +
      (parseFloat(hourlyCalc.professionalAssociations) || 0) +
      (parseFloat(hourlyCalc.training) || 0);
    
    const totalMonthlyCost = fixedCosts + softwareCosts + teamCosts + transportCosts + professionalCosts;
    const hours = parseFloat(hourlyCalc.workHours) || 160;
    const margin = parseFloat(hourlyCalc.profitMargin) || 0;
    
    const baseCost = totalMonthlyCost / hours;
    const withMargin = baseCost * (1 + margin / 100);
    
    return {
      fixedCosts,
      softwareCosts,
      teamCosts,
      transportCosts,
      professionalCosts,
      totalMonthlyCost,
      hourlyRate: withMargin.toFixed(2)
    };
  };

  // Calculadora de Preço por m²
  const calculateSqmPrice = () => {
    const area = parseFloat(sqmCalc.area) || 0;
    const basePrice = parseFloat(sqmCalc.pricePerSqm) || 150;
    
    let multiplier = 1;
    
    // Multiplicador por complexidade
    if (sqmCalc.complexity === "low") multiplier *= 0.7;
    else if (sqmCalc.complexity === "high") multiplier *= 1.4;
    
    // Multiplicador por tipo de projeto
    if (sqmCalc.projectType === "commercial") multiplier *= 1.2;
    else if (sqmCalc.projectType === "corporate") multiplier *= 1.3;
    
    // Adicional se incluir acompanhamento de execução
    if (sqmCalc.includesExecution) multiplier *= 1.5;
    
    const total = area * basePrice * multiplier;
    return {
      baseValue: (area * basePrice).toFixed(2),
      total: total.toFixed(2),
      pricePerSqm: (total / area).toFixed(2)
    };
  };

  // Calculadora de Projeto Completo
  const calculateProjectTotal = () => {
    const hours = parseFloat(projectCalc.estimatedHours) || 0;
    const rate = parseFloat(projectCalc.hourlyRate) || 0;
    const margin = parseFloat(projectCalc.profitMargin) || 0;
    
    // Consultorias técnicas
    const consultancies = 
      (parseFloat(projectCalc.topography) || 0) +
      (parseFloat(projectCalc.soilAnalysis) || 0) +
      (parseFloat(projectCalc.structuralEngineering) || 0) +
      (parseFloat(projectCalc.electricalProject) || 0) +
      (parseFloat(projectCalc.hydraulicProject) || 0) +
      (parseFloat(projectCalc.airConditioning) || 0) +
      (parseFloat(projectCalc.landscaping) || 0) +
      (parseFloat(projectCalc.otherConsultancies) || 0);
    
    // Materiais e apresentação
    const materials = 
      (parseFloat(projectCalc.physicalModels) || 0) +
      (parseFloat(projectCalc.renderings3D) || 0) +
      (parseFloat(projectCalc.presentations) || 0) +
      (parseFloat(projectCalc.printing) || 0);
    
    // Legalização
    const legalization = 
      (parseFloat(projectCalc.permits) || 0) +
      (parseFloat(projectCalc.documentation) || 0);
    
    const labor = hours * rate;
    const subtotal = labor + consultancies + materials + legalization;
    const total = subtotal * (1 + margin / 100);
    
    return {
      labor: labor.toFixed(2),
      consultancies: consultancies.toFixed(2),
      materials: materials.toFixed(2),
      legalization: legalization.toFixed(2),
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2)
    };
  };

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Controle completo de receitas, despesas e análises
              {loadingFinance && <span className="ml-2 text-lumina-500">• Carregando...</span>}
            </p>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button variant="outline" className="gap-1.5 sm:gap-2 h-8 sm:h-9 lg:h-10 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button 
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 lg:h-10 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm"
              onClick={() => setShowAddTransactionForm(true)}
              disabled={loadingFinance}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Card className="p-1.5 sm:p-2">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Button
              variant={selectedTab === "dashboard" ? "default" : "ghost"}
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4"
              onClick={() => setSelectedTab("dashboard")}
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium">Dashboard</span>
            </Button>
            <Button
              variant={selectedTab === "payments" ? "default" : "ghost"}
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4"
              onClick={() => setSelectedTab("payments")}
            >
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium">Pagamentos</span>
            </Button>
            <Button
              variant={selectedTab === "calculators" ? "default" : "ghost"}
              className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4"
              onClick={() => setSelectedTab("calculators")}
            >
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium">Calculadoras</span>
            </Button>
          </div>
        </Card>

      {/* Dashboard Tab */}
      {selectedTab === "dashboard" && (
        <DashboardTab
          payments={payments}
          cashFlow={cashFlow}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          financialGoals={financialGoals}
          setShowGoalsModal={setShowGoalsModal}
        />
      )}

      {/* Payments Tab */}
      {selectedTab === "payments" && (
        <PaymentsTab
          payments={payments}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTransactionGroup={selectedTransactionGroup}
          setSelectedTransactionGroup={setSelectedTransactionGroup}
          handleDeleteTransaction={handleDeleteTransaction}
          handleDeleteInstallmentGroup={handleDeleteInstallmentGroup}
          onTransactionUpdated={loadFinanceData}
        />
      )}

      {/* Calculators Tab */}
      {selectedTab === "calculators" && (
        <CalculatorsTab
          hourlyCalc={hourlyCalc}
          setHourlyCalc={setHourlyCalc}
          sqmCalc={sqmCalc}
          setSqmCalc={setSqmCalc}
          projectCalc={projectCalc}
          setProjectCalc={setProjectCalc}
          calculateHourlyRate={calculateHourlyRate}
          calculateSqmPrice={calculateSqmPrice}
          calculateProjectTotal={calculateProjectTotal}
        />
      )}

      {/* Modal de Nova Transação - Novo Componente Melhorado */}
      {showAddTransactionForm && (
        <PaymentForm
          onClose={() => setShowAddTransactionForm(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Modal de Metas Financeiras */}
      {showGoalsModal && (
        <FinancialGoalsModal
          onClose={() => setShowGoalsModal(false)}
          onSave={(goals) => {
            setFinancialGoals(goals);
            setShowGoalsModal(false);
          }}
          currentGoals={financialGoals}
        />
      )}
      </div>
    </DynamicContainer>
  );
}
