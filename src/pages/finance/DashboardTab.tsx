import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface Payment {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  status: "pending" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  paidDate?: string;
  installments?: number;
  currentInstallment?: number;
}

interface DashboardTabProps {
  payments: Payment[];
  cashFlow: Array<{ month: string; income: number; expense: number }>;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  financialGoals: {
    monthlyRevenue: number;
    monthlyProfit: number;
    yearlyRevenue: number;
    savingsTarget: number;
    profitMargin: number;
  };
  setShowGoalsModal: (show: boolean) => void;
}

export function DashboardTab({
  payments,
  cashFlow,
  selectedMonth,
  setSelectedMonth,
  financialGoals,
  setShowGoalsModal,
}: DashboardTabProps) {
  // Parse do mês selecionado
  const [selectedYear, selectedMonthNum] = selectedMonth.split("-").map(Number);

  // Formatar nome do mês selecionado
  const selectedMonthShort = new Date(selectedYear, selectedMonthNum - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");

  const isSelectedMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return (
      date.getMonth() === selectedMonthNum - 1 &&
      date.getFullYear() === selectedYear
    );
  };

  const totalIncome = payments
    .filter((p) => {
      // Apenas receitas pagas
      if (p.type !== "income" || p.status !== "paid") return false;
      // Usar data de pagamento se existir, senão data de vencimento
      const dateToCheck = p.paidDate || p.dueDate;
      if (!isSelectedMonth(dateToCheck)) return false;
      return true;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpense = payments
    .filter((p) => {
      // Apenas despesas pagas
      if (p.type !== "expense" || p.status !== "paid") return false;
      // Usar data de pagamento se existir, senão data de vencimento
      const dateToCheck = p.paidDate || p.dueDate;
      if (!isSelectedMonth(dateToCheck)) return false;
      return true;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingIncome = payments
    .filter((p) => {
      // Apenas receitas pendentes
      if (p.type !== "income" || p.status !== "pending") return false;
      // Usar data de vencimento para pendentes
      if (!isSelectedMonth(p.dueDate)) return false;
      return true;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments.filter((p) => {
    // Pagamentos atrasados de qualquer tipo
    if (p.status !== "overdue") return false;
    // Usar data de vencimento para atrasados
    if (!isSelectedMonth(p.dueDate)) return false;
    return true;
  });

  const balance = totalIncome - totalExpense;
  const revenueProgress = (totalIncome / financialGoals.monthlyRevenue) * 100;
  const profitProgress = (balance / financialGoals.monthlyProfit) * 100;

  const maxValue =
    cashFlow.length > 0
      ? Math.max(...cashFlow.map((d) => Math.max(d.income, d.expense)))
      : 0;

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Filtro de Mês */}
      <Card className="bg-gradient-to-r from-lumina-50 to-violet-50 dark:from-lumina-950 dark:to-violet-950 border-2">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-lumina-100 dark:bg-lumina-900/30 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-lumina-600 dark:text-lumina-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm truncate">Período de Visualização</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Selecione o mês para análise
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Label htmlFor="monthFilter" className="text-xs sm:text-sm font-medium whitespace-nowrap">
                Mês:
              </Label>
              <Input
                id="monthFilter"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-[140px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Receitas */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">
                  Receitas - {selectedMonthShort}/{selectedYear}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  R$ {(totalIncome / 1000).toFixed(3)}k
                </p>
                <p className="text-[10px] sm:text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="truncate">Receitas pagas</span>
                </p>
              </div>
              <div className="p-2 sm:p-2.5 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <ArrowUpRight className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">
                  Despesas - {selectedMonthShort}/{selectedYear}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  R$ {(totalExpense / 1000).toFixed(3)}k
                </p>
                <p className="text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="truncate">Apenas pagas</span>
                </p>
              </div>
              <div className="p-2 sm:p-2.5 lg:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                <ArrowDownRight className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">
                  Saldo - {selectedMonthShort}/{selectedYear}
                </p>
                <p
                  className={cn(
                    "text-lg sm:text-xl lg:text-2xl font-bold truncate",
                    balance >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  R$ {(balance / 1000).toFixed(3)}k
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Receitas - Despesas</p>
              </div>
              <div
                className={cn(
                  "p-2 sm:p-2.5 lg:p-3 rounded-lg flex-shrink-0",
                  balance >= 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                )}
              >
                <TrendingUp
                  className={cn(
                    "h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6",
                    balance >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">A Receber</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">
                  R$ {(pendingIncome / 1000).toFixed(3)}k
                </p>
                <p className="text-[10px] sm:text-xs text-blue-600 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <span className="truncate">Receitas pendentes</span>
                </p>
              </div>
              <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagamentos Atrasados */}
      {overduePayments.length > 0 && (
        <Card className="border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-red-600 dark:text-red-400 flex items-center gap-1.5 sm:gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Pagamentos Atrasados ({overduePayments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              {overduePayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm lg:text-base truncate">{payment.description}</p>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">
                      Vencimento: {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-red-600 whitespace-nowrap">
                    R$ {payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fluxo de Caixa */}
      <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Fluxo de Caixa (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] flex items-end justify-between gap-1 sm:gap-1.5 lg:gap-2">
            {cashFlow.map((data, index) => {
              const incomeHeight = maxValue > 0 ? (data.income / maxValue) * 100 : 0;
              const expenseHeight = maxValue > 0 ? (data.expense / maxValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-1.5 lg:gap-2">
                  <div className="w-full flex gap-0.5 sm:gap-1 items-end h-[170px] sm:h-[210px] lg:h-[250px]">
                    <div
                      className="flex-1 bg-green-500 dark:bg-green-600 rounded-t hover:bg-green-600 dark:hover:bg-green-500 transition-colors relative group"
                      style={{ height: `${incomeHeight}%` }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap z-10">
                        R$ {(data.income / 1000).toFixed(3)}k
                      </div>
                    </div>
                    <div
                      className="flex-1 bg-red-500 dark:bg-red-600 rounded-t hover:bg-red-600 dark:hover:bg-red-500 transition-colors relative group"
                      style={{ height: `${expenseHeight}%` }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap z-10">
                        R$ {(data.expense / 1000).toFixed(3)}k
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground font-medium">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
              <span className="text-xs sm:text-sm">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
              <span className="text-xs sm:text-sm">Despesas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metas Financeiras */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Metas Financeiras
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowGoalsModal(true)} className="h-7 sm:h-8 text-xs sm:text-sm">
            Editar Metas
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
          {/* Meta de Receita Mensal */}
          <div>
            <div className="flex justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium truncate">Meta de Receita Mensal</span>
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap ml-2">
                {revenueProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
              <div
                className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all",
                  revenueProgress >= 100 ? "bg-green-500" : "bg-blue-500"
                )}
                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              R$ {(totalIncome / 1000).toFixed(3)}k / R${" "}
              {(financialGoals.monthlyRevenue / 1000).toFixed(3)}k
            </p>
          </div>

          {/* Meta de Lucro Mensal */}
          <div>
            <div className="flex justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium truncate">Meta de Lucro Mensal</span>
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap ml-2">
                {profitProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
              <div
                className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all",
                  profitProgress >= 100 ? "bg-green-500" : "bg-orange-500"
                )}
                style={{ width: `${Math.min(profitProgress, 100)}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              R$ {(balance / 1000).toFixed(3)}k / R${" "}
              {(financialGoals.monthlyProfit / 1000).toFixed(3)}k
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
