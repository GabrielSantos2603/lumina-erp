import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Pause, Square, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { timeTrackingService } from "@/services/timeTrackingService";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

interface FloatingTimerProps {
  onStop?: () => void;
}

export function FloatingTimer({ onStop }: FloatingTimerProps) {
  const { user } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [userName, setUserName] = useState("");
  const [entryId, setEntryId] = useState<string>("");

  // Helper: Gerar chave do localStorage específica para o usuário
  const getTimerStorageKey = useCallback(() => {
    if (!user?.id) return "activeTimer"; // Fallback
    return `activeTimer_${user.id}`;
  }, [user?.id]);

  useEffect(() => {
    const updateTimer = () => {
      const storageKey = getTimerStorageKey();
      const savedTimer = localStorage.getItem(storageKey);
      if (savedTimer) {
        const timer = JSON.parse(savedTimer);
        setProjectName(timer.projectName || "");
        setUserName(timer.userName || "");
        setIsRunning(timer.isRunning || false);
        setEntryId(timer.entryId || "");
        
        // Usar currentSeconds se disponível (atualizado pelo Timer.tsx)
        // Caso contrário, calcular usando startTime
        if (timer.currentSeconds !== undefined && timer.isRunning) {
          setTimerSeconds(timer.currentSeconds);
        } else if (timer.startTime && timer.isRunning) {
          const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
          setTimerSeconds(elapsed);
        } else {
          setTimerSeconds(timer.seconds || 0);
        }
      } else {
        // Se não tem timer salvo, resetar estados
        setProjectName("");
        setUserName("");
        setTimerSeconds(0);
        setIsRunning(false);
        setEntryId("");
      }
    };

    // Atualizar imediatamente
    updateTimer();

    // Continuar atualizando a cada 250ms para sincronização mais rápida
    const interval = setInterval(updateTimer, 250);
    
    return () => {
      clearInterval(interval);
    };
  }, [getTimerStorageKey]); // Recriar quando a função mudar

  // Sincronização entre abas via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = getTimerStorageKey();
      
      // Apenas processar mudanças na chave do timer deste usuário
      if (e.key === storageKey) {
        if (e.newValue === null) {
          // Timer foi removido em outra aba
          setIsRunning(false);
          setProjectName("");
          setUserName("");
          setTimerSeconds(0);
          setEntryId("");
        } else {
          // Timer foi iniciado/atualizado em outra aba - ler novo valor
          const timer = JSON.parse(e.newValue);
          setProjectName(timer.projectName || "");
          setUserName(timer.userName || "");
          setIsRunning(timer.isRunning || false);
          setEntryId(timer.entryId || "");
          if (timer.currentSeconds !== undefined) {
            setTimerSeconds(timer.currentSeconds);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getTimerStorageKey]); // Re-criar listener se a função mudar

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePause = () => {
    const storageKey = getTimerStorageKey();
    const savedTimer = localStorage.getItem(storageKey);
    if (savedTimer) {
      const timer = JSON.parse(savedTimer);
      timer.isRunning = false;
      timer.startTime = null;
      timer.seconds = timerSeconds;
      localStorage.setItem(storageKey, JSON.stringify(timer));
      setIsRunning(false);
    }
  };

  const handleResume = () => {
    const storageKey = getTimerStorageKey();
    const savedTimer = localStorage.getItem(storageKey);
    if (savedTimer) {
      const timer = JSON.parse(savedTimer);
      timer.isRunning = true;
      timer.startTime = Date.now();
      timer.seconds = 0; // Resetar porque vamos usar startTime
      localStorage.setItem(storageKey, JSON.stringify(timer));
      setIsRunning(true);
    }
  };

  const handleStop = async () => {
    if (!entryId) {
      toast.error("Erro: ID da entrada não encontrado");
      return;
    }

    try {
      // Parar timer no banco de dados
      await timeTrackingService.stopTimer(entryId);
      
      const hours = (timerSeconds / 3600).toFixed(2);
      toast.success(`Timer parado! ${hours}h trabalhadas`);
      
      // Limpar localStorage e estados (específico do usuário)
      const storageKey = getTimerStorageKey();
      localStorage.removeItem(storageKey);
      setIsRunning(false);
      setProjectName("");
      setTimerSeconds(0);
      setEntryId("");
      
      if (onStop) onStop();
    } catch (error) {
      console.error("Erro ao parar timer:", error);
      toast.error("Erro ao parar timer. Tente novamente.");
    }
  };

  // Se não tem projeto selecionado, não mostrar
  if (!projectName) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 flex justify-end transition-all",
        "sm:left-auto sm:right-4"
      )}
    >
      <Card
        className={cn(
          "shadow-lg border-2",
          isRunning ? "border-lumina-500" : "border-muted",
          isMinimized ? "w-auto" : "w-full sm:w-auto"
        )}
      >
        <CardContent
          className={cn(
            "p-3",
            isMinimized ? "w-auto" : "w-full sm:w-72"
          )}
        >
          {isMinimized ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  isRunning ? "bg-lumina-500 animate-pulse" : "bg-muted-foreground"
                )} />
                <Timer className="h-4 w-4" />
                <span className="font-mono font-semibold text-sm">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      isRunning ? "bg-lumina-500 animate-pulse" : "bg-muted-foreground"
                    )} />
                    <span className="text-sm font-medium">Timer Ativo</span>
                  </div>
                  {userName && (
                    <span className="text-xs text-muted-foreground ml-4">
                      {userName}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Projeto:</p>
                <p className="text-sm font-medium truncate">{projectName}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="font-mono text-2xl font-bold">
                  {formatTimer(timerSeconds)}
                </p>
              </div>

              <div className="flex gap-2">
                {isRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    className="flex-1 gap-2"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResume}
                    className="flex-1 gap-2"
                  >
                    <Timer className="h-3.5 w-3.5" />
                    Retomar
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStop}
                  className="flex-1 gap-2"
                >
                  <Square className="h-3.5 w-3.5" />
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

