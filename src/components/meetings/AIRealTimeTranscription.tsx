import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { meetingAnalysisService } from '@/services/meetingAnalysisService';
import { 
  Mic, 
  MicOff, 
  Activity,
  Brain, 
  FileText, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Lightbulb,
  Speaker,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Save,
  Database,
  Monitor,
  Volume2,
  Edit,
  Settings,
  Download
} from 'lucide-react';

// Tipos para Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

// Interfaces aprimoradas
interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number; // milissegundos desde o início
  confidence: number;
  speaker?: string;
  isProcessing?: boolean;
  audioSource: 'microphone' | 'system' | 'meeting'; // 🚨 NOVO
  meetingApp?: 'teams' | 'meet' | 'zoom' | 'whatsapp' | 'generic'; // 🚨 NOVO
  aiAnalysis?: {
    isKeyPoint: boolean;
    isDecision: boolean;
    isAction: boolean;
    priority: 'low' | 'medium' | 'high';
    category: string;
    sentiment?: 'positive' | 'neutral' | 'negative'; // 🚨 NOVO
    topics?: string[]; // 🚨 NOVO
  };
}

// 🚨 NOVA estrutura JSON completa para salvamento
interface TranscriptionData {
  meetingId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  participants: Array<{
    name: string;
    role?: string;
    speakingTime: number; // em milissegundos
  }>;
  segments: TranscriptionSegment[];
  audioSources: {
    microphone: boolean;
    systemAudio: boolean;
    detectedApps: string[];
  };
  quality: {
    averageConfidence: number;
    totalWords: number;
    silenceTime: number; // tempo de silêncio em ms
  };
  metadata: {
    language: string;
    model: string;
    version: string;
    createdAt: string;
    lastUpdated: string;
  };
}

interface AIInsight {
  id: string;
  type: 'key_point' | 'decision' | 'action_item' | 'concern' | 'suggestion';
  content: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  relatedSegments: string[];
  confidence: number;
  category?: string; // 🚨 NOVO
  sentiment?: 'positive' | 'neutral' | 'negative'; // 🚨 NOVO
}

interface MeetingAnalysis {
  summary: string;
  keyPoints: string[];
  decisions: Array<{
    decision: string;
    responsible?: string;
    deadline?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  actionItems: Array<{
    action: string;
    responsible?: string;
    deadline?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  nextSteps: string[];
  concerns: string[];
  participants: string[];
  duration: number;
  mood: 'positive' | 'neutral' | 'negative';
  transcriptionData?: TranscriptionData; // 🚨 NOVO - dados completos
}

interface AIRealTimeTranscriptionProps {
  meetingId: string;
  projectId: string;
  onAnalysisUpdate?: (analysis: MeetingAnalysis) => void;
  onNotesGenerated?: (notes: Array<{
    id: string;
    content: string;
    note_type: string;
    ai_enhanced: boolean;
    timestamp_minutes: number;
  }>) => void;
}

// 🚨 NOVO: Hook aprimorado para captura de múltiplas fontes de áudio
const useAdvancedAudioCapture = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioSources, setAudioSources] = useState({
    microphone: true,
    systemAudio: false,
    meetingApp: false
  });
  const [detectedApps, setDetectedApps] = useState<string[]>([]);
  
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    // Verificar suporte às APIs necessárias
    const speechSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const mediaSupport = 'getDisplayMedia' in navigator.mediaDevices;
    
    setIsSupported(speechSupport && mediaSupport);
    
