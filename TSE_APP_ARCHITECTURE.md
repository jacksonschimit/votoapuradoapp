# PRD — Plataforma de Inteligência Eleitoral
## Especificação Técnica para Análise Histórica e Multieleitoral de Dados do TSE, com Foco Estratégico em Campanhas Futuras

**Versão:** 2.0
**Classificação:** Documento Técnico Interno
**Autores:** Engenharia de Software, Ciência de Dados e Arquitetura de Soluções
**Stack Obrigatória:** Python 3.11+ / FastAPI (Backoffice — Serviço Web) · React 18 + Vite + TypeScript + Tailwind CSS + Recharts + Shadcn UI (Cliente) · Supabase (PostgreSQL 15+ gerenciado + Auth + Storage)

> **Nota de revisão (v2.0):** esta versão substitui a v1.0 e incorpora quatro mudanças estruturais: (1) o backoffice deixa de ser um script local e passa a ser um serviço web autenticado; (2) o modelo de dados deixa de ser específico de 2022 e passa a suportar qualquer ciclo eleitoral (Gerais e Municipais, passadas e futuras); (3) a V1 já nasce multiusuário, com login via conta Google; (4) o modelo geográfico é corrigido para distinguir **Local de Votação** (nome/endereço) de **Seção Eleitoral**, com análise possível em ambos os níveis, além de Zona.

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Proposta de Valor

A plataforma é um produto de **Business Intelligence Eleitoral (BI Eleitoral)** que transforma os microdados públicos do TSE em um dashboard analítico acionável, multitemporal e multiusuário. O produto é comercializado para **pré-candidatos, assessores de campanha, partidos políticos e consultorias eleitorais** que estruturam a estratégia territorial de campanhas futuras.

A tese central do produto é: *o comportamento eleitoral histórico, apurado com a maior granularidade geográfica disponível publicamente (Seção Eleitoral e Local de Votação), é o melhor insumo disponível para identificar bases de apoio, currais eleitorais consolidados, zonas de vulnerabilidade e territórios de oportunidade*. O produto não faz previsão eleitoral nem projeção de tendência automática — ele expõe, organiza e cruza dados históricos reais de múltiplos pleitos, permitindo que o cliente extraia a própria leitura estratégica, inclusive **comparando a evolução de um mesmo território ao longo de diferentes eleições**.

### 1.2 Escopo Multieleitoral (Revisão Central da v2.0)

Diferente da concepção inicial (restrita ao pleito de 2022), a plataforma é desenhada desde o modelo de dados até a interface para ser **agnóstica ao ciclo eleitoral**. Isso significa:

- O ciclo eleitoral de **2022** é o dataset seed inicial e o mais completo/testado no lançamento, mas a arquitetura suporta a importação de:
  - **Eleições Gerais** (Presidente, Governador, Senador, Deputado Federal, Deputado Estadual) de qualquer ano — 2014, 2018, 2022, 2026, 2030 etc.
  - **Eleições Municipais** (Prefeito, Vice-Prefeito, Vereador) de qualquer ano — 2016, 2020, 2024, 2028 etc.
- Cada arquivo importado é vinculado a um registro de **ciclo eleitoral** (`eleicao`), que carrega o ano, o tipo de pleito e o turno, permitindo que o mesmo território (mesma seção, mesmo local de votação) seja consultado **em série histórica** — por exemplo, comparando a votação de um candidato/partido na Seção 042 do Município X entre 2018, 2022 e 2026.
- O dashboard cliente ganha, portanto, um **seletor de Eleição/Ano** como filtro de primeiro nível (antes mesmo do filtro geográfico), e uma tela adicional de **Comparativo Histórico** (Seção 4.7).

**Limitação explícita mantida:** a plataforma continua sendo estritamente descritiva/analítica sobre dados oficiais já apurados e publicados pelo TSE — não há modelo preditivo, projeção estatística de resultado futuro, nem integração com pesquisas de opinião. A capacidade "multieleitoral" amplia a base histórica disponível para leitura, não introduz inferência probabilística sobre o futuro.

### 1.3 Público-Alvo (ICP)

- Candidatos e pré-candidatos a cargos Municipais, Estaduais e Federais em ciclos futuros.
- Coordenadores de campanha e diretores de comunicação política.
- Consultorias e institutos de assessoria eleitoral que atendem múltiplos clientes simultaneamente (a plataforma já nasce multiusuário e multi-workspace, ver Seção 1.4 e Seção 5).

### 1.4 Modelo de Acesso (V1 já Multiusuário)

Diferente da concepção inicial de contrato único por cliente, a **V1 já implementa controle multiusuário completo**:

- Autenticação via **Supabase Auth**, com **login social via conta Google (OAuth 2.0)** como método primário, e e-mail/senha como método secundário de contingência.
- Cada usuário autenticado recebe um perfil (`usuarios_perfil`) e um conjunto de permissões de escopo (UF, e opcionalmente município/candidato de interesse), atribuídas por um administrador após o primeiro login (fluxo de onboarding descrito na Seção 5.3).
- Dois papéis (`papel`) na V1: `admin` (acesso ao Backoffice Web e a todos os dados) e `cliente` (acesso restrito ao dashboard e aos escopos geográficos/eleitorais liberados para sua conta).
- A arquitetura de permissões já é desenhada para suportar múltiplos clientes simultâneos com escopos distintos e sobrepostos, preparando o caminho natural para um modelo de billing self-service em versões futuras, sem necessidade de remodelagem de dados.

### 1.5 Escopo Funcional da V1 — Resumo

**Incluso no escopo:**
- Backoffice web autenticado para upload e processamento de arquivos CSV do TSE de qualquer ciclo eleitoral (Geral ou Municipal, qualquer ano), acessível remotamente pelo administrador.
- Cobertura de todos os cargos Municipais, Estaduais e Federais previstos no leiaute do TSE.
- Dashboard web responsivo com cinco granularidades de análise: **Eleição/Ano → Estado → Município → Zona Eleitoral → Local de Votação → Seção Eleitoral**.
- Busca e filtro por **nome do local de votação** e por **endereço**, além dos filtros geográficos hierárquicos tradicionais.
- Identificação visual de "currais eleitorais" e "seções/locais de oportunidade" em qualquer nível de agregação (Seção, Local de Votação ou Zona).
- Comparativo histórico entre ciclos eleitorais para um mesmo território.
- Login via conta Google, com múltiplos usuários e múltiplos escopos de acesso simultâneos.
- Exportação de relatórios (CSV/PDF) por recorte geográfico e temporal selecionado.

**Fora do escopo da V1 (limitações explícitas mantidas):**
- Não há modelo preditivo, machine learning de projeção de votos ou IA generativa de discurso/propaganda.
- Não há integração com redes sociais, pesquisas de opinião ou dados de geolocalização de eleitor individual — trabalha-se exclusivamente com dados agregados e anonimizados por Seção Eleitoral, como publicados pelo TSE.
- Não há módulo de gestão de campanha (CRM de cabos eleitorais, gestão financeira, prestação de contas).
- Billing self-service e criação de conta autônoma (self-signup sem aprovação) ficam fora do escopo da V1 — o provisionamento de escopo de acesso a um novo usuário cliente continua exigindo uma ação de aprovação do administrador (o login em si é self-service via Google, mas a liberação de dados não é).

### 1.6 Fontes de Dados

Os arquivos de origem são os públicos disponibilizados pelo TSE no Repositório de Dados Eleitorais (dadosabertos.tse.jus.br), para qualquer ano de pleito Geral ou Municipal:
- `consulta_cand_AAAA_BRASIL.csv` — cadastro de candidatos.
- `votacao_secao_AAAA_BRASIL.csv` (ou arquivos por UF) — Boletim de Urna agregado por seção eleitoral.
- `eleitorado_local_votacao_AAAA.csv` — quantidade de eleitores aptos por seção, incluindo **nome do local de votação e endereço completo**, que é o dado que origina a distinção formalizada na Seção 2.4 desta versão do documento.

Esses arquivos são estruturados com separador `;`, codificação `latin-1` (ISO-8859-1) e, em pleitos gerais no agregado nacional, ultrapassam facilmente a centena de milhões de linhas — fator determinante para as decisões de arquitetura das Seções 2 e 3, agora multiplicado pelo número de ciclos eleitorais que o cliente decidir importar ao longo do tempo.

---

## 2. MODELAGEM DO BANCO DE DADOS (SUPABASE / POSTGRESQL)

### 2.1 Princípios de Design (Atualizados)

Com a generalização multieleitoral, o modelo de dados deixa de ter tabelas com sufixo de ano fixo (`_2022`) e passa a ter uma tabela mestre `eleicao` que atua como dimensão temporal/tipológica, referenciada por todas as tabelas de fato. Os princípios de desnormalização seletiva, tipagem restrita e indexação alinhada ao padrão de navegação do dashboard, definidos na v1.0, são mantidos e estendidos para incluir `eleicao_id` como parte de praticamente todo índice composto relevante, já que o filtro por ciclo eleitoral passa a ser tão frequente quanto o filtro geográfico.

