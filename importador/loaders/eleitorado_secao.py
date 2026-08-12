import csv

from config import ARQUIVOS_TSE_DIR, ANO_ELEICAO, UF_ALVO

CSV_PATH = (
    ARQUIVOS_TSE_DIR
    / "detalhe_votacao_secao_2022"
    / f"detalhe_votacao_secao_{ANO_ELEICAO}_{UF_ALVO}.csv"
)

# Aptos/comparecimento/abstenções são idênticos entre os cargos de uma mesma
# seção (mesmo eleitorado, mesmo dia); usamos Governador como cargo de
# referência também para brancos/nulos, por ser a corrida majoritária
# estadual mais representativa.
CARGO_REFERENCIA = "GOVERNADOR"

INSERT_SQL = """
    insert into public.eleitorado_secao
        (secao_id, eleicao_id, qtde_aptos, qtde_comparecimento, qtde_abstencoes,
         qtde_votos_brancos, qtde_votos_nulos)
    values (%s, %s, %s, %s, %s, %s, %s)
    on conflict (secao_id) do update set
        qtde_aptos = excluded.qtde_aptos,
        qtde_comparecimento = excluded.qtde_comparecimento,
        qtde_abstencoes = excluded.qtde_abstencoes,
        qtde_votos_brancos = excluded.qtde_votos_brancos,
        qtde_votos_nulos = excluded.qtde_votos_nulos
"""


def carregar_eleitorado_secao(conn, eleicao_id: int, mapas: dict) -> dict:
    mapa_tse_ibge = mapas["mapa_tse_ibge"]
    zona_map = mapas["zona_map"]
    secao_map = mapas["secao_map"]

    registros = []
    ignoradas_secao_nao_encontrada = 0

    with open(CSV_PATH, encoding="latin-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            if row["DS_CARGO"].strip().upper() != CARGO_REFERENCIA:
                continue

            cod_municipio_ibge = mapa_tse_ibge[int(row["CD_MUNICIPIO"])]
            zona_key = (int(row["NR_ZONA"]), cod_municipio_ibge)
            if zona_key not in zona_map:
                ignoradas_secao_nao_encontrada += 1
                continue
            zona_id = zona_map[zona_key]

            secao_key = (int(row["NR_SECAO"]), zona_id)
            if secao_key not in secao_map:
                ignoradas_secao_nao_encontrada += 1
                continue
            secao_id = secao_map[secao_key]

            registros.append(
                (
                    secao_id,
                    eleicao_id,
                    int(row["QT_APTOS"]),
                    int(row["QT_COMPARECIMENTO"]),
                    int(row["QT_ABSTENCOES"]),
                    int(row["QT_VOTOS_BRANCOS"]),
                    int(row["QT_VOTOS_NULOS"]),
                )
            )

    with conn.cursor() as cur:
        cur.executemany(INSERT_SQL, registros)
    conn.commit()

    return {
        "linhas_inseridas": len(registros),
        "linhas_ignoradas_secao_nao_encontrada": ignoradas_secao_nao_encontrada,
    }
