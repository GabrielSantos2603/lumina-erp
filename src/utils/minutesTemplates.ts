// =========================================
// MINUTES TEMPLATES SYSTEM
// Professional templates for different meeting types
// =========================================

export type TemplateType = 'standard' | 'formal' | 'informal' | 'technical' | 'board';

export interface MinutesTemplate {
  type: TemplateType;
  name: string;
  description: string;
  icon: string;
  sections: TemplateSection[];
  aiPrompt: string; // Specific prompt for AI summary generation
}

export interface TemplateSection {
  id: string;
  title: string;
  required: boolean;
  placeholder: string;
}

// =========================================
// TEMPLATE DEFINITIONS
// =========================================

export const minutesTemplates: Record<TemplateType, MinutesTemplate> = {
  standard: {
    type: 'standard',
    name: 'Padrão',
    description: 'Template versátil para reuniões gerais',
    icon: '📄',
    sections: [
      {
        id: 'participants',
        title: 'Participantes',
        required: true,
        placeholder: 'Lista de participantes presentes'
      },
      {
        id: 'agenda',
        title: 'Pauta',
        required: true,
        placeholder: 'Assuntos discutidos na reunião'
      },
      {
        id: 'summary',
        title: 'Resumo',
        required: true,
        placeholder: 'Resumo executivo da reunião'
      },
      {
        id: 'decisions',
        title: 'Decisões',
        required: true,
        placeholder: 'Decisões tomadas durante a reunião'
      },
      {
        id: 'action_items',
        title: 'Ações',
        required: true,
        placeholder: 'Tarefas e responsáveis'
      },
      {
        id: 'next_steps',
        title: 'Próximos Passos',
        required: false,
        placeholder: 'Próximas ações e cronograma'
      }
    ],
    aiPrompt: 'Gere um resumo estruturado da reunião com: resumo executivo, pontos principais discutidos, decisões tomadas, tarefas (com responsável e prazo), e próximos passos.'
  },

  formal: {
    type: 'formal',
    name: 'Formal',
    description: 'Atas formais com estrutura tradicional',
    icon: '🎩',
    sections: [
      {
        id: 'header',
        title: 'Cabeçalho',
        required: true,
        placeholder: 'Data, hora, local e tipo de reunião'
      },
      {
        id: 'attendees',
        title: 'Presentes',
        required: true,
        placeholder: 'Lista completa de participantes com cargos'
      },
      {
        id: 'absent',
        title: 'Ausentes',
        required: false,
        placeholder: 'Membros ausentes (justificados ou não)'
      },
      {
        id: 'opening',
        title: 'Abertura',
        required: true,
        placeholder: 'Declaração de abertura e validação de quórum'
      },
      {
        id: 'agenda_items',
        title: 'Ordem do Dia',
        required: true,
        placeholder: 'Itens da pauta numerados'
      },
      {
        id: 'deliberations',
        title: 'Deliberações',
        required: true,
        placeholder: 'Discussões e votações realizadas'
      },
      {
        id: 'resolutions',
        title: 'Resoluções',
        required: true,
        placeholder: 'Resoluções aprovadas com número e texto'
      },
      {
        id: 'closing',
        title: 'Encerramento',
        required: true,
        placeholder: 'Declaração de encerramento'
      },
      {
        id: 'signatures',
        title: 'Assinaturas',
        required: true,
        placeholder: 'Espaço para assinaturas dos presentes'
      }
    ],
    aiPrompt: 'Gere uma ata formal seguindo a estrutura tradicional: abertura, ordem do dia, deliberações detalhadas, resoluções numeradas, e encerramento. Use linguagem formal e precisa.'
  },

  informal: {
    type: 'informal',
    name: 'Informal',
    description: 'Anotações rápidas e objetivas',
    icon: '✍️',
    sections: [
      {
        id: 'quick_summary',
        title: 'Resumo Rápido',
        required: true,
        placeholder: 'O que foi discutido em poucas palavras'
      },
      {
        id: 'key_points',
        title: 'Pontos-Chave',
        required: true,
        placeholder: 'Principais tópicos abordados'
      },
      {
        id: 'todos',
        title: 'To-Do',
        required: true,
        placeholder: 'Lista de tarefas e responsáveis'
      },
      {
        id: 'notes',
        title: 'Observações',
        required: false,
        placeholder: 'Anotações adicionais ou lembretes'
      }
    ],
    aiPrompt: 'Gere um resumo conciso e direto com bullets dos pontos principais, decisões rápidas e lista de tarefas. Mantenha linguagem objetiva e informal.'
  },

  technical: {
    type: 'technical',
    name: 'Técnico',
    description: 'Reuniões técnicas de desenvolvimento',
    icon: '⚙️',
    sections: [
      {
        id: 'objective',
        title: 'Objetivo',
        required: true,
        placeholder: 'Objetivo técnico da reunião'
      },
      {
        id: 'technical_context',
        title: 'Contexto Técnico',
        required: true,
        placeholder: 'Tecnologias, sistemas e arquitetura envolvidos'
      },
      {
        id: 'problems_identified',
        title: 'Problemas Identificados',
        required: true,
        placeholder: 'Issues, bugs ou desafios técnicos discutidos'
      },
      {
        id: 'solutions_proposed',
        title: 'Soluções Propostas',
        required: true,
        placeholder: 'Abordagens técnicas sugeridas'
      },
      {
        id: 'technical_decisions',
        title: 'Decisões Técnicas',
        required: true,
        placeholder: 'Decisões de arquitetura, stack, patterns, etc.'
      },
      {
        id: 'implementation_plan',
        title: 'Plano de Implementação',
        required: true,
        placeholder: 'Tasks técnicas, PRs, sprints'
      },
      {
        id: 'risks',
        title: 'Riscos e Blockers',
        required: false,
        placeholder: 'Riscos técnicos identificados'
      },
      {
        id: 'references',
        title: 'Referências',
        required: false,
        placeholder: 'Links, documentação, repos relevantes'
      }
    ],
    aiPrompt: 'Gere um resumo técnico detalhado incluindo: contexto tecnológico, problemas identificados, soluções propostas, decisões de arquitetura/stack, plano de implementação com tasks técnicas, riscos identificados e referências úteis.'
  },

  board: {
    type: 'board',
    name: 'Conselho',
    description: 'Reuniões de conselho e diretoria',
    icon: '🏢',
    sections: [
      {
        id: 'meeting_info',
        title: 'Informações da Reunião',
        required: true,
        placeholder: 'Data, hora, local, tipo de reunião ordinária/extraordinária'
      },
      {
        id: 'board_members',
        title: 'Membros do Conselho',
        required: true,
        placeholder: 'Presentes e ausentes com justificativas'
      },
      {
        id: 'quorum',
        title: 'Quórum',
        required: true,
        placeholder: 'Validação de quórum estatutário'
      },
      {
        id: 'agenda_approval',
        title: 'Aprovação da Pauta',
        required: true,
        placeholder: 'Aprovação ou alteração da ordem do dia'
      },
      {
        id: 'previous_minutes',
        title: 'Ata Anterior',
        required: false,
        placeholder: 'Aprovação da ata da reunião anterior'
      },
      {
        id: 'reports',
        title: 'Relatórios',
        required: true,
        placeholder: 'Relatórios apresentados (financeiro, operacional, etc.)'
      },
      {
        id: 'discussions',
        title: 'Discussões',
        required: true,
        placeholder: 'Tópicos discutidos com detalhamento'
      },
      {
        id: 'votes',
        title: 'Votações',
        required: true,
        placeholder: 'Matérias votadas com resultado (aprovado/rejeitado)'
      },
      {
        id: 'board_resolutions',
        title: 'Deliberações',
        required: true,
        placeholder: 'Deliberações aprovadas pelo conselho'
      },
      {
        id: 'confidential',
        title: 'Assuntos Confidenciais',
        required: false,
        placeholder: 'Tópicos sob sigilo'
      },
      {
        id: 'next_meeting',
        title: 'Próxima Reunião',
        required: false,
        placeholder: 'Data e pauta prevista'
      },
      {
        id: 'adjournment',
        title: 'Encerramento',
        required: true,
        placeholder: 'Horário de encerramento e declaração'
      }
    ],
    aiPrompt: 'Gere uma ata de conselho seguindo normas corporativas: informações completas da reunião, validação de quórum, relatórios apresentados, discussões detalhadas, votações com resultados, deliberações aprovadas e encerramento formal. Use linguagem corporativa e formal.'
  }
};

