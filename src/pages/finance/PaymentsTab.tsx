import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { financeService } from "@/services/financeService";
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

interface PaymentsTabProps {
  payments: Payment[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTransactionGroup: string | null;
  setSelectedTransactionGroup: (group: string | null) => void;
  handleDeleteTransaction: (id: string, description: string) => void;
  handleDeleteInstallmentGroup: (
    baseDescription: string,
    installmentIds: string[],
    totalInstallments: number
  ) => void;
  onTransactionUpdated?: () => void;
}

const statusLabels = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  paid: {
    label: "Pago",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  overdue: {
    label: "Atrasado",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

const methodLabels = {
  pix: "PIX",
  boleto: "Boleto",
  card: "Cartão",
  transfer: "Transferência",
  cash: "Dinheiro",
};

export function PaymentsTab({
  payments,
  searchQuery,
  setSearchQuery,
  selectedTransactionGroup,
  setSelectedTransactionGroup,
  handleDeleteTransaction,
  handleDeleteInstallmentGroup,
  onTransactionUpdated,
}: PaymentsTabProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    description: "",
    amount: "",
    status: "",
    dueDate: "",
    paidDate: "",
    category: "",
    method: "",
  });

  // Estados para filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [filters, setFilters] = useState({
    type: "all" as "all" | "income" | "expense",
    status: "all" as "all" | "pending" | "paid" | "overdue" | "cancelled",
    method: "all" as "all" | "pix" | "boleto" | "card" | "transfer" | "cash",
  });
  const [periodFilter, setPeriodFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Mostrar 50 transações por página

  // Memoizar filtros para otimização com grandes volumes
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Filtro de busca por texto
      const matchesSearch =
        payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.project?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de tipo
      const matchesType = filters.type === "all" || payment.type === filters.type;

      // Filtro de status
      const matchesStatus = filters.status === "all" || payment.status === filters.status;

      // Filtro de método
      const matchesMethod = filters.method === "all" || payment.method === filters.method;

      // Filtro de período
      let matchesPeriod = true;
      if (periodFilter.startDate && periodFilter.endDate) {
        const paymentDate = new Date(payment.dueDate);
        const startDate = new Date(periodFilter.startDate);
        const endDate = new Date(periodFilter.endDate);
        matchesPeriod = paymentDate >= startDate && paymentDate <= endDate;
      }

      return matchesSearch && matchesType && matchesStatus && matchesMethod && matchesPeriod;
    });
  }, [payments, searchQuery, filters, periodFilter]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, startIndex, endIndex]);

  // Resetar página quando filtros mudarem
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const getBaseDescription = (desc: string) => {
    return desc.replace(/ - Parcela \d+\/\d+$/, "");
  };

  // Abrir modal de edição
  const handleOpenEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setEditFormData({
      description: payment.description,
      amount: payment.amount.toString(),
      status: payment.status,
      dueDate: payment.dueDate,
      paidDate: payment.paidDate || "",
      category: payment.category,
      method: payment.method,
    });
    setShowEditModal(true);
  };

  // Fechar modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPayment(null);
    setEditFormData({
      description: "",
      amount: "",
      status: "",
      dueDate: "",
      paidDate: "",
      category: "",
      method: "",
    });
  };

  // Salvar alterações
  const handleSaveTransaction = async () => {
    if (!editingPayment) return;

    try {
      setIsSaving(true);
      
      const updates: Record<string, string | number | null | undefined> = {
        description: editFormData.description,
        amount: parseFloat(editFormData.amount),
        status: editFormData.status,
        due_date: editFormData.dueDate,
        category: editFormData.category,
        method: editFormData.method,
      };

      // Adicionar paid_date apenas se status for "paid"
      if (editFormData.status === "paid" && editFormData.paidDate) {
        updates.paid_date = editFormData.paidDate;
      } else if (editFormData.status !== "paid") {
        updates.paid_date = null;
      }

      await financeService.updateTransaction(editingPayment.id, updates);
      
      toast.success("Transação atualizada com sucesso!");
      handleCloseEditModal();
      
      // Chamar callback para recarregar dados
      if (onTransactionUpdated) {
        onTransactionUpdated();
      }
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      toast.error("Erro ao atualizar transação");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => {
              setShowFilterModal(true);
              handleFilterChange();
            }}
          >
            <Filter className="h-4 w-4" />
            Filtrar
            {(filters.type !== "all" || filters.status !== "all" || filters.method !== "all") && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-lumina-100 dark:bg-lumina-900 text-lumina-700 dark:text-lumina-300 rounded-full">
                •
              </span>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => {
              setShowPeriodModal(true);
              handleFilterChange();
            }}
          >
            <Calendar className="h-4 w-4" />
            Período
            {(periodFilter.startDate && periodFilter.endDate) && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-lumina-100 dark:bg-lumina-900 text-lumina-700 dark:text-lumina-300 rounded-full">
                •
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Informações de Resultados */}
      {filteredPayments.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <p>
            Mostrando <strong>{startIndex + 1}</strong> a{" "}
            <strong>{Math.min(endIndex, filteredPayments.length)}</strong> de{" "}
            <strong>{filteredPayments.length}</strong> transações
          </p>
          <div className="flex items-center gap-4 text-xs">
            <p className="text-green-600 dark:text-green-400">
              Receitas:{" "}
              <strong>
                R${" "}
                {filteredPayments
                  .filter((p) => p.type === "income")
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </p>
            <p className="text-red-600 dark:text-red-400">
              Despesas:{" "}
              <strong>
                R${" "}
                {filteredPayments
                  .filter((p) => p.type === "expense")
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </p>
            <p className="font-semibold">
              Saldo:{" "}
              <strong
                className={
                  filteredPayments.reduce(
                    (sum, p) => sum + (p.type === "income" ? p.amount : -p.amount),
                    0
                  ) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                R${" "}
                {filteredPayments
                  .reduce(
                    (sum, p) => sum + (p.type === "income" ? p.amount : -p.amount),
                    0
                  )
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Lista de Pagamentos */}
      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">Nenhuma transação encontrada</p>
              <p className="text-sm">
                {searchQuery || filters.type !== "all" || filters.status !== "all" || filters.method !== "all" || periodFilter.startDate
                  ? "Tente ajustar os filtros de busca"
                  : "Adicione sua primeira transação financeira"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedPayments.map((payment) => {
              const baseDescription = getBaseDescription(payment.description);
              const isInstallmentGroup =
                payment.installments &&
                payment.installments > 1 &&
                payment.currentInstallment === 1;
              const isExpanded = selectedTransactionGroup === baseDescription;

              const installmentTransactions = isInstallmentGroup
                ? filteredPayments.filter((p) => {
                    const pBaseDesc = getBaseDescription(p.description);
                    return (
                      pBaseDesc === baseDescription &&
                      p.installments === payment.installments
                    );
                  })
                : [];

              // Só renderiza se for uma transação única ou a primeira parcela de um grupo
              if (
                payment.installments &&
                payment.installments > 1 &&
                payment.currentInstallment !== 1
              ) {
                return null;
              }

              const totalInstallmentValue = isInstallmentGroup
                ? installmentTransactions.reduce((sum, p) => sum + p.amount, 0)
                : payment.amount;

              return (
                <div key={payment.id} className="p-4 hover:bg-muted/50 transition-colors">
                  {/* Cabeçalho da transação */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg truncate">
                          {baseDescription}
                        </h3>
                        {isInstallmentGroup && (
                          <Badge variant="outline" className="text-xs">
                            {payment.installments}x parcelas
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge
                          variant={payment.type === "income" ? "default" : "destructive"}
                        >
                          {payment.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                        <span className="text-muted-foreground">{payment.category}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {methodLabels[payment.method]}
                        </span>
                        {payment.client && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{payment.client}</span>
                          </>
                        )}
                        {payment.project && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{payment.project}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-xl font-bold",
                            payment.type === "income" ? "text-green-600" : "text-red-600"
                          )}
                        >
                          R${" "}
                          {totalInstallmentValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {isInstallmentGroup && (
                          <p className="text-xs text-muted-foreground">
                            {payment.installments}x de R${" "}
                            {payment.amount.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <Badge className={statusLabels[payment.status].color}>
                            {statusLabels[payment.status].label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {isInstallmentGroup && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSelectedTransactionGroup(
                                isExpanded ? null : baseDescription
                              )
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {isInstallmentGroup && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleDeleteInstallmentGroup(
                                baseDescription,
                                installmentTransactions.map((t) => t.id),
                                installmentTransactions.length
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!isInstallmentGroup && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditModal(payment)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                handleDeleteTransaction(payment.id, payment.description)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes expandidos (parcelamentos) */}
                  {isInstallmentGroup && isExpanded && (
                    <div className="mt-4 pl-4 border-l-2 border-lumina-200 dark:border-lumina-800 space-y-2">
                      {installmentTransactions.map((installment) => (
                        <div
                          key={installment.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              Parcela {installment.currentInstallment}/
                              {installment.installments}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vencimento:{" "}
                              {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-bold">
                              R${" "}
                              {installment.amount.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <Badge className={statusLabels[installment.status].color}>
                              {statusLabels[installment.status].label}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenEditModal(installment)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Mostrar apenas páginas próximas
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  );
                })
                .map((page, index, array) => {
                  // Adicionar "..." entre páginas não consecutivas
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[36px]"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Editar Transação</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseEditModal}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {editingPayment.installments && editingPayment.installments > 1 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Editando Parcela {editingPayment.currentInstallment} de{" "}
                  {editingPayment.installments}
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Tipo da Transação (read-only) */}
              <div>
                <Label>Tipo</Label>
                <div className="mt-2">
                  <Badge
                    variant={editingPayment.type === "income" ? "default" : "destructive"}
                  >
                    {editingPayment.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="edit-description">Descrição *</Label>
                <Input
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  placeholder="Descrição da transação"
                  disabled={isSaving}
                />
              </div>

              {/* Valor */}
              <div>
                <Label htmlFor="edit-amount">Valor (R$) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  disabled={isSaving}
                />
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="edit-category">Categoria *</Label>
                <Input
                  id="edit-category"
                  value={editFormData.category}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, category: e.target.value })
                  }
                  placeholder="Categoria"
                  disabled={isSaving}
                />
              </div>

              {/* Método de Pagamento */}
              <div>
                <Label htmlFor="edit-method">Método de Pagamento *</Label>
                <select
                  id="edit-method"
                  title="Método de pagamento"
                  value={editFormData.method}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, method: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  disabled={isSaving}
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="card">Cartão</option>
                  <option value="transfer">Transferência</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="edit-status">Status *</Label>
                <select
                  id="edit-status"
                  title="Status da transação"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  disabled={isSaving}
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Data de Vencimento */}
              <div>
                <Label htmlFor="edit-dueDate">Data de Vencimento *</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, dueDate: e.target.value })
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Data de Pagamento (apenas se status = paid) */}
              {editFormData.status === "paid" && (
                <div>
                  <Label htmlFor="edit-paidDate">Data de Pagamento</Label>
                  <Input
                    id="edit-paidDate"
                    type="date"
                    value={editFormData.paidDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, paidDate: e.target.value })
                    }
                    disabled={isSaving}
                  />
                </div>
              )}

              {/* Informações adicionais (read-only) */}
              {(editingPayment.client || editingPayment.project) && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Informações Adicionais</p>
                  {editingPayment.client && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Cliente:</strong> {editingPayment.client}
                    </p>
                  )}
                  {editingPayment.project && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Projeto:</strong> {editingPayment.project}
                    </p>
                  )}
                </div>
              )}
            </CardContent>

            <div className="border-t p-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCloseEditModal}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTransaction}
                disabled={
                  isSaving ||
                  !editFormData.description ||
                  !editFormData.amount ||
                  !editFormData.category ||
                  !editFormData.method ||
                  !editFormData.status ||
                  !editFormData.dueDate
                }
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtrar Transações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo */}
              <div>
                <Label htmlFor="filter-type">Tipo</Label>
                <select
                  id="filter-type"
                  title="Tipo de transação"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value as typeof filters.type })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="filter-status">Status</Label>
                <select
                  id="filter-status"
                  title="Status da transação"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value as typeof filters.status })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Método */}
              <div>
                <Label htmlFor="filter-method">Método de Pagamento</Label>
                <select
                  id="filter-method"
                  title="Método de pagamento"
                  value={filters.method}
                  onChange={(e) =>
                    setFilters({ ...filters, method: e.target.value as typeof filters.method })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="card">Cartão</option>
                  <option value="transfer">Transferência</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>
            </CardContent>

            <div className="border-t p-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ type: "all", status: "all", method: "all" });
                  setShowFilterModal(false);
                }}
              >
                Limpar Filtros
              </Button>
              <Button onClick={() => setShowFilterModal(false)}>
                Aplicar Filtros
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Período */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Filtrar por Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Inicial */}
              <div>
                <Label htmlFor="period-start">Data Inicial</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodFilter.startDate}
                  onChange={(e) =>
                    setPeriodFilter({ ...periodFilter, startDate: e.target.value })
                  }
                />
              </div>

              {/* Data Final */}
              <div>
                <Label htmlFor="period-end">Data Final</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodFilter.endDate}
                  onChange={(e) =>
                    setPeriodFilter({ ...periodFilter, endDate: e.target.value })
                  }
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Filtra transações pela data de vencimento dentro do período selecionado.
              </p>
            </CardContent>

            <div className="border-t p-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPeriodFilter({ startDate: "", endDate: "" });
                  setShowPeriodModal(false);
                }}
              >
                Limpar Período
              </Button>
              <Button 
                onClick={() => setShowPeriodModal(false)}
                disabled={!periodFilter.startDate || !periodFilter.endDate}
              >
                Aplicar Período
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
