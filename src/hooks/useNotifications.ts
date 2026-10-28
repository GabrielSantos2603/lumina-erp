/**
 * Hook para gerenciar notificações em tempo real
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: Date;
  icon?: string;
  link?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar notificações dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Erro ao carregar notificações:', error);
          // Usar notificações de exemplo se tabela não existir
          loadMockNotifications();
          return;
        }

        if (data) {
          const formattedNotifications: Notification[] = data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            read: n.read || false,
            timestamp: new Date(n.created_at),
            icon: n.icon,
            link: n.link,
          }));
          setNotifications(formattedNotifications);
        } else {
          loadMockNotifications();
        }
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        loadMockNotifications();
      } finally {
        setIsLoading(false);
      }
    };

    const loadMockNotifications = () => {
      // Gerar notificações baseadas em atividades recentes
      generateActivityNotifications();
    };

    const generateActivityNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const mockNotifications: Notification[] = [];
        const now = new Date();

        // Buscar projetos recentes
        const { data: recentProjects } = await supabase
          .from('projects')
          .select('name, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentProjects && recentProjects.length > 0) {
          recentProjects.forEach((project, index) => {
            const createdDate = new Date(project.created_at);
            const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 3600);
            
            if (diffHours < 24) {
              mockNotifications.push({
                id: `project-${index}`,
                title: "Novo projeto criado",
                message: `O projeto "${project.name}" foi adicionado ao sistema`,
                type: "success",
                read: diffHours > 1,
                timestamp: createdDate,
              });
            }
          });
        }

        // Buscar tarefas próximas do prazo
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { data: upcomingTasks } = await supabase
          .from('tasks')
          .select('title, due_date')
          .gte('due_date', now.toISOString())
          .lte('due_date', tomorrow.toISOString())
          .eq('status', 'pending')
          .limit(3);

        if (upcomingTasks && upcomingTasks.length > 0) {
          upcomingTasks.forEach((task, index) => {
            mockNotifications.push({
              id: `task-${index}`,
              title: "Tarefa próxima do prazo",
              message: `"${task.title}" vence em breve`,
              type: "warning",
              read: false,
              timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min atrás
            });
          });
        }

        // Buscar transações recentes
        const { data: recentTransactions } = await supabase
          .from('transactions')
          .select('amount, type, created_at, client_name')
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentTransactions && recentTransactions.length > 0) {
          recentTransactions.forEach((transaction, index) => {
            const createdDate = new Date(transaction.created_at);
            const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 3600);
            
            if (diffHours < 48) {
              mockNotifications.push({
                id: `transaction-${index}`,
                title: transaction.type === 'income' ? "Pagamento recebido" : "Despesa registrada",
                message: `R$ ${transaction.amount.toFixed(2)} ${transaction.type === 'income' ? 'recebido' : 'pago'}${transaction.client_name ? ' de ' + transaction.client_name : ''}`,
                type: transaction.type === 'income' ? "success" : "info",
                read: diffHours > 2,
                timestamp: createdDate,
              });
            }
          });
        }

        // Adicionar notificação de boas-vindas se não houver outras
        if (mockNotifications.length === 0) {
          mockNotifications.push({
            id: 'welcome',
            title: "Bem-vindo ao Lumina AI ERP! 🎉",
            message: "Comece criando seu primeiro projeto ou cliente",
            type: "info",
            read: false,
            timestamp: new Date(now.getTime() - 10 * 60 * 1000),
          });
        }

        // Ordenar por timestamp (mais recentes primeiro)
        mockNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Erro ao gerar notificações:', error);
      }
    };

    loadNotifications();

    // Configurar listener em tempo real se tabela existir
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );

      // Tentar atualizar no banco se a tabela existir
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}
