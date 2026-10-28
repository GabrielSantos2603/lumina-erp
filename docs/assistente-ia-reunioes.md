# 🤖 Assistente IA para Reuniões - Lumina AI ERP

## 🎯 Visão Geral

Sistema inteligente que **transcreve reuniões em tempo real** e gera **resumos estruturados com IA**, eliminando a necessidade de atas manuais.

---

## ✨ Funcionalidades

### 1️⃣ Transcrição em Tempo Real

- 🎤 **Captura de áudio** via microfone
- 📝 **Transcrição automática** usando Web Speech API
- 🌐 **Suporte a português** (pt-BR) e outros idiomas
- ⚡ **Texto ao vivo** - veja o que está sendo dito em tempo real

### 2️⃣ Resumo Inteligente com IA

- 🧠 **IA Avançada** - OpenAI GPT-4 ou Anthropic Claude
- 👥 **Identifica participantes** automaticamente
- 📊 **Estruturação automática**:
  - Resumo geral
  - Contribuição de cada participante
  - Pontos principais
  - Tarefas (Action Items)
  - Compromissos
  - Decisões tomadas
  - Próximos passos

### 3️⃣ Gerenciamento de Tarefas

- ✅ **Extração automática** de action items
- 👤 **Atribuição** de responsáveis
- 📅 **Prazos** identificados
- 🎯 **Prioridades** (alta, média, baixa)

---

## 🚀 Como Usar

### Passo 1: Em uma Reunião

1. Acesse **Reuniões** no menu
2. Abra ou crie uma reunião
3. Clique em **"Iniciar Transcrição"**
4. Fale normalmente - o sistema transcreve em tempo real

### Passo 2: Gerar Resumo

1. Quando terminar, clique em **"Parar"**
2. Clique em **"Gerar Resumo IA"**
3. Aguarde alguns segundos
4. Veja o resumo estruturado completo!

### Passo 3: Usar o Resumo

- ✅ **Marcar tarefas** como concluídas
- 📥 **Baixar** transcrição completa
- 📋 **Copiar** para compartilhar
- 💾 **Salvar** automaticamente na reunião

---

## ⚙️ Configuração

### Opção 1: Modo Teste (Funciona Agora!)

O sistema já funciona com resumos **mock** (simulados) para você testar.

**Nenhuma configuração necessária!**

### Opção 2: IA Real (OpenAI ou Anthropic)

Para usar IA real e gerar resumos personalizados:

#### Com OpenAI (GPT-4)