### 2.2 Diagrama Entidade-Relacionamento (Lógico)

```
eleicao (dim: ano, tipo, turno) ────────────────────────────────────┐
                                                                     │
uf (dim) ──< municipio (dim) ──< zona_eleitoral (dim)               │
                                        │                            │
                                        └──< local_votacao (dim) ──< secao_eleitoral (dim)
                                                                     │
candidatos (fato/dim, por eleicao_id) ──────< votacao_secao (fato) ─┤
                                                                     │
eleitorado_secao (fato, por eleicao_id) ────────────────────────────┘

usuarios_perfil (dim) ──< usuarios_permissoes (fato: escopo por uf/eleicao/papel)
```

### 2.3 DDL — Dimensão Temporal/Tipológica: `eleicao` (Nova na v2.0)

```sql
create type tipo_eleicao_enum as enum ('GERAL', 'MUNICIPAL');

-- ============================================================
-- TABELA: eleicao — dimensão mestre de ciclo eleitoral.
-- Toda tabela de fato referencia esta tabela via eleicao_id.
-- ============================================================
create table public.eleicao (
    id               bigint              generated always as identity primary key,
    ano              smallint            not null,
    tipo_eleicao     tipo_eleicao_enum   not null,
    turno            smallint            not null check (turno in (1,2)),
    descricao        text                not null, -- ex.: "Eleições Gerais 2022 - 1º Turno"
    data_pleito      date,
    ativa_para_import boolean            not null default true, -- flag operacional do backoffice
    criado_em        timestamptz         not null default now(),
    unique (ano, tipo_eleicao, turno)
);

create index idx_eleicao_ano_tipo on public.eleicao (ano, tipo_eleicao);
```

Toda importação no backoffice exige a seleção (ou criação, se ainda não existir) de um registro em `eleicao` antes do upload do CSV correspondente — é esse `eleicao_id` que amarra o arquivo importado ao ciclo correto e habilita tanto o filtro quanto o comparativo histórico do dashboard.

### 2.4 DDL — Tabelas de Dimensão Geográfica (Local de Votação Separado da Seção)

Um esclarecimento importante motivou a revisão desta seção: nos arquivos do TSE, **o Local de Votação e a Seção Eleitoral são entidades distintas em relação de 1-para-N**. Um mesmo Local de Votação (ex.: "E.E. Professor João da Silva", em determinado endereço) hospeda fisicamente **várias seções eleitorais** (ex.: seções 001, 002, 003...), cada uma com seu próprio conjunto de eleitores e sua própria urna/apuração. Na v1.0 esse dado (nome e endereço) havia sido incorretamente anexado como colunas soltas dentro de `secao_eleitoral`, o que impedia agregações corretas ao nível do prédio/local físico. A v2.0 corrige isso criando `local_votacao` como dimensão própria:

```sql
create extension if not exists pg_trgm;
create extension if not exists btree_gin;
create extension if not exists cube;
create extension if not exists earthdistance;

-- ============================================================
-- TABELA: uf (dimensão de Unidade Federativa) — inalterada
-- ============================================================
create table public.uf (
    sigla_uf        char(2)      primary key,
    nome_uf         text         not null,
    regiao          text         not null check (regiao in
                        ('Norte','Nordeste','Centro-Oeste','Sudeste','Sul','Nacional'))
);

-- ============================================================
-- TABELA: municipio (dimensão de Município) — inalterada
-- ============================================================
create table public.municipio (
    codigo_ibge      integer      primary key,
    codigo_tse       integer      not null,
    nome_municipio   text         not null,
    sigla_uf         char(2)      not null references public.uf(sigla_uf),
    capital          boolean      not null default false
);

create index idx_municipio_uf on public.municipio (sigla_uf);
create index idx_municipio_nome_trgm on public.municipio using gin (nome_municipio gin_trgm_ops);
create unique index idx_municipio_codigo_tse on public.municipio (codigo_tse);

-- ============================================================
-- TABELA: zona_eleitoral (dimensão) — inalterada na estrutura,
-- mas agora consultável de forma independente como nível de agregação
-- no dashboard (ver Seção 4.4).
-- ============================================================
create table public.zona_eleitoral (
    id               bigint       generated always as identity primary key,
    numero_zona      smallint     not null,
    codigo_municipio integer      not null references public.municipio(codigo_ibge),
    sigla_uf         char(2)      not null references public.uf(sigla_uf),
    unique (numero_zona, codigo_municipio)
);

create index idx_zona_municipio on public.zona_eleitoral (codigo_municipio);

-- ============================================================
-- TABELA: local_votacao (NOVA — dimensão própria do prédio/endereço)
-- Um local de votação pode, em tese, persistir (mesmo código de
-- local) entre eleições diferentes, mas seu nome/endereço pode mudar
-- (reformas, renumeração municipal, mudança de escola etc.), por isso
-- o vínculo com eleicao_id garante fidelidade histórica ao momento do pleito.
-- ============================================================
create table public.local_votacao (
    id                 bigint      generated always as identity primary key,
    eleicao_id         bigint      not null references public.eleicao(id),
    codigo_local_tse   integer     not null, -- CD_LOCAL_VOTACAO do TSE
    nome_local         text        not null,
    endereco           text,
    bairro             text,
    cep                text,
    zona_id            bigint      not null references public.zona_eleitoral(id),
    codigo_municipio   integer     not null references public.municipio(codigo_ibge),
    sigla_uf           char(2)     not null references public.uf(sigla_uf),
    latitude           numeric(10,7),
    longitude          numeric(10,7),
    unique (eleicao_id, codigo_local_tse, zona_id)
);

create index idx_local_votacao_municipio on public.local_votacao (codigo_municipio, eleicao_id);
create index idx_local_votacao_zona on public.local_votacao (zona_id, eleicao_id);
create index idx_local_votacao_nome_trgm on public.local_votacao using gin (nome_local gin_trgm_ops);
create index idx_local_votacao_endereco_trgm on public.local_votacao using gin (endereco gin_trgm_ops);
create index idx_local_votacao_geo on public.local_votacao using gist (
    ll_to_earth(latitude, longitude)
) where latitude is not null and longitude is not null;

-- ============================================================
-- TABELA: secao_eleitoral (dimensão — granularidade "micro")
-- Agora referencia local_votacao em vez de carregar nome/endereço
-- soltos — corrigindo a modelagem apontada na revisão do usuário.
-- ============================================================
create table public.secao_eleitoral (
    id                 bigint     generated always as identity primary key,
    eleicao_id         bigint     not null references public.eleicao(id),
    numero_secao       smallint   not null,
    local_votacao_id   bigint     not null references public.local_votacao(id),
    zona_id            bigint     not null references public.zona_eleitoral(id),
    codigo_municipio   integer    not null references public.municipio(codigo_ibge),
    sigla_uf           char(2)    not null references public.uf(sigla_uf),
    unique (eleicao_id, numero_secao, zona_id)
);

create index idx_secao_municipio on public.secao_eleitoral (codigo_municipio, eleicao_id);
create index idx_secao_zona on public.secao_eleitoral (zona_id, eleicao_id);
create index idx_secao_local_votacao on public.secao_eleitoral (local_votacao_id);
```

**Esclarecimento conceitual sobre "currais eleitorais":** o termo, no contexto desta plataforma, não é exclusivo de um único nível geográfico — ele descreve um **padrão de concentração de votos**, que pode ser observado e é igualmente relevante em três granularidades diferentes, todas agora suportadas nativamente pelo dashboard (Seção 4.4):
- **Por Seção Eleitoral** — a leitura mais fina possível (300-400 eleitores), útil para ação de rua hiperlocalizada.
- **Por Local de Votação** — soma de todas as seções de um mesmo prédio/endereço, útil para identificar bairros/comunidades de concentração de apoio, já que um local de votação frequentemente corresponde a um bairro ou raio de vizinhança específico.
- **Por Zona Eleitoral** — a leitura mais ampla dentro do município, útil para alocação de recursos regionais (ex.: definir em qual zona alocar um coordenador de campanha).

### 2.5 DDL — Tabelas Fato Principais (Generalizadas para Multieleição)

