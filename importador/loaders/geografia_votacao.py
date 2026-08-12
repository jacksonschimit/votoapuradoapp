import pandas as pd

from config import ARQUIVOS_TSE_DIR, ANO_ELEICAO, UF_ALVO
from loaders.util import carregar_mapa_municipio_tse_ibge

CSV_PATH = ARQUIVOS_TSE_DIR / "votacao_secao_2022_PR" / f"votacao_secao_{ANO_ELEICAO}_{UF_ALVO}.csv"

USECOLS = [
    "SG_UF",
    "CD_MUNICIPIO",
    "NR_ZONA",
    "NR_SECAO",
    "NR_LOCAL_VOTACAO",
    "NM_LOCAL_VOTACAO",
    "DS_LOCAL_VOTACAO_ENDERECO",
]

CHUNKSIZE = 200_000


def _ler_chunks():
    return pd.read_csv(
        CSV_PATH,
        sep=";",
        encoding="latin-1",
        usecols=USECOLS,
        dtype=str,
        chunksize=CHUNKSIZE,
    )


def extrair_e_carregar_geografia(conn, eleicao_id: int) -> dict:
    mapa_tse_ibge = carregar_mapa_municipio_tse_ibge()

    zonas = {}  # (numero_zona, codigo_municipio_ibge) -> None
    locais = {}  # (codigo_local_tse, numero_zona, codigo_municipio_ibge) -> (nome, endereco)
    secoes = {}  # (numero_secao, numero_zona, codigo_municipio_ibge) -> codigo_local_tse

    for chunk in _ler_chunks():
        for row in chunk.itertuples(index=False):
            cod_municipio_ibge = mapa_tse_ibge[int(row.CD_MUNICIPIO)]
            numero_zona = int(row.NR_ZONA)
            numero_secao = int(row.NR_SECAO)
            codigo_local_tse = int(row.NR_LOCAL_VOTACAO)

            zonas[(numero_zona, cod_municipio_ibge)] = None
            locais.setdefault(
                (codigo_local_tse, numero_zona, cod_municipio_ibge),
                (row.NM_LOCAL_VOTACAO, row.DS_LOCAL_VOTACAO_ENDERECO),
            )
            secoes.setdefault(
                (numero_secao, numero_zona, cod_municipio_ibge), codigo_local_tse
            )

    sigla_uf = UF_ALVO

    with conn.cursor() as cur:
        cur.executemany(
            """
            insert into public.zona_eleitoral (numero_zona, codigo_municipio, sigla_uf)
            values (%s, %s, %s)
            on conflict (numero_zona, codigo_municipio) do nothing
            """,
            [(nz, cm, sigla_uf) for (nz, cm) in zonas],
        )
        cur.execute(
            "select id, numero_zona, codigo_municipio from public.zona_eleitoral where sigla_uf = %s",
            (sigla_uf,),
        )
        zona_map = {(nz, cm): zid for zid, nz, cm in cur.fetchall()}

        cur.executemany(
            """
            insert into public.local_votacao
                (eleicao_id, codigo_local_tse, nome_local, endereco, zona_id, codigo_municipio, sigla_uf)
            values (%s, %s, %s, %s, %s, %s, %s)
            on conflict (eleicao_id, codigo_local_tse, zona_id) do nothing
            """,
            [
                (
                    eleicao_id,
                    clt,
                    nome,
                    endereco,
                    zona_map[(nz, cm)],
                    cm,
                    sigla_uf,
                )
                for (clt, nz, cm), (nome, endereco) in locais.items()
            ],
        )
        cur.execute(
            "select id, codigo_local_tse, zona_id from public.local_votacao where eleicao_id = %s",
            (eleicao_id,),
        )
        local_map = {(clt, zid): lid for lid, clt, zid in cur.fetchall()}

        cur.executemany(
            """
            insert into public.secao_eleitoral
                (eleicao_id, numero_secao, local_votacao_id, zona_id, codigo_municipio, sigla_uf)
            values (%s, %s, %s, %s, %s, %s)
            on conflict (eleicao_id, numero_secao, zona_id) do nothing
            """,
            [
                (
                    eleicao_id,
                    ns,
                    local_map[(clt, zona_map[(nz, cm)])],
                    zona_map[(nz, cm)],
                    cm,
                    sigla_uf,
                )
                for (ns, nz, cm), clt in secoes.items()
            ],
        )
        cur.execute(
            "select id, numero_secao, zona_id from public.secao_eleitoral where eleicao_id = %s",
            (eleicao_id,),
        )
        secao_map = {(ns, zid): sid for sid, ns, zid in cur.fetchall()}

    conn.commit()

    return {
        "mapa_tse_ibge": mapa_tse_ibge,
        "zona_map": zona_map,
        "local_map": local_map,
        "secao_map": secao_map,
        "contagens": {
            "zonas": len(zonas),
            "locais": len(locais),
            "secoes": len(secoes),
        },
    }
