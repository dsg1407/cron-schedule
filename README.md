# CronFlow

Gerenciador de tarefas agendadas (CronJobs HTTP) com motor de execução in-process, retentativas com backoff exponencial e inspeção completa de respostas recebidas.

![Licença MIT](https://img.shields.io/badge/license-MIT-2563eb.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-16a34a.svg)
![pnpm](https://img.shields.io/badge/pnpm-monorepo-f59e0b.svg)

---

## O problema que o CronFlow resolve

Scripts agendados no `crontab` de um servidor Linux falham em silêncio quando um certificado TLS vence, o banco demora mais que o esperado ou a API externa devolve `HTTP 502`. Quando você percebe, a rotina de fechamento ou sincronização já está parada há dias e o corpo do erro foi perdido.

O **CronFlow** centraliza o agendamento de endpoints HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) em uma interface web com telemetria persistida em **SQLite** (desenvolvimento e testes) e **PostgreSQL** (produção):

- **Agendamento POSIX de 5 campos com fuso IANA**: cada tarefa roda no fuso configurado (`America/Sao_Paulo`, `UTC`, etc.) usando `croner` com trava `protect: true` para impedir sobreposição caso a execução anterior ainda esteja ativa.
- **Backoff exponencial automático**: respostas fora do intervalo `200–299` ou timeouts acionam até 5 retentativas com atrasos de `500ms`, `1s`, `2s`, `4s` e `8s`.
- **Inspeção de resposta até 64 KB**: cada disparo grava código HTTP, latência em milissegundos, quantidade de tentativas, cabeçalhos retornados e os primeiros `65.536 bytes` do corpo da resposta.
- **Proteção contra SSRF**: bloqueio configurável de chamadas para loopback (`127.0.0.1`, `localhost`) e faixas de IP privadas em produção via `ALLOW_PRIVATE_NETWORKS`.

---

## Arquitetura do Monorepo

```text
cron-schedule/
├── apps/
│   ├── api/                  # Fastify 5 + Zod + Drizzle ORM (SQLite dev/test & PostgreSQL prod) + Croner
│   │   ├── drizzle/          # Migrações SQL geradas pelo drizzle-kit (SQLite e PostgreSQL)
│   │   ├── src/
│   │   │   ├── domain/       # Entidades (User, CronJob, ExecutionLog), UUIDv7 e erros
│   │   │   ├── application/  # Ports e Use Cases desacoplados de infraestrutura
│   │   │   ├── infra/        # Repositórios SQLite e PostgreSQL, CronerSchedulerAdapter, FetchHttpExecutor
│   │   │   └── http/         # Rotas Fastify, plugins (JWT, CORS, Swagger) e presenters
│   │   └── tests/            # Testes unitários e de integração (Vitest)
│   └── web/                  # React 19 + Vite 6 + Tailwind v4 + Base UI (shadcn base-nova)
│       └── src/
│           ├── api/          # Funções HTTP por endpoint + handlers MSW para testes
│           ├── components/   # Primitivos de UI, gráficos Sparkline e modal de Donation
│           └── pages/        # Dashboard (/), CronJobs (/cron-jobs), Execuções (/executions),
│                             # Configurações (/settings), Documentação (/docs) e Autenticação
├── biome.json                # Linter e formatador único para todo o workspace
├── pnpm-workspace.yaml       # Definição do workspace pnpm
└── LICENSE                   # Licença MIT
```

---

## Requisitos e Instalação Rápida

- **Node.js** `>= 20` (testado em Node 22 e Node 24)
- **pnpm** `>= 9`

```bash
# 1. Instalar dependências de todos os pacotes
pnpm install

# 2. Iniciar API (porta 3333) e Web (porta 5173) simultaneamente
pnpm dev
```

- **Interface Web**: `http://localhost:5173`
- **API HTTP**: `http://localhost:3333`
- **Documentação OpenAPI (Swagger)**: `http://localhost:3333/docs`

---

## Variáveis de Ambiente

### Backend (`apps/api`)

| Variável | Padrão | Descrição |
|---|---|---|
| `NODE_ENV` | `development` | Ambiente de execução (`development` e `test` usam SQLite; `production` exige PostgreSQL). |
| `PORT` | `3333` | Porta HTTP do servidor Fastify. |
| `HOST` | `0.0.0.0` | Endereço de bind do servidor. |
| `DATABASE_URL` | `./data/cronflow.db` (dev/test) / `postgresql://...` (prod) | Caminho SQLite em `development`/`test` ou connection string `postgresql://` em `production`. |
| `JWT_SECRET` | `cronflow-super-secret-jwt-key-2026` | Chave secreta usada na assinatura dos tokens JWT. |
| `ALLOW_PRIVATE_NETWORKS` | `true` em dev / `false` em prod | Permite ou bloqueia disparos para `localhost` e IPs privados (`10.x`, `172.16-31.x`, `192.168.x`). |

### Frontend (`apps/web`)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3333` | URL base da API Fastify. |
| `VITE_DONATION_PIX_KEY` | `dsg1407@gmail.com` | Chave PIX exibida no modal de apoio e na página `/docs`. |
| `VITE_DONATION_SPONSOR_URL` | `https://github.com/sponsors/dsg1407` | Link externo de patrocínio (GitHub Sponsors / Buy Me a Coffee). |

---

## Principais Endpoints da API

Todas as rotas sob `/api/dashboard`, `/api/cron-jobs`, `/api/executions` e `/api/profile` exigem cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verificação de saúde do servidor (`200 OK`). |
| `POST` | `/api/auth/register` | Cria conta de usuário e retorna token JWT. |
| `POST` | `/api/auth/login` | Autentica usuário por e-mail e senha. |
| `GET` | `/api/profile` | Retorna perfil e padrões operacionais do usuário autenticado. |
| `PUT` | `/api/profile/settings` | Atualiza timezone padrão, timeout, retentativas e retenção de logs. |
| `GET` | `/api/dashboard/summary` | KPIs das últimas 24h, séries para sparklines e atividade recente. |
| `GET` | `/api/cron-jobs` | Lista CronJobs paginados com busca, filtro por status e próxima execução. |
| `POST` | `/api/cron-jobs` | Cadastra novo CronJob e agenda imediatamente no `Croner`. |
| `PUT` | `/api/cron-jobs/:cronJobId` | Atualiza definição da tarefa e ressincroniza o agendador. |
| `PATCH` | `/api/cron-jobs/:cronJobId/status` | Alterna tarefa entre `active` e `paused`. |
| `POST` | `/api/cron-jobs/:cronJobId/trigger` | Dispara execução manual imediata da tarefa e grava o resultado. |
| `DELETE` | `/api/cron-jobs/:cronJobId` | Remove o CronJob, cancela seu timer ativo e apaga o histórico vinculado. |
| `GET` | `/api/executions` | Lista histórico paginado de execuções com filtro por status e job. |
| `GET` | `/api/executions/:executionId` | Retorna payload completo da resposta (`responseBody` e `responseHeaders`). |
| `DELETE` | `/api/executions/purge` | Remove logs de execução anteriores à janela de retenção configurada. |

---

## Scripts de Qualidade e Testes

```bash
# Executar todas as suítes de testes (unitários + integração na API + componentes/páginas na Web)
pnpm test

# Verificar tipagem TypeScript em todos os pacotes
pnpm typecheck

# Executar linter e verificação de formatação com Biome
pnpm lint

# Gerar build de produção da API e do Frontend
pnpm build
```

---

## Apoie o Projeto (Donation)

O **CronFlow** é um projeto independente de código aberto distribuído sob licença MIT. Se ele ajuda no monitoramento das rotinas agendadas da sua empresa ou projeto pessoal, você pode apoiar sua manutenção e evolução:

- **Chave PIX (E-mail)**: `dsg1407@gmail.com` *(Daniel S. Gonçalves)*
- **GitHub Sponsors**: [https://github.com/sponsors/dsg1407](https://github.com/sponsors/dsg1407)
- **Dentro da aplicação**: clique em **Apoiar o projeto** no rodapé da barra lateral ou acesse a rota `/docs` para visualizar o QR Code PIX e copiar o código **PIX Copia e Cola (EMV-Co BRCode)**.

---

## Licença

Distribuído sob a **Licença MIT**. Consulte o arquivo [LICENSE](./LICENSE) para o texto integral.

Copyright (c) 2026 **Daniel S. Gonçalves** (`dsg1407@gmail.com`).

