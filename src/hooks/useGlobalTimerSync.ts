import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook global que mantém o timer sincronizado no localStorage
 * mesmo quando o componente Timer não está montado.
 * 
 * Este hook deve ser usado no nível do App para garantir
 * que o timer continue rodando em todas as abas/páginas.
 */
export function useGlobalTimerSync() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `activeTimer_${user.id}`;

    const updateTimer = () => {
      const savedTimer = localStorage.getItem(storageKey);
      if (!savedTimer) return;

      try {
        const timerData = JSON.parse(savedTimer);
        
        // Apenas atualizar se o timer estiver rodando
        if (timerData.isRunning && timerData.startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - timerData.startTime) / 1000);
          
          // Atualizar currentSeconds no localStorage
          timerData.currentSeconds = elapsed;
          localStorage.setItem(storageKey, JSON.stringify(timerData));
        }
      } catch (error) {
        console.error("Erro ao atualizar timer global:", error);
      }
    };

    // Iniciar atualização a cada segundo
    const intervalId = window.setInterval(updateTimer, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user?.id]);
}
