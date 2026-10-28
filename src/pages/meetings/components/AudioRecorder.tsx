import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  Play,
  Pause,
  Square,
  Download,
  Trash2,
  FileAudio,
  Volume2,
  Loader2,
  CheckCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AudioRecorderProps {
  onTranscriptionComplete?: (transcription: string, summary?: string) => void;
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  isTranscribing: boolean;
  transcriptionProgress: number;
}

export function AudioRecorder({ onTranscriptionComplete, onRecordingComplete, className }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isTranscribing: false,
    transcriptionProgress: 0
  });

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Formatar duração em mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar gravação
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false
        }));

        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, state.duration);
        }

        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start(1000); // Capturar dados a cada segundo

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }));

      // Iniciar contador de tempo
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  // Pausar gravação
  const pauseRecording = () => {
    if (mediaRecorder.current && state.isRecording) {
      mediaRecorder.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  // Retomar gravação
  const resumeRecording = () => {
    if (mediaRecorder.current && state.isPaused) {
      mediaRecorder.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorder.current && (state.isRecording || state.isPaused)) {
      mediaRecorder.current.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  // Descartar gravação
  const discardRecording = () => {
    setState(prev => ({
      ...prev,
      audioBlob: undefined,
      audioUrl: undefined,
      transcription: undefined,
      summary: undefined,
      duration: 0,
      isRecording: false,
      isPaused: false,
      isTranscribing: false,
      transcriptionProgress: 0
    }));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Transcrever áudio
  const transcribeAudio = async () => {
    if (!state.audioBlob) return;

    setState(prev => ({
      ...prev,
      isTranscribing: true,
      transcriptionProgress: 0
    }));

    try {
      // Simular progresso da transcrição
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          transcriptionProgress: Math.min(prev.transcriptionProgress + 10, 90)
        }));
      }, 300);

      // Simular chamada da API (substituir por integração real com Whisper/OpenAI)
      await new Promise(resolve => setTimeout(resolve, 3000));

      clearInterval(progressInterval);

      // Transcrição simulada
      const mockTranscription = `
Reunião iniciada às ${new Date().toLocaleTimeString()}.

Participantes presentes: Cliente João Silva e Arquiteta Maria Santos.

JOÃO: Boa tarde, Maria. Obrigado por aceitar esse projeto. Estamos muito animados para começar a reforma da nossa casa.

MARIA: Boa tarde, João! O prazer é meu. Pelo que você me contou por telefone, vocês querem uma reforma completa da área social, correto?

JOÃO: Isso mesmo. A sala está muito pequena e queremos integrar com a cozinha. Também pensamos em ampliar a área externa.

MARIA: Perfeito. E qual seria o orçamento disponível para essa reforma?

JOÃO: Estamos pensando em algo em torno de R$ 80.000 a R$ 100.000.

MARIA: Entendi. Com esse valor conseguimos fazer uma boa reforma. Vou precisar fazer algumas medições e elaborar uma proposta detalhada.

Decisões tomadas:
- Reforma da área social com integração sala/cozinha
- Ampliação da área externa  
- Orçamento: R$ 80.000 - R$ 100.000
- Próxima reunião: Medições e apresentação da proposta

MARIA: Vou agendar uma visita para medições na próxima semana. Pode ser terça-feira pela manhã?

JOÃO: Perfeito! Estaremos aguardando.

Reunião finalizada às ${new Date(Date.now() + 180000).toLocaleTimeString()}.
      `.trim();

      const mockSummary = `
📋 RESUMO EXECUTIVO

🏠 Projeto: Reforma residencial área social
👤 Cliente: João Silva
🏛️ Arquiteta: Maria Santos

💰 ORÇAMENTO
- Valor disponível: R$ 80.000 - R$ 100.000
- Status: Aprovado para desenvolvimento da proposta

🎯 ESCOPO DEFINIDO
✅ Integração sala/cozinha
✅ Ampliação área externa
✅ Reforma completa área social

📅 PRÓXIMOS PASSOS
1. Visita técnica para medições (Terça-feira manhã)
2. Desenvolvimento da proposta
3. Apresentação do projeto

🚀 STATUS: Projeto iniciado com sucesso
      `.trim();

      setState(prev => ({
        ...prev,
        transcription: mockTranscription,
        summary: mockSummary,
        isTranscribing: false,
        transcriptionProgress: 100
      }));

      if (onTranscriptionComplete) {
        onTranscriptionComplete(mockTranscription, mockSummary);
      }

    } catch (error) {
      console.error('Erro na transcrição:', error);
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        transcriptionProgress: 0
      }));
      alert('Erro na transcrição do áudio.');
    }
  };

  // Download do áudio
  const downloadAudio = () => {
    if (state.audioUrl) {
      const a = document.createElement('a');
      a.href = state.audioUrl;
      a.download = `reuniao-${new Date().toISOString().slice(0, 10)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Gravação de Áudio
          </div>
          <Badge variant={state.isRecording ? 'destructive' : 'outline'} className="gap-1">
            {state.isRecording ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                REC {formatDuration(state.duration)}
              </>
            ) : state.audioBlob ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Gravado ({formatDuration(state.duration)})
              </>
            ) : (
              'Pronto para gravar'
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles de Gravação */}
        <div className="flex flex-col items-center space-y-4">
          {!state.audioBlob ? (
            <div className="flex items-center gap-3">
              {!state.isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="gap-2 bg-red-500 hover:bg-red-600"
                >
                  <Mic className="h-5 w-5" />
                  Iniciar Gravação
                </Button>
              ) : (
                <>
                  {!state.isPaused ? (
                    <Button onClick={pauseRecording} size="lg" variant="outline" className="gap-2">
                      <Pause className="h-5 w-5" />
                      Pausar
                    </Button>
                  ) : (
                    <Button onClick={resumeRecording} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Continuar
                    </Button>
                  )}
                  <Button onClick={stopRecording} size="lg" variant="outline" className="gap-2">
                    <Square className="h-5 w-5" />
                    Parar
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="w-full space-y-4">
              {/* Player de Áudio */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Reprodução</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(state.duration)}
                  </span>
                </div>
                
                {state.audioUrl && (
                  <audio
                    ref={audioRef}
                    controls
                    src={state.audioUrl}
                    className="w-full"
                  />
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={transcribeAudio} 
                  className="gap-2 flex-1"
                  disabled={state.isTranscribing}
                >
                  {state.isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {state.isTranscribing ? 'Transcrevendo...' : 'Transcrever com IA'}
                </Button>
                
                <Button onClick={downloadAudio} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                
                <Button onClick={discardRecording} variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progresso da Transcrição */}
        {state.isTranscribing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processando áudio...</span>
              <span>{state.transcriptionProgress}%</span>
            </div>
            <Progress value={state.transcriptionProgress} />
          </div>
        )}

        {/* Resultados da Transcrição */}
        {state.transcription && (
          <div className="space-y-4">
            <div className="border rounded-lg">
              <div className="border-b p-3 bg-muted/50">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transcrição Completa
                </h4>
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {state.transcription}
                </pre>
              </div>
            </div>

            {state.summary && (
              <div className="border rounded-lg">
                <div className="border-b p-3 bg-muted/50">
                  <h4 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Resumo Inteligente
                  </h4>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {state.summary}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status e Dicas */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>💡 Para melhor qualidade, use em ambiente silencioso</p>
          <p>🎧 A transcrição funciona melhor com áudio claro e sem ruído</p>
        </div>
      </CardContent>
    </Card>
  );
}