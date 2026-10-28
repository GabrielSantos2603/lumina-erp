import { supabase } from "@/lib/supabase";

export interface ProjectMedia {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: MediaCategory;
  storage_path: string;
  url?: string;
  thumbnail_url?: string;
  tags?: string[];
  uploaded_by?: string;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type MediaCategory = "renders" | "plantas" | "descritivos" | "fotos" | "3d" | "documentos" | "outros";

export interface MediaUpload {
  file: File;
  category: MediaCategory;
  tags?: string[];
}

class ProjectMediaService {
  private readonly BUCKET_NAME = "project-media";

  /**
   * Obter todas as mídias de um projeto
   */
  async getProjectMedia(projectId: string): Promise<ProjectMedia[]> {
    try {
      const { data, error } = await supabase
        .from("project_media")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar mídias do projeto:", error);
        throw error;
      }

      // Gerar URLs assinadas para os arquivos
      const mediaWithUrls = await Promise.all(
        (data || []).map(async (media) => {
          const { data: urlData } = await supabase.storage
            .from(this.BUCKET_NAME)
            .createSignedUrl(media.storage_path, 3600); // 1 hora

          return {
            ...media,
            url: urlData?.signedUrl || undefined,
          };
        })
      );

      return mediaWithUrls;
    } catch (error) {
      console.error("Erro ao buscar mídias:", error);
      return [];
    }
  }

  /**
   * Upload de um arquivo
   */
  async uploadFile(projectId: string, upload: MediaUpload): Promise<ProjectMedia | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar nome único para o arquivo
      const fileExt = upload.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${projectId}/${upload.category}/${fileName}`;

      // Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, upload.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Erro ao fazer upload:", uploadError);
        throw uploadError;
      }

      // Salvar metadados no banco
      const { data, error: dbError } = await supabase
        .from("project_media")
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: fileName,
          original_name: upload.file.name,
          file_type: upload.file.type,
          file_size: upload.file.size,
          category: upload.category,
          storage_path: filePath,
          tags: upload.tags || [],
        })
        .select()
        .single();

      if (dbError) {
        console.error("Erro ao salvar metadados:", dbError);
        // Tentar remover o arquivo do storage se falhou salvar no BD
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw dbError;
      }

      // Gerar URL assinada
      const { data: urlData } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600);

      return {
        ...data,
        url: urlData?.signedUrl || undefined,
      };
    } catch (error) {
      console.error("Erro no upload:", error);
      return null;
    }
  }

  /**
   * Upload de múltiplos arquivos
   */
  async uploadMultipleFiles(
    projectId: string,
    uploads: MediaUpload[]
  ): Promise<{ success: ProjectMedia[]; failed: string[] }> {
    const success: ProjectMedia[] = [];
    const failed: string[] = [];

    for (const upload of uploads) {
      const result = await this.uploadFile(projectId, upload);
      if (result) {
        success.push(result);
      } else {
        failed.push(upload.file.name);
      }
    }

    return { success, failed };
  }

  /**
   * Deletar uma mídia
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      // Buscar informações da mídia
      const { data: media, error: fetchError } = await supabase
        .from("project_media")
        .select("storage_path")
        .eq("id", mediaId)
        .single();

      if (fetchError || !media) {
        console.error("Erro ao buscar mídia:", fetchError);
        return false;
      }

      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([media.storage_path]);

      if (storageError) {
        console.error("Erro ao remover do storage:", storageError);
      }

      // Remover do banco
      const { error: dbError } = await supabase
        .from("project_media")
        .delete()
        .eq("id", mediaId);

      if (dbError) {
        console.error("Erro ao deletar do banco:", dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao deletar mídia:", error);
      return false;
    }
  }

  /**
   * Deletar múltiplas mídias
   */
  async deleteMultipleMedia(mediaIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of mediaIds) {
      const result = await this.deleteMedia(id);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Atualizar tags de uma mídia
   */
  async updateMediaTags(mediaId: string, tags: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("project_media")
        .update({ tags, updated_at: new Date().toISOString() })
        .eq("id", mediaId);

      if (error) {
        console.error("Erro ao atualizar tags:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao atualizar tags:", error);
      return false;
    }
  }

  /**
   * Buscar mídias por categoria
   */
  async getMediaByCategory(projectId: string, category: MediaCategory): Promise<ProjectMedia[]> {
    try {
      const { data, error } = await supabase
        .from("project_media")
        .select("*")
        .eq("project_id", projectId)
        .eq("category", category)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar mídias por categoria:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar mídias:", error);
      return [];
    }
  }

  /**
   * Detectar categoria do arquivo automaticamente
   */
  detectCategory(filename: string, type: string): MediaCategory {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
    
    if (type.startsWith("image/") && !filename.toLowerCase().includes("foto")) {
      return "renders";
    }
    if (type.startsWith("image/") && filename.toLowerCase().includes("foto")) {
      return "fotos";
    }
    if (ext === ".pdf" && filename.toLowerCase().includes("planta")) {
      return "plantas";
    }
    if ([".doc", ".docx"].includes(ext) || filename.toLowerCase().includes("descritivo")) {
      return "descritivos";
    }
    if ([".skp", ".3ds", ".obj", ".fbx", ".blend"].includes(ext)) {
      return "3d";
    }
    if ([".pdf", ".doc", ".docx", ".xls", ".xlsx"].includes(ext)) {
      return "documentos";
    }
    return "outros";
  }

  /**
   * Obter estatísticas de mídias do projeto
   */
  async getProjectMediaStats(projectId: string) {
    try {
      const media = await this.getProjectMedia(projectId);
      
      const stats = {
        total: media.length,
        totalSize: media.reduce((acc, m) => acc + m.file_size, 0),
        byCategory: {} as Record<MediaCategory, number>,
      };

      media.forEach((m) => {
        stats.byCategory[m.category] = (stats.byCategory[m.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return { total: 0, totalSize: 0, byCategory: {} };
    }
  }
}

export const projectMediaService = new ProjectMediaService();