// =========================================
// HELPER FUNCTIONS
// =========================================

export const getTemplate = (type: TemplateType): MinutesTemplate => {
  return minutesTemplates[type];
};

export const getAllTemplates = (): MinutesTemplate[] => {
  return Object.values(minutesTemplates);
};

export const getTemplateIcon = (type: TemplateType): string => {
  return minutesTemplates[type]?.icon || '📄';
};

export const getTemplateName = (type: TemplateType): string => {
  return minutesTemplates[type]?.name || 'Padrão';
};

export const getTemplateAIPrompt = (type: TemplateType): string => {
  return minutesTemplates[type]?.aiPrompt || minutesTemplates.standard.aiPrompt;
};

// =========================================
// TEMPLATE FORMATTER
// =========================================

interface MinutesParticipant {
  name: string;
  role?: string;
}

interface MinutesMeeting {
  title: string;
  date: string;
  time?: string;
  location?: string;
  participants?: MinutesParticipant[];
  transcription?: string;
  ai_summary?: {
    resumo?: string;
    pontos_principais?: string[];
    decisoes?: string[];
    tarefas?: Array<{
      titulo: string;
      responsavel?: string;
      prazo?: string;
    }>;
    proximos_passos?: string[];
  };
  minutes_status?: string;
  approved_at?: string;
}

