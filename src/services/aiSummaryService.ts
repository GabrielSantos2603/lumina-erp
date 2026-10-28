/**
 * Serviço de Resumo com IA
 * Gera resumos estruturados de transcrições usando OpenAI/Anthropic
 */

export interface MeetingSummary {
  overview: string;
  speakers: SpeakerContribution[];
  keyPoints: string[];
  actionItems: ActionItem[];
  commitments: Commitment[];
  decisions: string[];
  nextSteps: string[];
}

export interface SpeakerContribution {
  speaker: string;
  summary: string;
  keyPoints: string[];
}

export interface ActionItem {
  task: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
}

export interface Commitment {
  commitment: string;
  person: string;
  deadline?: string;
}

export interface SummaryOptions {
  provider?: "openai" | "anthropic" | "mock";
  model?: string;
  language?: string;
}

export class AISummaryService {
  /**
   * Gera resumo estruturado de uma transcrição
   */
  async generateSummary(
    transcript: string,
    options: SummaryOptions = {}
  ): Promise<MeetingSummary> {
    const provider = options.provider ?? "mock";

    switch (provider) {
      case "openai":
        return this.generateWithOpenAI(transcript, options);
      case "anthropic":
        return this.generateWithAnthropic(transcript, options);
      case "mock":
      default:
        return this.generateMockSummary(transcript);
    }
  }

