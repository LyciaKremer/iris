# Iris

Aplicação web para geração, revisão e histórico do clipping da Prefeitura Municipal de João Pessoa (PMJP) — piloto da migração do pipeline local [alertas-wpp-pmjp](https://github.com/LyciaKremer/alertas-wpp-pmjp) para uma ferramenta hospedada, acessível de qualquer lugar.

O disparo no WhatsApp continua local (Selenium) — o Iris só cuida de importar o clipping, gerar os resumos por IA, permitir revisão/correção manual, manter o histórico, e exportar o JSON de mensagens que o script local consome pra disparar.

## Stack

Next.js 16 (App Router) + TypeScript + Prisma 7 + Neon (adaptador serverless) + Tailwind v4, seguindo os mesmos padrões do [Monet Ledger](https://github.com/LyciaKremer/monet-ledger): autenticação própria (JWT + argon2, sem fornecedor terceiro), Server Actions pra mutações, queries diretas pra leitura.

## Rodando localmente

1. `npm install`
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` (Neon), `SESSION_SECRET` e `ANTHROPIC_API_KEY`.
3. `npm run db:migrate` — cria as tabelas.
4. `npm run db:seed` — cria o usuário inicial (`dev@iris.local` / `iris1234` por padrão, ou defina `SEED_EMAIL`/`SEED_PASSWORD` no `.env`).
5. `npm run dev` — abre em `http://localhost:3000`.

## Fluxo de uso

1. **Importar** — sobe o JSON exportado (mesmo formato que `mergeJson.py` produz hoje) e escolhe a data do disparo.
2. **Revisar** — processa cada notícia (gera resumo via IA pra Rádio/TV, classifica sentimento e secretaria), com opção de correção manual de qualquer campo.
3. **Exportar** — gera o JSON de mensagens no formato final de envio (mesmas regras de `formatador.py`: negativas nunca agrupadas, comercial/publicidade filtrado) pra alimentar o script local de disparo.

## Escopo do piloto — o que ainda não entrou

Deixado pra depois de validar o fluxo essencial:

- **Verificação automática por segunda IA** (equivalente a `verificacao.py`).
- **Unificação/dedup de notícias que cobrem o mesmo fato** (equivalente a `unificador.py`) — hoje cada notícia processada gera sua própria linha na mensagem final, sem fusão.
- Detecção de picos, relatórios semanais.

## Modelo de dados

Uma única tabela `Noticia` substitui os arquivos de cache (`manchetes.json`, `sentimentos.json`, `secretarias.json`) e o histórico (`historico_noticias.json`) do pipeline Python: campos `null` significam "ainda não processado" (o equivalente a um cache miss), e a linha persistida já É o registro histórico — dedup por `(noticiaId, dataExecucao)`, replicando a regra de `historico.py`.

## Deploy

Vercel (Next.js) + Neon (Postgres), mesmo setup do Monet Ledger — `vercel-build` roda `prisma migrate deploy && next build` automaticamente. Variáveis de ambiente necessárias na Vercel: `DATABASE_URL`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`.
