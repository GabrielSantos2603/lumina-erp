import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    nome: string,
    empresa?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Mensagens de erro amigáveis
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login');
        } else {
          toast.error(`Erro ao fazer login: ${error.message}`);
        }
        throw error;
      }

      if (data.user) {
        // Buscar profile do usuário
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          set({ user: data.user, profile: profile || null });
          toast.success('Login realizado com sucesso!');
        } catch (profileError) {
          console.warn("Profile table not found, continuing without profile:", profileError);
          set({ user: data.user, profile: null });
          toast.warning('Login realizado, mas perfil não encontrado');
        }
      }
    } catch (error) {
      // Erro já foi tratado acima
      throw error;
    }
  },

  signUp: async (email, password, nome, empresa) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome || email.split('@')[0],
            empresa: empresa || 'Minha Empresa',
          },
        },
      });

      if (error) {
        // Mensagens de erro amigáveis
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else if (error.message.includes('Password should be')) {
          toast.error('A senha deve ter no mínimo 6 caracteres');
        } else if (error.message.includes('rate limit')) {
          toast.error('Muitas tentativas. Aguarde alguns minutos e tente novamente');
        } else if (error.message.includes('User already registered')) {
          toast.error('Este email já está em uso. Tente fazer login ou use outro email');
        } else {
          toast.error(`Erro ao criar conta: ${error.message}`);
        }
        throw error;
      }

      if (data.user) {
        toast.loading('Criando sua organização...', { id: 'create-org' });
        
        try {
          // Criar organização via função SQL
          const { data: orgData, error: orgError } = await supabase.rpc(
            'create_organization_for_user',
            {
              p_user_id: data.user.id,
              p_email: email,
              p_nome: nome || email.split('@')[0],
              p_empresa: empresa || 'Minha Empresa'
            }
          );

          if (orgError) {
            console.error("Erro ao criar organização:", orgError);
            toast.error('Falha ao criar organização. Tente novamente.', { id: 'create-org' });
            
            // Logar o usuário recém-criado para limpeza
            await supabase.auth.signOut();
            
            throw new Error("Falha ao criar organização. Tente novamente.");
          }

          console.log("Organização criada:", orgData);

          // Aguardar um pouco para garantir que tudo foi criado
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Buscar perfil criado
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileError) {
            console.error("Erro ao buscar profile:", profileError);
            toast.error('Perfil não encontrado. Entre em contato com o suporte.', { id: 'create-org' });
            throw new Error("Perfil não encontrado após criar organização.");
          }

          set({ user: data.user, profile: profile as Profile | null });
          toast.success('Conta criada com sucesso! Bem-vindo! 🎉', { id: 'create-org' });
          
        } catch (err) {
          console.error("Erro no processo de signup:", err);
          throw err;
        }
      }
    } catch (error) {
      // Erro já foi tratado acima
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          set({ user: session.user, profile: profile || null, loading: false });
        } catch (profileError) {
          console.warn("Profile table not found, continuing without profile:", profileError);
          set({ user: session.user, profile: null, loading: false });
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }

      // Listen to auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            set({ user: session.user, profile: profile || null });
          } catch (profileError) {
            console.warn("Profile table not found:", profileError);
            set({ user: session.user, profile: null });
          }
        } else {
          set({ user: null, profile: null });
        }
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) throw new Error("No profile found");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id)
      .select()
      .single();

    if (error) throw error;

    set({ profile: data as Profile | null });
  },
}));

