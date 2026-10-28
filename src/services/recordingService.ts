import { supabase } from "@/lib/supabase";
import type { Recording, RecordingInsert, RecordingOptions } from "@/types";

type RecordingState = "inactive" | "recording" | "paused";

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;

  /**
   * Inicia a gravação
   */
  async startRecording(options: RecordingOptions): Promise<void> {
    try {
      this.recordedChunks = [];
      let videoStream: MediaStream | null = null;
      let audioStream: MediaStream | null = null;

      // Capturar tela
      if (options.type === "screen" || options.type === "screen_camera") {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: options.audio !== false,
        });
      }

      // Capturar câmera
      if (options.type === "camera" || options.type === "screen_camera") {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: options.video !== false ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          } : false,
          audio: options.audio !== false,
        });

        if (options.type === "screen_camera" && videoStream) {
          // Combinar tela e câmera
          const tracks = [
            ...videoStream.getVideoTracks(),
            ...cameraStream.getVideoTracks(),
            ...videoStream.getAudioTracks(),
            ...cameraStream.getAudioTracks(),
          ];
          this.stream = new MediaStream(tracks);
        } else {
          this.stream = cameraStream;
        }
      } else {
        this.stream = videoStream;
      }

      if (!this.stream) {
        throw new Error("Não foi possível capturar mídia");
      }

      // Configurar MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.mediaRecorder.start(1000); // Coletar dados a cada 1 segundo
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      throw new Error("Não foi possível iniciar a gravação. Verifique as permissões.");
    }
  }

  /**
   * Para a gravação e retorna o blob do vídeo
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Nenhuma gravação em andamento"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        
        // Parar todas as tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        this.mediaRecorder = null;
        this.stream = null;
        this.recordedChunks = [];

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pausa a gravação
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume a gravação
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Cancela a gravação
   */
  cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.recordedChunks = [];
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      this.mediaRecorder = null;
      this.stream = null;
    }
  }

  /**
   * Obtém o estado atual da gravação
   */
  getRecordingState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }

  /**
   * Obtém a duração da gravação atual em segundos
   */
  getCurrentDuration(): number {
    if (this.startTime === 0) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Faz upload do vídeo para o Supabase Storage
   */
  async uploadRecording(
    blob: Blob,
    metadata: {
      title: string;
      description?: string;
      type: RecordingOptions["type"];
      user_id: string;
      meeting_id?: string;
      project_id?: string;
      client_id?: string;
      is_public?: boolean;
    }
  ): Promise<Recording> {
    try {
      const fileName = `${metadata.user_id}/${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;

      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("recordings")
        .getPublicUrl(filePath);

      // Criar registro no banco
      const recordingData: RecordingInsert = {
        title: metadata.title,
        description: metadata.description,
        type: metadata.type,
        duration: this.getCurrentDuration(),
        fileUrl: urlData.publicUrl,
        size: blob.size,
        user_id: metadata.user_id,
        meeting_id: metadata.meeting_id,
        project_id: metadata.project_id,
        client_id: metadata.client_id,
        is_public: metadata.is_public || false,
      };

      const { data, error } = await supabase
        .from("recordings")
        .insert(recordingData)
        .select()
        .single();

      if (error) throw error;

      return data as Recording;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      throw new Error("Erro ao salvar gravação");
    }
  }

  /**
   * Lista gravações do usuário
   */
  async listRecordings(userId: string, filters?: {
    meeting_id?: string;
    project_id?: string;
    client_id?: string;
  }): Promise<Recording[]> {
    try {
      let query = supabase
        .from("recordings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filters?.meeting_id) {
        query = query.eq("meeting_id", filters.meeting_id);
      }
      if (filters?.project_id) {
        query = query.eq("project_id", filters.project_id);
      }
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Recording[];
    } catch (error) {
      console.error("Erro ao listar gravações:", error);
      throw new Error("Erro ao carregar gravações");
    }
  }

  /**
   * Deleta uma gravação
   */
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      // Buscar gravação
      const { data: recording, error: fetchError } = await supabase
        .from("recordings")
        .select("fileUrl")
        .eq("id", recordingId)
        .single();

      if (fetchError) throw fetchError;

      // Extrair caminho do arquivo da URL
      const url = new URL(recording.fileUrl);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(pathParts.indexOf("recordings")).join("/");

      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from("recordings")
        .remove([filePath]);

      if (storageError) console.error("Erro ao deletar arquivo:", storageError);

      // Deletar registro do banco
      const { error: deleteError } = await supabase
        .from("recordings")
        .delete()
        .eq("id", recordingId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error("Erro ao deletar gravação:", error);
      throw new Error("Erro ao deletar gravação");
    }
  }

  /**
   * Incrementa visualizações
   */
  async incrementViews(recordingId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("increment_recording_views", {
        recording_id: recordingId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao incrementar visualizações:", error);
    }
  }

  /**
   * Obtém tipo MIME suportado pelo navegador
   */
  private getSupportedMimeType(): string {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "video/webm";
  }

  /**
   * Verifica se o navegador suporta gravação
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }
}

export const recordingService = new RecordingService();

