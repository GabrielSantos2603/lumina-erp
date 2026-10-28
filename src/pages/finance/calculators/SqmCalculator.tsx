import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

interface SqmCalculatorProps {
  sqmCalc: any;
  setSqmCalc: (calc: any) => void;
  calculateSqmPrice: () => any;
  onBack: () => void;
}

export function SqmCalculator({
  sqmCalc,
  setSqmCalc,
  calculateSqmPrice,
  onBack,
}: SqmCalculatorProps) {
  const result = calculateSqmPrice();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Calculadora de Preço por m²</h2>
          <p className="text-sm text-muted-foreground">
            Calcule o valor baseado na área do projeto
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Área Total (m²)</Label>
                <Input
                  type="number"
                  placeholder="120"
                  value={sqmCalc.area || ""}
                  onChange={(e) => setSqmCalc({...sqmCalc, area: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Preço Base por m² (R$)</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={sqmCalc.pricePerSqm || ""}
                  onChange={(e) => setSqmCalc({...sqmCalc, pricePerSqm: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Projeto</Label>
                <select 
                  className="w-full p-3 border rounded-md bg-background"
                  value={sqmCalc.projectType || "residential"}
                  onChange={(e) => setSqmCalc({...sqmCalc, projectType: e.target.value})}
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial (+20%)</option>
                  <option value="corporate">Corporativo (+30%)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Complexidade</Label>
                <select 
                  className="w-full p-3 border rounded-md bg-background"
                  value={sqmCalc.complexity || "medium"}
                  onChange={(e) => setSqmCalc({...sqmCalc, complexity: e.target.value})}
                >
                  <option value="low">Baixa (-30%)</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta (+40%)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <input
                  type="checkbox"
                  id="execution"
                  checked={sqmCalc.includesExecution || false}
                  onChange={(e) => setSqmCalc({...sqmCalc, includesExecution: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="execution" className="text-sm">
                  Inclui acompanhamento de execução (+50%)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                💡 Dicas de Precificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-orange-700 dark:text-orange-300">
              <div>
                <strong>Residencial:</strong> Projetos residenciais padrão, casas e apartamentos.
              </div>
              <div>
                <strong>Comercial:</strong> Lojas, escritórios, consultórios (+20%).
              </div>
              <div>
                <strong>Corporativo:</strong> Grandes empresas, complexos (+30%).
              </div>
              <div>
                <strong>Acompanhamento:</strong> Visitas técnicas e supervisão da obra.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-300 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300">
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor Total do Projeto</p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                R$ {result.total || "0,00"}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between">
                <span>Área do projeto:</span>
                <span className="font-medium">{sqmCalc.area || 0} m²</span>
              </div>
              <div className="flex justify-between">
                <span>Preço base por m²:</span>
                <span className="font-medium">R$ {sqmCalc.pricePerSqm || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor base:</span>
                <span className="font-medium">R$ {result.baseValue || "0,00"}</span>
              </div>
              <div className="flex justify-between">
                <span>Multiplicador total:</span>
                <span className="font-medium text-green-600">{result.multiplier || 1}x</span>
              </div>
            </div>

            <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-4 mt-6">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                📊 Detalhamento
              </h4>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="capitalize">{sqmCalc.projectType || "residential"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Complexidade:</span>
                  <span className="capitalize">{sqmCalc.complexity || "medium"}</span>
                </div>
                {sqmCalc.includesExecution && (
                  <div className="flex justify-between">
                    <span>Acompanhamento:</span>
                    <span className="text-green-700 dark:text-green-300 font-medium">✓ Incluído</span>
                  </div>
                )}
              </div>
            </div>

            {/* Variações de preço */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Valor Mínimo</p>
                <p className="text-lg font-bold text-gray-600">
                  R$ {((parseFloat(result.total) || 0) * 0.9).toFixed(2)}
                </p>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Valor Premium</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {((parseFloat(result.total) || 0) * 1.2).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}