```sql
-- Cargos ampliados para cobrir também pleitos municipais
create type cargo_enum as enum (
    'PRESIDENTE','GOVERNADOR','SENADOR','DEPUTADO FEDERAL','DEPUTADO ESTADUAL',
    'PREFEITO','VICE-PREFEITO','VEREADOR'
);

create type situacao_candidatura_enum as enum (
    'DEFERIDO','INDEFERIDO','CASSADO','RENUNCIA','FALECIDO','INAPTO','2º TURNO','ELEITO','NAO ELEITO','SUPLENTE'
);

-- ============================================================
-- TABELA: candidatos (antes candidatos_2022)
-- ============================================================
create table public.candidatos (
    sq_candidato          bigint                    primary key, -- SQ_CANDIDATO original do TSE (único globalmente por pleito)
    eleicao_id            bigint                    not null references public.eleicao(id),
    nr_candidato           integer                  not null,
    nm_candidato            text                    not null,
    nm_urna_candidato        text                   not null,
    nm_social_candidato       text,
    cargo                  cargo_enum               not null,
    sigla_uf               char(2)                  not null references public.uf(sigla_uf),
    codigo_municipio        integer                 references public.municipio(codigo_ibge), -- obrigatório para cargos municipais
    sigla_partido           text                    not null,
    nome_partido              text                  not null,
    numero_partido          smallint                not null,
    sigla_coligacao         text,
    nome_coligacao            text,
    situacao_candidatura    situacao_candidatura_enum,
    situacao_totalizacao     text,
    genero                 text,
    grau_instrucao          text,
    ocupacao                text,
    idade_posse             smallint,
    foto_url                text,
    criado_em               timestamptz             not null default now()
);

create index idx_candidatos_eleicao_uf_cargo on public.candidatos (eleicao_id, sigla_uf, cargo);
create index idx_candidatos_municipio on public.candidatos (codigo_municipio, eleicao_id) where codigo_municipio is not null;
create index idx_candidatos_partido on public.candidatos (sigla_partido, eleicao_id);
create index idx_candidatos_numero on public.candidatos (nr_candidato, sigla_uf, cargo, eleicao_id);
create index idx_candidatos_nome_trgm on public.candidatos using gin (nm_urna_candidato gin_trgm_ops);

-- ============================================================
-- TABELA: votacao_secao (antes votacao_secao_2022) — TABELA CRÍTICA
-- ============================================================
create table public.votacao_secao (
    id                bigint        generated always as identity primary key,
    eleicao_id         bigint       not null references public.eleicao(id),
    sq_candidato       bigint       not null references public.candidatos(sq_candidato),
    secao_id           bigint       not null references public.secao_eleitoral(id),
    local_votacao_id   bigint       not null references public.local_votacao(id), -- desnormalizado para evitar JOIN no agregado por local
    zona_id            bigint       not null references public.zona_eleitoral(id),  -- desnormalizado para evitar JOIN no agregado por zona
    codigo_municipio   integer      not null references public.municipio(codigo_ibge),
    sigla_uf           char(2)      not null references public.uf(sigla_uf),
    cargo              cargo_enum   not null,
    qtde_votos         integer      not null default 0 check (qtde_votos >= 0),
    criado_em          timestamptz  not null default now(),
    unique (eleicao_id, sq_candidato, secao_id)
)
partition by list (sigla_uf); -- particionamento nativo por UF (ver Seção 2.6)

-- Índice composto principal: eleição sempre é o primeiro filtro aplicado pelo dashboard,
-- seguido da hierarquia geográfica.
create index idx_votacao_eleicao_uf_muni_secao on public.votacao_secao
    (eleicao_id, sigla_uf, codigo_municipio, secao_id, cargo);

-- Índice para a nova granularidade de Local de Votação
create index idx_votacao_local on public.votacao_secao
    (eleicao_id, local_votacao_id, cargo) include (qtde_votos, sq_candidato);

-- Índice para a granularidade de Zona Eleitoral
create index idx_votacao_zona on public.votacao_secao
    (eleicao_id, zona_id, cargo) include (qtde_votos, sq_candidato);

-- Índice para agregações por candidato (visão "candidato" do dashboard)
create index idx_votacao_candidato on public.votacao_secao (sq_candidato);

-- ============================================================
-- TABELA: eleitorado_secao (antes eleitorado_secao_2022)
-- ============================================================
create table public.eleitorado_secao (
    secao_id             bigint     primary key references public.secao_eleitoral(id),
    eleicao_id           bigint     not null references public.eleicao(id),
    qtde_aptos            integer   not null default 0,
    qtde_comparecimento   integer   not null default 0,
    qtde_abstencoes        integer  not null default 0,
    qtde_votos_brancos     integer  not null default 0,
    qtde_votos_nulos       integer  not null default 0
);

create index idx_eleitorado_eleicao on public.eleitorado_secao (eleicao_id);
```

### 2.6 Estratégia de Particionamento e Performance (Atualizada)

O particionamento por lista em `sigla_uf`, definido na v1.0, é mantido — continua sendo a estratégia correta porque toda consulta do dashboard filtra por UF (o cliente sempre opera dentro do escopo geográfico liberado para sua conta, conforme Seção 5). Cada UF recebe sua partição física:

```sql
create table public.votacao_secao_sp partition of public.votacao_secao for values in ('SP');
create table public.votacao_secao_mg partition of public.votacao_secao for values in ('MG');
-- ... repetir para as 27 UFs
```

Com a generalização multieleitoral, o volume histórico acumulado ao longo dos anos passa a crescer indefinidamente. Para evitar que uma partição de UF de alta população (SP, MG) fique excessivamente grande após vários ciclos importados, recomenda-se **sub-particionamento por faixa de `eleicao_id`** dentro das UFs de maior volume, criado sob demanda pelo backoffice à medida que novos ciclos são importados:

```sql
create table public.votacao_secao_sp
    partition of public.votacao_secao
    for values in ('SP')
    partition by range (eleicao_id);

create table public.votacao_secao_sp_2022
    partition of public.votacao_secao_sp
    for values from (1) to (10); -- faixa de eleicao_id correspondente ao ciclo 2022

create table public.votacao_secao_sp_2026
    partition of public.votacao_secao_sp
    for values from (10) to (20); -- faixa reservada para o ciclo 2026, criada antes da importação
```

Esse duplo particionamento (UF → Eleição) garante que uma consulta típica do dashboard — sempre filtrada por `eleicao_id` e `sigla_uf` simultaneamente — acione **partition pruning em dois níveis**, tocando apenas a fração mínima de dados relevante, independentemente de quantos ciclos eleitorais estejam acumulados na base.

### 2.7 Materialized Views (Atualizadas para Multieleição)

```sql
create materialized view public.mv_resultado_candidato_municipio as
select
    v.eleicao_id, e.ano, e.tipo_eleicao,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, c.cargo,
    v.sigla_uf, v.codigo_municipio, m.nome_municipio,
    sum(v.qtde_votos) as total_votos
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.municipio m on m.codigo_ibge = v.codigo_municipio
join public.eleicao e on e.id = v.eleicao_id
group by v.eleicao_id, e.ano, e.tipo_eleicao, v.sq_candidato, c.nm_urna_candidato,
         c.sigla_partido, c.cargo, v.sigla_uf, v.codigo_municipio, m.nome_municipio;

create unique index idx_mv_resultado_pk on public.mv_resultado_candidato_municipio
    (eleicao_id, sq_candidato, codigo_municipio);

-- Nova view: agregação por Local de Votação (para o mapa de currais por prédio/bairro)
create materialized view public.mv_resultado_candidato_local as
select
    v.eleicao_id, v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    v.local_votacao_id, lv.nome_local, lv.endereco, lv.latitude, lv.longitude,
    v.codigo_municipio, v.sigla_uf,
    sum(v.qtde_votos) as total_votos
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.local_votacao lv on lv.id = v.local_votacao_id
group by v.eleicao_id, v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
         v.local_votacao_id, lv.nome_local, lv.endereco, lv.latitude, lv.longitude,
         v.codigo_municipio, v.sigla_uf;

create unique index idx_mv_resultado_local_pk on public.mv_resultado_candidato_local
    (eleicao_id, sq_candidato, local_votacao_id);

create materialized view public.mv_resultado_candidato_uf as
select eleicao_id, sq_candidato, nm_urna_candidato, sigla_partido, cargo, sigla_uf,
       sum(total_votos) as total_votos_estado
from public.mv_resultado_candidato_municipio
group by eleicao_id, sq_candidato, nm_urna_candidato, sigla_partido, cargo, sigla_uf;

create unique index idx_mv_resultado_uf_pk on public.mv_resultado_candidato_uf (eleicao_id, sq_candidato);
```

### 2.8 View Analítica para "Currais Eleitorais" (Três Granularidades)

