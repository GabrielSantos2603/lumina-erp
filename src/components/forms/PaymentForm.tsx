import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  DollarSign,
  Calendar as CalendarIcon,
  Percent,
  Check
} from "lucide-react";
import { cn } from "@/utils/cn";
import { projectService } from "@/services/projectService";
import { clientService } from "@/services/clientService";
import { financeService, type TransactionType, type PaymentMethod, type TransactionStatus } from "@/services/financeService";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface InstallmentDetail {
  number: number;
  dueDate: string;
  amount: number;
  status: TransactionStatus;
  interest: number;
  finalAmount: number;
  paid: boolean;
}

interface PaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const incomeCategories = [
  "Projeto Arquitetônico",
  "Design de Interiores",
  "Consultoria",
  "Acompanhamento de Obra",
  "Projeto de Paisagismo",
  "Projeto Luminotécnico",
  "Renders e Visualizações",
  "Outros Serviços"
];

const expenseCategories = [
  // Despesas Operacionais
  "Aluguel do Escritório",
  "Condomínio",
  "Energia Elétrica",
  "Água",
  "Internet e Telefonia",
  "Limpeza e Manutenção",
  
  // Recursos Humanos
  "Salários e Pró-labore",
  "Encargos Trabalhistas",
  "Benefícios (VT, VR, VA)",
  "Treinamentos",
  
  // Tecnologia e Software
  "Software e Licenças",
  "Hospedagem e Domínio",
  "Equipamentos de TI",
  "Manutenção de Equipamentos",
  
  // Marketing e Vendas
  "Marketing Digital",
  "Publicidade",
  "Materiais Gráficos",
  "Eventos e Networking",
  
  // Operacional
  "Materiais de Escritório",
  "Materiais de Obra",
  "Transportes e Combustível",
  "Correios e Entregas",
  
  // Profissionais e Serviços
  "Consultoria Externa",
  "Serviços Contábeis",
  "Serviços Jurídicos",
  "Serviços de Design",
  
  // Impostos e Taxas
  "Impostos Federais",
  "Impostos Estaduais",
  "Impostos Municipais",
  "Taxas Bancárias",
  "Taxas de Cartão",
  
  // Outros
  "Seguros",
  "Depreciação",
  "Multas e Juros",
  "Outros"
];

