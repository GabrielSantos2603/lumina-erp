/**
 * Hook para gerenciar sessão do Supabase e prevenir travamentos
 * por sessão expirada quando a aplicação fica aberta por muito tempo
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export function useSessionManager() {
  const isRefreshing = useRef(false);
  const lastActivity = useRef(Date.now());
  
  useEffect(() => {
    console.log('🔐 Session Manager: Inicializado');

    // 1. Listener de mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Session Manager: Auth event:', event);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Session Manager: Token renovado automaticamente');
          toast.success('Sessão renovada automaticamente', { 
            duration: 2000,
            icon: '🔄' 
          });
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('⚠️ Session Manager: Usuário deslogado');
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          window.location.href = '/login';
        }

        if (event === 'USER_UPDATED' && session) {
          console.log('✅ Session Manager: Dados do usuário atualizados');
        }
      }
    );

    // 2. Verificar sessão periodicamente (a cada 5 minutos)
    const sessionCheckInterval = setInterval(async () => {
      console.log('🔍 Session Manager: Verificando sessão...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session Manager: Erro ao verificar sessão:', error);
        return;
      }
      
      if (!session) {
        console.warn('⚠️ Session Manager: Sessão não encontrada');
        toast.error('Sua sessão expirou. Redirecionando para login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // Verificar se o token vai expirar em breve (menos de 10 minutos)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        console.log(`⏰ Session Manager: Token expira em ${Math.floor(timeUntilExpiry / 60)} minutos`);
        
        // Se faltam menos de 10 minutos, renovar proativamente
        if (timeUntilExpiry < 600 && !isRefreshing.current) {
          console.log('🔄 Session Manager: Token próximo da expiração, renovando...');
          await refreshSession();
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    // 3. Detectar quando a aba volta a ficar visível (usuário voltou)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastActivity = Date.now() - lastActivity.current;
        console.log(`👁️ Session Manager: Aba voltou a ficar visível após ${Math.floor(timeSinceLastActivity / 1000)}s`);
        
        // Se ficou inativo por mais de 5 minutos, verificar/renovar sessão
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          console.log('🔄 Session Manager: Verificando sessão após inatividade...');
          await refreshSession();
        }
        
        lastActivity.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Detectar atividade do usuário (mouse, teclado, scroll)
    const handleActivity = () => {
      lastActivity.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Cleanup
    return () => {
      console.log('🔐 Session Manager: Desmontando...');
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Função para renovar sessão
  const refreshSession = async () => {
    if (isRefreshing.current) {
      console.log('⏳ Session Manager: Refresh já em andamento...');
      return;
    }

    try {
      isRefreshing.current = true;
      console.log('🔄 Session Manager: Iniciando refresh da sessão...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ Session Manager: Erro ao renovar sessão:', error);
        
        // Se erro for de token inválido, redirecionar para login
        if (error.message.includes('refresh_token') || error.message.includes('invalid')) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
        return;
      }

      if (data.session) {
        console.log('✅ Session Manager: Sessão renovada com sucesso');
        toast.success('Sessão renovada', { 
          duration: 2000,
          icon: '🔄' 
        });
      }
    } catch (error) {
      console.error('❌ Session Manager: Erro inesperado ao renovar sessão:', error);
    } finally {
      isRefreshing.current = false;
    }
  };

  return { refreshSession };
}