```sql
-- Nível Seção
create view public.vw_dominancia_secao as
select
    v.eleicao_id, v.secao_id, v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    v.qtde_votos, e.qtde_comparecimento,
    round((v.qtde_votos::numeric / nullif(e.qtde_comparecimento, 0)) * 100, 2) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.eleitorado_secao e on e.secao_id = v.secao_id;

-- Nível Local de Votação (soma de comparecimento das seções do local)
create view public.vw_dominancia_local as
select
    v.eleicao_id, v.local_votacao_id, lv.nome_local, lv.endereco,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    sum(v.qtde_votos) as qtde_votos,
    max(comp.total_comparecimento) as qtde_comparecimento,
    round(
        (sum(v.qtde_votos)::numeric / nullif(max(comp.total_comparecimento), 0)) * 100, 2
    ) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.local_votacao lv on lv.id = v.local_votacao_id
join (
    select se.local_votacao_id, sum(es.qtde_comparecimento) as total_comparecimento
    from public.eleitorado_secao es
    join public.secao_eleitoral se on se.id = es.secao_id
    group by se.local_votacao_id
) comp on comp.local_votacao_id = v.local_votacao_id
group by v.eleicao_id, v.local_votacao_id, lv.nome_local, lv.endereco,
         v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo;

-- Nível Zona Eleitoral
create view public.vw_dominancia_zona as
select
    v.eleicao_id, v.zona_id, ze.numero_zona,
    v.sq_candidato, c.nm_urna_candidato, c.sigla_partido, v.cargo,
    sum(v.qtde_votos) as qtde_votos,
    max(comp.total_comparecimento) as qtde_comparecimento,
    round(
        (sum(v.qtde_votos)::numeric / nullif(max(comp.total_comparecimento), 0)) * 100, 2
    ) as percentual_dominancia
from public.votacao_secao v
join public.candidatos c on c.sq_candidato = v.sq_candidato
join public.zona_eleitoral ze on ze.id = v.zona_id
join (
    select se.zona_id, sum(es.qtde_comparecimento) as total_comparecimento
    from public.eleitorado_secao es
    join public.secao_eleitoral se on se.id = es.secao_id
    group by se.zona_id
) comp on comp.zona_id = v.zona_id
group by v.eleicao_id, v.zona_id, ze.numero_zona, v.sq_candidato, c.nm_urna_candidato,
         c.sigla_partido, v.cargo;
```

---

## 3. FLUXO DO IMPORTADOR (BACKOFFICE — SERVIÇO WEB)

### 3.1 Revisão de Arquitetura: de CLI Local para Serviço Web Autenticado

A v1.0 especificava o backoffice como um script de execução exclusivamente local. Essa premissa foi revisada: **o backoffice passa a ser um serviço web** (API + interface administrativa mínima), hospedado em nuvem, para que qualquer administrador autorizado possa realizar upload e acompanhar o processamento de arquivos **de qualquer lugar**, sem depender de uma máquina específica configurada previamente. A lógica de parsing, tratamento de nulos e carga em lote (`COPY` + staging table) descrita na v1.0 é **inteiramente reaproveitada** — o que muda é a camada de exposição (de `click` CLI para endpoints HTTP autenticados) e a execução (de síncrona em terminal para assíncrona em background job).

### 3.2 Stack do Backoffice (Atualizada)

```
Python 3.11+
├── FastAPI                  → serviço web (endpoints REST de upload, status, listagem de importações)
├── uvicorn/gunicorn          → servidor ASGI para produção
├── pandas                    → leitura e tratamento de CSV em chunks (lógica reaproveitada da v1.0)
├── psycopg2-binary            → conexão de baixo nível ao Postgres (via Session Pooler do Supabase)
├── supabase-py                 → validação de JWT do admin e operações administrativas via Service Role Key
├── arq (Async Redis Queue)       → fila de jobs em background para processamento assíncrono dos arquivos
├── redis                            → broker da fila de jobs e cache de progresso de importação
├── python-jose[cryptography]         → validação de assinatura do JWT emitido pelo Supabase Auth
├── tenacity                            → retry com backoff exponencial em falhas de rede/timeout
└── python-multipart                     → suporte a upload de arquivos multipart no FastAPI
```

**Hospedagem recomendada:** container Docker implantado em serviço com suporte a processos de longa duração e filas (ex.: Railway, Render, Fly.io ou um VPS dedicado), separando o processo web (API) do worker de fila (`arq worker`), para que uploads de arquivos muito grandes não bloqueiem a thread de resposta HTTP.

### 3.3 Autenticação e Autorização do Backoffice Web

O backoffice **não** possui um sistema de login próprio — ele reutiliza o mesmo provedor de identidade do app cliente (Supabase Auth), exigindo que o usuário autenticado tenha `papel = 'admin'` na tabela `usuarios_permissoes` (Seção 5.4). Todo endpoint do backoffice é protegido por um middleware que:

1. Extrai o JWT do header `Authorization: Bearer <token>`, emitido pelo Supabase Auth no login (via Google OAuth ou e-mail/senha).
2. Valida a assinatura do JWT contra o JWKS público do projeto Supabase.
3. Consulta (com cache curto em Redis) se o `user_id` extraído do token possui `papel = 'admin'` em `usuarios_permissoes`.
4. Rejeita com `403 Forbidden` qualquer requisição de usuário autenticado sem papel administrativo — garantindo que um cliente comum, mesmo autenticado, nunca acesse rotas de importação.

```python
# backoffice/auth/middleware.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from db.connection import get_connection
from config import SUPABASE_JWT_SECRET

security = HTTPBearer()

async def exigir_admin(credenciais: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credenciais.credentials
    try:
        payload = jwt.decode(
            token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated"
        )
        user_id = payload["sub"]
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido ou expirado.")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select 1 from public.usuarios_permissoes "
                "where user_id = %s and papel = 'admin' limit 1",
                (user_id,)
            )
            if cur.fetchone() is None:
                raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso restrito a administradores.")

    return user_id
```

### 3.4 Endpoints do Serviço Web

```
POST   /api/eleicoes                          → cria um novo ciclo eleitoral (ano, tipo, turno)
GET    /api/eleicoes                          → lista ciclos eleitorais já cadastrados
POST   /api/importacoes/upload                → upload multipart de um CSV + eleicao_id + tipo_arquivo
GET    /api/importacoes/{job_id}/status        → progresso do processamento (percentual, linhas processadas)
GET    /api/importacoes                        → histórico de importações (consultando log_importacoes)
POST   /api/importacoes/{job_id}/reprocessar     → reexecuta um job que falhou (idempotente via ON CONFLICT)
```

```python
# backoffice/api/importacoes.py
from fastapi import APIRouter, UploadFile, Depends, File, Form
from auth.middleware import exigir_admin
from jobs.queue import enfileirar_job_importacao
import uuid, shutil, os

router = APIRouter(prefix="/api/importacoes", tags=["importacoes"])

@router.post("/upload")
async def upload_arquivo(
    eleicao_id: int = Form(...),
    tipo_arquivo: str = Form(...),  # 'candidatos' | 'votacao' | 'eleitorado'
    arquivo: UploadFile = File(...),
    admin_id: str = Depends(exigir_admin),
):
    job_id = str(uuid.uuid4())
    caminho_temp = f"/tmp/importacoes/{job_id}_{arquivo.filename}"
    os.makedirs(os.path.dirname(caminho_temp), exist_ok=True)

    # Streaming do upload direto para disco, sem carregar o arquivo inteiro em memória do processo web
    with open(caminho_temp, "wb") as destino:
        shutil.copyfileobj(arquivo.file, destino)

    # O processamento pesado (parsing + COPY em lote) NÃO roda na requisição HTTP —
    # é delegado a um worker de fila (arq), liberando a resposta imediatamente.
    await enfileirar_job_importacao(
        job_id=job_id, caminho_arquivo=caminho_temp, eleicao_id=eleicao_id,
        tipo_arquivo=tipo_arquivo, admin_id=admin_id
    )

    return {"job_id": job_id, "status": "enfileirado"}


@router.get("/{job_id}/status")
async def consultar_status(job_id: str, admin_id: str = Depends(exigir_admin)):
    from jobs.queue import consultar_progresso_redis
    progresso = await consultar_progresso_redis(job_id)
    return progresso  # {"status": "em_andamento", "linhas_processadas": 1_450_000, "percentual": 42.3}
```

### 3.5 Worker Assíncrono (Reaproveitando a Lógica de Chunk + COPY da v1.0)

```python
# backoffice/jobs/worker.py
from arq import cron
from parsers.votacao_parser import ler_votacao_em_chunks
from db.bulk_loader import carregar_lote_votacao
from db.connection import get_connection
from jobs.queue import atualizar_progresso_redis

async def processar_importacao_votacao(ctx, job_id: str, caminho_arquivo: str, eleicao_id: int):
    """
    Executa em processo separado (worker arq), fora do ciclo request/response HTTP.
    Reaproveita integralmente a estratégia de leitura em chunks e COPY via staging
    table descrita na v1.0 (Seção 3.5-3.6), agora parametrizada por eleicao_id.
    """
    total_processado = 0
    with get_connection() as conn:
        for chunk in ler_votacao_em_chunks(caminho_arquivo, tamanho_chunk=150_000):
            chunk["eleicao_id"] = eleicao_id
            carregar_lote_votacao(conn, chunk)
            total_processado += len(chunk)
            await atualizar_progresso_redis(job_id, total_processado)

    with get_connection() as conn_refresh:
        with conn_refresh.cursor() as cur:
            cur.execute("refresh materialized view concurrently public.mv_resultado_candidato_municipio;")
            cur.execute("refresh materialized view concurrently public.mv_resultado_candidato_local;")
            cur.execute("refresh materialized view concurrently public.mv_resultado_candidato_uf;")

    await atualizar_progresso_redis(job_id, total_processado, status="concluido")
```