export function PaymentForm({ onClose, onSuccess }: PaymentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    // Etapa 1: Informações Básicas
    type: "income" as TransactionType,
    description: "",
    amount: "",
    category: "",
    dueDate: "",
    
    // Etapa 2: Método e Status
    method: "pix" as PaymentMethod,
    status: "pending" as TransactionStatus,
    paidDate: "",
    
    // Etapa 3: Vinculação (MELHORADO)
    projectId: "",
    projectName: "",
    clientId: "",
    clientName: "",
    companyId: "", // NOVO: vincular à empresa
    linkToCompany: false, // NOVO: checkbox para vincular à empresa
    notes: "",
    
    // Etapa 4: Parcelamento (NOVO)
    hasInstallments: false,
    installments: "",
    interestRate: "", // Taxa de juros por parcela (%)
    applyInterest: false,
    
    // Recorrência (NOVO)
    hasRecurrence: false,
    recurrenceFrequency: "monthly" as "monthly" | "quarterly" | "yearly",
    recurrenceMonths: "12", // Quantos meses criar
  });

  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string; client_id?: string; client_name?: string }>>([]);
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [installmentDetails, setInstallmentDetails] = useState<InstallmentDetail[]>([]);
  const [userCompany, setUserCompany] = useState<{ id: string; name: string } | null>(null);

  // Carregar projetos e clientes
  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const [projects, clients, company] = await Promise.all([
        projectService.getAllProjects(),
        clientService.getAllClients(),
        loadUserCompany(),
      ]);
      
      setProjectOptions((projects || []).map((p) => ({ 
        id: p.id, 
        name: p.name,
        client_id: p.client_id,
        client_name: p.client_name
      })));
      
      setClientOptions((clients || []).map((c) => ({ id: c.id, name: c.name })));
      
      if (company) {
        setUserCompany(company);
      }
    } catch (e) {
      console.error("Erro carregando opções:", e);
      toast.error("Erro ao carregar projetos e clientes");
    }
  }

  async function loadUserCompany() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("companies")
        .select("id, company_name")
        .eq("user_id", user.id)
        .single();

      if (error || !data) return null;
      
      return { id: data.id, name: data.company_name };
    } catch (e) {
      console.error("Erro carregando empresa:", e);
      return null;
    }
  }

  // NOVO: Quando selecionar um projeto, automaticamente selecionar o cliente vinculado
  useEffect(() => {
    if (formData.projectId) {
      const project = projectOptions.find(p => p.id === formData.projectId);
      if (project?.client_id && project?.client_name) {
        setFormData(prev => ({
          ...prev,
          clientId: project.client_id || "",
          clientName: project.client_name || ""
        }));
      }
    }
  }, [formData.projectId, projectOptions]);

  // NOVO: Calcular detalhes das parcelas com juros
  useEffect(() => {
    if (formData.hasInstallments && formData.installments && parseInt(formData.installments) > 0) {
      calculateInstallments();
    } else {
      setInstallmentDetails([]);
    }
  }, [formData.hasInstallments, formData.installments, formData.amount, formData.dueDate, formData.applyInterest, formData.interestRate]);

  function calculateInstallments() {
    const totalInstallments = parseInt(formData.installments || "1");
    const totalAmount = parseFloat(formData.amount || "0");
    const baseDate = formData.dueDate ? new Date(formData.dueDate) : new Date();
    const interestRate = formData.applyInterest ? parseFloat(formData.interestRate || "0") / 100 : 0;

    const details: InstallmentDetail[] = [];
    const baseInstallmentAmount = totalAmount / totalInstallments;

    for (let i = 1; i <= totalInstallments; i++) {
      // Calcular data de vencimento (mensal)
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(baseDate.getMonth() + (i - 1));
      
      // Calcular juros acumulados (juros compostos)
      const interest = formData.applyInterest ? baseInstallmentAmount * Math.pow(1 + interestRate, i) - baseInstallmentAmount : 0;
      const finalAmount = baseInstallmentAmount + interest;

      details.push({
        number: i,
        dueDate: installmentDate.toISOString().split('T')[0],
        amount: baseInstallmentAmount,
        status: "pending",
        interest,
        finalAmount,
        paid: false
      });
    }

    setInstallmentDetails(details);
  }

  // NOVO: Alternar status de parcela individual
  function toggleInstallmentPaid(index: number) {
    setInstallmentDetails(prev => prev.map((inst, idx) => 
      idx === index 
        ? { ...inst, paid: !inst.paid, status: !inst.paid ? "paid" : "pending" as TransactionStatus }
        : inst
    ));
  }

  const handleNextStep = () => {
    // Validações por etapa
    if (currentStep === 1) {
      if (!formData.description || !formData.amount || !formData.category || !formData.dueDate) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.method) {
        toast.error("Selecione um método de pagamento");
        return;
      }
      if (formData.status === "paid" && !formData.paidDate) {
        toast.error("Informe a data do pagamento");
        return;
      }
    }

    if (currentStep === 3 && formData.hasInstallments) {
      if (!formData.installments || parseInt(formData.installments) < 2) {
        toast.error("Informe o número de parcelas (mínimo 2)");
        return;
      }
    }

    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Se tem parcelamento, criar múltiplas transações
      if (formData.hasInstallments && installmentDetails.length > 0) {
        for (const installment of installmentDetails) {
          await financeService.createTransaction({
            user_id: user.id,
            description: `${formData.description} - Parcela ${installment.number}/${installmentDetails.length}`,
            amount: installment.finalAmount, // Valor com juros
            type: formData.type,
            category: formData.category,
            method: formData.method,
            status: installment.status,
            due_date: installment.dueDate,
            paid_date: installment.paid ? installment.dueDate : null,
            project_id: formData.projectId || null,
            project_name: formData.projectName || null,
            client_id: formData.clientId || null,
            client_name: formData.clientName || null,
            company_id: formData.companyId || null, // NOVO: vincular à empresa
            installments: installmentDetails.length,
            current_installment: installment.number,
            notes: formData.notes || null,
          } as any);
        }
        
        toast.success(`${installmentDetails.length} parcelas criadas com sucesso!`);
      } else if (formData.hasRecurrence && formData.recurrenceMonths && parseInt(formData.recurrenceMonths) > 0) {
        // Transação recorrente - criar múltiplas transações com base na frequência
        const months = parseInt(formData.recurrenceMonths);
        const baseDate = new Date(formData.dueDate);
        let transactionsCreated = 0;
        
        for (let i = 0; i < months; i++) {
          const nextDate = new Date(baseDate);
          
          if (formData.recurrenceFrequency === "monthly") {
            nextDate.setMonth(baseDate.getMonth() + i);
          } else if (formData.recurrenceFrequency === "quarterly") {
            nextDate.setMonth(baseDate.getMonth() + (i * 3));
          } else if (formData.recurrenceFrequency === "yearly") {
            nextDate.setFullYear(baseDate.getFullYear() + i);
          }
          
          await financeService.createTransaction({
            user_id: user.id,
            description: formData.description,
            amount: parseFloat(formData.amount),
            type: formData.type,
            category: formData.category,
            method: formData.method,
            status: "pending", // Todas começam pendentes
            due_date: nextDate.toISOString().split('T')[0],
            paid_date: null,
            project_id: formData.projectId || null,
            project_name: formData.projectName || null,
            client_id: formData.clientId || null,
            client_name: formData.clientName || null,
            company_id: formData.companyId || null, // NOVO: vincular à empresa
            installments: null,
            current_installment: null,
            notes: formData.notes ? `${formData.notes} (Recorrente - ${formData.recurrenceFrequency})` : `Recorrente - ${formData.recurrenceFrequency}`,
          } as any);
          
          transactionsCreated++;
        }
        
        toast.success(`${transactionsCreated} transações recorrentes criadas com sucesso!`);
      } else {
        // Transação única
        await financeService.createTransaction({
          user_id: user.id,
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          method: formData.method,
          status: formData.status,
          due_date: formData.dueDate,
          paid_date: formData.status === "paid" ? formData.paidDate || formData.dueDate : null,
          project_id: formData.projectId || null,
          project_name: formData.projectName || null,
          client_id: formData.clientId || null,
          client_name: formData.clientName || null,
          company_id: formData.companyId || null, // NOVO: vincular à empresa
          installments: null,
          current_installment: null,
          notes: formData.notes || null,
        } as any);
        
        toast.success("Transação criada com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      toast.error("Erro ao criar transação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const totalWithInterest = installmentDetails.reduce((sum, inst) => sum + inst.finalAmount, 0);
  const totalInterest = installmentDetails.reduce((sum, inst) => sum + inst.interest, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b bg-gradient-to-r from-lumina-500 to-lumina-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Nova Transação Financeira</CardTitle>
              <p className="text-sm text-white/90 mt-1">
                {formData.type === "income" ? "💰 Receita" : "💸 Despesa"} - Etapa {currentStep} de 4
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  step <= currentStep ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>

          {/* Steps navigation */}
          <div className="flex gap-2 mt-3 text-xs">
            <button
              onClick={() => setCurrentStep(1)}
              className={cn(
                "flex-1 px-2 py-1 rounded transition-colors",
                currentStep === 1 ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              1. Básico
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className={cn(
                "flex-1 px-2 py-1 rounded transition-colors",
                currentStep === 2 ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              2. Pagamento
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={cn(
                "flex-1 px-2 py-1 rounded transition-colors",
                currentStep === 3 ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              3. Vinculação
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className={cn(
                "flex-1 px-2 py-1 rounded transition-colors",
                currentStep === 4 ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              4. Parcelamento
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Etapa 1: Informações Básicas */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Transação *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "income"})}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      formData.type === "income"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-muted hover:border-green-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Receita</p>
                        <p className="text-xs text-muted-foreground">Entrada de dinheiro</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "expense"})}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      formData.type === "expense"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-muted hover:border-red-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Despesa</p>
                        <p className="text-xs text-muted-foreground">Saída de dinheiro</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Projeto Casa Moderna - Entrada..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor Total *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0,00"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm h-10"
                    required
                  >
                    <option value="">Selecione...</option>
                    {formData.type === "income" ? (
                      incomeCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <>
                        <optgroup label="💼 Despesas Operacionais">
                          <option value="Aluguel do Escritório">Aluguel do Escritório</option>
                          <option value="Condomínio">Condomínio</option>
                          <option value="Energia Elétrica">Energia Elétrica</option>
                          <option value="Água">Água</option>
                          <option value="Internet e Telefonia">Internet e Telefonia</option>
                          <option value="Limpeza e Manutenção">Limpeza e Manutenção</option>
                        </optgroup>
                        <optgroup label="👥 Recursos Humanos">
                          <option value="Salários e Pró-labore">Salários e Pró-labore</option>
                          <option value="Encargos Trabalhistas">Encargos Trabalhistas</option>
                          <option value="Benefícios (VT, VR, VA)">Benefícios (VT, VR, VA)</option>
                          <option value="Treinamentos">Treinamentos</option>
                        </optgroup>
                        <optgroup label="💻 Tecnologia e Software">
                          <option value="Software e Licenças">Software e Licenças</option>
                          <option value="Hospedagem e Domínio">Hospedagem e Domínio</option>
                          <option value="Equipamentos de TI">Equipamentos de TI</option>
                          <option value="Manutenção de Equipamentos">Manutenção de Equipamentos</option>
                        </optgroup>
                        <optgroup label="📢 Marketing e Vendas">
                          <option value="Marketing Digital">Marketing Digital</option>
                          <option value="Publicidade">Publicidade</option>
                          <option value="Materiais Gráficos">Materiais Gráficos</option>
                          <option value="Eventos e Networking">Eventos e Networking</option>
                        </optgroup>
                        <optgroup label="📦 Operacional">
                          <option value="Materiais de Escritório">Materiais de Escritório</option>
                          <option value="Materiais de Obra">Materiais de Obra</option>
                          <option value="Transportes e Combustível">Transportes e Combustível</option>
                          <option value="Correios e Entregas">Correios e Entregas</option>
                        </optgroup>
                        <optgroup label="🤝 Profissionais e Serviços">
                          <option value="Consultoria Externa">Consultoria Externa</option>
                          <option value="Serviços Contábeis">Serviços Contábeis</option>
                          <option value="Serviços Jurídicos">Serviços Jurídicos</option>
                          <option value="Serviços de Design">Serviços de Design</option>
                        </optgroup>
                        <optgroup label="📊 Impostos e Taxas">
                          <option value="Impostos Federais">Impostos Federais</option>
                          <option value="Impostos Estaduais">Impostos Estaduais</option>
                          <option value="Impostos Municipais">Impostos Municipais</option>
                          <option value="Taxas Bancárias">Taxas Bancárias</option>
                          <option value="Taxas de Cartão">Taxas de Cartão</option>
                        </optgroup>
                        <optgroup label="🔧 Outros">
                          <option value="Seguros">Seguros</option>
                          <option value="Depreciação">Depreciação</option>
                          <option value="Multas e Juros">Multas e Juros</option>
                          <option value="Outros">Outros</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Método e Status de Pagamento */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Método de Pagamento *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: "pix", label: "PIX", icon: "💳" },
                    { value: "boleto", label: "Boleto", icon: "📄" },
                    { value: "card", label: "Cartão", icon: "💳" },
                    { value: "transfer", label: "Transferência", icon: "🏦" },
                    { value: "cash", label: "Dinheiro", icon: "💵" },
                    { value: "other", label: "Outro", icon: "📝" }
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({...formData, method: method.value as PaymentMethod})}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all",
                        formData.method === method.value
                          ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                          : "border-muted hover:border-lumina-300"
                      )}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <p className="text-sm font-medium">{method.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as TransactionStatus})}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm h-10"
                  required
                >
                  <option value="pending">⏳ Pendente</option>
                  <option value="paid">✅ Pago</option>
                  <option value="overdue">⚠️ Atrasado</option>
                  <option value="cancelled">❌ Cancelado</option>
                </select>
              </div>

              {formData.status === "paid" && (
                <div className="space-y-2">
                  <Label htmlFor="paidDate">Data do Pagamento *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="paidDate"
                      type="date"
                      value={formData.paidDate || formData.dueDate}
                      onChange={(e) => setFormData({...formData, paidDate: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Etapa 3: Vinculação (MELHORADO) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Projeto Vinculado</Label>
                <select
                  id="project"
                  value={formData.projectId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const project = projectOptions.find(p => p.id === id);
                    setFormData({
                      ...formData, 
                      projectId: id, 
                      projectName: project?.name || ""
                    });
                  }}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm h-10"
                >
                  <option value="">Nenhum projeto</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Ao selecionar um projeto, o cliente será preenchido automaticamente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <select
                  id="client"
                  value={formData.clientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const client = clientOptions.find(c => c.id === id);
                    setFormData({
                      ...formData, 
                      clientId: id, 
                      clientName: client?.name || ""
                    });
                  }}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm h-10"
                >
                  <option value="">Nenhum cliente</option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {formData.projectId && formData.clientId && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Cliente vinculado ao projeto selecionado
                  </div>
                )}
              </div>

              {/* NOVO: Vincular à Empresa (apenas para despesas) */}
              {formData.type === "expense" && userCompany && (
                <div className="space-y-3 p-4 rounded-lg border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/20">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="linkToCompany"
                      checked={formData.linkToCompany}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData({
                          ...formData, 
                          linkToCompany: isChecked,
                          companyId: isChecked ? userCompany.id : ""
                        });
                      }}
                      className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="linkToCompany" className="font-medium cursor-pointer">
                        Vincular à minha empresa
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Esta despesa será contabilizada como custo operacional de <strong>{userCompany.name}</strong>
                      </p>
                    </div>
                  </div>
                  {formData.linkToCompany && (
                    <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Despesa vinculada à empresa
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px] resize-none"
                  placeholder="Adicione observações relevantes sobre esta transação..."
                />
              </div>
            </div>
          )}

          {/* Etapa 4: Parcelamento (NOVO E MELHORADO) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-3 p-4 rounded-lg border-2 border-lumina-200 dark:border-lumina-800 bg-lumina-50/50 dark:bg-lumina-900/20">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasInstallments"
                    checked={formData.hasInstallments}
                    onChange={(e) => setFormData({...formData, hasInstallments: e.target.checked})}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="hasInstallments" className="cursor-pointer font-semibold">
                    Parcelar este pagamento
                  </Label>
                </div>

                {formData.hasInstallments && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="installments">Número de Parcelas *</Label>
                        <Input
                          id="installments"
                          type="number"
                          min="2"
                          max="60"
                          value={formData.installments}
                          onChange={(e) => setFormData({...formData, installments: e.target.value})}
                          placeholder="Ex: 12"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="applyInterest"
                            checked={formData.applyInterest}
                            onChange={(e) => setFormData({...formData, applyInterest: e.target.checked})}
                            className="h-4 w-4 rounded border-input"
                          />
                          <Label htmlFor="applyInterest" className="cursor-pointer text-xs">
                            Aplicar Juros
                          </Label>
                        </div>
                        {formData.applyInterest && (
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="interestRate"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.interestRate}
                              onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                              placeholder="Ex: 1.5"
                              className="pl-10"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {installmentDetails.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Parcelas Detalhadas</h4>
                          <Badge variant="secondary">
                            {installmentDetails.filter(i => i.paid).length}/{installmentDetails.length} pagas
                          </Badge>
                        </div>

                        {/* Resumo */}
                        <div className="grid grid-cols-3 gap-2 text-xs bg-muted/50 p-3 rounded-lg">
                          <div>
                            <p className="text-muted-foreground">Valor Original</p>
                            <p className="font-bold">R$ {parseFloat(formData.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          </div>
                          {formData.applyInterest && (
                            <>
                              <div>
                                <p className="text-muted-foreground">Total Juros</p>
                                <p className="font-bold text-orange-600">+R$ {totalInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Final</p>
                                <p className="font-bold text-green-600">R$ {totalWithInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Lista de Parcelas */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
                          {installmentDetails.map((installment, index) => (
                            <div
                              key={index}
                              className={cn(
                                "p-3 rounded-lg border-2 transition-all cursor-pointer",
                                installment.paid
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-muted hover:border-lumina-300"
                              )}
                              onClick={() => toggleInstallmentPaid(index)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    installment.paid ? "bg-green-500 text-white" : "bg-muted"
                                  )}>
                                    {installment.paid ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{installment.number}</span>}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">
                                      Parcela {installment.number}/{installmentDetails.length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Venc: {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">
                                    R$ {installment.finalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </p>
                                  {formData.applyInterest && installment.interest > 0 && (
                                    <p className="text-xs text-orange-600">
                                      +R$ {installment.interest.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} juros
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p>
                            <strong>Dica:</strong> Clique em cada parcela para marcar como paga ou pendente. 
                            O sistema criará {installmentDetails.length} transações no banco de dados.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seção de Recorrência (NOVO) */}
              {!formData.hasInstallments && (
                <div className="space-y-3 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasRecurrence"
                      checked={formData.hasRecurrence}
                      onChange={(e) => setFormData({...formData, hasRecurrence: e.target.checked})}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="hasRecurrence" className="cursor-pointer font-semibold">
                      Transação Recorrente (Repetir automaticamente)
                    </Label>
                  </div>

                  {formData.hasRecurrence && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="recurrenceFrequency">Frequência *</Label>
                          <select
                            id="recurrenceFrequency"
                            value={formData.recurrenceFrequency}
                            onChange={(e) => setFormData({...formData, recurrenceFrequency: e.target.value as "monthly" | "quarterly" | "yearly"})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="monthly">Mensal (Todo mês)</option>
                            <option value="quarterly">Trimestral (A cada 3 meses)</option>
                            <option value="yearly">Anual (Todo ano)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recurrenceMonths">Criar para quantos meses? *</Label>
                          <Input
                            id="recurrenceMonths"
                            type="number"
                            min="1"
                            max="24"
                            value={formData.recurrenceMonths}
                            onChange={(e) => setFormData({...formData, recurrenceMonths: e.target.value})}
                            placeholder="Ex: 12 (um ano)"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        <AlertCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold mb-1">Como funciona:</p>
                          <ul className="space-y-1">
                            <li>• O sistema criará automaticamente transações futuras conforme a frequência escolhida</li>
                            <li>• Por exemplo: Escolhendo "Mensal" e "12 meses", serão criadas 12 transações (uma por mês)</li>
                            <li>• Todas terão o mesmo valor, descrição e categoria</li>
                            <li>• Perfeito para contas fixas como aluguel, assinaturas, salários, etc.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Preview de recorrência */}
                      {formData.hasRecurrence && formData.dueDate && formData.recurrenceMonths && (
                        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                          <p className="text-xs font-semibold text-muted-foreground">Preview das próximas transações:</p>
                          <div className="max-h-[150px] overflow-y-auto space-y-1 text-xs">
                            {Array.from({ length: Math.min(parseInt(formData.recurrenceMonths) || 1, 12) }).map((_, index) => {
                              const baseDate = new Date(formData.dueDate);
                              let nextDate = new Date(baseDate);
                              
                              if (formData.recurrenceFrequency === "monthly") {
                                nextDate.setMonth(baseDate.getMonth() + index);
                              } else if (formData.recurrenceFrequency === "quarterly") {
                                nextDate.setMonth(baseDate.getMonth() + (index * 3));
                              } else if (formData.recurrenceFrequency === "yearly") {
                                nextDate.setFullYear(baseDate.getFullYear() + index);
                              }
                              
                              return (
                                <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                                  <span className="font-medium">{index + 1}. {formData.description || "Descrição"}</span>
                                  <span className="text-muted-foreground">{nextDate.toLocaleDateString("pt-BR")}</span>
                                </div>
                              );
                            })}
                          </div>
                          {parseInt(formData.recurrenceMonths) > 12 && (
                            <p className="text-xs text-muted-foreground italic">
                              + {parseInt(formData.recurrenceMonths) - 12} transações adicionais...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Resumo Final */}
              <div className="bg-lumina-50 dark:bg-lumina-900/20 rounded-lg p-4 space-y-3 border-2 border-lumina-200 dark:border-lumina-800">
                <div className="flex items-center gap-2 text-lumina-600 dark:text-lumina-400">
                  <Receipt className="h-5 w-5" />
                  <span className="font-semibold">Resumo da Transação</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <Badge variant={formData.type === "income" ? "default" : "destructive"}>
                      {formData.type === "income" ? "💰 Receita" : "💸 Despesa"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium">{formData.description || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span>{formData.category || "-"}</span>
                  </div>
                  {formData.projectName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projeto:</span>
                      <span className="font-medium">{formData.projectName}</span>
                    </div>
                  )}
                  {formData.clientName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">{formData.clientName}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    {formData.hasInstallments && installmentDetails.length > 0 ? (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Valor Original:</span>
                          <span>R$ {parseFloat(formData.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        {formData.applyInterest && (
                          <>
                            <div className="flex justify-between text-xs text-orange-600 mb-1">
                              <span>Juros ({formData.interestRate}% ao mês):</span>
                              <span>+R$ {totalInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-green-600">
                              <span>Total com Juros:</span>
                              <span>R$ {totalWithInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between text-sm mt-2">
                          <span>Parcelamento:</span>
                          <span className="font-semibold">
                            {installmentDetails.length}x de R$ {(totalWithInterest / installmentDetails.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Transações a criar:</span>
                          <span>{installmentDetails.length} parcelas</span>
                        </div>
                      </>
                    ) : formData.hasRecurrence && formData.recurrenceMonths ? (
                      <>
                        <div className="flex justify-between font-bold text-xl mb-2">
                          <span>Valor por Transação:</span>
                          <span className={formData.type === "income" ? "text-green-600" : "text-red-600"}>
                            R$ {parseFloat(formData.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Recorrência:</span>
                            <span className="font-semibold text-purple-600">
                              {formData.recurrenceFrequency === "monthly" && "Mensal"}
                              {formData.recurrenceFrequency === "quarterly" && "Trimestral"}
                              {formData.recurrenceFrequency === "yearly" && "Anual"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Transações a criar:</span>
                            <span className="font-semibold">{formData.recurrenceMonths}x</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                            <span>Valor Total Recorrente:</span>
                            <span className="font-bold">
                              R$ {(parseFloat(formData.amount || "0") * parseInt(formData.recurrenceMonths)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between font-bold text-xl">
                        <span>Valor Total:</span>
                        <span className={formData.type === "income" ? "text-green-600" : "text-red-600"}>
                          R$ {parseFloat(formData.amount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-4 bg-muted/30">
          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNextStep}
                  className="gap-2"
                  disabled={loading}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.description || !formData.amount}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {formData.hasInstallments && installmentDetails.length > 0 
                        ? `Criar ${installmentDetails.length} Parcelas` 
                        : "Salvar Transação"
                      }
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