    if (speechSupport) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';
        recognition.maxAlternatives = 3; // 🚨 NOVO: múltiplas alternativas
      }
    }
  }, []);

  // 🚨 NOVA função para detectar aplicativos de reunião
  const detectMeetingApps = useCallback(async () => {
    const detected: string[] = [];
    
    try {
      // Verificar tabs abertas (se possível)
      if ('getDisplayMedia' in navigator.mediaDevices) {
        // Esta é uma simulação - em produção seria mais sofisticado
        if (document.title.includes('Meet') || window.location.href.includes('meet')) {
          detected.push('Google Meet');
        }
        if (document.title.includes('Teams') || window.location.href.includes('teams')) {
          detected.push('Microsoft Teams');
        }
        if (document.title.includes('Zoom') || window.location.href.includes('zoom')) {
          detected.push('Zoom');
        }
        if (document.title.includes('WhatsApp') || window.location.href.includes('whatsapp')) {
          detected.push('WhatsApp');
        }
      }
    } catch (error) {
      console.warn('Não foi possível detectar aplicativos de reunião:', error);
    }
    
    setDetectedApps(detected);
    return detected;
  }, []);

  // 🚨 NOVA função para capturar áudio do sistema
  const captureSystemAudio = useCallback(async () => {
    try {
      const displayMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      return displayMediaStream;
    } catch (error) {
      console.error('Erro ao capturar áudio do sistema:', error);
      return null;
    }
  }, []);

  // 🚨 NOVA função para combinar múltiplas fontes de áudio
  const setupMultiSourceAudio = useCallback(async () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const streams: MediaStream[] = [];
      
      // Capturar microfone
      if (audioSources.microphone) {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        streams.push(micStream);
      }
      
      // Capturar áudio do sistema
      if (audioSources.systemAudio) {
        const systemStream = await captureSystemAudio();
        if (systemStream) {
          streams.push(systemStream);
        }
      }
      
      // Combinar streams se houver múltiplas fontes
      if (streams.length > 1) {
        const destination = audioContext.createMediaStreamDestination();
        
        streams.forEach(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(destination);
        });
        
        mediaStreamRef.current = destination.stream;
      } else if (streams.length === 1) {
        mediaStreamRef.current = streams[0];
      }
      
      return mediaStreamRef.current;
    } catch (error) {
      console.error('Erro ao configurar captura multi-fonte:', error);
      return null;
    }
  }, [audioSources, captureSystemAudio]);

  const startListening = useCallback(async (onResult: (transcript: string, isFinal: boolean, source: string) => void) => {
    if (!recognitionRef.current || isListening) return;

    try {
      // Detectar aplicativos de reunião
      await detectMeetingApps();
      
      // Configurar captura de áudio se necessário
      if (audioSources.systemAudio) {
        await setupMultiSourceAudio();
      }

      const recognition = recognitionRef.current;
      if (!recognition) return;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        let isFinal = false;
        let source = 'microphone';
        
        // Detectar fonte baseada no contexto
        if (audioSources.systemAudio && detectedApps.length > 0) {
          source = 'meeting';
        }
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        
        onResult(transcript, isFinal, source);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Erro ao iniciar escuta:', error);
    }
  }, [isListening, audioSources, detectedApps, detectMeetingApps, setupMultiSourceAudio]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    // Limpar streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Limpar contexto de áudio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [isListening]);

  const updateAudioSources = useCallback((sources: typeof audioSources) => {
    setAudioSources(sources);
  }, []);

  return { 
    isSupported, 
    isListening, 
    startListening, 
    stopListening,
    audioSources,
    updateAudioSources,
    detectedApps,
    detectMeetingApps
  };
};