A lógica interna de `ler_votacao_em_chunks`, `tratar_nulos_e_tipos` e `carregar_lote_votacao` (parsing com `pandas`, tratamento de nulos conforme os códigos padrão do TSE, `COPY` para staging table seguido de `INSERT ... ON CONFLICT DO UPDATE`) é **idêntica em conteúdo técnico** à detalhada na v1.0 deste documento — a única alteração é a injeção do `eleicao_id` como parâmetro de contexto em cada chunk processado, e a mudança do ponto de disparo (de `if __name__ == "__main__"` para um handler de fila).

### 3.6 Interface Administrativa Mínima

O backoffice expõe também uma interface web simples (React + Vite, aplicação separada do dashboard cliente, ou uma rota protegida `/admin` dentro do mesmo projeto React com checagem de `papel = 'admin'`) contendo:
- Formulário de criação de novo ciclo eleitoral (`eleicao`).
- Formulário de upload de arquivo, com seleção do ciclo eleitoral e tipo de arquivo.
- Lista de importações com status em tempo real (polling do endpoint `/status` a cada 3 segundos, ou Supabase Realtime assinando a tabela `log_importacoes`).
- Botão de reprocessamento para jobs com falha.

Essa interface é acessível de qualquer navegador, em qualquer lugar, exigindo apenas login (Google OAuth) e papel administrativo — atendendo diretamente ao requisito de mobilidade do administrador.

### 3.7 Ordem de Dependência da Carga (Atualizada)

1. `eleicao` — criação do registro do ciclo eleitoral que será importado (novo primeiro passo obrigatório).
2. `uf` — seed estático, 27 registros, versionado em migração SQL.
3. `municipio` → depende de `uf`.
4. `zona_eleitoral` → depende de `municipio`.
5. `local_votacao` → depende de `zona_eleitoral` e de `eleicao`.
6. `secao_eleitoral` → depende de `local_votacao` e de `eleicao`.
7. `candidatos` → depende de `uf`, `municipio` e `eleicao`.
8. `votacao_secao` → depende de `candidatos` e `secao_eleitoral`.
9. `eleitorado_secao` → depende de `secao_eleitoral` e de `eleicao`.
10. `refresh materialized view` das três views analíticas.

---

## 4. ESPECIFICAÇÃO DE TELAS DA DASHBOARD DO CLIENTE

### 4.1 Stack do Front-end (Inalterada)

```
React 18 + Vite + TypeScript
├── @supabase/supabase-js   → conexão direta ao Supabase (Anon Key + RLS + Auth com Google, sem backend intermediário)
├── @tanstack/react-query    → cache, revalidação e estado assíncrono das queries Supabase
├── tailwindcss + shadcn/ui   → design system
├── recharts                  → gráficos
├── react-leaflet / mapbox-gl  → mapas coropléticos e marcadores por local de votação/seção
├── react-router-dom            → roteamento
└── zustand                     → estado global leve (eleição/ano selecionado, filtros geográficos ativos, usuário logado)
```

### 4.2 Tela 0 — Login (Nova)

**Rota:** `/login`

- Botão único de destaque: **"Entrar com Google"**, acionando `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Campo alternativo de e-mail/senha (contingência), recolhido por padrão em um `Accordion`/link "usar e-mail e senha".
- Após primeiro login bem-sucedido de um novo usuário, redirecionamento para tela de **"Aguardando liberação de acesso"** caso ainda não exista registro correspondente em `usuarios_permissoes` (fluxo de onboarding detalhado na Seção 5.3).

### 4.3 Tela 1 — Seletor de Eleição (Nova, primeiro filtro do funil)

**Rota:** `/dashboard` (redireciona para seleção antes de qualquer visualização)

- Grade de cards (Shadcn `Card`), um por ciclo eleitoral disponível **dentro do escopo liberado ao usuário**, exibindo ano, tipo (Geral/Municipal) e turno.
- Ao selecionar um ciclo, o `eleicao_id` é fixado no estado global (`zustand`) e passa a compor todos os filtros das telas seguintes — nenhuma query subsequente ao Supabase é disparada sem esse contexto definido.
- Um seletor secundário, sempre visível no cabeçalho após a escolha inicial, permite trocar de ciclo eleitoral sem sair da navegação geográfica atual (preserva UF/Município selecionados quando o novo ciclo também os contempla).

### 4.4 Tela 2 — Visão Geral do Estado (Dashboard Macro)

**Rota:** `/dashboard/:eleicaoId/:uf`

Idêntica em objetivo à v1.0 (KPIs, mapa coroplético por município, ranking de candidatos, comparativo de turnos), agora filtrada obrigatoriamente por `eleicaoId`, consumindo `mv_resultado_candidato_uf` e `mv_resultado_candidato_municipio`.

### 4.5 Tela 3 — Detalhamento por Município e Zona Eleitoral

**Rota:** `/dashboard/:eleicaoId/:uf/municipio/:codigoIbge`

Idêntica em estrutura à v1.0, com a tabela de Zonas Eleitorais agora funcionando também como **ponto de entrada direto para a Visão por Zona** (Seção 4.6), e não apenas como listagem informativa.

### 4.6 Tela 4 — Visão Micro: Zona, Local de Votação e Seção Eleitoral (Revisada)

**Rotas:**
- `/dashboard/:eleicaoId/:uf/municipio/:codigoIbge/zona/:zonaId` — visão consolidada da zona.
- `/dashboard/:eleicaoId/:uf/municipio/:codigoIbge/zona/:zonaId/local/:localVotacaoId` — visão do local de votação específico, com todas as suas seções agrupadas.
- `/dashboard/:eleicaoId/:uf/municipio/:codigoIbge/zona/:zonaId/secao/:secaoId` — detalhe de uma seção individual.

**Objetivo:** a tela mais estratégica do produto, agora com **três níveis de agregação navegáveis e um seletor de nível explícito** (Shadcn `Tabs`: "Por Zona" | "Por Local de Votação" | "Por Seção"), respondendo diretamente à necessidade de apurar currais eleitorais tanto no nível fino quanto no nível de bairro/prédio.

**Componentes comuns aos três níveis:**
- **Busca por nome do local ou endereço** (Shadcn `Combobox` com autocomplete, consultando `local_votacao.nome_local` e `local_votacao.endereco` via índice `gin_trgm_ops`), permitindo ao usuário pular direto para "Escola Municipal Tal" ou "Rua X, 123" sem precisar navegar hierarquicamente por zona.
- **Mapa de marcadores** (react-leaflet `Marker` + `Cluster`): no nível "Local de Votação", cada marcador representa um prédio único (agregando suas seções); no nível "Seção", os marcadores herdam a coordenada do local de votação pai, mas o clique abre o detalhe da seção específica; no nível "Zona", o mapa exibe um polígono aproximado ou o centróide das seções da zona. Cor do marcador segue a mesma lógica de dominância (verde = curral consolidado, amarelo = disputado, vermelho = território adverso), agora calculada pela view correspondente ao nível ativo (`vw_dominancia_secao`, `vw_dominancia_local` ou `vw_dominancia_zona`).
- **Painel "Currais Eleitorais"**: lista ordenada por `percentual_dominancia` da view ativa, exibindo nome do local/endereço (ou número da zona/seção) e votos absolutos.
- **Painel "Territórios de Oportunidade"**: mesma lógica da v1.0, aplicada ao nível de agregação selecionado.
- **Tabela detalhada** (Shadcn `Table`): colunas adaptadas ao nível ativo — no nível Local de Votação, inclui explicitamente as colunas **Nome do Local** e **Endereço**; no nível Seção, inclui **Nº da Seção** e herda nome/endereço do local pai (via `local_votacao_id`) em coluna de contexto, sem duplicar a responsabilidade de armazenamento (que pertence exclusivamente a `local_votacao`, conforme corrigido na modelagem da Seção 2.4).
- **Modal de detalhe** (Shadcn `Sheet`): ao clicar em uma seção ou local, exibe o resultado completo de todos os candidatos do cargo selecionado naquele recorte, em gráfico de barras.

### 4.7 Tela 5 — Comparativo Histórico Entre Ciclos Eleitorais (Nova)

**Rota:** `/dashboard/comparativo?territorio=:tipo::id&candidatos=:sqCandidato1,:sqCandidato2`

**Objetivo:** explorar a capacidade multieleitoral do produto — comparar a performance de um candidato, partido ou território específico (Zona, Local de Votação ou Município) **entre diferentes ciclos eleitorais já importados**, útil para avaliar crescimento/queda de base eleitoral ao longo do tempo antes de planejar 2026, 2030 etc.

**Componentes:**
- Seletor múltiplo de ciclos eleitorais a comparar (Shadcn `MultiSelect`), restrito aos ciclos dentro do escopo liberado ao usuário.
- Seletor de território fixo (o mesmo Município/Zona/Local é comparado através dos anos) e seletor de candidato ou partido de referência.
- **Gráfico de série temporal** (Recharts `LineChart`), eixo X = ano do pleito, eixo Y = total de votos ou percentual de dominância no território.
- Tabela de variação percentual entre ciclos consecutivos.

**Fonte de dados:** consulta agregada em `votacao_secao` (ou nas materialized views, quando o filtro coincidir com sua granularidade) com `group by eleicao_id`, ordenada por `eleicao.ano`.

### 4.8 Tela 6 — Perfil do Candidato

**Rota:** `/dashboard/:eleicaoId/:uf/candidato/:sqCandidato`

Idêntica à v1.0, com link direto para a Tela de Comparativo Histórico (4.7) pré-filtrada pelo candidato, quando este concorreu em mais de um ciclo já importado (correlação feita por nome/CPF quando disponível no leiaute do TSE, com fallback manual de vínculo administrativo em casos ambíguos).

### 4.9 Requisito Obrigatório de Responsividade (Mantido da v1.0)

Mantido integralmente conforme especificado na v1.0 — breakpoints Tailwind (`base` / `sm`-`md` / `lg`+), hook `useMediaQuery`, componentes duais desktop/mobile, e recálculo de `fitBounds` do mapa via `ResizeObserver`. A adição do seletor de nível de agregação (Zona/Local/Seção) na Tela 4 segue o mesmo padrão: em mobile, os `Tabs` de nível se tornam um `Select` dropdown para economizar espaço horizontal.

---

## 5. SEGURANÇA, MULTIUSUÁRIO E POLÍTICAS RLS (SUPABASE)

### 5.1 Modelo de Chaves e Separação de Responsabilidade (Atualizado)

| Componente | Chave/Mecanismo | RLS aplicado? | Onde roda |
|---|---|---|---|
| Backoffice (serviço web Python/FastAPI) | `SUPABASE_SERVICE_ROLE_KEY` (para escrita em lote) + validação de JWT de admin (para autenticar quem chama a API) | RLS **bypassado** pela Service Role apenas nas operações de escrita; leitura de checagem de papel usa a mesma conexão privilegiada | Servidor próprio (container web + worker), hospedado em nuvem, acessível remotamente apenas por administradores autenticados |
| App Cliente (Dashboard React) | `SUPABASE_ANON_KEY` + sessão de usuário via Supabase Auth (Google OAuth) | **Sim, obrigatoriamente** | Navegador do usuário final |

A diferença central em relação à v1.0 é que o backoffice, embora agora seja um serviço web acessível remotamente, **nunca expõe a `Service Role Key` ao navegador do administrador** — ela permanece exclusivamente no servidor (variável de ambiente do container). O que o administrador autentica no navegador é sua própria sessão de usuário (JWT padrão de usuário, via Google), e é esse JWT que o middleware do backoffice valida antes de, **no lado do servidor**, usar a Service Role Key para executar a escrita em lote. Em nenhum momento a chave privilegiada trafega até o cliente.

### 5.2 Autenticação Multiusuário via Conta Google

```sql
-- ============================================================
-- TABELA: usuarios_perfil — espelha auth.users com dados de exibição
-- Populada automaticamente via trigger no primeiro login.
-- ============================================================
create table public.usuarios_perfil (
    user_id       uuid         primary key references auth.users(id) on delete cascade,
    email          text        not null,
    nome_exibicao   text,
    avatar_url       text,
    criado_em        timestamptz not null default now()
);