  /**
   * Gera resumo usando OpenAI (GPT-4)
   */
  private async generateWithOpenAI(
    transcript: string,
    options: SummaryOptions
  ): Promise<MeetingSummary> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.warn("OpenAI API Key não configurada, usando mock");
      return this.generateMockSummary(transcript);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model ?? "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(options.language ?? "pt-BR"),
            },
            {
              role: "user",
              content: `Transcrição da reunião:\n\n${transcript}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const summary = JSON.parse(data.choices[0].message.content);

      return this.normalizeSummary(summary);
    } catch (error) {
      console.error("Erro ao gerar resumo com OpenAI:", error);
      throw error;
    }
  }

  /**
   * Gera resumo usando Anthropic (Claude)
   */
  private async generateWithAnthropic(
    transcript: string,
    options: SummaryOptions
  ): Promise<MeetingSummary> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn("Anthropic API Key não configurada, usando mock");
      return this.generateMockSummary(transcript);
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: options.model ?? "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          system: this.getSystemPrompt(options.language ?? "pt-BR"),
          messages: [
            {
              role: "user",
              content: `Transcrição da reunião:\n\n${transcript}\n\nResponda APENAS com JSON válido, sem texto adicional.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.content[0].text;
      const summary = JSON.parse(text);

      return this.normalizeSummary(summary);
    } catch (error) {
      console.error("Erro ao gerar resumo com Anthropic:", error);
      throw error;
    }
  }

  /**
   * Prompt do sistema para gerar resumos estruturados
   */
  private getSystemPrompt(language: string): string {
    if (language === "pt-BR") {
      return `Você é um assistente especializado em resumir reuniões. 

Analise a transcrição fornecida e gere um resumo estruturado em JSON com o seguinte formato:

{
  "overview": "Resumo geral da reunião em 2-3 frases",
  "speakers": [
    {
      "speaker": "Nome do participante (ou 'Participante 1' se não identificado)",
      "summary": "Resumo do que esta pessoa falou",
      "keyPoints": ["ponto 1", "ponto 2"]
    }
  ],
  "keyPoints": ["Ponto principal 1", "Ponto principal 2"],
  "actionItems": [
    {
      "task": "Descrição da tarefa",
      "assignedTo": "Nome da pessoa (se mencionado)",
      "dueDate": "Data (se mencionada)",
      "priority": "high|medium|low"
    }
  ],
  "commitments": [
    {
      "commitment": "O que foi comprometido",
      "person": "Quem se comprometeu",
      "deadline": "Prazo (se mencionado)"
    }
  ],
  "decisions": ["Decisão 1", "Decisão 2"],
  "nextSteps": ["Próximo passo 1", "Próximo passo 2"]
}

IMPORTANTE:
- Identifique participantes por mudanças no padrão de fala
- Extraia TODAS as tarefas e compromissos mencionados
- Seja específico e objetivo
- Use aspas duplas no JSON
- Retorne APENAS o JSON, sem texto adicional`;
    }

    return `You are a meeting summarization assistant.

Analyze the provided transcript and generate a structured JSON summary with the following format:

{
  "overview": "General meeting summary in 2-3 sentences",
  "speakers": [
    {
      "speaker": "Participant name (or 'Speaker 1' if not identified)",
      "summary": "Summary of what this person said",
      "keyPoints": ["point 1", "point 2"]
    }
  ],
  "keyPoints": ["Key point 1", "Key point 2"],
  "actionItems": [
    {
      "task": "Task description",
      "assignedTo": "Person name (if mentioned)",
      "dueDate": "Date (if mentioned)",
      "priority": "high|medium|low"
    }
  ],
  "commitments": [
    {
      "commitment": "What was committed",
      "person": "Who committed",
      "deadline": "Deadline (if mentioned)"
    }
  ],
  "decisions": ["Decision 1", "Decision 2"],
  "nextSteps": ["Next step 1", "Next step 2"]
}

IMPORTANT:
- Identify participants by speech pattern changes
- Extract ALL mentioned tasks and commitments
- Be specific and objective
- Use double quotes in JSON
- Return ONLY the JSON, no additional text`;
  }

  /**
   * Normaliza o resumo para garantir estrutura consistente
   */
  private normalizeSummary(summary: any): MeetingSummary {
    return {
      overview: summary.overview ?? "",
      speakers: summary.speakers ?? [],
      keyPoints: summary.keyPoints ?? [],
      actionItems: summary.actionItems ?? [],
      commitments: summary.commitments ?? [],
      decisions: summary.decisions ?? [],
      nextSteps: summary.nextSteps ?? [],
    };
  }

  /**
   * Gera um resumo mock para testes
   */
  private generateMockSummary(transcript: string): MeetingSummary {
    return {
      overview:
        "Reunião focada em planejamento de projeto com discussão sobre prazos e responsabilidades.",
      speakers: [
        {
          speaker: "Participante 1",
          summary: "Apresentou o escopo do projeto e objetivos principais",
          keyPoints: [
            "Prazo de 3 meses",
            "Orçamento aprovado",
            "Equipe de 5 pessoas",
          ],
        },
        {
          speaker: "Participante 2",
          summary: "Discutiu aspectos técnicos e arquitetura",
          keyPoints: ["Usar React e TypeScript", "Integração com Supabase"],
        },
      ],
      keyPoints: [
        "Projeto aprovado para início imediato",
        "Reuniões semanais às quintas-feiras",
        "Primeira entrega em 30 dias",
      ],
      actionItems: [
        {
          task: "Criar documento de requisitos",
          assignedTo: "João",
          dueDate: "15/11/2025",
          priority: "high",
        },
        {
          task: "Configurar ambiente de desenvolvimento",
          assignedTo: "Maria",
          dueDate: "10/11/2025",
          priority: "high",
        },
        {
          task: "Agendar reunião com stakeholders",
          assignedTo: "Pedro",
          dueDate: "12/11/2025",
          priority: "medium",
        },
      ],
      commitments: [
        {
          commitment: "Entregar protótipo inicial",
          person: "Equipe de Design",
          deadline: "20/11/2025",
        },
      ],
      decisions: [
        "Arquitetura baseada em microsserviços",
        "Deploy na Vercel",
        "Usar Tailwind CSS",
      ],
      nextSteps: [
        "Iniciar desenvolvimento do MVP",
        "Realizar daily standups",
        "Preparar apresentação para investidores",
      ],
    };
  }
}

export const aiSummaryService = new AISummaryService();

