import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Edit2,
  Check,
  X,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save
} from "lucide-react";
import { cn } from "@/utils/cn";
import { financeService, type TransactionStatus } from "@/services/financeService";
import toast from "react-hot-toast";

interface Installment {
  id: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  due_date: string;
  paid_date?: string | null;
  current_installment: number;
  installments: number;
}

interface InstallmentManagerProps {
  installments: Installment[];
  onUpdate: () => void;
}

interface EditingInstallment extends Installment {
  editedAmount?: string;
  editedDueDate?: string;
  editedPaidDate?: string;
  editedStatus?: TransactionStatus;
}

const statusLabels = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  paid: { label: "Pago", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  overdue: { label: "Atrasado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: X }
};

export function InstallmentManager({ installments, onUpdate }: InstallmentManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingInstallment | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStartEdit = (installment: Installment) => {
    setEditingId(installment.id);
    setEditingData({
      ...installment,
      editedAmount: installment.amount.toString(),
      editedDueDate: installment.due_date,
      editedPaidDate: installment.paid_date || "",
      editedStatus: installment.status
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSaveEdit = async () => {
    if (!editingData || !editingId) return;

    try {
      setSaving(true);

      const updates: any = {
        amount: parseFloat(editingData.editedAmount || editingData.amount.toString()),
        due_date: editingData.editedDueDate || editingData.due_date,
        status: editingData.editedStatus || editingData.status,
      };

      // Se status é pago e tem data de pagamento, incluir
      if (editingData.editedStatus === "paid" && editingData.editedPaidDate) {
        updates.paid_date = editingData.editedPaidDate;
      } else if (editingData.editedStatus !== "paid") {
        updates.paid_date = null;
      }

      await financeService.updateTransaction(editingId, updates);
      
      toast.success("Parcela atualizada com sucesso!");
      setEditingId(null);
      setEditingData(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar parcela:", error);
      toast.error("Erro ao atualizar parcela. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusToggle = async (installment: Installment) => {
    try {
      const newStatus: TransactionStatus = installment.status === "paid" ? "pending" : "paid";
      const updates: any = {
        status: newStatus,
      };

      // Se marcando como pago, definir data de hoje
      if (newStatus === "paid") {
        updates.paid_date = new Date().toISOString().split('T')[0];
      } else {
        updates.paid_date = null;
      }

      await financeService.updateTransaction(installment.id, updates);
      toast.success(`Parcela marcada como ${newStatus === "paid" ? "paga" : "pendente"}!`);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status. Tente novamente.");
    }
  };

  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const paidAmount = installments.filter(i => i.status === "paid").reduce((sum, inst) => sum + inst.amount, 0);
  const paidCount = installments.filter(i => i.status === "paid").length;

  return (
    <Card className="border-2 border-lumina-200 dark:border-lumina-800">
      <CardHeader className="bg-gradient-to-r from-lumina-50 to-lumina-100 dark:from-lumina-900/20 dark:to-lumina-800/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-lumina-600" />
            Gerenciar Parcelas
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {paidCount}/{installments.length} pagas
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="font-bold text-green-600">
                R$ {paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold">
                R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(paidCount / installments.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {((paidCount / installments.length) * 100).toFixed(0)}% das parcelas pagas
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {installments.map((installment) => {
            const isEditing = editingId === installment.id;
            const StatusIcon = statusLabels[installment.status].icon;
            const isOverdue = installment.status === "pending" && new Date(installment.due_date) < new Date();

            return (
              <div
                key={installment.id}
                className={cn(
                  "p-4 transition-all",
                  isEditing ? "bg-lumina-50 dark:bg-lumina-900/20" : "hover:bg-muted/30"
                )}
              >
                {!isEditing ? (
                  // Modo Visualização
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                            installment.status === "paid" ? "bg-green-500 text-white" : "bg-muted"
                          )}>
                            {installment.status === "paid" ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              installment.current_installment
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">
                              Parcela {installment.current_installment}/{installment.installments}
                            </h4>
                            <Badge className={cn("text-xs", statusLabels[installment.status].color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabels[installment.status].label}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Vencida
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {installment.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground ml-13">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Venc: {new Date(installment.due_date).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {installment.paid_date && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Pago: {new Date(installment.paid_date).toLocaleDateString("pt-BR")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          R$ {installment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStatusToggle(installment)}
                          className={cn(
                            "h-8 w-8 p-0",
                            installment.status === "paid" && "border-green-500 text-green-600 hover:bg-green-50"
                          )}
                          title={installment.status === "paid" ? "Marcar como pendente" : "Marcar como pago"}
                        >
                          {installment.status === "paid" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEdit(installment)}
                          className="h-8 w-8 p-0"
                          title="Editar parcela"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Modo Edição
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">
                        Editando Parcela {installment.current_installment}/{installment.installments}
                      </h4>
                      <Badge variant="secondary">Editando</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`amount-${installment.id}`} className="text-xs">
                          Valor
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`amount-${installment.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingData?.editedAmount || ""}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, editedAmount: e.target.value} : null)}
                            className="pl-10 h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`status-${installment.id}`} className="text-xs">
                          Status
                        </Label>
                        <select
                          id={`status-${installment.id}`}
                          value={editingData?.editedStatus || ""}
                          onChange={(e) => setEditingData(prev => prev ? {...prev, editedStatus: e.target.value as TransactionStatus} : null)}
                          className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm h-9"
                        >
                          <option value="pending">⏳ Pendente</option>
                          <option value="paid">✅ Pago</option>
                          <option value="overdue">⚠️ Atrasado</option>
                          <option value="cancelled">❌ Cancelado</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`dueDate-${installment.id}`} className="text-xs">
                          Data de Vencimento
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id={`dueDate-${installment.id}`}
                            type="date"
                            value={editingData?.editedDueDate || ""}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, editedDueDate: e.target.value} : null)}
                            className="pl-10 h-9"
                          />
                        </div>
                      </div>

                      {editingData?.editedStatus === "paid" && (
                        <div className="space-y-1.5">
                          <Label htmlFor={`paidDate-${installment.id}`} className="text-xs">
                            Data do Pagamento
                          </Label>
                          <div className="relative">
                            <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                            <Input
                              id={`paidDate-${installment.id}`}
                              type="date"
                              value={editingData?.editedPaidDate || ""}
                              onChange={(e) => setEditingData(prev => prev ? {...prev, editedPaidDate: e.target.value} : null)}
                              className="pl-10 h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
