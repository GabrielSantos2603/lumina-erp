import { supabase } from "@/lib/supabase";
import { getOrganizationId } from "@/utils/getOrganizationId";

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "pix" | "boleto" | "card" | "transfer" | "cash" | "other";

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  method: PaymentMethod | null;
  status: TransactionStatus;
  due_date: string;
  paid_date?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  installments?: number | null;
  current_installment?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyCashFlowRow {
  month: string; // ISO date string start of month
  income: number;
  expense: number;
  balance: number;
}

export interface AccountsSummaryRow {
  receivable: number;
  payable: number;
  overdue_receivable: number;
  overdue_payable: number;
}

export const financeService = {
  async getTransactions(params?: {
    search?: string;
    status?: TransactionStatus | "all";
    type?: TransactionType | "all";
    limit?: number;
    offset?: number;
    month?: string; // YYYY-MM
  }): Promise<Transaction[]> {
    const { search, status, type, limit, offset, month } = params || {};

    let query = supabase
      .from("transactions")
      .select("*")
      .order("due_date", { ascending: false }) as any;

    if (type && type !== "all") query = query.eq("type", type);
    if (status && status !== "all") query = query.eq("status", status);

    if (month) {
      // filter by month (YYYY-MM)
      const from = `${month}-01`;
      const to = `${month}-31`;
      query = query.gte("due_date", from).lte("due_date", to);
    }

    if (search && search.trim()) {
      const s = search.trim();
      // Filter by ilike on description/client/project/category
      query = query.or(
        `description.ilike.%${s}%,client_name.ilike.%${s}%,project_name.ilike.%${s}%,category.ilike.%${s}%`
      );
    }

    if (typeof limit === "number") query = query.limit(limit);
    if (typeof offset === "number") query = query.range(offset, (offset || 0) + (limit || 50) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Transaction[];
  },

  async createTransaction(payload: Omit<Transaction, "id" | "created_at" | "updated_at">) {
    // Buscar organization_id do usuário
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...payload, organization_id: organizationId } as any)
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  },

  async getMonthlyCashFlow(): Promise<MonthlyCashFlowRow[]> {
    // Query the view monthly_cash_flow
    const { data, error } = await supabase
      .from("monthly_cash_flow")
      .select("month,income,expense,balance")
      .order("month", { ascending: true }) as any;
    if (error) throw error;
    // month comes as timestamp; ensure string
    return (data || []).map((r: any) => ({
      month: r.month,
      income: Number(r.income || 0),
      expense: Number(r.expense || 0),
      balance: Number(r.balance || 0),
    }));
  },

  async getAccountsSummary(): Promise<AccountsSummaryRow | null> {
    const { data, error } = await supabase
      .from("accounts_summary")
      .select("receivable,payable,overdue_receivable,overdue_payable")
      .single();
    if (error && error.code !== "PGRST116") throw error; // no rows
    return data as any;
  },
};
