# NEXUS AI — Estructura del Proyecto

**Stack:** Next.js 16 · Supabase · OpenRouter · Tailwind CSS · TypeScript  
**Fecha:** 2026-06-23  
**Versión:** 1.0

---

## Índice

1. [Visión general del stack](#1-visión-general-del-stack)
2. [Estructura de carpetas completa](#2-estructura-de-carpetas-completa)
3. [Capa de Base de Datos — Supabase](#3-capa-de-base-de-datos--supabase)
4. [Capa de API — Route Handlers](#4-capa-de-api--route-handlers)
5. [Capa de Frontend — Páginas y Componentes](#5-capa-de-frontend--páginas-y-componentes)
6. [Capa de Lógica — lib/](#6-capa-de-lógica--lib)
7. [Capa de Tipos — TypeScript](#7-capa-de-tipos--typescript)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Dependencias a instalar](#9-dependencias-a-instalar)
10. [Orden de desarrollo](#10-orden-de-desarrollo)

---

## 1. Visión general del stack

```
USUARIO
  │
  ▼
Next.js 16 (Vercel)
  ├── /app              → Páginas (Frontend)
  ├── /app/api          → API Routes (Backend)
  │
  ├──▶ Supabase
  │     ├── PostgreSQL  → Datos (usuarios, chats, prompts, agentes...)
  │     ├── pgvector    → Embeddings para RAG
  │     ├── Auth        → Login, sesiones, roles
  │     ├── Storage     → Archivos subidos (PDFs, imágenes...)
  │     └── Realtime    → Streaming de respuestas IA
  │
  ├──▶ OpenRouter
  │     ├── Modelos gratuitos  (Llama, Gemini Flash, Mistral...)
  │     └── Modelos de pago    (Claude Sonnet, GPT-4o...)
  │
  └──▶ n8n (self-hosted, opcional Fase 2)
        └── Automatizaciones y workflows
```

---

## 2. Estructura de carpetas completa

```
nexus-ai/
│
├── src/
│   │
│   ├── app/                              # Next.js App Router
│   │   │
│   │   ├── (auth)/                       # Rutas públicas (sin sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                  # Rutas privadas (con sidebar)
│   │   │   ├── layout.tsx                # Shell: sidebar + topbar
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Dashboard ejecutivo
│   │   │   │
│   │   │   ├── hub/                      # AI Hub
│   │   │   │   ├── page.tsx              # Lista de conversaciones
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Conversación activa
│   │   │   │
│   │   │   ├── agentes/                  # Agentes especializados
│   │   │   │   ├── page.tsx              # Galería de agentes
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx          # Chat con agente concreto
│   │   │   │
│   │   │   ├── conocimiento/             # Centro de conocimiento RAG
│   │   │   │   ├── page.tsx              # Búsqueda + resultados
│   │   │   │   └── fuentes/
│   │   │   │       └── page.tsx          # Gestión de fuentes de datos
│   │   │   │
│   │   │   ├── prompts/                  # Biblioteca de prompts
│   │   │   │   ├── page.tsx              # Listado y búsqueda
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Detalle de prompt
│   │   │   │
│   │   │   ├── automatizaciones/         # Workflows
│   │   │   │   ├── page.tsx              # Listado de automaciones
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Detalle/configuración
│   │   │   │
│   │   │   ├── academia/                 # Academia IA
│   │   │   │   ├── page.tsx              # Dashboard de formación
│   │   │   │   └── curso/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx      # Módulo de curso
│   │   │   │
│   │   │   └── analitica/               # Analítica y ROI
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/                        # Panel de administración
│   │   │   ├── layout.tsx                # Solo accesible para admins
│   │   │   ├── page.tsx                  # Overview admin
│   │   │   ├── usuarios/
│   │   │   │   └── page.tsx              # Gestión de usuarios y cuotas
│   │   │   ├── modelos/
│   │   │   │   └── page.tsx              # Activar/desactivar modelos
│   │   │   ├── agentes/
│   │   │   │   └── page.tsx              # Crear/editar agentes
│   │   │   ├── rag/
│   │   │   │   └── page.tsx              # Configurar fuentes RAG
│   │   │   └── logs/
│   │   │       └── page.tsx              # Logs de uso y auditoría
│   │   │
│   │   └── api/                          # API Routes (Backend)
│   │       │
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── route.ts          # Callback OAuth Supabase
│   │       │
│   │       ├── chat/
│   │       │   ├── route.ts              # POST /api/chat — enviar mensaje
│   │       │   └── [id]/
│   │       │       └── route.ts          # GET/DELETE conversación
│   │       │
│   │       ├── conversations/
│   │       │   └── route.ts              # GET lista de conversaciones
│   │       │
│   │       ├── models/
│   │       │   └── route.ts              # GET modelos disponibles para el usuario
│   │       │
│   │       ├── rag/
│   │       │   ├── query/
│   │       │   │   └── route.ts          # POST búsqueda semántica
│   │       │   ├── ingest/
│   │       │   │   └── route.ts          # POST subir documento al vector store
│   │       │   └── sources/
│   │       │       └── route.ts          # GET/POST fuentes de datos
│   │       │
│   │       ├── prompts/
│   │       │   └── route.ts              # GET/POST/PUT prompts
│   │       │
│   │       ├── agents/
│   │       │   └── route.ts              # GET agentes disponibles
│   │       │
│   │       ├── upload/
│   │       │   └── route.ts              # POST subir archivo a Supabase Storage
│   │       │
│   │       ├── admin/
│   │       │   ├── users/
│   │       │   │   └── route.ts          # Gestión usuarios y cuotas
│   │       │   ├── models/
│   │       │   │   └── route.ts          # Activar/desactivar modelos
│   │       │   └── logs/
│   │       │       └── route.ts          # Logs de auditoría
│   │       │
│   │       └── webhooks/
│   │           └── n8n/
│   │               └── route.ts          # Recibir resultados de workflows n8n
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                           # Componentes base (Radix + Tailwind)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx                 # Panel lateral deslizante
│   │   │   ├── tabs.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx              # Loading states
│   │   │   └── scroll-area.tsx
│   │   │
│   │   ├── layout/                       # Estructura de la app
│   │   │   ├── Sidebar.tsx               # Navegación lateral
│   │   │   ├── Topbar.tsx                # Barra superior
│   │   │   ├── MobileNav.tsx             # Navegación móvil
│   │   │   └── AdminGuard.tsx            # Protección rutas admin
│   │   │
│   │   ├── dashboard/                    # Módulo Dashboard
│   │   │   ├── WelcomeCard.tsx
│   │   │   ├── StatsRow.tsx
│   │   │   ├── QuickAccess.tsx
│   │   │   ├── RecentConversations.tsx
│   │   │   ├── ActiveAutomations.tsx
│   │   │   ├── AgentRecommendations.tsx
│   │   │   └── AcademyProgress.tsx
│   │   │
│   │   ├── hub/                          # Módulo AI Hub
│   │   │   ├── ConversationSidebar.tsx   # Historial + carpetas
│   │   │   ├── ModelSelector.tsx         # Chips de selección de modelo
│   │   │   ├── ChatMessages.tsx          # Lista de mensajes
│   │   │   ├── ChatMessage.tsx           # Mensaje individual
│   │   │   ├── ChatInput.tsx             # Input + adjuntos + herramientas
│   │   │   ├── ContextPanel.tsx          # Panel derecho: fuentes, export
│   │   │   ├── MessageSources.tsx        # Tags de fuentes RAG
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── FileAttachment.tsx
│   │   │   └── ExportMenu.tsx
│   │   │
│   │   ├── agents/                       # Módulo Agentes
│   │   │   ├── AgentGallery.tsx          # Grid de agentes disponibles
│   │   │   ├── AgentCard.tsx             # Tarjeta de agente
│   │   │   └── AgentChat.tsx             # Chat con contexto de agente
│   │   │
│   │   ├── rag/                          # Módulo Conocimiento
│   │   │   ├── KnowledgeSearch.tsx       # Buscador principal
│   │   │   ├── SearchResults.tsx
│   │   │   ├── SourceCard.tsx
│   │   │   ├── DocumentUploader.tsx
│   │   │   └── SourcesList.tsx
│   │   │
│   │   ├── prompts/                      # Módulo Biblioteca
│   │   │   ├── PromptGrid.tsx
│   │   │   ├── PromptCard.tsx
│   │   │   ├── PromptDetail.tsx
│   │   │   ├── PromptForm.tsx
│   │   │   └── CategoryFilter.tsx
│   │   │
│   │   ├── academia/                     # Módulo Academia
│   │   │   ├── LevelProgress.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CoursePlayer.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── CertificateBadge.tsx
│   │   │
│   │   ├── analitica/                    # Módulo Analítica
│   │   │   ├── KpiCard.tsx
│   │   │   ├── RoiHighlight.tsx
│   │   │   ├── UsageBarChart.tsx
│   │   │   ├── ModelPieChart.tsx
│   │   │   ├── DeptUsageTable.tsx
│   │   │   └── AcademyAdoptionChart.tsx
│   │   │
│   │   └── admin/                        # Módulo Admin
│   │       ├── UserQuotaEditor.tsx
│   │       ├── ModelToggle.tsx
│   │       ├── AgentBuilder.tsx
│   │       ├── LogsTable.tsx
│   │       └── RagSourceManager.tsx
│   │
│   ├── lib/
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Cliente browser (ya existe)
│   │   │   ├── server.ts                 # Cliente server-side (ya existe)
│   │   │   └── admin.ts                  # Cliente con service_role key
│   │   │
│   │   ├── openrouter/
│   │   │   ├── client.ts                 # Fetch wrapper hacia OpenRouter
│   │   │   ├── stream.ts                 # Streaming de respuestas
│   │   │   └── models.ts                 # Lista y metadata de modelos
│   │   │
│   │   ├── rag/
│   │   │   ├── embeddings.ts             # Generar embeddings vía OpenRouter
│   │   │   ├── ingest.ts                 # Procesar y guardar documentos
│   │   │   ├── query.ts                  # Búsqueda semántica en pgvector
│   │   │   └── chunker.ts                # Dividir documentos en chunks
│   │   │
│   │   ├── quotas/
│   │   │   ├── check.ts                  # Verificar límites antes de llamar
│   │   │   └── update.ts                 # Actualizar consumo tras llamada
│   │   │
│   │   ├── agents/
│   │   │   └── system-prompts.ts         # System prompts de cada agente
│   │   │
│   │   └── utils.ts                      # Utilidades generales (ya existe)
│   │
│   ├── hooks/                            # React hooks personalizados
│   │   ├── useChat.ts                    # Lógica de conversación + streaming
│   │   ├── useModels.ts                  # Modelos disponibles para el usuario
│   │   ├── useQuota.ts                   # Cuota y consumo del usuario
│   │   ├── useConversations.ts           # Lista de conversaciones
│   │   └── useUser.ts                    # Datos del usuario autenticado
│   │
│   ├── middleware.ts                     # Auth guard (ya existe, ampliar)
│   │
│   └── types/
│       ├── index.ts                      # Ya existe, ampliar
│       ├── database.ts                   # Tipos generados desde Supabase
│       ├── openrouter.ts                 # Tipos de la API de OpenRouter
│       └── agents.ts                     # Tipos de agentes y mensajes
│
├── supabase/
│   ├── migrations/                       # Migraciones SQL en orden
│   │   ├── 001_auth_profiles.sql
│   │   ├── 002_models.sql
│   │   ├── 003_user_quotas.sql
│   │   ├── 004_conversations.sql
│   │   ├── 005_messages.sql
│   │   ├── 006_prompts.sql
│   │   ├── 007_agents.sql
│   │   ├── 008_rag_documents.sql
│   │   ├── 009_rag_chunks.sql            # Con pgvector
│   │   ├── 010_usage_logs.sql
│   │   └── 011_academy.sql
│   └── seed.sql                          # Datos iniciales (modelos, agentes base)
│
├── .env.local                            # Variables locales (no subir a git)
├── .env.example                          # Plantilla de variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Capa de Base de Datos — Supabase

### Esquema completo

```sql
-- ============================================================
-- 001 PERFILES DE USUARIO
-- Extiende auth.users de Supabase
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text,
  department    text,                        -- 'marketing', 'comercial', etc.
  role          text default 'basic',        -- 'basic' | 'standard' | 'advanced' | 'admin'
  avatar_url    text,
  created_at    timestamptz default now()
);

-- RLS: cada usuario solo ve su perfil (admin ve todos)
alter table profiles enable row level security;
create policy "Perfil propio" on profiles
  for all using (auth.uid() = id);
create policy "Admin ve todo" on profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 002 MODELOS DE IA
-- Catálogo de modelos disponibles, gestionado por admin
-- ============================================================
create table models (
  id              text primary key,          -- 'anthropic/claude-sonnet-4-6'
  name            text not null,             -- 'Claude Sonnet 4.6'
  provider        text not null,             -- 'anthropic' | 'openai' | 'google' | 'meta'
  is_free         boolean default false,
  is_active       boolean default true,
  cost_input_per_1m   decimal default 0,     -- USD por millón de tokens input
  cost_output_per_1m  decimal default 0,     -- USD por millón de tokens output
  context_window  int,                       -- tokens máximos de contexto
  description     text,
  min_role        text default 'basic',      -- rol mínimo para usar este modelo
  created_at      timestamptz default now()
);

-- RLS: todos los autenticados pueden leer modelos activos
alter table models enable row level security;
create policy "Leer modelos activos" on models
  for select using (is_active = true and auth.uid() is not null);
create policy "Admin gestiona modelos" on models
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 003 CUOTAS Y LÍMITES POR USUARIO
-- ============================================================
create table user_quotas (
  user_id               uuid primary key references auth.users on delete cascade,

  -- Límites configurados por admin
  monthly_budget_usd    decimal default 0,       -- 0 = solo modelos gratuitos
  daily_request_limit   int     default 50,
  monthly_request_limit int     default 500,
  allowed_model_ids     text[],                  -- null = usa regla de rol
  can_use_paid_models   boolean default false,

  -- Consumo actual (reset automático)
  requests_today        int     default 0,
  requests_this_month   int     default 0,
  spend_this_month_usd  decimal default 0,
  tokens_this_month     bigint  default 0,

  -- Control de reset
  last_daily_reset      date    default current_date,
  last_monthly_reset    date    default date_trunc('month', now()),

  updated_at            timestamptz default now()
);

alter table user_quotas enable row level security;
create policy "Cuota propia" on user_quotas
  for select using (auth.uid() = user_id);
create policy "Admin gestiona cuotas" on user_quotas
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 004 CONVERSACIONES
-- ============================================================
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  title       text,
  model_id    text references models(id),
  agent_id    uuid,                          -- null si es chat libre
  folder      text,                          -- carpeta opcional
  tags        text[],
  is_rag      boolean default false,         -- si usa el centro de conocimiento
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table conversations enable row level security;
create policy "Conversaciones propias" on conversations
  for all using (auth.uid() = user_id);


-- ============================================================
-- 005 MENSAJES
-- ============================================================
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade,
  role            text not null,             -- 'user' | 'assistant' | 'system'
  content         text not null,
  model_id        text,                      -- modelo que generó la respuesta
  tokens_input    int  default 0,
  tokens_output   int  default 0,
  cost_usd        decimal default 0,
  rag_sources     jsonb,                     -- fuentes RAG usadas [{title, url, score}]
  created_at      timestamptz default now()
);

alter table messages enable row level security;
create policy "Mensajes propios" on messages
  for all using (
    exists (
      select 1 from conversations
      where id = messages.conversation_id
      and user_id = auth.uid()
    )
  );


-- ============================================================
-- 006 PROMPTS — BIBLIOTECA CORPORATIVA
-- ============================================================
create table prompts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  category    text,                          -- 'marketing' | 'licitaciones' | 'social' ...
  tags        text[],
  author_id   uuid references auth.users,
  is_public   boolean default true,          -- visible para toda la empresa
  rating_avg  decimal default 0,
  rating_count int default 0,
  use_count   int default 0,
  version     int default 1,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table prompts enable row level security;
create policy "Leer prompts públicos" on prompts
  for select using (is_public = true and auth.uid() is not null);
create policy "Gestionar prompts propios" on prompts
  for all using (auth.uid() = author_id);


-- ============================================================
-- 007 AGENTES ESPECIALIZADOS
-- ============================================================
create table agents (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,        -- 'comercial', 'licitaciones', ...
  name          text not null,
  description   text,
  icon          text,                        -- emoji o URL de icono
  system_prompt text not null,              -- instrucciones del agente
  model_id      text references models(id), -- modelo preferido del agente
  category      text,
  is_active     boolean default true,
  min_role      text default 'basic',
  use_rag       boolean default false,
  rag_filter    jsonb,                       -- filtros de documentos para este agente
  created_at    timestamptz default now()
);

alter table agents enable row level security;
create policy "Leer agentes activos" on agents
  for select using (is_active = true and auth.uid() is not null);
create policy "Admin gestiona agentes" on agents
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 008 DOCUMENTOS RAG — METADATOS
-- ============================================================
create table rag_documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  source_type   text,                        -- 'upload' | 'gdrive' | 'sharepoint' | 'url'
  source_url    text,
  department    text,                        -- acceso por departamento
  storage_path  text,                        -- ruta en Supabase Storage
  file_type     text,                        -- 'pdf' | 'docx' | 'xlsx' | 'txt'
  file_size     int,
  chunk_count   int default 0,
  is_processed  boolean default false,
  uploaded_by   uuid references auth.users,
  created_at    timestamptz default now()
);

alter table rag_documents enable row level security;
create policy "Documentos del departamento" on rag_documents
  for select using (
    department is null
    or department = (select department from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 009 CHUNKS RAG — VECTOR STORE
-- Requiere extensión pgvector activada en Supabase
-- ============================================================
create extension if not exists vector;

create table rag_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references rag_documents on delete cascade,
  content     text not null,
  embedding   vector(1536),                  -- dimensión para text-embedding-3-small
  chunk_index int,
  metadata    jsonb,                         -- página, sección, etc.
  created_at  timestamptz default now()
);

create index on rag_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);


-- ============================================================
-- 010 LOGS DE USO — AUDITORÍA
-- Registro inmutable de cada llamada a la IA
-- ============================================================
create table usage_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users,
  conversation_id uuid,
  model_id        text,
  tokens_input    int  default 0,
  tokens_output   int  default 0,
  cost_usd        decimal default 0,
  latency_ms      int,
  is_rag          boolean default false,
  agent_id        uuid,
  department      text,
  created_at      timestamptz default now()
);

-- Solo lectura para el usuario, escritura solo desde API (service role)
alter table usage_logs enable row level security;
create policy "Ver logs propios" on usage_logs
  for select using (auth.uid() = user_id);
create policy "Admin ve todos los logs" on usage_logs
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ============================================================
-- 011 ACADEMIA
-- ============================================================
create table academy_courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  level       int not null,                  -- 1 | 2 | 3 | 4
  order_index int,
  duration_min int,
  content     jsonb,                         -- módulos, lecciones, quizzes
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create table academy_progress (
  user_id     uuid references auth.users on delete cascade,
  course_id   uuid references academy_courses on delete cascade,
  completed   boolean default false,
  progress_pct int default 0,
  xp_earned   int default 0,
  completed_at timestamptz,
  primary key (user_id, course_id)
);

alter table academy_courses enable row level security;
alter table academy_progress enable row level security;
create policy "Ver cursos activos" on academy_courses
  for select using (is_active = true and auth.uid() is not null);
create policy "Progreso propio" on academy_progress
  for all using (auth.uid() = user_id);
```

---

## 4. Capa de API — Route Handlers

### `/api/chat/route.ts` — El más importante

```typescript
// POST /api/chat
// Recibe un mensaje, verifica cuota, llama a OpenRouter, guarda en Supabase
// Devuelve stream de texto

import { createServerClient } from '@/lib/supabase/server'
import { checkQuota, updateQuota } from '@/lib/quotas/check'
import { streamChat } from '@/lib/openrouter/stream'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, modelId, conversationId, useRag } = await req.json()

  // 1. Verificar cuota
  const quota = await checkQuota(user.id, modelId)
  if (!quota.allowed) {
    return Response.json({ error: quota.reason }, { status: 429 })
  }

  // 2. Si useRag, enriquecer con contexto del conocimiento corporativo
  let contextMessages = messages
  if (useRag) {
    const { queryRag } = await import('@/lib/rag/query')
    const lastUserMessage = messages.findLast(m => m.role === 'user')
    const ragContext = await queryRag(lastUserMessage.content, user.id)
    // Inyectar contexto RAG como system message
    contextMessages = [
      { role: 'system', content: `Contexto corporativo:\n${ragContext.text}` },
      ...messages
    ]
  }

  // 3. Llamar a OpenRouter con streaming
  const stream = await streamChat(modelId, contextMessages)

  // 4. Guardar uso y actualizar cuota (async, no bloquea la respuesta)
  stream.onComplete(async (usage) => {
    await updateQuota(user.id, usage)
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      conversation_id: conversationId,
      model_id: modelId,
      tokens_input: usage.promptTokens,
      tokens_output: usage.completionTokens,
      cost_usd: usage.cost,
      is_rag: useRag,
    })
  })

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

### `/api/models/route.ts`

```typescript
// GET /api/models
// Devuelve los modelos disponibles para el usuario autenticado según su rol y cuota

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { data: quota } = await supabase
    .from('user_quotas').select('*').eq('user_id', user.id).single()

  // Filtrar modelos según rol y si puede usar modelos de pago
  const { data: models } = await supabase
    .from('models')
    .select('*')
    .eq('is_active', true)
    .or(quota?.can_use_paid_models ? 'is_free.eq.true,is_free.eq.false' : 'is_free.eq.true')

  return Response.json({ models })
}
```

---

## 5. Capa de Frontend — Páginas y Componentes

### Convenciones

- Cada página es un **Server Component** por defecto (fetch de datos en servidor)
- Los componentes interactivos (chat, inputs) son **Client Components** con `'use client'`
- El estado de UI local va en hooks personalizados en `/hooks`
- Los datos del servidor se pasan como props a los Client Components

### Ejemplo: `/app/(dashboard)/hub/[id]/page.tsx`

```typescript
// Server Component — carga la conversación en servidor
import { createServerClient } from '@/lib/supabase/server'
import { ChatMessages } from '@/components/hub/ChatMessages'
import { ChatInput } from '@/components/hub/ChatInput'
import { ContextPanel } from '@/components/hub/ContextPanel'

export default async function ConversationPage({ params }) {
  const supabase = await createServerClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .eq('id', params.id)
    .single()

  const { data: models } = await supabase
    .from('models')
    .select('*')
    .eq('is_active', true)

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <ChatMessages initialMessages={conversation.messages} />
        <ChatInput conversationId={params.id} models={models} />
      </div>
      <ContextPanel conversation={conversation} />
    </div>
  )
}
```

---

## 6. Capa de Lógica — lib/

### `/lib/openrouter/client.ts`

```typescript
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export async function callOpenRouter({
  model,
  messages,
  stream = false,
}: {
  model: string
  messages: { role: string; content: string }[]
  stream?: boolean
}) {
  return fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
      'X-Title': 'NEXUS AI',
    },
    body: JSON.stringify({ model, messages, stream }),
  })
}
```

### `/lib/quotas/check.ts`

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export async function checkQuota(userId: string, modelId: string) {
  const supabase = createAdminClient()

  const { data: quota } = await supabase
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!quota) return { allowed: false, reason: 'Sin cuota configurada' }

  // Reset diario si hace falta
  if (quota.last_daily_reset < new Date().toISOString().split('T')[0]) {
    await supabase.from('user_quotas')
      .update({ requests_today: 0, last_daily_reset: new Date() })
      .eq('user_id', userId)
    quota.requests_today = 0
  }

  if (quota.requests_today >= quota.daily_request_limit) {
    return { allowed: false, reason: `Límite diario alcanzado (${quota.daily_request_limit} consultas)` }
  }

  if (quota.spend_this_month_usd >= quota.monthly_budget_usd && quota.monthly_budget_usd > 0) {
    return { allowed: false, reason: 'Presupuesto mensual agotado' }
  }

  // Verificar si el modelo está permitido para este usuario
  const { data: model } = await supabase
    .from('models').select('is_free').eq('id', modelId).single()

  if (!model?.is_free && !quota.can_use_paid_models) {
    return { allowed: false, reason: 'No tienes acceso a modelos de pago' }
  }

  return { allowed: true }
}

