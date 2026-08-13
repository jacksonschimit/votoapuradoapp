import time

import pandas as pd

from config import ARQUIVOS_TSE_DIR, ANO_ELEICAO, UF_ALVO, TURNO, CARGOS_ALVO, CARGOS_NACIONAIS
from db.connection import get_connection

CSV_PATH = ARQUIVOS_TSE_DIR / "votacao_secao_2022_PR" / f"votacao_secao_{ANO_ELEICAO}_{UF_ALVO}.csv"
# Presidente vem só no arquivo nacional (todas as UFs misturadas) —
# filtramos por SG_UF == UF_ALVO ao processar, igual às demais linhas.
CSV_PATH_NACIONAL = ARQUIVOS_TSE_DIR / "votacao_secao_2022_BR" / f"votacao_secao_{ANO_ELEICAO}_BR.csv"

USECOLS = [
    "SG_UF",
    "CD_MUNICIPIO",
    "NR_ZONA",
    "NR_SECAO",
    "NR_LOCAL_VOTACAO",
    "DS_CARGO",
    "QT_VOTOS",
    "SQ_CANDIDATO",
    "NR_TURNO",
]

CHUNKSIZE = 200_000
MAX_TENTATIVAS = 6
ESPERAS_RETRY_SEGUNDOS = [5, 10, 20, 30, 60]


def _espera(tentativa: int) -> int:
    return ESPERAS_RETRY_SEGUNDOS[min(tentativa - 1, len(ESPERAS_RETRY_SEGUNDOS) - 1)]


CREATE_STAGING = """
    create temporary table stg_votacao_secao (
        eleicao_id bigint,
        sq_candidato bigint,
        secao_id bigint,
        local_votacao_id bigint,
        zona_id bigint,
        codigo_municipio integer,
        sigla_uf char(2),
        cargo text,
        qtde_votos integer
    )
"""

COPY_SQL = (
    "copy stg_votacao_secao "
    "(eleicao_id, sq_candidato, secao_id, local_votacao_id, zona_id, codigo_municipio, sigla_uf, cargo, qtde_votos) "
    "from stdin"
)

INSERT_FINAL = """
    insert into public.votacao_secao
        (eleicao_id, sq_candidato, secao_id, local_votacao_id, zona_id, codigo_municipio, sigla_uf, cargo, qtde_votos)
    select eleicao_id, sq_candidato, secao_id, local_votacao_id, zona_id, codigo_municipio, sigla_uf, cargo::cargo_enum, qtde_votos
    from stg_votacao_secao
    on conflict (eleicao_id, sq_candidato, secao_id, sigla_uf) do update set qtde_votos = excluded.qtde_votos
"""


def _fechar_silenciosamente(conn):
    try:
        conn.rollback()
    except Exception:
        pass
    try:
        conn.close()
    except Exception:
        pass


def _preparar_sessao(conn):
    with conn.cursor() as cur:
        cur.execute("set statement_timeout = '10min'")
        cur.execute(CREATE_STAGING)
    conn.commit()


def _garantir_sessao_pronta(conn):
    """Garante uma conexão nova com a staging table pronta, com retry/backoff."""
    for tentativa in range(1, MAX_TENTATIVAS + 1):
        try:
            nova_conn = get_connection()
            _preparar_sessao(nova_conn)
            return nova_conn
        except Exception as exc:
            print(f"   preparar sessão falhou (tentativa {tentativa}): {exc!r}")
            if tentativa >= MAX_TENTATIVAS:
                raise
            time.sleep(_espera(tentativa))


