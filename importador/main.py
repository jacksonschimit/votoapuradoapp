import time

from db.connection import get_connection
from loaders.eleicao import carregar_eleicao
from loaders.municipio import carregar_municipios
from loaders.candidatos import carregar_candidatos
from loaders.geografia_votacao import extrair_e_carregar_geografia
from loaders.votacao_secao import carregar_votacao_secao
from loaders.eleitorado_secao import carregar_eleitorado_secao


def refresh_materialized_views(conn):
    with conn.cursor() as cur:
        cur.execute("refresh materialized view public.mv_resultado_candidato_municipio")
        cur.execute("refresh materialized view public.mv_resultado_candidato_local")
        cur.execute("refresh materialized view public.mv_resultado_candidato_uf")
        cur.execute("refresh materialized view public.mv_dominancia_municipio")
        cur.execute("refresh materialized view public.mv_votos_validos_cargo_municipio")
        cur.execute("refresh materialized view public.mv_votos_validos_cargo_uf")
    conn.commit()


def main():
    inicio = time.time()
    conn = get_connection()
    try:
        print("1/7 eleicao...")
        eleicao_id = carregar_eleicao(conn)
        print(f"   eleicao_id = {eleicao_id}")

        print("2/7 municipios (de-para TSE/IBGE)...")
        n = carregar_municipios(conn)
        print(f"   {n} municípios carregados")

        print("3/7 candidatos...")
        n = carregar_candidatos(conn, eleicao_id)
        print(f"   {n} candidatos carregados")

        print("4/7 geografia (zona/local/secao) — 1ª passada no CSV de votação...")
        mapas = extrair_e_carregar_geografia(conn, eleicao_id)
        print(f"   {mapas['contagens']}")

        print("5/7 votacao_secao — 2ª passada no CSV de votação (COPY)...")
        resultado, conn = carregar_votacao_secao(conn, eleicao_id, mapas)
        print(f"   {resultado}")

        print("6/7 eleitorado_secao...")
        resultado = carregar_eleitorado_secao(conn, eleicao_id, mapas)
        print(f"   {resultado}")

        print("7/7 refresh das materialized views...")
        refresh_materialized_views(conn)

        print(f"Concluído em {time.time() - inicio:.1f}s")
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
