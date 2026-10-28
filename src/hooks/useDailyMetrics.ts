/**
 * Hook para obter métricas do dia em tempo real
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface DailyMetrics {
  projects: number;
  tasks: number;
  hours: number;
  revenue: number;
}

export function useDailyMetrics() {
  const [metrics, setMetrics] = useState<DailyMetrics>({
    projects: 0,
    tasks: 0,
    hours: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        // Buscar projetos ativos
        const { data: projects } = await supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .in('status', ['planning', 'in_progress']);

        // Buscar tarefas pendentes/em andamento
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .in('status', ['pending', 'in_progress']);

        // Buscar horas trabalhadas hoje (de time_entries se existir)
        const { data: timeEntries } = await supabase
          .from('time_entries')
          .select('duration')
          .gte('created_at', todayStr);

        const totalSeconds = timeEntries?.reduce((acc, entry) => acc + (entry.duration || 0), 0) || 0;
        const totalHours = totalSeconds / 3600;

        // Buscar receitas do mês atual
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'income')
          .eq('status', 'paid')
          .gte('created_at', firstDayOfMonth);

        const totalRevenue = transactions?.reduce((acc, transaction) => acc + (transaction.amount || 0), 0) || 0;

        setMetrics({
          projects: projects?.length || 0,
          tasks: tasks?.length || 0,
          hours: parseFloat(totalHours.toFixed(1)),
          revenue: totalRevenue,
        });
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { metrics, isLoading };
}
