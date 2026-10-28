# Lumina AI ERP

Sistema de gestão (SaaS) para escritórios de arquitetura e design de interiores: clientes, projetos, financeiro, agenda, equipe e reuniões, com um assistente de IA que transcreve reuniões e gera atas estruturadas.

Desenvolvido por [Gabriel Santos](https://www.linkedin.com/in/gabrielsantos-dados/) na Lumina AI Labs.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Front-end | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI) |
| Estado e dados | TanStack Query v5, Zustand, React Hook Form + Zod |
| Backend | Supabase: PostgreSQL, Auth, Storage, Row Level Security e Edge Functions (Deno) |
| Pagamentos | Stripe: checkout, portal do cliente e webhooks |
| IA | API da OpenAI (transcrição e resumo), com suporte opcional à API da Anthropic |
| Deploy | Vercel |

## Destaques técnicos

- **Multi-tenant com isolamento no banco.** Cada escritório é uma organização; os dados ficam separados por `organization_id` com políticas de Row Level Security no PostgreSQL (mais de 200 políticas), em vez de depender só de filtros no front-end.
- **Assinaturas com Stripe.** Edge Functions criam a sessão de checkout e o portal do cliente; o webhook valida a assinatura do evento e atualiza o plano e o histórico de assinatura da organização.
- **Assistente de reuniões com IA.** Transcrição em tempo real no navegador e geração de resumo estruturado (pontos principais, decisões, próximos passos e contribuição de cada participante). Detalhes em [docs/assistente-ia-reunioes.md](docs/assistente-ia-reunioes.md).
- **Camada de serviços.** Cada domínio (clientes, projetos, financeiro, reuniões, equipe) tem seu serviço em `src/services`, consumido por hooks do TanStack Query.

## Funcionalidades

- Cadastro de clientes e projetos, com galeria de mídia por projeto
- Financeiro: receitas, despesas, parcelas e calculadoras
- Agenda e calendário de atividades
- Equipe, valor-hora por membro e controle de horas trabalhadas
- Reuniões: pauta, ata, decisões, checklist, anexos e gravações
- Onboarding da empresa, planos e assinatura
- Tema claro/escuro e preferências por usuário

## Estrutura

```
src/
  components/   componentes reutilizáveis e de UI
  pages/        telas por domínio (clients, projects, finance, meetings...)
  services/     acesso a dados por domínio (Supabase e APIs de IA)
  hooks/        hooks de dados e de interface
  store/        estado global (Zustand)
supabase/
  functions/    Edge Functions (Stripe e notificações de trial)
  sql/setup/    scripts de criação de tabelas, políticas RLS e storage
docs/           arquitetura e assistente de IA
```

## Como rodar

Pré-requisitos: Node.js 18+ e um projeto no Supabase.

```bash
npm install
cp .env.example .env.local   # preencha as variáveis do Supabase
npm run dev
```

Os scripts de `supabase/sql/setup` criam o banco. Comece por `supabase-complete-setup.sql` e `supabase-saas-multi-tenant-setup-safe.sql`.

## Próximos passos

- Mover as chamadas às APIs de IA do navegador para uma Edge Function, para que nenhuma chave de API fique exposta no front-end
- Consolidar os scripts SQL em migrations versionadas do Supabase CLI
- Adicionar testes automatizados para a camada de serviços