1. Crie uma conta em [OpenAI](https://platform.openai.com/)
2. Gere uma API Key
3. Adicione no `.env.local`:

```env
VITE_OPENAI_API_KEY=sk-...
```

#### Com Anthropic (Claude)

1. Crie uma conta em [Anthropic](https://console.anthropic.com/)
2. Gere uma API Key
3. Adicione no `.env.local`:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🎨 Interface

### Durante a Transcrição

```
┌──────────────────────────────────────────────┐
│  🎤 Assistente IA de Reuniões                │
│                    [Parar] [Gerar Resumo IA] │
├──────────────────────────────────────────────┤
│  🟢 Escutando...                             │
├──────────────────────────────────────────────┤
│  📝 Transcrição                              │
│  ┌────────────────────────────────────────┐  │
│  │ Texto sendo transcrito em tempo real...│  │
│  │ Cada fala aparece aqui automaticamente │  │
│  │                                         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Resumo Gerado

```
┌──────────────────────────────────────────────┐
│  ✨ Resumo Geral                             │
│  Reunião focada em planejamento...          │
├──────────────────────────────────────────────┤
│  👥 Contribuições por Participante           │
│  • João: Apresentou escopo do projeto        │
│  • Maria: Discutiu aspectos técnicos         │
├──────────────────────────────────────────────┤
│  🎯 Pontos Principais                        │
│  ✓ Projeto aprovado                          │
│  ✓ Reuniões semanais às quintas              │
├──────────────────────────────────────────────┤
│  ✅ Tarefas (Action Items)                   │
│  □ Criar documento de requisitos             │
│    Responsável: João • 15/11 • Alta          │
│  □ Configurar ambiente                       │
│    Responsável: Maria • 10/11 • Alta         │
└──────────────────────────────────────────────┘
```

---

## 🔧 Tecnologias

### Transcrição

- **Web Speech API** - Transcrição nativa do navegador
- **Suporte**: Chrome, Edge, Safari (limitado)
- **Gratuito** e **ilimitado**

### IA para Resumo

- **OpenAI GPT-4o-mini** - Rápido e econômico (~$0.15/1M tokens)
- **Anthropic Claude 3.5 Sonnet** - Mais inteligente (~$3/1M tokens)
- **Modo Mock** - Gratuito para testes

---

## 💡 Dicas de Uso

### Para Melhor Transcrição

- ✅ Use microfone de qualidade
- ✅ Ambiente silencioso
- ✅ Fale claramente
- ✅ Pause entre frases
- ✅ Use Chrome ou Edge

### Para Melhor Resumo

- ✅ Fale nomes completos
- ✅ Mencione datas e prazos
- ✅ Seja específico em tarefas
- ✅ Use "action item" ou "tarefa" antes de tarefas
- ✅ Reuniões de 5-30 minutos funcionam melhor

---

## 📊 Casos de Uso

### 1. Reuniões de Projeto

- Captura todos os requisitos
- Extrai tarefas automaticamente
- Identifica prazos e responsáveis

### 2. Stand-ups Diários

- Resumo rápido do que foi discutido
- Blockers identificados
- Próximos passos claros

### 3. Reuniões com Clientes

- Documentação completa
- Decisões registradas
- Compromissos rastreáveis

### 4. Brainstorming

- Todas as ideias capturadas
- Pontos principais destacados
- Decisões documentadas

---

## 🔒 Privacidade e Segurança

### Dados Processados

- **Transcrição local**: Processada no navegador (Web Speech API)
- **IA externa**: Enviado para OpenAI/Anthropic apenas para resumo
- **Armazenamento**: Supabase (seu próprio servidor)

### Recomendações

- ✅ Use .env.local para API keys (nunca no código)
- ✅ Configure Row Level Security no Supabase
- ✅ Informe participantes sobre gravação
- ✅ Cumpra LGPD/GDPR se aplicável

---

## 💰 Custos

### Transcrição

- **Web Speech API**: Gratuito e ilimitado

### Resumo com IA

**OpenAI GPT-4o-mini**:

- Custo: ~$0.15 por 1 milhão de tokens
- Reunião de 30 min (~5.000 palavras): ~$0.001 (menos de 1 centavo!)
- 1000 reuniões/mês: ~$1 USD

**Anthropic Claude 3.5 Sonnet**:

- Custo: ~$3 por 1 milhão de tokens
- Reunião de 30 min: ~$0.02
- 1000 reuniões/mês: ~$20 USD

**Modo Mock**: Gratuito (para testes)

---

## 🛠️ Desenvolvimento

### Serviços Criados

```typescript
// Transcrição
import { transcriptionService } from "@/services/transcriptionService";

// Iniciar
await transcriptionService.startTranscription({
  language: "pt-BR",
  continuous: true,
});

// Parar
transcriptionService.stopTranscription();

// Obter texto
const transcript = transcriptionService.getFullTranscript();
```

```typescript
// Resumo com IA
import { aiSummaryService } from "@/services/aiSummaryService";

// Gerar resumo
const summary = await aiSummaryService.generateSummary(transcript, {
  provider: "openai", // ou "anthropic" ou "mock"
  language: "pt-BR",
});
```

### Componente

```typescript
import { MeetingTranscriber } from "@/components/MeetingTranscriber";

<MeetingTranscriber
  meetingId={meeting.id}
  onSave={(transcript, summary) => {
    // Salvar no banco
  }}
/>;
```

---

## 🚧 Roadmap

### v1.1 (Próximas semanas)

- [ ] Identificação de participantes por voz
- [ ] Suporte a múltiplos idiomas
- [ ] Export para Word/PDF
- [ ] Integração com Jira/Trello

### v1.2 (1-2 meses)

- [ ] Whisper API para melhor transcrição
- [ ] Gravação de áudio da chamada
- [ ] Análise de sentimento
- [ ] Gráficos de participação

---

## 📚 Exemplos

### Exemplo de Transcrição

```
João: Bom dia a todos! Vamos começar nossa reunião de planejamento.
Maria: Oi João! Estou pronta.
João: Ótimo. Primeiro ponto: precisamos definir o escopo do projeto.
Maria: Sugiro usar React e TypeScript.
João: Concordo. Maria, você pode configurar o ambiente até sexta?
Maria: Sim, sem problemas!
```

### Resumo Gerado

```json
{
  "overview": "Reunião de planejamento focada em definição de escopo e tecnologias.",
  "speakers": [
    {
      "speaker": "João",
      "summary": "Liderou a reunião e definiu agenda",
      "keyPoints": ["Definição de escopo", "Atribuição de tarefas"]
    },
    {
      "speaker": "Maria",
      "summary": "Sugeriu stack técnico e aceitou tarefa",
      "keyPoints": ["React e TypeScript", "Configuração de ambiente"]
    }
  ],
  "actionItems": [
    {
      "task": "Configurar ambiente de desenvolvimento",
      "assignedTo": "Maria",
      "dueDate": "Sexta-feira",
      "priority": "high"
    }
  ]
}
```

---

## 🆘 Troubleshooting

### Transcrição não inicia

- ✅ Verifique permissões de microfone no navegador
- ✅ Use Chrome ou Edge (melhor suporte)
- ✅ Verifique se microfone está funcionando

### Resumo não gerada

- ✅ Configure API Key (OpenAI ou Anthropic)
- ✅ Use modo "mock" para testar sem API
- ✅ Verifique console para erros

### Qualidade ruim

- ✅ Fale mais devagar e claro
- ✅ Reduza ruído ambiente
- ✅ Use microfone de qualidade

---

## 📞 Suporte

Dúvidas? Entre em contato com o time de desenvolvimento.

---

**Desenvolvido com ❤️ e 🤖 para Lumina AI ERP**

**Versão 1.0.0** | **29 de Outubro de 2025**