export async function updateQuota(userId: string, usage: {
  promptTokens: number
  completionTokens: number
  cost: number
}) {
  const supabase = createAdminClient()
  await supabase.rpc('increment_quota', {
    p_user_id: userId,
    p_tokens: usage.promptTokens + usage.completionTokens,
    p_cost: usage.cost,
  })
}
```

---

## 7. Capa de Tipos — TypeScript

### `/types/database.ts` (generado con `supabase gen types`)

```bash
# Ejecutar para regenerar cuando cambie el esquema:
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.ts
```

### `/types/agents.ts`

```typescript
export interface Agent {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  system_prompt: string
  model_id: string
  category: string
  use_rag: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model_id?: string
  rag_sources?: RagSource[]
  created_at: string
}

export interface RagSource {
  title: string
  document_id: string
  score: number
  excerpt: string
}
```

---

## 8. Variables de entorno

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Solo en servidor, nunca al cliente

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Ollama (opcional, para modelos locales)
OLLAMA_BASE_URL=http://localhost:11434

# n8n (opcional, Fase 2)
N8N_WEBHOOK_SECRET=...
```

---

## 9. Dependencias a instalar

```bash
# IA y streaming
npm install ai                            # Vercel AI SDK (streaming helpers)
npm install openai                        # Compatible con OpenRouter

# Vector / RAG
npm install @supabase/supabase-js         # Ya instalado
# pgvector se activa en Supabase dashboard, no requiere paquete npm

# Procesado de documentos
npm install pdf-parse                     # Leer PDFs
npm install mammoth                       # Leer DOCX
npm install xlsx                          # Leer Excel

# Embeddings (para RAG)
# Se generan vía OpenRouter usando text-embedding-3-small de OpenAI

# UI adicional
npm install @radix-ui/react-tabs
npm install @radix-ui/react-tooltip
npm install @radix-ui/react-sheet
npm install @radix-ui/react-progress
npm install @radix-ui/react-avatar
npm install @radix-ui/react-scroll-area
npm install cmdk                          # Command palette (búsqueda rápida)
npm install framer-motion                 # Animaciones suaves
npm install recharts                      # Gráficas de analítica
npm install react-markdown                # Renderizar markdown en mensajes
npm install date-fns                      # Fechas
```

