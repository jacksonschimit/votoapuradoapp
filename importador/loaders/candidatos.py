import csv

from config import ARQUIVOS_TSE_DIR, ANO_ELEICAO, UF_ALVO, CARGOS_ALVO
from loaders.util import tse_null

CSV_PATH = ARQUIVOS_TSE_DIR / "consulta_cand_2022" / f"consulta_cand_{ANO_ELEICAO}_{UF_ALVO}.csv"

INSERT_SQL = """
    insert into public.candidatos (
        sq_candidato, eleicao_id, nr_candidato, nm_candidato, nm_urna_candidato,
        nm_social_candidato, cargo, sigla_uf, codigo_municipio,
        sigla_partido, nome_partido, numero_partido,
        sigla_coligacao, nome_coligacao,
        situacao_candidatura, situacao_totalizacao,
        genero, grau_instrucao, ocupacao
    ) values (
        %(sq_candidato)s, %(eleicao_id)s, %(nr_candidato)s, %(nm_candidato)s, %(nm_urna_candidato)s,
        %(nm_social_candidato)s, %(cargo)s, %(sigla_uf)s, null,
        %(sigla_partido)s, %(nome_partido)s, %(numero_partido)s,
        %(sigla_coligacao)s, %(nome_coligacao)s,
        %(situacao_candidatura)s, %(situacao_totalizacao)s,
        %(genero)s, %(grau_instrucao)s, %(ocupacao)s
    )
    on conflict (sq_candidato) do update set
        situacao_candidatura = excluded.situacao_candidatura,
        situacao_totalizacao = excluded.situacao_totalizacao
"""


def carregar_candidatos(conn, eleicao_id: int) -> int:
    registros = []
    with open(CSV_PATH, encoding="latin-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            cargo = row["DS_CARGO"].strip().upper()
            if cargo not in CARGOS_ALVO:
                continue
            registros.append(
                {
                    "sq_candidato": int(row["SQ_CANDIDATO"]),
                    "eleicao_id": eleicao_id,
                    "nr_candidato": int(row["NR_CANDIDATO"]),
                    "nm_candidato": row["NM_CANDIDATO"],
                    "nm_urna_candidato": row["NM_URNA_CANDIDATO"],
                    "nm_social_candidato": tse_null(row["NM_SOCIAL_CANDIDATO"]),
                    "cargo": cargo,
                    "sigla_uf": row["SG_UF"],
                    "sigla_partido": row["SG_PARTIDO"],
                    "nome_partido": row["NM_PARTIDO"],
                    "numero_partido": int(row["NR_PARTIDO"]),
                    "sigla_coligacao": tse_null(row["DS_COMPOSICAO_COLIGACAO"]),
                    "nome_coligacao": tse_null(row["NM_COLIGACAO"]),
                    "situacao_candidatura": tse_null(row["DS_SITUACAO_CANDIDATURA"]),
                    "situacao_totalizacao": tse_null(row["DS_SIT_TOT_TURNO"]),
                    "genero": tse_null(row["DS_GENERO"]),
                    "grau_instrucao": tse_null(row["DS_GRAU_INSTRUCAO"]),
                    "ocupacao": tse_null(row["DS_OCUPACAO"]),
                }
            )

    with conn.cursor() as cur:
        cur.executemany(INSERT_SQL, registros)
    conn.commit()
    return len(registros)
