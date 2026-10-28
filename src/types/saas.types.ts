// ================================================================
// TYPES PARA SISTEMA SAAS MULTI-TENANT
// ================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  company_name: string | null;
  cnpj: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  logo_url: string | null;
  primary_color: string;
  timezone: string;
  language: string;
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  stripe_current_period_start: string | null;
  stripe_current_period_end: string | null;
  stripe_cancel_at_period_end: boolean;
  plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  billing_cycle: 'monthly' | 'yearly';
  subscription_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'guest';
  permissions: Record<string, boolean>;
  status: 'active' | 'inactive' | 'invited';
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  organization_id: string;
  plan: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  period_start: string;
  period_end: string;
  paid_at: string | null;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  max_users: number | null;
  max_projects: number | null;
  max_storage_gb: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface OrganizationUsage {
  organization_id: string;
  organization_name: string;
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  active_users: number;
  total_projects: number;
  total_clients: number;
  total_meetings: number;
}

export interface StripeWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  organization_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  created_at: string;
}

// Tipos para Stripe
export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string | null;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: 'month' | 'year';
        };
      };
    }>;
  };
}

// Tipos para fluxo de onboarding
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface OrganizationSetup {
  organization: Partial<Organization>;
  member: Partial<OrganizationMember>;
  plan: string;
  billing_cycle: 'monthly' | 'yearly';
}

// Tipos para permissões
export type Permission = 
  | 'clients.view'
  | 'clients.create'
  | 'clients.edit'
  | 'clients.delete'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'meetings.view'
  | 'meetings.create'
  | 'meetings.edit'
  | 'meetings.delete'
  | 'transactions.view'
  | 'transactions.create'
  | 'transactions.edit'
  | 'transactions.delete'
  | 'team.view'
  | 'team.invite'
  | 'team.manage'
  | 'settings.view'
  | 'settings.edit'
  | 'billing.view'
  | 'billing.manage';

export interface RolePermissions {
  owner: Permission[];
  admin: Permission[];
  manager: Permission[];
  member: Permission[];
  guest: Permission[];
}

// Permissões por role
export const ROLE_PERMISSIONS: RolePermissions = {
  owner: [
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
    'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.delete',
    'team.view', 'team.invite', 'team.manage',
    'settings.view', 'settings.edit',
    'billing.view', 'billing.manage'
  ],
  admin: [
    'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
    'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.delete',
    'team.view', 'team.invite', 'team.manage',
    'settings.view', 'settings.edit'
  ],
  manager: [
    'clients.view', 'clients.create', 'clients.edit',
    'projects.view', 'projects.create', 'projects.edit',
    'meetings.view', 'meetings.create', 'meetings.edit',
    'transactions.view', 'transactions.create', 'transactions.edit',
    'team.view'
  ],
  member: [
    'clients.view',
    'projects.view', 'projects.create', 'projects.edit',
    'meetings.view', 'meetings.create', 'meetings.edit',
    'transactions.view',
    'team.view'
  ],
  guest: [
    'clients.view',
    'projects.view',
    'meetings.view',
    'team.view'
  ]
};

// Helper para verificar permissões
export function hasPermission(role: OrganizationMember['role'], permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Tipos para context da organização
export interface OrganizationContext {
  organization: Organization | null;
  member: OrganizationMember | null;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canManageBilling: boolean;
  usage: OrganizationUsage | null;
  refreshOrganization: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
}

// Tipos para subscription context
export interface SubscriptionContext {
  subscription: StripeSubscription | null;
  status: 'active' | 'inactive' | 'trial' | 'expired' | 'cancelled';
  daysUntilTrialEnd: number | null;
  isTrialExpired: boolean;
  canAccess: boolean;
  loading: boolean;
  createCheckoutSession: (priceId: string) => Promise<StripeCheckoutSession>;
  createPortalSession: () => Promise<{ url: string }>;
  cancelSubscription: () => Promise<void>;
}
