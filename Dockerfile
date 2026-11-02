FROM node:22-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app

# Dependências do sistema para módulos nativos caso necessário (ex.: better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copia arquivos do workspace para cache de camadas
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instala dependências incluindo devDependencies para compilação TypeScript
RUN NODE_ENV=development pnpm install --frozen-lockfile

# Copia configurações base e código da API
COPY tsconfig.base.json biome.json ./
COPY apps/api ./apps/api

# Executa build do TypeScript
RUN pnpm --filter @cronflow/api build

# Stage de execução
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3333

CMD ["node", "apps/api/dist/src/server.js"]