---

## 10. Orden de desarrollo

### Semana 1 — Fundación
- [ ] Crear proyecto Supabase nuevo (separado de XULPASS)
- [ ] Ejecutar migraciones 001 a 005 (perfiles, modelos, cuotas, conversaciones, mensajes)
- [ ] Configurar Auth (email + Google OAuth)
- [ ] Instalar dependencias
- [ ] Layout base con sidebar y topbar
- [ ] Página de login

### Semana 2 — AI Hub core
- [ ] `/api/chat` con streaming via OpenRouter
- [ ] Selector de modelos (gratuitos primero)
- [ ] Chat básico funcional con historial
- [ ] Guardar conversaciones en Supabase

### Semana 3 — Control de acceso
- [ ] Migración 003 (cuotas)
- [ ] `/api/models` filtrado por usuario
- [ ] `checkQuota` + `updateQuota`
- [ ] Panel admin básico: usuarios y cuotas
- [ ] Dashboard con métricas personales básicas

### Semana 4 — RAG
- [ ] Activar pgvector en Supabase
- [ ] Migraciones 008 y 009
- [ ] Subida de documentos + chunking + embeddings
- [ ] Búsqueda semántica funcional
- [ ] Inyección de contexto RAG en el chat

### Semana 5-6 — Agentes + Prompts
- [ ] Migración 007 (agentes)
- [ ] Seed con los 10 agentes base
- [ ] Galería de agentes + chat con agente
- [ ] Biblioteca de prompts

### Semana 7-8 — Academia + Analítica
- [ ] Migraciones 010 y 011
- [ ] Módulo Academia (cursos nivel 1 y 2)
- [ ] Dashboard analítica con ROI

---

*Documento generado: 2026-06-23 | NEXUS AI v1.0*