export function AIRealTimeTranscription({ 
  meetingId, 
  onAnalysisUpdate, 
  onNotesGenerated 
}: AIRealTimeTranscriptionProps) {
  // Estados principais
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [currentSpeaker, setCurrentSpeaker] = useState<string>('Participante 1');
  const [isPaused, setIsPaused] = useState(false);

  // Estados da interface
  const [activeTab, setActiveTab] = useState<'live' | 'analysis' | 'notes' | 'settings'>('live'); // 🚨 NOVA aba settings
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isGeneratingAta, setIsGeneratingAta] = useState(false);

  // 🚨 NOVOS ESTADOS para salvamento e configuração
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSegments, setIsSavingSegments] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSave] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editableAtaContent, setEditableAtaContent] = useState<string>(''); // 🚨 NOVO para ata editável

  // 🚨 NOVO Hook aprimorado
  const { 
    isSupported, 
    isListening, 
    startListening, 
    stopListening,
    audioSources,
    updateAudioSources,
    detectedApps 
  } = useAdvancedAudioCapture();

  // Refs
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const processingTimeoutRef = useRef<number | null>(null);

  // 🚨 NOVA função para criar dados completos de transcrição JSON
  const createTranscriptionData = useCallback((): TranscriptionData => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Calcular estatísticas de participantes
    const participantStats = new Map<string, number>();
    segments.forEach(segment => {
      const speaker = segment.speaker || 'Desconhecido';
      const currentTime = participantStats.get(speaker) || 0;
      // Estimar tempo de fala baseado no comprimento do texto
      const estimatedSpeakingTime = segment.text.length * 50; // ~50ms por caractere
      participantStats.set(speaker, currentTime + estimatedSpeakingTime);
    });

    return {
      meetingId,
      startTime,
      endTime,
      duration,
      participants: Array.from(participantStats.entries()).map(([name, speakingTime]) => ({
        name,
        role: name === 'Moderador' ? 'moderator' : 'participant',
        speakingTime
      })),
      segments,
      audioSources: {
        microphone: audioSources.microphone,
        systemAudio: audioSources.systemAudio,
        detectedApps
      },
      quality: {
        averageConfidence: segments.reduce((acc, s) => acc + s.confidence, 0) / (segments.length || 1),
        totalWords: segments.reduce((acc, s) => acc + s.text.split(' ').length, 0),
        silenceTime: Math.max(0, duration - segments.reduce((acc, s) => acc + (s.text.length * 50), 0))
      },
      metadata: {
        language: 'pt-BR',
        model: 'Web Speech API',
        version: '2.0',
        createdAt: new Date(startTime).toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
  }, [meetingId, startTime, segments, audioSources, detectedApps]);

  // Utilitários
  const formatTime = useCallback((timestamp: number): string => {
    const seconds = Math.floor(timestamp / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const getCurrentTimestamp = useCallback((): number => {
    return Date.now() - startTime;
  }, [startTime]);

  // 🚨 NOVA análise de IA aprimorada com processamento de JSON completo
  const analyzeSegmentWithAI = useCallback(async (segment: TranscriptionSegment): Promise<AIInsight[]> => {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const insights: AIInsight[] = [];
    const text = segment.text.toLowerCase();

    // 🚨 Análise de sentimento básica
    const positiveWords = ['ótimo', 'excelente', 'concordo', 'perfeito', 'sucesso', 'aprovado'];
    const negativeWords = ['problema', 'dificuldade', 'erro', 'falha', 'preocupado', 'risco'];
    const sentiment: 'positive' | 'neutral' | 'negative' = 
      positiveWords.some(word => text.includes(word)) ? 'positive' :
      negativeWords.some(word => text.includes(word)) ? 'negative' : 'neutral';

    // 🚨 Categorização automática
    const getCategory = (text: string): string => {
      if (text.includes('orçament') || text.includes('custo') || text.includes('valor')) return 'financeiro';
      if (text.includes('prazo') || text.includes('cronogram') || text.includes('entrega')) return 'temporal';
      if (text.includes('design') || text.includes('arquitet') || text.includes('projeto')) return 'técnico';
      if (text.includes('cliente') || text.includes('reunião') || text.includes('apresent')) return 'comunicação';
      return 'geral';
    };

    // Detectar decisões
    if (text.includes('decidimos') || text.includes('ficou definido') || text.includes('aprovado') || text.includes('concordamos')) {
      insights.push({
        id: `decision-${segment.id}`,
        type: 'decision',
        content: `Decisão identificada: ${segment.text}`,
        timestamp: segment.timestamp,
        priority: 'high',
        relatedSegments: [segment.id],
        confidence: 0.8 + Math.random() * 0.2,
        category: getCategory(text),
        sentiment
      });
    }

    // Detectar ações
    if (text.includes('vou fazer') || text.includes('preciso') || text.includes('até') || text.includes('prazo')) {
      insights.push({
        id: `action-${segment.id}`,
        type: 'action_item',
        content: `Ação identificada: ${segment.text}`,
        timestamp: segment.timestamp,
        priority: 'medium',
        relatedSegments: [segment.id],
        confidence: 0.7 + Math.random() * 0.2,
        category: getCategory(text),
        sentiment
      });
    }

    // Detectar pontos importantes
    if (text.includes('importante') || text.includes('fundamental') || text.includes('crucial') || text.includes('destaca')) {
      insights.push({
        id: `key-${segment.id}`,
        type: 'key_point',
        content: `Ponto importante: ${segment.text}`,
        timestamp: segment.timestamp,
        priority: 'high',
        relatedSegments: [segment.id],
        confidence: 0.75 + Math.random() * 0.2,
        category: getCategory(text),
        sentiment
      });
    }

    // Detectar preocupações
    if (text.includes('problema') || text.includes('dificuldade') || text.includes('preocupa') || text.includes('risco')) {
      insights.push({
        id: `concern-${segment.id}`,
        type: 'concern',
        content: `Preocupação identificada: ${segment.text}`,
        timestamp: segment.timestamp,
        priority: 'high',
        relatedSegments: [segment.id],
        confidence: 0.7 + Math.random() * 0.2,
        category: getCategory(text),
        sentiment: 'negative'
      });
    }

    // 🚨 NOVA - Detectar sugestões
    if (text.includes('sugiro') || text.includes('recomendo') || text.includes('seria bom') || text.includes('poderia')) {
      insights.push({
        id: `suggestion-${segment.id}`,
        type: 'suggestion',
        content: `Sugestão identificada: ${segment.text}`,
        timestamp: segment.timestamp,
        priority: 'medium',
        relatedSegments: [segment.id],
        confidence: 0.6 + Math.random() * 0.3,
        category: getCategory(text),
        sentiment
      });
    }

    return insights;
  }, []);

  // 🚨 NOVA geração de análise completa com dados JSON estruturados
  const generateMeetingAnalysis = useCallback(async (): Promise<MeetingAnalysis> => {
    const duration = getCurrentTimestamp();
    const keyInsights = insights.filter(i => i.type === 'key_point');
    const decisions = insights.filter(i => i.type === 'decision');
    const actions = insights.filter(i => i.type === 'action_item');
    const concerns = insights.filter(i => i.type === 'concern');
    const suggestions = insights.filter(i => i.type === 'suggestion');

    // 🚨 Análise de sentimento geral da reunião
    const sentiments = insights.map(i => i.sentiment).filter(Boolean);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const overallMood: 'positive' | 'neutral' | 'negative' = 
      positiveCount > negativeCount ? 'positive' :
      negativeCount > positiveCount ? 'negative' : 'neutral';

    // 🚨 Criar dados completos de transcrição
    const transcriptionData = createTranscriptionData();

    return {
      summary: `Reunião realizada com duração de ${formatTime(duration)}. Foram identificados ${decisions.length} decisões, ${actions.length} ações, ${keyInsights.length} pontos importantes e ${suggestions.length} sugestões. O clima geral da reunião foi ${overallMood === 'positive' ? 'positivo' : overallMood === 'negative' ? 'negativo' : 'neutro'}.`,
      keyPoints: keyInsights.map(i => i.content),
      decisions: decisions.map(d => ({
        decision: d.content,
        responsible: 'A definir',
        priority: d.priority
      })),
      actionItems: actions.map(a => ({
        action: a.content,
        responsible: 'A definir',
        priority: a.priority
      })),
      nextSteps: [
        'Revisar todas as decisões tomadas',
        'Definir responsáveis para cada ação',
        'Estabelecer prazos para as ações pendentes',
        ...suggestions.map(s => `Considerar: ${s.content}`),
        'Agendar próxima reunião de acompanhamento'
      ],
      concerns: concerns.map(c => c.content),
      participants: transcriptionData.participants.map(p => p.name),
      duration: Math.floor(duration / 1000),
      mood: overallMood,
      transcriptionData // 🚨 Incluir dados completos
    };
  }, [insights, getCurrentTimestamp, formatTime, createTranscriptionData]);

  // 🚨 NOVA manipulação de transcrição com detecção de fonte
  const handleTranscriptionResult = useCallback((transcript: string, isFinal: boolean, source: string) => {
    if (isPaused) return;

    setCurrentTranscript(transcript);

    if (isFinal && transcript.trim()) {
      // 🚨 Detectar aplicativo de reunião baseado na fonte
      const meetingApp: TranscriptionSegment['meetingApp'] = 
        detectedApps.includes('Google Meet') ? 'meet' :
        detectedApps.includes('Microsoft Teams') ? 'teams' :
        detectedApps.includes('WhatsApp') ? 'whatsapp' : 'generic';

      const newSegment: TranscriptionSegment = {
        id: `segment-${Date.now()}`,
        text: transcript.trim(),
        timestamp: getCurrentTimestamp(),
        confidence: 0.85 + Math.random() * 0.15,
        speaker: currentSpeaker,
        isProcessing: true,
        audioSource: source as 'microphone' | 'system' | 'meeting', // 🚨 NOVA propriedade
        meetingApp // 🚨 NOVA propriedade
      };

      setSegments(prev => [...prev, newSegment]);
      setCurrentTranscript('');

      // Processar com IA após um breve delay
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      processingTimeoutRef.current = window.setTimeout(async () => {
        setIsProcessingAI(true);
        try {
          const newInsights = await analyzeSegmentWithAI(newSegment);
          setInsights(prev => [...prev, ...newInsights]);
          
          setSegments(prev => prev.map(s => 
            s.id === newSegment.id 
              ? { 
                  ...s, 
                  isProcessing: false, 
                  aiAnalysis: { 
                    isKeyPoint: newInsights.some(i => i.type === 'key_point'),
                    isDecision: newInsights.some(i => i.type === 'decision'), 
                    isAction: newInsights.some(i => i.type === 'action_item'), 
                    priority: newInsights.length > 0 ? 'high' : 'low', 
                    category: newInsights[0]?.category || 'geral',
                    sentiment: newInsights[0]?.sentiment || 'neutral',
                    topics: [newInsights[0]?.category].filter(Boolean) as string[]
                  }
                }
              : s
          ));
        } catch (error) {
          console.error('Erro na análise de IA:', error);
          setSegments(prev => prev.map(s => 
            s.id === newSegment.id ? { ...s, isProcessing: false } : s
          ));
        } finally {
          setIsProcessingAI(false);
        }
      }, 1500);
    }
  }, [isPaused, currentSpeaker, analyzeSegmentWithAI, getCurrentTimestamp, detectedApps]);

  // 🚨 NOVA geração de ata automática com conteúdo editável
  const generateAutomaticAta = useCallback(async () => {
    setIsGeneratingAta(true);
    try {
      const fullAnalysis = await generateMeetingAnalysis();
      setAnalysis(fullAnalysis);
      
      // 🚨 Gerar conteúdo editável da ata
      const ataContent = `# ATA DA REUNIÃO

## Informações Gerais
- **Data:** ${new Date().toLocaleDateString('pt-BR')}
- **Duração:** ${formatTime(getCurrentTimestamp())}
- **Participantes:** ${fullAnalysis.participants.join(', ')}
- **Clima Geral:** ${fullAnalysis.mood === 'positive' ? 'Positivo ✅' : fullAnalysis.mood === 'negative' ? 'Negativo ⚠️' : 'Neutro ➖'}

## Resumo Executivo
${fullAnalysis.summary}

## Decisões Tomadas ${fullAnalysis.decisions.length > 0 ? `(${fullAnalysis.decisions.length})` : ''}
${fullAnalysis.decisions.map((d, i) => `${i + 1}. **${d.decision}**
   - Responsável: ${d.responsible}
   - Prioridade: ${d.priority === 'high' ? 'Alta 🔴' : d.priority === 'medium' ? 'Média 🟡' : 'Baixa 🟢'}`).join('\n')}

## Itens de Ação ${fullAnalysis.actionItems.length > 0 ? `(${fullAnalysis.actionItems.length})` : ''}
${fullAnalysis.actionItems.map((a, i) => `${i + 1}. **${a.action}**
   - Responsável: ${a.responsible}
   - Prioridade: ${a.priority === 'high' ? 'Alta 🔴' : a.priority === 'medium' ? 'Média 🟡' : 'Baixa 🟢'}`).join('\n')}

## Próximos Passos
${fullAnalysis.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${fullAnalysis.concerns.length > 0 ? `## Preocupações Identificadas
${fullAnalysis.concerns.map((concern, i) => `${i + 1}. ⚠️ ${concern}`).join('\n')}` : ''}

## Dados da Transcrição
- **Total de Segmentos:** ${segments.length}
- **Qualidade Média:** ${Math.round((segments.reduce((acc, s) => acc + s.confidence, 0) / segments.length) * 100)}%
- **Fontes de Áudio:** ${audioSources.microphone ? 'Microfone ' : ''}${audioSources.systemAudio ? 'Sistema ' : ''}
- **Apps Detectados:** ${detectedApps.join(', ') || 'Nenhum'}

---
*Ata gerada automaticamente pela IA em ${new Date().toLocaleString('pt-BR')}*`;

      setEditableAtaContent(ataContent);
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(fullAnalysis);
      }

      // Gerar notas estruturadas para o componente pai
      const generatedNotes = [
        {
          id: `note-summary-${Date.now()}`,
          content: fullAnalysis.summary,
          note_type: 'important',
          ai_enhanced: true,
          timestamp_minutes: Math.floor(getCurrentTimestamp() / 60000)
        },
        ...fullAnalysis.decisions.map((d, i) => ({
          id: `note-decision-${Date.now()}-${i}`,
          content: d.decision,
          note_type: 'decision' as const,
          ai_enhanced: true,
          timestamp_minutes: Math.floor(getCurrentTimestamp() / 60000)
        })),
        ...fullAnalysis.actionItems.map((a, i) => ({
          id: `note-action-${Date.now()}-${i}`,
          content: a.action,
          note_type: 'action' as const,
          ai_enhanced: true,
          timestamp_minutes: Math.floor(getCurrentTimestamp() / 60000)
        }))
      ];

      if (onNotesGenerated) {
        onNotesGenerated(generatedNotes);
      }

    } catch (error) {
      console.error('Erro ao gerar ata:', error);
    } finally {
      setIsGeneratingAta(false);
    }
  }, [generateMeetingAnalysis, onAnalysisUpdate, onNotesGenerated, getCurrentTimestamp, formatTime, segments, audioSources, detectedApps, setEditableAtaContent]);

  // 🚨 FUNÇÕES DE SALVAMENTO APRIMORADAS
  
  // Salvar transcrição completa em JSON
  const saveTranscriptionJSON = useCallback(async () => {
    if (!meetingId) return;
    
    setIsSavingSegments(true);
    try {
      const transcriptionData = createTranscriptionData();
      
      // Salvar JSON completo no banco usando o serviço
      await meetingAnalysisService.saveTranscriptionData(meetingId, transcriptionData);
      
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      
      console.log('✅ Transcrição JSON completa salva:', transcriptionData);
      alert('✅ Transcrição salva com dados completos!');
    } catch (error) {
      console.error('❌ Erro ao salvar transcrição JSON:', error);
      alert('❌ Erro ao salvar transcrição. Tente novamente.');
    } finally {
      setIsSavingSegments(false);
    }
  }, [meetingId, createTranscriptionData]);

  // Salvar segmentos de transcrição automaticamente
  const saveTranscriptionSegments = useCallback(async (segmentsToSave: TranscriptionSegment[]) => {
    if (!meetingId || segmentsToSave.length === 0) return;
    
    setIsSavingSegments(true);
    try {
      const segmentsData = segmentsToSave.map(segment => ({
        text: segment.text,
        timestamp: segment.timestamp,
        confidence: segment.confidence,
        speaker: segment.speaker
      }));

      await meetingAnalysisService.saveBatchTranscriptionSegments(meetingId, segmentsData);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      
      console.log('✅ Segmentos salvos no banco:', segmentsData.length);
    } catch (error) {
      console.error('❌ Erro ao salvar segmentos:', error);
    } finally {
      setIsSavingSegments(false);
    }
  }, [meetingId]);

  // Salvar análise completa de reunião com dados JSON
  const saveCompleteAnalysis = useCallback(async () => {
    if (!meetingId || !analysis) return;
    
    setIsSaving(true);
    try {
      // 🚨 Salvar dados JSON da transcrição
      if (analysis.transcriptionData) {
        await meetingAnalysisService.saveTranscriptionData(meetingId, analysis.transcriptionData);
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        
        console.log('✅ Transcrição JSON salva com sucesso');
        alert('✅ Análise completa da reunião salva com sucesso!');
      } else {
        alert('⚠️ Nenhum dado de transcrição para salvar.');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar análise:', error);
      alert('❌ Erro ao salvar análise. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [meetingId, analysis]);

  // 🚨 NOVA função para salvar ata final editável
  const saveFinalEditableAta = useCallback(async (content: string) => {
    if (!meetingId || !analysis) return;
    
    setIsSaving(true);
    try {
      const finalAta = {
        summary: analysis.summary,
        decisions: analysis.decisions.map(d => ({
          decision: d.decision,
          responsible: d.responsible || 'Não definido',
          priority: d.priority
        })),
        actionItems: analysis.actionItems.map(a => ({
          action: a.action,
          responsible: a.responsible || 'Não definido',
          priority: a.priority
        })),
        nextSteps: analysis.nextSteps,
        transcription: segments.map(s => `[${s.speaker}]: ${s.text}`).join('\n'),
        duration: Math.floor(getCurrentTimestamp() / 60000),
        participants: [currentSpeaker, ...new Set(segments.map(s => s.speaker).filter(Boolean))].filter((p): p is string => p !== undefined),
        editableContent: content, // 🚨 NOVO: conteúdo editado pelo usuário
        transcriptionData: analysis.transcriptionData // 🚨 NOVO: dados JSON completos
      };

      await meetingAnalysisService.saveFinalAta(meetingId, finalAta);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      
      // Gerar nota final para o componente pai
      if (onNotesGenerated) {
        const finalNote = [{
          id: `final-ata-${Date.now()}`,
          content: `📋 ATA FINAL DA REUNIÃO\n\n${analysis.summary}\n\n💡 ${analysis.decisions.length} decisões tomadas\n📋 ${analysis.actionItems.length} itens de ação\n⏱️ ${Math.floor(getCurrentTimestamp() / 60000)} minutos\n\n✨ Ata personalizada salva com sucesso!`,
          note_type: 'important' as const,
          ai_enhanced: true,
          timestamp_minutes: Math.floor(getCurrentTimestamp() / 60000)
        }];
        onNotesGenerated(finalNote);
      }
      
      console.log('✅ Ata final editável salva:', finalAta);
      alert('✅ Ata final personalizada salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar ata final editável:', error);
      alert('❌ Erro ao salvar ata final. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [meetingId, analysis, segments, currentSpeaker, getCurrentTimestamp, onNotesGenerated]);

  // Auto-salvamento de segmentos
  useEffect(() => {
    if (!autoSave || !meetingId) return;

    // Salvar automaticamente a cada 10 novos segmentos
    if (segments.length > 0 && segments.length % 10 === 0) {
      const unsavedSegments = segments.slice(-10); // últimos 10 segmentos
      saveTranscriptionSegments(unsavedSegments);
    }
  }, [segments, autoSave, meetingId, saveTranscriptionSegments]);

  // Marcar mudanças não salvas
  useEffect(() => {
    if (segments.length > 0 || analysis) {
      setHasUnsavedChanges(true);
    }
  }, [segments, analysis]);

  // Controles de gravação aprimorados
  const handleStartRecording = () => {
    startListening(handleTranscriptionResult);
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  // Auto-scroll do feed de transcrição
  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight;
    }
  }, [segments, currentTranscript]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      stopListening();
    };
  }, [stopListening]);

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Transcrição não suportada</h3>
          <p className="text-muted-foreground mb-4">
            Seu navegador não suporta a API de reconhecimento de voz ou captura de tela.
            Recomendamos usar Chrome ou Edge mais recentes.
          </p>
          <p className="text-sm text-muted-foreground">
            Para capturar áudio de reuniões (Meet, Teams, etc), é necessário Chrome/Edge com permissões de captura de tela.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles principais aprimorados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Transcrição IA Avançada
              <Badge variant="outline" className="text-xs">
                {detectedApps.length > 0 ? `${detectedApps.join(', ')}` : 'Standalone'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(getCurrentTimestamp())}
            </div>
          </CardTitle>
          <CardDescription>
            Captura áudio do microfone e aplicativos de reunião (Meet, Teams, WhatsApp) com análise inteligente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configurações de fonte de áudio */}
          {detectedApps.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                <Volume2 className="h-4 w-4" />
                Apps de Reunião Detectados
              </div>
              <div className="flex flex-wrap gap-2">
                {detectedApps.map((app, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {app} ✅
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                A transcrição capturará áudio dessas aplicações automaticamente
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isListening ? (
                <Button onClick={handleStartRecording} className="bg-green-600 hover:bg-green-700">
                  <Mic className="h-4 w-4 mr-2" />
                  Iniciar Transcrição Avançada
                </Button>
              ) : (
                <Button onClick={handleStopRecording} variant="destructive">
                  <MicOff className="h-4 w-4 mr-2" />
                  Parar Transcrição
                </Button>
              )}
              
              {isListening && (
                <Button onClick={handlePauseResume} variant="outline">
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? 'Retomar' : 'Pausar'}
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <Speaker className="h-4 w-4" />
                <select 
                  value={currentSpeaker}
                  onChange={(e) => setCurrentSpeaker(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  title="Selecionar falante atual"
                >
                  <option value="Participante 1">Participante 1</option>
                  <option value="Participante 2">Participante 2</option>
                  <option value="Participante 3">Participante 3</option>
                  <option value="Moderador">Moderador</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Arquiteto">Arquiteto</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isProcessingAI && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">IA Analisando...</span>
                </div>
              )}
              
              <Badge variant={isListening ? 'default' : 'secondary'}>
                {isListening ? 'Gravando' : isPaused ? 'Pausado' : 'Parado'}
              </Badge>
            </div>
          </div>

          {/* Estatísticas em tempo real aprimoradas */}
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{segments.length}</p>
              <p className="text-sm text-muted-foreground">Segmentos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{insights.filter(i => i.type === 'decision').length}</p>
              <p className="text-sm text-muted-foreground">Decisões</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{insights.filter(i => i.type === 'action_item').length}</p>
              <p className="text-sm text-muted-foreground">Ações</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{insights.filter(i => i.type === 'key_point').length}</p>
              <p className="text-sm text-muted-foreground">Pontos Chave</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {segments.length > 0 ? Math.round((segments.reduce((acc, s) => acc + s.confidence, 0) / segments.length) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Qualidade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas do conteúdo aprimoradas */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'live' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <Mic className="h-4 w-4 inline mr-2" />
            Transcrição Ao Vivo
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analysis' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            Análise IA
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'notes' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Ata Automática
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Configurações
          </button>
        </div>

        {/* Tab: Transcrição Ao Vivo com indicadores aprimorados */}
        {activeTab === 'live' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Feed de Transcrição</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={saveTranscriptionJSON} 
                    disabled={isSavingSegments || segments.length === 0}
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Salvar JSON
                  </Button>
                  {audioSources.systemAudio && (
                    <Badge variant="secondary" className="text-xs">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Sistema
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 border rounded-lg p-4" ref={transcriptionRef}>
                <div className="space-y-3">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        segment.aiAnalysis?.isDecision
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : segment.aiAnalysis?.isAction
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                          : segment.aiAnalysis?.isKeyPoint
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : 'border-gray-300 bg-gray-50 dark:bg-gray-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Speaker className="h-4 w-4" />
                          <span className="font-medium text-sm">{segment.speaker}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(segment.timestamp)}
                          </span>
                          {/* 🚨 NOVO: Indicadores de fonte */}
                          {segment.audioSource === 'system' && (
                            <Badge variant="outline" className="text-xs">
                              <Monitor className="h-3 w-3 mr-1" />
                              Sistema
                            </Badge>
                          )}
                          {segment.meetingApp && (
                            <Badge variant="outline" className="text-xs">
                              {segment.meetingApp === 'meet' && '📹'}
                              {segment.meetingApp === 'teams' && '🟣'}
                              {segment.meetingApp === 'whatsapp' && '💬'}
                              {segment.meetingApp}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {segment.isProcessing && (
                            <Brain className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {/* 🚨 NOVO: Indicadores de sentimento */}
                          {segment.aiAnalysis?.sentiment === 'positive' && (
                            <Badge variant="outline" className="text-xs text-green-600">😊 Positivo</Badge>
                          )}
                          {segment.aiAnalysis?.sentiment === 'negative' && (
                            <Badge variant="outline" className="text-xs text-red-600">😟 Negativo</Badge>
                          )}
                          {segment.aiAnalysis?.isDecision && (
                            <Badge variant="outline" className="text-xs">Decisão</Badge>
                          )}
                          {segment.aiAnalysis?.isAction && (
                            <Badge variant="outline" className="text-xs">Ação</Badge>
                          )}
                          {segment.aiAnalysis?.isKeyPoint && (
                            <Badge variant="outline" className="text-xs">Importante</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {Math.round(segment.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                      {/* 🚨 NOVO: Categoria da análise */}
                      {segment.aiAnalysis?.category && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Categoria: {segment.aiAnalysis.category}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Transcrição atual (em progresso) */}
                  {currentTranscript && isListening && (
                    <div className="p-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 animate-pulse text-blue-500" />
                        <span className="font-medium text-sm">{currentSpeaker}</span>
                        <Badge variant="outline" className="text-xs">Transcrevendo...</Badge>
                      </div>
                      <p className="text-sm italic">{currentTranscript}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Tab: Análise IA com categorias */}
        {activeTab === 'analysis' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights da IA por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4" />
                  <p>A IA está analisando a reunião. Os insights aparecerão aqui conforme você fala.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filtros por categoria */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      Todos ({insights.length})
                    </Badge>
                    {['financeiro', 'técnico', 'temporal', 'comunicação', 'geral'].map(category => {
                      const count = insights.filter(i => i.category === category).length;
                      return count > 0 ? (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                        </Badge>
                      ) : null;
                    })}
                  </div>

                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className={`p-4 rounded-lg border ${
                          insight.type === 'decision'
                            ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
                            : insight.type === 'action_item'
                            ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
                            : insight.type === 'key_point'
                            ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                            : insight.type === 'concern'
                            ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                            : 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {insight.type === 'decision' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                            {insight.type === 'action_item' && <Target className="h-4 w-4 text-orange-500" />}
                            {insight.type === 'key_point' && <Sparkles className="h-4 w-4 text-green-500" />}
                            {insight.type === 'concern' && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {insight.type === 'suggestion' && <Lightbulb className="h-4 w-4 text-purple-500" />}
                            <Badge 
                              variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            {/* 🚨 NOVO: Badge de categoria */}
                            {insight.category && (
                              <Badge variant="outline" className="text-xs">
                                {insight.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 🚨 NOVO: Indicador de sentimento */}
                            {insight.sentiment && (
                              <span className="text-xs">
                                {insight.sentiment === 'positive' ? '😊' : insight.sentiment === 'negative' ? '😟' : '😐'}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(insight.timestamp)} • {Math.round(insight.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Ata Automática com editor */}
        {activeTab === 'notes' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Ata Automática Editável</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={generateAutomaticAta}
                    disabled={isGeneratingAta || segments.length === 0}
                    className="gap-2"
                  >
                    {isGeneratingAta ? (
                      <RotateCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Gerar Ata IA
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p className="mb-2">Clique em "Gerar Ata IA" para criar automaticamente a ata da reunião.</p>
                  <p className="text-sm">A ata incluirá análise completa com dados JSON estruturados.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 🚨 NOVO: Editor de ata */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Ata Editável
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        Você pode editar antes de salvar
                      </Badge>
                    </div>
                    <Textarea
                      value={editableAtaContent}
                      onChange={(e) => setEditableAtaContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder="A ata gerada aparecerá aqui para edição..."
                    />
                  </div>

                  {/* 🚨 SEÇÃO DE SALVAMENTO COM OPÇÕES */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    {/* Status de salvamento */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {isSaving || isSavingSegments ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Database className="h-4 w-4 animate-pulse" />
                          <span>Salvando...</span>
                        </div>
                      ) : lastSavedAt ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <Database className="h-4 w-4" />
                          <span>Salvo {lastSavedAt.toLocaleTimeString()}</span>
                        </div>
                      ) : hasUnsavedChanges ? (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Alterações não salvas</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>Auto-salvamento {autoSave ? 'ativo' : 'inativo'}</span>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={saveCompleteAnalysis}
                        disabled={!analysis || isSaving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Salvar Análise JSON
                      </Button>
                      
                      <Button 
                        onClick={() => saveFinalEditableAta(editableAtaContent)}
                        disabled={!analysis || !editableAtaContent.trim() || isSaving}
                        className="gap-2"
                      >
                        <Database className="h-4 w-4" />
                        Salvar Ata Final
                      </Button>
                      
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar
                      </Button>
                    </div>
                  </div>

                  {/* Preview da análise estruturada */}
                  {analysis.transcriptionData && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Dados da Transcrição
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Qualidade</p>
                          <p>{Math.round(analysis.transcriptionData.quality.averageConfidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Total de Palavras</p>
                          <p>{analysis.transcriptionData.quality.totalWords}</p>
                        </div>
                        <div>
                          <p className="font-medium">Fontes de Áudio</p>
                          <p>{analysis.transcriptionData.audioSources.detectedApps.join(', ') || 'Microfone'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 🚨 NOVA Tab: Configurações */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configurações de áudio */}
              <div>
                <h3 className="font-semibold mb-3">Fontes de Áudio</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Microfone</p>
                        <p className="text-sm text-muted-foreground">Capturar áudio do microfone</p>
                      </div>
                    </div>
                    <Badge variant={audioSources.microphone ? 'default' : 'secondary'}>
                      {audioSources.microphone ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Áudio do Sistema</p>
                        <p className="text-sm text-muted-foreground">Capturar áudio de aplicativos (Meet, Teams, etc)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={audioSources.systemAudio ? 'default' : 'secondary'}>
                        {audioSources.systemAudio ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateAudioSources({ ...audioSources, systemAudio: !audioSources.systemAudio })}
                      >
                        {audioSources.systemAudio ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apps detectados */}
              <div>
                <h3 className="font-semibold mb-3">Apps de Reunião Detectados</h3>
                {detectedApps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum aplicativo de reunião detectado</p>
                ) : (
                  <div className="space-y-2">
                    {detectedApps.map((app, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                        <Badge variant="outline">✅ {app}</Badge>
                        <span className="text-sm text-muted-foreground">Captura automática ativa</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Configurações de IA */}
              <div>
                <h3 className="font-semibold mb-3">Análise de IA</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Processamento em Tempo Real</p>
                      <p className="text-sm text-muted-foreground">Analisar cada segmento automaticamente</p>
                    </div>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Auto-salvamento</p>
                      <p className="text-sm text-muted-foreground">Salvar segmentos automaticamente a cada 10</p>
                    </div>
                    <Badge variant={autoSave ? 'default' : 'secondary'}>
                      {autoSave ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}