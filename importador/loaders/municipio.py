import csv

from config import REFERENCIA_DIR

CSV_PATH = REFERENCIA_DIR / "municipio_tse_ibge.csv"


def carregar_municipios(conn) -> int:
    rows = []
    with open(CSV_PATH, encoding="latin-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            rows.append(
                (
                    int(row["CD_MUNICIPIO_IBGE"]),
                    int(row["CD_MUNICIPIO_TSE"]),
                    row["NM_MUNICIPIO_IBGE"],
                    row["SG_UF"],
                )
            )

    with conn.cursor() as cur:
        cur.executemany(
            """
            insert into public.municipio (codigo_ibge, codigo_tse, nome_municipio, sigla_uf)
            values (%s, %s, %s, %s)
            on conflict (codigo_ibge) do update set
                codigo_tse = excluded.codigo_tse,
                nome_municipio = excluded.nome_municipio,
                sigla_uf = excluded.sigla_uf
            """,
            rows,
        )
    conn.commit()
    return len(rows)
