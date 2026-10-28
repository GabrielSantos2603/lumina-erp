/**
 * Utilitários para gerenciar autenticação e renovar sessão automaticamente
 * quando detectar erros de autenticação nas requisições
 */

import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

// Adicionar callbacks para serem executados após refresh
function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

// Executar todos os callbacks após refresh
function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Tenta renovar a sessão
 */
export async function refreshSessionToken(): Promise<string | null> {
  if (isRefreshing) {
    // Se já está renovando, esperar pela renovação em andamento
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;
  console.log('🔄 Auth Interceptor: Renovando sessão...');

  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ Auth Interceptor: Erro ao renovar sessão:', error);
      onTokenRefreshed(null);
      
      // Redirecionar para login após erro
      toast.error('Sessão expirada. Redirecionando para login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      return null;
    }

    if (data.session) {
      console.log('✅ Auth Interceptor: Sessão renovada com sucesso');
      const token = data.session.access_token;
      onTokenRefreshed(token);
      return token;
    }

    onTokenRefreshed(null);
    return null;
  } catch (error) {
    console.error('❌ Auth Interceptor: Erro inesperado:', error);
    onTokenRefreshed(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Verifica se é um erro de autenticação
 */
function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';

  return (
    errorCode === 'PGRST301' || // JWT expired
    errorCode === '401' ||
    errorCode === 'PGRST300' || // JWT invalid
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('unauthorized')
  );
}

/**
 * Wrapper para executar queries com retry automático em caso de erro de auth
 */
export async function executeWithAuthRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await queryFn();

    // Se houver erro de autenticação, tentar renovar e executar novamente
    if (result.error && isAuthError(result.error)) {
      console.warn('⚠️ Auth Interceptor: Erro de autenticação detectado');
      console.warn('Erro:', result.error);
      console.warn('Tentando renovar sessão...');
      
      const newToken = await refreshSessionToken();
      
      if (newToken) {
        console.log('🔄 Auth Interceptor: Tentando novamente com novo token...');
        // Tentar novamente com o novo token
        const retryResult = await queryFn();
        
        if (retryResult.error) {
          console.error('❌ Auth Interceptor: Erro persiste após renovação:', retryResult.error);
        } else {
          console.log('✅ Auth Interceptor: Requisição bem-sucedida após renovação');
        }
        
        return retryResult;
      } else {
        console.error('❌ Auth Interceptor: Não foi possível renovar sessão');
        return result;
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Auth Interceptor: Erro ao executar query:', error);
    return { data: null, error };
  }
}

/**
 * Função auxiliar para adicionar retry automático em uma query do Supabase
 * 
 * Exemplo de uso:
 * const { data, error } = await withAuthRetry(() => 
 *   supabase.from('projects').select('*')
 * );
 */
export async function withAuthRetry<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  return executeWithAuthRetry(queryFn);
}