def _processar_chunk(conn, chunk, eleicao_id, mapas, sigla_uf):
    mapa_tse_ibge = mapas["mapa_tse_ibge"]
    zona_map = mapas["zona_map"]
    local_map = mapas["local_map"]
    secao_map = mapas["secao_map"]

    copiadas = 0
    ignoradas = 0

    with conn.cursor() as cur:
        with cur.copy(COPY_SQL) as copy:
            for row in chunk.itertuples(index=False):
                if row.SG_UF.strip().upper() != sigla_uf:
                    # relevante só no arquivo nacional (Presidente), que
                    # traz todas as UFs misturadas.
                    ignoradas += 1
                    continue

                if int(row.NR_TURNO) != TURNO:
                    # relevante só no arquivo nacional: Lula e Bolsonaro
                    # foram ao 2º turno e aparecem nos dois turnos com o
                    # mesmo sq_candidato — sem esse filtro, duas linhas
                    # do mesmo candidato/seção violam o ON CONFLICT.
                    ignoradas += 1
                    continue

                cargo = row.DS_CARGO.strip().upper()
                if cargo not in CARGOS_ALVO:
                    ignoradas += 1
                    continue

                sq_candidato = int(row.SQ_CANDIDATO)
                if sq_candidato <= 0:
                    # branco (-1), nulo (-1) ou legenda (-3) — não são candidatos reais
                    ignoradas += 1
                    continue

                cod_municipio_ibge = mapa_tse_ibge.get(int(row.CD_MUNICIPIO))
                zona_id = zona_map.get((int(row.NR_ZONA), cod_municipio_ibge)) if cod_municipio_ibge else None
                secao_id = secao_map.get((int(row.NR_SECAO), zona_id)) if zona_id else None
                local_votacao_id = local_map.get((int(row.NR_LOCAL_VOTACAO), zona_id)) if zona_id else None

                if secao_id is None or local_votacao_id is None:
                    # linha referencia geografia não vista no arquivo por
                    # UF usado para montar os mapas — não deveria
                    # acontecer, mas não trava a carga por uma linha só.
                    ignoradas += 1
                    continue

                copy.write_row(
                    (
                        eleicao_id,
                        sq_candidato,
                        secao_id,
                        local_votacao_id,
                        zona_id,
                        cod_municipio_ibge,
                        sigla_uf,
                        cargo,
                        int(row.QT_VOTOS),
                    )
                )
                copiadas += 1

        cur.execute(INSERT_FINAL)
        cur.execute("truncate stg_votacao_secao")
    conn.commit()
    return copiadas, ignoradas


def _processar_arquivo(conn, caminho, eleicao_id, mapas, sigla_uf, totais, numero_chunk_inicial):
    numero_chunk = numero_chunk_inicial
    for chunk in pd.read_csv(
        caminho, sep=";", encoding="latin-1", usecols=USECOLS, dtype=str, chunksize=CHUNKSIZE
    ):
        numero_chunk += 1
        totais["lidas"] += len(chunk)
        for tentativa in range(1, MAX_TENTATIVAS + 1):
            try:
                copiadas, ignoradas = _processar_chunk(conn, chunk, eleicao_id, mapas, sigla_uf)
                totais["copiadas"] += copiadas
                totais["ignoradas"] += ignoradas
                break
            except Exception as exc:
                print(f"   chunk {numero_chunk} falhou (tentativa {tentativa}): {exc!r}")
                _fechar_silenciosamente(conn)
                if tentativa >= MAX_TENTATIVAS:
                    raise
                espera = _espera(tentativa)
                print(f"   aguardando {espera}s e reconectando...")
                time.sleep(espera)
                conn = _garantir_sessao_pronta(conn)

        print(f"   chunk {numero_chunk} ({caminho.name}): {totais['lidas']} linhas lidas até agora ({totais['copiadas']} copiadas)")

    return conn, numero_chunk


def carregar_votacao_secao(conn, eleicao_id: int, mapas: dict):
    sigla_uf = UF_ALVO
    totais = {"lidas": 0, "copiadas": 0, "ignoradas": 0}

    _fechar_silenciosamente(conn)
    conn = _garantir_sessao_pronta(conn)

    conn, ultimo_chunk = _processar_arquivo(conn, CSV_PATH, eleicao_id, mapas, sigla_uf, totais, 0)

    if CARGOS_NACIONAIS & CARGOS_ALVO:
        conn, _ = _processar_arquivo(
            conn, CSV_PATH_NACIONAL, eleicao_id, mapas, sigla_uf, totais, ultimo_chunk
        )

    resultado = {
        "linhas_lidas": totais["lidas"],
        "linhas_copiadas_staging": totais["copiadas"],
        "linhas_ignoradas_sem_candidato": totais["ignoradas"],
    }
    return resultado, conn