export const formatMinutesWithTemplate = (
  meeting: MinutesMeeting,
  template: MinutesTemplate
): string => {
  let formattedText = '';
  
  // Header
  formattedText += `${template.icon} ${template.name.toUpperCase()}\n`;
  formattedText += `${'='.repeat(50)}\n\n`;
  
  // Meeting basic info
  formattedText += `REUNIÃO: ${meeting.title}\n`;
  formattedText += `DATA: ${new Date(meeting.date).toLocaleDateString('pt-BR', { 
    dateStyle: 'full' 
  })}\n`;
  formattedText += `HORÁRIO: ${meeting.time || 'Não especificado'}\n`;
  formattedText += `LOCAL: ${meeting.location || 'Não especificado'}\n\n`;
  formattedText += `${'-'.repeat(50)}\n\n`;
  
  // Participants
  if (meeting.participants && meeting.participants.length > 0) {
    formattedText += `PARTICIPANTES:\n`;
    meeting.participants.forEach((p: MinutesParticipant, idx: number) => {
      formattedText += `${idx + 1}. ${p.name}${p.role ? ` - ${p.role}` : ''}\n`;
    });
    formattedText += `\n`;
  }
  
  // AI Summary sections
  if (meeting.ai_summary) {
    const summary = typeof meeting.ai_summary === 'string' 
      ? JSON.parse(meeting.ai_summary) 
      : meeting.ai_summary;
    
    if (summary.resumo) {
      formattedText += `RESUMO EXECUTIVO:\n${summary.resumo}\n\n`;
    }
    
    if (summary.pontos_principais && summary.pontos_principais.length > 0) {
      formattedText += `PONTOS PRINCIPAIS:\n`;
      summary.pontos_principais.forEach((ponto: string, idx: number) => {
        formattedText += `${idx + 1}. ${ponto}\n`;
      });
      formattedText += `\n`;
    }
    
    if (summary.decisoes && summary.decisoes.length > 0) {
      formattedText += `DECISÕES TOMADAS:\n`;
      summary.decisoes.forEach((decisao: string, idx: number) => {
        formattedText += `${idx + 1}. ${decisao}\n`;
      });
      formattedText += `\n`;
    }
    
    if (summary.tarefas && summary.tarefas.length > 0) {
      formattedText += `TAREFAS E RESPONSÁVEIS:\n`;
      summary.tarefas.forEach((tarefa: { titulo: string; responsavel?: string; prazo?: string }, idx: number) => {
        formattedText += `${idx + 1}. ${tarefa.titulo}\n`;
        if (tarefa.responsavel) formattedText += `   Responsável: ${tarefa.responsavel}\n`;
        if (tarefa.prazo) formattedText += `   Prazo: ${tarefa.prazo}\n`;
      });
      formattedText += `\n`;
    }
    
    if (summary.proximos_passos && summary.proximos_passos.length > 0) {
      formattedText += `PRÓXIMOS PASSOS:\n`;
      summary.proximos_passos.forEach((passo: string, idx: number) => {
        formattedText += `${idx + 1}. ${passo}\n`;
      });
      formattedText += `\n`;
    }
  }
  
  // Transcription
  if (meeting.transcription) {
    formattedText += `${'-'.repeat(50)}\n`;
    formattedText += `TRANSCRIÇÃO COMPLETA:\n\n`;
    formattedText += `${meeting.transcription}\n\n`;
  }
  
  // Footer
  formattedText += `${'-'.repeat(50)}\n`;
  formattedText += `Ata gerada em: ${new Date().toLocaleString('pt-BR')}\n`;
  
  if (meeting.minutes_status === 'approved') {
    formattedText += `Status: ✅ APROVADA\n`;
    if (meeting.approved_at) {
      formattedText += `Aprovada em: ${new Date(meeting.approved_at).toLocaleString('pt-BR')}\n`;
    }
  }
  
  formattedText += `${'-'.repeat(50)}\n`;
  
  return formattedText;
};
