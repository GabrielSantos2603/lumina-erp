/**
 * Serviço de Transcrição de Áudio em Tempo Real
 * Captura áudio e transcreve usando Web Speech API ou APIs externas
 */

import type { TranscriptionSegment, TranscriptionOptions } from "@/types";

export class TranscriptionService {
  private recognition: any = null; // SpeechRecognition
  private isTranscribing = false;
  private segments: TranscriptionSegment[] = [];
  private onSegmentCallback?: (segment: TranscriptionSegment) => void;
  private onErrorCallback?: (error: Error) => void;

  /**
   * Verifica se o navegador suporta Web Speech API
   */
  static isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Inicia a transcrição de áudio
   */
  async startTranscription(options: TranscriptionOptions = {}): Promise<void> {
    if (!TranscriptionService.isSupported()) {
      throw new Error("Web Speech API não suportada neste navegador");
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();

    // Configurações
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;
    this.recognition.lang = options.language ?? "pt-BR";

    // Event handlers
    this.recognition.onstart = () => {
      this.isTranscribing = true;
      console.log("Transcrição iniciada");
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;

      const segment: TranscriptionSegment = {
        id: Date.now().toString(),
        text: transcript,
        timestamp: Date.now(),
        isFinal,
      };

      if (isFinal) {
        this.segments.push(segment);
      }

      this.onSegmentCallback?.(segment);
    };

    this.recognition.onerror = (event: any) => {
      console.error("Erro na transcrição:", event.error);
      this.onErrorCallback?.(new Error(event.error));
    };

    this.recognition.onend = () => {
      if (this.isTranscribing) {
        // Reiniciar automaticamente se ainda estiver transcrevendo
        this.recognition.start();
      }
    };

    this.recognition.start();
  }

  /**
   * Para a transcrição
   */
  stopTranscription(): void {
    if (this.recognition) {
      this.isTranscribing = false;
      this.recognition.stop();
    }
  }

  /**
   * Registra callback para novos segmentos
   */
  onSegment(callback: (segment: TranscriptionSegment) => void): void {
    this.onSegmentCallback = callback;
  }

  /**
   * Registra callback para erros
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Obtém todos os segmentos finais
   */
  getSegments(): TranscriptionSegment[] {
    return this.segments.filter((s) => s.isFinal);
  }

  /**
   * Obtém texto completo da transcrição
   */
  getFullTranscript(): string {
    return this.getSegments()
      .map((s) => s.text)
      .join(" ");
  }

  /**
   * Limpa todos os segmentos
   */
  clear(): void {
    this.segments = [];
  }

  /**
   * Transcreve áudio usando API externa (Whisper, Google Cloud, etc)
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    // TODO: Integrar com Whisper API ou Google Cloud Speech-to-Text
    // Por enquanto, retorna placeholder
    throw new Error("Transcrição via API externa não implementada ainda");
  }
}

export const transcriptionService = new TranscriptionService();
