import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Target, TrendingUp, DollarSign, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface FinancialGoals {
  monthlyRevenue: number;
  monthlyProfit: number;
  yearlyRevenue: number;
  savingsTarget: number;
  profitMargin: number;
}

interface FinancialGoalsModalProps {
  onClose: () => void;
  onSave: (goals: FinancialGoals) => void;
  currentGoals?: FinancialGoals;
}

export function FinancialGoalsModal({ onClose, onSave, currentGoals }: FinancialGoalsModalProps) {
  const [goals, setGoals] = useState<FinancialGoals>(
    currentGoals || {
      monthlyRevenue: 60000,
      monthlyProfit: 20000,
      yearlyRevenue: 720000,
      savingsTarget: 100000,
      profitMargin: 30,
    }
  );

  useEffect(() => {
    // Carregar metas do localStorage
    const savedGoals = localStorage.getItem("financialGoals");
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  const handleSave = () => {
    // Validações
    if (goals.monthlyRevenue <= 0) {
      toast.error("A meta mensal de receita deve ser maior que zero");
      return;
    }

    // Salvar no localStorage
    localStorage.setItem("financialGoals", JSON.stringify(goals));
    
    toast.success("Metas financeiras atualizadas com sucesso!");
    onSave(goals);
    onClose();
  };

  const handleChange = (field: keyof FinancialGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setGoals(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b bg-gradient-to-r from-lumina-500 to-lumina-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Metas Financeiras</CardTitle>
                <p className="text-sm text-white/90 mt-1">
                  Defina suas metas e acompanhe seu progresso
                </p>
              </div>
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
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Meta Mensal de Receita */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label className="text-base font-semibold">Meta Mensal de Receita</Label>
                <p className="text-xs text-muted-foreground">
                  Quanto você deseja faturar por mês
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                placeholder="60000"
                value={goals.monthlyRevenue || ""}
                onChange={(e) => handleChange("monthlyRevenue", e.target.value)}
                className="pl-10 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Meta Mensal de Lucro */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-lumina-100 dark:bg-lumina-900/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-lumina-600 dark:text-lumina-400" />
              </div>
              <div>
                <Label className="text-base font-semibold">Meta Mensal de Lucro</Label>
                <p className="text-xs text-muted-foreground">
                  Lucro líquido desejado após despesas
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                placeholder="20000"
                value={goals.monthlyProfit || ""}
                onChange={(e) => handleChange("monthlyProfit", e.target.value)}
                className="pl-10 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Meta Anual de Receita */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label className="text-base font-semibold">Meta Anual de Receita</Label>
                <p className="text-xs text-muted-foreground">
                  Faturamento total desejado no ano
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                placeholder="720000"
                value={goals.yearlyRevenue || ""}
                onChange={(e) => handleChange("yearlyRevenue", e.target.value)}
                className="pl-10 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Meta de Economia/Reserva */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Label className="text-base font-semibold">Meta de Reserva Financeira</Label>
                <p className="text-xs text-muted-foreground">
                  Valor que deseja ter em reserva de emergência
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                placeholder="100000"
                value={goals.savingsTarget || ""}
                onChange={(e) => handleChange("savingsTarget", e.target.value)}
                className="pl-10 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Margem de Lucro Desejada */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <Label className="text-base font-semibold">Margem de Lucro Desejada</Label>
                <p className="text-xs text-muted-foreground">
                  Percentual de lucro sobre receita
                </p>
              </div>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="30"
                value={goals.profitMargin || ""}
                onChange={(e) => handleChange("profitMargin", e.target.value)}
                className="text-lg font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>

          {/* Preview das Metas */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">📊 Resumo das Metas</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Receita Mensal</p>
                <p className="font-bold text-green-600">
                  R$ {goals.monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lucro Mensal</p>
                <p className="font-bold text-lumina-600">
                  R$ {goals.monthlyProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Receita Anual</p>
                <p className="font-bold text-blue-600">
                  R$ {goals.yearlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reserva</p>
                <p className="font-bold text-purple-600">
                  R$ {goals.savingsTarget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-lumina-600 hover:bg-lumina-700"
              onClick={handleSave}
            >
              <Target className="h-4 w-4 mr-2" />
              Salvar Metas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