alter table public.usuarios_perfil enable row level security;

create policy "usuario_le_proprio_perfil"
    on public.usuarios_perfil for select to authenticated
    using (user_id = auth.uid());

-- Trigger que popula usuarios_perfil automaticamente a cada novo login via Google
create function public.handle_novo_usuario()
returns trigger as $$
begin
    insert into public.usuarios_perfil (user_id, email, nome_exibicao, avatar_url)
    values (
        new.id, new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_novo_usuario();
```

**Configuração no painel do Supabase (Authentication → Providers → Google):** requer o cadastro de um projeto no Google Cloud Console, geração de `Client ID` e `Client Secret` OAuth 2.0, e registro das URLs de redirecionamento autorizadas (`https://<projeto>.supabase.co/auth/v1/callback`, além das URLs de desenvolvimento e produção do próprio app React). O front-end apenas invoca `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<url-do-dashboard>' } })` — todo o fluxo de troca de código OAuth por sessão é gerenciado pelo Supabase Auth.

### 5.3 Fluxo de Onboarding e Concessão de Escopo

O login via Google é **self-service** (qualquer pessoa com conta Google pode autenticar-se), mas o **acesso aos dados não é liberado automaticamente** — isso é uma decisão deliberada de controle comercial, já que o produto é vendido por escopo geográfico/eleitoral contratado:

1. Usuário faz login via Google pela primeira vez → trigger cria `usuarios_perfil`, mas nenhum registro correspondente existe ainda em `usuarios_permissoes`.
2. O app cliente, ao carregar o dashboard, verifica se existe ao menos uma linha em `usuarios_permissoes` para `auth.uid()`. Caso não exista, redireciona para a tela **"Acesso Pendente de Liberação"**, exibindo instrução de contato comercial.
3. Um administrador, autenticado no backoffice web, usa o endpoint `POST /api/usuarios/{user_id}/permissoes` (protegido por `exigir_admin`) para conceder o escopo contratado (UF, opcionalmente ciclos eleitorais específicos, papel).
4. Na próxima sessão (ou via Supabase Realtime assinando mudanças em `usuarios_permissoes`), o cliente passa a enxergar o dashboard normalmente.

### 5.4 Row Level Security — Tabelas de Permissão e Dados

```sql
create table public.usuarios_permissoes (
    id          bigint      generated always as identity primary key,
    user_id     uuid        not null references auth.users(id) on delete cascade,
    sigla_uf    char(2)     references public.uf(sigla_uf), -- null = acesso a todas as UFs liberadas por papel admin
    eleicao_id  bigint      references public.eleicao(id),  -- null = acesso a todos os ciclos dentro da UF liberada
    papel       text        not null default 'cliente' check (papel in ('cliente','admin')),
    concedido_em timestamptz not null default now(),
    concedido_por uuid       references auth.users(id),
    unique (user_id, sigla_uf, eleicao_id)
);

alter table public.usuarios_permissoes enable row level security;

create policy "usuario_le_apenas_suas_permissoes"
    on public.usuarios_permissoes for select to authenticated
    using (user_id = auth.uid());

-- Habilita RLS em todas as tabelas de fato e dimensão
alter table public.eleicao enable row level security;
alter table public.uf enable row level security;
alter table public.municipio enable row level security;
alter table public.zona_eleitoral enable row level security;
alter table public.local_votacao enable row level security;
alter table public.secao_eleitoral enable row level security;
alter table public.candidatos enable row level security;
alter table public.votacao_secao enable row level security;
alter table public.eleitorado_secao enable row level security;

-- Ciclos eleitorais são visíveis integralmente (apenas metadados, sem dado sensível de escopo)
create policy "leitura_eleicoes" on public.eleicao for select to authenticated using (true);

-- Política de leitura restrita por UF E por ciclo eleitoral autorizados
create policy "leitura_votacao_restrita" on public.votacao_secao
    for select to authenticated
    using (
        exists (
            select 1 from public.usuarios_permissoes up
            where up.user_id = auth.uid()
              and (up.sigla_uf is null or up.sigla_uf = votacao_secao.sigla_uf)
              and (up.eleicao_id is null or up.eleicao_id = votacao_secao.eleicao_id)
        )
    );

-- Política análoga replicada para candidatos, eleitorado_secao, secao_eleitoral,
-- local_votacao e zona_eleitoral, sempre casando sigla_uf e, quando aplicável, eleicao_id.

-- Ausência de qualquer política de INSERT/UPDATE/DELETE para 'authenticated'
-- mantém a escrita bloqueada por padrão para todo usuário que não seja Service Role.
```

Essa política, com dupla condição opcional (`up.sigla_uf is null` / `up.eleicao_id is null`), permite ao administrador conceder tanto escopos amplos (um usuário interno da consultoria que acompanha várias UFs) quanto escopos estritos (um candidato que só deve ver seu próprio estado e apenas os ciclos eleitorais contratados) — sem exigir dois modelos de dados diferentes.

### 5.5 Isolamento e Auditoria do Backoffice (Atualizado para Serviço Web)

- **Nenhum usuário recebe o papel `service_role` do Postgres** — esse papel é exclusivo da variável de ambiente do servidor do backoffice, nunca atribuído a uma conta de login humano no Supabase Auth.
- **Toda ação administrativa é auditada**, agora incluindo o `admin_id` (extraído do JWT validado) em cada linha de log, permitindo rastrear qual administrador disparou qual importação, de qual origem:

```sql
create table public.log_importacoes (
    id                 bigint generated always as identity primary key,
    admin_id            uuid       not null references auth.users(id),
    eleicao_id           bigint    not null references public.eleicao(id),
    tipo_arquivo         text      not null,
    nome_arquivo         text      not null,
    linhas_processadas    integer  not null default 0,
    linhas_descartadas     integer not null default 0,
    ip_origem              inet,
    iniciado_em            timestamptz not null,
    finalizado_em           timestamptz,
    status                  text    not null check (status in ('sucesso','falha','em_andamento')),
    detalhes_erro           text
);

alter table public.log_importacoes enable row level security;
-- Nenhuma política para 'authenticated' → tabela invisível ao app cliente,
-- acessível apenas via Service Role Key (backoffice) ou Supabase Studio (admin).
```

- **Rate limiting e proteção de borda**: como o backoffice agora é publicamente roteável na internet (ainda que protegido por autenticação), recomenda-se colocar um proxy reverso/WAF (ex.: Cloudflare) na frente do serviço, com rate limiting por IP nos endpoints de upload e login, mitigando tentativas de força bruta ou abuso de banda.
- **Restrição de rede opcional para o banco**: a conexão do backoffice ao Postgres (via Session Pooler) pode ser adicionalmente restrita por Network Restrictions do Supabase, permitindo apenas o(s) IP(s) fixo(s) do servidor do backoffice — o app cliente, por usar a Anon Key via biblioteca JS, não é afetado por essa restrição de rede, pois se conecta via API REST/Realtime do Supabase, não via socket direto do Postgres.

### 5.6 Resumo do Modelo de Ameaças Mitigado (Atualizado)

| Ameaça | Mitigação |
|---|---|
| Cliente comum tenta escrever/alterar dados eleitorais via Anon Key no navegador | Ausência de políticas de escrita para `authenticated`; RLS nega por padrão |
| Cliente autorizado para a UF "MG" tenta visualizar dados de "SP" ou de um ciclo eleitoral não contratado | Política de RLS com dupla condição (`sigla_uf`, `eleicao_id`) sobre `usuarios_permissoes` |
| Usuário autenticado via Google, mas ainda sem permissões concedidas, tenta acessar dados | Ausência de linha em `usuarios_permissoes` resulta em `exists()` falso — nenhuma linha retornada; app redireciona para tela de acesso pendente |
| Usuário comum tenta acessar rotas do backoffice web (agora públicas na internet) | Middleware `exigir_admin` valida JWT e papel antes de qualquer operação; `403 Forbidden` para não administradores |
| Vazamento da Service Role Key | Chave nunca sai do servidor do backoffice; nunca é embutida em bundle React/Vite nem transmitida ao navegador do admin |
| Força bruta / abuso de banda contra o backoffice agora exposto publicamente | Proxy reverso com rate limiting (Cloudflare ou equivalente) na borda, adicional ao rate limiting nativo do Supabase Auth |
| Usuário não autenticado acessando dados via URL direta da API Supabase | Todas as políticas de leitura exigem role `authenticated`, obrigando login prévio via Google ou e-mail/senha |

---

## 6. CONSIDERAÇÕES FINAIS DE ARQUITETURA (v2.0)

As quatro revisões incorporadas nesta versão são estruturalmente coerentes entre si: a generalização multieleitoral (Seção 1.2/2.3) só é operacionalmente viável porque o backoffice deixou de depender de execução manual local e passou a ser um serviço web (Seção 3) que qualquer administrador pode acionar remotamente sempre que um novo ciclo precisar ser importado; o modelo multiusuário com Google OAuth (Seção 5.2-5.3) é o que torna seguro expor esse backoffice na internet, já que a superfície de ataque adicional é compensada por autenticação federada robusta e checagem explícita de papel; e a separação entre Local de Votação e Seção Eleitoral (Seção 2.4) não é apenas uma correção de modelagem, mas a base que viabiliza a análise de currais eleitorais em três granularidades simultâneas (Zona, Local, Seção) exigida pela Seção 4.6, sem duplicação de dado geográfico e sem perda de performance nas consultas do dashboard.

---

## 7. ADENDO — ARQUITETURA REALMENTE IMPLEMENTADA (DIVERGÊNCIAS EM RELAÇÃO A ESTE PRD)

> **Nota de manutenção:** as Seções 1 a 6 acima são o **PRD original (v2.0)** e são mantidas intactas como registro do requisito de origem e das intenções de produto. Esta Seção 7 é um **adendo vivo**, atualizado à medida que decisões técnicas reais divergiram do PRD durante a implementação — por restrição de custo, por descoberta técnica em campo, ou por escolha deliberada do time. Onde este adendo contradiz uma seção anterior, **o adendo reflete o que está de fato em produção**; o texto original permanece como referência histórica do requisito, não como documentação do estado atual.

### 7.1 Resumo das Divergências

| Tema | PRD Original (Seções 1-6) | Implementação Real |
|---|---|---|
| Hospedagem do banco | Supabase gerenciado (Postgres + Auth + Storage) único | **Split**: Supabase (free tier) só para Auth; Postgres autohospedado numa VPS própria |
| Camada de API de dados | `@supabase/supabase-js` direto ao Postgres do Supabase | **PostgREST autohospedado** na mesma VPS, na frente de um Postgres próprio |
| Backoffice/importador | Serviço web FastAPI + fila Redis/`arq`, hospedado em nuvem, acessível remotamente | **Script Python local** (`importador/`), rodado manualmente na máquina de desenvolvimento, lendo CSVs do TSE do disco local |
| `auth.users` / `auth.uid()` | Nativo do Supabase, disponível diretamente no Postgres de dados | **Recriado manualmente**: schema `auth` próprio no Postgres de dados, com `auth.uid()`/`auth.role()` lendo claims do JWT repassado pelo PostgREST |
| RLS em materialized views | Não discutido no PRD (assume RLS nativo em tudo) | **Não suportado pelo Postgres** para mat views — padrão próprio de REVOKE + view wrapper com `WHERE EXISTS` (Seção 7.5) |
| Login Google | Especificado desde a V1 (Seção 4.2, 5.2) | **Ainda não configurado** — pendente (passo 3 do roadmap de produção) |
| Escopo de dados importado | "Agnóstico a ciclo eleitoral", qualquer UF | Só **2022, 1º turno**, UFs **PR, SC, RS** (PR completo e testado; SC/RS pendentes de importação) |
| Ambiente de produção | Não especificado (assume nuvem gerenciada) | **VPS própria (Locaweb, Ubuntu 24.04)**, Nginx + Let's Encrypt, systemd, deploy via Git |
| Fluxo de deploy | Não especificado | `dev` → `main` via **Pull Request obrigatório** (GitHub Ruleset), repositório público |
| Provedor de mapa | `react-leaflet / mapbox-gl`, sem detalhar tile provider | **OpenStreetMap público** (tiles lentos, avaliação de MapTiler/Stadia Maps pendente) |

### 7.2 Motivação da Divergência Central: Split Auth/Dados

O Supabase gerenciado foi abandonado como banco de dados de produção após o projeto esbarrar no limite de armazenamento do free tier (500MB), que tornou o projeto somente-leitura. Migrar para um plano pago do Supabase foi descartado por custo. A decisão adotada foi:

- **Manter o Supabase (free tier) exclusivamente como provedor de identidade** (Auth/GoTrue) — é o único componente do Supabase ainda em uso, responsável por emitir os JWTs de sessão (login Google e e-mail/senha, conforme Seção 5.2 original).
- **Autohospedar o Postgres de dados** numa VPS própria (Locaweb), eliminando o limite de armazenamento pago por GB do Supabase.
- **Autohospedar o PostgREST** na mesma VPS, na frente desse Postgres, reproduzindo a camada de API REST + RLS que o app cliente (Seção 4.1) espera — o front-end continua fazendo requisições REST/RLS-aware, só que contra um endpoint próprio (`/api`) em vez do endpoint gerenciado do Supabase.

Como o Postgres de dados nunca teve uma tabela `auth.users` real (essa tabela só existe no projeto Supabase, que agora só guarda identidade, não dados), foi necessário recriar manualmente, via migração, um schema `auth` mínimo no banco de dados:

```sql
create schema auth;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator noinherit login password '<gerada via openssl rand -hex 24>';
grant anon, authenticated, service_role to authenticator;

create function auth.uid() returns uuid as $$
    select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ language sql stable;

create function auth.role() returns text as $$
    select nullif(current_setting('request.jwt.claims', true)::json->>'role', '');
$$ language sql stable;
```

Essa migração (`20260811225117_auth_roles_and_functions.sql`) precisa rodar **antes** de qualquer migração que crie política de RLS — é uma dependência de ordem que não existe no modelo original do PRD (onde `auth.users`/`auth.uid()` já vêm prontos do Supabase) e que já causou um bug real de ordenação, corrigido durante o desenvolvimento.

Consequência prática para a Seção 5.1 (tabela de chaves): a linha do "App Cliente" continua válida em espírito (RLS obrigatório, chave não-privilegiada no navegador), mas a "Anon Key" do Supabase foi substituída pelo par JWT do Supabase Auth + role `anon`/`authenticated` do Postgres próprio, validados pelo PostgREST via JWKS (endpoint público `https://<projeto>.supabase.co/auth/v1/.well-known/jwks.json`, algoritmo ES256) em vez do segredo HS256 legado.

### 7.3 Backoffice/Importador: Script Local, Não Serviço Web

A arquitetura de backoffice como serviço FastAPI + fila `arq`/Redis (Seção 3 completa do PRD original) **não foi implementada**. Em seu lugar, a Etapa 2 do projeto entregou um **importador Python local** (`importador/`), executado manualmente pelo desenvolvedor, que:

- Lê os CSVs do TSE diretamente do disco local (`arquivostse/`, fora do controle de versão), sem upload via HTTP.
- Usa `psycopg[binary]` (psycopg3) em vez de `psycopg2-binary` — `psycopg2` não tem wheel pré-compilada para Python 3.14, versão usada no ambiente de desenvolvimento.
- Processa em chunks e usa `COPY`/staging table, conforme a lógica descrita na Seção 3.5 do PRD original — essa parte da lógica *foi* reaproveitada como projetada.
- Não tem autenticação, fila assíncrona, nem interface administrativa web — é invocado via `main.py` na linha de comando.

Não há, portanto, endpoint `/api/importacoes/upload` nem middleware `exigir_admin` (Seção 3.3-3.4) em produção. Reimportar ou importar um novo ciclo eleitoral hoje exige acesso à máquina de desenvolvimento e execução manual do script — não é uma operação remota como o PRD original previa. Essa é uma lacuna conhecida em relação ao requisito original, não uma decisão definitiva; fica registrada aqui para retomada futura caso o produto avance para operação com múltiplos administradores remotos.

### 7.4 Row Level Security em Materialized Views: Padrão REVOKE + View Wrapper

O PRD original (Seção 2.7 e 5.4) assume que RLS se aplica uniformemente a qualquer objeto do banco. Na prática, o Postgres **não permite `ENABLE ROW LEVEL SECURITY` em materialized views** — apenas em tabelas e views comuns. Isso afeta diretamente as materialized views de resultado (`mv_resultado_candidato_{municipio,local,uf}`, Seção 2.7) e a nova `mv_dominancia_municipio` (Seção 7.6), que concentram dados de todas as UFs/eleições e por isso não podem ser expostas cruas para os roles `anon`/`authenticated`.

Foi descoberta ainda uma segunda armadilha: mesmo criando uma **view comum** por cima da materialized view com a checagem de permissão manual, se essa view for dona do role `postgres` (que tem `BYPASSRLS`), a checagem é ignorada — RLS de uma view só é avaliado com os privilégios do dono da view, não de quem a consulta, a menos que a view seja marcada `security_invoker = true`. E aqui mora a segunda pegadinha, oposta e igualmente crítica: se essa mesma view wrapper for marcada `security_invoker = true`, ela deixa de conseguir ler a materialized view por baixo (que teve o acesso direto revogado de `anon`/`authenticated`), porque a semântica de "invoker" se aplica à consulta inteira, não só à cláusula de filtro.

O padrão adotado, replicado em toda materialized view sensível, é:

```sql
-- 1. Revoga acesso direto à materialized view dos roles públicos
revoke select on public.mv_exemplo from anon, authenticated;

-- 2. Cria uma view comum, SEM security_invoker, que roda com o
--    privilégio do dono (consegue ler a mat view revogada) mas
--    replica manualmente a mesma checagem de usuarios_permissoes
--    que uma política de RLS faria — auth.uid() sempre lê o JWT
--    da requisição atual, independente de qual role executa a query.
create view public.vw_exemplo as
select mv.*
from public.mv_exemplo mv
where exists (
    select 1 from public.usuarios_permissoes up
    where up.user_id = auth.uid()
      and (up.sigla_uf is null or up.sigla_uf = mv.sigla_uf)
      and (up.eleicao_id is null or up.eleicao_id = mv.eleicao_id)
);
```

O front-end e o PostgREST consomem exclusivamente as views `vw_*`, nunca as `mv_*` diretamente (que retornam `PGRST205`/404 para `anon`/`authenticated` por design).

### 7.5 Infraestrutura de Produção

Diferente do "não especificado" do PRD original, o ambiente de produção efetivo é:

- **VPS Locaweb**, Ubuntu 24.04 LTS, provisionada via cloud-init, acesso exclusivamente por chave SSH dedicada (sem senha).
- **PostgreSQL 17** (repositório oficial PGDG), banco `votoapurado`, populado via `pg_dump`/`restore` a partir do ambiente local de desenvolvimento.
- **PostgREST** autohospedado como serviço `systemd` (`postgrest.service`), rodando como usuário de sistema dedicado (não-root), `ProtectSystem=strict`, escutando em `127.0.0.1:3001` (não exposto diretamente à internet).
- **Nginx** como reverse proxy: serve o build estático da dashboard React (`dashboard/dist`) na raiz do domínio, e faz proxy de `/api/` → `http://127.0.0.1:3001/`.
- **HTTPS via Let's Encrypt/certbot**, domínio `votoapurado.flygestao.com.br` (subdomínio de um domínio corporativo já existente do usuário, escolhido como solução provisória de baixo custo — trocável no futuro sem impacto estrutural).
- **`ufw` + `fail2ban`** para hardening básico de borda.

O ambiente local de desenvolvimento do usuário é tratado como DEV; a VPS Locaweb é PRODUÇÃO. Não há, até o momento, um ambiente de staging intermediário.

### 7.6 Fluxo de Deploy e Controle de Mudanças

Não especificado no PRD original. O fluxo adotado:

- Repositório Git **público** no GitHub (escolha deliberada — contas pessoais não suportam branch protection em repositório privado sem plano pago).
- Branch `dev` para trabalho corrente; branch `main` como espelho exato de produção.
- **GitHub Ruleset** na branch `main` exigindo Pull Request antes de qualquer merge (sem push direto), com enforcement ativado.
- Migrações SQL (`supabase/migrations/`) são a fonte da verdade do schema, aplicadas manualmente tanto no Postgres local quanto no da VPS (via `scp` + `psql -f`) até que este processo seja automatizado.

### 7.7 Correções de Performance Pós-Lançamento (Não Previstas no PRD)

Após a validação inicial de produção, três gargalos de performance foram identificados e corrigidos nas views de dominância da Seção 2.8/4.6 — o PRD original não antecipa índices específicos para essas views:

- `idx_votacao_cargo_eleicao_uf` — índice líder por `cargo` em `votacao_secao`, usado pelas 4 views de dominância e pelo mapa coroplético (eliminou Seq Scan de ~900 mil linhas por partição; consultas de ~1,8-3s para Index Only Scan).
- `mv_dominancia_municipio` — a `vw_dominancia_municipio` (Seção 2.8, adicionada como extensão do PRD para cobrir o nível Município, ausente na especificação original que só cobria Seção/Local/Zona) foi convertida em materialized view, seguindo o mesmo padrão de segurança da Seção 7.5, já que o resultado eleitoral não muda após a importação.
- `idx_votacao_secao_id` — índice líder por `secao_id` isolado, necessário porque `vw_dominancia_secao` filtra apenas por seção (sem `cargo`), e nenhum índice composto existente tinha `secao_id` como coluna líder (13,4s → ~2ms).

### 7.8 Stack Front-end: Detalhe de Implementação

A Seção 4.1 do PRD original lista `shadcn/ui` sem especificar a biblioteca de primitivos por baixo. A versão do `shadcn/ui` usada no projeto é construída sobre **`@base-ui/react`**, não Radix UI (a base histórica do shadcn/ui) — isso muda alguns contratos de API usados no código: `Button` não aceita a prop `asChild` (usa-se `buttonVariants()` diretamente em elementos como `<Link>`), e o callback `onValueChange` de `Select` recebe `(value: string | null, details)` em vez de só `(value: string)`.

### 7.9 Itens do PRD Original Ainda Pendentes

- **Login via Google (Seção 4.2, 5.2):** schema e política de RLS já preparados para múltiplos usuários; o provedor OAuth do Google ainda não foi configurado no projeto Supabase Auth. Passo 3 do roadmap corrente.
- **Backoffice web remoto (Seção 3):** permanece como script local, sem endpoints HTTP nem fila assíncrona — ver Seção 7.3.
- **Importação de SC e RS:** schema e importador já suportam múltiplas UFs (validado com PR); dados de SC/RS ainda não foram carregados, o que limita a Tela de Comparativo Histórico (Seção 4.7) a um recorte parcial.
- **Ciclos eleitorais além de 2022:** nenhum outro ano foi importado ainda, então a Tela de Comparativo Histórico ainda não tem série temporal real para exibir.
- **Provedor de tiles do mapa:** OpenStreetMap público em uso, com lentidão de carregamento observada; avaliação de MapTiler/Stadia Maps como alternativa paga fica para depois do login Google (passo 4 do roadmap).
- **Exportação de relatórios CSV/PDF (Seção 1.5):** não implementada.
