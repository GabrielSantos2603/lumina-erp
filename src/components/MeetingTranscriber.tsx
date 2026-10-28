import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mic,
  Square,
  Loader2,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { RecordingSetupModal, type RecordingConfig } from "./RecordingSetupModal";

interface MeetingTranscriberProps {
  meetingId: string;
}

interface Task {
  tarefa: string;
  responsavel?: string;
  prazo?: string;
}

interface MeetingSummary {
  resumo: string;
  pontos_principais: string[];
  tarefas: Task[];
  decisoes: string[];
  proximos_passos: string[];
}

export function MeetingTranscriber({ meetingId }: MeetingTranscriberProps) {
  // TODO: Usar meetingId para salvar transcrição no backend
  console.log('Meeting ID:', meetingId);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recordingConfigRef = useRef<RecordingConfig | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    // Limpar timer quando componente for desmontado
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenSetup = () => {
    setShowSetup(true);
  };

  const handleStartRecordingWithConfig = async (config: RecordingConfig) => {
    setShowSetup(false);
    setError(null);
    recordingConfigRef.current = config;

    // Verificar API Key antes de iniciar gravação
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError("Configure VITE_OPENAI_API_KEY no arquivo .env.local para usar a transcrição");
      toast.error("API Key da OpenAI não configurada");
      return;
    }

    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const streamsToClean: MediaStream[] = [];

      // Capturar microfone se habilitado
      if (config.micEnabled) {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });
        streamsToClean.push(micStream);
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
        toast.success("✅ Microfone capturado!");
      }

      // Capturar áudio do sistema se habilitado
      if (config.systemAudioEnabled) {
        const systemStream = await navigator.mediaDevices.getDisplayMedia({
          video: config.screenShareEnabled,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        // Se não quer vídeo, para os tracks de vídeo
        if (!config.screenShareEnabled) {
          systemStream.getVideoTracks().forEach((track) => track.stop());
        }

        streamsToClean.push(systemStream);
        const systemSource = audioContext.createMediaStreamSource(systemStream);
        systemSource.connect(destination);
        toast.success("✅ Áudio da reunião capturado!");
      }

      const combinedStream = destination.stream;
      const mediaRecorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);

        // Limpar recursos
        streamsToClean.forEach((stream) =>
          stream.getTracks().forEach((track) => track.stop())
        );
        audioContext.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      startRecordingTimer();
      toast.success("🎙️ Gravação iniciada!");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      setError(`Erro ao capturar áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error(
        "Erro ao capturar áudio. Verifique as permissões do navegador."
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      stopRecordingTimer();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      const errorMsg = "Configure VITE_OPENAI_API_KEY no arquivo .env.local";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsProcessing(false);
      return;
    }

    try {
      // Verificar tamanho do arquivo (max 25MB para Whisper)
      if (audioBlob.size > 25 * 1024 * 1024) {
        throw new Error("Arquivo de áudio muito grande (máx: 25MB). Tente uma gravação mais curta.");
      }

      toast.loading("Transcrevendo com OpenAI Whisper...", { id: "transcribing" });

      // Criar FormData para enviar áudio
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "pt");
      formData.append("response_format", "json");

      // Transcrever com Whisper
      const transcriptionResponse = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        }
      );

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json().catch(() => ({}));
        throw new Error(`Erro na API do Whisper (${transcriptionResponse.status}): ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcribedText = transcriptionData.text;

      if (!transcribedText || transcribedText.trim().length === 0) {
        throw new Error("Nenhum áudio foi detectado na gravação. Verifique o microfone e tente novamente.");
      }

      setTranscript(transcribedText);
      toast.dismiss("transcribing");
      toast.success("✅ Transcrição concluída!");

      // Gerar resumo com GPT
      await generateSummary(transcribedText);
    } catch (error) {
      console.error("Erro ao processar áudio:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao transcrever áudio";
      setError(errorMsg);
      toast.dismiss("transcribing");
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  const generateSummary = async (text: string) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    try {
      toast.loading("Gerando resumo com IA...", { id: "summary" });

      // Verificar se o texto é muito longo (limite de tokens do GPT)
      if (text.length > 15000) {
        text = text.substring(0, 15000) + "... [texto truncado para análise]";
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 2000,
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em resumir reuniões profissionais. 

Analise a transcrição e gere um resumo estruturado em JSON com:

{
  "resumo": "Resumo geral da reunião em 2-3 frases",
  "pontos_principais": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "tarefas": [
    {
      "tarefa": "Descrição clara da tarefa",
      "responsavel": "Nome da pessoa responsável (se mencionado)",
      "prazo": "Data ou prazo (se mencionado)"
    }
  ],
  "decisoes": ["Decisão tomada 1", "Decisão tomada 2"],
  "proximos_passos": ["Próximo passo 1", "Próximo passo 2"]
}

IMPORTANTE: 
- Se alguma seção estiver vazia, retorne um array vazio []
- Seja preciso e objetivo
- Retorne APENAS o JSON válido, sem texto adicional`,
            },
            {
              role: "user",
              content: `Transcrição da reunião para análise:\n\n${text}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro na API do GPT (${response.status}): ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Resposta inválida da API do GPT");
      }

      const summaryData = JSON.parse(data.choices[0].message.content);

      // Validar estrutura básica do JSON
      if (!summaryData || typeof summaryData !== 'object') {
        throw new Error("Formato de resumo inválido retornado pela IA");
      }

      setSummary(summaryData);
      toast.dismiss("summary");
      toast.success("✨ Resumo gerado com sucesso!");

      // TODO: Salvar no backend quando meetingId estiver sendo usado
      // await meetingService.updateMeetingTranscription(meetingId, text, summaryData);

    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao gerar resumo";
      setError(errorMsg);
      toast.dismiss("summary");
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `TRANSCRIÇÃO:\n${transcript}\n\n${
      summary
        ? `RESUMO:\n${JSON.stringify(summary, null, 2)}`
        : ""
    }`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Assistente IA - Transcrição e Resumo
            </CardTitle>
            <div className="flex gap-2">
              {!isRecording && !isProcessing && (
                <Button onClick={handleOpenSetup} className="gap-2">
                  <Mic className="h-4 w-4" />
                  Iniciar Gravação
                </Button>
              )}

              {isRecording && (
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="gap-2 animate-pulse"
                >
                  <Square className="h-4 w-4" />
                  Parar e Transcrever
                </Button>
              )}

              {transcript && (
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  disabled={isProcessing}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {isRecording && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-green-500 animate-pulse" />
                <div className="w-1 h-4 bg-green-500 animate-pulse [animation-delay:0.2s]" />
                <div className="w-1 h-4 bg-green-500 animate-pulse [animation-delay:0.4s]" />
              </div>
              <span className="font-medium">
                🎤 Gravando... {formatTime(recordingTime)}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Capturando microfone + áudio da reunião
            </div>
          </CardContent>
        )}

        {isProcessing && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Processando com OpenAI...</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Aviso sobre API Key ou Erros */}
      {(!import.meta.env.VITE_OPENAI_API_KEY || error) && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {error ? (
                  <>
                    <p className="font-medium text-red-900 dark:text-red-300 mb-1">
                      Erro na Transcrição
                    </p>
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setError(null)} 
                      className="mt-2"
                    >
                      Tentar Novamente
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-yellow-900 dark:text-yellow-300 mb-1">
                      Configure a API Key da OpenAI
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400">
                      Adicione <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">VITE_OPENAI_API_KEY</code> no arquivo <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env.local</code> para usar transcrição com Whisper + resumo com GPT-4.
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 mt-2">
                      💡 <strong>Como funciona:</strong> Clique em "Iniciar Gravação" → Selecione a aba da sua reunião (Zoom, Meet, Teams, etc) → O sistema captura SEU microfone + áudio de TODOS os participantes → Gera transcrição + resumo completo!
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcrição */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Transcrição Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={transcriptRef}
              className="max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {transcript.split(" ").length} palavras
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      {summary && (
        <div className="space-y-4">
          {/* Resumo Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lumina-500" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{summary.resumo}</p>
            </CardContent>
          </Card>

          {/* Pontos Principais */}
          {summary.pontos_principais && summary.pontos_principais.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🎯 Pontos Principais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.pontos_principais.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Tarefas */}
          {summary.tarefas && summary.tarefas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>✅ Tarefas (Action Items)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.tarefas.map((item: Task, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <input 
                      type="checkbox" 
                      className="mt-1" 
                      title={`Marcar tarefa: ${item.tarefa}`}
                      aria-label={`Marcar tarefa: ${item.tarefa}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.tarefa}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        {item.responsavel && (
                          <span>👤 {item.responsavel}</span>
                        )}
                        {item.prazo && <span>📅 {item.prazo}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Decisões */}
          {summary.decisoes && summary.decisoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Decisões Tomadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {summary.decisoes.map((decision: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-lumina-600 mt-0.5 flex-shrink-0" />
                      {decision}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Próximos Passos */}
          {summary.proximos_passos && summary.proximos_passos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🚀 Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {summary.proximos_passos.map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-lumina-100 dark:bg-lumina-900/30 flex items-center justify-center text-xs font-medium text-lumina-600 dark:text-lumina-400">
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Configuração de Gravação */}
      {showSetup && (
        <RecordingSetupModal
          onStart={handleStartRecordingWithConfig}
          onClose={() => setShowSetup(false)}
        />
      )}
    </div>
  );
}
