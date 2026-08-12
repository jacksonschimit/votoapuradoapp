from config import ANO_ELEICAO, TURNO


def carregar_eleicao(conn) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into public.eleicao (ano, tipo_eleicao, turno, descricao, data_pleito)
            values (%s, 'GERAL', %s, %s, %s)
            on conflict (ano, tipo_eleicao, turno) do update set descricao = excluded.descricao
            returning id
            """,
            (
                ANO_ELEICAO,
                TURNO,
                f"Eleições Gerais {ANO_ELEICAO} - {TURNO}º Turno",
                "2022-10-02",
            ),
        )
        eleicao_id = cur.fetchone()[0]
    conn.commit()
    return eleicao_id
