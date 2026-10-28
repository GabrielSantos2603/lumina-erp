import type { MeetingTypeConfig, MeetingType } from '@/types/meetingTypes';

export const MEETING_TYPES: Record<MeetingType, MeetingTypeConfig> = {
  briefing: {
    type: 'briefing',
    name: 'Briefing Inicial',
    icon: '🪴',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Entendimento das necessidades e expectativas do cliente',
    phase: 'initial',
    defaultDuration: 90,
    checklist: [
      {
        id: 'perfil-cliente',
        text: 'Perfil do cliente e composição familiar',
        required: true,
        category: 'Pessoal',
        description: 'Quantas pessoas, idades, pets, rotina diária'
      },
      {
        id: 'estilo-desejado',
        text: 'Estilo e preferências visuais',
        required: true,
        category: 'Design',
        description: 'Moderno, clássico, industrial, minimalista, etc.'
      },
      {
        id: 'ambientes',
        text: 'Ambientes a serem projetados',
        required: true,
        category: 'Escopo',
        description: 'Sala, quartos, cozinha, banheiros, área externa'
      },
      {
        id: 'orcamento',
        text: 'Orçamento disponível',
        required: true,
        category: 'Financeiro',
        description: 'Valor total para projeto + execução'
      },
      {
        id: 'prazo',
        text: 'Prazo esperado',
        required: true,
        category: 'Cronograma',
        description: 'Data desejada para conclusão'
      },
      {
        id: 'referencias',
        text: 'Referências visuais coletadas',
        required: false,
        category: 'Design',
        description: 'Pinterest, Instagram, revistas'
      },
      {
        id: 'tecnologia',
        text: 'Preferências tecnológicas',
        required: false,
        category: 'Técnico',
        description: 'Automação, smart home, iluminação'
      }
    ],
    requiredDocuments: [
      'Planta atual ou croqui do imóvel',
      'Fotos dos ambientes',
      'Referências visuais do cliente'
    ],
    aiPrompt: `Analise esta reunião de briefing e extraia:
    1. Perfil detalhado do cliente
    2. Necessidades principais identificadas
    3. Estilo de vida e preferências
    4. Orçamento e cronograma definidos
    5. Pontos de atenção ou restrições mencionadas
    6. Próximos passos sugeridos`
  },

  budget: {
    type: 'budget',
    name: 'Orçamento e Contrato',
    icon: '💰',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    description: 'Apresentação da proposta comercial e negociação',
    phase: 'contract',
    defaultDuration: 60,
    checklist: [
      {
        id: 'proposta-apresentada',
        text: 'Proposta comercial apresentada',
        required: true,
        category: 'Comercial',
        description: 'Valores, etapas, prazos detalhados'
      },
      {
        id: 'escopo-definido',
        text: 'Escopo de trabalho definido',
        required: true,
        category: 'Técnico',
        description: 'O que está incluído e excluído'
      },
      {
        id: 'cronograma-acordado',
        text: 'Cronograma de execução acordado',
        required: true,
        category: 'Cronograma',
        description: 'Datas de cada etapa do projeto'
      },
      {
        id: 'forma-pagamento',
        text: 'Forma de pagamento definida',
        required: true,
        category: 'Financeiro',
        description: 'Parcelas, datas, valores'
      },
      {
        id: 'alteracoes-escopo',
        text: 'Política de alterações esclarecida',
        required: true,
        category: 'Contratual',
        description: 'Como serão tratadas mudanças no projeto'
      },
      {
        id: 'direitos-autorais',
        text: 'Direitos autorais explicados',
        required: true,
        category: 'Legal',
        description: 'Uso dos projetos e renders'
      }
    ],
    requiredDocuments: [
      'Proposta comercial detalhada',
      'Contrato de prestação de serviços',
      'Cronograma macro do projeto'
    ],
    aiPrompt: `Analise esta reunião de orçamento e identifique:
    1. Valores acordados e forma de pagamento
    2. Escopo finalizado
    3. Objeções ou dúvidas do cliente
    4. Negociações realizadas
    5. Status da proposta (aceita/pendente/rejeitada)
    6. Próximos passos para assinatura`
  },

  concept: {
    type: 'concept',
    name: 'Conceito e Moodboard',
    icon: '🎨',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Apresentação do conceito criativo e paleta de cores',
    phase: 'design',
    defaultDuration: 75,
    checklist: [
      {
        id: 'conceito-apresentado',
        text: 'Conceito criativo apresentado',
        required: true,
        category: 'Design',
        description: 'Tema, inspiração, direcionamento geral'
      },
      {
        id: 'moodboard-aprovado',
        text: 'Moodboard aprovado',
        required: true,
        category: 'Visual',
        description: 'Imagens de referência e atmosfera'
      },
      {
        id: 'paleta-cores',
        text: 'Paleta de cores definida',
        required: true,
        category: 'Cores',
        description: 'Cores principais e complementares'
      },
      {
        id: 'materiais-sugeridos',
        text: 'Materiais principais sugeridos',
        required: true,
        category: 'Materiais',
        description: 'Revestimentos, texturas, acabamentos'
      },
      {
        id: 'estilo-mobiliario',
        text: 'Estilo do mobiliário definido',
        required: false,
        category: 'Móveis',
        description: 'Contemporâneo, vintage, sob medida'
      },
      {
        id: 'iluminacao-conceito',
        text: 'Conceito de iluminação',
        required: false,
        category: 'Iluminação',
        description: 'Temperatura, intensidade, pontos focais'
      }
    ],
    requiredDocuments: [
      'Moodboard visual',
      'Paleta de cores oficial',
      'Referências de materiais'
    ],
    aiPrompt: `Analise esta reunião de conceito e extraia:
    1. Conceito criativo aprovado
    2. Feedback do cliente sobre o moodboard
    3. Ajustes solicitados nas cores ou materiais
    4. Elementos que mais agradaram o cliente
    5. Pontos que precisam ser revisados
    6. Aprovação para seguir para projeto executivo`
  },

  presentation: {
    type: 'presentation',
    name: 'Apresentação 3D e Executivo',
    icon: '🏗️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Apresentação do projeto 3D e plantas executivas',
    phase: 'design',
    defaultDuration: 120,
    checklist: [
      {
        id: 'projeto-3d-apresentado',
        text: 'Projeto 3D apresentado',
        required: true,
        category: 'Visualização',
        description: 'Renders, walkthrough, tour virtual'
      },
      {
        id: 'plantas-executivas',
        text: 'Plantas executivas explicadas',
        required: true,
        category: 'Técnico',
        description: 'Layout, cotas, especificações'
      },
      {
        id: 'detalhamentos-tecnicos',
        text: 'Detalhamentos técnicos apresentados',
        required: true,
        category: 'Execução',
        description: 'Marcenaria, elétrica, hidráulica'
      },
      {
        id: 'especificacoes-materiais',
        text: 'Especificações de materiais',
        required: true,
        category: 'Materiais',
        description: 'Marcas, modelos, fornecedores'
      },
      {
        id: 'aprovacao-geral',
        text: 'Aprovação geral do cliente',
        required: true,
        category: 'Aprovação',
        description: 'Cliente aprova para execução'
      },
      {
        id: 'alteracoes-solicitadas',
        text: 'Alterações solicitadas registradas',
        required: false,
        category: 'Revisões',
        description: 'Mudanças a serem implementadas'
      }
    ],
    requiredDocuments: [
      'Renders finalizados',
      'Plantas executivas',
      'Memorial descritivo',
      'Especificações técnicas'
    ],
    aiPrompt: `Analise esta apresentação de projeto e identifique:
    1. Elementos aprovados pelo cliente
    2. Alterações solicitadas com detalhes
    3. Dúvidas técnicas levantadas
    4. Feedback sobre os renders e visualização
    5. Aprovação para início da execução
    6. Próximas etapas definidas`
  },

  revision: {
    type: 'revision',
    name: 'Revisões e Mudanças',
    icon: '🔁',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Discussão e aprovação de alterações no projeto',
    phase: 'design',
    defaultDuration: 45,
    checklist: [
      {
        id: 'motivo-revisao',
        text: 'Motivo da revisão identificado',
        required: true,
        category: 'Análise',
        description: 'Mudança de necessidade, erro, melhoria'
      },
      {
        id: 'impacto-orcamento',
        text: 'Impacto no orçamento calculado',
        required: true,
        category: 'Financeiro',
        description: 'Acréscimo/redução de custos'
      },
      {
        id: 'impacto-cronograma',
        text: 'Impacto no cronograma avaliado',
        required: true,
        category: 'Prazo',
        description: 'Atraso ou antecipação de entrega'
      },
      {
        id: 'alternativas-apresentadas',
        text: 'Alternativas apresentadas',
        required: false,
        category: 'Opções',
        description: 'Diferentes soluções propostas'
      },
      {
        id: 'decisao-tomada',
        text: 'Decisão final tomada',
        required: true,
        category: 'Resolução',
        description: 'O que foi definido fazer'
      },
      {
        id: 'responsabilidades',
        text: 'Responsabilidades definidas',
        required: true,
        category: 'Execução',
        description: 'Quem fará o quê e quando'
      }
    ],
    requiredDocuments: [
      'Comparativo antes/depois',
      'Orçamento de mudanças',
      'Cronograma atualizado'
    ],
    aiPrompt: `Analise esta reunião de revisão e documente:
    1. Alterações solicitadas com justificativas
    2. Impactos financeiros e de prazo
    3. Decisões tomadas sobre cada mudança
    4. Responsável por implementar cada alteração
    5. Novos prazos estabelecidos
    6. Cliente satisfeito com as soluções propostas`
  },

  construction: {
    type: 'construction',
    name: 'Acompanhamento de Obra',
    icon: '🧱',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Visitas e acompanhamento da execução da obra',
    phase: 'construction',
    defaultDuration: 60,
    checklist: [
      {
        id: 'andamento-obra',
        text: 'Andamento geral da obra',
        required: true,
        category: 'Progresso',
        description: 'Percentual executado, etapas concluídas'
      },
      {
        id: 'conformidade-projeto',
        text: 'Conformidade com o projeto',
        required: true,
        category: 'Qualidade',
        description: 'Execução conforme especificações'
      },
      {
        id: 'problemas-identificados',
        text: 'Problemas ou desvios identificados',
        required: false,
        category: 'Problemas',
        description: 'Erros de execução, materiais incorretos'
      },
      {
        id: 'materiais-entregues',
        text: 'Status dos materiais entregues',
        required: true,
        category: 'Materiais',
        description: 'O que chegou, qualidade, conformidade'
      },
      {
        id: 'cronograma-obra',
        text: 'Aderência ao cronograma',
        required: true,
        category: 'Prazo',
        description: 'Atrasos, antecipações, justificativas'
      },
      {
        id: 'proximas-etapas',
        text: 'Próximas etapas definidas',
        required: true,
        category: 'Planejamento',
        description: 'O que será executado na sequência'
      },
      {
        id: 'seguranca-obra',
        text: 'Condições de segurança verificadas',
        required: true,
        category: 'Segurança',
        description: 'EPIs, procedimentos, riscos'
      }
    ],
    requiredDocuments: [
      'Fotos do andamento',
      'Relatório de visita',
      'Lista de pendências'
    ],
    aiPrompt: `Analise esta visita de obra e registre:
    1. Progresso atual da execução
    2. Problemas encontrados e gravidade
    3. Qualidade da execução observada
    4. Aderência ao cronograma planejado
    5. Ações corretivas necessárias
    6. Previsão para próximas etapas`
  },

  delivery: {
    type: 'delivery',
    name: 'Entrega Final e Feedback',
    icon: '🎁',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: 'Entrega do projeto finalizado e coleta de feedback',
    phase: 'delivery',
    defaultDuration: 45,
    checklist: [
      {
        id: 'vistoria-final',
        text: 'Vistoria final realizada',
        required: true,
        category: 'Inspeção',
        description: 'Verificação completa do projeto'
      },
      {
        id: 'documentacao-entregue',
        text: 'Documentação técnica entregue',
        required: true,
        category: 'Documentos',
        description: 'Plantas, manuais, garantias'
      },
      {
        id: 'ajustes-finais',
        text: 'Ajustes finais identificados',
        required: false,
        category: 'Correções',
        description: 'Pequenos reparos ou melhorias'
      },
      {
        id: 'satisfacao-cliente',
        text: 'Avaliação da satisfação do cliente',
        required: true,
        category: 'Feedback',
        description: 'Nota de 1 a 5, comentários'
      },
      {
        id: 'depoimento-coletado',
        text: 'Depoimento coletado',
        required: false,
        category: 'Marketing',
        description: 'Autorização para uso em portfólio'
      },
      {
        id: 'garantias-explicadas',
        text: 'Garantias e assistência explicadas',
        required: true,
        category: 'Pós-venda',
        description: 'Prazos, procedimentos, contatos'
      },
      {
        id: 'entrega-chaves',
        text: 'Entrega simbólica realizada',
        required: true,
        category: 'Cerimônia',
        description: 'Momento especial de entrega'
      }
    ],
    requiredDocuments: [
      'Termo de entrega e aceite',
      'Manual do proprietário',
      'Certificados de garantia',
      'Fotos finais do projeto'
    ],
    aiPrompt: `Analise esta entrega final e documente:
    1. Nível de satisfação demonstrado pelo cliente
    2. Elogios específicos recebidos
    3. Sugestões de melhoria mencionadas
    4. Problemas ou insatisfações relatadas
    5. Autorização para uso em portfólio/marketing
    6. Potencial para projetos futuros ou indicações`
  }
};

export const getMeetingTypeConfig = (type: MeetingType): MeetingTypeConfig => {
  return MEETING_TYPES[type];
};

export const getAllMeetingTypes = (): MeetingTypeConfig[] => {
  return Object.values(MEETING_TYPES);
};

export const getMeetingTypesByPhase = (phase: string): MeetingTypeConfig[] => {
  return Object.values(MEETING_TYPES).filter(config => config.phase === phase);
};

export const getNextMeetingType = (currentType: MeetingType): MeetingType | null => {
  const sequence: MeetingType[] = [
    'briefing',
    'budget', 
    'concept',
    'presentation',
    'construction',
    'delivery'
  ];
  
  const currentIndex = sequence.indexOf(currentType);
  return currentIndex >= 0 && currentIndex < sequence.length - 1 
    ? sequence[currentIndex + 1] 
    : null;
};

export const calculateProjectProgress = (meetings: { type: MeetingType; status: string }[]): number => {
  const totalTypes = getAllMeetingTypes().length;
  const completedTypes = new Set(
    meetings
      .filter(m => m.status === 'completed')
      .map(m => m.type)
  ).size;
  
  return Math.round((completedTypes / totalTypes) * 100);
};