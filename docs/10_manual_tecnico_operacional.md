# 10 --- Manual Técnico e Operacional

## 1. Objetivo

Orientar manutenção, onboarding técnico e operação da V1.0. Este arquivo
complementa o `TSE_APP_ARCHITECTURE.md`, especialmente sua Seção 7.

## 2. Estrutura atual

``` text
VotoApuradoAPP/
├── .github/workflows/        CI (ver Seção 9)
├── TSE_APP_ARCHITECTURE.md
├── dashboard/
│   └── src/{pages,components,hooks,lib,store,types,test}/
├── importador/
│   └── {loaders,db}/, main.py, config.py
├── supabase/migrations/
├── postgrest/
├── infra/
└── arquivostse/
```

## 3. Ambientes

-   DEV: ambiente local.
-   PROD: VPS Locaweb.
-   Não existe staging formal no momento.

## 4. Banco/API

-   PostgreSQL 17;
-   PostgREST em `127.0.0.1:3001` na VPS;
-   Nginx publica `/api`;
-   Supabase apenas para Auth;
-   JWT ES256/JWKS;
-   schema `auth` recriado no banco de dados.

## 5. Segurança de views materializadas

Não expor `mv_*` diretamente. Preservar o padrão: 1. revoke de roles
públicos; 2. wrapper `vw_*`; 3. checagem de `usuarios_permissoes` com
`auth.uid()`.

## 6. Migrações

-   migrations são fonte da verdade;
-   nova alteração = nova migration;
-   validar localmente;
-   revisar impacto;
-   aplicar em produção no processo vigente;
-   documentar rollback quando mudança for destrutiva.

## 7. Importação atual

O MVP usa `importador/` local com Python/pandas/psycopg3. Até o
backoffice novo estar pronto, esse fluxo continua sendo o fallback
operacional.

A V1.0 deverá encapsular/reutilizar essa lógica em job remoto, sem
remover o fallback antes de homologar o novo fluxo.

## 8. Deploy

Fluxo atual: `dev` → Pull Request → `main` → produção.

Não fazer push direto em `main`.

## 9. Testes e CI (a partir do Épico 3)

Estratégia deliberadamente **não uniforme** — não se persegue cobertura
ampla, só onde o teste paga o investimento (decidido com o usuário ao
planejar o Épico 3):

-   **Domínio/métricas** (`dashboard/src/lib/metrics/*`): cobertura
    próxima de 100%. São funções puras — sem I/O, fáceis de testar com
    casos-limite reais (denominador zero, poucos itens). É onde um
    teste unitário realmente pega regressão.
-   **Hooks com lógica real embutida** (ex.: reduzir dado bruto pra
    achar um "líder"): a lógica é extraída para uma função pura em
    `lib/` antes de testar — não se testa o hook inteiro com rede
    mockada. Hooks que só fazem `select`/`eq` puro no PostgREST não
    têm teste dedicado.
-   **Integração**: só nos fluxos que travam o produto (contexto
    persistente, permissão, drill-down) — ainda não implementado.
-   **E2E**: um caminho crítico só (login → diagnóstico → território
    → oportunidade → cenário) — ainda não implementado, depende dos
    épicos seguintes existirem de verdade.

**Stack**: Vitest + `@testing-library/react` (reaproveita a config do
Vite existente, sem ferramenta nova). Rodar localmente:

```bash
npm test          # roda uma vez (usado no CI)
npm run test:watch  # modo watch, para desenvolvimento
```

**CI**: GitHub Actions (`.github/workflows/ci.yml`), roda em todo PR
para `main`/`dev` e em todo push para `dev`: `tsc -b` → `npm test` →
`npm run build`. Ainda não é um check obrigatório na Ruleset da branch
`main` — precisa ser marcado como obrigatório manualmente em
Settings → Rules → Rulesets → "Require status checks to pass".

## 10. Observabilidade mínima V1.0

Registrar: - erros de front; - falhas de API; - duração de queries
críticas; - importações; - jobs; - falhas administrativas.

A ferramenta concreta deve ser escolhida conforme custo/infra.

## 11. Checklist de release

-   migrations revisadas;
-   testes de metodologia;
-   permissões/RLS testadas;
-   build sem erro;
-   desktop/mobile validados;
-   rotas protegidas;
-   feature flags corretas;
-   dados de produção não usados em fixtures públicas;
-   PR aprovado;
-   backup antes de migration destrutiva;
-   smoke test pós-deploy.

## 12. Documentação viva

Qualquer alteração relevante deve atualizar: - catálogo funcional; -
metodologia, se métrica mudou; - manual do usuário, se UX mudou; -
manual técnico, se arquitetura/operação mudou; - changelog/roadmap.
