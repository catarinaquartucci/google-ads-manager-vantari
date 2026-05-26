# Google Ads Manager

Gerenciador completo de Google Ads com IA (Claude), construido com React 18 + TypeScript + Supabase.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Edge Functions + PostgreSQL)
- **IA**: Anthropic Claude via Supabase Edge Function
- **Charts**: Recharts
- **Auth**: Google OAuth 2.0 (scope: adwords)

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variaveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### 3. Criar projeto Supabase

1. Crie um projeto em supabase.com
2. Execute a migration: `supabase/migrations/001_initial.sql` no SQL Editor do Supabase
3. Configure Edge Function secrets no Dashboard do Supabase:

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_ADS_DEVELOPER_TOKEN=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 4. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy functions
supabase functions deploy google-ads-proxy
supabase functions deploy claude-ai
supabase functions deploy auto-rules
```

### 5. Configurar Google Cloud Console

1. Acesse console.cloud.google.com
2. Crie um OAuth 2.0 Client ID (Web application)
3. Adicione redirect URI: `http://localhost:5173/auth/callback` (dev) e seu dominio de producao
4. Ative a API "Google Ads API"
5. Solicite um Developer Token em developers.google.com/google-ads/api

### 6. Configurar Regras Automaticas (cron)

No Supabase Dashboard, configure um cron job:
- Funcao: `auto-rules`
- Schedule: `*/30 * * * *` (a cada 30 minutos)

Ou via SQL:
```sql
select cron.schedule('auto-rules-cron', '*/30 * * * *',
  $$select net.http_post(url:='https://SEU_PROJECT.supabase.co/functions/v1/auto-rules', headers:='{"Authorization": "Bearer SEU_SERVICE_KEY"}'::jsonb) as request_id;$$
);
```

### 7. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:5173

## Funcionalidades

- **Dashboard**: Metricas consolidadas (investimento, impressoes, cliques, ROAS) + tabela de campanhas
- **Campanhas**: CRUD completo com formulario de criacao/edicao
- **Grupos de Anuncios**: Listagem e criacao
- **Anuncios**: RSA (Responsive Search Ads) com ate 15 titulos e 4 descricoes
- **Analytics**: Grafico de performance por periodo + comparacao entre periodos
- **IA Assistant**: Chat com Claude analisando dados reais da conta
- **Gerador de Copy**: Claude gera titulos e descricoes otimizados
- **Calculadora de Escala**: Projeta resultados ao aumentar orcamento
- **Fadiga Criativa**: Detecta queda de CTR e recomenda rotacao
- **Regras Automaticas**: Condicoes (CPA > X, CTR < Y) com acoes automaticas

## Variaveis de Ambiente Supabase Edge Functions

| Variavel | Descricao |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Token de desenvolvedor Google Ads |
| `ANTHROPIC_API_KEY` | Chave API Anthropic (Claude) |
| `SUPABASE_URL` | URL do projeto Supabase (automatico) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (automatico) |
