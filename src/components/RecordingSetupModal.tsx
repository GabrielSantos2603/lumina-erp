import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Mic,
  MonitorUp,
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface RecordingSetupModalProps {
  onStart: (config: RecordingConfig) => void;
  onClose: () => void;
}

export interface RecordingConfig {
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  screenShareEnabled: boolean;
}

export function RecordingSetupModal({ onStart, onClose }: RecordingSetupModalProps) {
  const [config, setConfig] = useState<RecordingConfig>({
    micEnabled: true,
    systemAudioEnabled: true,
    screenShareEnabled: false,
  });

  const [setupStatus, setSetupStatus] = useState({
    micReady: false,
    systemAudioReady: false,
    screenShareReady: false,
  });

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [systemStream, setSystemStream] = useState<MediaStream | null>(null);

  const handleRequestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      setMicStream(stream);
      setSetupStatus((prev) => ({ ...prev, micReady: true }));
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
      alert("Erro ao acessar microfone. Verifique as permissões do navegador.");
    }
  };

  const handleRequestSystemAudio = async () => {
    try {
      // Sempre pedir vídeo (necessário para getDisplayMedia)
      // Depois paramos o vídeo se não for necessário
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Simplificado - navegador gerencia as opções
      });

      // Se não quer compartilhar tela, para o vídeo
      if (!config.screenShareEnabled) {
        stream.getVideoTracks().forEach((track) => track.stop());
      }

      // Verifica se conseguiu áudio
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert(
          "⚠️ Nenhum áudio capturado! Certifique-se de marcar 'Compartilhar áudio da aba' ao selecionar a aba da reunião."
        );
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setSystemStream(stream);
      setSetupStatus((prev) => ({
        ...prev,
        systemAudioReady: true,
        screenShareReady: config.screenShareEnabled,
      }));
    } catch (error: any) {
      console.error("Erro ao capturar áudio do sistema:", error);
      
      if (error.name === "NotSupportedError") {
        alert(
          "❌ Seu navegador não suporta captura de áudio do sistema.\n\n" +
          "Recomendamos usar Google Chrome, Microsoft Edge ou Brave.\n\n" +
          "Alternativamente, use apenas a opção 'Seu Microfone'."
        );
      } else if (error.name === "NotAllowedError") {
        alert(
          "❌ Permissão negada.\n\n" +
          "Por favor, tente novamente e permita o compartilhamento de tela/áudio."
        );
      } else {
        alert(
          "⚠️ Erro ao capturar áudio do sistema.\n\n" +
          "Dicas:\n" +
          "1. Selecione a ABA da reunião (não a janela inteira)\n" +
          "2. Marque 'Compartilhar áudio da aba'\n" +
          "3. Use Chrome, Edge ou Brave para melhor compatibilidade"
        );
      }
    }
  };

  const handleStartRecording = () => {
    const readyToStart =
      (config.micEnabled ? setupStatus.micReady : true) &&
      (config.systemAudioEnabled ? setupStatus.systemAudioReady : true);

    if (!readyToStart) {
      alert("Configure as fontes de áudio antes de iniciar!");
      return;
    }

    onStart(config);
  };

  const handleClose = () => {
    // Limpar streams se foram criados mas não usados
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
    }
    if (systemStream) {
      systemStream.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🎙️ Configurar Gravação de Reunião</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecione as fontes de áudio para gravar e transcrever a reunião
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Opção 1: Microfone */}
          <Card
            className={`border-2 ${
              config.micEnabled
                ? "border-primary bg-primary/5"
                : "border-muted bg-muted/20"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-base font-semibold">Seu Microfone</Label>
                      {setupStatus.micReady && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Captura sua voz durante a reunião
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mic-toggle" className="sr-only">
                    Habilitar microfone
                  </Label>
                  <input
                    type="checkbox"
                    checked={config.micEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, micEnabled: e.target.checked })
                    }
                    className="h-5 w-5"
                    id="mic-toggle"
                    aria-label="Habilitar microfone"
                  />
                </div>
              </div>

              {config.micEnabled && !setupStatus.micReady && (
                <div className="mt-4">
                  <Button onClick={handleRequestMic} className="w-full">
                    <Mic className="h-4 w-4 mr-2" />
                    Permitir Acesso ao Microfone
                  </Button>
                </div>
              )}

              {config.micEnabled && setupStatus.micReady && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Microfone configurado!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opção 2: Áudio do Sistema */}
          <Card
            className={`border-2 ${
              config.systemAudioEnabled
                ? "border-primary bg-primary/5"
                : "border-muted bg-muted/20"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Volume2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-base font-semibold">Áudio da Reunião</Label>
                      {setupStatus.systemAudioReady && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Captura o áudio de TODOS os participantes (Zoom, Meet, Teams, etc)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="system-audio-toggle" className="sr-only">
                    Habilitar áudio do sistema
                  </Label>
                  <input
                    type="checkbox"
                    checked={config.systemAudioEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, systemAudioEnabled: e.target.checked })
                    }
                    className="h-5 w-5"
                    id="system-audio-toggle"
                    aria-label="Habilitar áudio do sistema"
                  />
                </div>
              </div>

              {config.systemAudioEnabled && !setupStatus.systemAudioReady && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-300">
                      <p className="font-medium mb-1">⚠️ Importante:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Clique no botão abaixo</li>
                        <li>Selecione a aba da sua reunião (Zoom, Meet, Teams, etc)</li>
                        <li>
                          <strong>Marque a opção "Compartilhar áudio da aba"</strong>
                        </li>
                      </ol>
                    </div>
                  </div>
                  <Button onClick={handleRequestSystemAudio} className="w-full">
                    <MonitorUp className="h-4 w-4 mr-2" />
                    Selecionar Aba da Reunião
                  </Button>
                </div>
              )}

              {config.systemAudioEnabled && setupStatus.systemAudioReady && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Áudio do sistema configurado!</span>
                </div>
              )}

              {/* Opção: Compartilhar Tela (opcional) */}
              {config.systemAudioEnabled && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.screenShareEnabled}
                      onChange={(e) =>
                        setConfig({ ...config, screenShareEnabled: e.target.checked })
                      }
                      className="h-4 w-4"
                      id="screen-share-toggle"
                      aria-label="Também gravar vídeo da tela"
                    />
                    <Label htmlFor="screen-share-toggle" className="text-sm cursor-pointer">
                      Também gravar vídeo da tela (opcional)
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recomendação */}
          <div className="flex items-start gap-3 p-4 bg-lumina-50 dark:bg-lumina-900/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-lumina-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-lumina-900 dark:text-lumina-300 mb-1">
                💡 Recomendado para melhor qualidade:
              </p>
              <p className="text-lumina-700 dark:text-lumina-400">
                Ative <strong>ambas</strong> as opções para capturar sua voz + vozes de todos
                os participantes da reunião!
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartRecording}
              disabled={
                (!config.micEnabled && !config.systemAudioEnabled) ||
                (config.micEnabled && !setupStatus.micReady) ||
                (config.systemAudioEnabled && !setupStatus.systemAudioReady)
              }
            >
              🎙️ Iniciar Gravação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
